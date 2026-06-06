'use client'
import { useState } from 'react'
import { Plus, MoreHorizontal, User, Calendar, DollarSign } from 'lucide-react'

const pipeline = {
  stages: [
    {
      id: 1, name: 'Новый лид', color: '#6366f1',
      deals: [
        { id: 1, title: 'Иванова М.С. — абонемент', amount: 3500, client: 'Иванова М.С.', daysAgo: 0 },
        { id: 2, title: 'Петров В.А. — годовой', amount: 18000, client: 'Петров В.А.', daysAgo: 1 },
      ],
    },
    {
      id: 2, name: 'Консультация', color: '#f59e0b',
      deals: [
        { id: 3, title: 'Козлова Н.П. — 3 месяца', amount: 9000, client: 'Козлова Н.П.', daysAgo: 2 },
      ],
    },
    {
      id: 3, name: 'Пробное занятие', color: '#3b82f6',
      deals: [
        { id: 4, title: 'Сидоров К.М.', amount: 3500, client: 'Сидоров К.М.', daysAgo: 3 },
        { id: 5, title: 'Новиков Д.А.', amount: 9000, client: 'Новиков Д.А.', daysAgo: 1 },
      ],
    },
    {
      id: 4, name: 'КП отправлено', color: '#8b5cf6',
      deals: [
        { id: 6, title: 'Морозова А.В.', amount: 18000, client: 'Морозова А.В.', daysAgo: 5 },
      ],
    },
    {
      id: 5, name: 'Успешно', color: '#10b981',
      deals: [
        { id: 7, title: 'Волков Е.С.', amount: 3500, client: 'Волков Е.С.', daysAgo: 0 },
      ],
    },
    {
      id: 6, name: 'Отказ', color: '#ef4444',
      deals: [],
    },
  ],
}

function DealCard({ deal }: { deal: typeof pipeline.stages[0]['deals'][0] }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-lg p-3 cursor-pointer hover:border-white/20 hover:bg-white/8 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-white leading-snug">{deal.title}</p>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10">
          <MoreHorizontal className="w-3 h-3 text-white/50" />
        </button>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ₽ {deal.amount.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {deal.daysAgo === 0 ? 'Сегодня' : `${deal.daysAgo}д назад`}</span>
      </div>
    </div>
  )
}

export default function CrmPage() {
  const total = pipeline.stages.reduce((s, st) => s + st.deals.length, 0)
  const amount = pipeline.stages.reduce((s, st) => s + st.deals.reduce((a, d) => a + d.amount, 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="badge badge-info">{total} сделок</span>
          <span className="badge badge-default">₽ {amount.toLocaleString()}</span>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Новая сделка
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-64">
            {/* Stage header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
              <span className="text-sm font-medium text-white/70 truncate">{stage.name}</span>
              <span className="ml-auto text-xs text-white/30 flex-shrink-0">{stage.deals.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[120px] bg-white/3 rounded-xl p-2 border border-white/5">
              {stage.deals.map(deal => <DealCard key={deal.id} deal={deal} />)}

              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/25 hover:text-white/50 hover:bg-white/5 transition-all">
                <Plus className="w-3 h-3" />
                Добавить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
