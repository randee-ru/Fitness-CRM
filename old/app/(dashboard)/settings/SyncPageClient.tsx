"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, RefreshCw, CheckCircle, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export default function SyncPageClient() {
  const [phones, setPhones] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Парсим CSV/TXT файл и извлекаем телефоны
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Ищем всё что похоже на телефон: +7..., 7..., 8...
      const found = text.match(/(\+?[78]\d{10}|\+?[78][\s\-\(\)]\d{3}[\s\-\(\)]\d{3}[\s\-]\d{2}[\s\-]\d{2})/g);
      if (found) {
        setPhones(found.join("\n"));
        toast.success(`Найдено телефонов: ${found.length}`);
      } else {
        toast.error("Телефоны не найдены в файле");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleSync() {
    const phoneList = phones
      .split(/[\n,;]/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (!phoneList.length) {
      toast.error("Введите хотя бы один телефон");
      return;
    }

    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: phoneList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      toast.success(`Синхронизировано: ${data.synced} клиентов`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Синхронизация клиентов</h1>
        <p className="text-sm text-white/50 mt-1">
          Импорт клиентов из 1С:Фитнес по номерам телефонов
        </p>
      </div>

      {/* Как это работает */}
      <div className="glass p-5 space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <RefreshCw size={16} className="text-indigo-400" />
          Как работает синхронизация
        </h2>
        <ol className="space-y-2 text-sm text-white/60 list-decimal list-inside">
          <li>Введите телефоны клиентов или загрузите CSV/Excel</li>
          <li>Система запросит данные каждого клиента из 1С:Фитнес API</li>
          <li>Клиенты будут созданы/обновлены в локальной базе</li>
          <li>Активные абонементы будут синхронизированы автоматически</li>
        </ol>
      </div>

      {/* Загрузка файла */}
      <div className="glass p-5 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Upload size={16} className="text-indigo-400" />
          Источник данных
        </h2>

        <div>
          <p className="text-xs text-white/50 mb-2">
            Загрузите CSV/TXT файл с телефонами (система найдёт все номера автоматически)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary text-sm"
          >
            <Upload size={14} /> Загрузить файл
          </button>
        </div>

        <div className="border-t border-white/10 pt-4">
          <label className="block text-xs text-white/50 mb-2">
            Или введите телефоны вручную (каждый с новой строки):
          </label>
          <textarea
            value={phones}
            onChange={(e) => setPhones(e.target.value)}
            className="form-input font-mono text-sm resize-none"
            rows={8}
            placeholder={`+79991234567\n+79997654321\n89001112233`}
            disabled={syncing}
          />
          <p className="text-xs text-white/30 mt-1">
            Найдено телефонов: {phones.split(/[\n,;]/).filter(p => p.trim().length > 5).length}
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || !phones.trim()}
          className="btn-primary w-full"
        >
          {syncing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Синхронизация...
            </>
          ) : (
            <>
              <Users size={16} />
              Синхронизировать клиентов
            </>
          )}
        </button>
      </div>

      {/* Результат */}
      {result && (
        <div className="glass p-5 space-y-4">
          <h2 className="font-semibold text-white">Результат синхронизации</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-400 shrink-0" />
              <div>
                <div className="text-2xl font-bold text-emerald-400">{result.synced}</div>
                <div className="text-xs text-white/50">Успешно</div>
              </div>
            </div>
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
              <XCircle size={24} className="text-rose-400 shrink-0" />
              <div>
                <div className="text-2xl font-bold text-rose-400">{result.failed}</div>
                <div className="text-xs text-white/50">Ошибок</div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ошибки:</p>
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-3 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-rose-300 py-0.5">{e}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
