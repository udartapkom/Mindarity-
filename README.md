# Mindarity - Веб-приложение-дневник с управлением целями и задачами

## Описание проекта

Mindarity - это полнофункциональное веб-приложение для ведения личного дневника, управления целями и задачами. Проект включает в себя веб-интерфейс и серверную часть.

## Технологии

### Backend
- **NestJS** - основной фреймворк
- **PostgreSQL** - основная база данных
- **Redis** - кэширование и сессии
- **Elasticsearch** - полнотекстовый поиск
- **MinIO** - объектовое хранилище файлов
- **Keycloak** - аутентификация и авторизация

### Frontend
- **React** - основной фреймворк
- **TypeScript** - типизация
- **SCSS** - стилизация
- **Axios** - HTTP клиент

### Инфраструктура
- **Docker** - контейнеризация
- **Nginx** - reverse proxy

## 🚀 Быстрый старт

### Предварительные требования

1. **Docker и Docker Compose**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

2. **Node.js 18+**
   ```bash
   # Установка через nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

### Запуск проекта

1. **Клонирование репозитория**
   ```bash
   git clone <repository-url>
   cd Mindarity
   ```

2. **Запуск сервисов**
   ```bash
   docker-compose up --build
   ```

3. **Доступные сервисы**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Keycloak**: http://localhost:8080
   - **MinIO Console**: http://localhost:9001
   - **Elasticsearch**: http://localhost:9200
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379

## 📁 Структура проекта

```
Mindarity/
├── backend/          # NestJS сервер
├── frontend/         # React приложение
├── nginx/            # Nginx конфигурации
├── docker-compose.yml # Docker конфигурация
└── README.md         # Документация
```

## 🔧 Разработка

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 👑 Супер админ

При развёртывании автоматически создаётся учётная запись супер админа:

## 🔐 Новые функции безопасности

### Двухфакторная аутентификация (2FA)
- **TOTP алгоритм**: Поддержка стандартных приложений (Google Authenticator, Authy)
- **QR коды**: Автоматическая генерация QR кодов для настройки
- **Резервные коды**: 10 резервных кодов для восстановления доступа
- **API эндпоинты**: `/users/profile/enable-2fa`, `/users/profile/verify-2fa`

### OAuth интеграция
- **Поддержка провайдеров**: Google, GitHub, Keycloak
- **Автоматическая настройка**: Динамическое определение доступных провайдеров
- **Callback URLs**: Настраиваемые URL для OAuth flow
- **API эндпоинты**: `/oauth/providers`, `/oauth/auth/:provider`

### CAPTCHA защита
- **Google reCAPTCHA**: Интеграция с Google reCAPTCHA v2/v3
- **hCaptcha**: Альтернативная CAPTCHA система
- **Автоматическая проверка**: При входе и регистрации
- **Настраиваемые ключи**: Через переменные окружения

## 🔍 Улучшенный поиск

### Elasticsearch интеграция
- **Автоматическая индексация**: События, цели и задачи
- **Русский анализ**: Поддержка русских стоп-слов и стемминга
- **Fuzzy search**: Нечеткий поиск с автокоррекцией
- **Relevance scoring**: Ранжирование результатов по релевантности
- **Highlighting**: Подсветка найденных терминов

### Поисковые возможности
- **Полнотекстовый поиск**: По заголовкам, содержимому и описанию
- **Фильтрация**: По типу, дате, тегам, эмоциональным реакциям
- **Сортировка**: По релевантности, дате, заголовку
- **Пагинация**: Поддержка больших результатов

## ⏰ Расширенный планировщик

### Автоматические задачи
- **Проверка просроченных**: Ежедневная проверка целей и задач
- **Отслеживание прогресса**: Автоматическое обновление прогресса целей
- **Уведомления**: Система уведомлений о важных событиях
- **Ежемесячные отчеты**: Автоматическая генерация отчетов

### Пользовательские задачи
- **Cron выражения**: Гибкая настройка расписания
- **Динамическое управление**: Добавление/удаление задач на лету
- **Мониторинг**: Отслеживание выполнения задач
- **Retry логика**: Повторные попытки при ошибках

- **Email**: `admin@mindarity.ru`
- **Username**: `superadmin`  
- **Password**: `SuperAdmin123!`

Подробная документация: [SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)

## 📝 Лицензия

MIT License 