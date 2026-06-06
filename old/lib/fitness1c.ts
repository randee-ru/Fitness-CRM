/**
 * 1С:Фитнес API v3 client
 * Base URL: http://195.216.241.93:85/Fitness_PROF/hs/api/v3
 */

const BASE_URL = process.env.FITNESS_API_BASE!;
const API_KEY  = process.env.FITNESS_API_KEY!;
const API_AUTH = process.env.FITNESS_API_AUTH!;
export const CLUB_ID = process.env.FITNESS_CLUB_ID!;

async function apiFetch<T>(
  endpoint: string,
  options: { method?: string; body?: object; usertoken?: string; params?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("club_id", CLUB_ID);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    "apikey": API_KEY,
    "Authorization": API_AUTH,
    "Content-Type": "application/json",
  };
  if (options.usertoken) headers["usertoken"] = options.usertoken;

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);

  const data = await res.json();
  if (!data.result) throw new Error(data.error_message ?? `API failed: ${endpoint}`);

  return data;
}

// ── Авторизация ───────────────────────────────────────────────────────────────

/** Войти по телефону и паролю — получить usertoken */
export async function authClient(phone: string, password: string) {
  const data = await apiFetch<{ result: boolean; data: { user_token: string; client_id: string } }>(
    "auth_client",
    { method: "POST", body: { phone, password } }
  );
  return data.data;
}

/** Получить usertoken по телефону (admin) */
export async function getClientUsertoken(phone: string): Promise<string | null> {
  try {
    const data = await apiFetch<{ result: boolean; data: string }>(
      "client_usertoken",
      { params: { phone } }
    );
    return data.data;
  } catch {
    return null;
  }
}

/** Получить usertoken по client_id (admin) */
export async function getClientUsertokenById(clientId: string): Promise<string | null> {
  try {
    const data = await apiFetch<{ result: boolean; data: string }>(
      "client_usertoken",
      { params: { client_id: clientId } }
    );
    return data.data;
  } catch {
    return null;
  }
}

// ── Клиент ───────────────────────────────────────────────────────────────────

export interface FitnessClient {
  id: string;
  last_name: string;
  name: string;
  second_name: string;
  email: string;
  phone: string;
  birthday: string | null;
  sex: number; // 1=мужской, 2=женский
  club: { id: string; name: string };
  cards: Array<{ id: string; title: string; card_code: string; card_type: string }>;
  tags: Array<{ id: string; title: string }>;
  photo: string | null;
}

/** Получить данные клиента по usertoken */
export async function getClient(usertoken: string): Promise<FitnessClient> {
  const data = await apiFetch<{ result: boolean; data: FitnessClient }>(
    "client",
    { usertoken }
  );
  return data.data;
}

// ── Абонементы ────────────────────────────────────────────────────────────────

export interface FitnessTicket {
  ticket_id: string;
  item_id: string;
  title: string;
  type: string; // membership | package | service
  status: string; // active | inactive | ended | frozen
  end_date: string | null;
  active_date: string | null;
  count: number | null;
  total_frozen: number;
  balance_frozen: number;
  recurrent: boolean;
  available_clubs: Array<{ id: string; title: string }>;
}

/** Получить абонементы клиента */
export async function getTickets(usertoken: string): Promise<FitnessTicket[]> {
  const data = await apiFetch<{ result: boolean; data: FitnessTicket[] }>(
    "tickets",
    { usertoken }
  );
  return data.data;
}

// ── Записи на занятия ─────────────────────────────────────────────────────────

export interface FitnessAppointment {
  appointment_id: string;
  type: string; // classes | personal | rental
  status: string; // planned | canceled | ended | passes
  start_date: string;
  end_date: string;
  duration: number;
  arrival_status: string; // arrived | not_arrived
  service: { id: string; title: string };
  room: { id: string; title: string };
  employee: { id: string; name: string; position: { id: string; title: string } };
}

/** Получить записи клиента */
export async function getAppointments(
  usertoken: string,
  params: { type?: string; statuses?: string; page_size?: string; requested_offset?: string } = {}
): Promise<FitnessAppointment[]> {
  const data = await apiFetch<{ result: boolean; data: FitnessAppointment[] }>(
    "appointments",
    { usertoken, params: params as Record<string, string> }
  );
  return data.data ?? [];
}

// ── История посещений ─────────────────────────────────────────────────────────

export interface FitnessVisit {
  id: string;
  start_date: string;
  end_date: string;
  appointment_list: FitnessAppointment[];
}

/** Получить историю посещений клиента */
export async function getVisitsHistory(
  usertoken: string,
  params: { page_size?: string; requested_offset?: string; order?: string } = {}
): Promise<FitnessVisit[]> {
  const data = await apiFetch<{ result: boolean; data: FitnessVisit[] }>(
    "visits_history",
    { usertoken, params: params as Record<string, string> }
  );
  return data.data ?? [];
}

// ── История покупок ───────────────────────────────────────────────────────────

export interface FitnessPurchase {
  id: string;
  datetime: string;
  products: Array<{
    product: { id: string; title: string; type: string };
    price: number;
    count: number;
    discount: number;
    total: number;
  }>;
  payments: Array<{ type: string; amount: number }>;
  total_amount: number;
  total_discount: number;
  total_debt: number;
}

/** Получить историю покупок */
export async function getPurchaseHistory(usertoken: string): Promise<FitnessPurchase[]> {
  const data = await apiFetch<{ result: boolean; data: FitnessPurchase[] }>(
    "purchase_history",
    { usertoken }
  );
  return data.data ?? [];
}

// ── Пропуск ───────────────────────────────────────────────────────────────────

export async function getPass(usertoken: string) {
  const data = await apiFetch<{ result: boolean; data: { code: string; valid_time: number; valid_thru: string; type: string } }>(
    "pass",
    { usertoken }
  );
  return data.data;
}

// ── Клубы ─────────────────────────────────────────────────────────────────────

export async function getClubs() {
  const data = await apiFetch<{ result: boolean; data: Array<{ id: string; title: string }> }>("clubs");
  return data.data;
}
