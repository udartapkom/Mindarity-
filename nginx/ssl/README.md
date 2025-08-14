# SSL Сертификаты для Mindarity

## Требования

Для работы в продакшн режиме с доменом `mindarity.ru` необходимо разместить SSL сертификаты в этой директории:

- `fullchain.pem` - полная цепочка сертификатов
- `privkey.pem` - приватный ключ

## Получение SSL сертификатов

### Вариант 1: Let's Encrypt (бесплатно)

```bash
# Установка Certbot
sudo apt update
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d mindarity.ru -d www.mindarity.ru

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/mindarity.ru/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/mindarity.ru/privkey.pem ./nginx/ssl/

# Установка правильных прав доступа
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem
```

### Вариант 2: Коммерческий сертификат

1. Приобретите SSL сертификат у провайдера (например, Comodo, DigiCert, GlobalSign)
2. Скачайте сертификаты
3. Переименуйте файлы:
   - Сертификат → `fullchain.pem`
   - Приватный ключ → `privkey.pem`
4. Поместите файлы в директорию `nginx/ssl/`

### Вариант 3: Самоподписанный сертификат (только для тестирования)

```bash
# Создание самоподписанного сертификата
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Mindarity/CN=mindarity.ru"
```

## Автоматическое обновление (Let's Encrypt)

Создайте скрипт для автоматического обновления сертификатов:

```bash
#!/bin/bash
# /etc/cron.daily/renew-ssl.sh

# Обновление сертификатов
certbot renew --quiet

# Копирование новых сертификатов
cp /etc/letsencrypt/live/mindarity.ru/fullchain.pem /path/to/mindarity/nginx/ssl/
cp /etc/letsencrypt/live/mindarity.ru/privkey.pem /path/to/mindarity/nginx/ssl/

# Перезапуск nginx
docker-compose -f /path/to/mindarity/docker-compose.prod.yml restart nginx
```

Сделайте скрипт исполняемым:
```bash
chmod +x /etc/cron.daily/renew-ssl.sh
```

## Проверка сертификатов

```bash
# Проверка структуры сертификата
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Проверка приватного ключа
openssl rsa -in nginx/ssl/privkey.pem -check

# Проверка соответствия сертификата и ключа
openssl x509 -noout -modulus -in nginx/ssl/fullchain.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/privkey.pem | openssl md5
# Оба результата должны совпадать
```

## Безопасность

- Приватный ключ (`privkey.pem`) должен иметь права доступа 600
- Сертификат (`fullchain.pem`) должен иметь права доступа 644
- Не коммитьте приватные ключи в Git
- Регулярно обновляйте сертификаты

## Troubleshooting

### Ошибка "SSL certificate not found"
Убедитесь, что файлы находятся в правильной директории:
```bash
ls -la nginx/ssl/
```

### Ошибка "SSL certificate expired"
Обновите сертификаты:
```bash
certbot renew
```

### Ошибка "SSL certificate mismatch"
Проверьте соответствие сертификата и домена:
```bash
openssl x509 -in nginx/ssl/fullchain.pem -text -noout | grep DNS
```
