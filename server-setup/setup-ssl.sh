#!/bin/bash

# 🔐 Скрипт настройки SSL сертификатов для Mindarity
# Автор: Mindarity Team
# Версия: 1.0

set -e

# Конфигурация
DOMAIN="mindarity.ru"
WWW_DOMAIN="www.mindarity.ru"
EMAIL="admin@mindarity.ru"
SSL_DIR="/opt/mindarity/ssl"
LETSENCRYPT_DIR="/etc/letsencrypt"

echo "🔐 Начинаем настройку SSL сертификатов для $DOMAIN..."

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен быть запущен от имени root"
   exit 1
fi

# Проверка наличия домена
if [[ -z "$DOMAIN" ]]; then
    echo "❌ Не указан домен. Установите переменную DOMAIN"
    exit 1
fi

# Установка Certbot
echo "📦 Установка Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Создание директорий для SSL
echo "📁 Создание директорий для SSL..."
mkdir -p $SSL_DIR
chmod 700 $SSL_DIR

# Проверка доступности портов
echo "🔍 Проверка доступности портов..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Порт 80 занят. Остановите nginx или другие сервисы"
    echo "💡 Команды для остановки:"
    echo "   systemctl stop nginx"
    echo "   docker-compose down"
    read -p "Нажмите Enter после остановки сервисов..."
fi

# Получение SSL сертификата
echo "🎫 Получение SSL сертификата..."
certbot certonly \
    --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d $WWW_DOMAIN

# Копирование сертификатов
echo "📋 Копирование сертификатов..."
cp $LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem $SSL_DIR/
cp $LETSENCRYPT_DIR/live/$DOMAIN/privkey.pem $SSL_DIR/

# Настройка прав доступа
chmod 600 $SSL_DIR/*
chown -R $SUDO_USER:$SUDO_USER $SSL_DIR

# Настройка автообновления сертификатов
echo "🔄 Настройка автообновления сертификатов..."
cat > /etc/cron.d/mindarity-ssl-renew << EOF
# Обновление SSL сертификатов Mindarity
0 12 * * * root /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

# Создание скрипта для обновления сертификатов
cat > $SSL_DIR/renew-certs.sh << 'EOF'
#!/bin/bash
# Скрипт обновления SSL сертификатов

DOMAIN="mindarity.ru"
SSL_DIR="/opt/mindarity/ssl"
LETSENCRYPT_DIR="/etc/letsencrypt"

echo "🔄 Обновление SSL сертификатов..."

# Обновление сертификатов
certbot renew --quiet

# Копирование новых сертификатов
cp $LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem $SSL_DIR/
cp $LETSENCRYPT_DIR/live/$DOMAIN/privkey.pem $SSL_DIR/

# Настройка прав доступа
chmod 600 $SSL_DIR/*
chown -R $SUDO_USER:$SUDO_USER $SSL_DIR

# Перезагрузка nginx (если запущен)
if docker ps | grep -q mindarity-nginx; then
    echo "🔄 Перезагрузка nginx..."
    docker exec mindarity-nginx nginx -s reload
fi

echo "✅ SSL сертификаты обновлены"
EOF

chmod +x $SSL_DIR/renew-certs.sh

# Проверка сертификатов
echo "✅ Проверка сертификатов..."
openssl x509 -in $SSL_DIR/fullchain.pem -text -noout | grep -E "Subject:|Not Before|Not After"

# Создание тестового nginx конфига для проверки
echo "🧪 Создание тестового nginx конфига..."
cat > /tmp/nginx-test.conf << EOF
server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    
    location / {
        return 200 "SSL работает!";
        add_header Content-Type text/plain;
    }
}
EOF

echo "🎉 Настройка SSL завершена успешно!"
echo ""
echo "📋 Информация о сертификатах:"
echo "- Домен: $DOMAIN"
echo "- WWW домен: $WWW_DOMAIN"
echo "- Сертификаты: $SSL_DIR/"
echo "- Автообновление: настроено (ежедневно в 12:00)"
echo ""
echo "🔍 Проверка сертификатов:"
echo "openssl x509 -in $SSL_DIR/fullchain.pem -text -noout"
echo ""
echo "🔄 Ручное обновление:"
echo "$SSL_DIR/renew-certs.sh"
echo ""
echo "📚 Документация Certbot:"
echo "https://certbot.eff.org/docs/"
echo ""
echo "⚠️  Важно:"
echo "- Сертификаты автоматически обновляются"
echo "- Храните приватные ключи в безопасности"
echo "- Проверяйте срок действия сертификатов"
