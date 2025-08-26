#!/bin/bash

# Скрипт для проверки всех эндпоинтов API
# Использование: ./check-endpoints.sh [base_url]
# Пример: ./check-endpoints.sh https://mindarity.ru

BASE_URL=${1:-"https://mindarity.ru"}
API_URL="$BASE_URL/api"

echo "🔍 Проверка эндпоинтов API для $BASE_URL"
echo "=========================================="

# Функция для проверки эндпоинта
check_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    
    echo -n "📡 $method $endpoint - $description: "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$endpoint" --max-time 10)
    elif [ "$method" = "OPTIONS" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$endpoint" --max-time 10)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ $response"
    else
        echo "❌ $response (ожидалось $expected_status)"
    fi
}

# Функция для проверки с авторизацией
check_auth_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-401}  # По умолчанию ожидаем 401 без токена
    
    echo -n "🔐 $method $endpoint - $description: "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$endpoint" --max-time 10)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ $response"
    else
        echo "❌ $response (ожидалось $expected_status)"
    fi
}

echo ""
echo "🌐 Основные эндпоинты:"
check_endpoint "GET" "$BASE_URL" "Frontend (основной сайт)"
check_endpoint "GET" "$BASE_URL/health" "Health check"
check_endpoint "GET" "$API_URL" "API root"
check_endpoint "GET" "$API_URL/test-db" "Database test"

echo ""
echo "🔐 Аутентификация (без токена - ожидаем 401/400):"
check_auth_endpoint "POST" "$API_URL/auth/register" "User registration" 400
check_auth_endpoint "POST" "$API_URL/auth/login" "User login" 400
check_auth_endpoint "GET" "$API_URL/auth/profile" "User profile" 401
check_auth_endpoint "POST" "$API_URL/auth/refresh" "Token refresh" 401

echo ""
echo "🔗 OAuth эндпоинты:"
check_endpoint "GET" "$API_URL/oauth/providers" "OAuth providers"
check_endpoint "GET" "$API_URL/oauth/auth/google" "Google OAuth URL"
check_endpoint "GET" "$API_URL/oauth/auth/github" "GitHub OAuth URL"
check_auth_endpoint "GET" "$API_URL/oauth/status" "OAuth status" 401

echo ""
echo "👥 Пользователи (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/users" "All users" 401
check_auth_endpoint "GET" "$API_URL/users/profile" "User profile" 401
check_auth_endpoint "POST" "$API_URL/users" "Create user" 401
check_auth_endpoint "POST" "$API_URL/users/forgot-password" "Forgot password" 400

echo ""
echo "📅 События (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/events" "All events" 401
check_auth_endpoint "POST" "$API_URL/events" "Create event" 401
check_auth_endpoint "GET" "$API_URL/events/search" "Search events" 401
check_auth_endpoint "GET" "$API_URL/events/stats/count" "Events count" 401

echo ""
echo "🎯 Цели (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/goals" "All goals" 401
check_auth_endpoint "POST" "$API_URL/goals" "Create goal" 401
check_auth_endpoint "GET" "$API_URL/goals/statistics" "Goals statistics" 401

echo ""
echo "📁 Файлы (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/files" "All files" 401
check_auth_endpoint "POST" "$API_URL/files" "Create file" 401
check_auth_endpoint "POST" "$API_URL/files/upload" "Upload file" 401

echo ""
echo "🔍 Поиск (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/search" "Search content" 401
check_auth_endpoint "GET" "$API_URL/search/suggestions" "Search suggestions" 401

echo ""
echo "📊 Big Data (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/bigdata/health" "Big data health"
check_auth_endpoint "GET" "$API_URL/bigdata/stats" "Big data stats" 401
check_auth_endpoint "GET" "$API_URL/bigdata/jobs" "Big data jobs" 401

echo ""
echo "🔔 Уведомления (без токена - ожидаем 401):"
check_auth_endpoint "GET" "$API_URL/notifications" "All notifications" 401
check_auth_endpoint "GET" "$API_URL/notifications/unread" "Unread notifications" 401
check_auth_endpoint "GET" "$API_URL/notifications/stats" "Notification stats" 401

echo ""
echo "📈 Мониторинг:"
check_endpoint "GET" "$API_URL/monitoring/health" "Monitoring health"
check_auth_endpoint "GET" "$API_URL/monitoring/metrics/system" "System metrics" 401
check_auth_endpoint "GET" "$API_URL/monitoring/metrics/application" "Application metrics" 401

echo ""
echo "🌱 Сид данных (без токена - ожидаем 401):"
check_auth_endpoint "POST" "$API_URL/seed" "Seed data" 401

echo ""
echo "🔧 Дополнительные сервисы:"
check_endpoint "GET" "$BASE_URL/auth" "Keycloak"
check_endpoint "GET" "$BASE_URL/minio" "MinIO API"
check_endpoint "GET" "$BASE_URL/minio-console" "MinIO Console"

echo ""
echo "🔍 Проверка CORS (OPTIONS запросы):"
check_endpoint "OPTIONS" "$API_URL/auth/login" "CORS preflight auth"
check_endpoint "OPTIONS" "$API_URL/users" "CORS preflight users"
check_endpoint "OPTIONS" "$API_URL/events" "CORS preflight events"

echo ""
echo "=========================================="
echo "✅ Проверка завершена!"
echo ""
echo "📝 Примечания:"
echo "- 401/400 статусы для защищенных эндпоинтов - это нормально (нет токена)"
echo "- 200 статусы для публичных эндпоинтов - отлично"
echo "- 404 для несуществующих эндпоинтов - проверьте маршрутизацию"
echo "- 500 ошибки - проблемы на сервере"
echo ""
echo "🔧 Для полной проверки с авторизацией используйте токен:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $API_URL/users/profile" 