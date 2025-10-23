// Charge les variables d'environnement depuis .env
import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crée l'application NestJS à partir du module racine
  const app = await NestFactory.create(AppModule);

  // ✅ Tous les endpoints commenceront par /api (aligne avec le front)
  app.setGlobalPrefix('api');

  // ✅ Validation globale des payloads
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // ✅ Autorise le front local à appeler l’API (CORS)
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Démarre le serveur HTTP sur le port 3000
  await app.listen(3000);
}
// Point d’entrée de l’appli
bootstrap();
