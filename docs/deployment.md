# Развёртывание (Deployment)

## Продакшен — одна команда

```bash
# Скопировать .env.example, заполнить реальными данными
cp .env.example .env
nano .env   # редактировать

# Запустить всё
docker compose up -d
```

Система поднимет:
- PostgreSQL (внутри Docker)
- Redis (внутри Docker)
- NestJS API на :3001
- Next.js Web на :3000
- Caddy (HTTPS reverse proxy) на :80 и :443

---

## Переменные окружения (`.env`)

```env
# --- PostgreSQL ---
POSTGRES_PASSWORD=сложный_пароль_здесь
DATABASE_URL=postgresql://sportmax:сложный_пароль@postgres:5432/sportmax_db

# --- Redis ---
REDIS_PASSWORD=redis_пароль
REDIS_URL=redis://:redis_пароль@redis:6379

# --- JWT ---
JWT_SECRET=очень_длинная_случайная_строка_минимум_64_символа
JWT_EXPIRES_IN=7d

# --- API ---
API_PORT=3001

# --- Web ---
NEXT_PUBLIC_API_URL=https://sportmax.yourdomain.com
NEXTAUTH_SECRET=ещё_одна_случайная_строка
NEXTAUTH_URL=https://sportmax.yourdomain.com

# --- Mango Office ---
MANGO_API_KEY=ваш_ключ
MANGO_API_SALT=ваш_солт
MANGO_VPBX_ID=ваш_id

# --- Sentry ---
SENTRY_DSN=https://key@sentry.io/project
```

---

## Настройка домена (Caddy)

Отредактируйте `infra/Caddyfile`:

```
sportmax.yourdomain.com {
    handle /api/* {
        reverse_proxy api:3001
    }
    handle /docs* {
        reverse_proxy api:3001
    }
    handle /* {
        reverse_proxy web:3000
    }
    encode gzip
}
```

Caddy **автоматически** получит SSL-сертификат от Let's Encrypt.

---

## Обновление приложения

```bash
# Получить последнюю версию
git pull origin main

# Пересобрать и перезапустить
docker compose up -d --build

# Применить новые миграции (если есть)
docker compose exec api npx prisma migrate deploy
```

---

## Полезные команды Docker

```bash
# Статус контейнеров
docker compose ps

# Логи конкретного сервиса
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Зайти в контейнер API
docker compose exec api sh

# Зайти в PostgreSQL
docker compose exec postgres psql -U sportmax -d sportmax_db

# Остановить всё
docker compose down

# Остановить и удалить данные (ОСТОРОЖНО!)
docker compose down -v
```

---

## Бэкап базы данных

```bash
# Сделать дамп
docker compose exec postgres pg_dump -U sportmax sportmax_db > backup_$(date +%Y%m%d).sql

# Восстановить из дампа
docker compose exec -i postgres psql -U sportmax sportmax_db < backup_20250606.sql
```

---

## Мониторинг

### Sentry (ошибки)
Установите `SENTRY_DSN` в `.env`. Все необработанные ошибки будут отправляться в Sentry.

### Логи (Pino)
Логи API пишутся в stdout в JSON-формате. В продакшене:
```bash
docker compose logs -f api | grep '"level":50'  # только ошибки
```

### Prisma Studio (просмотр БД)
```bash
docker compose exec api npx prisma studio --port 5555
# Откроется http://localhost:5555
```
