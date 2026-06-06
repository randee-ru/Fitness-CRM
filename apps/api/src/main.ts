import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import compression from 'compression'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  app.use(helmet())
  app.use(compression())

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  })

  app.setGlobalPrefix('api')

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('SportMax ERP API')
    .setDescription('REST API для системы управления фитнес-клубом SportMax')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.API_PORT || 3001
  await app.listen(port)
  console.log(`SportMax API запущен на http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/docs`)
}

bootstrap()
