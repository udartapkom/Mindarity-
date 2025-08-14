# 🚀 CI/CD Процесс для проекта Mindarity

## 📋 Обзор

Данный документ описывает настройку и использование CI/CD процесса на базе Jenkins для проекта Mindarity, в соответствии с требованиями из "Требования.md".

## 🎯 Требования к CI/CD

### ✅ Реализованные функции:
1. **Автоматическая сборка проектов** - Jenkins pipeline автоматически собирает backend и frontend
2. **Развертывание версий проектов** - Автоматическое развертывание в dev, staging и production
3. **Отображение версии в интерфейсе** - Автоматическое обновление версии после деплоя
4. **Мониторинг состояния системы** - Полная система мониторинга с дашбордами

### 📊 Дашборды мониторинга:
1. **Потребление ресурсов сервера**: ОЗУ, CPU, GPU, ПЗУ
2. **Список процессов проекта**: Мониторинг потребления ресурсов каждым процессом
3. **Мониторинг сторонних API**: Проверка доступности внешних сервисов

## 🏗️ Архитектура CI/CD

### Jenkins Pipeline Stages:
```
Checkout → Code Quality → Security Scan → Build → Deploy → Post-Deployment Tests
```

### Окружения развертывания:
- **DEV** (`develop` ветка) - Автоматическое развертывание
- **STAGING** (`main` ветка) - Автоматическое развертывание
- **PRODUCTION** (`main` ветка) - С подтверждением оператора

## 🛠️ Установка и настройка

### 1. Предварительные требования
```bash
# Установка Docker и Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

### 2. Настройка Jenkins
```bash
# Запуск скрипта настройки
chmod +x scripts/setup-jenkins.sh
./scripts/setup-jenkins.sh

# Запуск Jenkins
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

### 3. Настройка Jenkins
1. Откройте `http://localhost:8080`
2. Получите пароль: `docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`
3. Установите рекомендуемые плагины
4. Создайте администратора

### 4. Установка необходимых плагинов
- Docker Pipeline
- Docker plugin
- Pipeline: GitHub
- Slack Notification
- Prometheus metrics
- Blue Ocean (опционально)

### 5. Настройка Credentials
1. **Docker Registry**: Добавьте credentials для вашего Docker registry
2. **GitHub**: Настройте SSH ключи или токены доступа
3. **Slack**: Настройте webhook для уведомлений

## 🔧 Конфигурация Pipeline

### Jenkinsfile
Основной файл конфигурации CI/CD находится в корне проекта: `Jenkinsfile`

### Переменные окружения
Создайте файлы `.env.dev`, `.env.staging`, `.env.prod` с соответствующими настройками.

### Docker Compose файлы
- `docker-compose.dev.yml` - Конфигурация для dev окружения
- `docker-compose.staging.yml` - Конфигурация для staging
- `docker-compose.prod.yml` - Конфигурация для production
- `docker-compose.traefik.yml` - Основная конфигурация с Traefik

## 📊 Система мониторинга

### Компоненты:
- **Prometheus** - Сбор метрик
- **Grafana** - Визуализация и дашборды
- **Node Exporter** - Системные метрики
- **cAdvisor** - Метрики Docker контейнеров
- **Alertmanager** - Управление алертами

### Запуск мониторинга:
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### Доступ к дашбордам:
- **Grafana**: `http://localhost:3001` (admin/admin123)
- **Prometheus**: `http://localhost:9090`
- **Alertmanager**: `http://localhost:9093`

## 🚀 Развертывание

### Автоматическое развертывание:
1. **Push в `develop`** → Автоматический деплой в DEV
2. **Push в `main`** → Автоматический деплой в STAGING
3. **Merge Request в `main`** → Подтверждение → Деплой в PRODUCTION

### Ручное развертывание:
```bash
# Dev окружение
./scripts/deploy.sh dev

# Staging окружение
./scripts/deploy.sh staging

# Production окружение
./scripts/deploy.sh prod
```

## 🔒 Безопасность

### SSL/TLS сертификаты:
- Автоматическое получение через Let's Encrypt
- Traefik как reverse proxy
- Принудительное перенаправление на HTTPS

### Аутентификация:
- JWT токены для API
- OAuth интеграция (Google, GitHub, Keycloak)
- 2FA для администраторов

### Мониторинг безопасности:
- Алерты о множественных неудачных попытках входа
- Мониторинг IP адресов
- Логирование всех действий

## 📈 Метрики и алерты

### Системные алерты:
- CPU > 85% → Warning
- RAM > 85% → Warning
- Диск > 85% → Warning
- GPU > 85% → Warning (если доступно)

### Прикладные алерты:
- Backend недоступен → Critical
- Frontend недоступен → Critical
- База данных недоступна → Critical
- Высокая нагрузка на API → Warning

### Уведомления:
- Slack каналы для разных типов алертов
- Email уведомления для критических алертов
- Автоматическое разрешение алертов

## 🧪 Тестирование

### Типы тестов:
1. **Unit тесты** - Backend и Frontend
2. **Integration тесты** - API endpoints
3. **E2E тесты** - Полный пользовательский сценарий
4. **Security тесты** - Сканирование уязвимостей

### Запуск тестов:
```bash
# Backend тесты
cd backend && npm run test

# Frontend тесты
cd frontend && npm run test

# E2E тесты
npm run test:e2e
```

## 🔄 Backup и восстановление

### Автоматические backup:
- База данных PostgreSQL
- MinIO объекты
- Elasticsearch индексы
- Конфигурационные файлы

### Восстановление:
```bash
# Восстановление из backup
./scripts/restore.sh <backup_directory>
```

## 📝 Логирование

### Уровни логирования:
- **DEV**: DEBUG
- **STAGING**: INFO
- **PRODUCTION**: WARN

### Централизованное логирование:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Ротация логов
- Архивирование старых логов

## 🚨 Troubleshooting

### Частые проблемы:

1. **Jenkins не может подключиться к Docker**
   ```bash
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

2. **Проблемы с SSL сертификатами**
   ```bash
   # Проверка Traefik логов
   docker logs mindarity-traefik
   ```

3. **Проблемы с мониторингом**
   ```bash
   # Проверка Prometheus
   curl http://localhost:9090/-/healthy
   
   # Проверка Grafana
   curl http://localhost:3001/api/health
   ```

### Полезные команды:
```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Перезапуск конкретного сервиса
docker-compose restart backend

# Проверка состояния сервисов
docker-compose ps

# Очистка неиспользуемых ресурсов
docker system prune -a
```

## 📚 Дополнительные ресурсы

### Документация:
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

### Полезные ссылки:
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Обратитесь к разделу Troubleshooting
3. Создайте issue в репозитории проекта
4. Обратитесь к команде DevOps

---

**Версия документа**: 1.0  
**Последнее обновление**: $(date)  
**Автор**: DevOps Team
