import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Mic } from 'lucide-react'

const calls = [
  { id: 1, direction: 'IN', client: 'Иванов А.П.', phone: '+7 (916) 123-45-67', duration: '4:32', date: '06.06.2025, 11:30', hasRecording: true, summary: 'Уточнял условия абонемента' },
  { id: 2, direction: 'OUT', client: 'Петрова Е.С.', phone: '+7 (925) 111-22-33', duration: '2:15', date: '06.06.2025, 10:45', hasRecording: true, summary: 'Напомнили о продлении' },
  { id: 3, direction: 'IN', client: null, phone: '+7 (903) 777-88-99', duration: '0:45', date: '06.06.2025, 09:12', hasRecording: false, summary: null },
  { id: 4, direction: 'OUT', client: 'Козлова Н.П.', phone: '+7 (988) 444-55-66', duration: '6:08', date: '05.06.2025, 17:30', hasRecording: true, summary: 'Продажа годового абонемента' },
  { id: 5, direction: 'MISSED', client: null, phone: '+7 (951) 000-99-88', duration: '—', date: '05.06.2025, 14:20', hasRecording: false, summary: null },
]

const dirIcon = { IN: PhoneIncoming, OUT: PhoneOutgoing, MISSED: PhoneMissed }
const dirColor = { IN: 'text-emerald-400', OUT: 'text-blue-400', MISSED: 'text-red-400' }
const dirLabel = { IN: 'Входящий', OUT: 'Исходящий', MISSED: 'Пропущенный' }

export default function CallsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего звонков', value: calls.length, color: 'text-white' },
          { label: 'Входящих', value: calls.filter(c => c.direction === 'IN').length, color: 'text-emerald-400' },
          { label: 'Пропущенных', value: calls.filter(c => c.direction === 'MISSED').length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass p-4 flex items-center gap-3">
            <Phone className={`w-4 h-4 ${s.color}`} />
            <span className="text-white/40 text-sm">{s.label}</span>
            <span className={`text-xl font-bold ml-auto ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_140px_100px_180px_1fr] px-5 py-2.5 border-b border-white/8">
          {['Тип', 'Клиент', 'Телефон', 'Длит.', 'Дата', 'Краткое'].map(h => (
            <span key={h} className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-white/5">
          {calls.map(c => {
            const DirIcon = dirIcon[c.direction as keyof typeof dirIcon]
            return (
              <div key={c.id} className="grid grid-cols-[120px_1fr_140px_100px_180px_1fr] items-center px-5 py-3 hover:bg-white/4 transition-colors">
                <div className="flex items-center gap-2">
                  <DirIcon className={`w-4 h-4 ${dirColor[c.direction as keyof typeof dirColor]}`} />
                  <span className={`text-xs ${dirColor[c.direction as keyof typeof dirColor]}`}>{dirLabel[c.direction as keyof typeof dirLabel]}</span>
                </div>
                <span className="text-sm text-white truncate">{c.client ?? <span className="text-white/30">Неизвестный</span>}</span>
                <span className="text-sm text-white/50">{c.phone}</span>
                <span className="text-sm text-white/60 flex items-center gap-1"><Clock className="w-3 h-3 text-white/20" />{c.duration}</span>
                <span className="text-xs text-white/30">{c.date}</span>
                <div className="flex items-center gap-2 min-w-0">
                  {c.hasRecording && (
                    <button className="btn-ghost py-0.5 px-2 text-xs">
                      <Mic className="w-3 h-3" />
                      Запись
                    </button>
                  )}
                  {c.summary && <span className="text-xs text-white/40 truncate">{c.summary}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
