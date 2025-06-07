import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Función utilitaria para combinar clases CSS con Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea fecha corta
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Calcula días entre fechas
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Genera token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Calcula porcentaje de participación
 */
export function calculateParticipationRate(responded: number, total: number): number {
  if (total === 0) return 0
  return Math.round((responded / total) * 100)
}

/**
 * Formatea porcentaje
 */
export function formatPercentage(value: number): string {
  return `${value}%`
}

/**
 * Calcula promedio de ratings
 */
export function calculateAverage(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, rating) => acc + rating, 0)
  return Math.round((sum / ratings.length) * 10) / 10 // Redondear a 1 decimal
}

/**
 * Determina color según score
 */
export function getScoreColor(score: number): string {
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Determina color de fondo según score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 4) return 'bg-green-50 border-green-200'
  if (score >= 3) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

/**
 * Valida que las fechas sean coherentes
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

/**
 * Slugifica texto para URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .trim()
    .replace(/^-+|-+$/g, '') // Remover guiones del inicio/final
}

/**
 * Trunca texto con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Capitaliza primera letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Parsea CSV simple
 */
export function parseCSVEmails(csvText: string): string[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line)
  const emails: string[] = []
  
  lines.forEach(line => {
    // Buscar emails en la línea (puede tener múltiples columnas)
    const emailMatch = line.match(/[^\s,;]+@[^\s,;]+\.[^\s,;]+/g)
    if (emailMatch) {
      emails.push(...emailMatch.map(email => email.trim().toLowerCase()))
    }
  })
  
  // Remover duplicados
  // Remover duplicados  
return Array.from(new Set(emails)).filter(email => isValidEmail(email))  // ← FIX
}

/**
 * Convierte estado a español
 */
export function getStatusInSpanish(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Borrador',
    'active': 'Activa',
    'completed': 'Completada',
    'cancelled': 'Cancelada'
  }
  return statusMap[status] || status
}

/**
 * Obtiene color del estado
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'active': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}