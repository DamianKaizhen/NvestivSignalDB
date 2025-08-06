#!/bin/bash

# Nvestiv Signal DB - Docker Startup Script

echo "🚀 Starting Nvestiv Signal DB Application with Docker"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if database files exist
if [ ! -f "investor_network_full.db" ]; then
    echo "❌ Database file 'investor_network_full.db' not found."
    echo "   Please ensure the database file is in the current directory."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Build and start the application
echo "📦 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed. Please check the error messages above."
    exit 1
fi

echo "🌟 Starting services..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services. Please check the error messages above."
    exit 1
fi

echo ""
echo "🎉 Nvestiv Signal DB Application is starting up!"
echo "=================================================="
echo ""
echo "📊 Services:"
echo "   • API Server: http://localhost:3010"
echo "   • Frontend:   http://localhost:3013"
echo "   • Health:     http://localhost:3010/health"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs:     docker-compose logs -f"
echo "   • Stop app:      docker-compose down"
echo "   • Restart:       docker-compose restart"
echo "   • Check status:  docker-compose ps"
echo ""
echo "🐳 Container Status:"
docker-compose ps

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for health check
for i in {1..30}; do
    if curl -f http://localhost:3010/health >/dev/null 2>&1; then
        echo "✅ API Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  API Server health check timed out. Check logs with: docker-compose logs"
    fi
    sleep 2
done

echo ""
echo "🚀 Application should be available at:"
echo "   Frontend: http://localhost:3013"
echo "   API:      http://localhost:3010"
echo ""
echo "📖 View real-time logs with: docker-compose logs -f"