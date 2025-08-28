#!/bin/bash

echo "🚀 Запуск Mindarity в режиме разработки..."

# Остановить существующие контейнеры
docker compose down

# Запустить сервисы с dev-оверрайдом (без сборки образов)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

echo "✅ Mindarity запущен в режиме разработки!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
