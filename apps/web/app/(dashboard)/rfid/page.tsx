import { Wifi, CreditCard, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'

const events = [
  { id: 1, type: 'ENTRY', client: 'Иванов А.П.', code: 'A1B2C3D4', zone: 'Главный вход', granted: true, time: '11:47:32' },
  { id: 2, type: 'ENTRY', client: 'Петрова Е.С.', code: 'E5F6G7H8', zone: 'Главный вход', granted: true, time: '11:43:10' },
  { id: 3, type: 'DENIED', client: null, code: 'UNKNOWN', zone: 'Бассейн', granted: false, time: '11:40:55', reason: 'Ключ не найден' },
  { id: 4, type: 'EXIT', client: 'Козлова Н.П.', code: 'I9J0K1L2', zone: 'Главный вход', granted: true, time: '11:35:22' },
  { id: 5, type: 'DENIED', client: 'Сидоров М.В.', code: 'M3N4O5P6', zone: 'Главный вход', granted: false, time: '11:28:14', reason: 'Абонемент истёк' },
]

const rfidKeys = [
  { id: 1, client: 'Иванов А.П.', code: 'A1B2C3D4', type: 'Карта', isActive: true, issued: '01.01.2025' },
  { id: 2, client: 'Петрова Е.С.', code: 'E5F6G7H8', type: 'Браслет', isActive: true, issued: '15.02.2025' },
  { id: 3, client: 'Козлова Н.П.', code: 'I9J0K1L2', type: 'Карта', isActive: true, issued: '10.03.2025' },
  { id: 4, client: 'Новиков Д.А.', code: 'Q7R8S9T0', type: 'Браслет', isActive: false, issued: '05.01.2025' },
]

export default function RfidPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Активных ключей', value: rfidKeys.filter(k => k.isActive).length, color: 'text-indigo-400' },
          { label: 'Проходов сегодня', value: events.filter(e => e.granted).length, color: 'text-emerald-400' },
          { label: 'Отказов', value: events.filter(e => !e.granted).length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass p-4 flex items-center gap-3">
            <Wifi className={`w-5 h-5 ${s.color}`} />
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Access log */}
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm">Лог доступа</h2>
            <span className="badge badge-info text-xs">Live</span>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition-colors">
                {e.granted
                  ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{e.client ?? 'Неизвестный'} — {e.zone}</div>
                  {e.reason && <div className="text-[10px] text-red-400/70">{e.reason}</div>}
                </div>
                <span className="text-[10px] text-white/30 flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{e.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keys list */}
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm">RFID ключи</h2>
            <button className="btn-primary py-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Выдать
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {rfidKeys.map(k => (
              <div key={k.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{k.client}</div>
                  <div className="text-[10px] text-white/30 font-mono">{k.code} · {k.type}</div>
                </div>
                <span className={`badge text-xs ${k.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {k.isActive ? 'Активен' : 'Заблокирован'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
