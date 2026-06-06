import { Users, DoorOpen, CreditCard, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'

const stats = [
  { label: 'Всего клиентов', value: '1 248', delta: '+12 за месяц', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { label: 'Сейчас в клубе', value: '34', delta: 'онлайн', icon: DoorOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Выручка за месяц', value: '₽ 284 500', delta: '+8% к прошлому', icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Новых сделок', value: '47', delta: 'в этом месяце', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
]

const recentActivity = [
  { text: 'Иванов А.П. прошёл через турникет', time: '2 мин назад', type: 'entry' },
  { text: 'Новый клиент: Петрова Е.С.', time: '15 мин назад', type: 'client' },
  { text: 'Оплата абонемента ₽ 3 500', time: '22 мин назад', type: 'payment' },
  { text: 'Звонок: Сидоров В.М. — 4:32', time: '35 мин назад', type: 'call' },
  { text: 'Запись на йогу: 8 человек', time: '1 час назад', type: 'schedule' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5 group hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-xs text-white/40">{s.label}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Chart placeholder */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Посещения за неделю</h2>
            <span className="badge badge-success">+12% к прошлой</span>
          </div>
          <div className="h-48 flex items-end gap-2">
            {[42, 68, 55, 80, 75, 90, 65].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-indigo-500/30 hover:bg-indigo-500/50 transition-colors"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-white/30">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/40" />
            <h2 className="font-semibold text-white text-sm">Последние события</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentActivity.map((item, i) => (
              <div key={i} className="px-5 py-3 hover:bg-white/3 transition-colors">
                <p className="text-xs text-white/70">{item.text}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
