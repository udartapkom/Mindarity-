#!/bin/bash

# Скрипт настройки Jenkins для проекта Mindarity
# Использование: ./setup-jenkins.sh

set -e

echo "🔧 Настройка Jenkins для проекта Mindarity..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

# Создание сети Docker
echo "🌐 Создание Docker сети..."
docker network create mindarity-network 2>/dev/null || echo "Сеть уже существует"

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p traefik/acme
mkdir -p traefik/dynamic
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/alerting
mkdir -p backups

# Установка прав на директории
chmod 755 traefik/acme
chmod 755 traefik/dynamic

echo "✅ Настройка Jenkins завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите Jenkins: docker run -d -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts"
echo "2. Получите пароль администратора: docker exec <container_id> cat /var/jenkins_home/secrets/initialAdminPassword"
echo "3. Установите необходимые плагины:"
echo "   - Docker Pipeline"
echo "   - Docker plugin"
echo "   - Pipeline: GitHub"
echo "   - Slack Notification"
echo "   - Prometheus metrics"
echo "4. Настройте credentials для Docker registry"
echo "5. Создайте pipeline job с Jenkinsfile"
echo ""
echo "🚀 Для запуска мониторинга: docker-compose -f monitoring/docker-compose.monitoring.yml up -d"
echo "🌐 Для запуска production: docker-compose -f docker-compose.traefik.yml up -d"
