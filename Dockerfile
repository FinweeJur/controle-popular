# syntax=docker/dockerfile:1
#
# Dockerfile multi-estagio de alta performance para producao do portal Controle Popular (Next.js 16).
#
# Papel:
# Constrói e empacota o servidor web standalone para execucao conteinerizada
# no Guara Cloud (PaaS em datacenter SP).
#
# Decisoes de seguranca e arquitetura:
# 1. Base Alpine Linux com `apk update && apk upgrade --no-cache` em todos os
#    estagios para aplicar patches automaticos em pacotes do SO (ex: OpenSSL, tar),
#    eliminando vulnerabilidades conhecidas (CVEs) detectadas pelo scanner Trivy.
# 2. Multi-stage build (deps -> builder -> runner) preserva integridade dos
#    symlinks de workspace do monorepo npm (@cp/web) e isola o runner final.
# 3. Execucao sob usuario nao-privilegiado (UID 1001 nextjs:nodejs), prevenindo
#    ataques de escalonamento de privilegios.
# 4. Build standalone do Next.js copia estritamente os artefatos compilados
#    rastreados pelo `@vercel/nft`, reduzindo a superficie de ataque e o tamanho da imagem.

# ---- Estágio 1: Dependências ----
FROM node:22-alpine AS deps
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

# Copia manifestos de pacote
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# O `postinstall` da raiz roda `node scripts/configurar-hooks.mjs` (liga os
# hooks de Git no clone). No estagio de deps esse script precisa EXISTIR, senao
# o `npm ci` morre com MODULE_NOT_FOUND antes de instalar qualquer coisa
# (medido 09/10/2026: o deploy do Azure falhou 1 vez por isso). Sem `.git` no
# container, o proprio script sai em silencio.
COPY scripts/configurar-hooks.mjs ./scripts/configurar-hooks.mjs

RUN npm ci --no-audit --no-fund && npm cache clean --force

# ---- Estágio 2: Build ----
FROM node:22-alpine AS builder
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

# ⚠️ OBRIGATÓRIO — as variaveis marcadas como "Build" no Guara chegam como
# Docker ARG (doc: guaracloud.com/docs/services/environment-variables). Sem o
# ARG declarado aqui, elas NAO existem durante `npm run build` — e as paginas
# pre-renderizadas que leem o Postgres saem vazias (HTTP 200 sem dado), sem
# erro nenhum. Medido em 30/09/2026: /ambiental/licenciamento no ar mostrava
# "Nenhuma licenca coletada ainda" com 8.612 linhas na tabela do Guara.
# O estagio builder nao entra na imagem final: o valor nao vaza para o runner.
ARG DATABASE_URL
ARG DATABASE_URL_NEON
ARG DATABASE_URL_HOMEPC
ARG DATABASE_URL_RESERVA
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_URL_NEON=$DATABASE_URL_NEON
ENV DATABASE_URL_HOMEPC=$DATABASE_URL_HOMEPC
ENV DATABASE_URL_RESERVA=$DATABASE_URL_RESERVA

# Ponte do companheiro (Seu Nono bichinho). Variavel NEXT_PUBLIC_* e embutida
# no bundle do cliente durante o `npm run build`; sem o ARG declarado aqui no
# estagio builder, o valor do Guara NUNCA chega ao build (armadilha §6 do
# AGENTS.md). Ver app/components/PonteCompanheiro.tsx.
ARG NEXT_PUBLIC_COMPANHEIRO_PONTE
ARG NEXT_PUBLIC_COMPANHEIRO_PONTE_URL
ENV NEXT_PUBLIC_COMPANHEIRO_PONTE=$NEXT_PUBLIC_COMPANHEIRO_PONTE
ENV NEXT_PUBLIC_COMPANHEIRO_PONTE_URL=$NEXT_PUBLIC_COMPANHEIRO_PONTE_URL

ENV NODE_ENV=production
ENV BUILD_TARGET=standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2560"

# Copia código-fonte filtrado pelo .dockerignore
COPY . .
# Copia node_modules preservando os symlinks do monorepo npm workspaces
COPY --from=deps /app/node_modules ./node_modules

# Executa o build standalone e remove caches intermediarios na mesma camada
RUN npm run build -w @cp/web && \
    rm -rf apps/web/.next/cache && \
    rm -rf /root/.npm /tmp/*

# ---- Estágio 3: Runner ----
FROM node:22-alpine AS runner
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
# TETO DE HEAP DO V8: 192 MB E DO GUARA, NAO DO AZURE (medido 07/10/2026).
# Guara Starter: 64 MB de request / 256 MB de burst (docs.guaracloud). O Next
# standalone tenta crescer ate ~500 MB e o kernel mata o pod — foi o
# crash_loop de 03/10/2026; capar o heap ABAIXO do teto faz o GC recolher a
# tempo em vez de o container ser morto pelo OOM.
# Azure Container Apps (1 Gi): este mesmo 192 ESTRANGULA. Next 16 + New Relic
# passam de 192 MB em ~15 min e o Node aborta ("Reached heap limit") — 13
# reinicios em 3h30 e o 503 do Envoy reportado pelo dono. La o teto vive no
# env de runtime NODE_OPTIONS=--max-old-space-size=768, que sobrescreve este
# ENV sem rebuild e e garantido pelo azure-mirror.yml. Se subir o Guara para
# Pro (512 MB), troque aqui para ~448.
ENV NODE_OPTIONS="--max-old-space-size=192"

# APM New Relic (oferta do GitHub Student Pack). O agente so carrega quando
# NEW_RELIC_LICENSE_KEY existe no runtime — variavel do painel do Guara, SEM a
# flag `-b` (agente e de runtime, nao de build). Sem a chave, o portal sobe
# normal e sem APM: e o desligador, sem redeploy.
# ⚠️ MEMORIA: o agente soma memoria ao container (teto de 256 MB do Starter,
# heap capado em 192). Medir `guara logs` apos ligar; se houver OOM/crash_loop,
# basta remover a chave no painel — desliga na hora. Ver newrelic.cjs.
ENV NEW_RELIC_CONFIG_FILENAME=/app/apps/web/newrelic.cjs

# ⚠️ OBRIGATÓRIO: definir DATABASE_URL no dashboard do Guara Cloud — em runtime
# E marcada como "Build" (a flag --build do `guara env set`). Em runtime,
# getDb() retorna null sem ela e as rotas dinâmicas que leem o banco respondem
# vazio; no BUILD, o ARG declarado no estágio builder é quem entrega a mesma
# variável ao `npm run build` (o prebuild regenera cidades e índice de busca a
# partir do Postgres). Exemplo:
# postgresql://user:pass@host:5432/controle_popular?sslmode=require

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos
COPY --from=builder /app/apps/web/public ./apps/web/public

# Prepara diretório de cache
RUN mkdir -p /app/apps/web/.next && \
    chown -R nextjs:nodejs /app

# Copia build standalone e assets estáticos
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Config do agente APM. NAO entra no standalone pelo `@vercel/nft` (e lida em
# runtime pelo pacote `newrelic`, nao importada pelo codigo), entao precisa
# desta copia explicita. Apontada por NEW_RELIC_CONFIG_FILENAME acima.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/newrelic.cjs ./apps/web/newrelic.cjs

USER nextjs

EXPOSE 3000

# Executa o servidor standalone gerado pelo Next.js no workspace
CMD ["node", "apps/web/server.js"]
