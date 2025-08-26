#!/bin/bash

echo "🚀 Запуск Mindarity в режиме разработки..."

# Остановить существующие контейнеры
docker-compose down

# Запустить сервисы
docker-compose up --build

echo "✅ Mindarity запущен в режиме разработки!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
