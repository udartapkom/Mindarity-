import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
