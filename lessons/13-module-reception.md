# Урок 13 — Ресепшен, посещения и RFID

## Что делает ресепшен

Каждый день ресепшионист:
1. Видит кто сейчас в клубе
2. Отмечает вход (через RFID или вручную)
3. Отмечает выход
4. Следит за временем пребывания
5. Выдаёт карты и браслеты

---

## Посещения — таблица `client_visits`

```prisma
model ClientVisit {
  id            Int         @id @default(autoincrement())
  clientId      Int
  client        Client      @relation(fields: [clientId], references: [id])

  checkInTime   DateTime    @default(now())  // время входа
  checkOutTime  DateTime?                    // время выхода (null = ещё в клубе)

  status        VisitStatus @default(ACTIVE)
  // ACTIVE   = клиент в клубе
  // COMPLETED = вышел нормально
  // OVERSTAY  = пробыл слишком долго (> 3 часов)

  checkedInById Int?        // кто отметил вход (сотрудник)
  notes         String?     // заметки
  overstayMins  Int?        // минут сверх нормы

  @@map("client_visits")
}
```

---

## VisitsService — вход и выход

```typescript
// apps/api/src/modules/visits/visits.service.ts

// ВХОД: клиент пришёл
async checkIn(clientId: number, staffId?: number) {
  // 1. Проверить что клиент существует и активен
  const client = await this.prisma.client.findUnique({ where: { id: clientId } })
  if (!client) throw new NotFoundException(`Клиент #${clientId} не найден`)
  if (!client.isActive) throw new BadRequestException('Клиент деактивирован')

  // 2. Проверить что не находится уже в клубе
  const existing = await this.prisma.clientVisit.findFirst({
    where: { clientId, status: 'ACTIVE' }
  })
  if (existing) throw new BadRequestException('Клиент уже в клубе')

  // 3. Создать запись о посещении
  return this.prisma.clientVisit.create({
    data: {
      clientId,
      checkedInById: staffId,
      status: 'ACTIVE'  // клиент в клубе
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, photoUrl: true } }
    }
  })
}

// ВЫХОД: клиент уходит
async checkOut(visitId: number) {
  const visit = await this.prisma.clientVisit.findUnique({ where: { id: visitId } })
  if (!visit) throw new NotFoundException(`Визит #${visitId} не найден`)
  if (visit.status !== 'ACTIVE') throw new BadRequestException('Визит уже завершён')

  // Считаем сколько времени провёл
  const duration = Math.round((Date.now() - visit.checkInTime.getTime()) / 60000)
  const isOverstay = duration > 180  // более 3 часов = задержка

  return this.prisma.clientVisit.update({
    where: { id: visitId },
    data: {
      checkOutTime: new Date(),
      status: isOverstay ? 'OVERSTAY' : 'COMPLETED'
    }
  })
}

// Кто в клубе сейчас
async getClientsInClub() {
  return this.prisma.clientVisit.findMany({
    where: { status: 'ACTIVE' },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          phone: true,
          memberships: {
            where: { status: 'ACTIVE' },
            take: 1,
            select: { membership: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: { checkInTime: 'asc' }  // давно пришедшие — первыми
  })
}
```

---

## RFID — система контроля доступа

### Как работает турникет

```
Клиент прикладывает карту к считывателю
        │
        ▼
Считыватель → SportMax Agent (локальное ПО)
        │
        ▼
POST /api/rfid/access { code: "A1B2C3D4", zone: "main" }
        │
        ▼
RfidService.processAccess():
  - Найти rfid_key по code
  - Проверить isActive
  - Проверить клиента isActive
  - Проверить наличие активного абонемента
        │
        ▼
Ответ: { granted: true, client: {...} }  ← турникет открывается
  или: { granted: false, reason: "..." } ← турникет закрыт, звуковой сигнал
        │
        ▼
Записываем в access_events (лог всех событий)
```

### RfidService — проверка доступа

```typescript
async processAccess(code: string, zone: string, deviceId?: string) {
  // 1. Найти ключ с данными клиента и его абонементами
  const key = await this.prisma.rfidKey.findUnique({
    where: { code },
    include: {
      client: {
        include: {
          memberships: { where: { status: 'ACTIVE' }, take: 1 }
        }
      }
    }
  })

  let granted = false
  let reason: string | undefined

  // Последовательные проверки
  if (!key || !key.isActive) {
    reason = 'RFID ключ не найден или заблокирован'
  } else if (!key.client.isActive) {
    reason = 'Клиент деактивирован'
  } else if (key.client.memberships.length === 0) {
    reason = 'Нет активного абонемента'
  } else {
    granted = true  // всё проверки прошли — пускаем!
  }

  // 2. Записать событие в лог (всегда, независимо от результата)
  await this.prisma.accessEvent.create({
    data: {
      rfidKeyId: key?.id,
      type: granted ? 'ENTRY' : 'DENIED',
      zone,
      deviceId,
      granted,
      reason,
    }
  })

  // 3. Если пустили — автоматически отметить вход
  if (granted && key) {
    const existingVisit = await this.prisma.clientVisit.findFirst({
      where: { clientId: key.clientId, status: 'ACTIVE' }
    })
    if (!existingVisit) {
      await this.prisma.clientVisit.create({
        data: { clientId: key.clientId, status: 'ACTIVE' }
      })
    }
  }

  return {
    granted,
    reason,
    client: granted ? {
      id: key!.client.id,
      firstName: key!.client.firstName,
      lastName: key!.client.lastName
    } : null
  }
}
```

### Выдача карты/браслета

```typescript
async issueKey(clientId: number, data: { code: string; type: string; label?: string }) {
  // Деактивировать старые ключи клиента (можно иметь только один активный)
  await this.prisma.rfidKey.updateMany({
    where: { clientId, isActive: true },
    data: { isActive: false, revokedAt: new Date() }
  })

  // Выдать новый ключ
  return this.prisma.rfidKey.create({
    data: { clientId, ...data },
    include: { client: { select: { id: true, firstName: true, lastName: true } } }
  })
}
```

---

## UI Ресепшена — разбор страницы

```typescript
// apps/web/app/(dashboard)/reception/page.tsx

export default function ReceptionPage() {
  const [tab, setTab] = useState<'in-club' | 'check-in'>('in-club')

  return (
    <div>
      {/* Счётчики */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4">
          <div className="text-2xl font-bold text-indigo-400">4</div>
          <div className="text-xs text-white/40">В клубе сейчас</div>
        </div>
        {/* ... */}
      </div>

      {/* Вкладки: В клубе / Отметить вход */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {['in-club', 'check-in'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-1.5 rounded-md text-sm ${
              tab === t ? 'bg-indigo-600 text-white' : 'text-white/50'
            }`}
          >
            {t === 'in-club' ? 'В клубе' : 'Отметить вход'}
          </button>
        ))}
      </div>

      {/* Таблица клиентов в клубе */}
      {tab === 'in-club' && (
        <div className="glass">
          {inClub.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_140px_180px_100px_80px]
                                        items-center px-4 py-3 hover:bg-white/4">
              {/* Аватар + имя */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400
                                flex items-center justify-center text-xs font-bold">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <span>{c.lastName} {c.firstName}</span>
              </div>

              <span>{c.phone}</span>
              <span>{c.membership}</span>

              {/* Время входа */}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                {c.checkIn}
              </span>

              {/* Как долго в клубе */}
              <span className="text-emerald-400">{c.duration}</span>
            </div>
          ))}
        </div>
      )}

      {/* Форма чекина */}
      {tab === 'check-in' && (
        <div className="glass p-6 max-w-lg">
          <input placeholder="Введите имя или телефон..." className="input" />
          {/* Результаты поиска с кнопкой "Войти" */}
        </div>
      )}
    </div>
  )
}
```

---

## Задание

1. Запустите API и выполните чекин через Swagger: `POST /visits/check-in { "clientId": 1 }`
2. Проверьте `GET /visits/in-club` — клиент появился
3. Выполните `PUT /visits/1/check-out` — клиент вышел
4. **Подключите реальный API к ресепшену** — замените mock-данные `inClub` на `useQuery` к `/visits/in-club`
5. **RFID тест:** выполните `POST /rfid/clients/1/keys { "code": "TEST001", "type": "card" }`, затем `POST /rfid/access { "code": "TEST001", "zone": "main" }` — должен вернуть `{ granted: true }`

---

**Предыдущий урок:** [12 — CRM](./12-module-crm.md)
**Следующий урок:** [14 — Расписание](./14-module-schedule.md)
