// src/app/dashboard/compliance/lib/format.ts
// Helpers de presentación del dashboard Compliance.

import type { ISARiskLevel } from '@/lib/services/compliance/ISAService';

export function formatPercent(value: number, digits = 0): string {
  return `${Math.round(value * 10 ** digits) / 10 ** digits}%`;
}

export function formatIntensityPercent(intensity0to1: number): string {
  const pct = Math.max(0, Math.min(100, Math.round(intensity0to1 * 100)));
  return `${pct}%`;
}

export function formatScore(value: number | null, digits = 1): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(digits);
}

/** ISA 0-100 como entero. Retorna "—" si null. */
export function formatISA(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}`;
}

/** Delta numérico con signo explícito (+3, -5). "—" si null. */
export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const rounded = Math.round(value);
  if (rounded === 0) return '0';
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatPeriodLabel(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  const sem = end.getMonth() + 1 <= 6 ? 1 : 2;
  return `Semestre ${sem} ${end.getFullYear()}`;
}

export function formatSLACountdown(dueDate: string | Date | null): string {
  if (!dueDate) return '';
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (isNaN(due.getTime())) return '';
  const diffMs = due.getTime() - Date.now();
  if (diffMs < 0) return 'Vencido';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Menos de 1 hora';
  if (hours < 24) return `${hours} horas restantes`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 día restante' : `${days} días restantes`;
}

// ═══════════════════════════════════════════════════════════════════
// Heatmap — celdas SIN semáforo (4 intensidades del mismo tono)
// ═══════════════════════════════════════════════════════════════════

/**
 * Color de celda para heatmap dimensión × depto.
 * NO es un semáforo: es una escala de intensidad cyan → amber (problema).
 * Retorna clases Tailwind directas.
 */
export function cellColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'bg-slate-900/20 text-slate-700'; // privacidad / sin dato
  }
  if (score >= 4.0) return 'bg-cyan-950/30 text-cyan-400';
  if (score >= 3.0) return 'bg-slate-800/60 text-slate-300';
  if (score >= 2.0) return 'bg-amber-950/40 text-amber-400';
  return 'bg-amber-900/60 text-amber-300 font-medium';
}

// ═══════════════════════════════════════════════════════════════════
// Selectors
// ═══════════════════════════════════════════════════════════════════

/** Depto con mayor riesgo — menor ISA primero, desempate por menor safetyScore. */
export function pickLowestISA<
  T extends { isaScore: number | null; safetyScore: number }
>(departments: T[]): T | null {
  if (departments.length === 0) return null;
  const ordered = [...departments].sort((a, b) => {
    const aIsa = a.isaScore ?? Number.POSITIVE_INFINITY;
    const bIsa = b.isaScore ?? Number.POSITIVE_INFINITY;
    if (aIsa !== bIsa) return aIsa - bIsa;
    return a.safetyScore - b.safetyScore;
  });
  return ordered[0];
}

/**
 * Legacy — ordena por riskLevel nominal (critical > risk > safe) y desempata
 * por safetyScore ascendente. Se conserva mientras el hook usa este patrón.
 */
export function pickHighestRisk<
  T extends { riskLevel: 'safe' | 'risk' | 'critical'; safetyScore: number }
>(departments: T[]): T | null {
  if (departments.length === 0) return null;
  const ordered = [...departments].sort((a, b) => {
    const rank = (r: string) => (r === 'critical' ? 0 : r === 'risk' ? 1 : 2);
    const rankDiff = rank(a.riskLevel) - rank(b.riskLevel);
    if (rankDiff !== 0) return rankDiff;
    return a.safetyScore - b.safetyScore;
  });
  return ordered[0];
}

/** Mapea ISARiskLevel → riskLevel legacy para componentes que aún usan safe/risk/critical. */
export function isaLevelToLegacyRisk(
  level: ISARiskLevel
): 'safe' | 'risk' | 'critical' {
  if (level === 'saludable' || level === 'observacion') return 'safe';
  if (level === 'riesgo') return 'risk';
  return 'critical';
}
