
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { stringify } from 'json-bigint';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    res.json = (data) => {
      return res.send(stringify(data));
    };
    next();
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  const port = process.env.PORT || 3000;
  app.enableCors({ origin: 'http://localhost:3001' });
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Outorga Onerosa - Relatórios')
    .setDescription('Backend em NestJS para aplicação de relatórios de Outorga Onerosa.',)
    .setVersion('versão 1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
  console.log("API outorga rodando em http://localhost:" + port);
}
bootstrap();