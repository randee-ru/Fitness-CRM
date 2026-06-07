# Урок 05 — Prisma ORM

## Что такое ORM и зачем он нужен

Без ORM нам пришлось бы писать SQL вручную:

```typescript
// БЕЗ Prisma — сырой SQL, неудобно и опасно
const result = await db.query(
  `SELECT c.*, cm.status as membership_status
   FROM clients c
   LEFT JOIN client_memberships cm ON cm.client_id = c.id
   WHERE c.id = $1 AND c.is_active = true`,
  [clientId]
)
const client = result.rows[0]
client.fristName  // опечатка — JS не предупредит
```

**С Prisma — удобно, безопасно, с TypeScript автодополнением:**

```typescript
// С Prisma
const client = await prisma.client.findUnique({
  where: { id: clientId, isActive: true },
  include: { memberships: { where: { status: 'ACTIVE' } } }
})
client.firstName   // ✅ TypeScript знает все поля
client.fristName   // ❌ Ошибка TypeScript — опечатка найдена
```

---

## Схема Prisma (`apps/api/prisma/schema.prisma`)

Схема — это описание всех таблиц базы данных. Prisma генерирует TypeScript-типы из этой схемы.

### Базовая структура

```prisma
// Настройка соединения с БД
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // берём из .env файла
}

// Настройка генерации TypeScript клиента
generator client {
  provider = "prisma-client-js"
}

// Модель (= таблица в БД)
model Client {
  id        Int      @id @default(autoincrement())  // PRIMARY KEY
  firstName String                                   // VARCHAR NOT NULL
  lastName  String
  phone     String
  email     String?                                  // ? = NULL разрешён
  isActive  Boolean  @default(true)                  // DEFAULT true
  createdAt DateTime @default(now())                 // DEFAULT CURRENT_TIMESTAMP
  updatedAt DateTime @updatedAt                      // авто-обновление

  // Индекс для быстрого поиска по телефону
  @@index([phone])

  // Имя таблицы в БД (иначе было бы "Client")
  @@map("clients")
}
```

### Связи между моделями

```prisma
model Client {
  id          Int                @id @default(autoincrement())
  firstName   String
  
  // У клиента может быть много абонементов
  memberships ClientMembership[]
}

model ClientMembership {
  id         Int    @id @default(autoincrement())
  
  // Внешний ключ
  clientId   Int
  // Связь: поле clientId ссылается на id в модели Client
  client     Client @relation(fields: [clientId], references: [id])
  
  membershipId Int
  membership   Membership @relation(fields: [membershipId], references: [id])
  
  status String @default("ACTIVE")
  
  @@index([clientId])
  @@map("client_memberships")
}
```

---

## Типы данных Prisma

| Prisma | PostgreSQL | TypeScript |
|---|---|---|
| `String` | VARCHAR / TEXT | `string` |
| `Int` | INTEGER | `number` |
| `Float` | DOUBLE PRECISION | `number` |
| `Decimal` | DECIMAL | `Decimal` |
| `Boolean` | BOOLEAN | `boolean` |
| `DateTime` | TIMESTAMP | `Date` |
| `Json` | JSONB | `any` / `Prisma.JsonValue` |
| `String?` | VARCHAR NULL | `string \| null` |

---

## Миграции

Когда вы изменяете схему Prisma — нужно применить изменения к базе данных.

```bash
# Создать миграцию в разработке
cd apps/api
npx prisma migrate dev --name add_client_photo_field

# Prisma:
# 1. Смотрит что изменилось в schema.prisma
# 2. Генерирует SQL: ALTER TABLE clients ADD COLUMN photo_url VARCHAR;
# 3. Применяет к БД
# 4. Сохраняет в папку prisma/migrations/
```

**Папка миграций:**
```
apps/api/prisma/migrations/
├── 20250101000000_init/
│   └── migration.sql
├── 20250201000000_add_rfid/
│   └── migration.sql
└── 20250301000000_add_loyalty/
    └── migration.sql
```

Каждая миграция — SQL файл с изменениями БД.

---

## Prisma Client — работа с данными

После схемы Prisma генерирует TypeScript клиент.

### PrismaService в NestJS

```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()  // подключиться при старте
  }
}
```

Этот сервис **глобальный** — его можно использовать в любом модуле:

```typescript
// В любом сервисе:
constructor(private prisma: PrismaService) {}
```

### CRUD операции

```typescript
// ───── CREATE (создать) ─────
const client = await prisma.client.create({
  data: {
    firstName: "Александр",
    lastName: "Иванов",
    phone: "79161234567",
  }
})
// client.id теперь заполнен автоматически

// ───── READ ONE (найти один) ─────
const client = await prisma.client.findUnique({
  where: { id: 42 }
})
// client может быть null если не найден

const client = await prisma.client.findUniqueOrThrow({
  where: { id: 42 }
})
// Бросает ошибку если не найден

// ───── READ MANY (найти много) ─────
const clients = await prisma.client.findMany({
  where: {
    isActive: true,
    OR: [
      { firstName: { contains: "Иван", mode: "insensitive" } },
      { phone: { contains: "7916" } },
    ]
  },
  orderBy: { createdAt: "desc" },
  skip: 0,    // пагинация: пропустить 0 записей
  take: 20,   // взять 20 записей
})

// ───── UPDATE (обновить) ─────
const updated = await prisma.client.update({
  where: { id: 42 },
  data: { isActive: false }
})

// ───── DELETE (удалить) ─────
await prisma.client.delete({ where: { id: 42 } })
// Мы почти никогда не удаляем — только деактивируем (isActive: false)

// ───── COUNT (посчитать) ─────
const total = await prisma.client.count({ where: { isActive: true } })
```

### Include — загрузить связанные данные

```typescript
// Загрузить клиента со всеми его абонементами
const client = await prisma.client.findUnique({
  where: { id: 42 },
  include: {
    memberships: {
      where: { status: "ACTIVE" },   // только активные
      include: { membership: true },  // и сам абонемент
      orderBy: { purchaseDate: "desc" }
    },
    visits: {
      orderBy: { checkInTime: "desc" },
      take: 10   // только последние 10
    },
    rfidKeys: { where: { isActive: true } }
  }
})
```

### $transaction — атомарные операции

Если нужно выполнить несколько операций атомарно (все или ничего):

```typescript
// Пример из loyalty.service.ts:
const [updatedLoyalty, newTransaction] = await prisma.$transaction([
  // Обновляем баланс баллов
  prisma.clientLoyalty.update({
    where: { clientId },
    data: { points: { increment: pointsToAdd } }
  }),
  // Записываем транзакцию в историю
  prisma.loyaltyTransaction.create({
    data: { clientId, type: "EARN", points: pointsToAdd, balance: newBalance }
  }),
])
// Если одна операция упала — вторая тоже не выполнится
```

---

## Prisma Studio — визуальный просмотр БД

```bash
cd apps/api
npx prisma studio
# Откроется браузер: http://localhost:5555
```

Можно просматривать и редактировать данные прямо в браузере. Удобно для разработки.

---

## Задание

1. Откройте `apps/api/prisma/schema.prisma` — найдите модель `Deal` и разберите все её поля
2. Найдите связь между `Deal` и `Pipeline_Stage` — через какое поле?
3. Откройте `apps/api/src/modules/clients/clients.service.ts` — найдите метод `findAll` и разберите Prisma-запрос
4. **Попробуйте:** добавьте поле `instagramUrl?: string` в модель `Client` в схеме, затем выполните `npx prisma migrate dev --name add_instagram`

---

**Предыдущий урок:** [04 — Docker](./04-docker.md)
**Следующий урок:** [06 — NestJS основы](./06-nestjs-basics.md)
