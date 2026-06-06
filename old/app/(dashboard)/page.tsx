import { prisma } from "@/lib/prisma";

async function getMetrics() {
  const [totalClients, activeClients, clientsInClub, totalMemberships] =
    await Promise.all([
      prisma.user.count({ where: { role: "клиент" } }),
      prisma.user.count({ where: { role: "клиент", isActive: true } }),
      prisma.clientVisit.count({ where: { checkOutTime: null } }),
      prisma.clientMembership.count({ where: { status: "active" } }),
    ]);

  return { totalClients, activeClients, clientsInClub, totalMemberships };
}

const gradients = [
  { bg: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", badge: "rgba(99,102,241,0.3)" },
  { bg: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)", badge: "rgba(34,197,94,0.3)" },
  { bg: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)", badge: "rgba(245,158,11,0.3)" },
  { bg: "linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)", badge: "rgba(59,130,246,0.3)" },
];

export default async function DashboardPage() {
  const m = await getMetrics();

  const cards = [
    { caption: "Всего клиентов", badge: "Всего", value: m.totalClients, sub: "зарегистрированных", gradient: gradients[0] },
    { caption: "Активные клиенты", badge: "Активные", value: m.activeClients, sub: "с активным статусом", gradient: gradients[1] },
    { caption: "В клубе сейчас", badge: "Онлайн", value: m.clientsInClub, sub: "не вышли из клуба", gradient: gradients[2] },
    { caption: "Активных абонементов", badge: "Абонементы", value: m.totalMemberships, sub: "действующих", gradient: gradients[3] },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Дашборд</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            {/* Gradient glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20 rounded-2xl"
              style={{ background: card.gradient.bg }}
            />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 font-medium">{card.caption}</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white/80"
                  style={{ background: card.gradient.badge }}
                >
                  {card.badge}
                </span>
              </div>
              <div className="text-4xl font-extrabold text-white">{card.value}</div>
              <div className="text-xs text-white/50">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
