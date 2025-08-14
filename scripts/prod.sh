#!/bin/bash

# Production environment startup script
echo "🚀 Starting Mindarity in production mode..."

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    echo "❌ SSL certificates not found!"
    echo "Please place your SSL certificates in nginx/ssl/ directory:"
    echo "   - fullchain.pem"
    echo "   - privkey.pem"
    exit 1
fi

# Load production environment variables
if [ -f "env.production" ]; then
    export $(cat env.production | grep -v '^#' | xargs)
    echo "✅ Loaded production environment variables"
else
    echo "⚠️  env.production file not found, using defaults"
fi

# Start production services
echo "📦 Starting production services with Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Production environment started!"
echo ""
echo "🌐 Services available at:"
echo "   Frontend: https://mindarity.ru"
echo "   Backend API: https://mindarity.ru/api"
echo "   Keycloak: https://mindarity.ru/auth"
echo "   MinIO Console: https://mindarity.ru/minio"
echo ""
echo "📊 Monitoring (internal access only):"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001"
