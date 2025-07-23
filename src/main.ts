import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;

  // Allow only specific origin
  const allowedOrigins = require('../public/jsons/origins.json');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });

  await app.listen(port, () => {
    AppService.info(`listening on port ${port}`, {}, false);
    AppService.info('allowed Origins ', allowedOrigins, false);
  });
}
bootstrap();
