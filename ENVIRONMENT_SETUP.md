# Настройка окружений для Mindarity

## Обзор

Проект поддерживает два основных окружения:
- **Development** - для локальной разработки (localhost)
- **Production** - для продакшн сервера (mindarity.ru с SSL)

## Структура файлов

```
Mindarity_new/
├── env.development          # Переменные для разработки
├── env.production           # Переменные для продакшена
├── frontend/
│   ├── env.development      # Переменные фронтенда для разработки
│   └── env.production       # Переменные фронтенда для продакшена
├── scripts/
│   ├── dev.sh              # Скрипт запуска разработки
│   └── prod.sh             # Скрипт запуска продакшена
└── nginx/
    ├── nginx.conf          # Конфигурация для разработки
    └── nginx.prod.conf     # Конфигурация для продакшена
```

## Development Environment (Разработка)

### Запуск
```bash
# Использование скрипта
chmod +x scripts/dev.sh
./scripts/dev.sh

# Или вручную
docker-compose up -d
```

### Доступные сервисы
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Keycloak**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **Elasticsearch**: http://localhost:9200
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Переменные окружения
Основные переменные для разработки находятся в `env.development`:
- `CORS_ORIGIN=http://localhost:5173`
- `API_BASE_URL=http://localhost:3000`
- `KEYCLOAK_URL=http://localhost:8080`

## Production Environment (Продакшен)

### Предварительные требования

1. **SSL сертификаты**
   ```bash
   # Создайте директорию для SSL
   mkdir -p nginx/ssl
   
   # Поместите ваши сертификаты:
   # - nginx/ssl/fullchain.pem
   # - nginx/ssl/privkey.pem
   ```

2. **Переменные окружения**
   Создайте файл `.env` в корне проекта с продакшн переменными:
   ```bash
   # Database
   POSTGRES_USER=your_prod_user
   POSTGRES_PASSWORD=your_secure_password
   
   # MinIO
   MINIO_ACCESS_KEY=your_minio_access_key
   MINIO_SECRET_KEY=your_minio_secret_key
   
   # Keycloak
   KEYCLOAK_ADMIN=admin
   KEYCLOAK_ADMIN_PASSWORD=your_secure_password
   KEYCLOAK_CLIENT_SECRET=your_client_secret
   
   # JWT
   JWT_SECRET=your_super_secure_jwt_secret
   
   # Email
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_app_password
   
   # Docker Registry (опционально)
   DOCKER_REGISTRY=your_registry
   VERSION=1.0.0
   ```

### Запуск
```bash
# Использование скрипта
chmod +x scripts/prod.sh
./scripts/prod.sh

# Или вручную
docker-compose -f docker-compose.prod.yml up -d
```

### Доступные сервисы
- **Frontend**: https://mindarity.ru
- **Backend API**: https://mindarity.ru/api
- **Keycloak**: https://mindarity.ru/auth
- **MinIO Console**: https://mindarity.ru/minio

### Переменные окружения
Основные переменные для продакшена находятся в `env.production`:
- `CORS_ORIGIN=https://mindarity.ru`
- `API_BASE_URL=https://mindarity.ru/api`
- `KEYCLOAK_URL=https://mindarity.ru/auth`
- `DOMAIN=mindarity.ru`
- `SSL_ENABLED=true`

## Локальная разработка без Docker

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

## Переключение между окружениями

### Для разработки
```bash
# Остановить продакшн
docker-compose -f docker-compose.prod.yml down

# Запустить разработку
./scripts/dev.sh
```

### Для продакшена
```bash
# Остановить разработку
docker-compose down

# Запустить продакшен
./scripts/prod.sh
```

## Мониторинг

### Development
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### Production
- Prometheus: http://localhost:9090 (внутренний доступ)
- Grafana: http://localhost:3001 (внутренний доступ)

## Безопасность

### Development
- Все сервисы доступны на localhost
- Базовые настройки безопасности
- Отладочные логи включены

### Production
- SSL/TLS шифрование
- Строгие заголовки безопасности
- Rate limiting
- Мониторинг и логирование
- Внутренний доступ к мониторингу

## Troubleshooting

### Проблемы с SSL
```bash
# Проверить наличие сертификатов
ls -la nginx/ssl/

# Проверить права доступа
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

### Проблемы с переменными окружения
```bash
# Проверить загрузку переменных
docker-compose config

# Проверить переменные в контейнере
docker exec -it mindarity-backend env | grep API
```

### Проблемы с CORS
Убедитесь, что `CORS_ORIGIN` в переменных окружения соответствует URL фронтенда:
- Development: `http://localhost:5173`
- Production: `https://mindarity.ru`
