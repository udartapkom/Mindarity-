# 🚀 Модуль обработки больших данных для проекта Mindarity

## 📋 Обзор

Модуль обработки больших данных реализует требования из "Требования.md" по обработке файлов от 100MB с контролем максимального числа обработчиков данных (workers) и использованием MinIO как объектного хранилища.

## 🎯 Реализованные требования

### ✅ Обработка файлов от 100MB
- **Минимальный размер**: 100MB (настраивается через `BIGDATA_MIN_FILE_SIZE`)
- **Максимальный размер**: 1GB (настраивается через `BIGDATA_MAX_FILE_SIZE`)
- **Поддерживаемые форматы**: CSV, JSON, XML, TXT, LOG, Parquet, Avro, XLSX, XLS

### ✅ Контроль максимального числа обработчиков данных (workers)
- **Настраиваемое количество**: По умолчанию 3 workers (через `BIGDATA_MAX_WORKERS`)
- **Очередь задач**: Автоматическое распределение файлов по доступным workers
- **Мониторинг нагрузки**: Отслеживание системных ресурсов (CPU, RAM, Load Average)

### ✅ Использование MinIO как объектного хранилища
- **S3-совместимый API**: Полная совместимость с Amazon S3
- **Автоматическое создание bucket**: Инициализация при запуске
- **Presigned URLs**: Безопасный доступ к файлам
- **Метаданные**: Хранение дополнительной информации о файлах

## 🏗️ Архитектура модуля

### Компоненты:
1. **BigDataService** - Основной сервис обработки файлов
2. **MinioStorageService** - Сервис для работы с MinIO
3. **BigDataController** - API контроллер
4. **EventEmitter** - Система событий для отслеживания прогресса

### Поток обработки:
```
Upload → Queue → Worker Assignment → Processing → MinIO Storage → Result
```

## 🛠️ Установка и настройка

### 1. Зависимости
```bash
npm install @nestjs/event-emitter nestjs-minio
```

### 2. Переменные окружения
```bash
# Big Data Processing
BIGDATA_MAX_WORKERS=3
BIGDATA_CHUNK_SIZE=1048576
BIGDATA_TEMP_DIR=./temp
BIGDATA_MAX_FILE_SIZE=1073741824
BIGDATA_MIN_FILE_SIZE=104857600
BIGDATA_PROCESSING_TIMEOUT=3600000
BIGDATA_CLEANUP_INTERVAL=86400000
BIGDATA_RETENTION_DAYS=30

# MinIO Configuration
MINIO_HOST=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=mindarity
MINIO_USE_SSL=false
```

### 3. Подключение модуля
```typescript
// app.module.ts
import { BigDataModule } from './modules/bigdata/bigdata.module';

@Module({
  imports: [
    // ... другие модули
    BigDataModule,
  ],
})
export class AppModule {}
```

## 🔧 API Endpoints

### Загрузка файла для обработки
```http
POST /bigdata/upload
Content-Type: multipart/form-data

file: [файл от 100MB]
metadata: {"dataType": "csv", "delimiter": ","}
```

**Ответ:**
```json
{
  "job": {
    "id": "job-1234567890-abc123def",
    "filename": "data.csv",
    "originalName": "data.csv",
    "size": 104857600,
    "status": "pending",
    "progress": 0,
    "metadata": {"dataType": "csv", "delimiter": ","}
  },
  "message": "File uploaded and queued for processing"
}
```

### Получение статуса обработки
```http
GET /bigdata/status/{jobId}
```

**Ответ:**
```json
{
  "id": "job-1234567890-abc123def",
  "filename": "data.csv",
  "originalName": "data.csv",
  "size": 104857600,
  "status": "processing",
  "progress": 45,
  "workerId": "worker-1234567890-xyz789",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "metadata": {"dataType": "csv", "delimiter": ","}
}
```

### Статистика обработки (только для админов)
```http
GET /bigdata/stats
```

**Ответ:**
```json
{
  "maxWorkers": 3,
  "activeWorkers": 2,
  "queuedJobs": 5,
  "completedJobs": 25,
  "systemLoad": {
    "cpu": 45.2,
    "memory": 67.8,
    "loadAverage": 1.2
  }
}
```

### Остановка обработки
```http
DELETE /bigdata/stop/{jobId}
```

### Очистка завершенных задач (только для админов)
```http
DELETE /bigdata/cleanup
```

### Проверка здоровья сервиса
```http
GET /bigdata/health
```

## 📊 Мониторинг и управление

### Системные метрики:
- **CPU загрузка**: В реальном времени
- **RAM использование**: Текущее потребление памяти
- **Load Average**: Системная нагрузка
- **Активные workers**: Количество работающих обработчиков

### Очередь задач:
- **Pending**: Ожидающие обработки
- **Processing**: В процессе обработки
- **Completed**: Завершенные успешно
- **Failed**: Завершенные с ошибкой

### Автоматическая очистка:
- **Retention Policy**: Удаление старых результатов
- **Temp Files**: Очистка временных файлов
- **Log Rotation**: Ротация логов обработки

## 🔒 Безопасность

### Аутентификация:
- **JWT токены**: Обязательная аутентификация
- **Роли**: USER и ADMIN доступы
- **Сессии**: Контроль активных сессий

### Авторизация:
- **USER**: Загрузка файлов, просмотр своих задач
- **ADMIN**: Полный доступ, статистика, очистка

### Защита файлов:
- **Presigned URLs**: Временный доступ к файлам
- **Bucket Policies**: Контроль доступа к MinIO
- **Metadata Encryption**: Шифрование метаданных

## 🚀 Производительность

### Оптимизации:
- **Chunked Processing**: Обработка по частям
- **Stream Processing**: Потоковая обработка больших файлов
- **Memory Management**: Контроль использования памяти
- **Worker Pool**: Пул обработчиков

### Масштабируемость:
- **Configurable Workers**: Настраиваемое количество workers
- **Queue Management**: Управление очередью задач
- **Load Balancing**: Распределение нагрузки
- **Auto-scaling**: Автоматическое масштабирование

## 📁 Структура файлов

```
backend/src/modules/bigdata/
├── bigdata.controller.ts      # API контроллер
├── bigdata.service.ts         # Основной сервис
├── bigdata.module.ts          # Модуль
├── minio-storage.service.ts   # Сервис MinIO
└── dto/
    └── process-file.dto.ts    # DTO для валидации
```

## 🔧 Конфигурация

### Основные настройки:
```typescript
// config/configuration.ts
bigdata: {
  maxWorkers: 3,                    // Максимум workers
  chunkSize: 1048576,              // Размер чанка (1MB)
  tempDir: './temp',               // Временная директория
  supportedFormats: ['csv', 'json'], // Поддерживаемые форматы
  maxFileSize: 1073741824,         // Максимальный размер (1GB)
  minFileSize: 104857600,          // Минимальный размер (100MB)
  processingTimeout: 3600000,      // Таймаут обработки (1 час)
  cleanupInterval: 86400000,       // Интервал очистки (24 часа)
  retentionDays: 30,               // Дни хранения результатов
}
```

## 🧪 Тестирование

### Unit тесты:
```bash
npm run test bigdata
```

### E2E тесты:
```bash
npm run test:e2e bigdata
```

### Тестовые файлы:
- **Small file**: < 100MB (должен быть отклонен)
- **Valid file**: 100MB - 1GB (должен быть принят)
- **Large file**: > 1GB (должен быть отклонен)

## 📈 Логирование

### Уровни логирования:
- **DEBUG**: Детальная информация о обработке
- **INFO**: Основные события и статистика
- **WARN**: Предупреждения о ресурсах
- **ERROR**: Ошибки обработки и системные сбои

### Структурированные логи:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "jobId": "job-1234567890-abc123def",
  "workerId": "worker-1234567890-xyz789",
  "action": "processing_started",
  "filename": "data.csv",
  "size": 104857600,
  "progress": 0
}
```

## 🚨 Troubleshooting

### Частые проблемы:

1. **Файл слишком маленький**
   ```
   Error: File must be at least 100MB for big data processing
   ```
   **Решение**: Убедитесь, что файл больше 100MB

2. **Недостаточно workers**
   ```
   Warning: All workers busy, job queued
   ```
   **Решение**: Увеличьте `BIGDATA_MAX_WORKERS`

3. **MinIO недоступен**
   ```
   Error: Failed to connect to MinIO
   ```
   **Решение**: Проверьте настройки MinIO и сеть

4. **Недостаточно места на диске**
   ```
   Error: No space left on device
   ```
   **Решение**: Очистите временные файлы и результаты

### Полезные команды:
```bash
# Проверка состояния workers
curl -H "Authorization: Bearer $TOKEN" /bigdata/stats

# Очистка старых результатов
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" /bigdata/cleanup

# Проверка здоровья сервиса
curl /bigdata/health
```

## 🔮 Дальнейшее развитие

### Краткосрочные улучшения:
1. **Параллельная обработка**: Разделение файлов на части
2. **Прогресс в реальном времени**: WebSocket уведомления
3. **Resume обработки**: Возобновление прерванных задач
4. **Batch processing**: Пакетная обработка файлов

### Долгосрочные планы:
1. **Distributed processing**: Распределенная обработка
2. **Machine Learning**: Интеллектуальный анализ данных
3. **Real-time streaming**: Потоковая обработка
4. **Cloud integration**: Интеграция с облачными сервисами

## 📚 Дополнительные ресурсы

### Документация:
- [NestJS Event Emitter](https://docs.nestjs.com/techniques/events)
- [MinIO JavaScript Client](https://docs.min.io/docs/javascript-client-quickstart-guide)
- [Node.js Streams](https://nodejs.org/api/stream.html)

### Полезные ссылки:
- [Big Data Processing Patterns](https://martinfowler.com/articles/big-data-processing-patterns.html)
- [S3-Compatible Storage](https://en.wikipedia.org/wiki/S3-compatible)
- [Stream Processing](https://en.wikipedia.org/wiki/Stream_processing)

---

**Версия документа**: 1.0  
**Последнее обновление**: $(date)  
**Автор**: Big Data Team
