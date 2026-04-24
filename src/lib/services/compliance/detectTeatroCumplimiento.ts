// src/lib/services/compliance/detectTeatroCumplimiento.ts
// Regla D9 del TASK_COMPLIANCE_AMBIENTE_SANO_IMPLEMENTATION:
// cuando las métricas numéricas dicen "todo bien" pero las respuestas proyectivas
// revelan riesgo alto, el departamento responde bien por miedo — no por realidad.
//
// Se evalúa DESPUÉS del LLM, en backend. No es una decisión del modelo.

import { PatronDetectado } from './complianceTypes';

const SAFETY_SCORE_THRESHOLD = 4.0;
const MAX_INTENSIDAD_THRESHOLD = 0.6;

export function detectTeatroCumplimiento(
  safetyScore: number,
  patrones: PatronDetectado[]
): boolean {
  if (patrones.length === 0) return false;
  const maxIntensidad = Math.max(...patrones.map((p) => p.intensidad));
  return safetyScore >= SAFETY_SCORE_THRESHOLD && maxIntensidad >= MAX_INTENSIDAD_THRESHOLD;
}
