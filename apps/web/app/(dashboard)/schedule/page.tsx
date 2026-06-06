import { Plus, ChevronLeft, ChevronRight, Users } from 'lucide-react'

const classes = [
  { id: 1, time: '08:00', title: 'Йога', trainer: 'Иванова А.', room: 'Зал 1', capacity: 15, registered: 12, color: '#10b981' },
  { id: 2, time: '09:30', title: 'Силовая', trainer: 'Петров С.', room: 'Тренажёрный', capacity: 20, registered: 18, color: '#ef4444' },
  { id: 3, time: '10:00', title: 'Пилатес', trainer: 'Козлова М.', room: 'Зал 2', capacity: 12, registered: 8, color: '#8b5cf6' },
  { id: 4, time: '12:00', title: 'Зумба', trainer: 'Новикова Е.', room: 'Зал 1', capacity: 25, registered: 20, color: '#ec4899' },
  { id: 5, time: '17:00', title: 'Кардио', trainer: 'Сидоров К.', room: 'Зал 2', capacity: 20, registered: 15, color: '#f59e0b' },
  { id: 6, time: '18:30', title: 'Растяжка', trainer: 'Волкова Н.', room: 'Зал 1', capacity: 15, registered: 10, color: '#6366f1' },
  { id: 7, time: '19:00', title: 'Силовая', trainer: 'Петров С.', room: 'Тренажёрный', capacity: 20, registered: 20, color: '#ef4444' },
]

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const dates = [2, 3, 4, 5, 6, 7, 8]

export default function SchedulePage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-white px-2">2–8 июня 2025</span>
          <button className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
          <button className="btn-ghost text-indigo-400 text-sm">Сегодня</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-white/5 rounded-lg p-1 border border-white/8">
            {['День', 'Неделя', 'Месяц'].map((v, i) => (
              <button key={v} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${i === 1 ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'}`}>{v}</button>
            ))}
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Занятие
          </button>
        </div>
      </div>

      {/* Week calendar */}
      <div className="glass overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/8">
          <div />
          {weekDays.map((day, i) => (
            <div key={day} className={`text-center py-3 border-l border-white/5 ${i === 2 ? 'bg-indigo-600/10' : ''}`}>
              <div className="text-[11px] text-white/40 uppercase tracking-wide">{day}</div>
              <div className={`text-sm font-bold mt-0.5 ${i === 2 ? 'text-indigo-400' : 'text-white/70'}`}>{dates[i]}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[500px] overflow-y-auto">
          {Array.from({ length: 14 }, (_, i) => i + 7).map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/4" style={{ height: 60 }}>
              <div className="flex items-start justify-end pr-2 pt-1">
                <span className="text-[10px] text-white/25">{hour}:00</span>
              </div>
              {weekDays.map((_, di) => {
                const cls = classes.find(c => parseInt(c.time) === hour && di === 2)
                return (
                  <div key={di} className={`border-l border-white/4 relative ${di === 2 ? 'bg-indigo-600/5' : ''}`}>
                    {cls && (
                      <div
                        className="absolute inset-x-1 top-1 rounded-lg p-1.5 cursor-pointer hover:brightness-110 transition-all"
                        style={{ backgroundColor: cls.color + '25', borderLeft: `3px solid ${cls.color}` }}
                      >
                        <div className="text-[11px] font-semibold text-white truncate">{cls.title}</div>
                        <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {cls.registered}/{cls.capacity}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
