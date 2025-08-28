# Mindarity - Система управления задачами и целями

## Описание проекта

Mindarity - это современное веб-приложение для управления задачами, целями и проектами. Система предоставляет комплексный подход к планированию и отслеживанию прогресса с расширенными возможностями безопасности и мониторинга.

## Основной функционал

### 👤 Пользовательские возможности
- **Регистрация и авторизация** с CAPTCHA-защитой
- **Двухфакторная аутентификация (2FA)** с OTP-кодами
- **Управление профилем** с загрузкой аватаров
- **Сессионное управление** с возможностью завершения сессий на других устройствах

### 📋 Управление задачами и целями
- **Создание и редактирование целей** с категоризацией
- **Управление задачами** с привязкой к целям
- **Отслеживание прогресса** с визуализацией статистики
- **Календарь событий** для планирования

### 📁 Файловое хранилище
- **Загрузка больших файлов** с контролем ресурсов
- **S3-совместимое хранилище** (MinIO)
- **Управление файлами** с возможностью удаления
- **Мониторинг дискового пространства**

### 🔒 Система безопасности
- **Мониторинг неудачных попыток входа** с блокировкой по IP
- **Отслеживание системных ресурсов** (CPU, RAM, диск)
- **Система предупреждений** для администраторов
- **Управление безопасностью** с возможностью удаления алертов

### 👨‍💼 Административные функции
- **Панель администратора** с расширенной статистикой
- **Управление пользователями** и их ролями
- **Мониторинг системы** в реальном времени
- **Управление безопасностью** и алертами

## Технологический стек

### Backend
- **NestJS** - современный Node.js фреймворк
- **TypeScript** - типизированный JavaScript
- **PostgreSQL** - основная база данных
- **TypeORM** - ORM для работы с базой данных
- **Redis** - кэширование и сессии
- **MinIO** - S3-совместимое объектное хранилище
- **JWT** - аутентификация и авторизация
- **Passport** - стратегии аутентификации
- **Swagger** - API документация

### Frontend
- **React** - пользовательский интерфейс
- **TypeScript** - типизированный JavaScript
- **SCSS** - стилизация компонентов
- **Axios** - HTTP-клиент
- **React Router** - маршрутизация

### Инфраструктура
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация контейнеров
- **Nginx** - веб-сервер и обратный прокси
- **Let's Encrypt** - SSL-сертификаты
- **PM2** - управление процессами

### Безопасность
- **bcrypt** - хеширование паролей
- **Helmet** - защита HTTP-заголовков
- **CORS** - настройка кросс-доменных запросов
- **Rate Limiting** - ограничение частоты запросов
- **Input Validation** - валидация входных данных

## Структура проекта

```
Mindarity_new/
├── backend/                 # Backend приложение (NestJS)
│   ├── src/
│   │   ├── modules/         # Модули приложения
│   │   ├── config/          # Конфигурация
│   │   ├── database/        # Миграции и сущности
│   │   └── main.ts          # Точка входа
│   ├── Dockerfile           # Docker образ для backend
│   └── package.json         # Зависимости backend
├── frontend/                # Frontend приложение (React)
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── services/        # API сервисы
│   │   └── styles/          # Стили
│   ├── Dockerfile           # Docker образ для frontend
│   └── package.json         # Зависимости frontend
├── nginx/                   # Конфигурация Nginx
├── docker-compose.yml       # Docker Compose конфигурация
└── README.md               # Документация
```

## Установка и развертывание

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Git

### Локальная разработка (актуально)

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd Mindarity-
```

2. **Запуск dev-стека**
Есть готовый скрипт:
```bash
./scripts/dev.sh
```
Либо вручную:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

3. **Доступ к сервисам**
- Frontend (Vite): http://localhost:5173
- Backend API (NestJS): http://localhost:3000
- Swagger: http://localhost:3000/api
- Postgres: localhost:5432 (DB: mindarity_dev, user: mindarity_user, pass: mindarity_password)
- Redis: localhost:6379
- Elasticsearch: http://localhost:9200
- MinIO API/Console: http://localhost:9000 / http://localhost:9001 (minioadmin / minioadmin123)
- Mailhog UI (SMTP тесты): http://localhost:8025

Примечания по dev:
- Бэкенд и фронтенд работают в контейнерах c hot-reload (npm ci && npm run dev).
- CORS для фронта уже настроен на http://localhost:5173.
- Загрузка аватара пишет в bucket `mindarity` в MinIO; публичные ссылки формируются на `http://localhost:9000`.
- База dev — `mindarity_dev`; миграции не требуются (в dev включён synchronize).

### Развертывание на сервере

#### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

#### 2. Настройка домена и SSL

```bash
# Установка Nginx
sudo apt install nginx -y

# Настройка домена
sudo nano /etc/nginx/sites-available/mindarity
```

Конфигурация Nginx:
```nginx
server {
    listen 80;
    server_name mindarity.ru www.mindarity.ru;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/mindarity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Установка SSL сертификата
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d mindarity.ru -d www.mindarity.ru
```

#### 3. Развертывание приложения

```bash
# Клонирование проекта
git clone <repository-url> /root/mindarity
cd /root/mindarity

# Настройка переменных окружения
nano backend/.env
nano frontend/.env

# Запуск приложения
docker-compose up --build -d

# Применение миграций
docker-compose exec backend npx typeorm migration:run --dataSource dist/config/configuration.js
```

#### 4. Настройка автозапуска

```bash
# Создание systemd сервиса
sudo nano /etc/systemd/system/mindarity.service
```

Содержимое файла:
```ini
[Unit]
Description=Mindarity Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/mindarity
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Активация сервиса
sudo systemctl enable mindarity.service
sudo systemctl start mindarity.service
```

## Конфигурация

### Переменные окружения Backend (.env)

```env
# База данных
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=mindarity_user
DATABASE_PASSWORD=mindarity_password
DATABASE_NAME=mindarity

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=mindarity
MINIO_PUBLIC_URL=https://mindarity.ru/minio

# Приложение
PORT=3000
NODE_ENV=production
```

### Переменные окружения Frontend (Vite)

В Docker dev передаётся через `docker-compose.dev.yml`:
```
VITE_API_URL=http://localhost:3000
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_MINIO_PUBLIC_URL=http://localhost:9000
```

## API Endpoints

### Аутентификация
- `POST /auth/login` - Вход в систему
- `POST /auth/register` - Регистрация
- `POST /auth/2fa/verify` - Подтверждение 2FA
- `POST /auth/logout` - Выход из системы

### Пользователи
- `GET /users/profile` - Получение профиля
- `PUT /users/profile` - Обновление профиля
- `POST /users/avatar` - Загрузка аватара
- `DELETE /users/sessions` - Завершение сессий

### Задачи и цели
- `GET /goals` - Список целей
- `POST /goals` - Создание цели
- `PUT /goals/:id` - Обновление цели
- `DELETE /goals/:id` - Удаление цели
- `GET /tasks` - Список задач
- `POST /tasks` - Создание задачи
- `PUT /tasks/:id` - Обновление задачи
- `DELETE /tasks/:id` - Удаление задачи

### Файлы
- `POST /files/upload` - Загрузка файла
- `POST /files/upload-large` - Загрузка больших файлов
- `GET /files` - Список файлов
- `DELETE /files/:id` - Удаление файла

### Мониторинг (только для админов)
- `GET /monitoring/system` - Системные метрики
- `GET /monitoring/security/alerts` - Алерты безопасности
- `DELETE /monitoring/security/alerts/failed-logins/:username/:ipAddress` - Удаление алерта

## Мониторинг и логирование

### Системные метрики
- CPU использование
- Потребление памяти
- Дисковое пространство
- Состояние сервисов (PostgreSQL, Redis, MinIO)

### Логирование
- Структурированные логи с Winston
- Ротация логов
- Централизованный сбор логов

### Алерты безопасности
- Отслеживание неудачных попыток входа
- Мониторинг системных ресурсов
- Уведомления администраторов

## Безопасность

### Аутентификация и авторизация
- JWT токены с ограниченным временем жизни
- Двухфакторная аутентификация
- Ролевая модель доступа (USER, ADMIN, SUPER_ADMIN)
- Безопасное хранение паролей с bcrypt

### Защита от атак
- Rate limiting для API endpoints
- Валидация входных данных
- Защита от SQL-инъекций
- CORS настройки
- Helmet для защиты HTTP-заголовков

### Мониторинг безопасности
- Отслеживание подозрительной активности
- Блокировка IP-адресов при множественных неудачных попытках
- Логирование событий безопасности

## Разработка

### Структура кода
- Модульная архитектура NestJS
- Разделение ответственности (SRP)
- Dependency Injection
- TypeScript для типизации

### Тестирование
- Unit тесты с Jest
- E2E тесты
- Интеграционные тесты

### CI/CD
- Автоматические тесты
- Сборка Docker образов
- Развертывание на сервере

## Поддержка и обслуживание

### Резервное копирование
```bash
# Резервное копирование базы данных (dev)
docker compose exec postgres pg_dump -U mindarity_user mindarity_dev > backup.sql

# Восстановление базы данных (dev)
docker compose exec -T postgres psql -U mindarity_user mindarity_dev < backup.sql
```

### Обновление приложения
```bash
# Остановка приложения
docker compose down

# Обновление кода
git pull origin main

# Пересборка и запуск
docker compose up --build -d

# Применение новых миграций (если отключён synchronize)
docker compose exec backend npx typeorm migration:run --dataSource dist/config/configuration.js
```

### Мониторинг логов
```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Лицензия

Этот проект разработан для образовательных целей.

## Контакты

Для получения поддержки или предложений по улучшению проекта, пожалуйста, создайте issue в репозитории проекта. 