import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;

  await app.listen(port, () => {
    AppService.info(`listening on port ${port}`);
  });
}
bootstrap();   
