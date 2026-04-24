// src/app/dashboard/compliance/lib/labels.ts
// Catálogos ejecutivos del dashboard Compliance. Traducen identifiers técnicos
// del backend a lenguaje legible para el CEO (gerente a gerente, sin jerga RRHH).
//
// Vocabulario prohibido en secciones 1-7 y 9 (solo SectionAlertas permite legal):
//   "acoso", "hostigamiento", "denuncia", "Ley Karin"
//   "seguridad psicológica", "psicosocial"
//   "Safety Score", "EXO", "LLM", "convergencia", "ISA"
//   "se recomienda", "deberías", "es necesario"

import type {
  ComplianceSectionId,
  PatronNombre,
  OrigenPercibido,
  ComplianceAlertType,
} from '@/types/compliance';
import type { ISARiskLevel } from '@/lib/services/compliance/ISAService';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  BarChart3,
  Sparkles,
  GitMerge,
  Wrench,
  Bell,
  ArrowUpRight,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// Rail sections (orden canónico — 9 secciones)
// ═══════════════════════════════════════════════════════════════════

export interface ComplianceSectionMeta {
  id: ComplianceSectionId;
  railLabel: string;
  icon: LucideIcon;
  nextLabel: string | null;
}

export const COMPLIANCE_SECTIONS: readonly ComplianceSectionMeta[] = [
  { id: 'sintesis',     railLabel: 'Síntesis',          icon: LayoutDashboard, nextLabel: 'Por departamento' },
  { id: 'ancla',        railLabel: 'Por departamento',  icon: Building2,       nextLabel: 'Vista global' },
  { id: 'heatmap',      railLabel: 'Vista global',      icon: Grid3X3,         nextLabel: 'Dimensiones' },
  { id: 'dimensiones',  railLabel: 'Dimensiones',       icon: BarChart3,       nextLabel: 'Patrones' },
  { id: 'patrones',     railLabel: 'Patrones IA',       icon: Sparkles,        nextLabel: 'Señales cruzadas' },
  { id: 'convergencia', railLabel: 'Señales cruzadas',  icon: GitMerge,        nextLabel: 'Plan de acción' },
  { id: 'simulador',    railLabel: 'Plan de acción',    icon: Wrench,          nextLabel: 'Alertas' },
  { id: 'alertas',      railLabel: 'Alertas',           icon: Bell,            nextLabel: 'Cierre' },
  { id: 'cierre',       railLabel: 'Cierre',            icon: ArrowUpRight,    nextLabel: null },
] as const;

export const SECTION_INDEX: Record<ComplianceSectionId, number> = COMPLIANCE_SECTIONS.reduce(
  (acc, s, i) => ({ ...acc, [s.id]: i }),
  {} as Record<ComplianceSectionId, number>
);

// ═══════════════════════════════════════════════════════════════════
// ISA — Re-export del servicio backend + labels ejecutivos
// ═══════════════════════════════════════════════════════════════════

export { ISA_LABELS } from '@/lib/services/compliance/ISAService';
export type { ISARiskLevel } from '@/lib/services/compliance/ISAService';

// ═══════════════════════════════════════════════════════════════════
// Dimensiones (P2-P8) — labels ejecutivos, NUNCA "P2", "P3", etc.
// ═══════════════════════════════════════════════════════════════════

export const DIMENSION_LABELS: Record<string, string> = {
  P2_seguridad:       'Lo que el equipo cree que pasaría si habla',
  P3_disenso:         'Qué ocurre cuando alguien no está de acuerdo',
  P4_microagresiones: 'Cómo se describe el trato cotidiano',
  P5_equidad:         'Cómo se percibe la asignación de tareas',
  P7_liderazgo:       'Calidad del liderazgo directo',
  P8_agotamiento:     'Nivel de desgaste relacional',
};

/** Labels cortos para cabeceras de heatmap (columna estrecha). */
export const DIMENSION_SHORT: Record<string, string> = {
  P2_seguridad:       'Habla',
  P3_disenso:         'Disenso',
  P4_microagresiones: 'Trato',
  P5_equidad:         'Equidad',
  P7_liderazgo:       'Liderazgo',
  P8_agotamiento:     'Desgaste',
};

/** Orden canónico de dimensiones (para grids, tablas, heatmap). */
export const DIMENSION_ORDER = [
  'P2_seguridad',
  'P3_disenso',
  'P4_microagresiones',
  'P5_equidad',
  'P7_liderazgo',
  'P8_agotamiento',
] as const;

export type DimensionKey = (typeof DIMENSION_ORDER)[number];

// ═══════════════════════════════════════════════════════════════════
// Patrones LLM — labels ejecutivos, NUNCA nombres de código
// ═══════════════════════════════════════════════════════════════════

export const PATRON_LABELS: Record<PatronNombre, string> = {
  silencio_organizacional: 'Retención de información',
  hostilidad_normalizada:  'Trato presentado como normal',
  favoritismo_implicito:   'Percepción de inequidad',
  resignacion_aprendida:   'Desesperanza sobre el cambio',
  miedo_represalias:       'Temor a consecuencias de hablar',
};

export const ORIGEN_LABELS: Record<OrigenPercibido, string> = {
  vertical_descendente: 'desde la jefatura directa',
  horizontal_pares:     'entre compañeros del equipo',
  sistemico_procesos:   'en la estructura y los procesos',
  indeterminado:        'origen no determinado',
};

// ═══════════════════════════════════════════════════════════════════
// Alertas — labels ejecutivos (vocabulario legal permitido aquí)
// ═══════════════════════════════════════════════════════════════════

export const ALERTA_LABELS: Record<ComplianceAlertType, string> = {
  riesgo_convergente:      'Señales coincidentes',
  liderazgo_toxico:        'Patrón de liderazgo',
  deterioro_sostenido:     'Deterioro prolongado',
  silencio_organizacional: 'Retención de información detectada',
  senal_ignorada:          'Señal previa no gestionada',
};

// ═══════════════════════════════════════════════════════════════════
// Nodos del Acto Ancla — degradación elegante si producto no contratado
// ═══════════════════════════════════════════════════════════════════

export const NODO_LABELS: Record<string, string> = {
  ambiente_sano: 'Ambiente',
  exit:          'Salidas',
  onboarding:    'Ingresos',
  pulso:         'Clima',
};

export const NODO_REQUIRES: Record<string, string> = {
  exit:       'Requiere Exit Intelligence',
  onboarding: 'Requiere Onboarding Journey',
  pulso:      'Requiere Pulso Express',
};

// Legacy aliases (mantenidos para compat temporal en hooks antiguos)
export const SOURCE_NODE_LABELS = NODO_LABELS;
export const SOURCE_REQUIRES = NODO_REQUIRES;

// ═══════════════════════════════════════════════════════════════════
// Tesla Line — color por sección
// ═══════════════════════════════════════════════════════════════════

/** Color canónico por sección. `null` = sin Tesla Line (Cierre) o dinámico (Síntesis). */
export const TESLA_BY_SECTION: Record<ComplianceSectionId, string | null> = {
  sintesis:     null,       // dinámico según ISA riskLevel → TESLA_SINTESIS
  ancla:        '#22D3EE',  // cyan
  heatmap:      '#64748B',  // slate — descriptiva, no juicio
  dimensiones:  '#22D3EE',  // cyan
  patrones:     '#A78BFA',  // purple — única sección IA
  convergencia: '#22D3EE',  // cyan
  simulador:    '#22D3EE',  // cyan
  alertas:      '#F59E0B',  // amber — única sección urgencia legal
  cierre:       null,       // SIN Tesla Line (cierre es pausa narrativa)
};

/** Tesla Line de Síntesis según nivel de riesgo ISA. */
export const TESLA_SINTESIS: Record<ISARiskLevel, string> = {
  saludable:   '#22D3EE', // cyan
  observacion: '#64748B', // slate
  riesgo:      '#F59E0B', // amber
  critico:     '#F59E0B', // amber (no rojo — intensidad, no semáforo)
};

// Paleta de referencia (fijos que usan componentes)
export const TESLA_COLOR_CYAN = '#22D3EE';
export const TESLA_COLOR_PURPLE = '#A78BFA';
export const TESLA_COLOR_AMBER = '#F59E0B';
export const TESLA_COLOR_SLATE = '#64748B';
