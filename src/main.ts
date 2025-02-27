
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { stringify } from 'json-bigint';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    res.json = (data) => {
      return res.send(stringify(data));
    };
    next();
  });
  const port = process.env.PORT || 3000;
  app.enableCors({ origin: 'http://localhost:3001' });
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Consulta SISPEUC')
    .setDescription('Backend em NestJS para aplicação de consulta de SQLs para CEPEUC.',)
    .setVersion('versão 1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
  console.log("API consulta sispeuc rodando em http://localhost:" + port);
}
bootstrap();