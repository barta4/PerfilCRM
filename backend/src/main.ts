import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Native global prefix instead of manual URL hacking
  app.setGlobalPrefix('api');

  // Middleware para solucionar el problema de Dokploy/Traefik
  // Si Traefik corta el prefijo '/api' y envía '/auth/login', este middleware lo restaura a '/api/auth/login'
  // para que NestJS pueda matchearlo correctamente.
  app.use((req: any, res: any, next: any) => {
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    next();
  });

  const helmet = require('helmet');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:'],
          connectSrc: ["'self'", 'http:', 'https:'],
        },
      },
    }),
  );

  // CORS — dynamic origins configuration
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Ensure uploads directory exists
  mkdirSync(join(process.cwd(), 'uploads'), { recursive: true });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[PERFIL CRM] Backend running on http://localhost:${port}`);

  // Seed default admin user
  const { AuthService } = require('./auth/auth.service');
  const authService = app.get(AuthService);
  await authService.seedAdmin();
}
bootstrap();
