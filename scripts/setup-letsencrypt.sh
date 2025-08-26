#!/bin/bash

# Скрипт для настройки Let's Encrypt SSL сертификатов
# Требует: certbot, nginx

set -e

DOMAIN="mindarity.ru"
EMAIL="admin@mindarity.ru"

echo "🔧 Настройка Let's Encrypt SSL сертификатов для $DOMAIN"

# Проверяем, что certbot установлен
if ! command -v certbot &> /dev/null; then
    echo "❌ Certbot не установлен. Устанавливаем..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Останавливаем nginx для получения сертификатов
echo "🛑 Останавливаем nginx..."
sudo systemctl stop nginx || true

# Создаем временную конфигурацию nginx для получения сертификатов
echo "📝 Создаем временную конфигурацию nginx..."
sudo tee /etc/nginx/sites-available/mindarity-temp << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        return 200 "Temporary page for SSL certificate generation";
        add_header Content-Type text/plain;
    }
}
EOF

# Активируем временную конфигурацию
sudo ln -sf /etc/nginx/sites-available/mindarity-temp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Запускаем nginx
echo "🚀 Запускаем nginx..."
sudo systemctl start nginx

# Получаем сертификаты
echo "🔐 Получаем SSL сертификаты..."
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Останавливаем nginx
echo "🛑 Останавливаем nginx..."
sudo systemctl stop nginx

# Копируем сертификаты в проект
echo "📋 Копируем сертификаты в проект..."
sudo mkdir -p /opt/mindarity/nginx/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/mindarity/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/mindarity/nginx/ssl/key.pem
sudo chown -R 1000:1000 /opt/mindarity/nginx/ssl/
sudo chmod 644 /opt/mindarity/nginx/ssl/cert.pem
sudo chmod 600 /opt/mindarity/nginx/ssl/key.pem

# Удаляем временную конфигурацию
echo "🧹 Удаляем временную конфигурацию..."
sudo rm -f /etc/nginx/sites-enabled/mindarity-temp

# Настраиваем автообновление сертификатов
echo "🔄 Настраиваем автообновление сертификатов..."
sudo tee /etc/cron.d/certbot-renew << EOF
0 12 * * * root /usr/bin/certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/mindarity/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/mindarity/nginx/ssl/key.pem && chown -R 1000:1000 /opt/mindarity/nginx/ssl/ && chmod 644 /opt/mindarity/nginx/ssl/cert.pem && chmod 600 /opt/mindarity/nginx/ssl/key.pem && cd /opt/mindarity && docker compose restart nginx"
EOF

echo "✅ Let's Encrypt SSL сертификаты настроены!"
echo "🔗 Теперь можно перезапустить nginx контейнер:"
echo "   cd /opt/mindarity && docker compose restart nginx" 