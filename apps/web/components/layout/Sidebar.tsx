'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, DoorOpen, CalendarDays,
  CreditCard, Star, Wifi, Phone, Settings, ChevronRight, Dumbbell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Дашборд', href: '/', icon: LayoutDashboard },
  { label: 'Клиенты', href: '/clients', icon: Users },
  { label: 'CRM', href: '/crm', icon: Kanban },
  { label: 'Ресепшен', href: '/reception', icon: DoorOpen },
  { label: 'Расписание', href: '/schedule', icon: CalendarDays },
  { label: 'Финансы', href: '/finance', icon: CreditCard },
  { label: 'Лояльность', href: '/loyalty', icon: Star },
  { label: 'RFID / Доступ', href: '/rfid', icon: Wifi },
  { label: 'Звонки', href: '/calls', icon: Phone },
  { label: 'Настройки', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-screen bg-[hsl(222,47%,6%)] border-r border-white/8">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white leading-none">SportMax</div>
          <div className="text-[10px] text-white/40 mt-0.5 tracking-widest uppercase">ERP System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/6',
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-indigo-400/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/6 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
            А
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">Администратор</div>
            <div className="text-[10px] text-white/40 truncate">admin@sportmax.ru</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
