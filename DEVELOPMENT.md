# 🚀 DevForge Development Guide

## Quick Start Commands

### Start Development Environment
```bash
# Option 1: Using npm scripts (recommended)
npm run start

# Option 2: Direct script execution
./scripts/dev-start.sh
```

### Stop Development Environment
```bash
# Option 1: Using npm scripts
npm run stop

# Option 2: Direct script execution
./scripts/dev-stop.sh
```

### Restart Development Environment
```bash
# Option 1: Using npm scripts
npm run restart

# Option 2: Direct script execution
./scripts/dev-restart.sh
```

## Monitoring & Logs

### View Application Logs
```bash
# Web application logs
npm run logs

# Database logs
npm run logs:db

# Redis logs
npm run logs:redis
```

### Check Application Status
```bash
npm run status
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Development URLs

- **Web Application**: http://localhost:3000
- **Database Admin**: http://localhost:8080 (Adminer)
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Development Workflow

1. **Start Environment**: `npm run start`
2. **Make Changes**: Edit code in `apps/web/src/`
3. **Test Changes**: Refresh browser at http://localhost:3000
4. **View Logs**: `npm run logs` if issues occur
5. **Restart if Needed**: `npm run restart`
6. **Stop When Done**: `npm run stop`

## Troubleshooting

### Application Won't Start
```bash
# Check if ports are in use
netstat -tlnp | grep :3000
netstat -tlnp | grep :5432

# Kill any conflicting processes
pkill -f "next dev"
docker-compose down
```

### Database Issues
```bash
# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### Clear All Data
```bash
# Stop everything and remove volumes
npm run stop
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
```

## Production Preparation

When ready for production:

1. **Build Application**: `npm run build`
2. **Run Tests**: `npm run test`
3. **Lint Code**: `npm run lint`
4. **Type Check**: `npm run typecheck`

## Environment Variables

Make sure your `.env` file contains:
```env
DATABASE_URL="postgresql://devforge:devforge_password@localhost:5432/devforge"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Architecture

- **Frontend**: Next.js 14 with React 18
- **Database**: PostgreSQL with PGVector
- **Cache**: Redis
- **Authentication**: NextAuth.js
- **3D Graphics**: Three.js with React Three Fiber
- **State Management**: Zustand + React Query
