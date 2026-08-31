import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const { ValidationPipe } = await import('@nestjs/common');
  const { NestFactory } = await import('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Didnegar API')
    .setDescription('مستندات API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token دریافتی از verify-otp',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(Number(process.env.PORT) || 3000);
}

await bootstrap();
