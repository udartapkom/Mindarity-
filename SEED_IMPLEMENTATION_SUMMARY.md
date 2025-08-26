# 🌱 Реализация Seed функциональности для Mindarity

## ✅ Что реализовано

### 1. **Seed модуль** (`backend/src/modules/seed/`)
- `seed.module.ts` - модуль для seed данных
- `seed.service.ts` - сервис для создания супер админа
- `seed.controller.ts` - контроллер для ручного запуска seed

### 2. **Автоматический запуск**
- `seed-init.ts` - функция инициализации seed данных
- `main.ts` - автоматический запуск при старте приложения

### 3. **Конфигурация**
- `docker-compose.yml` - переменные окружения для seed данных
- `SUPER_ADMIN_SETUP.md` - документация по настройке

## 🔐 Функциональность супер админа

### Автоматическое создание:
- **Email**: `admin@mindarity.ru`
- **Username**: `superadmin`
- **Password**: `SuperAdmin123!`
- **Role**: `ADMIN`
- **Status**: `ACTIVE`

### Проверки:
- ✅ Проверка существования супер админа
- ✅ Создание только если не существует
- ✅ Хэширование пароля (bcrypt)
- ✅ Логирование операций

## 🚀 Как работает

### 1. **При запуске приложения:**
```typescript
// main.ts
await initializeSeedData(app);
```

### 2. **Автоматическая проверка:**
```typescript
// seed.service.ts
const existingSuperAdmin = await this.usersRepository.findOne({
  where: [
    { email: superAdminEmail },
    { username: superAdminUsername },
  ],
});
```

### 3. **Создание если не существует:**
```typescript
if (!existingSuperAdmin) {
  const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
  // Создание пользователя...
}
```

## ⚙️ Настройка

### Переменные окружения:
```bash
SUPER_ADMIN_EMAIL=admin@mindarity.ru
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=SuperAdmin123!
```

### Docker Compose:
```yaml
environment:
  SUPER_ADMIN_EMAIL: admin@mindarity.ru
  SUPER_ADMIN_USERNAME: superadmin
  SUPER_ADMIN_PASSWORD: SuperAdmin123!
```

## 🔧 Ручной запуск

### API Endpoint:
```bash
POST /seed
Authorization: Bearer <admin-token>
```

### Swagger UI:
- Открыть `http://localhost:3000/api`
- Найти endpoint `POST /seed`
- Выполнить запрос

## 📋 Проверка

### Через API:
```bash
GET /users
Authorization: Bearer <admin-token>
```

### Через логи:
```
✅ Database seeding completed successfully
Super admin created successfully: admin@mindarity.ru
Username: superadmin
Password: SuperAdmin123!
IMPORTANT: Change the password after first login!
```

## 🛡️ Безопасность

### Меры безопасности:
- ✅ Пароль хэшируется bcrypt
- ✅ Проверка существования перед созданием
- ✅ Логирование всех операций
- ✅ Защищенный endpoint (только для админов)

### Рекомендации:
- ⚠️ Изменить пароль после первого входа
- ⚠️ Использовать сложные пароли в продакшене
- ⚠️ Мониторить логи на предмет попыток создания

## 🎯 Результат

После реализации:
- ✅ Супер админ создаётся автоматически при развёртывании
- ✅ Полный доступ к административным функциям
- ✅ Безопасная аутентификация и авторизация
- ✅ Возможность управления пользователями и системой

## 📚 Документация

- **Основная**: [SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)
- **API**: Swagger UI на `/api`
- **Логи**: Консоль приложения при запуске
