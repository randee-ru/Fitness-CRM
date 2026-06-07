# Модуль: RFID и Контроль доступа

## Назначение
Управление RFID-картами и браслетами клиентов. Контроль прохода через турникеты. Интеграция с системой Sigur.

## Таблицы БД
- `rfid_keys` — карты и браслеты клиентов
- `access_rules` — правила доступа по зонам
- `access_events` — журнал всех проходов

## API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| POST | `/rfid/access` | Проверить доступ (вызывается турникетом) |
| GET | `/rfid/events` | Журнал событий |
| GET | `/rfid/clients/:id/keys` | RFID ключи клиента |
| POST | `/rfid/clients/:id/keys` | Выдать карту/браслет |
| PUT | `/rfid/keys/:id/revoke` | Заблокировать ключ |

## Алгоритм проверки доступа

1. Найти ключ по коду (`code`)
2. Проверить `isActive` ключа
3. Проверить `isActive` клиента
4. Проверить наличие активного абонемента
5. Записать событие в `access_events`
6. Если разрешён → создать `ClientVisit`
7. Вернуть `{ granted: boolean, reason?, client? }`

## Интеграция с турникетом

```http
POST /api/rfid/access
Content-Type: application/json

{
  "code": "A1B2C3D4",      // код считанной карты
  "zone": "main",           // зона (main/pool/gym/sauna)
  "deviceId": "turnstile-1" // идентификатор устройства
}
```

## Файлы

| Файл | Описание |
|---|---|
| `apps/api/src/modules/rfid/rfid.service.ts` | Бизнес-логика |
| `apps/api/src/modules/rfid/rfid.controller.ts` | HTTP маршруты |
| `apps/web/app/(dashboard)/rfid/page.tsx` | UI: журнал и ключи |
