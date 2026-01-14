// ============================================
// src/lib/validations/departmentMetrics.ts
// CHAT 9: Validaciones Zod + Types
// ============================================

import { z } from 'zod';

// ==========================================
// ENUMS
// ==========================================
export const PeriodTypeEnum = z.enum([
  'monthly',
  'quarterly',
  'semi-annual',
  'annual'
]);

export const UploadMethodEnum = z.enum([
  'manual',
  'api',
  'concierge'
]);

export const DataQualityEnum = z.enum([
  'validated',
  'needs_review',
  'rejected'
]);

// ==========================================
// VALIDACIÓN PERÍODO
// ==========================================
const periodRegex = /^(\d{4})(-Q[1-4]|-0[1-9]|-1[0-2]|-H[1-2])?$/;

export const periodSchema = z.string().regex(periodRegex, {
  message: 'Período debe ser formato: 2025-Q1 (trimestre), 2025-01 (mes), 2025-H1 (semestre), o 2025 (año)'
});

// ==========================================
// SCHEMA UPLOAD (Excel/API input)
// ==========================================
export const departmentMetricsUploadSchema = z.object({
  costCenterCode: z.string()
    .min(1, 'Código centro de costos requerido')
    .max(20, 'Código muy largo'),
  
  period: periodSchema,
  
  // KPIs (al menos uno requerido)
  turnoverRate: z.number()
    .min(0, 'Rotación no puede ser negativa')
    .max(100, 'Rotación no puede exceder 100%')
    .optional(),
  
  absenceRate: z.number()
    .min(0, 'Ausentismo no puede ser negativo')
    .max(100, 'Ausentismo no puede exceder 100%')
    .optional(),
  
  issueCount: z.number()
    .int('Denuncias debe ser número entero')
    .min(0, 'Denuncias no puede ser negativo')
    .optional(),
  
  overtimeHoursTotal: z.number()
    .min(0, 'Horas extras no pueden ser negativas')
    .optional(),
  
  overtimeHoursAvg: z.number()
    .min(0, 'Promedio horas extras no puede ser negativo')
    .optional(),
  
  // Contexto (opcional pero validado)
  headcountAvg: z.number()
    .positive('Dotación debe ser positiva')
    .optional(),
  
  turnoverCount: z.number()
    .int('Cantidad salidas debe ser entero')
    .min(0)
    .optional(),
  
  absenceDaysTotal: z.number()
    .int('Días ausencia debe ser entero')
    .min(0)
    .optional(),
  
  workingDaysTotal: z.number()
    .int('Días hábiles debe ser entero')
    .min(0)
    .optional(),
  
  overtimeEmployeeCount: z.number()
    .int('Cantidad empleados debe ser entero')
    .min(0)
    .optional(),
  
  // Fase 1.5 opcional
  turnoverRegrettableRate: z.number()
    .min(0)
    .max(100)
    .optional(),
  
  turnoverRegrettableCount: z.number()
    .int()
    .min(0)
    .optional(),

  // Fase 2: Métricas de Desempeño
  performanceScore: z.number()
    .min(0, 'Score desempeño mínimo es 0')
    .max(100, 'Score desempeño máximo es 100')
    .optional()
    .nullable(),

  goalsAchievedRate: z.number()
    .min(0, '% metas mínimo es 0')
    .max(100, '% metas máximo es 100')
    .optional()
    .nullable(),

  notes: z.string().max(500, 'Notas muy largas').optional()
}).refine(
  (data) => {
    // Al menos un KPI debe estar presente
    return data.turnoverRate !== undefined ||
           data.absenceRate !== undefined ||
           data.issueCount !== undefined ||
           data.overtimeHoursTotal !== undefined ||
           data.overtimeHoursAvg !== undefined;
  },
  {
    message: 'Debe proporcionar al menos un KPI (rotación, ausentismo, denuncias, o horas extras)'
  }
).refine(
  (data) => {
    // Si hay overtimeHoursAvg, validar que sea consistente con total
    if (data.overtimeHoursTotal && data.overtimeHoursAvg && data.headcountAvg) {
      const calculatedAvg = data.overtimeHoursTotal / data.headcountAvg;
      const diff = Math.abs(calculatedAvg - data.overtimeHoursAvg);
      return diff < 1; // Permitir diferencia mínima por redondeo
    }
    return true;
  },
  {
    message: 'Promedio horas extras inconsistente con total y dotación'
  }
);

// ==========================================
// SCHEMA BATCH UPLOAD (array)
// ==========================================
export const departmentMetricsBatchSchema = z.object({
  metrics: z.array(departmentMetricsUploadSchema)
    .min(1, 'Debe proporcionar al menos un registro')
    .max(100, 'Máximo 100 registros por carga')
});

// ==========================================
// SCHEMA QUERY PARAMS
// ==========================================
export const departmentMetricsQuerySchema = z.object({
  departmentId: z.string().cuid().optional(),
  periodType: PeriodTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  dataQuality: DataQualityEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// ==========================================
// TYPESCRIPT TYPES
// ==========================================
export type PeriodType = z.infer<typeof PeriodTypeEnum>;
export type UploadMethod = z.infer<typeof UploadMethodEnum>;
export type DataQuality = z.infer<typeof DataQualityEnum>;

export type DepartmentMetricsUpload = z.infer<typeof departmentMetricsUploadSchema>;
export type DepartmentMetricsBatch = z.infer<typeof departmentMetricsBatchSchema>;
export type DepartmentMetricsQuery = z.infer<typeof departmentMetricsQuerySchema>;

// ==========================================
// HELPER: Parsear período a fechas
// ==========================================
export function parsePeriod(period: string): {
  start: Date;
  end: Date;
  type: PeriodType;
} {
  const year = parseInt(period.substring(0, 4));
  
  // Trimestral: 2025-Q1
  if (period.includes('-Q')) {
    const quarter = parseInt(period.substring(6));
    const type: PeriodType = 'quarterly';
    const start = new Date(year, (quarter - 1) * 3, 1);
    const end = new Date(year, quarter * 3, 0, 23, 59, 59);
    return { start, end, type };
  }
  
  // Mensual: 2025-01
  if (period.length === 7 && period.includes('-')) {
    const month = parseInt(period.substring(5)) - 1;
    const type: PeriodType = 'monthly';
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return { start, end, type };
  }
  
  // Semestral: 2025-H1
  if (period.includes('-H')) {
    const semester = parseInt(period.substring(6));
    const type: PeriodType = 'semi-annual';
    const start = new Date(year, (semester - 1) * 6, 1);
    const end = new Date(year, semester * 6, 0, 23, 59, 59);
    return { start, end, type };
  }
  
  // Anual: 2025
  const type: PeriodType = 'annual';
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  return { start, end, type };
}

// ==========================================
// HELPER: Validar consistencia de datos
// ==========================================
export function validateMetricsConsistency(
  metrics: DepartmentMetricsUpload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar turnover rate vs count
  if (metrics.turnoverRate && metrics.turnoverCount && metrics.headcountAvg) {
    const calculatedRate = (metrics.turnoverCount / metrics.headcountAvg) * 100;
    const diff = Math.abs(calculatedRate - metrics.turnoverRate);
    if (diff > 5) { // 5% tolerancia
      errors.push(
        `Rotación inconsistente: ${metrics.turnoverRate}% reportado vs ${calculatedRate.toFixed(1)}% calculado`
      );
    }
  }
  
  // Validar absence rate vs days
  if (metrics.absenceRate && metrics.absenceDaysTotal && metrics.workingDaysTotal) {
    const calculatedRate = (metrics.absenceDaysTotal / metrics.workingDaysTotal) * 100;
    const diff = Math.abs(calculatedRate - metrics.absenceRate);
    if (diff > 5) {
      errors.push(
        `Ausentismo inconsistente: ${metrics.absenceRate}% reportado vs ${calculatedRate.toFixed(1)}% calculado`
      );
    }
  }
  
  // Validar overtime consistency
  if (metrics.overtimeHoursTotal && metrics.overtimeHoursAvg && metrics.headcountAvg) {
    const calculatedAvg = metrics.overtimeHoursTotal / metrics.headcountAvg;
    const diff = Math.abs(calculatedAvg - metrics.overtimeHoursAvg);
    if (diff > 2) { // 2h tolerancia
      errors.push(
        `Horas extras inconsistentes: ${metrics.overtimeHoursAvg}h promedio reportado vs ${calculatedAvg.toFixed(1)}h calculado`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}