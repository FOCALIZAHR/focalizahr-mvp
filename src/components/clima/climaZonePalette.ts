// src/components/clima/climaZonePalette.ts
// Paleta anti-semáforo de Clima — CLONADA de compliance/IndicatorGauge
// (Decisión #1 AS v1.0). NO es una paleta nueva: mapea las 4 riskZone de Clima
// al mismo esquema de 4 niveles de riesgo ya en producción.
//
//   safe        → cyan   (#22D3EE)   ← verde
//   observation → slate  (#94A3B8)   ← amarilla
//   risk        → ámbar  (#F59E0B)   ← naranja
//   critical    → ámbar  (#F59E0B)   ← roja   (mismo color que risk, MÁS glow —
//                                              nunca rojo)

import type { RiskZone } from '@/types/clima';

export type RiskLevel = 'safe' | 'observation' | 'risk' | 'critical';

export const LEVEL_BY_ZONE: Record<RiskZone, RiskLevel> = {
  verde: 'safe',
  amarilla: 'observation',
  naranja: 'risk',
  roja: 'critical',
};

// Valores EXACTOS de IndicatorGauge.tsx (no modificar sin actualizar la fuente).
export const COLORS_BY_LEVEL: Record<RiskLevel, string> = {
  safe: '#22D3EE',
  observation: '#94A3B8',
  risk: '#F59E0B',
  critical: '#F59E0B',
};

export const GLOW_BY_LEVEL: Record<RiskLevel, string> = {
  safe: '88',
  observation: '66',
  risk: '88',
  critical: 'cc',
};

export const BACKGROUND_GLOW_OPACITY: Record<RiskLevel, number> = {
  safe: 0.2,
  observation: 0.1,
  risk: 0.2,
  critical: 0.32,
};

// Objetivo de favorabilidad (espeja CLIMA_TARGET_FAVORABILITY sellado en
// PulseEngine; duplicado client-safe para no bundlear el motor en el cliente).
export const CLIMA_TARGET_FAVORABILITY = 75;

// Etiquetas de banda canónicas (contrato "N · Label", alineadas a ISA).
export const ZONE_LABEL: Record<RiskZone, string> = {
  verde: 'Saludable',
  amarilla: 'En observación',
  naranja: 'En riesgo',
  roja: 'Crítico',
};

/** Color anti-semáforo de una zona (slate neutro si no hay zona). */
export function zoneColor(zone: RiskZone | null): string {
  return zone ? COLORS_BY_LEVEL[LEVEL_BY_ZONE[zone]] : '#64748B';
}

export function zoneLevel(zone: RiskZone | null): RiskLevel | null {
  return zone ? LEVEL_BY_ZONE[zone] : null;
}

/** riskZone a partir de una favorabilidad 0-100 (umbrales sellados). */
export function zoneFromFavorability(v: number): RiskZone {
  if (v >= 75) return 'verde';
  if (v >= 65) return 'amarilla';
  if (v >= 60) return 'naranja';
  return 'roja';
}
