#!/bin/bash

# DevForge Setup Script
echo "🚀 Setting up DevForge - Platform Engineering Command Center"
echo "============================================================"

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo "⚙️  Installing pnpm..."
        npm install -g pnpm
    fi
    
    echo "✅ All dependencies are installed!"
}

# Setup environment variables
setup_env() {
    echo "📝 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📄 Created .env file from .env.example"
        echo "⚠️  Please update the .env file with your actual values, especially:"
        echo "   - OPENAI_API_KEY (required for AI features)"
        echo "   - NEXTAUTH_SECRET (run: openssl rand -base64 32)"
        echo "   - OAuth provider credentials (optional)"
        echo ""
    fi
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed!"
}

# Setup database
setup_database() {
    echo "🗃️  Setting up database..."
    
    # Start database services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    until docker-compose exec -T postgres pg_isready -U devforge; do
        sleep 2
    done
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    pnpm run db:generate
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    pnpm run db:push
    
    echo "✅ Database setup complete!"
}

# Build applications
build_apps() {
    echo "🔨 Building applications..."
    pnpm run build
    echo "✅ Applications built!"
}

# Generate sample data (optional)
seed_data() {
    read -p "🌱 Would you like to seed the database with sample data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database with sample data..."
        pnpm run db:seed
        echo "✅ Sample data added!"
    fi
}

# Main setup process
main() {
    echo "Starting DevForge setup..."
    echo ""
    
    check_dependencies
    echo ""
    
    setup_env
    echo ""
    
    install_deps
    echo ""
    
    setup_database
    echo ""
    
    build_apps
    echo ""
    
    seed_data
    echo ""
    
    echo "🎉 DevForge setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with the required API keys"
    echo "2. Run 'pnpm run dev' to start the development server"
    echo "3. Open http://localhost:3000 to access DevForge"
    echo ""
    echo "For more information, see the README.md file."
    echo ""
    echo "🚀 Welcome to the future of platform engineering!"
}

# Run the setup
main