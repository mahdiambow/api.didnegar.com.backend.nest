import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const { NestFactory, Reflector } = await import('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('./app.module.js');
  const { apiReference } = await import('@scalar/nestjs-api-reference');
  const { TransformInterceptor } = await import(
    './common/interceptors/transform.interceptor.js'
  );
  const { HttpExceptionFilter } = await import(
    './common/filters/http-exception.filter.js'
  );
  const { createValidationPipe } = await import(
    './common/pipes/validation.pipe.js'
  );
  const helmet = (await import('helmet')).default;

  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const isProduction = process.env.NODE_ENV === 'production';

  // Reflect any request Origin so browsers (local, LAN, production) can call the API.
  // With credentials:true we cannot use '*'; reflecting the Origin is required.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              scriptSrc: [`'self'`],
              imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
              fontSrc: [`'self'`, 'https://fonts.gstatic.com'],
              connectSrc: [`'self'`],
              // Support direct HTTP access; HTTPS is configured at the proxy.
              upgradeInsecureRequests: null,
            },
          }
        : false,
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

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
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      // false = با رفرش صفحه توکن قبلی پاک می‌شود؛ از Authorize توکن تازه بگذار
      persistAuthorization: process.env.SWAGGER_PERSIST_AUTH === 'true',
    },
    customSiteTitle: 'Didnegar API',
  });

  // Scalar API Reference — modern alternative to Swagger UI
  app.use(
    '/reference',
    apiReference({
      content: document,
      theme: 'purple',
    }),
  );

  const { mediaConfig } = await import('./media/media.config.js');
  if (!mediaConfig.sftp.enabled) {
    const express = await import('express');
    const { resolve } = await import('node:path');
    app.use(
      '/media-files/staging',
      express.default.static(resolve(mediaConfig.stagingRoot)),
    );
    app.use(
      '/media-files/gallery',
      express.default.static(resolve(mediaConfig.galleryRoot)),
    );
  }

  await app.listen(Number(process.env.PORT) || 3000);
}

await bootstrap();
