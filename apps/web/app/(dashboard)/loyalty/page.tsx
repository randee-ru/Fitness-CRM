import { Star, TrendingUp, Gift, Users } from 'lucide-react'

const levels = [
  { name: 'Бронза', minPoints: 0, discount: 0, color: '#cd7f32', count: 890 },
  { name: 'Серебро', minPoints: 500, discount: 5, color: '#c0c0c0', count: 248 },
  { name: 'Золото', minPoints: 2000, discount: 10, color: '#ffd700', count: 87 },
  { name: 'Платина', minPoints: 5000, discount: 15, color: '#e5e4e2', count: 23 },
]

const topClients = [
  { name: 'Иванов А.П.', points: 8240, level: 'Платина', levelColor: '#e5e4e2' },
  { name: 'Петрова Е.С.', points: 5890, level: 'Платина', levelColor: '#e5e4e2' },
  { name: 'Козлова Н.П.', points: 3200, level: 'Золото', levelColor: '#ffd700' },
  { name: 'Новиков Д.А.', points: 2750, level: 'Золото', levelColor: '#ffd700' },
  { name: 'Морозова А.В.', points: 1100, level: 'Серебро', levelColor: '#c0c0c0' },
]

export default function LoyaltyPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Участников программы', value: '1 248', icon: Users, color: 'text-indigo-400' },
          { label: 'Выдано баллов за месяц', value: '48 500', icon: Star, color: 'text-amber-400' },
          { label: 'Потрачено баллов', value: '12 300', icon: Gift, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Levels */}
        <div className="glass p-5">
          <h3 className="font-semibold text-white mb-4">Уровни лояльности</h3>
          <div className="space-y-3">
            {levels.map(l => (
              <div key={l.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: l.color + '25', border: `1px solid ${l.color}40` }}>
                  <Star className="w-3.5 h-3.5" style={{ color: l.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{l.name}</span>
                    <span className="text-xs text-white/40">{l.count} чел.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span>от {l.minPoints} баллов</span>
                    {l.discount > 0 && <span className="badge badge-success">скидка {l.discount}%</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top clients */}
        <div className="glass p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Топ клиентов
          </h3>
          <div className="space-y-2">
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/30 w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{c.name}</div>
                  <div className="text-[11px] font-bold text-amber-400">{c.points.toLocaleString()} баллов</div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: c.levelColor, backgroundColor: c.levelColor + '20', border: `1px solid ${c.levelColor}30` }}>
                  {c.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
