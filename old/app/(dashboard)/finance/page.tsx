import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function FinancePage() {
  const [revenueData, recentSales] = await Promise.all([
    prisma.clientMembership.aggregate({
      _sum: { /* we'll use membership price */ },
    }),
    prisma.clientMembership.findMany({
      include: {
        client: { select: { firstName: true, lastName: true, middleName: true, id: true } },
        membership: { select: { name: true, price: true } },
      },
      orderBy: { saleDate: "desc" },
      take: 20,
    }),
  ]);

  const totalRevenue = recentSales.reduce((sum, cm) => sum + (cm.membership.price ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Финансы</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-5">
          <div className="text-xs text-white/50 mb-2">Продаж за всё время (последние 20)</div>
          <div className="text-3xl font-extrabold text-emerald-400">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="glass p-5">
          <div className="text-xs text-white/50 mb-2">Всего продаж</div>
          <div className="text-3xl font-extrabold text-white">{recentSales.length}</div>
        </div>
        <div className="glass p-5">
          <div className="text-xs text-white/50 mb-2">Средний чек</div>
          <div className="text-3xl font-extrabold text-indigo-400">
            {recentSales.length > 0 ? formatCurrency(totalRevenue / recentSales.length) : "—"}
          </div>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="font-semibold text-white">Последние продажи</h2>
        </div>
        <div className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr] border-b border-white/10 px-5 py-2 text-xs uppercase tracking-wider text-white/40">
          <span>Клиент</span><span>Абонемент</span><span>Дата</span><span>Сумма</span>
        </div>
        {recentSales.map((cm) => (
          <div key={cm.id} className="grid grid-cols-[2fr_2fr_1.2fr_1.2fr] items-center border-b border-white/5 px-5 py-3 text-sm hover:bg-white/5 transition">
            <span className="text-white/80">
              {[cm.client.lastName, cm.client.firstName].filter(Boolean).join(" ") || `Клиент #${cm.client.id}`}
            </span>
            <span className="text-white/60">{cm.membership.name}</span>
            <span className="text-white/50">{formatDate(cm.saleDate)}</span>
            <span className="font-semibold text-emerald-400">{formatCurrency(cm.membership.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
