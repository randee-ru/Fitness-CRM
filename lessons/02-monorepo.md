# Урок 02 — Монорепо и Turborepo

## Проблема: один проект или два?

Наша система состоит из двух приложений:
- `apps/api` — NestJS бэкенд
- `apps/web` — Next.js фронтенд

Можно было бы хранить их в **двух отдельных репозиториях** (два разных git-проекта). Но тогда возникают проблемы:
- Общие TypeScript-типы нужно копировать в оба проекта
- Запуск требует открыть два разных терминала в двух папках
- Сложнее синхронизировать версии зависимостей

**Решение — монорепо:** один git-репозиторий содержит несколько проектов.

---

## Что такое монорепо

```
один git-репозиторий
├── apps/
│   ├── api/      ← проект 1
│   └── web/      ← проект 2
└── packages/
    └── shared/   ← общий код
```

**Преимущества:**
- Один `git pull` — обновляются все проекты
- Общий код (`packages/shared`) — пишем один раз
- Единые команды: `npm run dev` — запускает оба приложения
- Единый список зависимостей (частично)

---

## npm Workspaces — как это работает

В файле `package.json` в корне проекта написано:

```json
{
  "name": "sportmax-erp",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Это говорит npm: "все папки внутри `apps/` и `packages/` — это отдельные пакеты".

Когда вы запускаете `npm install` в корне — npm устанавливает зависимости для ВСЕХ пакетов сразу.

---

## Turborepo — умный запуск задач

Turborepo — инструмент от компании Vercel (создатели Next.js). Он знает зависимости между проектами и запускает задачи **параллельно** и **умно**.

Конфиг в `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],   // сначала сборка зависимостей
      "outputs": [".next/**"]    // что кэшировать
    },
    "dev": {
      "cache": false,            // в dev режиме кэш не нужен
      "persistent": true         // задача не завершается (сервер)
    }
  }
}
```

### Без Turborepo (плохо):
```bash
# Нужно открывать 2 терминала:
cd apps/api && npm run dev
# открываем новый терминал
cd apps/web && npm run dev
```

### С Turborepo (хорошо):
```bash
# Из корня проекта — всё запустится само:
npm run dev
```

---

## packages/shared — общие типы

Представьте: API возвращает клиента такого вида:
```typescript
{ id: 1, firstName: "Александр", lastName: "Иванов", phone: "79161234567" }
```

Нам нужно описать этот тип В ДВУХ МЕСТАХ — в API (чтобы проверить что мы правильно отдаём) и в Web (чтобы TypeScript знал что пришло). Если изменить тип в API — нужно помнить обновить и в Web.

**Решение:** создать один общий тип в `packages/shared`:

```typescript
// packages/shared/src/types/client.ts
export interface IClient {
  id: number
  firstName: string
  lastName: string
  phone: string
}
```

И использовать его в обоих приложениях:

```typescript
// apps/api/src/modules/clients/clients.service.ts
import { IClient } from '@sportmax/shared'

// apps/web/lib/api.ts
import { IClient } from '@sportmax/shared'
```

---

## Как устроены зависимости

В `package.json` каждого приложения указаны его зависимости:

```json
// apps/api/package.json
{
  "name": "@sportmax/api",
  "dependencies": {
    "@nestjs/core": "^10.4.15",
    "@prisma/client": "^6.0.0"
  }
}

// apps/web/package.json
{
  "name": "@sportmax/web",
  "dependencies": {
    "next": "15.3.3",
    "@tanstack/react-query": "^5.62.16"
  }
}

// packages/shared/package.json
{
  "name": "@sportmax/shared",
  "main": "./src/index.ts"
}
```

---

## Задание

1. Откройте `package.json` в корне и посмотрите секцию `workspaces`
2. Откройте `turbo.json` — изучите настройки задач
3. Откройте `packages/shared/src/types/` — найдите интерфейс `IClient`
4. В `apps/web/tsconfig.json` найдите строку с `@sportmax/shared` — это alias, который позволяет импортировать из shared пакета

---

**Предыдущий урок:** [01 — Введение](./01-intro.md)
**Следующий урок:** [03 — TypeScript](./03-typescript.md)
