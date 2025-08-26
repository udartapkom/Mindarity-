#!/bin/bash

echo "🚀 Запуск Mindarity в продакшн режиме..."

# Остановить существующие контейнеры
docker-compose down

# Запустить сервисы в фоновом режиме
docker-compose up --build -d

echo "✅ Mindarity запущен в продакшн режиме!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "📊 Статус: docker-compose ps"
