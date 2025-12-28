// ═══════════════════════════════════════════════════════════════════════════════
// EXIT ALERT CONFIG - SINGLE SOURCE OF TRUTH (UI/Presentación)
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: /src/config/exitAlertConfig.ts
// Propósito: Configuración centralizada de CÓMO se presenta cada tipo de alerta
// Separación: /src/types/exit.ts define QUÉ ES, este archivo define CÓMO SE VE
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  Scale, 
  Skull, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Link2, 
  BrainCircuit,
  Clock,
  type LucideIcon 
} from 'lucide-react';

// Importar tipos base desde types/exit.ts
import { EXIT_ALERT_TYPES } from '@/types/exit';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/** Modos de visualización del gauge */
export type GaugeDisplayMode = 'gauge' | 'countdown' | 'hidden';

/** Tipos de score para formato correcto */
export type GaugeScoreType = 'scale_5' | 'scale_100' | 'nps' | 'days' | 'none';

/** Tipos de trigger para evidencia metodológica */
export type EvidenceTriggerType = 'question' | 'factors' | 'pattern' | 'correlation' | 'protocol';

/** Colores del sistema */
export type AlertColor = 'red' | 'amber' | 'purple' | 'cyan' | 'slate';

/** Configuración del header (compartida entre componentes) */
export interface HeaderConfig {
  icon: LucideIcon;
  iconColor: AlertColor;
  title: string;
  subtitle: string;
  contextLabel: string;
}

/** Configuración de RevelationCard */
export interface RevelationConfig {
  sourceLabel: string;
  showBlockquote: boolean;
  scoreLabel: string;
  showLegalNote: boolean;
  legalNoteTitle: string;
  legalNoteText: string;
  emphasisWords: string[];
}

/** Configuración de EISScoreGauge */
export interface GaugeConfig {
  displayMode: GaugeDisplayMode;
  title: string;
  scoreType: GaugeScoreType;
  showSecondaryEIS: boolean;
  thresholdLabel: string;
  thresholdValue: number;
  thresholdDirection: 'below' | 'above';
}

/** Configuración de Evidencia Metodológica */
export interface EvidenceConfig {
  triggerLabel: string;
  triggerType: EvidenceTriggerType;
  sources: string[];
}

/** Configuración de BenchmarkCard */
export interface BenchmarkConfig {
  showBenchmark: boolean;
  emptyStateTitle: string;
  emptyStateMessage: string;
  comparisonLabel: string;
}

/** Configuración de UrgencyCard */
export interface UrgencyConfig {
  showMonetary: boolean;
  showSLA: boolean;
  showSeverity: boolean;
  monetaryLabel: string;
  slaLabel: string;
}

/** Configuración completa de un tipo de alerta */
export interface ExitAlertTypeConfig {
  // ─────────────────────────────────────────────────────────────────────────
  // IDENTIFICACIÓN
  // ─────────────────────────────────────────────────────────────────────────
  type: string;
  aliases: string[];
  
  // ─────────────────────────────────────────────────────────────────────────
  // UI GENERAL (usado en feeds, listas, badges)
  // ─────────────────────────────────────────────────────────────────────────
  label: string;
  icon: LucideIcon;
  color: AlertColor;
  priority: number;  // 0 = más urgente
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGURACIÓN POR COMPONENTE
  // ─────────────────────────────────────────────────────────────────────────
  header: HeaderConfig;
  revelation: RevelationConfig;
  gauge: GaugeConfig;
  evidence: EvidenceConfig;
  benchmark: BenchmarkConfig;
  urgency: UrgencyConfig;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIONES POR TIPO DE ALERTA
// ═══════════════════════════════════════════════════════════════════════════════

const LEY_KARIN_CONFIG: ExitAlertTypeConfig = {
  // Identificación
  type: 'ley_karin',
  aliases: ['ley_karin_indicios'],
  
  // UI General
  label: 'Indicios Ley Karin',
  icon: Scale,
  color: 'red',
  priority: 0,
  
  // Header
  header: {
    icon: BrainCircuit,
    iconColor: 'cyan',
    title: 'Inteligencia Predictiva',
    subtitle: 'detectó un indicio crítico',
    contextLabel: 'Monitoreo Continuo • Exit Compliance'
  },
  
  // RevelationCard
  revelation: {
    sourceLabel: 'Exit Survey • Confidencial',
    showBlockquote: true,
    scoreLabel: 'SEÑAL DETECTADA',
    showLegalNote: true,
    legalNoteTitle: 'Marco Legal',
    legalNoteText: 'Un indicio no implica responsabilidad. Es una señal que activa el deber de investigar preventivamente.',
    emphasisWords: ['NO', 'NUNCA', 'JAMÁS']
  },
  
  // EISScoreGauge
  gauge: {
    displayMode: 'gauge',
    title: 'Seguridad Psicológica',
    scoreType: 'scale_5',
    showSecondaryEIS: true,
    thresholdLabel: 'Umbral crítico',
    thresholdValue: 2.5,
    thresholdDirection: 'below'
  },
  
  // Evidencia
  evidence: {
    triggerLabel: 'Pregunta que activó esta alerta',
    triggerType: 'question',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Ley 21.643 (Ley Karin) - Chile 2024',
      'Fundamentación: Art. 489 Código del Trabajo'
    ]
  },
  
  // Benchmark
  benchmark: {
    showBenchmark: true,
    emptyStateTitle: 'Benchmark en Construcción',
    emptyStateMessage: 'FocalizaHR está recopilando datos del mercado chileno.',
    comparisonLabel: 'vs Mercado CL'
  },
  
  // Urgency
  urgency: {
    showMonetary: true,
    showSLA: true,
    showSeverity: true,
    monetaryLabel: 'en riesgo',
    slaLabel: 'para actuar'
  }
};

const TOXIC_EXIT_CONFIG: ExitAlertTypeConfig = {
  type: 'toxic_exit',
  aliases: ['toxic_exit_detected'],
  
  label: 'Exit Tóxico',
  icon: Skull,
  color: 'amber',
  priority: 1,
  
  header: {
    icon: BrainCircuit,
    iconColor: 'cyan',
    title: 'Inteligencia Predictiva',
    subtitle: 'detectó una salida tóxica',
    contextLabel: 'Monitoreo Continuo • Exit Intelligence'
  },
  
  revelation: {
    sourceLabel: 'Exit Intelligence Score',
    showBlockquote: false,
    scoreLabel: 'EIS DETECTADO',
    showLegalNote: false,
    legalNoteTitle: 'Contexto',
    legalNoteText: 'Un EIS bajo indica experiencia laboral negativa con riesgo de contagio al equipo actual.',
    emphasisWords: ['TÓXICO', 'CRÍTICO', 'NO']
  },
  
  gauge: {
    displayMode: 'gauge',
    title: 'Exit Intelligence Score',
    scoreType: 'scale_100',
    showSecondaryEIS: false,
    thresholdLabel: 'Umbral tóxico',
    thresholdValue: 25,
    thresholdDirection: 'below'
  },
  
  evidence: {
    triggerLabel: 'Factores analizados en el Exit Intelligence Score',
    triggerType: 'factors',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Algoritmo propietario v2.0',
      'Fundamentación: SHRM Human Capital Benchmarking Report 2024',
      'Fundamentación: Gallup State of the Workplace 2024'
    ]
  },
  
  benchmark: {
    showBenchmark: true,
    emptyStateTitle: 'Benchmark en Construcción',
    emptyStateMessage: 'Pronto podrás compararte con tu industria.',
    comparisonLabel: 'vs Industria'
  },
  
  urgency: {
    showMonetary: true,
    showSLA: true,
    showSeverity: true,
    monetaryLabel: 'costo estimado',
    slaLabel: 'para intervenir'
  }
};

const NPS_CRITICAL_CONFIG: ExitAlertTypeConfig = {
  type: 'nps_critico',
  aliases: ['nps_critical'],
  
  label: 'NPS Crítico',
  icon: TrendingDown,
  color: 'amber',
  priority: 2,
  
  header: {
    icon: TrendingDown,
    iconColor: 'amber',
    title: 'Inteligencia Predictiva',
    subtitle: 'detectó NPS crítico',
    contextLabel: 'Monitoreo Continuo • Employee Experience'
  },
  
  revelation: {
    sourceLabel: 'Exit Survey • eNPS',
    showBlockquote: true,
    scoreLabel: 'eNPS DETECTADO',
    showLegalNote: false,
    legalNoteTitle: 'Contexto',
    legalNoteText: 'Un eNPS negativo indica que el colaborador no recomendaría la empresa como lugar de trabajo.',
    emphasisWords: ['NO', 'NUNCA', 'DETRACTORES']
  },
  
  gauge: {
    displayMode: 'gauge',
    title: 'Employee Net Promoter Score',
    scoreType: 'nps',
    showSecondaryEIS: true,
    thresholdLabel: 'Umbral crítico',
    thresholdValue: -20,
    thresholdDirection: 'below'
  },
  
  evidence: {
    triggerLabel: 'Pregunta que activó esta alerta',
    triggerType: 'question',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Net Promoter System - Bain & Company',
      'Fundamentación: Reichheld, F. "The Ultimate Question 2.0"'
    ]
  },
  
  benchmark: {
    showBenchmark: true,
    emptyStateTitle: 'Benchmark NPS',
    emptyStateMessage: 'Comparando con promedios de la industria.',
    comparisonLabel: 'vs Benchmark'
  },
  
  urgency: {
    showMonetary: true,
    showSLA: true,
    showSeverity: true,
    monetaryLabel: 'impacto estimado',
    slaLabel: 'tendencia'
  }
};

const CONCENTRATED_FACTOR_CONFIG: ExitAlertTypeConfig = {
  type: 'concentrated_factor',
  aliases: ['liderazgo_concentracion', 'department_exit_pattern', 'department_pattern'],
  
  label: 'Patrón Sistémico',
  icon: Users,
  color: 'purple',
  priority: 3,
  
  header: {
    icon: Users,
    iconColor: 'purple',
    title: 'Inteligencia Predictiva',
    subtitle: 'confirmó un patrón sistémico',
    contextLabel: 'Análisis Agregado • Pattern Detection'
  },
  
  revelation: {
    sourceLabel: 'Análisis Agregado • 90 días',
    showBlockquote: false,
    scoreLabel: 'PATRÓN IDENTIFICADO',
    showLegalNote: false,
    legalNoteTitle: 'Contexto',
    legalNoteText: 'Un patrón confirmado indica problema sistémico que requiere intervención estructural.',
    emphasisWords: ['PATRÓN', 'CONFIRMADO', 'SISTÉMICO']
  },
  
  gauge: {
    displayMode: 'gauge',
    title: 'Factor Concentrado',
    scoreType: 'scale_5',
    showSecondaryEIS: true,
    thresholdLabel: 'Promedio factor',
    thresholdValue: 2.5,
    thresholdDirection: 'below'
  },
  
  evidence: {
    triggerLabel: 'Patrón estadístico detectado',
    triggerType: 'pattern',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Pattern Detection Engine',
      'Fundamentación: Análisis estadístico de tendencias (ventana 90 días)',
      'Fundamentación: Metodología de detección de anomalías FocalizaHR'
    ]
  },
  
  benchmark: {
    showBenchmark: false,
    emptyStateTitle: 'Análisis Interno',
    emptyStateMessage: 'Este patrón es específico de tu organización.',
    comparisonLabel: 'vs Histórico'
  },
  
  urgency: {
    showMonetary: true,
    showSLA: false,
    showSeverity: true,
    monetaryLabel: 'costo acumulado',
    slaLabel: ''
  }
};

const ONBOARDING_CORRELATION_CONFIG: ExitAlertTypeConfig = {
  type: 'onboarding_correlation',
  aliases: ['onboarding_exit_correlation'],
  
  label: 'Correlación Onboarding',
  icon: Link2,
  color: 'cyan',
  priority: 4,
  
  header: {
    icon: Link2,
    iconColor: 'cyan',
    title: 'Inteligencia Predictiva',
    subtitle: 'detectó correlación crítica',
    contextLabel: 'Correlación Cruzada • Onboarding ↔ Exit'
  },
  
  revelation: {
    sourceLabel: 'Análisis Correlación',
    showBlockquote: false,
    scoreLabel: 'CORRELACIÓN',
    showLegalNote: false,
    legalNoteTitle: 'Contexto',
    legalNoteText: 'Esta correlación indica que alertas de onboarding ignoradas predijeron esta salida.',
    emphasisWords: ['NO', 'IGNORADAS', 'ADVIRTIÓ']
  },
  
  gauge: {
    displayMode: 'gauge',
    title: 'Correlación Detectada',
    scoreType: 'scale_100',
    showSecondaryEIS: false,
    thresholdLabel: 'Alertas ignoradas',
    thresholdValue: 50,
    thresholdDirection: 'above'
  },
  
  evidence: {
    triggerLabel: 'Correlación detectada entre productos',
    triggerType: 'correlation',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Cross-Product Correlation Engine',
      'Fundamentación: Análisis longitudinal Onboarding → Exit',
      'Fundamentación: Metodología predictiva FocalizaHR Research'
    ]
  },
  
  benchmark: {
    showBenchmark: false,
    emptyStateTitle: 'Análisis Predictivo',
    emptyStateMessage: 'Correlación basada en datos históricos internos.',
    comparisonLabel: 'Predicción'
  },
  
  urgency: {
    showMonetary: true,
    showSLA: false,
    showSeverity: true,
    monetaryLabel: 'costo evitable',
    slaLabel: ''
  }
};

const DENUNCIA_FORMAL_CONFIG: ExitAlertTypeConfig = {
  type: 'denuncia_formal',
  aliases: [],
  
  label: 'Denuncia Formal',
  icon: AlertTriangle,
  color: 'red',
  priority: 0,
  
  header: {
    icon: AlertTriangle,
    iconColor: 'red',
    title: 'Protocolo Ley Karin Activado',
    subtitle: 'Denuncia formal registrada',
    contextLabel: 'Protocolo Activado • Ley 21.643'
  },
  
  revelation: {
    sourceLabel: 'Protocolo Legal • 30 días',
    showBlockquote: false,
    scoreLabel: 'PLAZO LEGAL',
    showLegalNote: true,
    legalNoteTitle: 'Obligaciones Activas',
    legalNoteText: 'Una denuncia formal activa obligaciones legales inmediatas con plazo máximo de 30 días.',
    emphasisWords: ['DENUNCIA', 'FORMAL', 'OBLIGACIÓN']
  },
  
  gauge: {
    displayMode: 'countdown',
    title: 'Protocolo Ley Karin',
    scoreType: 'days',
    showSecondaryEIS: false,
    thresholdLabel: 'Plazo legal',
    thresholdValue: 30,
    thresholdDirection: 'below'
  },
  
  evidence: {
    triggerLabel: 'Protocolo legal activado',
    triggerType: 'protocol',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Compliance Monitor',
      'Fundamentación: Ley 21.643 (Ley Karin) Art. 4, 5 y 6',
      'Fundamentación: Código del Trabajo - Procedimiento de investigación'
    ]
  },
  
  benchmark: {
    showBenchmark: false,
    emptyStateTitle: 'Protocolo Legal',
    emptyStateMessage: 'No aplica benchmark en casos de denuncia formal.',
    comparisonLabel: ''
  },
  
  urgency: {
    showMonetary: true,
    showSLA: true,
    showSeverity: true,
    monetaryLabel: 'multa potencial',
    slaLabel: 'plazo legal'
  }
};

const DEFAULT_CONFIG: ExitAlertTypeConfig = {
  type: 'default',
  aliases: [],
  
  label: 'Alerta Exit',
  icon: AlertTriangle,
  color: 'slate',
  priority: 99,
  
  header: {
    icon: BrainCircuit,
    iconColor: 'cyan',
    title: 'Inteligencia Predictiva',
    subtitle: 'detectó una señal de alerta',
    contextLabel: 'Monitoreo Continuo • Exit Intelligence'
  },
  
  revelation: {
    sourceLabel: 'Exit Intelligence',
    showBlockquote: false,
    scoreLabel: 'SEÑAL DETECTADA',
    showLegalNote: false,
    legalNoteTitle: 'Contexto',
    legalNoteText: 'Esta señal requiere análisis adicional para determinar acciones específicas.',
    emphasisWords: ['NO', 'CRÍTICO']
  },
  
  gauge: {
    displayMode: 'gauge',
    title: 'Exit Intelligence Score',
    scoreType: 'scale_100',
    showSecondaryEIS: false,
    thresholdLabel: 'Umbral',
    thresholdValue: 50,
    thresholdDirection: 'below'
  },
  
  evidence: {
    triggerLabel: 'Señal detectada por el sistema',
    triggerType: 'factors',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Metodología Exit Intelligence FocalizaHR'
    ]
  },
  
  benchmark: {
    showBenchmark: false,
    emptyStateTitle: 'Sin Benchmark',
    emptyStateMessage: 'No hay datos de comparación disponibles.',
    comparisonLabel: ''
  },
  
  urgency: {
    showMonetary: false,
    showSLA: false,
    showSeverity: true,
    monetaryLabel: '',
    slaLabel: ''
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAPA PRINCIPAL - SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════════════════

export const EXIT_ALERT_CONFIGS: Record<string, ExitAlertTypeConfig> = {
  // Tipos principales (keys de BD)
  'ley_karin': LEY_KARIN_CONFIG,
  'toxic_exit': TOXIC_EXIT_CONFIG,
  'toxic_exit_detected': TOXIC_EXIT_CONFIG,
  'nps_critico': NPS_CRITICAL_CONFIG,
  'nps_critical': NPS_CRITICAL_CONFIG,
  'liderazgo_concentracion': CONCENTRATED_FACTOR_CONFIG,
  'concentrated_factor': CONCENTRATED_FACTOR_CONFIG,
  'department_exit_pattern': CONCENTRATED_FACTOR_CONFIG,
  'department_pattern': CONCENTRATED_FACTOR_CONFIG,
  'onboarding_correlation': ONBOARDING_CORRELATION_CONFIG,
  'onboarding_exit_correlation': ONBOARDING_CORRELATION_CONFIG,
  'denuncia_formal': DENUNCIA_FORMAL_CONFIG,
  
  // Aliases adicionales
  'ley_karin_indicios': LEY_KARIN_CONFIG,
  
  // Default
  'default': DEFAULT_CONFIG
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene la configuración completa para un tipo de alerta
 * @param alertType - Tipo de alerta (puede ser key de BD o alias)
 * @returns Configuración completa o default si no existe
 */
export function getExitAlertConfig(alertType: string): ExitAlertTypeConfig {
  return EXIT_ALERT_CONFIGS[alertType] || EXIT_ALERT_CONFIGS['default'];
}

/**
 * Obtiene solo la configuración del header
 */
export function getHeaderConfig(alertType: string): HeaderConfig {
  return getExitAlertConfig(alertType).header;
}

/**
 * Obtiene solo la configuración de RevelationCard
 */
export function getRevelationConfig(alertType: string): RevelationConfig & { header: HeaderConfig } {
  const config = getExitAlertConfig(alertType);
  return {
    ...config.revelation,
    header: config.header
  };
}

/**
 * Obtiene solo la configuración de EISScoreGauge
 */
export function getGaugeConfig(alertType: string): GaugeConfig {
  return getExitAlertConfig(alertType).gauge;
}

/**
 * Obtiene solo la configuración de evidencia
 */
export function getEvidenceConfig(alertType: string): EvidenceConfig {
  return getExitAlertConfig(alertType).evidence;
}

/**
 * Obtiene solo la configuración de benchmark
 */
export function getBenchmarkConfig(alertType: string): BenchmarkConfig {
  return getExitAlertConfig(alertType).benchmark;
}

/**
 * Obtiene solo la configuración de urgency
 */
export function getUrgencyConfig(alertType: string): UrgencyConfig {
  return getExitAlertConfig(alertType).urgency;
}

/**
 * Obtiene información UI general (para feeds, listas, badges)
 */
export function getAlertUIConfig(alertType: string): {
  label: string;
  icon: LucideIcon;
  color: AlertColor;
  priority: number;
} {
  const config = getExitAlertConfig(alertType);
  return {
    label: config.label,
    icon: config.icon,
    color: config.color,
    priority: config.priority
  };
}

/**
 * Lista todos los tipos de alerta ordenados por prioridad
 */
export function getAlertTypesByPriority(): ExitAlertTypeConfig[] {
  const uniqueConfigs = new Map<string, ExitAlertTypeConfig>();
  
  Object.values(EXIT_ALERT_CONFIGS).forEach(config => {
    if (!uniqueConfigs.has(config.type)) {
      uniqueConfigs.set(config.type, config);
    }
  });
  
  return Array.from(uniqueConfigs.values())
    .filter(c => c.type !== 'default')
    .sort((a, b) => a.priority - b.priority);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLORES Y ESTILOS HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export const ALERT_COLOR_CLASSES: Record<AlertColor, {
  bg: string;
  text: string;
  border: string;
  icon: string;
}> = {
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    icon: 'text-red-400'
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: 'text-amber-400'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: 'text-purple-400'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400'
  },
  slate: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: 'text-slate-400'
  }
};

/**
 * Obtiene clases de color para un tipo de alerta
 */
export function getAlertColorClasses(alertType: string) {
  const config = getExitAlertConfig(alertType);
  return ALERT_COLOR_CLASSES[config.color];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASIFICACIÓN EIS (movido de gaugeConfig.ts para centralizar)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClassificationStyle {
  color: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const EIS_CLASSIFICATION_STYLES: Record<string, ClassificationStyle> = {
  toxic: {
    color: '#EF4444',
    label: 'TÓXICO',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30'
  },
  problematic: {
    color: '#F59E0B',
    label: 'PROBLEMÁTICO',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30'
  },
  neutral: {
    color: '#64748B',
    label: 'NEUTRAL',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30'
  },
  healthy: {
    color: '#10B981',
    label: 'SALUDABLE',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30'
  },
  detractor: {
    color: '#EF4444',
    label: 'DETRACTOR',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30'
  },
  passive: {
    color: '#F59E0B',
    label: 'PASIVO',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30'
  },
  promoter: {
    color: '#10B981',
    label: 'PROMOTOR',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30'
  }
};

/**
 * Obtiene clasificación EIS por score (0-100)
 */
export function getEISClassification(score: number): ClassificationStyle {
  if (score <= 25) return EIS_CLASSIFICATION_STYLES.toxic;
  if (score <= 50) return EIS_CLASSIFICATION_STYLES.problematic;
  if (score <= 70) return EIS_CLASSIFICATION_STYLES.neutral;
  return EIS_CLASSIFICATION_STYLES.healthy;
}

/**
 * Obtiene clasificación NPS por score (-100 a +100)
 */
export function getNPSClassification(score: number): ClassificationStyle {
  if (score < 0) return EIS_CLASSIFICATION_STYLES.detractor;
  if (score < 50) return EIS_CLASSIFICATION_STYLES.passive;
  return EIS_CLASSIFICATION_STYLES.promoter;
}

/**
 * Obtiene clasificación escala 1-5
 */
export function getScale5Classification(score: number, threshold: number = 2.5): ClassificationStyle {
  if (score < threshold) return EIS_CLASSIFICATION_STYLES.toxic;
  if (score < 3.5) return EIS_CLASSIFICATION_STYLES.problematic;
  if (score < 4.0) return EIS_CLASSIFICATION_STYLES.neutral;
  return EIS_CLASSIFICATION_STYLES.healthy;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES DE DIMENSIONES (para componentes visuales)
// ═══════════════════════════════════════════════════════════════════════════════

export const GAUGE_DIMENSIONS = {
  mobile: {
    container: 180,
    innerRadius: '72%',
    outerRadius: '88%',
    fontSize: 'text-4xl',
    labelSize: 'text-xs',
    badgeSize: 'text-[10px]'
  },
  desktop: {
    container: 220,
    innerRadius: '74%',
    outerRadius: '90%',
    fontSize: 'text-5xl',
    labelSize: 'text-xs',
    badgeSize: 'text-xs'
  }
};

/** Track color purple - Firma FocalizaHR */
export const GAUGE_TRACK_COLOR = 'rgba(167, 139, 250, 0.15)';