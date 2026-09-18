// src/main.ts
import 'dotenv/config';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  console.log('CORS origin configured as:', process.env.FRONTEND_URL ?? 'http://localhost:3000 (fallback - FRONTEND_URL not set!)');

  app.useStaticAssets(join(process.cwd(), 'uploads', 'avatars'), {
    prefix: '/uploads/avatars/',
  });

  const config = new DocumentBuilder()
    .setTitle('Koru HRM API')
    .setDescription('Backend API for the Koru HRM system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;

  await app.listen(port, '0.0.0.0');

  console.log(`API running on port ${port}`);
}

bootstrap();
