import { User } from "@prisma/client";
import { formatDate, formatCurrency, computeAge, resolveName, getInitials } from "./utils";

export interface ClientRecord {
  id: number;
  name: string;
  initials: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalPhone: string;
  telegram: string;
  instagram: string;
  address: string;
  membership: string;
  status: { label: string; tone: "success" | "info" | "warning" | "danger" };
  manager: string;
  personalManagerId: number | null;
  lastVisit: string;
  registrationDate: string;
  birthDate: string;
  age: string;
  weight: string;
  weightValue: number | null;
  height: string;
  heightValue: number | null;
  balance: string;
  balanceValue: number | null;
  interests: string;
  jobTitle: string;
  children: string;
  tags: string[];
  notes: string;
  isActive: boolean;
  cardNumber: string | null;
  braceletNumber: string | null;
  extra: Record<string, unknown> | null;
}

function resolveStatus(user: User): ClientRecord["status"] {
  if (user.isActive) return { label: "Активен", tone: "success" };
  if (typeof user.balance === "number" && user.balance < 0)
    return { label: "Просрочен", tone: "danger" };
  return { label: "На паузе", tone: "warning" };
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

function parseCard(raw: string | null): { number: string | null; bracelet: string | null } {
  if (!raw) return { number: null, bracelet: null };
  try {
    const parsed = JSON.parse(raw);
    return {
      number: parsed?.number ?? parsed?.card ?? null,
      bracelet: parsed?.bracelet ?? null,
    };
  } catch {
    return { number: raw, bracelet: null };
  }
}

export function mapUserToClient(user: User): ClientRecord {
  const name = resolveName(user);
  const card = parseCard(user.card);

  return {
    id: user.id,
    name,
    initials: getInitials(name),
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "—",
    phone: user.phone ?? "—",
    additionalPhone: (() => {
      if (!user.phoneAll) return "—";
      try {
        const arr = JSON.parse(user.phoneAll);
        if (Array.isArray(arr)) return arr.filter(Boolean).join(", ") || "—";
      } catch {}
      return user.phoneAll || "—";
    })(),
    telegram: user.telegram ?? "—",
    instagram: user.instagram ?? "—",
    address: user.address ?? "—",
    membership: user.membershipId ?? "—",
    status: resolveStatus(user),
    manager: "—",
    personalManagerId: user.personalManagerId ?? null,
    lastVisit: formatDate(user.updatedAt),
    registrationDate: formatDate(user.registrationDate),
    birthDate: formatDate(user.birthDate),
    age: computeAge(user.birthDate),
    weight: user.weightKg ? `${user.weightKg} кг` : "—",
    weightValue: user.weightKg ?? null,
    height: user.heightCm ? `${user.heightCm} см` : "—",
    heightValue: user.heightCm ?? null,
    balance: formatCurrency(user.balance),
    balanceValue: user.balance ?? null,
    interests: user.interests ?? "—",
    jobTitle: user.jobTitle ?? "—",
    children: user.children ?? "—",
    tags: parseTags(user.tags),
    notes: user.notes ?? "",
    isActive: user.isActive,
    cardNumber: card.number,
    braceletNumber: card.bracelet,
    extra: user.extra ? (() => {
      try { return JSON.parse(user.extra); } catch { return null; }
    })() : null,
  };
}
