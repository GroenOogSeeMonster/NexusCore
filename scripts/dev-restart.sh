#!/bin/bash

# DevForge Development Restart Script
echo "🔄 Restarting DevForge Development Environment"
echo "=============================================="

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Stopping current environment..."
./scripts/dev-stop.sh

echo ""
print_status "Starting fresh environment..."
./scripts/dev-start.sh

print_success "✅ DevForge restarted successfully!"
