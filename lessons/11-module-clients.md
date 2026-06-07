# Урок 11 — Полный разбор модуля «Клиенты»

В этом уроке мы проследим полный путь — от базы данных до UI — на примере самого важного модуля системы.

---

## 1. База данных — таблица `clients`

```prisma
// apps/api/prisma/schema.prisma
model Client {
  id               Int       @id @default(autoincrement())
  firstName        String    // имя
  lastName         String    // фамилия
  middleName       String?   // отчество (необязательно)
  email            String?   // email
  phone            String    // телефон (основной)
  photoUrl         String?   // ссылка на фото
  balance          Decimal   @default(0) // денежный баланс
  isActive         Boolean   @default(true)
  registrationDate DateTime  @default(now())

  // Связи — у клиента может быть много:
  memberships        ClientMembership[]   // абонементы
  visits             ClientVisit[]        // посещения
  rfidKeys           RfidKey[]            // RFID-карты
  loyaltyAccount     ClientLoyalty?       // аккаунт лояльности (один)
  deals              Deal[]               // сделки в CRM

  @@index([phone])   // индекс для быстрого поиска по телефону
  @@map("clients")   // имя таблицы в БД
}
```

---

## 2. DTO — схемы данных

```typescript
// apps/api/src/modules/clients/dto/create-client.dto.ts

export class CreateClientDto {
  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsString()
  phone: string

  @IsOptional() @IsEmail()
  email?: string

  @IsOptional() @IsDateString()
  birthDate?: string

  @IsOptional() @IsString()
  salesChannel?: string  // откуда пришёл клиент: Instagram, реклама, сарафан
}

export class ClientQueryDto {
  @IsOptional() @IsString()
  search?: string          // поиск по имени, телефону

  @IsOptional()
  page?: number            // номер страницы

  @IsOptional()
  limit?: number           // элементов на странице
}
```

---

## 3. Сервис — бизнес-логика

```typescript
// apps/api/src/modules/clients/clients.service.ts
@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Список клиентов с поиском и пагинацией
  async findAll(query: ClientQueryDto) {
    const { search, page = 1, limit = 20, isActive } = query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (isActive !== undefined) where.isActive = isActive

    // Поиск по нескольким полям
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Параллельный запрос: данные + подсчёт
    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {  // выбираем только нужные поля (экономия трафика)
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          photoUrl: true,
          isActive: true,
          balance: true,
          memberships: {
            where: { status: 'ACTIVE' },  // только активные абонементы
            take: 1,
            select: {
              membership: { select: { name: true } },
              expirationDate: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ])

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    }
  }

  // Полная карточка клиента
  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { membership: true },
          orderBy: { createdAt: 'desc' },
        },
        visits: {
          orderBy: { checkInTime: 'desc' },
          take: 20,        // последние 20 посещений
        },
        rfidKeys: { where: { isActive: true } },
        loyaltyAccount: true,
        clientNotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        phoneCalls: { orderBy: { startedAt: 'desc' }, take: 10 },
        deals: {
          include: { stage: true, pipeline: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!client) {
      throw new NotFoundException(`Клиент #${id} не найден`)
    }
    return client
  }

  // Создание клиента
  async create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      }
    })
  }

  // Обновление клиента
  async update(id: number, dto: UpdateClientDto) {
    await this.findOne(id)  // убедиться что существует
    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    })
  }

  // Деактивация (мягкое удаление)
  async remove(id: number) {
    await this.findOne(id)
    // Мы не удаляем данные — только ставим флаг isActive = false
    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // Статистика для дашборда
  async getStats() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, active, newThisMonth, inClubNow] = await this.prisma.$transaction([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.client.count({ where: { registrationDate: { gte: startOfMonth } } }),
      this.prisma.clientVisit.count({ where: { status: 'ACTIVE' } }),
    ])

    return { total, active, newThisMonth, inClubNow }
  }
}
```

---

## 4. Контроллер — HTTP маршруты

```typescript
// apps/api/src/modules/clients/clients.controller.ts

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query)
  }

  @Get('stats')
  getStats() {
    return this.clientsService.getStats()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto)
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id)
  }
}
```

---

## 5. Фронтенд — страница списка клиентов

```typescript
// apps/web/app/(dashboard)/clients/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

// Сейчас используем mock-данные.
// После подключения API заменим на useQuery:
// const { data } = useQuery({ queryKey: ['clients'], queryFn: () => api.get('/clients') })

const mockClients = [
  { id: 1, firstName: 'Александр', lastName: 'Иванов', phone: '79161234567', ... },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockClients.filter(c =>
    [c.firstName, c.lastName, c.phone].some(
      f => f.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Панель инструментов */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="input pl-9"  // наш кастомный класс из globals.css
          />
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Новый клиент
        </Link>
      </div>

      {/* Таблица */}
      <div className="glass overflow-hidden">
        {filtered.map(client => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="grid grid-cols-[1fr_140px_120px_100px] items-center px-4 py-3
                       hover:bg-white/4 transition-colors"
          >
            {/* Аватар + имя */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center
                              justify-center text-xs font-bold text-indigo-300">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <span className="text-sm font-medium text-white">
                {client.lastName} {client.firstName}
              </span>
            </div>

            <span className="text-sm text-white/60">{client.phone}</span>

            <span className={`badge text-xs ${
              client.isActive ? 'badge-success' : 'badge-warning'
            }`}>
              {client.isActive ? 'Активен' : 'Неактивен'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Карточка клиента `/clients/[id]`

```typescript
// apps/web/app/(dashboard)/clients/[id]/page.tsx

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  // В реальности здесь будет useQuery:
  // const { data: client } = useQuery({
  //   queryKey: ['clients', params.id],
  //   queryFn: () => api.get(`/clients/${params.id}`)
  // })

  return (
    <div>
      {/* Профиль */}
      <div className="glass p-6">
        <div className="flex items-start gap-5">
          {/* Аватар */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30">ИА</div>

          {/* Информация */}
          <div>
            <h2>Иванов Александр Петрович</h2>
            <div>📞 +7 (916) 123-45-67</div>
          </div>

          {/* Быстрая статистика */}
          <div>84 посещения | 1240 баллов | ₽ 500</div>
        </div>
      </div>

      {/* Вкладки: Абонементы, Посещения, Сделки... */}
    </div>
  )
}
```

---

## Полная цепочка: добавление нового клиента

```
Пользователь заполняет форму → нажимает "Создать"
        │
        ▼
useMutation: POST /api/clients
{ firstName: "Иван", lastName: "Смирнов", phone: "79100001122" }
        │
        ▼
NestJS ValidationPipe: проверяет поля → OK
        │
        ▼
ClientsController.create() → ClientsService.create()
        │
        ▼
Prisma: INSERT INTO clients (first_name, last_name, phone) VALUES (...)
        │
        ▼
PostgreSQL возвращает: { id: 100, firstName: "Иван", ... }
        │
        ▼
NestJS: HTTP 201 + JSON
        │
        ▼
useMutation.onSuccess:
- toast.success("Клиент создан!")
- queryClient.invalidateQueries(['clients'])  ← список обновится
- router.push(`/clients/100`)                 ← переход на карточку
```

---

## Задание

1. Найдите в `clients.service.ts` место где формируется `where.OR` для поиска — добавьте поиск по `middleName`
2. Откройте `apps/web/app/(dashboard)/clients/[id]/page.tsx` — найдите вкладки и добавьте новую вкладку "Документы"
3. **Главное задание:** подключите реальный API к странице клиентов. Замените mock-данные на:
```typescript
const token = localStorage.getItem('token')
const { data, isLoading } = useQuery({
  queryKey: ['clients', { search }],
  queryFn: () => api.get(`/clients?search=${search}`, token!),
})
```

---

**Предыдущий урок:** [10 — Tailwind CSS](./10-tailwind.md)
**Следующий урок:** [12 — CRM и Kanban](./12-module-crm.md)
