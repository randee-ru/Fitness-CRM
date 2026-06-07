# SportMax ERP — Тестовые аккаунты

> Файл для разработки. В продакшене удалить или изменить все пароли!

---

## Адреса сервисов

| Сервис | URL |
|---|---|
| 🌐 Веб-интерфейс | http://localhost:3000 |
| 🔧 API (NestJS) | http://localhost:7777 |
| 📖 Swagger / API Docs | http://localhost:7777/docs |
| 🗄️ Prisma Studio (БД) | http://localhost:5555 |
| 🐘 PostgreSQL | localhost:5432 |
| 🔴 Redis | localhost:6379 |

---

## Тестовые аккаунты сотрудников

| Роль | Email | Пароль | Доступ |
|---|---|---|---|
| **Admin** | admin@sportmax.ru | admin123 | Полный доступ ко всему |
| **Manager** | manager@sportmax.ru | manager123 | CRM, клиенты, сделки, звонки |
| **Reception** | reception@sportmax.ru | reception123 | Посещения, RFID, оплаты |

---

## Подключение к базе данных

```
Host:     localhost
Port:     5432
Database: sportmax_db
User:     sportmax
Password: sportmax
```

Строка подключения:
```
postgresql://sportmax:sportmax@localhost:5432/sportmax_db
```

Подключиться через DBeaver или Prisma Studio:
```bash
cd apps/api && npx prisma studio
```

---

## Быстрый вход через API

```bash
# Получить JWT токен для admin
curl -s -X POST http://localhost:7777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sportmax.ru","password":"admin123"}' | python3 -m json.tool

# Получить токен одной строкой (для использования в curl)
TOKEN=$(curl -s -X POST http://localhost:7777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sportmax.ru","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Использовать токен в запросах
curl -s http://localhost:7777/api/clients \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## Структура seed данных

После `npm run db:seed` в базе создаются:

### Сотрудники
- 3 аккаунта (Admin, Manager, Reception) — см. таблицу выше

### Абонементы
| Название | Цена | Условия |
|---|---|---|
| Месяц безлимит | ₽ 3 500 | 30 дней, заморозка 14 дней |
| 3 месяца безлимит | ₽ 9 000 | 90 дней, заморозка 30 дней |
| 10 посещений | ₽ 2 500 | 10 визитов, 60 дней |

### Воронка продаж
Создаётся воронка **"Продажи абонементов"** с 6 этапами:
1. Новый лид
2. Консультация
3. Пробное занятие
4. Коммерческое предложение
5. Успешно ✅
6. Отказ ❌

### Программа лояльности
**SportMax Rewards** — 10 баллов за рубль.
Уровни: Бронза → Серебро (500 б.) → Золото (2000 б.) → Платина (5000 б.)

### Типы занятий
Йога, Силовая, Кардио, Растяжка, Пилатес, Зумба

---

## Пересоздать тестовые данные

```bash
cd apps/api

# Сбросить и пересоздать БД (УДАЛИТ ВСЕ ДАННЫЕ!)
npx prisma migrate reset

# Только досеять данные без сброса
npm run db:seed
```

---

> ⚠️ Не коммитьте реальные пароли! Этот файл — только для тестовой среды разработки.
