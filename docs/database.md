# База данных — SportMax ERP

> PostgreSQL 17. ORM: Prisma. Схема: `apps/api/prisma/schema.prisma`

---

## Диаграмма связей (упрощённая)

```
Staff (сотрудники)
  │
  ├──► Deal (сделки) ──► Pipeline_Stage ──► Pipeline (воронки)
  ├──► DealComment
  ├──► DealTask
  └──► ClientMembership (продал абонемент)

Client (клиенты)
  │
  ├──► ClientMembership ──► Membership ──► MembershipType
  ├──► ClientVisit (посещения)
  ├──► RfidKey ──► AccessEvent (проходы)
  ├──► ClientLoyalty ──► LoyaltyTransaction
  ├──► ClassRegistration ──► Class ──► ClassType, Trainer
  ├──► Payment
  ├──► Deal
  ├──► PhoneCall
  └──► ClientNote
```

---

## Таблицы

### `staff` — Сотрудники

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | Уникальный идентификатор |
| role | Enum Role | ADMIN / MANAGER / RECEPTION / TRAINER / DIRECTOR |
| firstName | String | Имя |
| lastName | String | Фамилия |
| email | String (unique) | Email (логин) |
| passwordHash | String | Хэш пароля (bcrypt) |
| isActive | Boolean | Активен ли аккаунт |

---

### `clients` — Клиенты

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | Уникальный идентификатор |
| firstName | String | Имя |
| lastName | String | Фамилия |
| phone | String | Телефон (основной) |
| email | String? | Email |
| photoUrl | String? | URL фотографии |
| photos | Json? | Массив URL дополнительных фото |
| birthDate | DateTime? | Дата рождения |
| balance | Decimal | Баланс (рубли) |
| referralCode | String? | Реферальный код |
| referredById | Int? | Кто привёл (FK → clients) |
| tags | Json? | Теги (массив строк) |
| isActive | Boolean | Активен ли клиент |
| registrationDate | DateTime | Дата регистрации |

---

### `memberships` — Виды абонементов

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| name | String | Название ("Месяц безлимит") |
| price | Decimal | Цена |
| visitCount | Int? | Количество посещений (null = безлимит) |
| daysValid | Int? | Срок действия в днях |
| freezeDaysAllowed | Int | Дней заморозки |

### `client_memberships` — Купленные абонементы

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| clientId | Int (FK) | Клиент |
| membershipId | Int (FK) | Вид абонемента |
| status | Enum | ACTIVE / EXPIRED / FROZEN / CANCELLED |
| purchaseDate | DateTime | Дата покупки |
| expirationDate | DateTime? | Дата окончания |
| remainingVisits | Int? | Оставшихся посещений |
| frozenAt | DateTime? | Когда заморожен |

---

### `client_visits` — Посещения

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| clientId | Int (FK) | Клиент |
| checkInTime | DateTime | Время входа |
| checkOutTime | DateTime? | Время выхода (null = ещё в клубе) |
| status | Enum | ACTIVE / COMPLETED / OVERSTAY |
| checkedInById | Int? (FK) | Кто отметил вход |

---

### `rfid_keys` — RFID карты и браслеты

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| clientId | Int (FK) | Клиент |
| code | String (unique) | Код карты/браслета |
| type | String | card / bracelet / keyfob |
| isActive | Boolean | Активна ли |
| issuedAt | DateTime | Когда выдана |
| revokedAt | DateTime? | Когда заблокирована |

### `access_events` — События прохода

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| rfidKeyId | Int? (FK) | RFID ключ |
| type | Enum | ENTRY / EXIT / DENIED |
| zone | String | Зона доступа |
| granted | Boolean | Разрешён ли проход |
| reason | String? | Причина отказа |
| timestamp | DateTime | Время события |

### `access_rules` — Правила доступа

| Поле | Тип | Описание |
|---|---|---|
| zone | String | Зона |
| timeFrom | String? | С какого времени (HH:MM) |
| timeTo | String? | До какого времени |
| weekdays | Json? | Дни недели [0,1,2,3,4,5,6] |

---

### `pipelines` — Воронки продаж

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| name | String | Название воронки |
| isDefault | Boolean | Основная воронка |

### `pipeline_stages` — Этапы воронки

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| pipelineId | Int (FK) | Воронка |
| name | String | Название этапа |
| color | String | Цвет (#hex) |
| sortOrder | Int | Порядок |
| isWon | Boolean | Этап "Успешно" |
| isLost | Boolean | Этап "Отказ" |

### `deals` — Сделки

| Поле | Тип | Описание |
|---|---|---|
| id | Int (PK) | — |
| pipelineId | Int (FK) | Воронка |
| stageId | Int (FK) | Текущий этап |
| clientId | Int? (FK) | Клиент |
| title | String | Название сделки |
| amount | Decimal? | Сумма сделки |
| status | Enum | OPEN / WON / LOST / ARCHIVED |
| assignedToId | Int? (FK) | Ответственный менеджер |
| dueDate | DateTime? | Срок |

### `deal_comments`, `deal_tasks`, `deal_activities` — Активности по сделке

---

### `loyalty_programs` — Программы лояльности

| Поле | Тип | Описание |
|---|---|---|
| earnRate | Decimal | Баллов за рубль |
| spendRate | Decimal | Рублей за балл |
| levels | Json | Уровни [{name, minPoints, discount}] |

### `client_loyalty` — Аккаунт лояльности клиента

| Поле | Тип | Описание |
|---|---|---|
| clientId | Int (unique, FK) | Клиент (1 запись на клиента) |
| points | Int | Текущий баланс баллов |
| level | String | Текущий уровень (base/silver/gold/platinum) |
| totalEarned | Int | Всего заработано |

### `loyalty_transactions` — История баллов

---

### `classes` — Занятия

| Поле | Тип | Описание |
|---|---|---|
| classTypeId | Int (FK) | Тип (йога, кардио, ...) |
| trainerId | Int? (FK) | Тренер |
| startTime | DateTime | Начало |
| endTime | DateTime | Конец |
| maxCapacity | Int | Максимум участников |
| isRecurring | Boolean | Повторяющееся |
| recurRule | String? | RRULE (iCal формат) |

### `class_registrations` — Записи на занятия

| Поле | Тип | Описание |
|---|---|---|
| classId | Int (FK) | Занятие |
| clientId | Int (FK) | Клиент |
| status | String | registered / attended / cancelled / waitlist |

---

### `payments` — Платежи

| Поле | Тип | Описание |
|---|---|---|
| amount | Decimal | Сумма |
| method | Enum | CASH / CARD / ONLINE / TRANSFER |
| status | Enum | PENDING / COMPLETED / REFUNDED / CANCELLED |

### `cash_operations` — Кассовые операции

| Поле | Тип | Описание |
|---|---|---|
| type | String | income / expense |
| category | String | Категория |
| amount | Decimal | Сумма |

### `invoices` — Счета

### `phone_calls` — Звонки (Mango Office)

| Поле | Тип | Описание |
|---|---|---|
| direction | Enum | IN / OUT |
| duration | Int | Секунды |
| recordingUrl | String? | Ссылка на запись |
| transcription | String? | Расшифровка |

---

## Работа с базой данных

### Посмотреть данные в браузере
```bash
cd apps/api
npx prisma studio
# Откроется http://localhost:5555
```

### Создать миграцию после изменения схемы
```bash
cd apps/api
npx prisma migrate dev --name add_new_field
```

### Применить миграции в продакшене
```bash
npx prisma migrate deploy
```

### Сбросить БД (осторожно — удалит все данные!)
```bash
npx prisma migrate reset
```
