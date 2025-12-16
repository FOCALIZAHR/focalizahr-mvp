// src/lib/utils/enrollment-error-parser.ts
// Utilidad para parsear errores de enrollment y mostrar mensajes amigables

/**
 * ENROLLMENT ERROR PARSER
 * 
 * Convierte códigos de error del backend en mensajes amigables para el usuario.
 * Usado principalmente en la carga masiva de onboarding.
 * 
 * Errores soportados:
 * - ENROLLMENT_WINDOW_EXPIRED:X → "Ventana expirada (X días)"
 * - ENROLLMENT_TOO_EARLY:X → "Fecha muy lejana (X días)"
 * - Validación Zod → Se pasan tal cual
 * - Errores genéricos → Se pasan tal cual
 */

export interface ParsedEnrollmentError {
  type: 'window_expired' | 'too_early' | 'validation' | 'generic';
  message: string;
  days?: number;
  icon: 'clock' | 'calendar' | 'alert' | 'x';
  color: 'amber' | 'cyan' | 'red';
}

/**
 * Parsea un error de enrollment y retorna información estructurada
 */
export function parseEnrollmentError(error: string): ParsedEnrollmentError {
  // Caso 1: Ventana expirada (hire_date > 7 días pasado)
  if (error.startsWith('ENROLLMENT_WINDOW_EXPIRED:')) {
    const days = parseInt(error.split(':')[1]) || 0;
    return {
      type: 'window_expired',
      message: `Ventana expirada (${days} días desde ingreso)`,
      days,
      icon: 'clock',
      color: 'amber'
    };
  }
  
  // Caso 2: Fecha muy lejana (hire_date > 7 días futuro)
  if (error.startsWith('ENROLLMENT_TOO_EARLY:')) {
    const days = parseInt(error.split(':')[1]) || 0;
    return {
      type: 'too_early',
      message: `Fecha muy lejana (${days} días en el futuro)`,
      days,
      icon: 'calendar',
      color: 'cyan'
    };
  }
  
  // Caso 3: Errores de validación Zod
  if (error.startsWith('Validación:') || error.includes('requerido') || error.includes('inválido')) {
    return {
      type: 'validation',
      message: error,
      icon: 'alert',
      color: 'red'
    };
  }
  
  // Caso 4: Error genérico
  return {
    type: 'generic',
    message: error,
    icon: 'x',
    color: 'red'
  };
}

/**
 * Valida si una fecha de ingreso está dentro de la ventana permitida
 * Retorna null si es válida, o un objeto de error si no lo es
 */
export function validateHireDateWindow(hireDate: string | Date): ParsedEnrollmentError | null {
  const MAX_DAYS_PAST = 7;
  const MAX_DAYS_FUTURE = 7;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hireDateObj = typeof hireDate === 'string' ? new Date(hireDate) : hireDate;
  hireDateObj.setHours(0, 0, 0, 0);
  
  // Validar fecha válida
  if (isNaN(hireDateObj.getTime())) {
    return {
      type: 'validation',
      message: 'Fecha de ingreso inválida',
      icon: 'alert',
      color: 'red'
    };
  }
  
  const daysDiff = Math.floor(
    (today.getTime() - hireDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Pasado > 7 días
  if (daysDiff > MAX_DAYS_PAST) {
    return {
      type: 'window_expired',
      message: `Ventana expirada (${daysDiff} días)`,
      days: daysDiff,
      icon: 'clock',
      color: 'amber'
    };
  }
  
  // Futuro > 7 días
  if (daysDiff < -MAX_DAYS_FUTURE) {
    const futureDays = Math.abs(daysDiff);
    return {
      type: 'too_early',
      message: `Fecha muy lejana (${futureDays} días)`,
      days: futureDays,
      icon: 'calendar',
      color: 'cyan'
    };
  }
  
  // Fecha válida
  return null;
}

/**
 * Formatea días en texto amigable
 */
export function formatDaysText(days: number, type: 'past' | 'future'): string {
  if (days === 1) {
    return type === 'past' ? 'ayer' : 'mañana';
  }
  return type === 'past' 
    ? `hace ${days} días` 
    : `en ${days} días`;
}