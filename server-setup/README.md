# 🚀 Настройка удаленного сервера для Mindarity

Этот документ содержит пошаговую инструкцию по настройке удаленного сервера для развертывания приложения Mindarity.

## 📋 Требования к серверу

### Минимальные требования:
- **ОС**: Ubuntu 20.04 LTS или 22.04 LTS
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 50 GB SSD
- **Сеть**: Статический IP адрес

### Рекомендуемые требования:
- **ОС**: Ubuntu 22.04 LTS
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 100 GB SSD
- **Сеть**: Статический IP адрес

## 🔧 Подготовка сервера

### 1. Подключение к серверу
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Обновление системы
```bash
apt update && apt upgrade -y
apt autoremove -y
```

### 3. Установка базовых пакетов
```bash
apt install -y curl wget git vim htop ufw fail2ban
```

### 4. Настройка firewall
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### 5. Настройка fail2ban
```bash
systemctl enable fail2ban
systemctl start fail2ban
```

## 🐳 Установка Docker и Docker Compose

### 1. Установка Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER
```

### 2. Установка Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Перезагрузка для применения изменений
```bash
reboot
```

## 📁 Подготовка директорий

### 1. Создание структуры директорий
```bash
mkdir -p /opt/mindarity
cd /opt/mindarity
mkdir -p {ssl,logs,backups}
```

### 2. Клонирование репозитория
```bash
git clone https://github.com/your-username/mindarity.git .
```

### 3. Настройка прав доступа для скриптов
```bash
# Делаем все скрипты исполняемыми
chmod +x server-setup/*.sh

# Проверяем права доступа
ls -la server-setup/*.sh
```

## 🔐 Настройка SSL сертификатов

### 1. Установка Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Получение SSL сертификата
```bash
certbot certonly --standalone -d mindarity.ru -d www.mindarity.ru
```

### 3. Копирование сертификатов
```bash
cp /etc/letsencrypt/live/mindarity.ru/fullchain.pem /opt/mindarity/ssl/
cp /etc/letsencrypt/live/mindarity.ru/privkey.pem /opt/mindarity/ssl/
chmod 600 /opt/mindarity/ssl/*
```

### 4. Настройка автообновления
```bash
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🌐 Настройка домена

### 1. DNS записи
```
A     mindarity.ru     YOUR_SERVER_IP
A     www.mindarity.ru YOUR_SERVER_IP
```

### 2. Проверка DNS
```bash
nslookup mindarity.ru
nslookup www.mindarity.ru
```

## ⚙️ Настройка переменных окружения

### 1. Создание .env файла
```bash
cp server-setup/env.production .env
nano .env
```

### 2. Основные переменные
```env
# База данных
POSTGRES_DB=mindarity
POSTGRES_USER=mindarity_user
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
KEYCLOAK_DB_USERNAME=keycloak_user
KEYCLOAK_DB_PASSWORD=STRONG_PASSWORD_HERE

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=STRONG_PASSWORD_HERE

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=STRONG_PASSWORD_HERE

# Backend
NODE_ENV=production
JWT_SECRET=VERY_LONG_RANDOM_STRING
```

## 🚀 Развертывание приложения

### 1. Сборка образов
```bash
docker-compose build
```

### 2. Запуск сервисов
```bash
docker-compose up -d
```

### 3. Проверка статуса
```bash
docker-compose ps
docker-compose logs -f
```

## 📊 Мониторинг и логи

### 1. Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 2. Мониторинг ресурсов
```bash
# Системные ресурсы
htop

# Docker ресурсы
docker stats

# Дисковое пространство
df -h
```

## 🔄 Обновление приложения

### 1. Остановка сервисов
```bash
docker-compose down
```

### 2. Обновление кода
```bash
git pull origin main
```

### 3. Пересборка и запуск
```bash
docker-compose build
docker-compose up -d
```

## 💾 Резервное копирование

### 1. База данных
```bash
docker exec mindarity-postgres pg_dump -U mindarity_user mindarity > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Файлы MinIO
```bash
docker exec mindarity-minio mc mirror /data /backup
```

### 3. Автоматизация бэкапов
```bash
# Добавить в crontab
0 2 * * * /opt/mindarity/scripts/backup.sh
```

## 🚨 Устранение неполадок

### 1. Проверка сервисов
```bash
docker-compose ps
docker-compose logs [service_name]
```

### 2. Перезапуск сервиса
```bash
docker-compose restart [service_name]
```

### 3. Проверка портов
```bash
netstat -tlnp
ss -tlnp
```

### 4. Проверка nginx
```bash
docker exec mindarity-nginx nginx -t
docker exec mindarity-nginx nginx -s reload
```

## 📈 Оптимизация производительности

### 1. Настройка nginx
- Включение gzip сжатия
- Кэширование статических файлов
- Rate limiting для API

### 2. Настройка базы данных
- Оптимизация PostgreSQL
- Настройка индексов
- Мониторинг медленных запросов

### 3. Мониторинг ресурсов
- Prometheus + Grafana
- Логирование в ELK Stack
- Алерты при превышении лимитов

## 🔒 Безопасность

### 1. Регулярные обновления
```bash
apt update && apt upgrade -y
docker system prune -f
```

### 2. Мониторинг безопасности
- Сканирование уязвимостей
- Мониторинг логов
- Алерты о подозрительной активности

### 3. Резервное копирование
- Ежедневные бэкапы
- Тестирование восстановления
- Хранение бэкапов в разных локациях

## 📞 Поддержка

При возникновении проблем:
1. Проверить логи: `docker-compose logs -f`
2. Проверить статус сервисов: `docker-compose ps`
3. Проверить системные ресурсы: `htop`, `df -h`
4. Обратиться к документации или в поддержку

## ✅ Чек-лист готовности

- [ ] Сервер настроен и обновлен
- [ ] Docker и Docker Compose установлены
- [ ] SSL сертификаты получены
- [ ] DNS записи настроены
- [ ] Переменные окружения настроены
- [ ] Приложение развернуто и работает
- [ ] Мониторинг настроен
- [ ] Бэкапы настроены
- [ ] Безопасность настроена
- [ ] Документация обновлена
