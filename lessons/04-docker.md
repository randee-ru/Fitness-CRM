# Урок 04 — Docker и базы данных

## Проблема "у меня работает"

Представьте: разработчик Иван установил PostgreSQL версии 14 на Mac. Разработчик Петя работает на Windows с PostgreSQL 16. На сервере стоит PostgreSQL 15. У всех разные настройки, разные версии — и код работает по-разному.

**Docker решает эту проблему.** Docker создаёт изолированные **контейнеры** — одинаковые на любом компьютере.

---

## Что такое Docker

**Образ (Image)** — шаблон: "возьми Ubuntu, установи PostgreSQL 17, настрой так-то".

**Контейнер (Container)** — запущенный образ. Как запущенная программа.

```
Образ postgres:17-alpine
        │
        ▼
Контейнер sportmax_postgres   ← работает на вашем компьютере
        │
        ▼
postgresql://localhost:5432   ← к нему подключается приложение
```

---

## Наш docker-compose.dev.yml

Для разработки нам нужны только базы данных. Полный файл:

```yaml
services:
  postgres:
    image: postgres:17-alpine      # образ с Docker Hub
    container_name: sportmax_postgres_dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: sportmax_db     # имя базы данных
      POSTGRES_USER: sportmax      # пользователь
      POSTGRES_PASSWORD: sportmax  # пароль
    ports:
      - "5432:5432"                # порт на вашем ПК : порт внутри контейнера
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data  # сохраняем данные

  redis:
    image: redis:7-alpine
    container_name: sportmax_redis_dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:   # именованный том для хранения данных
  redis_dev_data:
```

### Запуск
```bash
docker compose -f docker-compose.dev.yml up -d
# -d = detached (в фоне)
```

### Проверить что запущено
```bash
docker compose -f docker-compose.dev.yml ps

# NAME                      STATUS
# sportmax_postgres_dev     running
# sportmax_redis_dev        running
```

---

## Полный docker-compose.yml (продакшен)

```yaml
services:
  postgres:
    image: postgres:17-alpine
    # ... (то же что выше, но с надёжным паролем из .env)

  redis:
    image: redis:7-alpine
    # ...

  api:
    build:
      context: ./apps/api       # собираем из Dockerfile
      dockerfile: Dockerfile
    depends_on:
      postgres:
        condition: service_healthy  # ждём пока postgres готов
      redis:
        condition: service_healthy

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    depends_on:
      - api

  caddy:
    image: caddy:2-alpine       # reverse proxy
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
      - api
```

Когда сервисы зависят друг от друга (`depends_on`), Docker запускает их в правильном порядке: postgres → redis → api → web → caddy.

---

## Dockerfile — инструкция сборки образа

```dockerfile
# apps/api/Dockerfile

# Базовый образ
FROM node:20-alpine AS base
WORKDIR /app

# Шаг 1: установить зависимости
FROM base AS deps
COPY package*.json ./
RUN npm ci            # как npm install, но строже

# Шаг 2: собрать приложение
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate   # генерация Prisma клиента
RUN npm run build          # TypeScript → JavaScript

# Шаг 3: продакшен-образ (только нужное)
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist   # скомпилированный JS
COPY prisma ./prisma

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

Это **многоступенчатая сборка** (multi-stage build). Финальный образ содержит только необходимое — он легче.

---

## PostgreSQL — что это и зачем

PostgreSQL — реляционная база данных. Данные хранятся в таблицах (как Excel).

```
Таблица clients:
┌────┬───────────┬──────────┬─────────────────┐
│ id │ firstName │ lastName │ phone           │
├────┼───────────┼──────────┼─────────────────┤
│  1 │ Александр │ Иванов   │ 79161234567     │
│  2 │ Екатерина │ Петрова  │ 79251112233     │
│  3 │ Михаил    │ Сидоров  │ 79037778899     │
└────┴───────────┴──────────┴─────────────────┘
```

**Связи между таблицами:**

```
clients                  client_memberships       memberships
┌────┬──────┐            ┌────┬──────────┬───────┐ ┌────┬──────────────────┐
│ id │ name │            │ id │ clientId │ memId │ │ id │ name             │
├────┼──────┤      ┌────►├────┼──────────┼───────┤ ├────┼──────────────────┤
│  1 │ Иван │──────┤     │  1 │    1     │   2   │►│  2 │ Месяц безлимит   │
│  2 │ Петя │      │     │  2 │    1     │   3   │ │  3 │ 10 посещений     │
└────┴──────┘      └────►│  3 │    2     │   2   │ └────┴──────────────────┘
                         └────┴──────────┴───────┘
```

У клиента Ивана (id=1) есть два абонемента (id=2 и id=3).

---

## Redis — для чего используем

Redis — база данных в памяти (RAM). Работает очень быстро.

Используем для:

**1. Кэш** — чтобы не делать тяжёлые запросы в PostgreSQL каждый раз:
```
Запрос "список клиентов"
→ Проверяем Redis: есть ли кэш?
→ Если да: возвращаем из Redis (1 мс)
→ Если нет: идём в PostgreSQL (50 мс), сохраняем в Redis на 30 сек
```

**2. Очереди задач (BullMQ)** — для фоновых операций:
```
Пользователь купил абонемент
→ Немедленно отвечаем "OK"
→ В фоне: BullMQ добавляет задачу "отправить SMS"
→ Worker обрабатывает: отправляет SMS
```

---

## Полезные команды

```bash
# Запустить базы данных для разработки
docker compose -f docker-compose.dev.yml up -d

# Остановить
docker compose -f docker-compose.dev.yml down

# Посмотреть логи PostgreSQL
docker logs sportmax_postgres_dev

# Зайти в PostgreSQL напрямую
docker exec -it sportmax_postgres_dev psql -U sportmax -d sportmax_db

# Запустить SQL запрос
docker exec sportmax_postgres_dev psql -U sportmax -d sportmax_db -c "SELECT COUNT(*) FROM clients;"
```

---

## Задание

1. Запустите `docker compose -f docker-compose.dev.yml up -d`
2. Убедитесь что контейнеры работают: `docker compose -f docker-compose.dev.yml ps`
3. Подключитесь к PostgreSQL напрямую: `docker exec -it sportmax_postgres_dev psql -U sportmax -d sportmax_db`
4. Введите `\dt` — увидите список таблиц (после миграций)
5. Введите `SELECT * FROM staff LIMIT 5;` — увидите сотрудников
6. Введите `\q` — выйти из psql

---

**Предыдущий урок:** [03 — TypeScript](./03-typescript.md)
**Следующий урок:** [05 — Prisma ORM](./05-prisma.md)
