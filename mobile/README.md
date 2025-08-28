# Mindarity Mobile App

Мобильное приложение Mindarity на React Native, которое повторяет весь функционал веб-приложения.

## 🚀 Быстрый старт

### Автоматическая настройка

```bash
# Перейдите в папку mobile
cd mobile

# Запустите скрипт автоматической настройки
./scripts/setup.sh
```

### Ручная настройка

```bash
# Установка зависимостей
npm install

# Для iOS (только macOS)
cd ios && pod install && cd ..

# Запуск Metro bundler
npm start

# В новом терминале - запуск на Android
npm run android

# Или для iOS (только macOS)
npm run ios
```

## 📱 Возможности

- **Аутентификация**: Вход, регистрация, 2FA
- **Дашборд**: Обзор статистики и прогресса
- **События**: Управление событиями, мыслями, воспоминаниями
- **Цели**: Постановка и отслеживание целей
- **Задачи**: Управление задачами с приоритетами
- **Файлы**: Загрузка, управление и обмен файлами
- **Профиль**: Управление личными данными
- **Админ панель**: Управление пользователями и системой

## 🛠 Технологии

- **React Native** 0.73.6
- **TypeScript** 5.0.4
- **React Navigation** 6.x (Stack, Tabs, Drawer)
- **React Native Paper** (Material Design UI)
- **Axios** для API запросов
- **AsyncStorage** для локального хранения
- **React Native Vector Icons** для иконок
- **React Native Image Picker** для выбора изображений
- **React Native Document Picker** для выбора файлов
- **React Native Chart Kit** для графиков
- **Jest** для тестирования
- **ESLint** для линтинга

## 📋 Требования

### Системные требования
- **Node.js** 18.0.0 или выше
- **npm** 9.0.0 или выше
- **React Native CLI** (устанавливается автоматически)

### Для Android
- **Android Studio** 4.0 или выше
- **Android SDK** API 21 или выше
- **Android NDK** (опционально)
- **Java Development Kit (JDK)** 11 или выше

### Для iOS (только macOS)
- **Xcode** 14.0 или выше
- **CocoaPods** 1.12.0 или выше
- **iOS Simulator** или физическое устройство

## 🔧 Установка и настройка

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd Mindarity-/mobile
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения

#### Android
1. Установите Android Studio
2. Настройте Android SDK
3. Создайте Android Virtual Device (AVD) или подключите физическое устройство
4. Установите переменные окружения:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### iOS (только macOS)
1. Установите Xcode из App Store
2. Установите CocoaPods: `sudo gem install cocoapods`
3. Установите iOS зависимости:
```bash
cd ios
pod install
cd ..
```

### 4. Настройка API
Приложение настроено на использование API по адресу `https://mindarity.ru/api`. 
Убедитесь, что API доступен и работает корректно.

## 🚀 Запуск приложения

### Запуск Metro bundler
```bash
npm start
# или
npx react-native start
```

### Запуск на Android
```bash
npm run android
# или
npx react-native run-android
```

### Запуск на iOS (только macOS)
```bash
npm run ios
# или
npx react-native run-ios
```

### Запуск на конкретном устройстве
```bash
# Android
npx react-native run-android --deviceId <device-id>

# iOS
npx react-native run-ios --simulator="iPhone 14"
```

## 📁 Структура проекта

```
mobile/
├── android/                 # Android настройки
├── ios/                    # iOS настройки
├── src/
│   ├── components/         # Переиспользуемые компоненты
│   ├── contexts/           # React Context
│   ├── navigation/         # Навигация
│   ├── screens/            # Экраны приложения
│   ├── services/           # API сервисы
│   ├── theme/              # Тема приложения
│   ├── types/              # TypeScript типы
│   ├── utils/              # Утилиты
│   ├── helpers/            # Хелперы
│   └── constants/          # Константы
├── assets/                 # Статические ресурсы
├── scripts/                # Скрипты
├── package.json            # Зависимости
├── metro.config.js         # Metro конфигурация
├── babel.config.js         # Babel конфигурация
├── tsconfig.json           # TypeScript конфигурация
└── README.md               # Документация
```

## 🔌 API интеграция

Приложение использует следующие API endpoints:

- **Аутентификация**: `/auth/login`, `/auth/register`, `/auth/2fa`
- **Пользователи**: `/users/profile`, `/users/update`
- **События**: `/events`, `/events/:id`
- **Цели**: `/goals`, `/goals/:id`
- **Задачи**: `/tasks`, `/tasks/:id`
- **Файлы**: `/files`, `/files/:id`, `/files/upload`
- **Поиск**: `/search`
- **Админ**: `/admin/users`, `/admin/sessions`, `/admin/alerts`

## 🧪 Тестирование

### Запуск тестов
```bash
npm test                    # Запуск всех тестов
npm test -- --watch        # Запуск в режиме наблюдения
npm test -- --coverage     # С покрытием кода
```

### Структура тестов
```
src/
├── __tests__/             # Тесты
├── components/
│   └── __tests__/         # Тесты компонентов
└── services/
    └── __tests__/         # Тесты сервисов
```

## 📱 Сборка для продакшена

### Android APK
```bash
cd android
./gradlew assembleRelease
```

### Android AAB (для Google Play)
```bash
cd android
./gradlew bundleRelease
```

### iOS (только macOS)
1. Откройте проект в Xcode
2. Выберите схему Release
3. Product → Archive

## 🔒 Безопасность

- JWT токены для аутентификации
- 2FA поддержка
- Биометрическая аутентификация
- Шифрование чувствительных данных
- Проверка разрешений
- Валидация входных данных

## 📊 Производительность

- Оптимизированные изображения
- Ленивая загрузка компонентов
- Кэширование API ответов
- Оптимизация списков
- Сжатие данных

## 🐛 Отладка

### React Native Debugger
```bash
# Установка
npm install -g react-native-debugger

# Запуск
react-native-debugger
```

### Flipper (только для разработки)
Flipper включен по умолчанию для отладки.

### Логирование
```bash
# Android
adb logcat | grep ReactNativeJS

# iOS
xcrun simctl spawn booted log stream --predicate 'subsystem contains "com.facebook.react.log"'
```

## 📚 Документация

- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Создайте новое Issue с описанием проблемы
3. Укажите версии Node.js, React Native и платформы
4. Приложите логи ошибок

## 🎯 Дорожная карта

- [ ] Push уведомления
- [ ] Офлайн режим
- [ ] Темная тема
- [ ] Многоязычность
- [ ] Аналитика
- [ ] A/B тестирование
- [ ] Автоматические тесты
- [ ] CI/CD pipeline

---

**Удачи в разработке! 🚀**
