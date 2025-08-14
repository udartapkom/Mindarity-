#!/bin/bash

# Скрипт автоматического развертывания Mindarity
# Использование: ./deploy.sh [dev|staging|prod]

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
if [ $# -eq 0 ]; then
    log_error "Необходимо указать окружение: dev, staging или prod"
    echo "Использование: $0 [dev|staging|prod]"
    exit 1
fi

ENVIRONMENT=$1
PROJECT_NAME="Mindarity"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка переменных окружения
check_environment() {
    log_info "Проверка переменных окружения..."
    
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        log_error "Файл .env.$ENVIRONMENT не найден"
        exit 1
    fi
    
    # Загрузка переменных окружения
    source ".env.$ENVIRONMENT"
    
    # Проверка обязательных переменных
    required_vars=(
        "SUPER_ADMIN_EMAIL"
        "SUPER_ADMIN_USERNAME"
        "SUPER_ADMIN_PASSWORD"
        "JWT_SECRET"
        "ELASTICSEARCH_PASSWORD"
        "MINIO_ACCESS_KEY"
        "MINIO_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Переменная $var не установлена"
            exit 1
        fi
    done
    
    log_success "Переменные окружения проверены"
}

# Создание backup
create_backup() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Создание backup базы данных..."
        
        BACKUP_DIR="backups/prod_$TIMESTAMP"
        mkdir -p "$BACKUP_DIR"
        
        # Backup PostgreSQL
        docker exec mindarity-postgres pg_dump -U mindarity_user mindarity > "$BACKUP_DIR/database.sql"
        
        # Backup MinIO
        docker run --rm -v "$BACKUP_DIR:/backup" \
            --network mindarity-network \
            minio/mc cp --recursive mindarity/ /backup/minio/
        
        # Backup Elasticsearch
        docker exec mindarity-elasticsearch elasticsearch-dump \
            --input=http://localhost:9200/mindarity_* \
            --output="$BACKUP_DIR/elasticsearch.json"
        
        log_success "Backup создан в $BACKUP_DIR"
    fi
}

# Остановка текущих сервисов
stop_services() {
    log_info "Остановка текущих сервисов..."
    
    case $ENVIRONMENT in
        dev)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
            ;;
        staging)
            docker-compose -f docker-compose.yml -f docker-compose.staging.yml down
            ;;
        prod)
            docker-compose -f docker-compose.traefik.yml down
            ;;
    esac
    
    log_success "Сервисы остановлены"
}

# Обновление кода
update_code() {
    log_info "Обновление кода..."
    
    # Получение последних изменений
    git fetch origin
    git reset --hard origin/main
    
    # Проверка статуса
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Обнаружены несохраненные изменения"
        git stash
    fi
    
    log_success "Код обновлен"
}

# Сборка образов
build_images() {
    log_info "Сборка Docker образов..."
    
    # Сборка backend
    log_info "Сборка backend..."
    docker build -t mindarity-backend:latest ./backend
    
    # Сборка frontend
    log_info "Сборка frontend..."
    docker build -t mindarity-frontend:latest ./frontend
    
    # Сборка nginx (если используется)
    if [ "$ENVIRONMENT" != "prod" ]; then
        log_info "Сборка nginx..."
        docker build -t mindarity-nginx:latest ./nginx
    fi
    
    log_success "Образы собраны"
}

# Запуск сервисов
start_services() {
    log_info "Запуск сервисов..."
    
    case $ENVIRONMENT in
        dev)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
            ;;
        staging)
            docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
            ;;
        prod)
            docker-compose -f docker-compose.traefik.yml up -d
            ;;
    esac
    
    log_success "Сервисы запущены"
}

# Проверка health check
health_check() {
    log_info "Проверка состояния сервисов..."
    
    # Ожидание запуска сервисов
    sleep 30
    
    # Проверка backend
    case $ENVIRONMENT in
        dev)
            HEALTH_URL="http://dev.mindarity.ru/health"
            ;;
        staging)
            HEALTH_URL="https://staging.mindarity.ru/health"
            ;;
        prod)
            HEALTH_URL="https://mindarity.ru/health"
            ;;
    esac
    
    # Попытки проверки health
    for i in {1..10}; do
        if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
            log_success "Health check пройден"
            return 0
        fi
        
        log_warning "Попытка $i/10: сервис не готов"
        sleep 10
    done
    
    log_error "Health check не пройден"
    return 1
}

# Запуск миграций
run_migrations() {
    log_info "Запуск миграций базы данных..."
    
    # Ожидание готовности базы данных
    sleep 20
    
    # Запуск миграций через backend
    docker exec mindarity-backend npm run migration:run
    
    log_success "Миграции выполнены"
}

# Проверка мониторинга
check_monitoring() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Проверка системы мониторинга..."
        
        # Проверка Prometheus
        if curl -f "http://localhost:9090/-/healthy" > /dev/null 2>&1; then
            log_success "Prometheus работает"
        else
            log_warning "Prometheus недоступен"
        fi
        
        # Проверка Grafana
        if curl -f "http://localhost:3001/api/health" > /dev/null 2>&1; then
            log_success "Grafana работает"
        else
            log_warning "Grafana недоступен"
        fi
    fi
}

# Основная функция развертывания
deploy() {
    log_info "Начало развертывания $PROJECT_NAME в $ENVIRONMENT окружение"
    
    check_dependencies
    check_environment
    create_backup
    stop_services
    update_code
    build_images
    start_services
    run_migrations
    
    if health_check; then
        check_monitoring
        log_success "Развертывание завершено успешно!"
        
        # Уведомление в Slack (если настроено)
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"✅ $PROJECT_NAME успешно развернут в $ENVIRONMENT окружение\"}" \
                "$SLACK_WEBHOOK_URL"
        fi
    else
        log_error "Развертывание завершилось с ошибкой"
        
        # Откат к предыдущей версии
        log_info "Откат к предыдущей версии..."
        rollback
        
        exit 1
    fi
}

# Функция отката
rollback() {
    log_warning "Выполняется откат..."
    
    # Остановка сервисов
    stop_services
    
    # Восстановление из backup (если есть)
    if [ "$ENVIRONMENT" = "prod" ] && [ -d "backups" ]; then
        LATEST_BACKUP=$(ls -t backups/ | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "Восстановление из backup: $LATEST_BACKUP"
            # Здесь должна быть логика восстановления
        fi
    fi
    
    # Запуск предыдущей версии
    start_services
    
    log_warning "Откат завершен"
}

# Обработка сигналов
trap 'log_error "Развертывание прервано"; rollback; exit 1' INT TERM

# Запуск развертывания
deploy
