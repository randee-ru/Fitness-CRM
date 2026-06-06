import { ArrowLeft, Phone, Mail, Calendar, CreditCard, Star, MapPin, Edit } from 'lucide-react'
import Link from 'next/link'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const tabs = ['Обзор', 'Абонементы', 'Посещения', 'Сделки', 'Звонки', 'Лояльность', 'Документы']

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link href="/clients" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          Клиенты
        </Link>
        <button className="btn-primary">
          <Edit className="w-4 h-4" />
          Редактировать
        </button>
      </div>

      {/* Profile card */}
      <div className="glass p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-300 flex-shrink-0">
            ИА
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-white">Иванов Александр Петрович</h2>
              <span className="badge badge-success">Активен</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +7 (916) 123-45-67</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> ivanov@mail.ru</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> 15.03.1985</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Москва</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4">
            {[
              { label: 'Посещений', value: '84', icon: Calendar },
              { label: 'Баллы', value: '1 240', icon: Star },
              { label: 'Баланс', value: '₽ 500', icon: CreditCard },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white/5 rounded-lg p-1 w-fit border border-white/8">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              i === 0 ? 'bg-indigo-600 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-5">
        {/* Active membership */}
        <div className="glass p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Активный абонемент
          </h3>
          <div className="p-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20">
            <div className="text-sm font-semibold text-white">Месяц безлимит</div>
            <div className="text-xs text-white/40 mt-1">Действует до: 15.07.2025</div>
            <div className="flex gap-2 mt-3">
              <span className="badge badge-success">Активен</span>
              <span className="badge badge-default">Заморозок: 14 дней</span>
            </div>
          </div>
        </div>

        {/* Last visits */}
        <div className="glass p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Последние посещения
          </h3>
          <div className="space-y-2">
            {['Сегодня, 10:32 — 12:45', 'Вчера, 09:15 — 11:00', '3 дня назад, 18:30 — 20:00'].map((v, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white/60">{v}</span>
                <span className="badge badge-success text-xs">Завершён</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
