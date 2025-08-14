# 🚀 Руководство по установке Mindarity на сервер

## 📋 Обзор

Этот пакет содержит все необходимые скрипты и документацию для автоматической настройки сервера Ubuntu для развертывания приложения Mindarity.

## 📁 Структура файлов

```
server-setup/
├── README.md                 # Подробная документация
├── QUICK_START.md           # Быстрый старт (5 минут)
├── SECURITY.md              # Руководство по безопасности
├── env.production           # Переменные окружения для продакшена
├── setup-server.sh          # Основной скрипт настройки
├── install-docker.sh        # Установка Docker
├── setup-ssl.sh            # Настройка SSL
└── deploy.sh               # Развертывание приложения
```

## ⚡ Быстрый старт (5 минут)

### 1. Подключение к серверу
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Клонирование репозитория
```bash
cd /opt
git clone https://github.com/your-username/mindarity.git mindarity
cd mindarity
```

### 3. Настройка прав доступа для скриптов
```bash
# Делаем все скрипты исполняемыми
chmod +x server-setup/*.sh

# Проверяем права доступа
ls -la server-setup/*.sh
```

### 4. Запуск полной настройки
```bash
./server-setup/setup-server.sh full
```

### 5. Перезагрузка и проверка
```bash
reboot
# После перезагрузки:
ssh your-username@YOUR_SERVER_IP
cd /opt/mindarity
docker-compose ps
```

## 🔧 Пошаговая настройка

### Этап 1: Установка Docker и базовых пакетов
```bash
./server-setup/setup-server.sh install-docker
```

**Что происходит:**
- Обновление системы
- Установка Docker и Docker Compose
- Настройка firewall (ufw)
- Настройка fail2ban
- Создание директорий

### Этап 2: Настройка SSL сертификатов
```bash
./server-setup/setup-server.sh setup-ssl
```

**Что происходит:**
- Установка Certbot
- Получение SSL сертификатов от Let's Encrypt
- Настройка автообновления
- Копирование сертификатов

### Этап 3: Развертывание приложения
```bash
./server-setup/setup-server.sh deploy
```

**Что происходит:**
- Создание .env файла с случайными паролями
- Сборка Docker образов
- Запуск всех сервисов
- Настройка автоматических бэкапов
- Создание скриптов управления

## 🌐 Настройка домена

### DNS записи
```
A     mindarity.ru     YOUR_SERVER_IP
A     www.mindarity.ru YOUR_SERVER_IP
```

### Проверка DNS
```bash
nslookup mindarity.ru
nslookup www.mindarity.ru
```

## ⚙️ Конфигурация

### Переменные окружения
Скопируйте и настройте файл переменных:
```bash
cp server-setup/env.production .env
nano .env
```

**Обязательные изменения:**
- Все пароли (POSTGRES_PASSWORD, KEYCLOAK_ADMIN_PASSWORD, etc.)
- JWT_SECRET (минимум 64 символа)
- Домены и URL

### Настройка nginx
Файл конфигурации уже настроен для:
- HTTP → HTTPS редирект
- SSL/TLS с современными настройками
- Gzip сжатие
- Rate limiting
- Безопасные заголовки

## 📊 Мониторинг и управление

### Основные команды
```bash
# Статус сервисов
docker-compose ps

# Логи
docker-compose logs -f

# Мониторинг ресурсов
./scripts/monitor.sh

# Создание бэкапа
./scripts/backup.sh

# Обновление приложения
./scripts/update.sh
```

### Автоматизация
- **Бэкапы**: Ежедневно в 2:00
- **SSL обновления**: Ежедневно в 12:00
- **Системные обновления**: Автоматически
- **Мониторинг безопасности**: Каждые 15 минут

## 🔒 Безопасность

### Автоматически настроено
- Firewall (ufw) с минимальными открытыми портами
- Fail2ban для защиты от брутфорс атак
- SSL/TLS с современными настройками
- Автоматические обновления безопасности

### Рекомендуемые дополнительные меры
```bash
# Отключение root логина
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Изменение порта SSH
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Ограничение пользователей SSH
echo "AllowUsers your-username" >> /etc/ssh/sshd_config

# Перезапуск SSH
systemctl restart sshd
```

## 🚨 Устранение неполадок

### Частые проблемы

#### 1. Порт 80 занят
```bash
# Остановите nginx
systemctl stop nginx

# Или остановите Docker контейнеры
docker-compose down
```

#### 2. Ошибки SSL
```bash
# Проверьте DNS записи
nslookup mindarity.ru

# Проверьте доступность порта 80
netstat -tlnp | grep :80
```

#### 3. Проблемы с Docker
```bash
# Проверьте статус Docker
systemctl status docker

# Перезапустите Docker
systemctl restart docker
```

#### 4. Проблемы с базой данных
```bash
# Проверьте логи PostgreSQL
docker-compose logs postgres

# Проверьте подключение
docker-compose exec postgres psql -U mindarity_user -d mindarity
```

### Полезные команды диагностики
```bash
# Системные ресурсы
htop
df -h
free -h

# Сетевые подключения
netstat -tlnp
ss -tlnp

# Docker ресурсы
docker stats
docker system df

# Логи системы
journalctl -f
tail -f /var/log/syslog
```

## 📈 Оптимизация производительности

### Настройка PostgreSQL
```bash
# Оптимизация памяти
echo "shared_buffers = 256MB" >> /var/lib/postgresql/data/postgresql.conf
echo "effective_cache_size = 1GB" >> /var/lib/postgresql/data/postgresql.conf
echo "work_mem = 4MB" >> /var/lib/postgresql/data/postgresql.conf
```

### Настройка Redis
```bash
# Оптимизация памяти
echo "maxmemory 256mb" >> /usr/local/etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /usr/local/etc/redis/redis.conf
```

### Настройка nginx
```bash
# Оптимизация worker процессов
echo "worker_processes auto;" >> /etc/nginx/nginx.conf
echo "worker_connections 1024;" >> /etc/nginx/nginx.conf
```

## 🔄 Обновление и обслуживание

### Обновление системы
```bash
# Автоматические обновления уже настроены
# Ручное обновление:
apt update && apt upgrade -y
```

### Обновление приложения
```bash
# Автоматическое обновление
./scripts/update.sh

# Ручное обновление
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Очистка системы
```bash
# Очистка Docker
docker system prune -f
docker volume prune -f

# Очистка логов
find /opt/mindarity/logs -name "*.log" -mtime +30 -delete
```

## 📞 Поддержка

### Логи и диагностика
```bash
# Основные логи
docker-compose logs -f

# Логи системы
journalctl -f

# Логи безопасности
tail -f /var/log/auth.log
tail -f /var/log/fail2ban.log
```

### Контакты
- **Документация**: `/opt/mindarity/README.md`
- **Логи**: `/opt/mindarity/logs/`
- **Скрипты**: `/opt/mindarity/scripts/`
- **Бэкапы**: `/opt/mindarity/backups/`

## ✅ Чек-лист завершения

- [ ] Сервер настроен и обновлен
- [ ] Docker и Docker Compose установлены
- [ ] SSL сертификаты получены и настроены
- [ ] DNS записи настроены и работают
- [ ] Приложение развернуто и доступно
- [ ] Бэкапы настроены и работают
- [ ] Мониторинг работает
- [ ] Безопасность настроена
- [ ] Документация изучена
- [ ] Команды управления освоены

## 🎯 Результат

После выполнения всех шагов у вас будет:
- ✅ Полностью автоматизированное развертывание
- ✅ Настроенная безопасность (firewall, fail2ban, SSL)
- ✅ Автоматические обновления и бэкапы
- ✅ Мониторинг и логирование
- ✅ Простые скрипты для управления
- ✅ Готовая к продакшену система

**Время настройки: 5-10 минут**
**Уровень сложности: Низкий**
**Автоматизация: 95%**
**Безопасность: Высокая**
**Мониторинг: Полный**
