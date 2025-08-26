#!/bin/bash

# Скрипт проверки готовности сервера для развертывания Mindarity
# Использование: ./check-server.sh <server_ip> <username>

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
if [ $# -ne 2 ]; then
    log_error "Необходимо указать: <server_ip> <username>"
    echo "Использование: $0 <server_ip> <username>"
    echo "Пример: $0 192.168.1.100 ubuntu"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2

# Проверка доступности сервера
check_server_availability() {
    log_info "Проверка доступности сервера $SERVER_IP..."
    
    if ping -c 3 "$SERVER_IP" > /dev/null 2>&1; then
        log_success "Сервер доступен по ping"
    else
        log_error "Сервер недоступен по ping"
        return 1
    fi
}

# Проверка SSH соединения
check_ssh_connection() {
    log_info "Проверка SSH соединения..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$USERNAME@$SERVER_IP" exit 2>/dev/null; then
        log_success "SSH соединение работает"
    else
        log_error "SSH соединение не работает"
        log_info "Убедитесь, что SSH ключи настроены: ./setup-ssh.sh $SERVER_IP $USERNAME"
        return 1
    fi
}

# Проверка операционной системы
check_operating_system() {
    log_info "Проверка операционной системы..."
    
    OS_INFO=$(ssh "$USERNAME@$SERVER_IP" "cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2")
    log_info "Операционная система: $OS_INFO"
    
    # Проверка версии Ubuntu
    if echo "$OS_INFO" | grep -q "Ubuntu"; then
        VERSION=$(ssh "$USERNAME@$SERVER_IP" "lsb_release -rs")
        log_info "Версия Ubuntu: $VERSION"
        
        if [ "$(echo "$VERSION >= 20.04" | bc -l)" -eq 1 ]; then
            log_success "Версия Ubuntu подходит (>= 20.04)"
        else
            log_warning "Версия Ubuntu может быть слишком старой (< 20.04)"
        fi
    else
        log_warning "Операционная система не Ubuntu, могут потребоваться дополнительные настройки"
    fi
}

# Проверка системных ресурсов
check_system_resources() {
    log_info "Проверка системных ресурсов..."
    
    # RAM
    RAM_GB=$(ssh "$USERNAME@$SERVER_IP" "free -g | awk '/^Mem:/{print \$2}'")
    log_info "RAM: ${RAM_GB}GB"
    
    if [ "$RAM_GB" -ge 2 ]; then
        log_success "RAM достаточен (>= 2GB)"
    else
        log_warning "RAM может быть недостаточным (< 2GB)"
    fi
    
    # Дисковое пространство
    DISK_GB=$(ssh "$USERNAME@$SERVER_IP" "df -BG / | awk 'NR==2{print \$4}' | sed 's/G//'")
    log_info "Свободное место на диске: ${DISK_GB}GB"
    
    if [ "$DISK_GB" -ge 20 ]; then
        log_success "Дисковое пространство достаточное (>= 20GB)"
    else
        log_warning "Дисковое пространство может быть недостаточным (< 20GB)"
    fi
    
    # CPU
    CPU_CORES=$(ssh "$USERNAME@$SERVER_IP" "nproc")
    log_info "Количество CPU ядер: $CPU_CORES"
    
    if [ "$CPU_CORES" -ge 2 ]; then
        log_success "CPU достаточен (>= 2 ядра)"
    else
        log_warning "CPU может быть недостаточным (< 2 ядра)"
    fi
}

# Проверка открытых портов
check_open_ports() {
    log_info "Проверка открытых портов..."
    
    # Проверка SSH порта
    if ssh "$USERNAME@$SERVER_IP" "sudo ufw status | grep -q '22.*ALLOW'" 2>/dev/null; then
        log_success "Порт 22 (SSH) открыт"
    else
        log_warning "Порт 22 (SSH) может быть заблокирован"
    fi
    
    # Проверка HTTP порта
    if ssh "$USERNAME@$SERVER_IP" "sudo ufw status | grep -q '80.*ALLOW'" 2>/dev/null; then
        log_success "Порт 80 (HTTP) открыт"
    else
        log_warning "Порт 80 (HTTP) может быть заблокирован"
    fi
    
    # Проверка HTTPS порта
    if ssh "$USERNAME@$SERVER_IP" "sudo ufw status | grep -q '443.*ALLOW'" 2>/dev/null; then
        log_success "Порт 443 (HTTPS) открыт"
    else
        log_warning "Порт 443 (HTTPS) может быть заблокирован"
    fi
}

# Проверка установленных пакетов
check_installed_packages() {
    log_info "Проверка установленных пакетов..."
    
    # Проверка Docker
    if ssh "$USERNAME@$SERVER_IP" "command -v docker >/dev/null 2>&1"; then
        DOCKER_VERSION=$(ssh "$USERNAME@$SERVER_IP" "docker --version")
        log_success "Docker установлен: $DOCKER_VERSION"
    else
        log_warning "Docker не установлен"
    fi
    
    # Проверка Docker Compose
    if ssh "$USERNAME@$SERVER_IP" "command -v docker-compose >/dev/null 2>&1"; then
        COMPOSE_VERSION=$(ssh "$USERNAME@$SERVER_IP" "docker-compose --version")
        log_success "Docker Compose установлен: $COMPOSE_VERSION"
    else
        log_warning "Docker Compose не установлен"
    fi
    
    # Проверка Git
    if ssh "$USERNAME@$SERVER_IP" "command -v git >/dev/null 2>&1"; then
        GIT_VERSION=$(ssh "$USERNAME@$SERVER_IP" "git --version")
        log_success "Git установлен: $GIT_VERSION"
    else
        log_warning "Git не установлен"
    fi
}

# Проверка сетевых настроек
check_network_settings() {
    log_info "Проверка сетевых настроек..."
    
    # Проверка DNS
    if ssh "$USERNAME@$SERVER_IP" "nslookup google.com >/dev/null 2>&1"; then
        log_success "DNS работает корректно"
    else
        log_warning "Проблемы с DNS"
    fi
    
    # Проверка внешнего доступа
    if ssh "$USERNAME@$SERVER_IP" "curl -s --connect-timeout 10 https://httpbin.org/ip >/dev/null 2>&1"; then
        log_success "Внешний доступ работает"
    else
        log_warning "Проблемы с внешним доступом"
    fi
}

# Проверка пользователя и прав
check_user_permissions() {
    log_info "Проверка пользователя и прав..."
    
    # Проверка существования пользователя
    if ssh "$USERNAME@$SERVER_IP" "id $USERNAME >/dev/null 2>&1"; then
        log_success "Пользователь $USERNAME существует"
    else
        log_error "Пользователь $USERNAME не существует"
        return 1
    fi
    
    # Проверка sudo прав
    if ssh "$USERNAME@$SERVER_IP" "sudo -n true 2>/dev/null"; then
        log_success "Пользователь имеет sudo права"
    else
        log_warning "Пользователь может не иметь sudo прав"
    fi
    
    # Проверка группы docker
    if ssh "$USERNAME@$SERVER_IP" "groups $USERNAME | grep -q docker"; then
        log_success "Пользователь в группе docker"
    else
        log_warning "Пользователь не в группе docker"
    fi
}

# Проверка firewall
check_firewall() {
    log_info "Проверка firewall..."
    
    if ssh "$USERNAME@$SERVER_IP" "sudo ufw status | grep -q 'Status: active'"; then
        log_success "UFW firewall активен"
        
        # Показать правила
        log_info "Правила firewall:"
        ssh "$USERNAME@$SERVER_IP" "sudo ufw status numbered"
    else
        log_warning "UFW firewall не активен или не настроен"
    fi
}

# Генерация отчета
generate_report() {
    log_info "Генерация отчета о готовности сервера..."
    
    REPORT_FILE="server-readiness-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
Отчет о готовности сервера для развертывания Mindarity
Дата: $(date)
Сервер: $SERVER_IP
Пользователь: $USERNAME

=== СИСТЕМНАЯ ИНФОРМАЦИЯ ===
$(ssh "$USERNAME@$SERVER_IP" "uname -a")
$(ssh "$USERNAME@$SERVER_IP" "cat /etc/os-release | grep PRETTY_NAME")

=== РЕСУРСЫ ===
RAM: $(ssh "$USERNAME@$SERVER_IP" "free -h | awk '/^Mem:/{print \$2}'")
Диск: $(ssh "$USERNAME@$SERVER_IP" "df -h / | awk 'NR==2{print \$4}'")
CPU: $(ssh "$USERNAME@$SERVER_IP" "nproc") ядер

=== УСТАНОВЛЕННЫЕ ПАКЕТЫ ===
Docker: $(ssh "$USERNAME@$SERVER_IP" "docker --version 2>/dev/null || echo 'Не установлен'")
Docker Compose: $(ssh "$USERNAME@$SERVER_IP" "docker-compose --version 2>/dev/null || echo 'Не установлен'")
Git: $(ssh "$USERNAME@$SERVER_IP" "git --version 2>/dev/null || echo 'Не установлен'")

=== СЕТЕВЫЕ НАСТРОЙКИ ===
$(ssh "$USERNAME@$SERVER_IP" "ip addr show | grep 'inet ' | grep -v '127.0.0.1'")

=== FIREWALL ===
$(ssh "$USERNAME@$SERVER_IP" "sudo ufw status")

=== РЕКОМЕНДАЦИИ ===
EOF
    
    log_success "Отчет сохранен в файл: $REPORT_FILE"
}

# Основная функция проверки
main() {
    log_info "🔍 Проверка готовности сервера $SERVER_IP для развертывания Mindarity"
    log_info "Пользователь: $USERNAME"
    echo ""
    
    # Выполнение всех проверок
    check_server_availability
    check_ssh_connection
    check_operating_system
    check_system_resources
    check_open_ports
    check_installed_packages
    check_network_settings
    check_user_permissions
    check_firewall
    
    echo ""
    log_info "📊 Результаты проверки:"
    
    # Генерация отчета
    generate_report
    
    echo ""
    log_success "✅ Проверка сервера завершена!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Если все проверки пройдены: ./deploy-ssh.sh $SERVER_IP $USERNAME <DOMAIN> prod"
    echo "2. Если есть проблемы: исправьте их и запустите проверку снова"
    echo "3. Отчет сохранен в: $REPORT_FILE"
}

# Обработка ошибок
trap 'log_error "Проверка прервана"; exit 1' INT TERM

# Запуск основной функции
main
