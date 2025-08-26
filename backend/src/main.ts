import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initializeSeedData } from './seed-init';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Создаем папку uploads если она не существует
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  }

  // Статическая раздача файлов
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173'];
    
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Swagger документация
  const config = new DocumentBuilder()
    .setTitle('Mindarity API')
    .setDescription(
      'API для приложения Mindarity - дневник с управлением целями и задачами',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Аутентификация и авторизация')
    .addTag('Users', 'Управление пользователями')
    .addTag('Events', 'События и мысли')
    .addTag('Goals', 'Цели и задачи')
    .addTag('Health', 'Мониторинг состояния системы')
    .addTag('Seed', 'Инициализация базы данных')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`Swagger documentation: http://${host}:${port}/api`);

  // Автоматический запуск seed данных
  await initializeSeedData(app);
}
bootstrap();
