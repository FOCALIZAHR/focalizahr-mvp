// src/lib/utils/climaFocusFilter.ts
// EX Clima Gate 1 (MAESTRO §1D): filtro de seguimiento focalizado.
//
// EXCLUSIVO de campañas de seguimiento de Experiencia Full — solo actúa
// cuando Campaign.driverFocusByDepartment está poblado Y el participante
// tiene departmentId. Pulso Express nunca puebla el campo → nunca filtra.
//
// Regla: el departamento con foco recibe TODAS las preguntas de sus drivers
// (low + high) + TODAS las de engagement_index + TODAS las de texto_libre.
// No se selecciona subset dentro de un driver.
// Fallback seguro: sin foco para el depto (o campo null) → todas las preguntas.

/** Categorías que SIEMPRE se muestran, independiente del foco */
const ALWAYS_INCLUDED_CATEGORIES = ['engagement_index', 'texto_libre'] as const;

export interface DepartmentFocus {
  low?: string[];
  high?: string[];
  thresholds?: { low: number; high: number };
}

export type DriverFocusByDepartment = Record<string, DepartmentFocus>;

interface QuestionWithCategory {
  category: string;
}

/**
 * Filtra las preguntas de una campaña de seguimiento según el foco del
 * departamento del participante. Función pura — sin I/O, testeable.
 */
export function filterQuestionsByDriverFocus<Q extends QuestionWithCategory>(
  questions: Q[],
  driverFocusByDepartment: unknown,
  departmentId: string | null | undefined
): Q[] {
  if (!driverFocusByDepartment || typeof driverFocusByDepartment !== 'object' || Array.isArray(driverFocusByDepartment)) {
    return questions;
  }
  if (!departmentId) {
    return questions;
  }

  const focusMap = driverFocusByDepartment as DriverFocusByDepartment;
  const focus = focusMap[departmentId];
  if (!focus || typeof focus !== 'object') {
    // Depto no está en el mapa → recibe todas (fallback seguro)
    return questions;
  }

  const allowedDrivers = [...(focus.low ?? []), ...(focus.high ?? [])];
  if (allowedDrivers.length === 0) {
    return questions;
  }

  return questions.filter(
    (q) =>
      (ALWAYS_INCLUDED_CATEGORIES as readonly string[]).includes(q.category) ||
      allowedDrivers.includes(q.category)
  );
}
