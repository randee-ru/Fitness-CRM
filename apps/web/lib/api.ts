const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${this.baseUrl}/api${path}`, { ...options, headers })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `HTTP ${res.status}`)
    }
    return res.json()
  }

  get<T>(path: string, token?: string) { return this.request<T>(path, { method: 'GET' }, token) }
  post<T>(path: string, body: unknown, token?: string) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token) }
  put<T>(path: string, body: unknown, token?: string) { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, token) }
  delete<T>(path: string, token?: string) { return this.request<T>(path, { method: 'DELETE' }, token) }
}

export const api = new ApiClient(API_URL)

export const endpoints = {
  auth: { login: '/auth/login', me: '/auth/me' },
  clients: { list: '/clients', stats: '/clients/stats', byId: (id: number) => `/clients/${id}` },
  crm: { pipelines: '/crm/pipelines', deals: '/crm/deals', deal: (id: number) => `/crm/deals/${id}`, moveDeal: (id: number) => `/crm/deals/${id}/move` },
  visits: { inClub: '/visits/in-club', search: '/visits/search', checkIn: '/visits/check-in', checkOut: (id: number) => `/visits/${id}/check-out` },
  rfid: { access: '/rfid/access', events: '/rfid/events', clientKeys: (id: number) => `/rfid/clients/${id}/keys` },
  loyalty: { programs: '/loyalty/programs', client: (id: number) => `/loyalty/clients/${id}`, transactions: (id: number) => `/loyalty/clients/${id}/transactions` },
  schedule: { classes: '/schedule/classes', trainers: '/schedule/trainers', classTypes: '/schedule/class-types' },
  finance: { stats: '/finance/stats', payments: '/finance/payments', cash: '/finance/cash' },
  mango: { calls: '/mango/calls' },
}
