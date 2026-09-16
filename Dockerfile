# syntax=docker/dockerfile:1

# ---- Estágio 1: Dependências ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia manifestos de pacote
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ---- Estágio 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV BUILD_TARGET=standalone
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

RUN npm run build -w @cp/web

# ---- Estágio 3: Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

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
