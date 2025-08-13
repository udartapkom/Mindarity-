# 🔒 Руководство по безопасности сервера Mindarity

## 🚨 Критические меры безопасности

### 1. Изменение паролей по умолчанию
**ВСЕ пароли по умолчанию должны быть изменены!**

```bash
# Проверьте файл .env и измените:
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
KEYCLOAK_ADMIN_PASSWORD=YOUR_STRONG_PASSWORD
MINIO_ROOT_PASSWORD=YOUR_STRONG_PASSWORD
JWT_SECRET=YOUR_VERY_LONG_RANDOM_STRING
```

### 2. Настройка SSH безопасности
```bash
# Отключение root логина
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Изменение порта SSH (опционально)
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Ограничение пользователей
echo "AllowUsers your-username" >> /etc/ssh/sshd_config

# Перезапуск SSH
systemctl restart sshd
```

### 3. Настройка firewall
```bash
# Проверка статуса
ufw status

# Дополнительные правила безопасности
ufw deny 22/tcp  # Блокировка SSH по умолчанию
ufw allow from YOUR_IP_ADDRESS to any port 22  # Разрешение SSH только с вашего IP
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 🛡️ Дополнительные меры безопасности

### 1. Настройка fail2ban
```bash
# Проверка статуса
systemctl status fail2ban

# Настройка правил для nginx
cat > /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 3600
EOF

systemctl restart fail2ban
```

### 2. Настройка автоматических обновлений
```bash
# Установка unattended-upgrades
apt install unattended-upgrades

# Настройка автоматических обновлений безопасности
cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::Package-Blacklist {
};

Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# Включение автоматических обновлений
echo 'Unattended-Upgrade::Automatic-Reboot "true";' >> /etc/apt/apt.conf.d/50unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot-Time "02:00";' >> /etc/apt/apt.conf.d/50unattended-upgrades

systemctl enable unattended-upgrades
systemctl start unattended-upgrades
```

### 3. Настройка логирования
```bash
# Настройка rsyslog
cat > /etc/rsyslog.d/30-mindarity.conf << EOF
# Логирование всех важных событий
*.emerg :omusrmsg:*
*.alert :omusrmsg:*
*.crit :omusrmsg:*
*.err :omusrmsg:*

# Логирование аутентификации
auth,authpriv.* /var/log/auth.log
*.info;mail.none;authpriv.none;cron.none /var/log/messages

# Логирование Docker
:programname, startswith, "docker" /var/log/docker.log
& stop
EOF

systemctl restart rsyslog
```

### 4. Настройка мониторинга безопасности
```bash
# Установка инструментов мониторинга
apt install -y lynis chkrootkit rkhunter

# Сканирование системы
lynis audit system
chkrootkit
rkhunter --check

# Настройка регулярных проверок
echo "0 3 * * * /usr/bin/lynis audit system --quick" | crontab -
echo "0 4 * * * /usr/bin/chkrootkit" | crontab -
echo "0 5 * * * /usr/bin/rkhunter --check --skip-keypress" | crontab -
```

## 🔐 Безопасность приложений

### 1. Настройка Keycloak
```bash
# Создание безопасного realm
docker exec -it mindarity-keycloak /opt/keycloak/bin/kc.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user admin \
    --password YOUR_ADMIN_PASSWORD

# Настройка политик паролей
# - Минимальная длина: 12 символов
# - Сложность: буквы, цифры, спецсимволы
# - История: последние 5 паролей
# - Срок действия: 90 дней
```

### 2. Настройка PostgreSQL
```bash
# Ограничение подключений
echo "max_connections = 100" >> /var/lib/postgresql/data/postgresql.conf
echo "shared_preload_libraries = 'pg_stat_statements'" >> /var/lib/postgresql/data/postgresql.conf

# Настройка SSL (если используется)
echo "ssl = on" >> /var/lib/postgresql/data/postgresql.conf
echo "ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'" >> /var/lib/postgresql/data/postgresql.conf
echo "ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'" >> /var/lib/postgresql/data/postgresql.conf
```

### 3. Настройка Redis
```bash
# Настройка аутентификации
echo "requirepass YOUR_STRONG_REDIS_PASSWORD" >> /usr/local/etc/redis/redis.conf

# Ограничение доступа
echo "bind 127.0.0.1" >> /usr/local/etc/redis/redis.conf
echo "protected-mode yes" >> /usr/local/etc/redis/redis.conf
```

## 📊 Мониторинг безопасности

### 1. Настройка алертов
```bash
# Создание скрипта мониторинга безопасности
cat > /opt/mindarity/scripts/security-monitor.sh << 'EOF'
#!/bin/bash
# Мониторинг безопасности Mindarity

LOG_FILE="/opt/mindarity/logs/security.log"
ALERT_EMAIL="admin@mindarity.ru"

# Проверка неудачных попыток входа
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "$(date): ВНИМАНИЕ! Много неудачных попыток входа: $FAILED_LOGINS" >> $LOG_FILE
    echo "Subject: Security Alert - Failed Login Attempts" | mail -s "Security Alert" $ALERT_EMAIL
fi

# Проверка подозрительной активности
SUSPICIOUS_ACTIVITY=$(grep -i "suspicious\|attack\|brute\|scan" /var/log/nginx/access.log | wc -l)
if [ $SUSPICIOUS_ACTIVITY -gt 0 ]; then
    echo "$(date): Обнаружена подозрительная активность: $SUSPICIOUS_ACTIVITY записей" >> $LOG_FILE
fi

# Проверка использования диска
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): ВНИМАНИЕ! Диск заполнен на $DISK_USAGE%" >> $LOG_FILE
fi

# Проверка свободной памяти
FREE_MEM=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $FREE_MEM -gt 90 ]; then
    echo "$(date): ВНИМАНИЕ! Память используется на $FREE_MEM%" >> $LOG_FILE
fi
EOF

chmod +x /opt/mindarity/scripts/security-monitor.sh

# Добавление в cron
echo "*/15 * * * * /opt/mindarity/scripts/security-monitor.sh" | crontab -
```

### 2. Настройка логирования
```bash
# Ротация логов
cat > /etc/logrotate.d/mindarity << EOF
/opt/mindarity/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
```

## 🚨 Реагирование на инциденты

### 1. План реагирования
```bash
# Создание плана реагирования
cat > /opt/mindarity/scripts/incident-response.sh << 'EOF'
#!/bin/bash
# План реагирования на инциденты безопасности

INCIDENT_LOG="/opt/mindarity/logs/incident.log"
BACKUP_DIR="/opt/mindarity/backups/incident"

echo "$(date): Начало реагирования на инцидент" >> $INCIDENT_LOG

# 1. Создание бэкапа
echo "Создание бэкапа..." >> $INCIDENT_LOG
mkdir -p $BACKUP_DIR
docker-compose exec postgres pg_dump -U mindarity_user mindarity > $BACKUP_DIR/incident_backup.sql

# 2. Остановка сервисов
echo "Остановка сервисов..." >> $INCIDENT_LOG
docker-compose down

# 3. Анализ логов
echo "Анализ логов..." >> $INCIDENT_LOG
grep -i "error\|fail\|attack\|suspicious" /var/log/*.log > $BACKUP_DIR/security_analysis.log

# 4. Уведомление администратора
echo "Уведомление администратора..." >> $INCIDENT_LOG
echo "Subject: Security Incident Detected" | mail -s "Security Incident" admin@mindarity.ru

echo "$(date): Реагирование на инцидент завершено" >> $INCIDENT_LOG
EOF

chmod +x /opt/mindarity/scripts/incident-response.sh
```

### 2. Контакты для экстренных случаев
```bash
# Создание файла контактов
cat > /opt/mindarity/security-contacts.txt << EOF
# Контакты для экстренных случаев

## Администраторы
- Основной: admin@mindarity.ru
- Резервный: backup-admin@mindarity.ru

## Безопасность
- Security Team: security@mindarity.ru
- CISO: ciso@mindarity.ru

## Техническая поддержка
- DevOps: devops@mindarity.ru
- DBA: dba@mindarity.ru

## Внешние контакты
- Хостинг провайдер: support@hosting-provider.com
- SSL провайдер: support@letsencrypt.org
EOF
```

## ✅ Чек-лист безопасности

- [ ] Все пароли по умолчанию изменены
- [ ] SSH настроен безопасно
- [ ] Firewall настроен и активен
- [ ] Fail2ban настроен и работает
- [ ] Автоматические обновления включены
- [ ] Логирование настроено
- [ ] Мониторинг безопасности работает
- [ ] План реагирования на инциденты готов
- [ ] Контакты для экстренных случаев определены
- [ ] Регулярные проверки безопасности настроены

## 📚 Дополнительные ресурсы

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [CIS Security Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## ⚠️ Важные напоминания

1. **Регулярно обновляйте систему и пакеты**
2. **Мониторьте логи на подозрительную активность**
3. **Проводите регулярные проверки безопасности**
4. **Тестируйте план реагирования на инциденты**
5. **Обучайте команду основам кибербезопасности**
6. **Проводите регулярные аудиты безопасности**
7. **Имейте план восстановления после атак**
8. **Регулярно обновляйте резервные копии**
