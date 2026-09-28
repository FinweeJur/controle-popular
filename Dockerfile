# syntax=docker/dockerfile:1
#
# Dockerfile multi-estagio para producao do portal Controle Popular (Next.js 16).
#
# Papel:
# Constrói e empacota o servidor web standalone para execucao conteinerizada
# no Guara Cloud (PaaS em datacenter SP).
#
# Decisoes de seguranca e arquitetura:
# 1. Base Alpine Linux com `apk update && apk upgrade --no-cache` em todos os
#    estagios para aplicar patches automaticos em pacotes do SO (ex: OpenSSL, tar),
#    eliminando vulnerabilidades conhecidas (CVEs) detectadas pelo scanner Trivy.
# 2. Multi-stage build (deps -> builder -> runner) isola ferramentas de compilacao
#    e dependencias de desenvolvimento do conteiner final de execucao.
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

RUN npm ci

# ---- Estágio 2: Build ----
FROM node:22-alpine AS builder
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV BUILD_TARGET=standalone
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm run build -w @cp/web

# ---- Estágio 3: Runner ----
FROM node:22-alpine AS runner
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# ⚠️ OBRIGATÓRIO: definir DATABASE_URL no dashboard do Guara Cloud.
# Sem ela, getDb() retorna null e as páginas que leem do banco
# (licenciamento, legislacao, etc.) renderizam vazias — HTTP 200 sem dados.
# Exemplo: postgresql://user:pass@host:5432/controle_popular?sslmode=require

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

USER nextjs

EXPOSE 3000

# Executa o servidor standalone gerado pelo Next.js no workspace
CMD ["node", "apps/web/server.js"]
