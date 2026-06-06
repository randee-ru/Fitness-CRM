import { Settings, Database, Bell, Shield, Wifi, Phone, Users } from 'lucide-react'

const sections = [
  { icon: Users, label: 'Пользователи и роли', desc: 'Управление сотрудниками, RBAC' },
  { icon: Database, label: 'База данных', desc: 'Бэкапы, экспорт, синхронизация' },
  { icon: Phone, label: 'Mango Office', desc: 'Интеграция с телефонией' },
  { icon: Wifi, label: 'СКУД Sigur', desc: 'Интеграция с системой доступа' },
  { icon: Bell, label: 'Уведомления', desc: 'Push, SMS, Email' },
  { icon: Shield, label: 'Безопасность', desc: 'Сессии, 2FA, журнал аудита' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        {sections.map(s => (
          <button
            key={s.label}
            className="glass p-5 text-left hover:border-white/20 hover:bg-white/8 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-600/25 transition-colors">
                <s.icon className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="font-semibold text-white text-sm">{s.label}</span>
            </div>
            <p className="text-xs text-white/40 ml-12">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* System info */}
      <div className="glass p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-white/40" />
          Информация о системе
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Версия', '1.0.0'],
            ['API', 'http://localhost:3001'],
            ['База данных', 'PostgreSQL 17'],
            ['Кэш', 'Redis 7'],
            ['Среда', 'Production'],
            ['Последнее обновление', '06.06.2025'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-white/5">
              <span className="text-white/40">{k}</span>
              <span className="text-white/70 font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
