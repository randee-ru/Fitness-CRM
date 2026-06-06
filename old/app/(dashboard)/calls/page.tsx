import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function CallsPage() {
  const calls = await prisma.phoneCall.findMany({
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Звонки</h1>

      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr] border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-white/40">
          <span>Направление</span><span>Номер</span><span>Клиент</span>
          <span>Начало</span><span>Длительность</span><span>Транскрипция</span>
        </div>
        {calls.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/40">Нет звонков</div>
        ) : calls.map((call) => (
          <div key={call.id} className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr] items-center border-b border-white/5 px-5 py-3 text-sm hover:bg-white/5 transition">
            <span className={cn("badge text-xs", call.direction === "in" ? "badge-success" : "badge-info")}>
              {call.direction === "in" ? "↙ Входящий" : "↗ Исходящий"}
            </span>
            <span className="text-white/70 font-mono">{call.phoneNumber}</span>
            <span className="text-white/60">
              {call.client ? [call.client.lastName, call.client.firstName].filter(Boolean).join(" ") : "—"}
            </span>
            <span className="text-white/50">{formatDateTime(call.startTime)}</span>
            <span className="text-white/50">{formatDuration(call.duration)}</span>
            <span className={cn("badge text-xs", call.transcriptionCached ? "badge-success" : "badge-default")}>
              {call.transcriptionCached ? "Есть" : "Нет"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
