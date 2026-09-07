import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global CORS va Validation
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 Buxgalteriya Backend API ishga tushdi: http://localhost:${port}`);
  logger.log(`📊 Integratsiya moduli: E-IMZO, Didox & Soliq faol`);
  logger.log(`====================================================`);
}

bootstrap();
