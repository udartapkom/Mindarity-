#!/bin/bash

# Development environment startup script
echo "🚀 Starting Mindarity in development mode..."

# Load development environment variables
if [ -f "env.development" ]; then
    export $(cat env.development | grep -v '^#' | xargs)
    echo "✅ Loaded development environment variables"
else
    echo "⚠️  env.development file not found, using defaults"
fi

# Start development services
echo "📦 Starting development services with Docker Compose..."
docker-compose up -d

echo "✅ Development environment started!"
echo ""
echo "🌐 Services available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   Keycloak: http://localhost:8080"
echo "   MinIO Console: http://localhost:9001"
echo "   Elasticsearch: http://localhost:9200"
echo ""
echo "📊 Monitoring:"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001"
