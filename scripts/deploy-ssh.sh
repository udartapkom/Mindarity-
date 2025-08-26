#!/bin/bash

# Скрипт автоматического развертывания Mindarity на сервере по SSH
# Использование: ./deploy-ssh.sh <server_ip> <username> <domain> [environment]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
if [ $# -lt 3 ]; then
    log_error "Необходимо указать: <server_ip> <username> <domain> [environment]"
    echo "Использование: $0 <server_ip> <username> <domain> [environment]"
    echo "Пример: $0 192.168.1.100 ubuntu mindarity.ru prod"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2
DOMAIN=$3
ENVIRONMENT=${4:-prod}

# Проверка окружения
case $ENVIRONMENT in
    dev|staging|prod)
        log_info "Развертывание в окружение: $ENVIRONMENT"
        ;;
    *)
        log_error "Неверное окружение: $ENVIRONMENT"
        echo "Допустимые значения: dev, staging, prod"
        exit 1
        ;;
esac

PROJECT_NAME="Mindarity"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REMOTE_DIR="/home/$USERNAME/mindarity"

# Проверка SSH соединения
check_ssh_connection() {
    log_info "Проверка SSH соединения с сервером $SERVER_IP..."
    
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$USERNAME@$SERVER_IP" exit 2>/dev/null; then
        log_error "Не удается подключиться к серверу $SERVER_IP"
        log_info "Убедитесь, что:"
        log_info "1. SSH ключи настроены"
        log_info "2. Сервер доступен"
        log_info "3. Пользователь $USERNAME существует"
        exit 1
    fi
    
    log_success "SSH соединение установлено"
}

# Подготовка сервера
prepare_server() {
    log_info "Подготовка сервера..."
    
    ssh "$USERNAME@$SERVER_IP" << 'EOF'
        # Обновление системы
        sudo apt update && sudo apt upgrade -y
        
        # Установка необходимых пакетов
        sudo apt install -y curl wget git openssl certbot python3-certbot-nginx ufw
        
        # Установка Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Установка Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Настройка firewall
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 80/tcp    # HTTP
        sudo ufw allow 443/tcp   # HTTPS
        sudo ufw --force enable
        
        # Создание директории проекта
        mkdir -p ~/mindarity
        mkdir -p ~/mindarity/backups
        mkdir -p ~/mindarity/nginx/ssl
        
        # Установка прав
        sudo chown -R $USER:$USER ~/mindarity
EOF
    
    log_success "Сервер подготовлен"
}

# Копирование файлов проекта
copy_project_files() {
    log_info "Копирование файлов проекта на сервер..."
    
    # Создание временного архива
    tar --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='build' \
        --exclude='*.log' --exclude='backups' -czf mindarity-deploy.tar.gz .
    
    # Копирование на сервер
    scp mindarity-deploy.tar.gz "$USERNAME@$SERVER_IP:$REMOTE_DIR/"
    
    # Распаковка на сервере
    ssh "$USERNAME@$SERVER_IP" "cd $REMOTE_DIR && tar -xzf mindarity-deploy.tar.gz && rm mindarity-deploy.tar.gz"
    
    # Удаление локального архива
    rm mindarity-deploy.tar.gz
    
    log_success "Файлы проекта скопированы"
}

# Настройка SSL сертификатов
setup_ssl() {
    log_info "Настройка SSL сертификатов для домена $DOMAIN..."
    
    ssh "$USERNAME@$SERVER_IP" << EOF
        cd $REMOTE_DIR
        
        # Создание самоподписанного сертификата для разработки
        if [ "$ENVIRONMENT" = "dev" ]; then
            ./scripts/setup-ssl.sh $DOMAIN
        else
            # Получение Let's Encrypt сертификата для продакшена
            sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
            
            # Копирование сертификатов
            sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
            sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
            sudo chown $USER:$USER nginx/ssl/*
            chmod 600 nginx/ssl/key.pem
            chmod 644 nginx/ssl/cert.pem
        fi
EOF
    
    log_success "SSL сертификаты настроены"
}

# Настройка переменных окружения
setup_environment() {
    log_info "Настройка переменных окружения..."
    
    # Создание файла .env на сервере
    ssh "$USERNAME@$SERVER_IP" "cd $REMOTE_DIR && cp env.dev .env"
    
    # Генерация секретных ключей
    JWT_SECRET=$(openssl rand -base64 32)
    ELASTICSEARCH_PASSWORD=$(openssl rand -base64 16)
    MINIO_ACCESS_KEY=$(openssl rand -hex 16)
    MINIO_SECRET_KEY=$(openssl rand -hex 32)
    
    # Обновление .env файла на сервере
    ssh "$USERNAME@$SERVER_IP" << EOF
        cd $REMOTE_DIR
        
        # Обновление переменных
        sed -i "s/your-jwt-secret/$JWT_SECRET/g" .env
        sed -i "s/your-elasticsearch-password/$ELASTICSEARCH_PASSWORD/g" .env
        sed -i "s/your-minio-access-key/$MINIO_ACCESS_KEY/g" .env
        sed -i "s/your-minio-secret-key/$MINIO_SECRET_KEY/g" .env
        
        # Обновление домена
        sed -i "s/mindarity.ru/$DOMAIN/g" .env
        sed -i "s/mindarity.ru/$DOMAIN/g" docker-compose.yml
        
        # Обновление nginx конфигурации
        sed -i "s/mindarity.ru/$DOMAIN/g" nginx/nginx.conf
EOF
    
    log_success "Переменные окружения настроены"
}

# Запуск приложения
deploy_application() {
    log_info "Запуск приложения..."
    
    ssh "$USERNAME@$SERVER_IP" << EOF
        cd $REMOTE_DIR
        
        # Остановка существующих контейнеров
        docker-compose down 2>/dev/null || true
        
        # Очистка старых образов
        docker system prune -f
        
        # Сборка и запуск
        docker-compose up -d --build
        
        # Ожидание запуска сервисов
        sleep 30
        
        # Проверка статуса
        docker-compose ps
EOF
    
    log_success "Приложение запущено"
}

# Проверка развертывания
verify_deployment() {
    log_info "Проверка развертывания..."
    
    # Ожидание полного запуска
    sleep 60
    
    # Проверка health check
    if curl -f "https://$DOMAIN/health" > /dev/null 2>&1; then
        log_success "Health check пройден"
    else
        log_warning "Health check не пройден, проверяем логи..."
        
        # Проверка логов
        ssh "$USERNAME@$SERVER_IP" "cd $REMOTE_DIR && docker-compose logs --tail=50"
        
        log_error "Развертывание не прошло проверку"
        return 1
    fi
    
    # Проверка основных эндпоинтов
    log_info "Проверка основных эндпоинтов..."
    
    ENDPOINTS=(
        "https://$DOMAIN/"
        "https://$DOMAIN/api/health"
        "https://$DOMAIN/auth"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -f "$endpoint" > /dev/null 2>&1; then
            log_success "✅ $endpoint доступен"
        else
            log_warning "⚠️  $endpoint недоступен"
        fi
    done
    
    log_success "Развертывание проверено"
}

# Настройка мониторинга
setup_monitoring() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Настройка системы мониторинга..."
        
        ssh "$USERNAME@$SERVER_IP" << EOF
            cd $REMOTE_DIR
            
            # Запуск мониторинга
            docker-compose -f docker-compose.monitoring.yml up -d
            
            # Настройка cron для обновления SSL
            (crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet && docker-compose restart nginx") | crontab -
EOF
        
        log_success "Мониторинг настроен"
    fi
}

# Создание скрипта управления
create_management_script() {
    log_info "Создание скрипта управления на сервере..."
    
    ssh "$USERNAME@$SERVER_IP" << 'EOF'
        cd ~/mindarity
        
        cat > manage.sh << 'MANAGE_EOF'
#!/bin/bash

# Скрипт управления Mindarity на сервере

case "$1" in
    start)
        echo "Запуск Mindarity..."
        docker-compose up -d
        ;;
    stop)
        echo "Остановка Mindarity..."
        docker-compose down
        ;;
    restart)
        echo "Перезапуск Mindarity..."
        docker-compose restart
        ;;
    status)
        echo "Статус сервисов:"
        docker-compose ps
        ;;
    logs)
        echo "Логи сервисов:"
        docker-compose logs -f
        ;;
    update)
        echo "Обновление Mindarity..."
        git pull origin main
        docker-compose down
        docker-compose up -d --build
        ;;
    backup)
        echo "Создание backup..."
        BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        docker exec mindarity-postgres pg_dump -U mindarity_user mindarity > "$BACKUP_DIR/database.sql"
        echo "Backup создан в $BACKUP_DIR"
        ;;
    ssl-renew)
        echo "Обновление SSL сертификатов..."
        certbot renew --quiet
        cp /etc/letsencrypt/live/*/fullchain.pem nginx/ssl/cert.pem
        cp /etc/letsencrypt/live/*/privkey.pem nginx/ssl/key.pem
        docker-compose restart nginx
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|update|backup|ssl-renew}"
        exit 1
        ;;
esac
MANAGE_EOF
        
        chmod +x manage.sh
EOF
    
    log_success "Скрипт управления создан"
}

# Основная функция развертывания
main() {
    log_info "Начало развертывания $PROJECT_NAME на сервер $SERVER_IP"
    log_info "Домен: $DOMAIN"
    log_info "Окружение: $ENVIRONMENT"
    
    check_ssh_connection
    prepare_server
    copy_project_files
    setup_ssl
    setup_environment
    deploy_application
    verify_deployment
    setup_monitoring
    create_management_script
    
    log_success "🎉 Развертывание завершено успешно!"
    
    echo ""
    echo "📋 Информация о развертывании:"
    echo "   Сервер: $SERVER_IP"
    echo "   Домен: $DOMAIN"
    echo "   Окружение: $ENVIRONMENT"
    echo "   Директория: $REMOTE_DIR"
    echo ""
    echo "🔧 Управление приложением:"
    echo "   SSH на сервер: ssh $USERNAME@$SERVER_IP"
    echo "   Перейти в директорию: cd $REMOTE_DIR"
    echo "   Управление: ./manage.sh {start|stop|restart|status|logs|update|backup|ssl-renew}"
    echo ""
    echo "🌐 Доступные URL:"
    echo "   Frontend: https://$DOMAIN"
    echo "   Backend API: https://$DOMAIN/api"
    echo "   Keycloak: https://$DOMAIN/auth"
    echo "   MinIO Console: https://$DOMAIN:9001"
    echo ""
    echo "📊 Мониторинг:"
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo "   Prometheus: http://$SERVER_IP:9090"
        echo "   Grafana: http://$SERVER_IP:3001"
    fi
}

# Обработка ошибок
trap 'log_error "Развертывание прервано"; exit 1' INT TERM

# Запуск основного процесса
main
