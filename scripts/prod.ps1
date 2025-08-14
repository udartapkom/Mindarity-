# Production environment startup script for Windows
Write-Host "🚀 Starting Mindarity in production mode..." -ForegroundColor Green

# Check if SSL certificates exist
if (-not (Test-Path "nginx/ssl/fullchain.pem") -or -not (Test-Path "nginx/ssl/privkey.pem")) {
    Write-Host "❌ SSL certificates not found!" -ForegroundColor Red
    Write-Host "Please place your SSL certificates in nginx/ssl/ directory:" -ForegroundColor Yellow
    Write-Host "   - fullchain.pem" -ForegroundColor White
    Write-Host "   - privkey.pem" -ForegroundColor White
    exit 1
}

# Load production environment variables
if (Test-Path "env.production") {
    Get-Content "env.production" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Loaded production environment variables" -ForegroundColor Green
} else {
    Write-Host "⚠️  env.production file not found, using defaults" -ForegroundColor Yellow
}

# Start production services
Write-Host "📦 Starting production services with Docker Compose..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d

Write-Host "✅ Production environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services available at:" -ForegroundColor Cyan
Write-Host "   Frontend: https://mindarity.ru" -ForegroundColor White
Write-Host "   Backend API: https://mindarity.ru/api" -ForegroundColor White
Write-Host "   Keycloak: https://mindarity.ru/auth" -ForegroundColor White
Write-Host "   MinIO Console: https://mindarity.ru/minio" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring (internal access only):" -ForegroundColor Cyan
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana: http://localhost:3001" -ForegroundColor White
