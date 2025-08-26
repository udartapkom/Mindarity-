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

### Локальная разработка

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd Mindarity_new
```

2. **Настройка переменных окружения**
```bash
# Создайте .env файлы в backend/ и frontend/
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Запуск с помощью Docker Compose**
```bash
docker-compose up --build -d
```

4. **Применение миграций базы данных**
```bash
docker-compose exec backend npx typeorm migration:run --dataSource dist/config/configuration.js
```

5. **Доступ к приложению**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger документация: http://localhost:3001/api

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
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
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
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mindarity

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET_NAME=mindarity-files

# Приложение
PORT=3001
NODE_ENV=production
```

### Переменные окружения Frontend (.env)

```env
REACT_APP_API_URL=https://mindarity.ru/api
REACT_APP_WS_URL=wss://mindarity.ru
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
# Резервное копирование базы данных
docker-compose exec postgres pg_dump -U postgres mindarity > backup.sql

# Восстановление базы данных
docker-compose exec -T postgres psql -U postgres mindarity < backup.sql
```

### Обновление приложения
```bash
# Остановка приложения
docker-compose down

# Обновление кода
git pull origin main

# Пересборка и запуск
docker-compose up --build -d

# Применение новых миграций
docker-compose exec backend npx typeorm migration:run --dataSource dist/config/configuration.js
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