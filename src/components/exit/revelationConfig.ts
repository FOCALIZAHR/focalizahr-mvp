// src/components/exit/revelationConfig.ts
// 🎯 CONFIGURACIÓN ADAPTATIVA - RevelationCard por Tipo de Alerta
// Filosofía: "El motor entrega datos, el frontend los presenta con inteligencia"

import { BrainCircuit, AlertTriangle, TrendingDown, Users, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export type ScoreDisplayType = 'scale_5' | 'scale_100' | 'nps' | 'percentage' | 'none';
export type DisplayMode = 'question' | 'analysis' | 'protocol' | 'pattern';

export interface EvidenceConfig {
  triggerLabel: string;           // "Pregunta que activó" | "Factores analizados"
  triggerType: 'question' | 'factors' | 'pattern' | 'correlation' | 'protocol';
  sources: string[];              // Fuentes metodológicas
}

export interface RevelationConfig {
  displayMode: DisplayMode;
  headerIcon: LucideIcon;
  headerIconColor: string;
  headerTitle: string;
  headerSubtitle: string;
  contextLabel: string;
  sourceLabel: string;
  showBlockquote: boolean;        // Ya no se usa en cuerpo principal, pero indica si hay pregunta
  scoreType: ScoreDisplayType;
  scoreLabel: string;
  showLegalNote: boolean;
  legalNoteTitle: string;
  legalNoteText: string;          // NUEVO: Texto de la nota legal por tipo
  emphasisWords: string[];
  evidence: EvidenceConfig;       // NUEVO: Configuración del colapsable
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIONES BASE (Reutilizables)
// ═══════════════════════════════════════════════════════════════════════════════

const LEY_KARIN_CONFIG: RevelationConfig = {
  displayMode: 'question',
  headerIcon: BrainCircuit,
  headerIconColor: 'cyan',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'detectó un indicio crítico',
  contextLabel: 'Monitoreo Continuo • Exit Compliance',
  sourceLabel: 'Exit Survey • Confidencial',
  showBlockquote: true,
  scoreType: 'scale_5',
  scoreLabel: 'SEÑAL DETECTADA',
  showLegalNote: true,
  legalNoteTitle: 'Marco Legal',
  legalNoteText: 'Un indicio no implica responsabilidad. Es una señal que activa el deber de investigar preventivamente.',
  emphasisWords: ['NO', 'NUNCA', 'JAMÁS'],
  evidence: {
    triggerLabel: 'Pregunta que activó esta alerta',
    triggerType: 'question',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Ley 21.643 (Ley Karin) - Chile 2024',
      'Fundamentación: Art. 489 Código del Trabajo'
    ]
  }
};

const TOXIC_EXIT_CONFIG: RevelationConfig = {
  displayMode: 'analysis',
  headerIcon: BrainCircuit,
  headerIconColor: 'cyan',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'detectó una salida tóxica',
  contextLabel: 'Monitoreo Continuo • Exit Intelligence',
  sourceLabel: 'Exit Intelligence Score',
  showBlockquote: false,
  scoreType: 'scale_100',
  scoreLabel: 'EIS DETECTADO',
  showLegalNote: false,
  legalNoteTitle: 'Contexto',
  legalNoteText: 'Un EIS bajo indica experiencia laboral negativa con riesgo de contagio al equipo actual.',
  emphasisWords: ['TÓXICO', 'CRÍTICO', 'NO'],
  evidence: {
    triggerLabel: 'Factores analizados en el Exit Intelligence Score',
    triggerType: 'factors',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Algoritmo propietario v2.0',
      'Fundamentación: SHRM Human Capital Benchmarking Report 2024',
      'Fundamentación: Gallup State of the Workplace 2024'
    ]
  }
};

const NPS_CRITICAL_CONFIG: RevelationConfig = {
  displayMode: 'question',
  headerIcon: TrendingDown,
  headerIconColor: 'amber',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'detectó NPS crítico',
  contextLabel: 'Monitoreo Continuo • Employee Experience',
  sourceLabel: 'Exit Survey • eNPS',
  showBlockquote: true,
  scoreType: 'nps',
  scoreLabel: 'eNPS DETECTADO',
  showLegalNote: false,
  legalNoteTitle: 'Contexto',
  legalNoteText: 'Un eNPS negativo indica que el colaborador no recomendaría la empresa como lugar de trabajo.',
  emphasisWords: ['NO', 'NUNCA', 'DETRACTORES'],
  evidence: {
    triggerLabel: 'Pregunta que activó esta alerta',
    triggerType: 'question',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Net Promoter System - Bain & Company',
      'Fundamentación: Reichheld, F. "The Ultimate Question 2.0"'
    ]
  }
};

const CONCENTRATED_FACTOR_CONFIG: RevelationConfig = {
  displayMode: 'pattern',
  headerIcon: Users,
  headerIconColor: 'purple',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'confirmó un patrón sistémico',
  contextLabel: 'Análisis Agregado • Pattern Detection',
  sourceLabel: 'Análisis Agregado • 90 días',
  showBlockquote: false,
  scoreType: 'scale_5',
  scoreLabel: 'PATRÓN IDENTIFICADO',
  showLegalNote: false,
  legalNoteTitle: 'Contexto',
  legalNoteText: 'Un patrón confirmado indica problema sistémico que requiere intervención estructural.',
  emphasisWords: ['PATRÓN', 'CONFIRMADO', 'SISTÉMICO'],
  evidence: {
    triggerLabel: 'Patrón estadístico detectado',
    triggerType: 'pattern',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Pattern Detection Engine',
      'Fundamentación: Análisis estadístico de tendencias (ventana 90 días)',
      'Fundamentación: Metodología de detección de anomalías FocalizaHR'
    ]
  }
};

const ONBOARDING_CORRELATION_CONFIG: RevelationConfig = {
  displayMode: 'analysis',
  headerIcon: Link2,
  headerIconColor: 'cyan',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'detectó correlación crítica',
  contextLabel: 'Correlación Cruzada • Onboarding ↔ Exit',
  sourceLabel: 'Análisis Correlación',
  showBlockquote: false,
  scoreType: 'percentage',
  scoreLabel: 'CORRELACIÓN',
  showLegalNote: false,
  legalNoteTitle: 'Contexto',
  legalNoteText: 'Esta correlación indica que alertas de onboarding ignoradas predijeron esta salida.',
  emphasisWords: ['NO', 'IGNORADAS', 'ADVIRTIÓ'],
  evidence: {
    triggerLabel: 'Correlación detectada entre productos',
    triggerType: 'correlation',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Cross-Product Correlation Engine',
      'Fundamentación: Análisis longitudinal Onboarding → Exit',
      'Fundamentación: Metodología predictiva FocalizaHR Research'
    ]
  }
};

const DENUNCIA_FORMAL_CONFIG: RevelationConfig = {
  displayMode: 'protocol',
  headerIcon: AlertTriangle,
  headerIconColor: 'red',
  headerTitle: 'Protocolo Ley Karin Activado',
  headerSubtitle: 'Denuncia formal registrada',
  contextLabel: 'Protocolo Activado • Ley 21.643',
  sourceLabel: 'Protocolo Legal • 30 días',
  showBlockquote: false,
  scoreType: 'none',
  scoreLabel: 'PLAZO LEGAL',
  showLegalNote: true,
  legalNoteTitle: 'Obligaciones Activas',
  legalNoteText: 'Una denuncia formal activa obligaciones legales inmediatas con plazo máximo de 30 días.',
  emphasisWords: ['DENUNCIA', 'FORMAL', 'OBLIGACIÓN'],
  evidence: {
    triggerLabel: 'Protocolo legal activado',
    triggerType: 'protocol',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Compliance Monitor',
      'Fundamentación: Ley 21.643 (Ley Karin) Art. 4, 5 y 6',
      'Fundamentación: Código del Trabajo - Procedimiento de investigación'
    ]
  }
};

const DEFAULT_CONFIG: RevelationConfig = {
  displayMode: 'analysis',
  headerIcon: BrainCircuit,
  headerIconColor: 'cyan',
  headerTitle: 'Inteligencia Predictiva',
  headerSubtitle: 'detectó una señal de alerta',
  contextLabel: 'Monitoreo Continuo • Exit Intelligence',
  sourceLabel: 'Exit Intelligence',
  showBlockquote: false,
  scoreType: 'scale_100',
  scoreLabel: 'SEÑAL DETECTADA',
  showLegalNote: false,
  legalNoteTitle: 'Contexto',
  legalNoteText: 'Esta señal requiere análisis adicional para determinar acciones específicas.',
  emphasisWords: ['NO', 'CRÍTICO'],
  evidence: {
    triggerLabel: 'Señal detectada por el sistema',
    triggerType: 'factors',
    sources: [
      'FocalizaHR Inteligencia Predictiva - Detección automática',
      'Fundamentación: Metodología Exit Intelligence FocalizaHR'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR TIPO DE ALERTA
// Incluye TODOS los valores de la BD + aliases del tipo TypeScript
// ═══════════════════════════════════════════════════════════════════════════════

export const REVELATION_CONFIG: Record<string, RevelationConfig> = {
  // LEY KARIN - BD usa 'ley_karin', tipos usan 'ley_karin_indicios'
  'ley_karin': LEY_KARIN_CONFIG,
  'ley_karin_indicios': LEY_KARIN_CONFIG,
  
  // TOXIC EXIT - BD usa 'toxic_exit_detected', tipos usan 'toxic_exit'
  'toxic_exit': TOXIC_EXIT_CONFIG,
  'toxic_exit_detected': TOXIC_EXIT_CONFIG,
  
  // DENUNCIA FORMAL
  'denuncia_formal': DENUNCIA_FORMAL_CONFIG,
  
  // NPS CRÍTICO - BD usa 'nps_critico', tipos usan 'nps_critical'
  'nps_critico': NPS_CRITICAL_CONFIG,
  'nps_critical': NPS_CRITICAL_CONFIG,
  
  // FACTOR CONCENTRADO - BD usa 'liderazgo_concentracion', tipos usan 'concentrated_factor'
  'concentrated_factor': CONCENTRATED_FACTOR_CONFIG,
  'liderazgo_concentracion': CONCENTRATED_FACTOR_CONFIG,
  'department_exit_pattern': CONCENTRATED_FACTOR_CONFIG,
  'department_pattern': CONCENTRATED_FACTOR_CONFIG,
  
  // CORRELACIÓN ONBOARDING - BD usa 'onboarding_exit_correlation', tipos usan 'onboarding_correlation'
  'onboarding_correlation': ONBOARDING_CORRELATION_CONFIG,
  'onboarding_exit_correlation': ONBOARDING_CORRELATION_CONFIG,
  
  // DEFAULT
  'default': DEFAULT_CONFIG
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Obtener configuración por tipo
// ═══════════════════════════════════════════════════════════════════════════════

export function getRevelationConfig(alertType: string): RevelationConfig {
  return REVELATION_CONFIG[alertType] || REVELATION_CONFIG['default'];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Colores por tipo de ícono
// ═══════════════════════════════════════════════════════════════════════════════

export const ICON_COLORS: Record<string, string> = {
  cyan: 'text-cyan-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400'
};

export const ICON_BG_COLORS: Record<string, string> = {
  cyan: 'bg-cyan-500/15 border-cyan-500/30',
  red: 'bg-red-500/15 border-red-500/30',
  purple: 'bg-purple-500/15 border-purple-500/30',
  amber: 'bg-amber-500/15 border-amber-500/30'
};