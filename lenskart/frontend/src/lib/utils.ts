import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(dateStr))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function getDiscountPercent(basePrice: number, finalPrice: number): number {
  return Math.round(((basePrice - finalPrice) / basePrice) * 100)
}

export function generateOrderNumber(): string {
  return `LK${Date.now().toString(36).toUpperCase()}`
}

export function buildSearchParams(params: Record<string, string | number | boolean | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return
    if (Array.isArray(val)) {
      val.forEach((v) => sp.append(key, String(v)))
    } else {
      sp.set(key, String(val))
    }
  })
  return sp
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getS3ImageUrl(key: string, width?: number): string {
  const cdn = import.meta.env.VITE_CDN_URL || ''
  const url = `${cdn}/${key}`
  if (width) return `${url}?w=${width}&q=85&f=webp`
  return url
}

export function calculateCartTotal(items: Array<{ totalPrice: number }>): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0)
}
