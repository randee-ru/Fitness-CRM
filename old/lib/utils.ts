import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB", maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function computeAge(birthDate: string | Date | null | undefined): string {
  if (!birthDate) return "—";
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
  ) age--;
  return age >= 0 ? String(age) : "—";
}

export function resolveName(user: {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  username?: string | null;
  id: number;
}): string {
  const composed = [user.lastName, user.firstName, user.middleName]
    .filter(Boolean).join(" ").trim();
  if (composed) return composed;
  if (user.username) return user.username;
  return `Клиент #${user.id}`;
}
