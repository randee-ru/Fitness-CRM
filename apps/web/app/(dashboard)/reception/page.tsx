'use client'
import { useState } from 'react'
import { Search, DoorOpen, DoorClosed, Clock, Users, LogIn } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

const inClub = [
  { id: 1, firstName: 'Александр', lastName: 'Иванов', phone: '79161234567', checkIn: '09:32', membership: 'Месяц безлимит', duration: '2ч 15мин' },
  { id: 2, firstName: 'Екатерина', lastName: 'Петрова', phone: '79251112233', checkIn: '10:05', membership: '10 посещений', duration: '1ч 42мин' },
  { id: 3, firstName: 'Ольга', lastName: 'Козлова', phone: '79884445566', checkIn: '10:44', membership: '3 месяца', duration: '1ч 03мин' },
  { id: 4, firstName: 'Дмитрий', lastName: 'Новиков', phone: '79510009988', checkIn: '11:20', membership: 'Месяц безлимит', duration: '27мин' },
]

export default function ReceptionPage() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'in-club' | 'check-in'>('in-club')

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'В клубе сейчас', value: inClub.length, icon: Users, color: 'text-indigo-400' },
          { label: 'Входов сегодня', value: 84, icon: DoorOpen, color: 'text-emerald-400' },
          { label: 'Выходов сегодня', value: 80, icon: DoorClosed, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit border border-white/8">
        {[
          { key: 'in-club', label: 'В клубе' },
          { key: 'check-in', label: 'Отметить вход' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'in-club' && (
        <div className="glass overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_180px_100px_80px] px-4 py-2.5 border-b border-white/8">
            {['Клиент', 'Телефон', 'Абонемент', 'Вход', 'Время'].map(h => (
              <span key={h} className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {inClub.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_140px_180px_100px_80px] items-center px-4 py-3 hover:bg-white/4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <span className="text-sm text-white">{c.lastName} {c.firstName}</span>
                </div>
                <span className="text-sm text-white/50">{formatPhone(c.phone)}</span>
                <span className="text-xs text-white/40 truncate">{c.membership}</span>
                <span className="text-sm text-white/60 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-white/30" />{c.checkIn}
                </span>
                <span className="text-xs text-emerald-400">{c.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'check-in' && (
        <div className="glass p-6 max-w-lg">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-indigo-400" />
            Отметить вход
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Введите имя или номер телефона..."
              className="input pl-9"
              autoFocus
            />
          </div>
          {search && (
            <div className="mt-2 space-y-1">
              {inClub.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())).map(c => (
                <button key={c.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{c.lastName} {c.firstName}</div>
                    <div className="text-xs text-white/40">{formatPhone(c.phone)} · {c.membership}</div>
                  </div>
                  <span className="ml-auto btn-primary py-1 px-3 text-xs">Войти</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
