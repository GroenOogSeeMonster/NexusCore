#!/bin/bash

# DevForge Development Startup Script
echo "🚀 Starting DevForge Development Environment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the NexusCore root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing services
print_status "Stopping any existing services..."
docker-compose down > /dev/null 2>&1
pkill -f "next dev" > /dev/null 2>&1

# Start database services
print_status "Starting database services (PostgreSQL + Redis)..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for database to be ready
print_status "Waiting for database to be ready..."
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U devforge > /dev/null 2>&1; do
    sleep 2
done
print_success "Database is ready!"

# Check if we're in the web app directory
if [ ! -d "apps/web" ]; then
    print_error "Web app directory not found. Please run from project root."
    exit 1
fi

# Start the web application
print_status "Starting Next.js development server..."
cd apps/web

# Start Next.js in background
nohup npx next dev --port 3000 > ../../logs/web.log 2>&1 &
WEB_PID=$!

# Save PID for later cleanup
echo $WEB_PID > ../../.dev-web.pid

cd ../..

# Wait longer for the server to start and compile
print_status "Waiting for Next.js to compile and start..."
sleep 15

# Check if the server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "✅ DevForge is running successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   • Web App: http://localhost:3000"
    echo "   • Database: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo ""
    echo "📊 Services Status:"
    echo "   • PostgreSQL: $(docker-compose -f docker-compose.dev.yml ps postgres --format 'table {{.Status}}' | tail -1)"
    echo "   • Redis: $(docker-compose -f docker-compose.dev.yml ps redis --format 'table {{.Status}}' | tail -1)"
    echo "   • Next.js: Running (PID: $WEB_PID)"
    echo ""
    echo "📝 Logs:"
    echo "   • Web App: tail -f logs/web.log"
    echo "   • Database: docker-compose -f docker-compose.dev.yml logs -f postgres"
    echo "   • Redis: docker-compose -f docker-compose.dev.yml logs -f redis"
    echo ""
    echo "🛑 To stop: ./scripts/dev-stop.sh"
    echo "🔄 To restart: ./scripts/dev-restart.sh"
else
    print_error "Failed to start the web application. Check logs/web.log for details."
    exit 1
fi
