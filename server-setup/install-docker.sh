#!/bin/bash

# 🐳 Скрипт установки Docker и Docker Compose для Mindarity
# Автор: Mindarity Team
# Версия: 1.0

set -e

echo "🚀 Начинаем установку Docker и Docker Compose..."

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен быть запущен от имени root"
   exit 1
fi

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y
apt autoremove -y

# Установка необходимых пакетов
echo "📦 Установка необходимых пакетов..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban

# Установка Docker
echo "🐳 Установка Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавление пользователя в группу docker
echo "👤 Настройка прав пользователя..."
usermod -aG docker $SUDO_USER

# Установка Docker Compose
echo "📦 Установка Docker Compose..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Создание символической ссылки
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Настройка автозапуска Docker
echo "⚙️ Настройка автозапуска Docker..."
systemctl enable docker
systemctl start docker

# Настройка firewall
echo "🔥 Настройка firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Настройка fail2ban
echo "🛡️ Настройка fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Создание конфигурации fail2ban для SSH
cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Перезапуск fail2ban
systemctl restart fail2ban

# Проверка установки
echo "✅ Проверка установки..."
docker --version
docker-compose --version

# Создание директории для Mindarity
echo "📁 Создание директорий..."
mkdir -p /opt/mindarity/{ssl,logs,backups,scripts}

# Настройка прав доступа
chown -R $SUDO_USER:$SUDO_USER /opt/mindarity

echo "🎉 Установка завершена успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезагрузите сервер: reboot"
echo "2. Подключитесь заново: ssh $SUDO_USER@$(hostname -I | awk '{print $1}')"
echo "3. Перейдите в директорию: cd /opt/mindarity"
echo "4. Клонируйте репозиторий: git clone https://github.com/your-username/mindarity.git ."
echo "5. Настройте переменные окружения"
echo "6. Запустите приложение: docker-compose up -d"
echo ""
echo "🔒 Безопасность настроена:"
echo "- Firewall активен (порты 22, 80, 443 открыты)"
echo "- Fail2ban защищает от брутфорс атак"
echo "- Docker работает от имени пользователя"
echo ""
echo "📚 Документация: /opt/mindarity/README.md"
