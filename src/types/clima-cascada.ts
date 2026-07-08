// src/types/clima-cascada.ts
// ════════════════════════════════════════════════════════════════════════════
// Tipos de la Cascada Ejecutiva de Clima (Gate 4.5a).
// Patrón estructural clonado de types/ambiente-cascada.ts, pero con modelo de
// salida propio: Actos DINÁMICOS (semilla §9 — reemplaza "4 Actos" fijos). El
// motor decide cuántos y cuáles Actos mostrar (1-2 en clima sano, 4-5 en crisis)
// y cuál es el dominante que cierra la Síntesis.
//
// Copy: TODO verbatim de CASCADA_CLIMA_CONTENIDO.md (Principio 4). El motor solo
// interpola placeholders {n}/{gerencia}/{dimension}/{total} y ensambla el orden.
// ════════════════════════════════════════════════════════════════════════════

import type { ClimaResultsResponse, ClimaCrossSignal } from '@/types/clima';

/** 7 tipos de diagnóstico de clima. Modelo de 2 capas: el NIVEL absoluto
 *  (orgFav vs 75) manda; el percentil solo describe la distribución.
 *  OBSERVACION_SIN_FOCO cierra el hueco "org bajo el objetivo pero difuso"
 *  (análogo al tipo homónimo de Ambiente Sano). */
export type ClimaDiagnosticType =
  | 'TEATRO_GENERALIZADO'
  | 'HOTSPOT_CONCENTRADO'
  | 'OBSERVACION_SIN_FOCO'
  | 'DRIVER_SISTEMICO'
  | 'MOMENTUM_NEGATIVO'
  | 'BIEN_CON_FOCOS'
  | 'SALUDABLE';

/** Color del ActSeparator / hero number (clon del primitivo shared.tsx). */
export type ActColor = 'amber' | 'purple' | 'cyan' | 'red';

/** Un Acto de la cascada — la unidad que ClimaCascada renderiza. Todo el texto
 *  ya viene interpolado y con el fragmento cross-signal insertado (o no). */
export interface ClimaAct {
  type: ClimaDiagnosticType;
  actSeparator: { label: string; color: ActColor };
  /** Ancla numérica del acto (doc 2 "Ancla: `{...}` — *caption*"). */
  anchor: { value: string; caption: string };
  /** Párrafos de narrativa base + fragmento cross-signal (si hay dato). */
  narrative: string[];
  /** Bloque de hipótesis "O" (párrafo aparte, tono más suave). */
  hypotheses: string;
  coachingTip: string;
  ctaLabel: string;
  /** Color del hero number por gravedad del tipo. */
  heroColor: ActColor;
}

/** Síntesis de cierre — bloque McKinsey del tipo dominante (doc 2 "Síntesis"). */
export interface ClimaSynthesis {
  diagnosticType: ClimaDiagnosticType;
  classification: string;
  implication: string;
  path: string;
  accountability: string;
}

/** Portada / gancho (doc 2 §0.1) — variante por zona de orgFavorability. */
export interface ClimaPortadaContent {
  hook: string;
  ctaLabel: string;
}

/** Un nodo del Acto Ancla (doc 2 §0.2) para alimentar AnclaInteligente. */
export interface ClimaAnclaNode {
  value: number;
  label: string;
  narrative: string;
  tooltip?: string;
  suffix?: string;
}

/** Salida completa del ClimaSynthesisEngine — todo lo que la secuencia
 *  Portada→Ancla→Cascada→Síntesis necesita, derivado read-time. */
export interface ClimaSynthesisResult {
  portada: ClimaPortadaContent;
  /** Score + label + nodos del Acto Ancla (Tipo 2 — Masa y Gravedad). */
  ancla: { score: number | null; scoreLabel: string; nodes: ClimaAnclaNode[] };
  /** Actos disparados, ordenados por prioridad (1-5). Vacío nunca: siempre hay
   *  al menos SALUDABLE / BIEN_CON_FOCOS. */
  acts: ClimaAct[];
  dominant: ClimaDiagnosticType;
  synthesis: ClimaSynthesis;
  /** Audit-only, no UI. */
  trigger: string;
}

/** Input del motor — la respuesta read-time ya existente (Gate 4), extendida
 *  con crossSignals por depto (Gate 4.5a). */
export type ClimaSynthesisInput = ClimaResultsResponse;

export type { ClimaCrossSignal };
