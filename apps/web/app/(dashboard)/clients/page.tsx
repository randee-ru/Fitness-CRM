'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, UserCheck, UserX, Users } from 'lucide-react'
import { formatPhone, getInitials } from '@/lib/utils'

const mockClients = [
  { id: 1, firstName: 'Александр', lastName: 'Иванов', middleName: 'Петрович', phone: '79161234567', email: 'ivanov@mail.ru', isActive: true, membership: 'Месяц безлимит', balance: 0 },
  { id: 2, firstName: 'Екатерина', lastName: 'Петрова', middleName: 'Сергеевна', phone: '79251112233', email: 'petrova@mail.ru', isActive: true, membership: '10 посещений', balance: 500 },
  { id: 3, firstName: 'Михаил', lastName: 'Сидоров', middleName: null, phone: '79037778899', email: null, isActive: false, membership: null, balance: 0 },
  { id: 4, firstName: 'Ольга', lastName: 'Козлова', middleName: 'Николаевна', phone: '79884445566', email: 'kozlova@gmail.com', isActive: true, membership: '3 месяца безлимит', balance: 1200 },
  { id: 5, firstName: 'Дмитрий', lastName: 'Новиков', middleName: 'Андреевич', phone: '79510009988', email: null, isActive: true, membership: 'Месяц безлимит', balance: 300 },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockClients.filter(c =>
    [c.firstName, c.lastName, c.phone, c.email ?? ''].some(f => f.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону..."
            className="input pl-9"
          />
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Новый клиент
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всего', value: mockClients.length, icon: Users, color: 'text-white' },
          { label: 'Активных', value: mockClients.filter(c => c.isActive).length, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Неактивных', value: mockClients.filter(c => !c.isActive).length, icon: UserX, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass px-4 py-3 flex items-center gap-3">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-white/50 text-sm">{s.label}</span>
            <span className={`text-lg font-bold ml-auto ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_180px_120px_100px] px-4 py-2.5 border-b border-white/8">
          {['Клиент', 'Телефон', 'Email', 'Абонемент', 'Статус'].map(h => (
            <span key={h} className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="grid grid-cols-[1fr_140px_180px_120px_100px] items-center px-4 py-3 hover:bg-white/4 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                  {getInitials(c)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{c.lastName} {c.firstName}</div>
                  {c.middleName && <div className="text-xs text-white/30 truncate">{c.middleName}</div>}
                </div>
              </div>
              <span className="text-sm text-white/60">{formatPhone(c.phone)}</span>
              <span className="text-sm text-white/40 truncate">{c.email ?? '—'}</span>
              <span className="text-xs text-white/50 truncate">{c.membership ?? '—'}</span>
              <span className={`badge text-xs ${c.isActive ? 'badge-success' : 'badge-warning'}`}>
                {c.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
