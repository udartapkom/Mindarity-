#!/bin/bash

# Скрипт настройки SSH соединения для развертывания Mindarity
# Использование: ./setup-ssh.sh <server_ip> <username>

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
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
SSH_CONFIG_PATH="$HOME/.ssh/config"

# Проверка существования SSH ключа
check_ssh_key() {
    log_info "Проверка SSH ключа..."
    
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_warning "SSH ключ не найден. Создание нового ключа..."
        
        # Создание SSH ключа
        ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "$USER@$(hostname)"
        
        log_success "SSH ключ создан: $SSH_KEY_PATH"
    else
        log_success "SSH ключ найден: $SSH_KEY_PATH"
    fi
}

# Копирование SSH ключа на сервер
copy_ssh_key() {
    log_info "Копирование SSH ключа на сервер..."
    
    # Попытка копирования ключа
    if ssh-copy-id -i "$SSH_KEY_PATH.pub" "$USERNAME@$SERVER_IP"; then
        log_success "SSH ключ скопирован на сервер"
    else
        log_warning "Не удалось скопировать ключ автоматически"
        log_info "Выполните вручную:"
        echo "ssh-copy-id -i $SSH_KEY_PATH.pub $USERNAME@$SERVER_IP"
        echo ""
        log_info "Или скопируйте содержимое публичного ключа:"
        echo "cat $SSH_KEY_PATH.pub"
        echo ""
        log_info "И добавьте его в ~/.ssh/authorized_keys на сервере"
    fi
}

# Настройка SSH конфигурации
setup_ssh_config() {
    log_info "Настройка SSH конфигурации..."
    
    # Создание директории .ssh если не существует
    mkdir -p "$HOME/.ssh"
    
    # Создание или обновление SSH конфигурации
    if [ ! -f "$SSH_CONFIG_PATH" ]; then
        touch "$SSH_CONFIG_PATH"
        chmod 600 "$SSH_CONFIG_PATH"
    fi
    
    # Проверка существования конфигурации для сервера
    if ! grep -q "Host $SERVER_IP" "$SSH_CONFIG_PATH" 2>/dev/null; then
        cat >> "$SSH_CONFIG_PATH" << EOF

# Mindarity Server
Host $SERVER_IP
    HostName $SERVER_IP
    User $USERNAME
    IdentityFile $SSH_KEY_PATH
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF
        
        log_success "SSH конфигурация добавлена"
    else
        log_info "SSH конфигурация уже существует"
    fi
}

# Тестирование SSH соединения
test_ssh_connection() {
    log_info "Тестирование SSH соединения..."
    
    # Ожидание немного для применения изменений
    sleep 2
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$USERNAME@$SERVER_IP" "echo 'SSH соединение установлено успешно'" 2>/dev/null; then
        log_success "SSH соединение работает корректно"
        return 0
    else
        log_error "SSH соединение не работает"
        log_info "Проверьте:"
        log_info "1. Сервер доступен: ping $SERVER_IP"
        log_info "2. SSH сервис запущен на сервере"
        log_info "3. Пользователь $USERNAME существует"
        log_info "4. SSH ключ добавлен в authorized_keys"
        return 1
    fi
}

# Проверка системных требований
check_system_requirements() {
    log_info "Проверка системных требований..."
    
    # Проверка SSH клиента
    if ! command -v ssh &> /dev/null; then
        log_error "SSH клиент не установлен"
        log_info "Установите OpenSSH клиент:"
        echo "sudo apt install openssh-client  # Ubuntu/Debian"
        echo "sudo yum install openssh-clients # CentOS/RHEL"
        exit 1
    fi
    
    # Проверка ssh-copy-id
    if ! command -v ssh-copy-id &> /dev/null; then
        log_warning "ssh-copy-id не найден"
        log_info "Установите openssh-client:"
        echo "sudo apt install openssh-client  # Ubuntu/Debian"
        echo "sudo yum install openssh-clients # CentOS/RHEL"
    fi
    
    log_success "Системные требования проверены"
}

# Основная функция
main() {
    log_info "Настройка SSH соединения для сервера $SERVER_IP"
    log_info "Пользователь: $USERNAME"
    
    check_system_requirements
    check_ssh_key
    copy_ssh_key
    setup_ssh_config
    test_ssh_connection
    
    if [ $? -eq 0 ]; then
        log_success "🎉 SSH соединение настроено успешно!"
        echo ""
        echo "📋 Информация о подключении:"
        echo "   Сервер: $SERVER_IP"
        echo "   Пользователь: $USERNAME"
        echo "   SSH ключ: $SSH_KEY_PATH"
        echo "   Конфигурация: $SSH_CONFIG_PATH"
        echo ""
        echo "🔧 Команды для подключения:"
        echo "   SSH: ssh $USERNAME@$SERVER_IP"
        echo "   Или: ssh $SERVER_IP"
        echo ""
        echo "📁 Теперь можно развернуть проект:"
        echo "   ./deploy-ssh.sh $SERVER_IP $USERNAME your-domain.com prod"
    else
        log_error "❌ SSH соединение не настроено"
        exit 1
    fi
}

# Запуск основного процесса
main
