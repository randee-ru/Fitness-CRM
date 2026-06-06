"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный логин или пароль");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white">
            Fitness<span className="text-indigo-400">CRM</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">Система управления фитнес-клубом</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass space-y-4 p-8"
        >
          <h2 className="text-xl font-semibold text-white">Вход в систему</h2>

          {error && (
            <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm text-white/70">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="admin"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm text-white/70">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
