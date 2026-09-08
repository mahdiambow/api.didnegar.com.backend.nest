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
    .setDescription(
      [
        'مستندات API',
        '',
        '### نقش‌ها',
        '- `user` | `seller` | `super-seller` | `admin` | `super-admin`',
        '- کاربر می‌تواند چند نقش داشته باشد با `roleIds: [uuid, ...]` (اولی نقش اصلی است)',
        '- در JWT و پاسخ لاگین فیلد `roles` شامل همه نقش‌هاست',
        '',
        '### Offer Products',
        '- فروشنده با `POST /offer-products` درخواست می‌دهد (`pending`)',
        '- `super-seller` / `admin` / `super-admin` با `PATCH /offer-products/:id/approval` تأیید می‌کنند',
        '- بعد از approved → Product + SellerOffer ساخته می‌شود',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token از login/verify-otp — شامل role و roles (چندنقشی)',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(Number(process.env.PORT) || 3000);
}

await bootstrap();
