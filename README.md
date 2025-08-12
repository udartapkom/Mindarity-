# Mindarity - Веб-приложение-дневник с управлением целями и задачами

## Описание проекта

Mindarity - это полнофункциональное веб-приложение для ведения личного дневника, управления целями и задачами. Проект включает в себя веб-интерфейс, серверную часть и мобильное приложение.

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
- **Material-UI** - UI компоненты
- **Redux Toolkit** - управление состоянием
- **React Query** - управление серверным состоянием
- **React Router** - роутинг

### Инфраструктура
- **Docker** - контейнеризация
- **Nginx** - reverse proxy
- **Jenkins** - CI/CD
- **Prometheus + Grafana** - мониторинг

## Быстрый старт

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

2. **Настройка переменных окружения**
   ```bash
   # Создайте файл .env в корне проекта
   cp .env.example .env
   # Отредактируйте .env файл под ваши нужды
   ```

3. **Запуск всех сервисов**
   ```bash
   docker-compose up -d
   ```

4. **Проверка статуса**
   ```bash
   docker-compose ps
   ```

### Доступ к сервисам

После запуска будут доступны следующие сервисы:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Keycloak**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **Elasticsearch**: http://localhost:9200
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Учетные данные по умолчанию

#### Keycloak
- **Админ**: admin / admin123
- **URL**: http://localhost:8080

#### MinIO
- **Access Key**: minioadmin
- **Secret Key**: minioadmin123
- **Console**: http://localhost:9001

#### PostgreSQL
- **Database**: mindarity
- **User**: mindarity_user
- **Password**: mindarity_password

## Разработка

### Локальная разработка

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Структура проекта

```
Mindarity/
├── backend/                 # NestJS приложение
│   ├── src/
│   │   ├── auth/           # Аутентификация
│   │   ├── users/          # Пользователи
│   │   ├── events/         # События/мысли
│   │   ├── goals/          # Цели и задачи
│   │   ├── files/          # Управление файлами
│   │   └── common/         # Общие модули
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Утилиты
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Nginx конфигурация
├── docker-compose.yml      # Docker Compose
├── infrastructure-requirements.md
└── README.md
```

## API Документация

После запуска backend, API документация будет доступна по адресу:
- **Swagger UI**: http://localhost:3001/api

## Мониторинг

### Prometheus
- **URL**: http://localhost:9090
- Метрики приложения и системные метрики

### Grafana
- **URL**: http://localhost:3000
- Дашборды для мониторинга

## Развертывание в продакшене

### Требования к серверу

- **Минимальные**: 4GB RAM, 2 CPU, 50GB SSD
- **Рекомендуемые**: 8GB RAM, 4 CPU, 100GB SSD
- **ОС**: Ubuntu 22.04 LTS

### Шаги развертывания

1. **Подготовка сервера**
   ```bash
   # Обновление системы
   sudo apt update && sudo apt upgrade -y
   
   # Установка Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Установка Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Настройка домена и SSL**
   ```bash
   # Установка Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Получение SSL сертификата
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Развертывание приложения**
   ```bash
   # Клонирование проекта
   git clone <repository-url>
   cd Mindarity
   
   # Настройка переменных окружения
   cp .env.example .env
   # Отредактируйте .env для продакшена
   
   # Запуск
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Безопасность

### Рекомендации

1. **Изменение паролей по умолчанию**
2. **Настройка файрвола**
3. **Регулярные обновления**
4. **Мониторинг логов**
5. **Резервное копирование**

### Настройка файрвола

```bash
# Установка UFW
sudo apt install ufw

# Настройка правил
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Поддержка

### Логи

```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart backend

# Обновление образов
docker-compose pull
docker-compose up -d

# Очистка неиспользуемых ресурсов
docker system prune -a
```

## Лицензия

MIT License

## Авторы

- Проект: Mindarity 