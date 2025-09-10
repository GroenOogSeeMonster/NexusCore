#!/bin/bash

# Simple DevForge Development Startup Script
echo "🚀 Starting DevForge Development Environment (Simple Mode)"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
if [ ! -f "package.json" ] || [ ! -f "docker-compose.dev.yml" ]; then
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
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
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

# Start the web application in foreground for debugging
print_status "Starting Next.js development server..."
cd apps/web

print_success "✅ DevForge development environment is ready!"
echo ""
echo "🌐 Application URLs:"
echo "   • Web App: http://localhost:3000 (will start when you run the command below)"
echo "   • Database: localhost:5432"
echo "   • Redis: localhost:6379"
echo "   • Database Admin: http://localhost:8080"
echo ""
echo "📊 Services Status:"
echo "   • PostgreSQL: $(docker-compose -f ../../docker-compose.dev.yml ps postgres --format 'table {{.Status}}' | tail -1)"
echo "   • Redis: $(docker-compose -f ../../docker-compose.dev.yml ps redis --format 'table {{.Status}}' | tail -1)"
echo ""
echo "🚀 To start the web application, run:"
echo "   npx next dev --port 3000"
echo ""
echo "🛑 To stop everything: ./scripts/dev-stop.sh"
echo ""

# Keep the script running and show the command to start Next.js
print_status "Press Ctrl+C to exit this script, then run 'npx next dev --port 3000' to start the web app"
echo ""
echo "Waiting for you to start the web application..."
echo ""

# Wait for user input
read -p "Press Enter when you're ready to start Next.js, or Ctrl+C to exit..."

# Start Next.js
print_status "Starting Next.js development server..."
npx next dev --port 3000
