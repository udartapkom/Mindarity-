#!/bin/bash

# Скрипт для автоматического обновления SSL сертификатов Let's Encrypt
# и их копирования в nginx папку

echo "Starting SSL certificate renewal..."

# Обновляем сертификаты Let's Encrypt
certbot renew --quiet

# Проверяем, были ли обновлены сертификаты
if [ $? -eq 0 ]; then
    echo "Certificates renewed successfully"
    
    # Копируем обновленные сертификаты в nginx папку
    cp /etc/letsencrypt/live/mindarity.ru/fullchain.pem /root/mindarity/nginx/ssl/
    cp /etc/letsencrypt/live/mindarity.ru/privkey.pem /root/mindarity/nginx/ssl/
    
    echo "Certificates copied to nginx/ssl directory"
    
    # Перезапускаем nginx для применения новых сертификатов
    cd /root/mindarity
    docker-compose restart nginx
    
    echo "Nginx restarted with new certificates"
else
    echo "Certificate renewal failed"
    exit 1
fi

echo "SSL renewal process completed" 