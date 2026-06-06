import { CreditCard, TrendingUp, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react'

const payments = [
  { id: 1, client: 'Иванов А.П.', amount: 3500, method: 'Карта', description: 'Месяц безлимит', date: '06.06.2025, 10:32' },
  { id: 2, client: 'Петрова Е.С.', amount: 2500, method: 'Наличные', description: '10 посещений', date: '06.06.2025, 09:15' },
  { id: 3, client: 'Козлова Н.П.', amount: 9000, method: 'Карта', description: '3 месяца безлимит', date: '05.06.2025, 18:40' },
  { id: 4, client: 'Новиков Д.А.', amount: 3500, method: 'Online', description: 'Месяц безлимит', date: '05.06.2025, 14:22' },
  { id: 5, client: 'Морозова А.В.', amount: 18000, method: 'Карта', description: 'Год безлимит', date: '04.06.2025, 12:00' },
]

const methodColor: Record<string, string> = {
  'Карта': 'badge-info',
  'Наличные': 'badge-success',
  'Online': 'badge-purple',
}

export default function FinancePage() {
  const todayTotal = payments.slice(0, 2).reduce((s, p) => s + p.amount, 0)
  const monthTotal = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Выручка сегодня', value: `₽ ${todayTotal.toLocaleString()}`, icon: CreditCard, color: 'text-indigo-400', delta: '+12% к вчера' },
          { label: 'Выручка за месяц', value: `₽ ${monthTotal.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', delta: '+8% к прошлому' },
          { label: 'Приход по кассе', value: '₽ 48 200', icon: ArrowUpCircle, color: 'text-emerald-400', delta: 'этот месяц' },
          { label: 'Расход по кассе', value: '₽ 12 500', icon: ArrowDownCircle, color: 'text-red-400', delta: 'этот месяц' },
        ].map(s => (
          <div key={s.label} className="glass p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-white/40">{s.label}</span>
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Payments table */}
      <div className="glass overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="font-semibold text-white">Последние платежи</h2>
          <button className="btn-primary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" />
            Новый платёж
          </button>
        </div>
        <div className="grid grid-cols-[1fr_120px_100px_180px_160px] px-5 py-2.5 border-b border-white/8">
          {['Клиент', 'Сумма', 'Метод', 'Описание', 'Дата'].map(h => (
            <span key={h} className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-white/5">
          {payments.map(p => (
            <div key={p.id} className="grid grid-cols-[1fr_120px_100px_180px_160px] items-center px-5 py-3 hover:bg-white/4 transition-colors">
              <span className="text-sm text-white">{p.client}</span>
              <span className="text-sm font-semibold text-emerald-400">₽ {p.amount.toLocaleString()}</span>
              <span className={`badge text-xs ${methodColor[p.method] || 'badge-default'}`}>{p.method}</span>
              <span className="text-xs text-white/40 truncate">{p.description}</span>
              <span className="text-xs text-white/30">{p.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
