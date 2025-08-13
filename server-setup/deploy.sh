#!/bin/bash

# 🚀 Скрипт развертывания Mindarity на сервере
# Автор: Mindarity Team
# Версия: 1.0

set -e

# Конфигурация
APP_DIR="/opt/mindarity"
BACKUP_DIR="/opt/mindarity/backups"
LOG_DIR="/opt/mindarity/logs"

echo "🚀 Начинаем развертывание Mindarity..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Запустите install-docker.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Запустите install-docker.sh"
    exit 1
fi

# Переход в директорию приложения
cd $APP_DIR

# Проверка наличия docker-compose.yml
if [[ ! -f "docker-compose.yml" ]]; then
    echo "❌ Файл docker-compose.yml не найден в $APP_DIR"
    echo "💡 Убедитесь, что репозиторий склонирован"
    exit 1
fi

# Создание директорий
echo "📁 Создание необходимых директорий..."
mkdir -p $BACKUP_DIR $LOG_DIR

# Создание .env файла если не существует
if [[ ! -f ".env" ]]; then
    echo "⚙️ Создание .env файла..."
    cat > .env << EOF
# Mindarity Production Environment
# База данных
POSTGRES_DB=mindarity
POSTGRES_USER=mindarity_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
KEYCLOAK_DB_USERNAME=keycloak_user
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 32)

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)

# Backend
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 64)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Elasticsearch
ELASTICSEARCH_PASSWORD=$(openssl rand -base64 32)
EOF
    echo "✅ .env файл создан с случайными паролями"
    echo "⚠️  Сохраните пароли в безопасном месте!"
fi

# Создание скрипта бэкапа
echo "💾 Создание скрипта резервного копирования..."
cat > $APP_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
# Скрипт резервного копирования Mindarity

BACKUP_DIR="/opt/mindarity/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Создание резервной копии..."

# Бэкап базы данных
echo "📊 Бэкап базы данных..."
docker exec mindarity-postgres pg_dump -U mindarity_user mindarity > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап MinIO данных
echo "📁 Бэкап файлов MinIO..."
docker exec mindarity-minio mc mirror /data $BACKUP_DIR/minio_backup_$DATE

# Сжатие бэкапов
echo "🗜️ Сжатие бэкапов..."
cd $BACKUP_DIR
tar -czf mindarity_backup_$DATE.tar.gz db_backup_$DATE.sql minio_backup_$DATE/

# Удаление временных файлов
rm -rf db_backup_$DATE.sql minio_backup_$DATE/

# Удаление старых бэкапов (оставляем последние 7)
find $BACKUP_DIR -name "mindarity_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Резервная копия создана: mindarity_backup_$DATE.tar.gz"
EOF

chmod +x $APP_DIR/scripts/backup.sh

# Создание скрипта мониторинга
echo "📊 Создание скрипта мониторинга..."
cat > $APP_DIR/scripts/monitor.sh << 'EOF'
#!/bin/bash
# Скрипт мониторинга Mindarity

echo "📊 Статус сервисов Mindarity"
echo "================================"

# Статус Docker контейнеров
echo "🐳 Docker контейнеры:"
docker-compose ps

echo ""
echo "💾 Использование диска:"
df -h

echo ""
echo "🧠 Использование памяти:"
free -h

echo ""
echo "🔥 Активные порты:"
netstat -tlnp | grep -E ":(80|443|3000|8080|9000|9200|6379|5432)"

echo ""
echo "📈 Логи последних ошибок:"
docker-compose logs --tail=10 | grep -i error || echo "Ошибок не найдено"
EOF

chmod +x $APP_DIR/scripts/monitor.sh

# Остановка существующих сервисов
echo "🛑 Остановка существующих сервисов..."
docker-compose down 2>/dev/null || true

# Очистка старых образов
echo "🧹 Очистка старых образов..."
docker system prune -f

# Сборка образов
echo "🔨 Сборка образов..."
docker-compose build --no-cache

# Запуск сервисов
echo "🚀 Запуск сервисов..."
docker-compose up -d

# Ожидание запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
echo "✅ Проверка статуса сервисов..."
docker-compose ps

# Проверка логов на ошибки
echo "🔍 Проверка логов на ошибки..."
ERRORS=$(docker-compose logs | grep -i error | head -5)
if [[ -n "$ERRORS" ]]; then
    echo "⚠️  Найдены ошибки в логах:"
    echo "$ERRORS"
else
    echo "✅ Ошибок в логах не найдено"
fi

# Настройка cron для бэкапов
echo "⏰ Настройка автоматических бэкапов..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh >> $LOG_DIR/backup.log 2>&1") | crontab -

# Создание скрипта обновления
echo "🔄 Создание скрипта обновления..."
cat > $APP_DIR/scripts/update.sh << 'EOF'
#!/bin/bash
# Скрипт обновления Mindarity

APP_DIR="/opt/mindarity"
LOG_DIR="/opt/mindarity/logs"

echo "🔄 Начинаем обновление Mindarity..."

cd $APP_DIR

# Создание бэкапа перед обновлением
echo "💾 Создание бэкапа..."
./scripts/backup.sh

# Остановка сервисов
echo "🛑 Остановка сервисов..."
docker-compose down

# Обновление кода
echo "📥 Обновление кода..."
git pull origin main

# Пересборка и запуск
echo "🔨 Пересборка образов..."
docker-compose build --no-cache

echo "🚀 Запуск сервисов..."
docker-compose up -d

echo "✅ Обновление завершено!"
EOF

chmod +x $APP_DIR/scripts/update.sh

# Проверка доступности сервисов
echo "🔍 Проверка доступности сервисов..."
sleep 10

# Проверка nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    echo "✅ Nginx доступен"
else
    echo "⚠️  Nginx недоступен"
fi

# Проверка backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "✅ Backend доступен"
else
    echo "⚠️  Backend недоступен"
fi

echo ""
echo "🎉 Развертывание завершено успешно!"
echo ""
echo "📋 Информация о развертывании:"
echo "- Приложение: $APP_DIR"
echo "- Логи: $LOG_DIR"
echo "- Бэкапы: $BACKUP_DIR"
echo "- Скрипты: $APP_DIR/scripts/"
echo ""
echo "🔧 Полезные команды:"
echo "- Статус: docker-compose ps"
echo "- Логи: docker-compose logs -f"
echo "- Мониторинг: $APP_DIR/scripts/monitor.sh"
echo "- Бэкап: $APP_DIR/scripts/backup.sh"
echo "- Обновление: $APP_DIR/scripts/update.sh"
echo ""
echo "🌐 Доступ к приложению:"
echo "- Frontend: http://localhost (или ваш домен)"
echo "- Backend API: http://localhost:3000"
echo "- Keycloak: http://localhost:8080"
echo "- MinIO Console: http://localhost:9001"
echo ""
echo "⚠️  Важно:"
echo "- Проверьте .env файл и сохраните пароли"
echo "- Настройте SSL сертификаты если нужно"
echo "- Проверьте firewall настройки"
echo "- Настройте мониторинг и алерты"
