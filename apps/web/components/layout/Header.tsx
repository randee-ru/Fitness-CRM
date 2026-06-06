'use client'
import { Bell, Search, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/': 'Дашборд',
  '/clients': 'Клиенты',
  '/crm': 'CRM',
  '/reception': 'Ресепшен',
  '/schedule': 'Расписание',
  '/finance': 'Финансы',
  '/loyalty': 'Лояльность',
  '/rfid': 'RFID / Доступ',
  '/calls': 'Звонки',
  '/settings': 'Настройки',
}

export default function Header() {
  const pathname = usePathname()
  const segment = '/' + pathname.split('/')[1]
  const title = titles[segment] ?? 'SportMax'

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/8 bg-[hsl(222,47%,7%)]">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-2">
        <button className="btn-ghost p-2">
          <Search className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>
        <button className="btn-ghost p-2">
          <Sun className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
