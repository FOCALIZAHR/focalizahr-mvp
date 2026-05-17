// src/app/dashboard/compliance/lib/format.ts
// Helpers de presentación del dashboard Compliance.

import type { ISARiskLevel } from '@/lib/services/compliance/ISAService';
import {
  classifyDimensionLevel,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';

/**
 * Labels ejecutivos del nivel de una dimensión — capitalizados con tilde
 * para render directo al CEO. Coherente con ISA_NARRATIVES badges.
 */
export const LEVEL_LABELS: Record<ComplianceDimensionLevel, string> = {
  sano: 'Sano',
  atencion: 'Atención',
  riesgo: 'Riesgo',
  critico: 'Crítico',
};

/**
 * Convierte un rawScore (1-5) a sus 3 piezas listas para render:
 *   - display (0-100, entero)
 *   - level   (canónico 4 valores, o null si sin dato)
 *   - label   (ejecutivo capitalizado, o '—' si sin dato)
 *
 * Single source of truth para el formato canónico "N · Label" que el CEO
 * ve en gauges, narrativas y nodos. Usar en cualquier superficie donde el
 * score absoluto se renderiza acompañado de su clasificación.
 *
 * Deltas (vs ciclo anterior, brechas, deltas vs org) NO usan este helper —
 * un delta es magnitud, no nivel.
 */
export function classifyForDisplay(rawScore: number | null | undefined): {
  display: number | null;
  level: ComplianceDimensionLevel | null;
  label: string;
} {
  if (rawScore === null || rawScore === undefined || Number.isNaN(rawScore)) {
    return { display: null, level: null, label: '—' };
  }
  const display = displayScore(rawScore);
  const level = classifyDimensionLevel(rawScore);
  return { display, level, label: LEVEL_LABELS[level] };
}

/**
 * Convierte un score backend (escala 0-5) al display score (escala 0-100).
 * Mapping: 0→0, 1→20, 2→40, 3→60, 4→80, 5→100. Resultado clampeado a [0, 100].
 *
 * Fórmula canónica del dashboard Compliance (alineada con ISAService:
 * safetyScore/5*100 = raw*20). Equivalencias con classifyDimensionLevel:
 *   raw ≥ 4.0 → display ≥ 80 → sano
 *   raw ≥ 3.0 → display ≥ 60 → atencion
 *   raw ≥ 2.0 → display ≥ 40 → riesgo
 *   raw < 2.0 → display < 40 → critico
 *
 * Devuelve null si el input es null/undefined — los componentes deciden
 * cómo renderizar el caso "sin dato" (nunca convertir null en 0).
 */
export function displayScore(rawScore: number | null | undefined): number | null {
  if (rawScore === null || rawScore === undefined) return null;
  if (Number.isNaN(rawScore)) return null;
  const value = Math.round(rawScore * 20);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Convierte un delta (diferencia entre dos raw scores 0-5) al delta display.
 * `displayDelta(a - b) = displayScore(a) - displayScore(b) = (a - b) * 20`.
 * Usado para render de "vs ciclo anterior", brechas de género, etc.
 */
export function displayDelta(rawDelta: number | null | undefined): number | null {
  if (rawDelta === null || rawDelta === undefined) return null;
  if (Number.isNaN(rawDelta)) return null;
  return Math.round(rawDelta * 20);
}

export function formatPercent(value: number, digits = 0): string {
  return `${Math.round(value * 10 ** digits) / 10 ** digits}%`;
}

export function formatIntensityPercent(intensity0to1: number): string {
  const pct = Math.max(0, Math.min(100, Math.round(intensity0to1 * 100)));
  return `${pct}%`;
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

/** Mapea ISARiskLevel → riskLevel del IndicatorGauge (paleta anti-semáforo
 *  Decisión #1 Plan de Cierre AS v1.0): cyan / slate / amber / amber-glow. */
export function isaLevelToGaugeColor(
  level: ISARiskLevel
): 'safe' | 'observation' | 'risk' | 'critical' {
  if (level === 'saludable') return 'safe';
  if (level === 'observacion') return 'observation';
  if (level === 'riesgo') return 'risk';
  return 'critical';
}
