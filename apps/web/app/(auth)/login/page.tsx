'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,6%)] px-4">
      {/* Background blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/25">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SportMax ERP</h1>
          <p className="text-white/40 text-sm mt-1">Система управления клубом</p>
        </div>

        {/* Form */}
        <div className="glass p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@sportmax.ru"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Войти в систему
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/8 space-y-1.5">
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-widest">Тестовые аккаунты</p>
            {[
              { email: 'admin@sportmax.ru', pass: 'admin123', role: 'Admin' },
              { email: 'manager@sportmax.ru', pass: 'manager123', role: 'Manager' },
              { email: 'reception@sportmax.ru', pass: 'reception123', role: 'Reception' },
            ].map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass) }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-white/60">{acc.role}:</span>
                <span className="text-xs text-white/40 ml-1">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
