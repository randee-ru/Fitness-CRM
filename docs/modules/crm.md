# Модуль: CRM

## Назначение
Управление продажами через воронки. Менеджеры ведут потенциальных клиентов от первого контакта до продажи абонемента.

## Таблицы БД
- `pipelines` — воронки продаж
- `pipeline_stages` — этапы воронки
- `deals` — сделки (карточки в Kanban)
- `deal_comments` — комментарии по сделкам
- `deal_tasks` — задачи менеджеров
- `deal_activities` — журнал изменений

## API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | `/crm/pipelines` | Воронки с этапами и сделками |
| POST | `/crm/pipelines` | Создать воронку |
| GET | `/crm/deals` | Список сделок |
| GET | `/crm/deals/:id` | Детали + история + задачи |
| POST | `/crm/deals` | Создать сделку |
| PUT | `/crm/deals/:id` | Обновить сделку |
| PUT | `/crm/deals/:id/move` | Переместить в другой этап (Kanban) |
| POST | `/crm/deals/:id/comments` | Добавить комментарий |
| POST | `/crm/deals/:id/tasks` | Создать задачу |
| PUT | `/crm/tasks/:id/complete` | Завершить задачу |

## Файлы

| Файл | Описание |
|---|---|
| `apps/api/src/modules/crm/crm.service.ts` | Бизнес-логика |
| `apps/api/src/modules/crm/crm.controller.ts` | HTTP маршруты |
| `apps/web/app/(dashboard)/crm/page.tsx` | Kanban доска |

## Особенности
- Этапы `isWon: true` / `isLost: true` — терминальные состояния
- При перемещении карточки автоматически создаётся `DealActivity` с типом `stage_change`
- Пакет `@dnd-kit` установлен для drag-and-drop на фронтенде
