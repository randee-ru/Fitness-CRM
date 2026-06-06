import { prisma } from "@/lib/prisma";
import { resolveName, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = { active: "Активен", expired: "Истёк", frozen: "Заморожен", cancelled: "Отменён" };
const statusBadge: Record<string, string> = { active: "badge-success", expired: "badge-danger", frozen: "badge-info", cancelled: "badge-default" };

export default async function SubscriptionsClientsPage() {
  const cms = await prisma.clientMembership.findMany({
    include: {
      client: { select: { id: true, firstName: true, lastName: true, middleName: true } },
      membership: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Клиентские абонементы</h1>

      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1.2fr_1.2fr_1fr] border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-white/40">
          <span>Клиент</span><span>Абонемент</span><span>Тип</span>
          <span>Активация</span><span>Истекает</span><span>Статус</span>
        </div>
        {cms.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/40">Нет абонементов</div>
        ) : cms.map((cm) => (
          <div key={cm.id} className="grid grid-cols-[2fr_2fr_1fr_1.2fr_1.2fr_1fr] items-center gap-4 border-b border-white/5 px-5 py-3 text-sm hover:bg-white/5 transition">
            <span className="font-medium text-white">{resolveName(cm.client)}</span>
            <span className="text-white/70">{cm.membership.name}</span>
            <span className="text-white/50">{cm.membership.type}</span>
            <span className="text-white/50">{formatDate(cm.activationDate)}</span>
            <span className="text-white/50">{formatDate(cm.expirationDate)}</span>
            <span className={cn("badge text-xs", statusBadge[cm.status] ?? "badge-default")}>
              {statusLabel[cm.status] ?? cm.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
