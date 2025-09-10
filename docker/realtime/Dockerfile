FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/realtime/package.json ./apps/realtime/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm run build --filter=@nexuscore/realtime

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 realtimeuser
RUN adduser --system --uid 1001 realtimeuser

COPY --from=builder --chown=realtimeuser:realtimeuser /app/apps/realtime/dist ./dist
COPY --from=builder --chown=realtimeuser:realtimeuser /app/node_modules ./node_modules
COPY --from=deps /app/apps/realtime/package.json ./

USER realtimeuser

EXPOSE 8081

CMD ["node", "dist/index.js"]