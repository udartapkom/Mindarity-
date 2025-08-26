#!/bin/bash

# Скрипт для настройки SSL сертификатов
# Использование: ./setup-ssl.sh [domain]
# Пример: ./setup-ssl.sh mindarity.ru

DOMAIN=${1:-"mindarity.ru"}
SSL_DIR="./nginx/ssl"

echo "🔒 Настройка SSL сертификатов для $DOMAIN"
echo "=========================================="

# Создаем директорию для SSL сертификатов
mkdir -p "$SSL_DIR"

echo "📁 Создана директория: $SSL_DIR"

# Проверяем существование сертификатов
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo "✅ SSL сертификаты уже существуют"
    echo "📅 Информация о сертификате:"
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before:|Not After:)"
else
    echo "⚠️  SSL сертификаты не найдены"
    echo ""
    echo "🔧 Варианты получения SSL сертификатов:"
    echo ""
    echo "1️⃣  Let's Encrypt (рекомендуется для продакшена):"
    echo "   certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
    echo "   cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem"
    echo "   cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem"
    echo ""
    echo "2️⃣  Самоподписанный сертификат (для разработки):"
    echo "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    echo "     -keyout $SSL_DIR/key.pem \\"
    echo "     -out $SSL_DIR/cert.pem \\"
    echo "     -subj \"/C=RU/ST=Moscow/L=Moscow/O=Mindarity/CN=$DOMAIN\""
    echo ""
    echo "3️⃣  Существующий сертификат:"
    echo "   Скопируйте ваши cert.pem и key.pem в $SSL_DIR/"
    echo ""
    
    read -p "🤔 Создать самоподписанный сертификат для разработки? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Создание самоподписанного сертификата..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=Mindarity/CN=$DOMAIN"
        
        if [ $? -eq 0 ]; then
            echo "✅ Самоподписанный сертификат создан"
            echo "📅 Информация о сертификате:"
            openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before:|Not After:)"
        else
            echo "❌ Ошибка при создании сертификата"
            exit 1
        fi
    else
        echo "ℹ️  Пропускаем создание сертификата"
        echo "📝 Не забудьте добавить сертификаты в $SSL_DIR/ перед запуском"
    fi
fi

echo ""
echo "🔐 Настройка прав доступа..."
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo "✅ Права доступа настроены"
echo ""
echo "📋 Следующие шаги:"
echo "1. Убедитесь, что DNS записи для $DOMAIN указывают на ваш сервер"
echo "2. Запустите docker-compose: docker-compose up -d"
echo "3. Проверьте эндпоинты: ./scripts/check-endpoints.sh https://$DOMAIN"
echo ""
echo "🔧 Для автоматического обновления Let's Encrypt сертификатов:"
echo "   Добавьте в crontab: 0 12 * * * certbot renew --quiet" 