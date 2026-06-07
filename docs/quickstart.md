# Быстрый старт — SportMax ERP

## Способ 1: Docker (рекомендуется, одна команда)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/randee-ru/Fitness-CRM.git sportmax-erp
cd sportmax-erp

# 2. Создать .env из примера
cp .env.example .env

# 3. Запустить всю систему
docker compose up -d
```

После этого откройте:
- **Веб-интерфейс:** http://localhost:80
- **API:** http://localhost:7777
- **Swagger:** http://localhost:7777/docs

---

## Способ 2: Локальная разработка

### Требования
- Node.js 20+
- npm 10+
- Docker (для PostgreSQL и Redis)

### Шаг 1 — Запустить базы данных

```bash
docker compose -f docker-compose.dev.yml up -d
```

Это поднимет PostgreSQL на порту `5432` и Redis на `6379`.

### Шаг 2 — Создать .env файлы

**Корневой `.env`:**
```bash
cp .env.example .env
```

**API `.env`:**
```bash
cp .env.example apps/api/.env
```

**Web `.env.local`:**
```bash
cp .env.example apps/web/.env.local
```

### Шаг 3 — Установить зависимости

```bash
# Из корня монорепо
npm install

# Или по отдельности
cd apps/api && npm install
cd apps/web && npm install
```

### Шаг 4 — Мигрировать базу данных и засеять данные

```bash
cd apps/api
npx prisma migrate dev
npm run db:seed
```

Сид создаст:
| Email | Пароль | Роль |
|---|---|---|
| admin@sportmax.ru | admin123 | Admin |
| manager@sportmax.ru | manager123 | Manager |
| reception@sportmax.ru | reception123 | Reception |

### Шаг 5 — Запустить приложения

В двух отдельных терминалах:

```bash
# Терминал 1 — API (порт 3001)
cd apps/api && npm run dev

# Терминал 2 — Web (порт 3000)
cd apps/web && npm run dev
```

### Шаг 6 — Открыть в браузере

- **Веб:** http://localhost:3000
- **API Swagger:** http://localhost:7777/docs

---

## Часто используемые команды

```bash
# Посмотреть базу данных в браузере
cd apps/api && npx prisma studio

# Создать новую миграцию после изменения схемы
cd apps/api && npx prisma migrate dev --name название_изменения

# Сбросить и пересоздать БД
cd apps/api && npx prisma migrate reset

# Сборка для продакшена
npm run build

# Запуск тестов
npm run test
```
