# Модуль: Клиенты

## Назначение
Управление базой клиентов фитнес-клуба.

## Таблицы БД
- `clients` — основная карточка клиента
- `client_notes` — заметки по клиенту
- `client_memberships` — купленные абонементы

## API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | `/clients` | Список с поиском и пагинацией |
| GET | `/clients/stats` | Статистика (всего, активных, новых) |
| GET | `/clients/:id` | Полная карточка со всеми связями |
| POST | `/clients` | Создать |
| PUT | `/clients/:id` | Обновить |
| DELETE | `/clients/:id` | Деактивировать |

## Файлы

| Файл | Описание |
|---|---|
| `apps/api/src/modules/clients/clients.service.ts` | Бизнес-логика |
| `apps/api/src/modules/clients/clients.controller.ts` | HTTP маршруты |
| `apps/api/src/modules/clients/dto/create-client.dto.ts` | Схемы данных |
| `apps/web/app/(dashboard)/clients/page.tsx` | Список клиентов |
| `apps/web/app/(dashboard)/clients/[id]/page.tsx` | Карточка клиента |

## Особенности
- Мягкое удаление: `isActive = false` (данные не удаляются)
- Поиск по имени, фамилии, телефону, email (case-insensitive)
- Реферальная программа: поле `referredById` → `referralCode`
- Множественные фото: `photos: Json` (массив URL)
