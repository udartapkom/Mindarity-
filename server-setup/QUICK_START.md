# 🚀 Быстрый старт настройки сервера

## 📋 Предварительные требования

1. **Сервер Ubuntu 20.04/22.04 LTS** с правами root
2. **Домен** (например, mindarity.ru) с настроенными DNS записями
3. **SSH доступ** к серверу

## ⚡ Быстрая настройка (5 минут)

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

### 5. Перезагрузка сервера
```bash
reboot
```

### 6. Проверка работы
```bash
ssh your-username@YOUR_SERVER_IP
cd /opt/mindarity
docker-compose ps
```

## 🔧 Пошаговая настройка

### Этап 1: Установка Docker
```bash
./server-setup/setup-server.sh install-docker
```

### Этап 2: Настройка SSL
```bash
./server-setup/setup-server.sh setup-ssl
```

### Этап 3: Развертывание приложения
```bash
./server-setup/setup-server.sh deploy
```

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

## 📊 Мониторинг

### Статус сервисов
```bash
docker-compose ps
```

### Логи
```bash
docker-compose logs -f
```

### Мониторинг ресурсов
```bash
./scripts/monitor.sh
```

## 🔄 Обновление

### Автоматическое обновление
```bash
./scripts/update.sh
```

### Ручное обновление
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 💾 Резервное копирование

### Создание бэкапа
```bash
./scripts/backup.sh
```

### Автоматические бэкапы
Настроены автоматически (ежедневно в 2:00)

## 🚨 Устранение неполадок

### Проверка сервисов
```bash
docker-compose ps
docker-compose logs [service_name]
```

### Перезапуск сервиса
```bash
docker-compose restart [service_name]
```

### Проверка портов
```bash
netstat -tlnp
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте ресурсы: `./scripts/monitor.sh`
4. Обратитесь к документации: `/opt/mindarity/README.md`

## ✅ Чек-лист готовности

- [ ] Сервер настроен и обновлен
- [ ] Docker и Docker Compose установлены
- [ ] SSL сертификаты получены
- [ ] DNS записи настроены
- [ ] Приложение развернуто и работает
- [ ] Бэкапы настроены
- [ ] Мониторинг работает

## 🎯 Результат

После выполнения всех шагов у вас будет:
- ✅ Работающее приложение Mindarity
- ✅ Настроенная безопасность (firewall, fail2ban)
- ✅ SSL сертификаты с автообновлением
- ✅ Автоматические бэкапы
- ✅ Мониторинг и логирование
- ✅ Простые скрипты для управления

**Время настройки: 5-10 минут**
**Уровень сложности: Низкий**
**Автоматизация: 95%**
