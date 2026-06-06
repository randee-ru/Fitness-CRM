import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount))
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, { hour: '2-digit', minute: '2-digit' })
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  return phone
}

export function getFullName(person: { firstName: string; lastName: string; middleName?: string | null }) {
  return [person.lastName, person.firstName, person.middleName].filter(Boolean).join(' ')
}

export function getInitials(person: { firstName: string; lastName: string }) {
  return `${person.firstName[0]}${person.lastName[0]}`.toUpperCase()
}
