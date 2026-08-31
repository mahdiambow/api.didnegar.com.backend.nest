import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const { NestFactory, Reflector } = await import('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('./app.module.js');
  const { TransformInterceptor } = await import(
    './common/interceptors/transform.interceptor.js'
  );
  const { HttpExceptionFilter } = await import(
    './common/filters/http-exception.filter.js'
  );
  const { createValidationPipe } = await import(
    './common/pipes/validation.pipe.js'
  );

  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());

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
