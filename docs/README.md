# SportMax ERP/CRM — Документация

> Система управления фитнес-клубом SportMax. Единая платформа для управления клиентами, продажами, посещениями, расписанием, лояльностью, RFID-доступом, персоналом и финансами.

---

## Содержание

| Документ | Описание |
|---|---|
| [Архитектура](./architecture.md) | Общая архитектура системы, технологический стек |
| [Быстрый старт](./quickstart.md) | Запуск за 5 минут |
| [База данных](./database.md) | Схема БД, все таблицы, связи |
| [API](./api.md) | REST API, эндпоинты, авторизация |
| [Развёртывание](./deployment.md) | Docker, продакшен, Caddy |
| [Модули](./modules/) | Документация по каждому модулю |

### Модули

| Модуль | Документ |
|---|---|
| Клиенты | [modules/clients.md](./modules/clients.md) |
| CRM | [modules/crm.md](./modules/crm.md) |
| Ресепшен и посещения | [modules/visits.md](./modules/visits.md) |
| RFID и доступ | [modules/rfid.md](./modules/rfid.md) |
| Расписание | [modules/schedule.md](./modules/schedule.md) |
| Финансы | [modules/finance.md](./modules/finance.md) |
| Лояльность | [modules/loyalty.md](./modules/loyalty.md) |
| Mango Office | [modules/mango.md](./modules/mango.md) |

---

## Технологический стек

### Фронтенд (`apps/web`)
- **Next.js 15** + React 19 — фреймворк
- **TypeScript** — типизация
- **Tailwind CSS** — стили
- **TanStack Query** — кэш и запросы к API
- **TanStack Table** — таблицы
- **@dnd-kit** — drag-and-drop (Kanban)
- **FullCalendar** — расписание
- **Recharts** — графики
- **Motion** — анимации

### Бэкенд (`apps/api`)
- **NestJS 10** — фреймворк
- **TypeScript** — типизация
- **Prisma ORM** — работа с БД
- **PostgreSQL 17** — база данных
- **Redis 7** — кэш и очереди
- **BullMQ** — фоновые задачи
- **Pino** — логирование
- **Swagger/OpenAPI** — документация API
- **JWT** — аутентификация
- **RBAC** — авторизация по ролям

### Инфраструктура
- **Docker + Docker Compose** — контейнеризация
- **Caddy** — reverse proxy + HTTPS
- **Turborepo** — монорепо

---

## Роли пользователей

| Роль | Описание | Доступ |
|---|---|---|
| `ADMIN` | Администратор | Полный доступ ко всему |
| `MANAGER` | Менеджер | CRM, клиенты, сделки, звонки |
| `RECEPTION` | Ресепшен | Посещения, RFID, оплаты |
| `TRAINER` | Тренер | Расписание, занятия, посещаемость |
| `DIRECTOR` | Директор | Аналитика, финансы, KPI |

---

## Структура проекта

```
sportmax-erp/
├── apps/
│   ├── api/                 # NestJS бэкенд
│   │   ├── prisma/          # Схема БД и миграции
│   │   └── src/
│   │       ├── modules/     # Бизнес-модули
│   │       ├── common/      # Декораторы, guards, фильтры
│   │       └── prisma/      # Prisma service
│   └── web/                 # Next.js фронтенд
│       ├── app/             # Страницы (App Router)
│       ├── components/      # React компоненты
│       └── lib/             # Утилиты и API клиент
├── packages/
│   └── shared/              # Общие TypeScript типы
├── infra/
│   ├── Caddyfile            # Конфиг Caddy
│   └── postgres/init.sql    # Инициализация БД
├── docs/                    # Документация (эта папка)
├── lessons/                 # Уроки для разработчиков
├── old/                     # Старый проект (архив)
├── docker-compose.yml       # Продакшен
├── docker-compose.dev.yml   # Разработка (только БД)
└── turbo.json               # Turborepo конфиг
```
