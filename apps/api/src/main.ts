import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import * as compression from 'compression'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  // Helmet CSP настроен так, чтобы Swagger UI работал корректно
  // Swagger UI использует eval() внутри для компиляции шаблонов — нужен unsafe-eval
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'https:'],
          fontSrc: [`'self'`, 'data:', 'https:'],
          connectSrc: [`'self'`],
        },
      },
    }),
  )
  app.use(compression())

  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      'http://localhost:7777', // для Swagger UI "Try it out"
    ],
    credentials: true,
  })

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('SportMax ERP API')
    .setDescription(
      'REST API для системы управления фитнес-клубом SportMax.\n\n' +
      '**Как авторизоваться:**\n' +
      '1. Выполните `POST /api/auth/login` с email и паролем\n' +
      '2. Скопируйте `access_token` из ответа\n' +
      '3. Нажмите кнопку **Authorize** вверху и вставьте токен'
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT'
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SportMax API Docs',
    customCss: `
      .swagger-ui .topbar { background: #1e1b4b; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #6366f1; }
    `,
  })

  const port = process.env.API_PORT || 7777
  await app.listen(port)
  console.log(`\n🏋️  SportMax API запущен на http://localhost:${port}`)
  console.log(`📖 Swagger docs: http://localhost:${port}/docs\n`)
}

bootstrap()
