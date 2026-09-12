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
  const helmet = (await import('helmet')).default;

  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              scriptSrc: [`'self'`],
              imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
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
      persistAuthorization: true,
    },
  });

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
