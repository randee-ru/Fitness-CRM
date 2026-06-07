# Урок 10 — Tailwind CSS и наша дизайн-система

## Что такое Tailwind CSS

Tailwind — утилитарный CSS-фреймворк. Вместо того чтобы писать классы в CSS-файле, вы пишете стили прямо в HTML/JSX через готовые классы.

```css
/* Обычный CSS */
.card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
```

```tsx
{/* Tailwind — всё в className */}
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
  ...
</div>
```

---

## Базовые классы

### Размеры и отступы

```
p-4       = padding: 1rem (16px)
px-4      = padding-left + padding-right: 1rem
py-2      = padding-top + padding-bottom: 0.5rem
pt-2      = padding-top: 0.5rem

m-4       = margin: 1rem
mx-auto   = margin-left: auto; margin-right: auto (центрирование)
mt-4      = margin-top: 1rem

w-full    = width: 100%
w-64      = width: 16rem (256px)
h-screen  = height: 100vh
h-8       = height: 2rem (32px)
min-w-0   = min-width: 0 (важно для truncate!)
```

### Flex и Grid

```
flex              = display: flex
flex-col          = flex-direction: column
items-center      = align-items: center
justify-between   = justify-content: space-between
gap-4             = gap: 1rem
flex-1            = flex: 1 (занять оставшееся место)
flex-shrink-0     = flex-shrink: 0 (не сжиматься)

grid              = display: grid
grid-cols-2       = grid-template-columns: repeat(2, 1fr)
grid-cols-[240px_1fr]  = grid-template-columns: 240px 1fr (произвольный)
```

### Текст

```
text-sm           = font-size: 0.875rem
text-xs           = font-size: 0.75rem
text-2xl          = font-size: 1.5rem
font-bold         = font-weight: 700
font-medium       = font-weight: 500
text-white        = color: white
text-white/60     = color: rgba(255,255,255,0.6)
truncate          = overflow: hidden; text-overflow: ellipsis; white-space: nowrap
uppercase         = text-transform: uppercase
tracking-wider    = letter-spacing: 0.05em
```

### Фон и граница

```
bg-white/5        = background: rgba(255,255,255,0.05)
bg-indigo-600     = background: #4f46e5
border            = border-width: 1px
border-white/10   = border-color: rgba(255,255,255,0.1)
rounded-xl        = border-radius: 0.75rem
rounded-full      = border-radius: 9999px (кружок)
```

### Состояния (hover, focus)

```
hover:bg-white/10        = при наведении: фон
hover:text-white         = при наведении: цвет
focus:outline-none       = при фокусе: убрать outline
focus:border-indigo-500  = при фокусе: цвет бордера
active:scale-95          = при нажатии: уменьшить
transition-all           = анимировать все свойства
duration-150             = длительность 150мс
```

---

## Наша тёмная тема

Вся тема задана через CSS-переменные в `globals.css`:

```css
:root {
  --background: 222 47% 8%;    /* очень тёмный синий */
  --foreground: 213 31% 91%;   /* почти белый */
  --card: 222 47% 11%;         /* чуть светлее фона */
  --primary: 239 84% 67%;      /* индиго */
  --border: 222 47% 18%;       /* тёмный бордер */
}
```

Используются через Tailwind:
```
bg-background  → hsl(var(--background))
text-foreground → hsl(var(--foreground))
border-border  → hsl(var(--border))
```

---

## Наши кастомные компоненты

В `globals.css` определены классы для часто используемых элементов:

### .glass — "стеклянная" карточка

```css
.glass {
  background-color: rgba(255,255,255,0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
}
```

Использование:
```tsx
<div className="glass p-5">
  <h2>Заголовок</h2>
  <p>Содержимое</p>
</div>
```

### .badge — бейджи статуса

```css
/* Определены в globals.css: */
.badge-success { background: rgb(16 185 129 / 0.15); color: #34d399; }
.badge-warning { background: rgb(245 158 11 / 0.15);  color: #fbbf24; }
.badge-danger  { background: rgb(239 68 68 / 0.15);   color: #f87171; }
```

```tsx
<span className="badge badge-success">Активен</span>
<span className="badge badge-warning">Заморожен</span>
<span className="badge badge-danger">Истёк</span>
```

### .btn-primary и .btn-ghost

```tsx
<button className="btn-primary">
  <Plus className="w-4 h-4" />
  Новый клиент
</button>

<button className="btn-ghost">
  <ArrowLeft className="w-4 h-4" />
  Назад
</button>
```

### .input — поле ввода

```tsx
<input
  placeholder="Поиск..."
  className="input"
/>
```

---

## cn() — умное объединение классов

```typescript
// apps/web/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Зачем? Tailwind классы могут конфликтовать:

```tsx
// Проблема: оба класса добавлены, но p-4 перезаписывает p-2
<div className="p-4 p-2">  // итог: p-2 (который правее в CSS)

// Решение — twMerge умно мержит:
<div className={cn("p-4", "p-2")}>  // итог: p-2 (правильно!)
```

Использование с условиями:

```tsx
<Link
  className={cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
    active
      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
      : "text-white/50 hover:text-white",
    disabled && "opacity-50 cursor-not-allowed"  // добавить если disabled
  )}
>
```

---

## Адаптивный дизайн (responsive)

Tailwind использует префиксы для разных размеров экрана:

```
sm:   = min-width: 640px
md:   = min-width: 768px
lg:   = min-width: 1024px
xl:   = min-width: 1280px
2xl:  = min-width: 1536px
```

```tsx
<div className="
  grid
  grid-cols-1       /* мобильный: 1 колонка */
  sm:grid-cols-2    /* планшет: 2 колонки */
  lg:grid-cols-4    /* десктоп: 4 колонки */
  gap-4
">
```

---

## Lucide React — иконки

Мы используем Lucide React для иконок:

```tsx
import { Users, Plus, Search, Settings, ChevronRight } from 'lucide-react'

<Users className="w-5 h-5 text-indigo-400" />
<Plus className="w-4 h-4" />
```

Все доступные иконки: https://lucide.dev/icons/

---

## Задание

1. Найдите в `apps/web/app/globals.css` определение `.glass` и `.badge-success`
2. Откройте `apps/web/app/(dashboard)/page.tsx` — разберите каждый Tailwind-класс в карточках статистики
3. Откройте `tailwind.config.ts` — найдите добавленные анимации (`fade-in`, `slide-up`)
4. **Попробуйте:** измените цвет активного пункта меню в Sidebar с `indigo` на `violet`
5. **Создайте компонент:** сделайте `components/ui/StatusBadge.tsx` который принимает `status: 'active' | 'frozen' | 'expired'` и возвращает красивый бейдж

---

**Предыдущий урок:** [09 — TanStack Query](./09-nextjs-client.md)
**Следующий урок:** [11 — Разбор модуля Клиенты](./11-module-clients.md)
