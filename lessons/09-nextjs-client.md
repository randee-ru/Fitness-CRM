# Урок 09 — TanStack Query и работа с API

## Проблема: как загружать данные из API

Простой способ — `useEffect`:

```typescript
// ❌ Плохо — много проблем
export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        setClients(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка</div>
  return <div>{clients.map(...)}</div>
}
```

**Проблемы этого подхода:**
- Нет кэширования — каждый раз запрос при переходе на страницу
- Нет дедупликации — несколько компонентов делают один запрос дважды
- Нет автообновления
- Много бойлерплейта

---

## TanStack Query — правильный подход

TanStack Query управляет серверными данными: кэш, загрузка, ошибки, обновление.

```typescript
// ✅ Хорошо — чисто и функционально
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function ClientsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients'],        // ключ для кэша
    queryFn: () => api.get('/clients'),  // функция запроса
  })

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка</div>
  return <div>{data?.data.map(...)}</div>
}
```

**Что QueryClient делает автоматически:**
- Кэширует данные на 30 секунд
- Если два компонента запрашивают `['clients']` — делает ОДИН запрос
- При возврате на страницу — показывает кэш, потом обновляет в фоне
- При ошибке — повторяет запрос

---

## useQuery — детально

```typescript
const {
  data,          // результат queryFn
  isLoading,     // первая загрузка (нет кэша)
  isFetching,    // любая загрузка (включая фоновое обновление)
  isError,       // произошла ошибка
  error,         // объект ошибки
  refetch,       // принудительно обновить
} = useQuery({
  queryKey: ['clients', { search, page }],  // ключ — массив, включает параметры
  queryFn: () => api.get(`/clients?search=${search}&page=${page}`),
  staleTime: 60_000,  // данные "свежие" 60 секунд (переопределяет глобальный)
  enabled: !!search,   // запрос только если search не пустой
})
```

### queryKey — ключ кэша

```typescript
// Разные ключи = разные кэши
useQuery({ queryKey: ['clients'] })           // список клиентов
useQuery({ queryKey: ['clients', 42] })       // клиент #42
useQuery({ queryKey: ['clients', { page: 2, search: 'иван' }] })  // с фильтром

// При изменении параметра — автоматически новый запрос:
useQuery({
  queryKey: ['clients', { page, search }],    // ← меняется при изменении state
  queryFn: () => api.get(`/clients?page=${page}&search=${search}`),
})
```

---

## useMutation — создание/обновление/удаление

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function CreateClientForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateClientDto) => api.post('/clients', data),

    onSuccess: (newClient) => {
      // После успешного создания:
      toast.success('Клиент создан!')

      // Инвалидировать кэш — список обновится
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },

    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      firstName: 'Александр',
      phone: '79161234567',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Сохранение...' : 'Создать'}
      </button>
    </form>
  )
}
```

---

## lib/api.ts — наш API клиент

```typescript
// apps/web/lib/api.ts
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Если передан токен — добавляем заголовок авторизации
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${this.baseUrl}/api${path}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `HTTP ${res.status}`)
    }

    return res.json()
  }

  // Удобные методы
  get<T>(path: string, token?: string) {
    return this.request<T>(path, { method: 'GET' }, token)
  }

  post<T>(path: string, body: unknown, token?: string) {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }, token)
  }

  put<T>(path: string, body: unknown, token?: string) {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, token)
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
```

Использование:
```typescript
// Простой запрос
const clients = await api.get('/clients')

// С параметрами
const client = await api.get(`/clients/${id}`)

// POST с данными
const newClient = await api.post('/clients', { firstName: 'Иван', phone: '...' })
```

---

## Пример: страница клиентов с реальным API

```typescript
// apps/web/app/(dashboard)/clients/page.tsx
'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, page }],
    queryFn: () => api.get(`/clients?search=${search}&page=${page}`, token ?? undefined),
    placeholderData: (prev) => prev,  // показывать старые данные при загрузке
  })

  return (
    <div>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Поиск..."
      />

      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <div>
          {data?.data.map(client => (
            <div key={client.id}>{client.firstName} {client.lastName}</div>
          ))}

          {/* Пагинация */}
          <div>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              ← Назад
            </button>
            <span>Страница {page} из {data?.pagination.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === data?.pagination.totalPages}>
              Вперёд →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Задание

1. Посмотрите `apps/web/lib/api.ts` — как устроен `ApiClient`
2. Добавьте хук `useClients`:
```typescript
// apps/web/hooks/useClients.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', { search }],
    queryFn: () => api.get(`/clients?search=${search ?? ''}`),
  })
}
```
3. Используйте его в `clients/page.tsx`
4. **Задание со звёздочкой:** добавьте `useMutation` для создания клиента и форму с полями firstName, lastName, phone

---

**Предыдущий урок:** [08 — Next.js основы](./08-nextjs-basics.md)
**Следующий урок:** [10 — Tailwind CSS](./10-tailwind.md)
