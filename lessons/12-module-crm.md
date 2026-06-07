# Урок 12 — CRM: воронки, сделки и Kanban

## Что такое CRM в контексте фитнес-клуба

CRM (Customer Relationship Management) — система управления отношениями с клиентами.

В нашем случае: менеджер ведёт потенциальных клиентов через **воронку продаж**:

```
Новый лид → Позвонили → Пробное занятие → Отправили КП → Продали абонемент!
```

---

## Архитектура CRM

```
Pipeline (воронка)
│  "Продажи абонементов"
│
├── Pipeline_Stage (этапы, упорядочены)
│   ├── "Новый лид"        (sortOrder: 0)
│   ├── "Консультация"     (sortOrder: 1)
│   ├── "Пробное занятие"  (sortOrder: 2)
│   ├── "КП отправлено"    (sortOrder: 3)
│   ├── "Успешно"          (sortOrder: 4, isWon: true)
│   └── "Отказ"            (sortOrder: 5, isLost: true)
│
└── Deal (сделки — карточки в Kanban)
    ├── Иванова М.С. — Месяц безлимит ₽3500   [Новый лид]
    ├── Петров В.А. — Годовой ₽18000           [Консультация]
    └── Козлова Н.П. — 3 месяца ₽9000          [КП отправлено]
```

---

## База данных

```prisma
model Pipeline {
  id        Int    @id @default(autoincrement())
  name      String          // "Продажи абонементов"
  isDefault Boolean         // основная воронка
  stages    Pipeline_Stage[]
  deals     Deal[]
  @@map("pipelines")
}

model Pipeline_Stage {
  id         Int      @id @default(autoincrement())
  pipelineId Int
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  name       String
  color      String   @default("#6366f1")  // цвет колонки в Kanban
  sortOrder  Int      @default(0)          // порядок колонок
  isWon      Boolean  @default(false)      // этап "Успешная продажа"
  isLost     Boolean  @default(false)      // этап "Отказ"
  deals      Deal[]
  @@map("pipeline_stages")
}

model Deal {
  id          Int           @id @default(autoincrement())
  pipelineId  Int
  stageId     Int           // текущий этап (колонка в Kanban)
  clientId    Int?          // потенциальный клиент (необязательно)
  title       String        // "Иванова М.С. — Месяц безлимит"
  amount      Decimal?      // сумма потенциальной сделки
  status      DealStatus    // OPEN | WON | LOST | ARCHIVED
  assignedToId Int?         // ответственный менеджер
  dueDate     DateTime?     // срок

  // Связанные данные
  comments   DealComment[]   // комментарии
  tasks      DealTask[]      // задачи
  activities DealActivity[]  // лог изменений
  @@map("deals")
}
```

---

## CrmService — ключевые методы

### getPipelines() — Kanban данные

```typescript
async getPipelines() {
  return this.prisma.pipeline.findMany({
    where: { isActive: true },
    include: {
      stages: {
        orderBy: { sortOrder: 'asc' },  // колонки в правильном порядке
        include: {
          deals: {
            where: { status: 'OPEN' },   // только открытые сделки
            include: {
              client: {
                select: { id: true, firstName: true, lastName: true, phone: true }
              },
              assignedTo: {
                select: { id: true, firstName: true, lastName: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })
}
```

**Результат** — дерево объектов: воронка → этапы → сделки. Фронтенд рисует Kanban из этих данных.

### moveDeal() — перемещение карточки

```typescript
// Вызывается когда пользователь перетащил карточку в другую колонку
async moveDeal(id: number, stageId: number) {
  const deal = await this.getDeal(id)  // текущие данные
  const stage = await this.prisma.pipeline_Stage.findUnique({ where: { id: stageId } })

  // 1. Обновляем stageId сделки
  const updated = await this.prisma.deal.update({
    where: { id },
    data: { stageId }
  })

  // 2. Записываем в историю: кто, когда, из какого этапа в какой
  await this.prisma.dealActivity.create({
    data: {
      dealId: id,
      type: 'stage_change',
      data: {
        from: deal.stageId,
        to: stageId,
        fromName: deal.stage.name,
        toName: stage.name
      }
    }
  })

  return updated
}
```

---

## Kanban на фронтенде

### Текущая реализация (mock)

```typescript
// apps/web/app/(dashboard)/crm/page.tsx

const pipeline = {
  stages: [
    {
      id: 1,
      name: 'Новый лид',
      color: '#6366f1',
      deals: [
        { id: 1, title: 'Иванова М.С. — абонемент', amount: 3500, ... },
        { id: 2, title: 'Петров В.А. — годовой', amount: 18000, ... },
      ]
    },
    // ... другие колонки
  ]
}

// Компонент карточки сделки
function DealCard({ deal }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-lg p-3
                    cursor-pointer hover:border-white/20 transition-all group">
      <p className="text-xs font-medium text-white">{deal.title}</p>
      <div className="flex items-center gap-3 text-[11px] text-white/40 mt-2">
        <span>₽ {deal.amount.toLocaleString()}</span>
        <span>{deal.daysAgo === 0 ? 'Сегодня' : `${deal.daysAgo}д назад`}</span>
      </div>
    </div>
  )
}

// Kanban
export default function CrmPage() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.stages.map(stage => (
        <div key={stage.id} className="flex-shrink-0 w-64">

          {/* Заголовок колонки */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span>{stage.name}</span>
            <span className="ml-auto">{stage.deals.length}</span>
          </div>

          {/* Карточки */}
          <div className="space-y-2 min-h-[120px] bg-white/3 rounded-xl p-2">
            {stage.deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Как добавить drag-and-drop с @dnd-kit

```typescript
// Установлено: @dnd-kit/core, @dnd-kit/sortable
// Вот как это будет работать:

import {
  DndContext,
  DragOverlay,
  useSensor,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'

function KanbanBoard({ pipeline }) {
  const queryClient = useQueryClient()

  const moveDealMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: number, stageId: number }) =>
      api.put(`/crm/deals/${dealId}/move`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-pipelines'] })
    }
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const dealId = Number(active.id)
    const newStageId = Number(over.id)  // ID этапа как drop-зона

    moveDealMutation.mutate({ dealId, stageId: newStageId })
  }

  return (
    <DndContext sensors={[...]} onDragEnd={handleDragEnd}>
      {pipeline.stages.map(stage => (
        <KanbanColumn key={stage.id} stage={stage} />
      ))}
    </DndContext>
  )
}
```

---

## DealActivity — история изменений

Каждое значимое действие записывается в `deal_activities`:

```typescript
// Типы активностей:
type ActivityType =
  | 'stage_change'  // переместили в другой этап
  | 'comment'       // добавили комментарий
  | 'task'          // создали задачу
  | 'call'          // был звонок
  | 'note'          // добавили заметку

// Пример записи в БД:
{
  dealId: 5,
  staffId: 1,
  type: 'stage_change',
  data: {
    from: 1,
    to: 3,
    fromName: 'Новый лид',
    toName: 'Пробное занятие'
  },
  createdAt: '2025-06-06T10:30:00Z'
}
```

---

## Задание

1. Откройте http://localhost:3000/crm — попробуйте понять структуру Kanban
2. В `apps/api/src/modules/crm/crm.service.ts` найдите метод `addComment` — разберите что он делает
3. **Подключите реальный API к CRM:**
```typescript
const { data: pipelines } = useQuery({
  queryKey: ['crm-pipelines'],
  queryFn: () => api.get('/crm/pipelines', token),
})
```
4. **Сложное задание:** реализуйте drag-and-drop используя `@dnd-kit/core`. При перетаскивании карточки вызывайте `PUT /crm/deals/:id/move`

---

**Предыдущий урок:** [11 — Клиенты](./11-module-clients.md)
**Следующий урок:** [13 — Ресепшен и RFID](./13-module-reception.md)
