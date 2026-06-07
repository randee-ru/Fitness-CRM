# Урок 06 — NestJS: модули, контроллеры, сервисы

## Что такое NestJS

NestJS — фреймворк для написания серверных приложений на TypeScript. Он построен на основе **паттернов** (готовых архитектурных решений), взятых из мира Java (Spring) и Angular.

**Главная идея:** весь код разделён на независимые **модули**. Каждый модуль отвечает за одну область бизнеса.

```
AppModule (главный)
├── AuthModule      (авторизация)
├── ClientsModule   (клиенты)
├── CrmModule       (воронки и сделки)
├── VisitsModule    (посещения)
├── RfidModule      (RFID-доступ)
├── LoyaltyModule   (лояльность)
├── ScheduleModule  (расписание)
├── FinanceModule   (финансы)
└── MangoModule     (телефония)
```

---

## Три главных строительных блока

### 1. Module (модуль) — регистратор

Модуль собирает контроллер и сервис в единое целое:

```typescript
// apps/api/src/modules/clients/clients.module.ts
import { Module } from '@nestjs/common'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'

@Module({
  controllers: [ClientsController],  // принимает запросы
  providers: [ClientsService],        // бизнес-логика
  exports: [ClientsService],          // доступен другим модулям
})
export class ClientsModule {}
```

### 2. Controller (контроллер) — принимает запросы

```typescript
// apps/api/src/modules/clients/clients.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ClientsService } from './clients.service'

@ApiTags('clients')         // группа в Swagger
@ApiBearerAuth()            // требует токен
@UseGuards(JwtAuthGuard)    // применить guard ко ВСЕМ методам
@Controller('clients')      // базовый URL: /api/clients
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}
  //          ↑ Dependency Injection — NestJS сам создаёт сервис

  @Get()                    // GET /api/clients
  @ApiOperation({ summary: 'Список клиентов' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query)
  }

  @Get(':id')               // GET /api/clients/42
  findOne(@Param('id', ParseIntPipe) id: number) {
    //     ↑ id из URL      ↑ автоматически конвертирует строку в число
    return this.clientsService.findOne(id)
  }

  @Post()                   // POST /api/clients
  create(@Body() dto: CreateClientDto) {
    //   ↑ тело запроса    ↑ DTO с валидацией
    return this.clientsService.create(dto)
  }

  @Put(':id')               // PUT /api/clients/42
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto)
  }

  @Delete(':id')            // DELETE /api/clients/42
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id)
  }
}
```

### 3. Service (сервис) — бизнес-логика

```typescript
// apps/api/src/modules/clients/clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()   // этот класс можно внедрять через Dependency Injection
export class ClientsService {
  constructor(private prisma: PrismaService) {}
  //          ↑ PrismaService внедряется автоматически

  async findAll(query: ClientQueryDto) {
    const { search, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, skip, take: limit }),
      this.prisma.client.count({ where }),
    ])

    return { data, pagination: { page, limit, total } }
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } })
    if (!client) {
      throw new NotFoundException(`Клиент #${id} не найден`)
      // NestJS автоматически вернёт HTTP 404
    }
    return client
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto })
  }
}
```

---

## Dependency Injection (внедрение зависимостей)

Это ключевой принцип NestJS. Вместо того чтобы создавать объекты вручную:

```typescript
// ❌ Плохо — жёсткая связь
class ClientsController {
  private service = new ClientsService(new PrismaService())
}
```

Мы говорим NestJS "мне нужен этот класс":

```typescript
// ✅ Хорошо — NestJS сам создаёт и передаёт
class ClientsController {
  constructor(private readonly service: ClientsService) {}
}
```

**Преимущества:**
- Легко тестировать (можно подменить зависимость)
- NestJS управляет жизненным циклом объектов (создаёт один раз)

---

## DTO — Data Transfer Objects

DTO — классы, описывающие формат данных запроса. Используются для валидации.

```typescript
// apps/api/src/modules/clients/dto/create-client.dto.ts
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty({ example: 'Александр' })   // показывается в Swagger
  @IsString()                               // должна быть строка
  firstName: string

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  lastName: string

  @ApiProperty({ example: '79161234567' })
  @IsString()
  @MinLength(10)                             // минимум 10 символов
  phone: string

  @ApiPropertyOptional({ example: 'ivanov@mail.ru' })
  @IsOptional()   // поле необязательно
  @IsEmail()      // если есть — должен быть email
  email?: string
}
```

**Как это работает:**

```
Клиент отправляет POST /api/clients
{ "firstName": "Александр", "phone": "123" }
        │
        ▼
ValidationPipe проверяет DTO:
- firstName: ✅ строка
- phone: ❌ минимум 10 символов!
- lastName: ❌ обязательное поле отсутствует
        │
        ▼
NestJS автоматически отвечает 400 Bad Request:
{
  "statusCode": 400,
  "message": ["phone must be longer than or equal to 10 characters", "lastName must be a string"]
}
```

---

## Decorators (декораторы)

Декораторы — специальные функции с символом `@`. Они добавляют метаданные к классам и методам.

```typescript
@Controller('clients')     // этот класс — контроллер для /clients
@Get(':id')                // этот метод обрабатывает GET /:id
@Body()                    // аргумент = тело запроса
@Param('id')               // аргумент = параметр из URL
@Query()                   // аргумент = query параметры (?page=1)
@UseGuards(JwtAuthGuard)   // применить защиту
@Roles('ADMIN')            // разрешить только ADMIN
@ApiOperation({ summary }) // документация Swagger
```

---

## Полный путь запроса через NestJS

```
POST /api/clients
{ "firstName": "Иван", "phone": "79161234567" }
        │
        ▼
main.ts (точка входа) → GlobalPrefix('/api') → Router
        │
        ▼
ClientsController — найден маршрут @Post()
        │
        ▼
JwtAuthGuard — проверить токен → OK
        │
        ▼
ValidationPipe — проверить DTO → OK
        │
        ▼
ClientsController.create(dto) вызван
        │
        ▼
ClientsService.create(dto) — бизнес-логика
        │
        ▼
PrismaService — INSERT INTO clients... → PostgreSQL
        │
        ▼
Возвращает { id: 42, firstName: "Иван", ... }
        │
        ▼
HTTP 201 Created + JSON ответ
```

---

## Задание

1. Откройте `apps/api/src/modules/crm/crm.controller.ts` — найдите все HTTP-методы
2. Откройте `apps/api/src/modules/crm/crm.service.ts` — найдите метод `moveDeal` и разберите что он делает
3. Откройте Swagger: http://localhost:7777/docs — попробуйте выполнить `GET /clients`
4. **Создайте новый эндпоинт:** добавьте в `ClientsController` метод `@Get('active')` который возвращает только активных клиентов (подсказка: в `ClientsService.findAll` передайте `{ isActive: true }`)

---

**Предыдущий урок:** [05 — Prisma](./05-prisma.md)
**Следующий урок:** [07 — NestJS авторизация](./07-nestjs-auth.md)
