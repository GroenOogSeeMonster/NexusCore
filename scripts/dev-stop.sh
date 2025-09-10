#!/bin/bash

# DevForge Development Stop Script
echo "🛑 Stopping DevForge Development Environment"
echo "============================================"

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

# Stop Next.js development server
if [ -f ".dev-web.pid" ]; then
    WEB_PID=$(cat .dev-web.pid)
    if ps -p $WEB_PID > /dev/null 2>&1; then
        print_status "Stopping Next.js development server (PID: $WEB_PID)..."
        kill $WEB_PID
        sleep 2
        
        # Force kill if still running
        if ps -p $WEB_PID > /dev/null 2>&1; then
            print_warning "Force stopping Next.js server..."
            kill -9 $WEB_PID
        fi
        print_success "Next.js server stopped"
    else
        print_warning "Next.js server was not running"
    fi
    rm -f .dev-web.pid
else
    print_warning "No PID file found, killing any remaining Next.js processes..."
    pkill -f "next dev" > /dev/null 2>&1
fi

# Stop Docker services
print_status "Stopping Docker services..."
docker-compose -f docker-compose.dev.yml down

# Clean up any remaining processes
print_status "Cleaning up remaining processes..."
pkill -f "next dev" > /dev/null 2>&1

print_success "✅ DevForge development environment stopped successfully!"
echo ""
echo "🧹 Cleanup completed:"
echo "   • Next.js development server stopped"
echo "   • Docker services stopped"
echo "   • All processes cleaned up"
echo ""
echo "🚀 To start again: ./scripts/dev-start.sh"
