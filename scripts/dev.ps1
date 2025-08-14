# Development environment startup script for Windows
Write-Host "🚀 Starting Mindarity in development mode..." -ForegroundColor Green

# Load development environment variables
if (Test-Path "env.development") {
    Get-Content "env.development" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Loaded development environment variables" -ForegroundColor Green
} else {
    Write-Host "⚠️  env.development file not found, using defaults" -ForegroundColor Yellow
}

# Start development services
Write-Host "📦 Starting development services with Docker Compose..." -ForegroundColor Green
docker-compose up -d

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   Keycloak: http://localhost:8080" -ForegroundColor White
Write-Host "   MinIO Console: http://localhost:9001" -ForegroundColor White
Write-Host "   Elasticsearch: http://localhost:9200" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana: http://localhost:3001" -ForegroundColor White
