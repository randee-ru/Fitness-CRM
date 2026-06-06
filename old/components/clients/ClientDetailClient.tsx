"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Snowflake, Play, Loader2, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ClientRecord } from "@/lib/client-mapper";

interface Membership {
  id: number; membershipName: string; status: string;
  activationDate: string | null; expirationDate: string | null;
  remainingVisits: number | null; frozenAt: string | null; freezeReason: string | null;
}
interface Comment { id: string; text: string; createdAt: string; managerId: number | null; }
interface Visit { id: number; checkInTime: string; checkOutTime: string | null; membershipType: string | null; }

interface Props {
  client: ClientRecord;
  memberships: Membership[];
  comments: Comment[];
  visits: Visit[];
}

const statusBadge: Record<string, string> = {
  active: "badge-success", expired: "badge-danger",
  frozen: "badge-info", cancelled: "badge-default",
};
const statusLabel: Record<string, string> = {
  active: "Активен", expired: "Истёк",
  frozen: "Заморожен", cancelled: "Отменён",
};

export default function ClientDetailClient({ client, memberships, comments: initComments, visits }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "memberships" | "comments" | "visits">("info");
  const [comments, setComments] = useState(initComments);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [freezingId, setFreezingId] = useState<number | null>(null);

  async function addComment() {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, text: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => [data.comment, ...prev]);
      setCommentText("");
      toast.success("Комментарий добавлен");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingComment(false);
    }
  }

  async function toggleFreeze(m: Membership) {
    setFreezingId(m.id);
    try {
      const url = `/api/client-memberships/${m.id}/${m.status === "frozen" ? "unfreeze" : "freeze"}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "По запросу клиента" }) });
      if (!res.ok) throw new Error("Ошибка");
      toast.success(m.status === "frozen" ? "Абонемент разморожен" : "Абонемент заморожен");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFreezingId(null);
    }
  }

  const tabs = [
    { key: "info", label: "Информация" },
    { key: "memberships", label: `Абонементы (${memberships.length})` },
    { key: "comments", label: `Комментарии (${comments.length})` },
    { key: "visits", label: `Посещения (${visits.length})` },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients" className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/80 to-purple-400/80 text-xl font-bold text-white">
            {client.initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn("badge", client.status.tone === "success" ? "badge-success" : client.status.tone === "danger" ? "badge-danger" : "badge-warning")}>
                {client.status.label}
              </span>
              <span className="text-sm text-white/50">{client.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition border-b-2 -mb-px",
              tab === t.key
                ? "border-indigo-400 text-indigo-300"
                : "border-transparent text-white/50 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["Телефон", client.phone],
            ["Email", client.email],
            ["Дата рождения", client.birthDate],
            ["Возраст", client.age ? `${client.age} лет` : "—"],
            ["Пол", client.extra?.gender as string ?? "—"],
            ["Адрес", client.address],
            ["Telegram", client.telegram],
            ["Instagram", client.instagram],
            ["Рост", client.height],
            ["Вес", client.weight],
            ["Баланс", client.balance],
            ["Регистрация", client.registrationDate],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="glass px-4 py-3">
              <div className="text-xs text-white/40 mb-1">{label}</div>
              <div className="text-sm text-white font-medium">{value || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "memberships" && (
        <div className="space-y-3">
          {memberships.length === 0 ? (
            <div className="glass px-5 py-10 text-center text-sm text-white/40">Нет абонементов</div>
          ) : memberships.map((m) => (
            <div key={m.id} className="glass px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium text-white">{m.membershipName}</div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>Активация: {formatDate(m.activationDate)}</span>
                  <span>Истекает: {formatDate(m.expirationDate)}</span>
                  {m.remainingVisits != null && <span>Осталось посещений: {m.remainingVisits}</span>}
                </div>
                {m.frozenAt && (
                  <div className="text-xs text-sky-300">
                    Заморожен: {formatDate(m.frozenAt)}
                    {m.freezeReason && ` · ${m.freezeReason}`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("badge text-xs", statusBadge[m.status] ?? "badge-default")}>
                  {statusLabel[m.status] ?? m.status}
                </span>
                {(m.status === "active" || m.status === "frozen") && (
                  <button
                    onClick={() => toggleFreeze(m)}
                    disabled={freezingId === m.id}
                    className={cn("btn text-xs px-3 py-1.5", m.status === "frozen" ? "btn-secondary" : "badge-info border border-sky-500/20")}
                  >
                    {freezingId === m.id ? <Loader2 size={12} className="animate-spin" /> :
                      m.status === "frozen" ? <><Play size={12} /> Разморозить</> : <><Snowflake size={12} /> Заморозить</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="space-y-4">
          <div className="glass p-4 space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="form-input resize-none"
              rows={3}
              placeholder="Добавить комментарий..."
            />
            <div className="flex justify-end">
              <button onClick={addComment} disabled={addingComment || !commentText.trim()} className="btn-primary">
                {addingComment && <Loader2 size={14} className="animate-spin" />}
                Добавить
              </button>
            </div>
          </div>
          {comments.length === 0 ? (
            <div className="glass px-5 py-10 text-center text-sm text-white/40">Нет комментариев</div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="glass px-4 py-3">
                  <div className="text-sm text-white whitespace-pre-wrap">{c.text}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                    <MessageSquare size={11} />
                    {formatDateTime(c.createdAt)}
                    {c.managerId && <span>· Менеджер #{c.managerId}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "visits" && (
        <div className="glass overflow-hidden">
          <div className="grid grid-cols-3 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wider text-white/40">
            <span>Вход</span><span>Выход</span><span>Абонемент</span>
          </div>
          {visits.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-white/40">Нет посещений</div>
          ) : visits.map((v) => (
            <div key={v.id} className="grid grid-cols-3 border-b border-white/5 px-5 py-3 text-sm hover:bg-white/5 transition">
              <span className="text-white/80">{formatDateTime(v.checkInTime)}</span>
              <span className="text-white/50">{v.checkOutTime ? formatDateTime(v.checkOutTime) : <span className="badge-success badge text-xs">В клубе</span>}</span>
              <span className="text-white/50">{v.membershipType ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
