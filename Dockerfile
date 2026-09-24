# syntax=docker/dockerfile:1
#
# Segurança da imagem (PLANO-SEGURANCA-IMAGEM-GUARA, 24/09/2026):
# - Base Node 22 Alpine (alinha com OPERACAO §1 — o doc já dizia 22).
# - `apk upgrade` em cada estágio: corta OpenSSL/`libssl3` desatualizado
#   que o Trivy marcou como HIGH no runtime.
# - Estágio runner SEM npm/yarn/corepack: o CMD é só `node server.js`.
#   O npm embutido da base era a fonte de tar/minimatch/pacote/sigstore
#   no scan — bibliotecas que o portal não usa em runtime.
# Rescan pós-deploy: `guara services vulnerabilities -s <service>`.

# ---- Estágio 1: Dependências ----
FROM node:22-alpine AS deps
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

# Copia manifestos de pacote
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ---- Estágio 2: Build ----
FROM node:22-alpine AS builder
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV BUILD_TARGET=standalone
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm run build -w @cp/web

# ---- Estágio 3: Runner (imagem final) ----
FROM node:22-alpine AS runner
# Atualiza pacotes de SO (OpenSSL etc.) e remove o package manager da base:
# o servidor standalone não invoca npm. Some do Trivy tar/pacote/sigstore/
# minimatch/glob que vinham do npm embutido no node:*-alpine.
RUN apk upgrade --no-cache && apk add --no-cache libc6-compat && \
    rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/share/man \
      /usr/share/man \
      /tmp/*
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
