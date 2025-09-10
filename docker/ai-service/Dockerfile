FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/ai-service/package.json ./apps/ai-service/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm run build --filter=@nexuscore/ai-service

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN apk add --no-cache python3 py3-pip
RUN addgroup --system --gid 1001 aiuser
RUN adduser --system --uid 1001 aiuser

# Create models directory for AI model caching
RUN mkdir -p models && chown aiuser:aiuser models

COPY --from=builder --chown=aiuser:aiuser /app/apps/ai-service/dist ./dist
COPY --from=builder --chown=aiuser:aiuser /app/node_modules ./node_modules
COPY --from=deps /app/apps/ai-service/package.json ./

USER aiuser

EXPOSE 8082

CMD ["node", "dist/index.js"]