"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, X, Loader2, Plus, LogIn, LogOut,
  QrCode, BookOpen, Calendar, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";

interface ClientInClub {
  id: number; visitId: number; name: string;
  membership: string; checkInTime: string; validUntilTime: string | null;
}
interface SearchResult { id: number; name: string; phone: string; cardNumber: string | null; }
interface Booking {
  id: number; time: string; clientId: number; clientName: string;
  type: string; trainerName: string; status: "scheduled" | "completed" | "cancelled"; notes?: string;
}

// Моковые записи — в будущем заменить на API
const MOCK_BOOKINGS: Booking[] = [
  { id: 1, time: new Date().toISOString().slice(0, 10) + "T10:00:00", clientId: 1, clientName: "Иванов Иван Иванович", type: "Персональное занятие", trainerName: "Петров Петр", status: "scheduled", notes: "Первое занятие" },
  { id: 2, time: new Date().toISOString().slice(0, 10) + "T11:30:00", clientId: 2, clientName: "Петрова Мария Сергеевна", type: "Групповое занятие", trainerName: "Сидоров Сидор", status: "completed" },
  { id: 3, time: new Date().toISOString().slice(0, 10) + "T14:00:00", clientId: 3, clientName: "Сидоров Петр Алексеевич", type: "Персональное занятие", trainerName: "Петров Петр", status: "scheduled" },
];

export default function ReceptionClient() {
  const router = useRouter();

  // Клиенты в клубе
  const [clientsInClub, setClientsInClub] = useState<ClientInClub[]>([]);
  const [loadingClub, setLoadingClub] = useState(true);

  // Поиск
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Считыватель карт
  const [cardReaderEnabled, setCardReaderEnabled] = useState(true);
  const [cardReaderMode, setCardReaderMode] = useState<"local" | "remote">("local");
  const cardDataBuffer = useRef("");
  const cardReaderListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const cardReaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardReaderFocusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Записи на сегодня
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [bookingFilter, setBookingFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");

  // Модалка нового клиента
  const [showNewClient, setShowNewClient] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ firstName: "", lastName: "", middleName: "", phone: "" });

  // ── Загрузка клиентов в клубе ─────────────────────────────────────────────
  const loadClientsInClub = useCallback(async () => {
    try {
      const res = await fetch("/api/reception/clients-in-club");
      const data = await res.json();
      setClientsInClub(data.clients ?? []);
    } catch { /* silent */ }
    finally { setLoadingClub(false); }
  }, []);

  useEffect(() => {
    loadClientsInClub();
    const interval = setInterval(loadClientsInClub, 60_000);
    return () => clearInterval(interval);
  }, [loadClientsInClub]);

  // ── Поиск клиентов ────────────────────────────────────────────────────────
  function handleSearchInput(q: string) {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/reception/search-clients?q=${encodeURIComponent(q)}`);
        setSearchResults(await res.json());
      } finally { setIsSearching(false); }
    }, 300);
  }

  async function checkIn(client: SearchResult) {
    try {
      const res = await fetch("/api/reception/check-in", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${client.name} пропущен в клуб`);
        setSearchQuery(""); setSearchResults([]);
        loadClientsInClub();
      } else if (data.frozen) {
        toast.error(`❄️ Абонемент заморожен: ${data.message}`);
      } else {
        toast.warning(data.message ?? "Ошибка check-in");
      }
    } catch { toast.error("Ошибка сети"); }
  }

  async function checkOut(visitId: number, clientName: string) {
    if (!confirm(`Подтвердить выход клиента ${clientName}?`)) return;
    try {
      const res = await fetch(`/api/reception/check-out/${visitId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) { toast.success(`${clientName} вышел из клуба`); loadClientsInClub(); }
    } catch { toast.error("Ошибка сети"); }
  }

  // ── Считыватель карт ──────────────────────────────────────────────────────
  function processCardData(cardData: string) {
    const clientId = /^\d+$/.test(cardData) ? parseInt(cardData) : null;
    if (!clientId) { toast.warning(`Неизвестный формат карты: ${cardData}`); return; }
    fetch("/api/reception/check-in", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, membershipId: `card_${cardData}` }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { toast.success("✅ Карта считана — клиент пропущен"); loadClientsInClub(); }
        else if (data.frozen) toast.error(`❄️ Абонемент заморожен: ${data.message}`);
        else toast.warning(data.message ?? "Ошибка");
      })
      .catch(() => toast.error("Ошибка сети"));
  }

  function startCardReader() {
    cardDataBuffer.current = "";
    let hiddenInput = document.getElementById("card-reader-input") as HTMLInputElement;
    if (!hiddenInput) {
      hiddenInput = document.createElement("input");
      Object.assign(hiddenInput.style, { position: "fixed", left: "-9999px", opacity: "0", width: "1px", height: "1px" });
      hiddenInput.id = "card-reader-input";
      hiddenInput.setAttribute("autocomplete", "off");
      hiddenInput.setAttribute("tabindex", "-1");
      document.body.appendChild(hiddenInput);
    }

    const listener = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      if (isInput && (active as HTMLElement).id !== "card-reader-input") return;
      if (e.key === "Enter" && cardDataBuffer.current.trim()) {
        e.preventDefault();
        const data = cardDataBuffer.current.trim();
        cardDataBuffer.current = "";
        processCardData(data);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        cardDataBuffer.current += e.key;
        if (cardReaderTimeoutRef.current) clearTimeout(cardReaderTimeoutRef.current);
        cardReaderTimeoutRef.current = setTimeout(() => {
          if (cardDataBuffer.current.trim().length > 3) processCardData(cardDataBuffer.current.trim());
          cardDataBuffer.current = "";
        }, 300);
      }
    };
    cardReaderListenerRef.current = listener;
    document.addEventListener("keydown", listener);

    cardReaderFocusIntervalRef.current = setInterval(() => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      if (!isInput) hiddenInput?.focus();
    }, 1000);

    setTimeout(() => hiddenInput?.focus(), 100);
  }

  function stopCardReader() {
    if (cardReaderListenerRef.current) {
      document.removeEventListener("keydown", cardReaderListenerRef.current);
      cardReaderListenerRef.current = null;
    }
    if (cardReaderTimeoutRef.current) clearTimeout(cardReaderTimeoutRef.current);
    if (cardReaderFocusIntervalRef.current) clearInterval(cardReaderFocusIntervalRef.current);
    cardDataBuffer.current = "";
    document.getElementById("card-reader-input")?.remove();
  }

  function activateCardReader() {
    const el = document.getElementById("card-reader-input") as HTMLInputElement;
    if (el) { el.focus(); toast.success("✅ Считыватель активирован — поднесите карту"); }
  }

  useEffect(() => {
    if (cardReaderEnabled) startCardReader();
    else stopCardReader();
    return () => stopCardReader();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardReaderEnabled, cardReaderMode]);

  // ── Записи ────────────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter(
    (b) => bookingFilter === "all" || b.status === bookingFilter
  );

  function markBooking(id: number) {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "completed" } : b));
  }
  function cancelBooking(id: number) {
    if (!confirm("Отменить эту запись?")) return;
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
  }

  function formatBookingTime(iso: string) {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  // ── Новый клиент ──────────────────────────────────────────────────────────
  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.firstName.trim() || !newForm.phone.trim()) {
      toast.error("Имя и телефон обязательны"); return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, role: "клиент" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Клиент создан");
      setShowNewClient(false);
      router.push(`/clients/${data.client.id}?from=reception`);
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Шапка страницы ─────────────────────────────────────── */}
      <div className="glass p-4 flex flex-wrap items-center gap-4">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-white">Ресепшен</h1>
          <p className="text-xs text-white/50">Управление приемом клиентов и записями</p>
        </div>

        {/* Поиск */}
        <div className="flex-1 min-w-[260px] max-w-2xl relative">
          <div className={cn(
            "flex items-center gap-2 rounded-xl border bg-white/8 px-3 py-2.5 transition",
            searchQuery ? "border-indigo-400/50" : "border-white/15"
          )}>
            <Search size={16} className="text-white/40 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Поиск клиента по имени, телефону или номеру карты..."
              className="flex-1 bg-transparent text-white placeholder-white/35 text-sm focus:outline-none"
            />
            {isSearching && <Loader2 size={14} className="animate-spin text-white/40 shrink-0" />}
            {searchQuery && !isSearching && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                <X size={14} className="text-white/40 hover:text-white" />
              </button>
            )}
          </div>

          {/* Дропдаун результатов */}
          {(searchResults.length > 0 || (searchQuery && !isSearching)) && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-white/15 bg-[#1a1f35]/98 backdrop-blur shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-white/40">Клиент не найден</p>
                </div>
              ) : searchResults.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition border-b border-white/5 last:border-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/25 text-sm font-semibold text-indigo-300">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{c.name}</div>
                    <div className="text-xs text-white/45 mt-0.5">
                      {c.phone}{c.cardNumber && <span className="ml-2 font-mono">Карта: {c.cardNumber}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/clients/${c.id}`} className="btn-secondary text-xs px-3 py-1.5">Профиль</Link>
                    <button onClick={() => checkIn(c)} className="btn-primary text-xs px-3 py-1.5">
                      <LogIn size={12} /> Пропустить в клуб
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Считыватель карт */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm text-white/70">Считыватель карт</span>
            <button
              onClick={() => setCardReaderEnabled((v) => !v)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-300",
                cardReaderEnabled ? "bg-green-500" : "bg-white/20"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300",
                cardReaderEnabled ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </label>

          {cardReaderEnabled && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/50">
                {cardReaderMode === "local" ? "Локальный режим" : "Удалённый режим"}
              </span>
              {cardReaderMode === "local" && (
                <button
                  onClick={activateCardReader}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition"
                >
                  Активировать
                </button>
              )}
            </div>
          )}

          <select
            value={cardReaderMode}
            onChange={(e) => setCardReaderMode(e.target.value as "local" | "remote")}
            className="text-xs rounded-lg border border-white/15 bg-white/8 px-2.5 py-1 text-white/70 focus:outline-none"
          >
            <option value="local">Локальный (этот ПК)</option>
            <option value="remote">Удалённый (API)</option>
          </select>
        </div>
      </div>

      {/* ── Быстрые действия ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "📷", title: "Сканирование", text: "Сканировать QR-код клиента", onClick: () => toast.info("QR-сканер в разработке") },
          { icon: "👤", title: "Новый клиент", text: "Зарегистрировать нового клиента", onClick: () => setShowNewClient(true) },
          { icon: "📝", title: "Новая запись", text: "Записать клиента на занятие", onClick: () => toast.info("Модуль записи в разработке") },
          { icon: "📅", title: "Расписание занятий", text: "", href: "/schedule/group" },
        ].map((action) =>
          action.href ? (
            <Link key={action.title} href={action.href}
              className="glass flex items-center gap-4 p-4 hover:bg-white/10 transition cursor-pointer">
              <span className="text-3xl">{action.icon}</span>
              <div>
                <div className="font-medium text-white text-sm">{action.title}</div>
                {action.text && <div className="text-xs text-white/50 mt-0.5">{action.text}</div>}
              </div>
            </Link>
          ) : (
            <button key={action.title} onClick={action.onClick}
              className="glass flex items-center gap-4 p-4 hover:bg-white/10 transition text-left w-full">
              <span className="text-3xl">{action.icon}</span>
              <div>
                <div className="font-medium text-white text-sm">{action.title}</div>
                {action.text && <div className="text-xs text-white/50 mt-0.5">{action.text}</div>}
              </div>
            </button>
          )
        )}
      </div>

      {/* ── Клиенты в клубе ────────────────────────────────────── */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Клиенты в клубе</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
            {clientsInClub.length}
          </span>
        </div>

        {loadingClub ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-white/30" />
          </div>
        ) : clientsInClub.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-5xl mb-3 opacity-40">👥</div>
            <p className="text-sm text-white/40">В клубе нет клиентов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientsInClub.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/8 transition">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/25 font-semibold text-indigo-300">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/clients/${c.id}?from=reception`} className="font-medium text-white hover:text-indigo-300 transition text-sm">
                    {c.name}
                  </Link>
                  <div className="flex flex-wrap gap-3 text-xs text-white/45 mt-0.5">
                    <span>Абонемент: {c.membership}</span>
                    <span>Вход: {formatDateTime(c.checkInTime)}</span>
                    {c.validUntilTime && <span className="text-amber-300">До: {c.validUntilTime}</span>}
                  </div>
                </div>
                <button onClick={() => checkOut(c.visitId, c.name)}
                  className="btn-danger shrink-0 text-xs">
                  <LogOut size={13} /> Выход
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Записи на сегодня ──────────────────────────────────── */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Записи на сегодня</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookingFilter((f) => {
                const opts = ["all", "scheduled", "completed", "cancelled"] as const;
                return opts[(opts.indexOf(f) + 1) % opts.length];
              })}
              className="flex items-center gap-2 text-xs rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-white/70 hover:bg-white/15 transition"
            >
              {{ all: "Все записи", scheduled: "Запланированные", completed: "Завершённые", cancelled: "Отменённые" }[bookingFilter]}
            </button>
            <button className="btn-secondary text-xs px-3 py-1.5">Все записи</button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2 opacity-40">📅</div>
            <p className="text-sm text-white/40">Нет записей на сегодня</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => (
              <div key={b.id} className={cn(
                "flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition",
                b.status === "completed" && "opacity-60",
                b.status === "cancelled" && "opacity-40",
              )}>
                <div className="text-lg font-bold text-white shrink-0 w-14">
                  {formatBookingTime(b.time)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/clients/${b.clientId}?from=reception`} className="font-medium text-white hover:text-indigo-300 transition text-sm">
                      {b.clientName}
                    </Link>
                    <span className="badge badge-default text-xs">{b.type}</span>
                  </div>
                  <div className="text-xs text-white/45">
                    Тренер: {b.trainerName}
                    {b.notes && <span className="ml-2 italic opacity-70">{b.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {b.status === "scheduled" && (
                    <>
                      <button onClick={() => markBooking(b.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition">
                        Отметить
                      </button>
                      <button onClick={() => cancelBooking(b.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition">
                        Отменить
                      </button>
                    </>
                  )}
                  {b.status === "completed" && (
                    <span className="badge badge-success text-xs">Завершено</span>
                  )}
                  {b.status === "cancelled" && (
                    <span className="badge badge-danger text-xs">Отменено</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Модалка нового клиента ─────────────────────────────── */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Новый клиент</h2>
              <button onClick={() => setShowNewClient(false)} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3">
              {(["firstName", "lastName", "middleName", "phone"] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs text-white/55 mb-1">
                    {f === "firstName" ? "Имя *" : f === "lastName" ? "Фамилия" : f === "middleName" ? "Отчество" : "Телефон *"}
                  </label>
                  <input value={newForm[f]} onChange={(e) => setNewForm((p) => ({ ...p, [f]: e.target.value }))}
                    className="form-input" disabled={creating} />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowNewClient(false)}>Отмена</button>
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
