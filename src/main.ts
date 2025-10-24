import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // enable cors
  app.enableCors({
    origin: '*', // Allow all origins, or specify allowed origins (e.g., 'http://localhost:3000')
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true,
  });

    app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
  .setTitle("Quible Multivendor Api")
  .setDescription("Api Documetation for a multivendor and rider application")
  .setVersion("1.0")
  .build()
 
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api", app, document)
  await app.listen(process.env.PORT ?? 3005);
  console.log(`Application is running on: ${await app.getUrl()}`);
} 
bootstrap();