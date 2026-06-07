# Урок 03 — TypeScript

## Зачем TypeScript, если есть JavaScript?

JavaScript — язык без типов. Это значит:

```javascript
// JavaScript — всё разрешено, но легко ошибиться
let client = { firstName: "Александр", phone: "79161234567" }
console.log(client.fristName)  // опечатка! но JS не скажет об ошибке
// Runtime error: undefined
```

```typescript
// TypeScript — ошибка найдена ДО запуска кода
interface IClient {
  firstName: string
  phone: string
}
let client: IClient = { firstName: "Александр", phone: "79161234567" }
console.log(client.fristName)  // ❌ Ошибка: Property 'fristName' does not exist
```

TypeScript — это JavaScript с типами. При сборке компилируется в обычный JS.

---

## Основные типы

```typescript
// Примитивные типы
let name: string = "Александр"
let age: number = 35
let isActive: boolean = true
let nothing: null = null
let undef: undefined = undefined

// Массивы
let phones: string[] = ["79161234567", "79251112233"]
let ids: number[] = [1, 2, 3]

// Объект с типом
let client: { firstName: string; phone: string } = {
  firstName: "Александр",
  phone: "79161234567"
}
```

---

## Интерфейсы (interface)

Интерфейс — это описание формы объекта. Используем везде в нашем проекте.

```typescript
// Из packages/shared/src/types/client.ts
interface IClient {
  id: number
  firstName: string
  lastName: string
  middleName?: string    // ? = необязательное поле
  email?: string
  phone: string
  photoUrl?: string
  isActive: boolean
  balance: number
  registrationDate: string
}

// Использование:
function getClientFullName(client: IClient): string {
  return `${client.lastName} ${client.firstName} ${client.middleName ?? ''}`
}
```

Знак `?` после имени поля означает что оно **необязательное** (может быть `undefined`).

---

## Енумы (enum)

Enum — набор именованных констант. Используем для статусов, ролей и т.д.

```typescript
// Из packages/shared/src/types/enums.ts
enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTION = 'RECEPTION',
  TRAINER = 'TRAINER',
  DIRECTOR = 'DIRECTOR',
}

enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FROZEN = 'FROZEN',
  CANCELLED = 'CANCELLED',
}

// Использование:
function checkAccess(userRole: Role): boolean {
  return userRole === Role.ADMIN || userRole === Role.MANAGER
}

// ❌ Нельзя передать произвольную строку
checkAccess('SUPERADMIN')   // Ошибка TypeScript!
// ✅ Только значения из enum
checkAccess(Role.ADMIN)     // OK
```

---

## Обобщённые типы (Generics)

Generics позволяют писать универсальный код.

```typescript
// Интерфейс пагинации с дженериком
interface IPaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

// Использование для разных типов:
type ClientsResponse = IPaginatedResponse<IClient>
type PaymentsResponse = IPaginatedResponse<IPayment>

// Функция с дженериком:
async function fetchPaginated<T>(url: string): Promise<IPaginatedResponse<T>> {
  const response = await fetch(url)
  return response.json()
}

// TypeScript знает что data — это IClient[]
const result = await fetchPaginated<IClient>('/api/clients')
result.data[0].firstName  // TypeScript подсказывает поля!
```

---

## Утилитарные типы

TypeScript имеет встроенные утилиты для работы с типами:

```typescript
interface IClient {
  id: number
  firstName: string
  lastName: string
  phone: string
  email?: string
}

// Partial — все поля необязательны (для обновления)
type UpdateClientDto = Partial<IClient>
// { id?: number; firstName?: string; ... }

// Pick — выбрать только нужные поля
type ClientListItem = Pick<IClient, 'id' | 'firstName' | 'lastName' | 'phone'>
// { id: number; firstName: string; lastName: string; phone: string }

// Omit — убрать поля
type CreateClientDto = Omit<IClient, 'id'>
// { firstName: string; lastName: string; phone: string; email?: string }
```

---

## TypeScript в нашем проекте

### В NestJS (бэкенд)

```typescript
// apps/api/src/modules/clients/dto/create-client.dto.ts
import { IsString, IsOptional, IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty()          // для Swagger документации
  @IsString()             // валидация входящих данных
  firstName: string

  @ApiPropertyOptional()  // необязательное поле
  @IsOptional()
  @IsEmail()
  email?: string
}
```

### В Next.js (фронтенд)

```typescript
// apps/web/components/clients/ClientCard.tsx
interface ClientCardProps {
  client: IClient
  onClick?: (id: number) => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  return (
    <div onClick={() => onClick?.(client.id)}>
      {client.firstName} {client.lastName}
    </div>
  )
}
```

---

## Задание

1. Откройте `packages/shared/src/types/enums.ts` — изучите все енумы
2. Откройте `packages/shared/src/types/client.ts` — найдите все необязательные поля (знак `?`)
3. Откройте `apps/api/src/modules/clients/dto/create-client.dto.ts` — посмотрите как декораторы сочетаются с типами
4. Попробуйте сами: добавьте поле `nickname?: string` в интерфейс `IClient` в `packages/shared`

---

**Предыдущий урок:** [02 — Монорепо](./02-monorepo.md)
**Следующий урок:** [04 — Docker и базы данных](./04-docker.md)
