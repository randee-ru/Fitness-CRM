# Урок 08 — Next.js 15: App Router и компоненты

## Что такое Next.js

Next.js — фреймворк поверх React. Добавляет:
- **Роутинг** — каждый файл `page.tsx` = отдельная страница
- **Серверный рендеринг** — страницы рендерятся на сервере (быстрее загружаются)
- **Оптимизацию** — автоматическое разделение кода, оптимизация изображений

---

## App Router — файловая система = маршруты

В Next.js 15 используется **App Router** (папка `app/`). Структура файлов определяет URL.

```
apps/web/app/
├── layout.tsx                    → корневой layout (для всех страниц)
├── (auth)/
│   └── login/
│       └── page.tsx              → /login
└── (dashboard)/
    ├── layout.tsx                → layout для дашборда (Sidebar + Header)
    ├── page.tsx                  → / (главная)
    ├── clients/
    │   ├── page.tsx              → /clients
    │   └── [id]/
    │       └── page.tsx          → /clients/42 (динамический маршрут)
    ├── crm/
    │   └── page.tsx              → /crm
    └── schedule/
        └── page.tsx              → /schedule
```

**Скобки `(auth)` и `(dashboard)` — группы маршрутов.** Они не влияют на URL, но позволяют применять разные layouts.

---

## Серверные и клиентские компоненты

Это главное нововведение App Router. По умолчанию все компоненты — **серверные**.

### Серверный компонент (по умолчанию)

```typescript
// apps/web/app/(dashboard)/page.tsx
// НЕТ 'use client' — это серверный компонент

// Можно делать async функции — данные загружаются на сервере
export default async function DashboardPage() {
  // Этот код выполняется на сервере, не в браузере
  // Можно было бы читать из БД напрямую, но мы используем API
  
  return (
    <div>
      <h1>Дашборд</h1>
    </div>
  )
}
```

**Плюсы серверных компонентов:**
- Данные загружаются на сервере → быстрее первая загрузка
- Не попадают в JavaScript-бандл → меньше JS в браузере
- Лучше для SEO

### Клиентский компонент

```typescript
// apps/web/app/(dashboard)/clients/page.tsx
'use client'   // ← эта директива делает компонент клиентским
// Нужна если используем: useState, useEffect, обработчики событий, браузерные API

import { useState } from 'react'

export default function ClientsPage() {
  const [search, setSearch] = useState('')  // useState — только в клиентских!

  return (
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}  // обработчик — клиентский
    />
  )
}
```

**Плюсы клиентских компонентов:**
- Интерактивность (state, события)
- Доступ к браузерным API (localStorage, window)

---

## layout.tsx — шаблоны

Layout — компонент который оборачивает группу страниц.

```typescript
// apps/web/app/layout.tsx — корневой layout (для ВСЕХ страниц)
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className={geistSans.className}>
        {children}   {/* здесь рендерятся дочерние страницы */}
      </body>
    </html>
  )
}
```

```typescript
// apps/web/app/(dashboard)/layout.tsx — layout для дашборда
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Providers from '@/components/layout/Providers'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>                          {/* TanStack Query Provider */}
      <div className="grid grid-cols-[240px_1fr] h-screen">
        <Sidebar />                      {/* левое меню */}
        <div className="flex flex-col">
          <Header />                     {/* шапка */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}                   {/* страница */}
          </main>
        </div>
      </div>
    </Providers>
  )
}
```

**Вложенность layouts:**
```
RootLayout (HTML, body)
  └── DashboardLayout (Sidebar, Header)
        └── ClientsPage (таблица клиентов)
```

---

## Динамические маршруты `[id]`

```typescript
// apps/web/app/(dashboard)/clients/[id]/page.tsx

// Параметры URL доступны через props
export default function ClientDetailPage({
  params
}: {
  params: { id: string }  // id всегда строка, даже если в URL число
}) {
  const clientId = parseInt(params.id)  // конвертируем в число

  return <div>Клиент #{clientId}</div>
}
```

---

## Навигация

```typescript
// Ссылки — Next.js Link (быстрее обычного <a>)
import Link from 'next/link'

<Link href="/clients">Клиенты</Link>
<Link href={`/clients/${client.id}`}>Открыть</Link>

// Программная навигация
import { useRouter } from 'next/navigation'

export default function SomePage() {
  const router = useRouter()

  function handleLogin() {
    // после входа перенаправить
    router.push('/')
    // или назад:
    router.back()
  }
}

// Текущий URL
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  // pathname = '/clients' или '/crm' и т.д.

  return (
    <nav>
      <Link
        href="/clients"
        className={pathname === '/clients' ? 'active' : ''}
      >
        Клиенты
      </Link>
    </nav>
  )
}
```

---

## Sidebar.tsx — разбор нашего кода

```typescript
// apps/web/components/layout/Sidebar.tsx
'use client'   // нужен usePathname — это браузерный хук

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Kanban } from 'lucide-react'  // иконки
import { cn } from '@/lib/utils'   // утилита для классов (clsx + tailwind-merge)

const nav = [
  { label: 'Клиенты', href: '/clients', icon: Users },
  { label: 'CRM', href: '/crm', icon: Kanban },
  // ...
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside>
      {nav.map(({ label, href, icon: Icon }) => {
        // Определяем активность ссылки
        const active = href === '/' ? pathname === href : pathname.startsWith(href)
        
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              active
                ? 'bg-indigo-600/20 text-indigo-400'   // активная ссылка
                : 'text-white/50 hover:text-white',     // неактивная
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
```

---

## Providers.tsx — обёртка для провайдеров

```typescript
// apps/web/components/layout/Providers.tsx
'use client'   // useState — клиентский

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState здесь гарантирует что QueryClient создаётся ОДИН РАЗ
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,  // данные "свежие" 30 секунд
        retry: 1,           // повторить запрос 1 раз при ошибке
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

Почему `Providers` отдельный компонент? Потому что `DashboardLayout` — серверный (нет 'use client'), а `QueryClientProvider` требует клиентского контекста. Выносим провайдеры в отдельный клиентский компонент.

---

## Задание

1. Откройте `apps/web/app/(dashboard)/layout.tsx` — найдите как вложены Sidebar, Header и children
2. Откройте `apps/web/components/layout/Sidebar.tsx` — разберите как определяется `active`
3. Добавьте новый пункт в меню Sidebar: "Персонал" с иконкой `UserCog` и href `/staff`
4. Создайте файл `apps/web/app/(dashboard)/staff/page.tsx` с простым заголовком "Персонал"
5. Проверьте в браузере — должен появиться новый пункт меню и страница

---

**Предыдущий урок:** [07 — Авторизация](./07-nestjs-auth.md)
**Следующий урок:** [09 — TanStack Query](./09-nextjs-client.md)
