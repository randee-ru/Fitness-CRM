"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MembershipType { id: number; name: string; code: string; description: string | null; isActive: boolean; }
interface Membership { id: number; name: string; type: string; price: number; description: string | null; daysValid: number | null; visitCount: number | null; typeName: string | null; }

const typeLabel: Record<string, string> = { daily: "Суточный", visits: "По визитам", unlimited: "Безлимит" };

export default function SubscriptionsTypesClient({ membershipTypes, memberships }: { membershipTypes: MembershipType[]; memberships: Membership[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"memberships" | "types">("memberships");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "daily", price: "", daysValid: "", visitCount: "", description: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), daysValid: form.daysValid ? Number(form.daysValid) : null, visitCount: form.visitCount ? Number(form.visitCount) : null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Абонемент создан");
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Абонементы</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Создать абонемент
        </button>
      </div>

      <div className="flex gap-1 border-b border-white/10">
        {(["memberships", "types"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
            tab === t ? "border-indigo-400 text-indigo-300" : "border-transparent text-white/50 hover:text-white"
          )}>
            {t === "memberships" ? `Планы (${memberships.length})` : `Типы (${membershipTypes.length})`}
          </button>
        ))}
      </div>

      {tab === "memberships" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <div key={m.id} className="glass p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{m.name}</h3>
                <span className="badge badge-info text-xs shrink-0">{typeLabel[m.type] ?? m.type}</span>
              </div>
              <div className="text-2xl font-extrabold text-white">{m.price.toLocaleString("ru-RU")} ₽</div>
              {m.description && <p className="text-xs text-white/50">{m.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-white/50">
                {m.daysValid && <span>📅 {m.daysValid} дней</span>}
                {m.visitCount && <span>🎯 {m.visitCount} визитов</span>}
                {m.typeName && <span>📂 {m.typeName}</span>}
              </div>
            </div>
          ))}
          {memberships.length === 0 && <div className="col-span-full glass py-12 text-center text-sm text-white/40">Нет планов абонементов</div>}
        </div>
      )}

      {tab === "types" && (
        <div className="space-y-3">
          {membershipTypes.map((t) => (
            <div key={t.id} className="glass px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{t.name}</div>
                <div className="text-xs text-white/40">{t.code}{t.description && ` · ${t.description}`}</div>
              </div>
              <span className={cn("badge text-xs", t.isActive ? "badge-success" : "badge-default")}>
                {t.isActive ? "Активен" : "Неактивен"}
              </span>
            </div>
          ))}
          {membershipTypes.length === 0 && <div className="glass py-12 text-center text-sm text-white/40">Нет типов</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Новый абонемент</h2>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { key: "name", label: "Название *", type: "text" },
                { key: "price", label: "Цена (₽) *", type: "number" },
                { key: "daysValid", label: "Дней действия", type: "number" },
                { key: "visitCount", label: "Количество визитов", type: "number" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-white/60 mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="form-input" disabled={creating} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-white/60 mb-1">Тип</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="form-input" disabled={creating}>
                  <option value="daily">Суточный</option>
                  <option value="visits">По визитам</option>
                  <option value="unlimited">Безлимит</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Описание</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="form-input resize-none" rows={2} disabled={creating} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
