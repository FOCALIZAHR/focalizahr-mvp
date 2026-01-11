// ═══════════════════════════════════════════════════════════════════════════════
// EXIT ROOT CAUSES CONFIG - NARRATIVAS Y CONFIGURACIÓN UI
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: src/config/exitRootCausesConfig.ts
// Versión: 1.0
// Fecha: Enero 2025
// Propósito: Single source of truth para narrativas, cuadrantes y configuración
//            de los componentes de análisis de causas raíz Exit Intelligence
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  Scale, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Target, 
  Zap,
  Eye,
  Search,
  Activity,
  type LucideIcon
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export type QuadrantId = 'critical' | 'investigate' | 'monitor' | 'observe';
export type VerdictType = 'clear_consensus' | 'early_signal' | 'no_pattern';

export interface QuadrantConfig {
  id: QuadrantId;
  label: string;
  labelShort: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: LucideIcon;
  narrative: {
    title: string;
    interpretation: string;
    action: string;
    urgency: 'inmediata' | '30_dias' | '90_dias' | 'siguiente_ciclo';
    product: string | null;
  };
}

export interface FactorConfig {
  label: string;
  labelShort: string;
  icon: LucideIcon;
  isLeadershipRelated: boolean;
  narrativeWhenTop: string;
  recommendedAction: string;
}

export interface ScientificSource {
  name: string;
  study: string;
  year: number;
  sampleSize: string;
  keyFindings: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUADRANTES - Configuración visual y narrativa
// ═══════════════════════════════════════════════════════════════════════════════

export const QUADRANT_CONFIG: Record<QuadrantId, QuadrantConfig> = {
  critical: {
    id: 'critical',
    label: 'ACTUAR AHORA',
    labelShort: 'Actuar',
    description: 'Alta frecuencia + Alta severidad',
    color: '#22D3EE',
    bgColor: 'rgba(34, 211, 238, 0.12)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
    glowColor: '0 0 20px rgba(34, 211, 238, 0.15)',
    icon: Zap,
    narrative: {
      title: 'Intervención Estructural Urgente',
      interpretation: 'Patrón confirmado con múltiples fuentes independientes. Cada día sin actuar incrementa el costo de rotación.',
      action: 'Diagnóstico profundo + Plan de acción 30 días',
      urgency: 'inmediata',
      product: 'ambiente_sano'
    }
  },
  investigate: {
    id: 'investigate',
    label: 'INVESTIGAR',
    labelShort: 'Investigar',
    description: 'Baja frecuencia + Alta severidad',
    color: '#A78BFA',
    bgColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    glowColor: '0 0 20px rgba(167, 139, 250, 0.15)',
    icon: Search,
    narrative: {
      title: 'Señal Temprana Crítica',
      interpretation: 'Pocos lo mencionan, pero quienes lo hacen lo califican como devastador. Bomba de tiempo potencial que requiere investigación inmediata.',
      action: 'Diagnóstico focalizado antes de que escale',
      urgency: '30_dias',
      product: 'ambiente_sano'
    }
  },
  monitor: {
    id: 'monitor',
    label: 'MONITOREAR',
    labelShort: 'Monitorear',
    description: 'Alta frecuencia + Baja severidad',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    glowColor: '0 0 20px rgba(59, 130, 246, 0.15)',
    icon: Activity,
    narrative: {
      title: 'Molestia Común Tolerable',
      interpretation: 'Muchos lo mencionan pero no lo consideran grave. Mejora continua recomendada, no emergencia.',
      action: 'Pulso trimestral + mejoras incrementales',
      urgency: '90_dias',
      product: 'pulso_express'
    }
  },
  observe: {
    id: 'observe',
    label: 'OBSERVAR',
    labelShort: 'Observar',
    description: 'Baja frecuencia + Baja severidad',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    glowColor: '0 0 20px rgba(100, 116, 139, 0.1)',
    icon: Eye,
    narrative: {
      title: 'Ruido Estadístico',
      interpretation: 'Menciones aisladas sin patrón claro. No requiere acción inmediata.',
      action: 'Revisar en próximo ciclo de medición',
      urgency: 'siguiente_ciclo',
      product: null
    }
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// VEREDICTO - Narrativas dinámicas para el Hero Card
// ═══════════════════════════════════════════════════════════════════════════════

export const VERDICT_NARRATIVES = {
  clear_consensus: {
    title: 'El Veredicto',
    subtitle: 'La verdad que solo los que se van pueden decir',
    icon: Scale,
    getMainMessage: (count: number, total: number, factor: string) => ({
      prefix: `${count} de ${total} personas`,
      emphasis: 'eligieron independientemente',
      factor: factor,
      suffix: 'como factor de su salida'
    }),
    scientificBacking: {
      quote: '50% de los empleados renuncian para escapar de su JEFE, no de su empresa',
      source: 'Gallup State of the Workplace 2024',
      getInterpretation: (count: number) => 
        `Cuando ${count} personas independientes apuntan al mismo problema sin ponerse de acuerdo, la probabilidad de coincidencia es estadísticamente insignificante (<5%).`
    },
    ctaText: 'Investigar Ahora',
    ctaIcon: Search
  },
  
  early_signal: {
    title: 'Señal Temprana',
    subtitle: 'Lo que pocos ven pero debería preocuparte',
    icon: AlertTriangle,
    getMainMessage: (count: number, total: number, factor: string, severity: number) => ({
      prefix: `Solo ${count} de ${total} mencionaron`,
      emphasis: factor,
      factor: '',
      suffix: `pero lo calificaron con severidad ${severity.toFixed(1)}/5.0 (EXTREMO)`
    }),
    scientificBacking: {
      quote: '75% de los empleados dice que su jefe es lo más estresante del trabajo',
      source: 'Harvard Business Review',
      getInterpretation: () => 
        'Las señales tempranas más peligrosas son las que pocos reportan pero califican como devastadoras. Son bombas de tiempo organizacionales.'
    },
    ctaText: 'Diagnosticar',
    ctaIcon: Target
  },
  
  no_pattern: {
    title: 'Sin Patrón Claro',
    subtitle: 'Las salidas no muestran un factor dominante',
    icon: Eye,
    getMainMessage: (count: number, total: number) => ({
      prefix: `${total} salidas analizadas`,
      emphasis: 'sin un factor',
      factor: '',
      suffix: 'que supere el 30% de menciones'
    }),
    scientificBacking: {
      quote: '42% de la rotación es prevenible con intervención correcta',
      source: 'Gallup 2024',
      getInterpretation: () =>
        'La ausencia de patrón puede indicar causas diversas o que el factor real no está siendo capturado. Considerar entrevistas cualitativas.'
    },
    ctaText: 'Ver Detalle',
    ctaIcon: Activity
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORES - Labels y configuración por factor de salida
// ═══════════════════════════════════════════════════════════════════════════════

export const EXIT_FACTOR_CONFIG: Record<string, FactorConfig> = {
  // Keys = nombres EXACTOS de la BD (opciones de la encuesta P2)
  'Liderazgo de Apoyo': {
    label: 'Liderazgo de Apoyo',
    labelShort: 'Liderazgo',
    icon: Users,
    isLeadershipRelated: true,
    narrativeWhenTop: 'El liderazgo es el predictor #1 de rotación. Gallup 2024 confirma que 50% de las renuncias son para escapar de un mal jefe, no de la empresa.',
    recommendedAction: 'Assessment 360° del líder + programa de coaching ejecutivo'
  },
  'Oportunidades de Crecimiento': {
    label: 'Oportunidades de Crecimiento',
    labelShort: 'Crecimiento',
    icon: TrendingDown,
    isLeadershipRelated: false,
    narrativeWhenTop: 'La falta de desarrollo profesional es la segunda causa de rotación voluntaria en Chile y Latinoamérica.',
    recommendedAction: 'Revisar planes de carrera + conversaciones de desarrollo individualizadas'
  },
  'Compensación y Beneficios': {
    label: 'Compensación y Beneficios',
    labelShort: 'Compensación',
    icon: Scale,
    isLeadershipRelated: false,
    narrativeWhenTop: 'Compensación es frecuentemente mencionada pero rara vez es la causa raíz real. Investigar factores subyacentes como reconocimiento y equidad.',
    recommendedAction: 'Benchmark salarial + análisis de equidad interna + revisión de beneficios'
  },
  'Flexibilidad y Equilibrio': {
    label: 'Flexibilidad y Equilibrio',
    labelShort: 'Balance',
    icon: Activity,
    isLeadershipRelated: false,
    narrativeWhenTop: 'El desbalance crónico genera burnout y rotación acelerada. Si no se interviene, el problema escala rápidamente.',
    recommendedAction: 'Auditoría de carga laboral + políticas de flexibilidad + límites claros'
  },
  'Autonomía y Confianza': {
    label: 'Autonomía y Confianza',
    labelShort: 'Autonomía',
    icon: AlertTriangle,
    isLeadershipRelated: true,
    narrativeWhenTop: 'La microgestión y falta de empoderamiento son señales de liderazgo disfuncional que generan frustración y desenganche.',
    recommendedAction: 'Redefinición de roles + delegación efectiva + coaching a líderes'
  },
  'Reconocimiento y Valoración': {
    label: 'Reconocimiento y Valoración',
    labelShort: 'Reconocimiento',
    icon: Target,
    isLeadershipRelated: true,
    narrativeWhenTop: 'El reconocimiento es responsabilidad directa del líder. Su ausencia sistemática indica un gap de liderazgo que debe abordarse.',
    recommendedAction: 'Programa de reconocimiento estructurado + capacitación a líderes'
  },
  'Ambiente y Clima Laboral': {
    label: 'Ambiente y Clima Laboral',
    labelShort: 'Clima',
    icon: Users,
    isLeadershipRelated: false,
    narrativeWhenTop: 'Un ambiente tóxico reduce productividad hasta 40% (McKinsey) y acelera la rotación significativamente.',
    recommendedAction: 'Ambiente Sano para diagnóstico profundo + plan de intervención cultural'
  },
  'Comunicación Organizacional': {
    label: 'Comunicación Organizacional',
    labelShort: 'Comunicación',
    icon: AlertTriangle,
    isLeadershipRelated: false,
    narrativeWhenTop: 'La comunicación deficiente genera desalineamiento, frustración y sensación de no ser escuchado.',
    recommendedAction: 'Diagnóstico de canales + town halls + feedback bidireccional'
  },
  'Cultura y Valores': {
    label: 'Cultura y Valores',
    labelShort: 'Cultura',
    icon: Users,
    isLeadershipRelated: false,
    narrativeWhenTop: 'La desalineación entre valores declarados y conductas reales genera cinismo y desenganche profundo.',
    recommendedAction: 'Culture Scope para diagnóstico + alineamiento valores-comportamientos'
  },
  'Otro': {
    label: 'Otros Factores',
    labelShort: 'Otros',
    icon: AlertTriangle,
    isLeadershipRelated: false,
    narrativeWhenTop: 'Factores diversos que requieren análisis cualitativo para identificar patrones específicos.',
    recommendedAction: 'Entrevistas de profundización + análisis de comentarios abiertos'
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// METODOLOGÍA - Fuentes científicas para credibilidad
// ═══════════════════════════════════════════════════════════════════════════════

export const METHODOLOGY_SOURCES: Record<string, ScientificSource> = {
  gallup_2024: {
    name: 'Gallup',
    study: 'State of the Global Workplace 2024',
    year: 2024,
    sampleSize: '200,000+ empleados globalmente',
    keyFindings: [
      '50% de los empleados renuncian por su jefe, no por la empresa',
      '42% de la rotación es prevenible con intervención correcta',
      'Ambientes tóxicos aumentan rotación 25%',
      'Empleados desengagados son 23% menos productivos'
    ]
  },
  shrm_2024: {
    name: 'SHRM',
    study: 'Human Capital Benchmarking Report 2024',
    year: 2024,
    sampleSize: '3,000+ organizaciones',
    keyFindings: [
      'Costo de reemplazo: 50-200% del salario anual',
      'Promedio de costo: 120% del salario anual',
      'Incluye: reclutamiento, capacitación, productividad perdida, conocimiento perdido'
    ]
  },
  mckinsey_2024: {
    name: 'McKinsey',
    study: 'Leadership Performance Impact',
    year: 2024,
    sampleSize: '5,000+ ejecutivos',
    keyFindings: [
      'Liderazgo efectivo mejora performance 15-25%',
      'Culturas tóxicas reducen productividad hasta 40%',
      'Cada punto de gap en liderazgo = 12.5% pérdida de performance'
    ]
  },
  hbr: {
    name: 'Harvard Business Review',
    study: 'Workplace Stress Research',
    year: 2023,
    sampleSize: 'Meta-análisis múltiples estudios',
    keyFindings: [
      '75% de empleados dice que su jefe es lo más estresante del trabajo',
      'Respuesta en <24h reduce daño reputacional 40%',
      'Intervención temprana tiene 75% de efectividad'
    ]
  },
  aberdeen: {
    name: 'Aberdeen Group',
    study: 'Onboarding & Retention Research',
    year: 2024,
    sampleSize: '1,500+ empresas',
    keyFindings: [
      '75% de la decisión de quedarse/irse se toma en primeros 90 días',
      'Preparación Día 1 predice 85% de retención si se ejecuta correctamente'
    ]
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// UMBRALES - Configuración de clasificación
// ═══════════════════════════════════════════════════════════════════════════════

export const CLASSIFICATION_THRESHOLDS = {
  frequency: {
    high: 0.25,     // ≥25% = alta frecuencia (ajustado para ser más sensible)
    medium: 0.15,   // ≥15% = frecuencia media
    low: 0.10       // <10% = baja frecuencia
  },
  severity: {
    critical: 2.0,   // ≤2.0 = muy grave (1-5 scale invertida)
    high: 2.5,       // ≤2.5 = grave
    moderate: 3.5,   // ≤3.5 = moderado
    low: 4.0         // >4.0 = leve
  },
  consensus: {
    clear: 0.50,     // ≥50% = consenso claro
    strong: 0.40,    // ≥40% = consenso fuerte
    moderate: 0.30,  // ≥30% = consenso moderado
    weak: 0.20       // ≥20% = consenso débil
  },
  minimumExits: 3    // Mínimo de salidas para análisis significativo
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS - Mensajes dinámicos basados en datos
// ═══════════════════════════════════════════════════════════════════════════════

export const INSIGHT_MESSAGES = {
  // Por severidad
  severity: {
    extreme: {
      threshold: 1.5,
      icon: '🔴',
      type: 'warning' as const,
      getMessage: (factor: string) => 
        `${factor} calificado como EXTREMADAMENTE GRAVE por quienes lo mencionaron`
    },
    high: {
      threshold: 2.5,
      icon: '🟠',
      type: 'warning' as const,
      getMessage: (factor: string) => 
        `Severidad alta en ${factor} — requiere atención prioritaria`
    },
    moderate: {
      threshold: 3.5,
      icon: '🟡',
      type: 'info' as const,
      getMessage: (factor: string) => 
        `${factor} con severidad moderada — monitorear evolución`
    }
  },
  
  // Por frecuencia/menciones
  mentions: {
    pattern_confirmed: {
      threshold: 3,
      icon: '📊',
      type: 'insight' as const,
      getMessage: (count: number, factor: string) => 
        `Patrón confirmado: ${count} personas independientes coinciden en ${factor}`
    },
    early_signal: {
      threshold: 1,
      icon: '👁️',
      type: 'info' as const,
      getMessage: (factor: string) => 
        `Mención única de ${factor} — señal temprana a monitorear`
    }
  },
  
  // Por cuadrante
  quadrant: {
    critical: {
      icon: '⚡',
      type: 'warning' as const,
      getMessage: () => 
        'Combinación crítica: alta frecuencia + alta severidad — intervención urgente'
    },
    investigate: {
      icon: '🔍',
      type: 'insight' as const,
      getMessage: () => 
        'Pocos lo mencionan, pero lo califican como muy grave — bomba de tiempo potencial'
    },
    monitor: {
      icon: '📈',
      type: 'info' as const,
      getMessage: () => 
        'Molestia común pero tolerable — mejora continua recomendada'
    },
    observe: {
      icon: '👀',
      type: 'neutral' as const,
      getMessage: () => 
        'Ruido estadístico — revisar en próximo ciclo'
    }
  },
  
  // Especiales
  leadership: {
    icon: '👔',
    type: 'warning' as const,
    getMessage: (mentionRate: number) => 
      `Factor relacionado con liderazgo (${Math.round(mentionRate * 100)}% menciones) — revisar supervisores del área`
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS - Funciones de clasificación y utilidad
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determina el cuadrante basado en frecuencia de mención y severidad promedio
 */
export function getQuadrant(
  mentionRate: number, 
  avgSeverity: number
): QuadrantId {
  const isHighFrequency = mentionRate >= CLASSIFICATION_THRESHOLDS.frequency.high;
  const isHighSeverity = avgSeverity <= CLASSIFICATION_THRESHOLDS.severity.high;
  
  if (isHighFrequency && isHighSeverity) return 'critical';
  if (!isHighFrequency && isHighSeverity) return 'investigate';
  if (isHighFrequency && !isHighSeverity) return 'monitor';
  return 'observe';
}

/**
 * Determina el tipo de veredicto basado en el factor top
 */
export function getVerdictType(
  topFactorRate: number,
  topFactorSeverity: number,
  totalExits: number
): VerdictType {
  // Si no hay suficientes datos
  if (totalExits < CLASSIFICATION_THRESHOLDS.minimumExits) {
    return 'no_pattern';
  }
  
  // Consenso claro: factor top tiene >40% de menciones
  if (topFactorRate >= CLASSIFICATION_THRESHOLDS.consensus.strong) {
    return 'clear_consensus';
  }
  
  // Señal temprana: severidad extrema aunque pocos mencionen
  if (topFactorSeverity <= CLASSIFICATION_THRESHOLDS.severity.critical) {
    return 'early_signal';
  }
  
  // Sin patrón claro
  return 'no_pattern';
}

/**
 * Obtiene la configuración de un factor, con fallback a 'otro'
 */
export function getFactorConfig(factorKey: string): FactorConfig {
  // Buscar directo por nombre (como viene de BD)
  if (EXIT_FACTOR_CONFIG[factorKey]) {
    return EXIT_FACTOR_CONFIG[factorKey];
  }
  
  // Fallback
  return EXIT_FACTOR_CONFIG['Otro'];
}

/**
 * Obtiene el label amigable de un factor
 */
export function getFactorLabel(factorKey: string, short: boolean = false): string {
  const config = getFactorConfig(factorKey);
  return short ? config.labelShort : config.label;
}

/**
 * Formatea porcentaje para display
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea monto en CLP
 */
export function formatCLP(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Genera insights automáticos para un factor
 */
export function generateFactorInsights(
  factor: string,
  mentionRate: number,
  avgSeverity: number,
  mentions: number,
  quadrant: QuadrantId
): Array<{
  icon: string;
  type: 'warning' | 'insight' | 'info' | 'neutral';
  message: string;
}> {
  const insights: Array<{
    icon: string;
    type: 'warning' | 'insight' | 'info' | 'neutral';
    message: string;
  }> = [];
  
  const factorConfig = getFactorConfig(factor);
  
  // Insight por severidad
  if (avgSeverity <= INSIGHT_MESSAGES.severity.extreme.threshold) {
    insights.push({
      icon: INSIGHT_MESSAGES.severity.extreme.icon,
      type: INSIGHT_MESSAGES.severity.extreme.type,
      message: INSIGHT_MESSAGES.severity.extreme.getMessage(factorConfig.labelShort)
    });
  } else if (avgSeverity <= INSIGHT_MESSAGES.severity.high.threshold) {
    insights.push({
      icon: INSIGHT_MESSAGES.severity.high.icon,
      type: INSIGHT_MESSAGES.severity.high.type,
      message: INSIGHT_MESSAGES.severity.high.getMessage(factorConfig.labelShort)
    });
  }
  
  // Insight por menciones
  if (mentions >= INSIGHT_MESSAGES.mentions.pattern_confirmed.threshold) {
    insights.push({
      icon: INSIGHT_MESSAGES.mentions.pattern_confirmed.icon,
      type: INSIGHT_MESSAGES.mentions.pattern_confirmed.type,
      message: INSIGHT_MESSAGES.mentions.pattern_confirmed.getMessage(mentions, factorConfig.labelShort)
    });
  } else if (mentions === 1) {
    insights.push({
      icon: INSIGHT_MESSAGES.mentions.early_signal.icon,
      type: INSIGHT_MESSAGES.mentions.early_signal.type,
      message: INSIGHT_MESSAGES.mentions.early_signal.getMessage(factorConfig.labelShort)
    });
  }
  
  // Insight por cuadrante
  const quadrantInsight = INSIGHT_MESSAGES.quadrant[quadrant];
  insights.push({
    icon: quadrantInsight.icon,
    type: quadrantInsight.type,
    message: quadrantInsight.getMessage()
  });
  
  // Insight especial para factores de liderazgo
  if (factorConfig.isLeadershipRelated && mentionRate >= 0.20) {
    insights.push({
      icon: INSIGHT_MESSAGES.leadership.icon,
      type: INSIGHT_MESSAGES.leadership.type,
      message: INSIGHT_MESSAGES.leadership.getMessage(mentionRate)
    });
  }
  
  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  QUADRANT_CONFIG,
  VERDICT_NARRATIVES,
  EXIT_FACTOR_CONFIG,
  METHODOLOGY_SOURCES,
  CLASSIFICATION_THRESHOLDS,
  INSIGHT_MESSAGES,
  getQuadrant,
  getVerdictType,
  getFactorConfig,
  getFactorLabel,
  formatPercentage,
  formatCLP,
  generateFactorInsights
};