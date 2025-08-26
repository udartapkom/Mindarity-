# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем исходный код
COPY . .

# Устанавливаем зависимости
RUN npm ci

# Добавляем переменную окружения для принудительной пересборки
ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE}

# Добавляем временную метку для принудительной пересборки
RUN echo "Build timestamp: $(date)" > /app/build-timestamp.txt

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "run", "start:prod"] 