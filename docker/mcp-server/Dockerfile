FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/*/package.json ./packages/*/

# Install pnpm and dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the MCP server
RUN corepack enable pnpm && pnpm run build --filter=@nexuscore/mcp-server

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 mcpuser
RUN adduser --system --uid 1001 mcpuser

# Install python for some AI dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy built application
COPY --from=builder --chown=mcpuser:mcpuser /app/apps/mcp-server/dist ./dist
COPY --from=builder --chown=mcpuser:mcpuser /app/node_modules ./node_modules
COPY --from=deps /app/apps/mcp-server/package.json ./

# Create logs directory
RUN mkdir -p logs && chown mcpuser:mcpuser logs

USER mcpuser

EXPOSE 8080

# Start the MCP server
CMD ["node", "dist/index.js"]