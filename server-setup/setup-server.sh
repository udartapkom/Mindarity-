#!/bin/bash

# 🚀 Основной скрипт настройки сервера для Mindarity
# Автор: Mindarity Team
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "🚀 Настройка сервера для Mindarity"
    echo "=========================================="
    echo -e "${NC}"
}

# Конфигурация
DOMAIN="mindarity.ru"
WWW_DOMAIN="www.mindarity.ru"
EMAIL="admin@mindarity.ru"
APP_DIR="/opt/mindarity"

print_header

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   print_error "Этот скрипт должен быть запущен от имени root"
   exit 1
fi

# Проверка аргументов
if [[ $# -eq 0 ]]; then
    print_info "Использование: $0 [install-docker|setup-ssl|deploy|full]"
    echo ""
    echo "Опции:"
    echo "  install-docker  - Установка Docker и базовых пакетов"
    echo "  setup-ssl       - Настройка SSL сертификатов"
    echo "  deploy          - Развертывание приложения"
    echo "  full            - Полная настройка сервера"
    echo ""
    echo "Пример: $0 full"
    exit 1
fi

# Функция установки Docker
install_docker() {
    print_info "Установка Docker и базовых пакетов..."
    
    # Обновление системы
    print_info "Обновление системы..."
    apt update && apt upgrade -y
    apt autoremove -y
    
    # Установка необходимых пакетов
    print_info "Установка необходимых пакетов..."
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
        fail2ban \
        nginx \
        certbot \
        python3-certbot-nginx
    
    # Установка Docker
    print_info "Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    
    # Добавление пользователя в группу docker
    print_info "Настройка прав пользователя..."
    usermod -aG docker $SUDO_USER
    
    # Установка Docker Compose
    print_info "Установка Docker Compose..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Настройка автозапуска Docker
    print_info "Настройка автозапуска Docker..."
    systemctl enable docker
    systemctl start docker
    
    # Настройка firewall
    print_info "Настройка firewall..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    # Настройка fail2ban
    print_info "Настройка fail2ban..."
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
    
    systemctl restart fail2ban
    
    # Создание директории для Mindarity
    print_info "Создание директорий..."
    mkdir -p $APP_DIR/{ssl,logs,backups,scripts}
    chown -R $SUDO_USER:$SUDO_USER $APP_DIR
    
    print_success "Docker и базовые пакеты установлены успешно!"
}

# Функция настройки SSL
setup_ssl() {
    print_info "Настройка SSL сертификатов для $DOMAIN..."
    
    # Проверка наличия домена
    if [[ -z "$DOMAIN" ]]; then
        print_error "Не указан домен. Установите переменную DOMAIN"
        exit 1
    fi
    
    # Создание директорий для SSL
    print_info "Создание директорий для SSL..."
    mkdir -p $APP_DIR/ssl
    chmod 700 $APP_DIR/ssl
    
    # Проверка доступности портов
    print_info "Проверка доступности портов..."
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Порт 80 занят. Остановите nginx или другие сервисы"
        echo "💡 Команды для остановки:"
        echo "   systemctl stop nginx"
        echo "   docker-compose down"
        read -p "Нажмите Enter после остановки сервисов..."
    fi
    
    # Получение SSL сертификата
    print_info "Получение SSL сертификата..."
    certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d $WWW_DOMAIN
    
    # Копирование сертификатов
    print_info "Копирование сертификатов..."
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/
    
    # Настройка прав доступа
    chmod 600 $APP_DIR/ssl/*
    chown -R $SUDO_USER:$SUDO_USER $APP_DIR/ssl
    
    # Настройка автообновления сертификатов
    print_info "Настройка автообновления сертификатов..."
    cat > /etc/cron.d/mindarity-ssl-renew << EOF
# Обновление SSL сертификатов Mindarity
0 12 * * * root /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF
    
    print_success "SSL сертификаты настроены успешно!"
}

# Функция развертывания приложения
deploy_app() {
    print_info "Развертывание приложения Mindarity..."
    
    # Проверка наличия Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен. Запустите установку Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен. Запустите установку Docker"
        exit 1
    fi
    
    # Переход в директорию приложения
    cd $APP_DIR
    
    # Проверка наличия docker-compose.yml
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "Файл docker-compose.yml не найден в $APP_DIR"
        echo "💡 Убедитесь, что репозиторий склонирован"
        exit 1
    fi
    
    # Создание .env файла если не существует
    if [[ ! -f ".env" ]]; then
        print_info "Создание .env файла..."
        cat > .env << EOF
# Mindarity Production Environment
# База данных
POSTGRES_DB=mindarity
POSTGRES_USER=mindarity_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
KEYCLOAK_DB_USERNAME=keycloak_user
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 32)

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)

# Backend
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 64)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Elasticsearch
ELASTICSEARCH_PASSWORD=$(openssl rand -base64 32)
EOF
        print_success ".env файл создан с случайными паролями"
        print_warning "Сохраните пароли в безопасном месте!"
    fi
    
    # Сборка и запуск
    print_info "Сборка образов..."
    docker-compose build --no-cache
    
    print_info "Запуск сервисов..."
    docker-compose up -d
    
    # Ожидание запуска
    print_info "Ожидание запуска сервисов..."
    sleep 30
    
    # Проверка статуса
    print_info "Проверка статуса сервисов..."
    docker-compose ps
    
    print_success "Приложение развернуто успешно!"
}

# Функция полной настройки
full_setup() {
    print_info "Выполняется полная настройка сервера..."
    
    install_docker
    setup_ssl
    deploy_app
    
    print_success "Полная настройка сервера завершена!"
    
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Перезагрузите сервер: reboot"
    echo "2. Подключитесь заново: ssh $SUDO_USER@$(hostname -I | awk '{print $1}')"
    echo "3. Проверьте работу приложения: cd $APP_DIR && docker-compose ps"
    echo ""
    echo "🔒 Безопасность настроена:"
    echo "- Firewall активен (порты 22, 80, 443 открыты)"
    echo "- Fail2ban защищает от брутфорс атак"
    echo "- SSL сертификаты настроены и автообновляются"
    echo "- Docker работает от имени пользователя"
    echo ""
    echo "📚 Документация: $APP_DIR/README.md"
}

# Основная логика
case "$1" in
    "install-docker")
        install_docker
        ;;
    "setup-ssl")
        setup_ssl
        ;;
    "deploy")
        deploy_app
        ;;
    "full")
        full_setup
        ;;
    *)
        print_error "Неизвестная опция: $1"
        echo "Используйте: install-docker, setup-ssl, deploy или full"
        exit 1
        ;;
esac

print_success "Операция завершена успешно!"
