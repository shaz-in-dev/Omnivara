# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/config/package.json ./packages/config/
COPY services/api/package.json ./services/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/contracts ./packages/contracts
COPY packages/config ./packages/config
COPY services/api ./services/api

# Generate Prisma client
RUN pnpm --filter @omnivara/api exec prisma generate

# Build
RUN pnpm --filter @omnivara/api build

# ─── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built artifacts
COPY --from=builder --chown=nestjs:nodejs /app/services/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/services/api/package.json ./

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
