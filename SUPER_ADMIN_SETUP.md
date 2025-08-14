# 👑 Настройка супер админа для Mindarity

## 🎯 Обзор

При развёртывании на сервере в базе данных автоматически создаётся учётная запись супер админа с полными правами доступа.

## 🔐 Учётные данные по умолчанию

### Автоматически создаваемый супер админ:
- **Email**: `admin@mindarity.ru`
- **Username**: `superadmin`
- **Password**: `SuperAdmin123!`
- **Role**: `ADMIN`
- **Status**: `ACTIVE`

## ⚙️ Настройка через переменные окружения

Вы можете изменить учётные данные супер админа, установив следующие переменные окружения:

```bash
# Super Admin Seed Data
SUPER_ADMIN_EMAIL=your-admin@example.com
SUPER_ADMIN_USERNAME=your-admin-username
SUPER_ADMIN_PASSWORD=YourSecurePassword123!
```

## 🚀 Автоматическое создание

### При запуске приложения:
1. Приложение автоматически проверяет наличие супер админа
2. Если супер админ не найден - создаётся автоматически
3. Логи показывают результат операции

### Логи при успешном создании:
```
✅ Database seeding completed successfully
Super admin created successfully: admin@mindarity.ru
Username: superadmin
Password: SuperAdmin123!
IMPORTANT: Change the password after first login!
```

## 🔧 Ручной запуск seed

Если автоматическое создание не сработало, вы можете запустить seed вручную:

### Через API endpoint:
```bash
POST /seed
Authorization: Bearer <admin-token>
```

### Через Swagger UI:
1. Откройте `http://localhost:3000/api`
2. Найдите endpoint `POST /seed`
3. Нажмите "Try it out" и "Execute"

## 🛡️ Безопасность

### ⚠️ ВАЖНО:
1. **Измените пароль** после первого входа
2. **Используйте сложный пароль** в продакшене
3. **Ограничьте доступ** к seed endpoint
4. **Мониторьте логи** на предмет попыток создания админов

### Рекомендуемые действия после первого входа:
1. Войти в систему как супер админ
2. Изменить пароль через профиль
3. Настроить двухфакторную аутентификацию
4. Проверить настройки безопасности

## 📋 Проверка создания

### Через API:
```bash
GET /users
Authorization: Bearer <admin-token>
```

### Через базу данных:
```sql
SELECT username, email, role, status, created_at 
FROM users 
WHERE role = 'admin';
```

## 🔄 Пересоздание супер админа

Если нужно пересоздать супер админа:

1. **Удалить существующего админа** через API или базу данных
2. **Перезапустить приложение** - новый админ создастся автоматически
3. **Или запустить seed вручную** через endpoint

## 📝 Примеры использования

### Docker Compose:
```yaml
environment:
  SUPER_ADMIN_EMAIL: admin@yourdomain.com
  SUPER_ADMIN_USERNAME: admin
  SUPER_ADMIN_PASSWORD: SecurePass123!
```

### .env файл:
```bash
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=SecurePass123!
```

## 🎉 Готово!

После настройки у вас будет:
- ✅ Автоматическое создание супер админа при развёртывании
- ✅ Полный доступ к административным функциям
- ✅ Возможность управления пользователями и системой
- ✅ Безопасная аутентификация и авторизация
