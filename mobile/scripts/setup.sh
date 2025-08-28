#!/bin/bash

# Скрипт для настройки и запуска React Native приложения Mindarity

echo "🚀 Настройка React Native приложения Mindarity..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js версии 18 или выше."
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js версии $(node -v) найден"

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

echo "✅ npm версии $(npm -v) найден"

# Проверка наличия React Native CLI
if ! command -v npx &> /dev/null; then
    echo "❌ npx не установлен"
    exit 1
fi

echo "✅ npx найден"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"

# Проверка платформы
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Обнаружена macOS"
    
    # Проверка наличия Xcode
    if ! command -v xcodebuild &> /dev/null; then
        echo "⚠️  Xcode не найден. Установите Xcode для разработки под iOS"
    else
        echo "✅ Xcode найден"
        
        # Установка iOS зависимостей
        echo "📱 Установка iOS зависимостей..."
        cd ios && pod install && cd ..
        
        if [ $? -ne 0 ]; then
            echo "⚠️  Ошибка при установке iOS зависимостей"
        else
            echo "✅ iOS зависимости установлены"
        fi
    fi
    
    # Проверка наличия Android Studio
    if [ -d "$HOME/Library/Android/sdk" ]; then
        echo "✅ Android SDK найден"
    else
        echo "⚠️  Android SDK не найден. Установите Android Studio для разработки под Android"
    fi
else
    # Linux/Windows
    echo "🐧 Обнаружена Linux/Windows система"
    
    # Проверка наличия Android Studio
    if [ -d "$HOME/Android/Sdk" ] || [ -d "$ANDROID_HOME" ]; then
        echo "✅ Android SDK найден"
    else
        echo "⚠️  Android SDK не найден. Установите Android Studio для разработки под Android"
    fi
fi

# Создание .env файла
if [ ! -f ".env" ]; then
    echo "📝 Создание .env файла..."
    cat > .env << EOF
# API Configuration
API_BASE_URL=https://mindarity.ru/api
API_TIMEOUT=30000

# App Configuration
APP_NAME=Mindarity
APP_VERSION=0.1.0
APP_ENV=development

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Notifications
PUSH_NOTIFICATIONS_ENABLED=true
PUSH_SERVER_KEY=your-push-server-key-here

# Analytics
ANALYTICS_ENABLED=false
ANALYTICS_KEY=your-analytics-key-here

# Debug
DEBUG_MODE=true
LOG_LEVEL=debug
EOF
    echo "✅ .env файл создан"
else
    echo "✅ .env файл уже существует"
fi

# Создание папки для ассетов
mkdir -p assets/fonts
mkdir -p assets/images
mkdir -p assets/icons

echo "✅ Папки для ассетов созданы"

# Проверка Metro bundler
echo "🔍 Проверка Metro bundler..."
npx react-native start --reset-cache --port 8081 &
METRO_PID=$!

# Ждем запуска Metro
sleep 10

# Проверяем, запустился ли Metro
if kill -0 $METRO_PID 2>/dev/null; then
    echo "✅ Metro bundler запущен на порту 8081"
    kill $METRO_PID
else
    echo "❌ Ошибка запуска Metro bundler"
fi

echo ""
echo "🎉 Настройка завершена!"
echo ""
echo "📱 Для запуска приложения используйте:"
echo "   npm run android    # Запуск на Android"
echo "   npm run ios        # Запуск на iOS (только macOS)"
echo "   npm start          # Запуск Metro bundler"
echo ""
echo "🔧 Дополнительные команды:"
echo "   npm test           # Запуск тестов"
echo "   npm run lint       # Проверка кода"
echo "   npm run build      # Сборка приложения"
echo ""
echo "📚 Документация:"
echo "   - React Native: https://reactnative.dev/"
echo "   - React Navigation: https://reactnavigation.org/"
echo "   - React Native Paper: https://callstack.github.io/react-native-paper/"
echo ""
echo "🚀 Удачи в разработке!"
