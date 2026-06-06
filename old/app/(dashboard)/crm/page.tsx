import { prisma } from "@/lib/prisma";
import { resolveName } from "@/lib/utils";

export default async function CrmPage() {
  const [total, active, inactive, newThisMonth] = await Promise.all([
    prisma.user.count({ where: { role: "клиент" } }),
    prisma.user.count({ where: { role: "клиент", isActive: true } }),
    prisma.user.count({ where: { role: "клиент", isActive: false } }),
    prisma.user.count({
      where: {
        role: "клиент",
        registrationDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  const recentClients = await prisma.user.findMany({
    where: { role: "клиент" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">CRM</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Всего клиентов", value: total, color: "text-white" },
          { label: "Активных", value: active, color: "text-emerald-400" },
          { label: "На паузе", value: inactive, color: "text-amber-400" },
          { label: "Новых в этом месяце", value: newThisMonth, color: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="glass p-5">
            <div className="text-xs text-white/50 mb-2">{s.label}</div>
            <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="font-semibold text-white">Последние клиенты</h2>
        </div>
        <div className="divide-y divide-white/5">
          {recentClients.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition">
              <div>
                <div className="font-medium text-white">{resolveName(c)}</div>
                <div className="text-xs text-white/40">{c.phone ?? "—"} · {c.email ?? "—"}</div>
              </div>
              <span className={`badge text-xs ${c.isActive ? "badge-success" : "badge-warning"}`}>
                {c.isActive ? "Активен" : "На паузе"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
