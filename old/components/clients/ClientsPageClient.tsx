"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Upload, Filter, Loader2,
  RefreshCw, X, CheckCircle, AlertCircle, CloudDownload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ClientRecord } from "@/lib/client-mapper";

type SortOption = "new" | "alphabet" | "idAsc" | "lastVisit";
type MembershipInfo = { name: string; status: string; expirationDate: string | null };

interface Props {
  initialClients: ClientRecord[];
  membershipMap: Record<number, MembershipInfo>;
  totalInDB: number;
}

const membershipBadge: Record<string, string> = {
  active: "badge-success", expired: "badge-danger",
  frozen: "badge-info", cancelled: "badge-default",
};

const statusBadge: Record<string, string> = {
  success: "badge-success", warning: "badge-warning",
  danger: "badge-danger", info: "badge-info",
};

export default function ClientsPageClient({ initialClients, membershipMap, totalInDB }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("new");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Модалка создания клиента
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "", middleName: "", lastName: "",
    phone: "", email: "", birthDate: "", gender: "",
  });

  // Модалка импорта из 1С
  const [showImport, setShowImport] = useState(false);
  const [importPhones, setImportPhones] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; updated: number; failed: number; errors: string[] } | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  // ── Сортировка ─────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const arr = [...clients];
    if (sort === "alphabet") return arr.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (sort === "idAsc") return arr.sort((a, b) => a.id - b.id);
    return arr.sort((a, b) => b.id - a.id);
  }, [clients, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) =>
      [c.name, c.phone, c.email, c.cardNumber ?? ""]
        .join(" ").toLowerCase().includes(q)
    );
  }, [sorted, search]);

  // ── Виртуальный скролл ─────────────────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 15,
  });

  // ── Выделение ──────────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const isIndeterminate = selectedIds.length > 0 && !allSelected;

  // ── Дни до конца абонемента ────────────────────────────────────────────────
  const daysLeft = useCallback((info: MembershipInfo) => {
    if (!info.expirationDate) return null;
    const diff = new Date(info.expirationDate).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
  }, []);

  // ── Создание клиента ────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.firstName.trim() || !createForm.phone.trim()) {
      toast.error("Имя и телефон обязательны"); return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, role: "клиент" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success("Клиент создан");
      setShowCreate(false);
      setCreateForm({ firstName: "", middleName: "", lastName: "", phone: "", email: "", birthDate: "", gender: "" });
      router.push(`/clients/${data.client.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  // ── Импорт из файла ────────────────────────────────────────────────────────
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const found = text.match(/\+?[78][\s\-\(]?\d{3}[\s\-\(]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g);
      if (found) {
        setImportPhones(found.join("\n"));
        toast.success(`Найдено телефонов: ${found.length}`);
      } else {
        toast.error("Телефоны не найдены в файле");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // ── Синхронизация из 1С ────────────────────────────────────────────────────
  async function handleSync() {
    const phoneList = importPhones
      .split(/[\n,;]/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (!phoneList.length) {
      toast.error("Введите телефоны"); return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/sync/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: phoneList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResult(data);
      toast.success(`Синхронизировано: ${data.synced + data.updated} клиентов`);
      // Обновляем страницу для перезагрузки данных
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-88px)]">

      {/* Toolbar */}
      <div className="glass px-4 py-3 flex flex-wrap items-center gap-3 shrink-0">
        {/* Поиск */}
        <div className="relative flex flex-1 min-w-[240px] max-w-lg items-center overflow-hidden rounded-xl border border-white/20 bg-white/10 focus-within:border-indigo-400/80 transition">
          <Search size={15} className="ml-3 shrink-0 text-white/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, карте..."
            className="w-full bg-transparent py-2 pl-2 pr-3 text-sm text-white placeholder-white/35 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="mr-2">
              <X size={14} className="text-white/40 hover:text-white" />
            </button>
          )}
        </div>

        {/* Действия */}
        <div className="ml-auto flex items-center gap-2">
          {/* Импорт из 1С */}
          <button
            onClick={() => { setShowImport(true); setSyncResult(null); }}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-300 hover:bg-indigo-500/25 transition"
          >
            <CloudDownload size={15} />
            <span>Загрузить из 1С</span>
          </button>

          {/* Добавить вручную */}
          <button
            onClick={() => setShowCreate(true)}
            className="relative flex size-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white/80 hover:bg-white/25 transition"
            title="Добавить клиента"
          >
            <Plus size={18} />
          </button>

          {/* Импорт Excel */}
          <Link
            href="/clients/import"
            className="flex size-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white/80 hover:bg-white/25 transition"
            title="Импорт Excel"
          >
            <Upload size={18} />
          </Link>

          {/* Сортировка */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/25 transition"
            >
              <Filter size={14} />
              <span>Сортировка</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/15 bg-[#1a1f35]/98 backdrop-blur shadow-2xl z-20 overflow-hidden">
                {([
                  ["new", "По новизне"],
                  ["alphabet", "По алфавиту"],
                  ["idAsc", "ID нарастающий"],
                ] as [SortOption, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setSort(val); setDropdownOpen(false); }}
                    className={cn(
                      "flex w-full px-4 py-2.5 text-sm text-left transition hover:bg-white/10",
                      sort === val ? "text-indigo-300 font-medium bg-white/5" : "text-white/60"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="glass flex flex-col flex-1 overflow-hidden">
        {/* Заголовок */}
        <div className="grid grid-cols-[auto_2fr_1.3fr_1.5fr_1.1fr_1fr_1.3fr] items-center gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 shrink-0">
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
              onChange={(e) => setSelectedIds(e.target.checked ? filtered.map(c => c.id) : [])}
              className="size-4 rounded border-white/30 accent-indigo-500"
            />
          </label>
          <span>Клиент</span>
          <span>Телефон</span>
          <span>Абонемент</span>
          <span>Статус</span>
          <span>Осталось дней</span>
          <span>Последнее посещение</span>
        </div>

        {/* Виртуальные строки */}
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/40">
              <div className="text-5xl">👥</div>
              {totalInDB === 0 ? (
                <>
                  <p className="text-sm font-medium text-white/60">База клиентов пуста</p>
                  <p className="text-xs">Загрузите клиентов из 1С:Фитнес</p>
                  <button
                    onClick={() => setShowImport(true)}
                    className="btn-primary text-sm mt-2"
                  >
                    <CloudDownload size={15} /> Загрузить из 1С
                  </button>
                </>
              ) : (
                <p className="text-sm">Клиенты не найдены по запросу</p>
              )}
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((vRow) => {
                const client = filtered[vRow.index]!;
                const mi = membershipMap[client.id];
                const dl = mi ? daysLeft(mi) : null;
                const isSelected = selectedIds.includes(client.id);

                return (
                  <div
                    key={client.id}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vRow.start}px)`, height: `${vRow.size}px` }}
                    className={cn(
                      "grid grid-cols-[auto_2fr_1.3fr_1.5fr_1.1fr_1fr_1.3fr] items-center gap-4 border-b border-white/5 px-5 text-sm transition",
                      isSelected ? "bg-indigo-500/10" : "hover:bg-white/5"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => setSelectedIds(prev =>
                        e.target.checked ? [...prev, client.id] : prev.filter(x => x !== client.id)
                      )}
                      className="size-4 rounded border-white/30 accent-indigo-500"
                    />

                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3 hover:text-white transition min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/80 to-purple-400/80 text-xs font-bold text-white">
                        {client.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{client.name}</div>
                        {client.cardNumber && (
                          <div className="text-xs text-white/35 font-mono truncate">
                            🎫 {client.cardNumber}
                          </div>
                        )}
                      </div>
                    </Link>

                    <span className="text-white/55 text-xs truncate">{client.phone}</span>

                    <span>
                      {mi ? (
                        <span className={cn("badge text-xs truncate max-w-[140px]", membershipBadge[mi.status] ?? "badge-default")}>
                          {mi.name}
                        </span>
                      ) : <span className="text-white/25 text-xs">—</span>}
                    </span>

                    <span>
                      <span className={cn("badge text-xs", statusBadge[client.status.tone] ?? "badge-default")}>
                        {client.status.label}
                      </span>
                    </span>

                    <span className={cn(
                      "font-semibold text-sm",
                      dl != null && dl <= 3 ? "text-rose-400" :
                      dl != null && dl <= 7 ? "text-amber-400" : "text-white/50"
                    )}>
                      {dl != null ? `${dl} д.` : "—"}
                    </span>

                    <span className="text-white/35 text-xs">{client.lastVisit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Футер */}
      <div className="glass px-5 py-3 flex items-center gap-6 text-xs text-white/40 shrink-0">
        <span>
          Отмечено: <strong className="text-white">{selectedIds.length}</strong>
        </span>
        <span>
          Показано: <strong className="text-white">{filtered.length}</strong>
          {search && ` из ${clients.length}`}
        </span>
        <span>
          Всего в базе: <strong className="text-white">{totalInDB}</strong>
        </span>
      </div>

      {/* ── Модалка импорта из 1С ─────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CloudDownload size={18} className="text-indigo-400" />
                  Загрузка клиентов из 1С:Фитнес
                </h2>
                <p className="text-xs text-white/45 mt-0.5">
                  Введите телефоны — система получит данные из API 1С автоматически
                </p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>

            {!syncResult ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <input
                    ref={fileImportRef}
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileImportRef.current?.click()}
                    className="btn-secondary text-xs"
                  >
                    <Upload size={12} /> Из файла (CSV/TXT)
                  </button>
                  <span className="text-xs text-white/30">или вставьте вручную:</span>
                </div>

                <textarea
                  value={importPhones}
                  onChange={(e) => setImportPhones(e.target.value)}
                  className="form-input font-mono text-sm resize-none mb-2"
                  rows={7}
                  placeholder={`+79991234567\n+79997654321\n89001112233`}
                  disabled={syncing}
                />

                <div className="flex items-center justify-between text-xs text-white/35 mb-4">
                  <span>
                    Телефонов: <strong className="text-white/60">
                      {importPhones.split(/[\n,;]/).filter(p => p.trim().length > 5).length}
                    </strong>
                  </span>
                  <span>Каждый с новой строки, запятой или точкой с запятой</span>
                </div>

                <div className="flex gap-3 justify-end">
                  <button className="btn-secondary" onClick={() => setShowImport(false)}>Отмена</button>
                  <button
                    className="btn-primary"
                    onClick={handleSync}
                    disabled={syncing || !importPhones.trim()}
                  >
                    {syncing ? (
                      <><Loader2 size={14} className="animate-spin" /> Загружаю...</>
                    ) : (
                      <><RefreshCw size={14} /> Синхронизировать</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{syncResult.synced}</div>
                    <div className="text-xs text-white/40 mt-0.5">Добавлено</div>
                  </div>
                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                    <div className="text-2xl font-bold text-indigo-400">{syncResult.updated}</div>
                    <div className="text-xs text-white/40 mt-0.5">Обновлено</div>
                  </div>
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center">
                    <div className="text-2xl font-bold text-rose-400">{syncResult.failed}</div>
                    <div className="text-xs text-white/40 mt-0.5">Ошибок</div>
                  </div>
                </div>

                {syncResult.errors.length > 0 && (
                  <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-3 max-h-32 overflow-y-auto">
                    {syncResult.errors.map((e, i) => (
                      <div key={i} className="text-xs text-rose-300 py-0.5">{e}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button className="btn-secondary" onClick={() => { setShowImport(false); setSyncResult(null); setImportPhones(""); }}>
                    Закрыть
                  </button>
                  <button className="btn-primary" onClick={() => setSyncResult(null)}>
                    Синхронизировать ещё
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Модалка создания клиента ──────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Новый клиент</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {([
                ["firstName", "Имя *", "text"],
                ["lastName", "Фамилия", "text"],
                ["middleName", "Отчество", "text"],
                ["phone", "Телефон *", "tel"],
                ["email", "Email", "email"],
                ["birthDate", "Дата рождения", "date"],
              ] as [keyof typeof createForm, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className="block text-xs text-white/50 mb-1">{label}</label>
                  <input
                    type={type}
                    value={createForm[field]}
                    onChange={(e) => setCreateForm(f => ({ ...f, [field]: e.target.value }))}
                    className="form-input"
                    disabled={creating}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-white/50 mb-1">Пол</label>
                <select
                  value={createForm.gender}
                  onChange={(e) => setCreateForm(f => ({ ...f, gender: e.target.value }))}
                  className="form-input"
                  disabled={creating}
                >
                  <option value="">Не указан</option>
                  <option>Мужской</option>
                  <option>Женский</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Отмена</button>
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
