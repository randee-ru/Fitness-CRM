# REST API — SportMax ERP

> Базовый URL: `http://localhost:3001/api`
> Интерактивная документация: `http://localhost:3001/docs` (Swagger UI)

---

## Аутентификация

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <jwt_token>
```

### Получить токен

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sportmax.ru",
  "password": "admin123"
}
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@sportmax.ru",
    "role": "ADMIN",
    "firstName": "Администратор",
    "lastName": "SportMax"
  }
}
```

### Текущий пользователь

```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Клиенты `/api/clients`

| Метод | URL | Описание | Роли |
|---|---|---|---|
| GET | `/clients` | Список клиентов | Все |
| GET | `/clients/stats` | Статистика | Все |
| GET | `/clients/:id` | Карточка клиента | Все |
| POST | `/clients` | Создать клиента | ADMIN, MANAGER, RECEPTION |
| PUT | `/clients/:id` | Обновить клиента | ADMIN, MANAGER |
| DELETE | `/clients/:id` | Деактивировать | ADMIN |

### Параметры запроса `GET /clients`
```
?search=иванов     # поиск по имени, телефону, email
?page=1            # страница
?limit=20          # элементов на странице
?isActive=true     # фильтр по активности
```

### Пример создания клиента
```http
POST /api/clients
Authorization: Bearer <token>

{
  "firstName": "Александр",
  "lastName": "Иванов",
  "middleName": "Петрович",
  "phone": "79161234567",
  "email": "ivanov@mail.ru",
  "birthDate": "1985-03-15",
  "salesChannel": "Instagram"
}
```

---

## CRM `/api/crm`

| Метод | URL | Описание |
|---|---|---|
| GET | `/crm/pipelines` | Все воронки с этапами и сделками |
| POST | `/crm/pipelines` | Создать воронку |
| GET | `/crm/deals` | Список сделок |
| GET | `/crm/deals/:id` | Детали сделки |
| POST | `/crm/deals` | Создать сделку |
| PUT | `/crm/deals/:id` | Обновить сделку |
| PUT | `/crm/deals/:id/move` | Переместить сделку (Kanban) |
| POST | `/crm/deals/:id/comments` | Добавить комментарий |
| POST | `/crm/deals/:id/tasks` | Создать задачу |
| PUT | `/crm/tasks/:id/complete` | Завершить задачу |

### Перемещение сделки в Kanban
```http
PUT /api/crm/deals/5/move

{
  "stageId": 3
}
```

---

## Посещения `/api/visits`

| Метод | URL | Описание |
|---|---|---|
| GET | `/visits/in-club` | Клиенты в клубе сейчас |
| GET | `/visits/search?q=иванов` | Поиск для чекина |
| GET | `/visits` | История посещений |
| POST | `/visits/check-in` | Отметить вход |
| PUT | `/visits/:id/check-out` | Отметить выход |

### Чекин клиента
```http
POST /api/visits/check-in

{
  "clientId": 42
}
```

---

## RFID `/api/rfid`

| Метод | URL | Описание |
|---|---|---|
| POST | `/rfid/access` | Проверить доступ (турникет) |
| GET | `/rfid/events` | Лог событий |
| GET | `/rfid/clients/:id/keys` | Ключи клиента |
| POST | `/rfid/clients/:id/keys` | Выдать ключ |
| PUT | `/rfid/keys/:id/revoke` | Заблокировать ключ |

### Проверка доступа (вызывается турникетом)
```http
POST /api/rfid/access

{
  "code": "A1B2C3D4",
  "zone": "main",
  "deviceId": "turnstile-01"
}
```

**Ответ разрешён:**
```json
{
  "granted": true,
  "client": { "id": 1, "firstName": "Александр", "lastName": "Иванов" }
}
```

**Ответ отказан:**
```json
{
  "granted": false,
  "reason": "Абонемент истёк",
  "client": null
}
```

---

## Расписание `/api/schedule`

| Метод | URL | Описание |
|---|---|---|
| GET | `/schedule/classes` | Занятия (с фильтром по дате) |
| POST | `/schedule/classes` | Создать занятие |
| PUT | `/schedule/classes/:id` | Обновить занятие |
| DELETE | `/schedule/classes/:id` | Отменить занятие |
| POST | `/schedule/classes/:id/register` | Записать клиента |
| DELETE | `/schedule/classes/:id/register/:clientId` | Отменить запись |
| GET | `/schedule/trainers` | Список тренеров |
| GET | `/schedule/class-types` | Типы занятий |

---

## Финансы `/api/finance`

| Метод | URL | Описание | Роли |
|---|---|---|---|
| GET | `/finance/stats` | Финансовая сводка | ADMIN, DIRECTOR, MANAGER |
| GET | `/finance/payments` | Платежи | ADMIN, DIRECTOR, MANAGER, RECEPTION |
| POST | `/finance/payments` | Создать платёж | ADMIN, MANAGER, RECEPTION |
| GET | `/finance/cash` | Кассовые операции | ADMIN, DIRECTOR, MANAGER |
| POST | `/finance/cash` | Кассовая операция | ADMIN, MANAGER, RECEPTION |

---

## Лояльность `/api/loyalty`

| Метод | URL | Описание |
|---|---|---|
| GET | `/loyalty/programs` | Программы лояльности |
| GET | `/loyalty/clients/:id` | Аккаунт клиента |
| GET | `/loyalty/clients/:id/transactions` | История баллов |
| POST | `/loyalty/clients/:id/points` | Начислить / списать баллы |

### Начислить баллы
```http
POST /api/loyalty/clients/42/points

{
  "points": 350,
  "description": "Покупка абонемента"
}
```

### Списать баллы (отрицательное значение)
```http
POST /api/loyalty/clients/42/points

{
  "points": -100,
  "description": "Оплата баллами"
}
```

---

## Звонки (Mango) `/api/mango`

| Метод | URL | Описание |
|---|---|---|
| POST | `/mango/webhook` | Вебхук от Mango Office |
| GET | `/mango/calls` | История звонков |

---

## Коды ошибок

| Код | Описание |
|---|---|
| 200 | Успешно |
| 201 | Создано |
| 400 | Неверный запрос (Bad Request) |
| 401 | Не авторизован (нет/невалидный токен) |
| 403 | Нет прав (роль не позволяет) |
| 404 | Не найдено |
| 429 | Слишком много запросов (rate limit) |
| 500 | Внутренняя ошибка сервера |

**Формат ошибки:**
```json
{
  "statusCode": 404,
  "message": "Клиент #999 не найден",
  "timestamp": "2025-06-06T11:30:00.000Z"
}
```
