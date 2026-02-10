// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL CONTENT - Contenido de factores AAE
// src/lib/potential-content.ts
// ════════════════════════════════════════════════════════════════════════════
// Factores basados en modelo AAE (Aspiration, Ability, Engagement)
// Cada factor tiene 3 niveles con indicadores conductuales específicos
// ════════════════════════════════════════════════════════════════════════════

import { Target, Zap, Heart } from 'lucide-react'
import type { FactorContent, FactorKey } from '@/types/potential'

// ════════════════════════════════════════════════════════════════════════════
// PALETA DE COLORES POR FACTOR
// ════════════════════════════════════════════════════════════════════════════

export const FACTOR_COLORS = {
  aspiration: {
    primary: '#22D3EE',    // Cyan corporativo
    glow: 'rgba(34, 211, 238, 0.4)',
    bg: 'rgba(34, 211, 238, 0.1)',
    border: 'rgba(34, 211, 238, 0.3)'
  },
  ability: {
    primary: '#3B82F6',    // Blue del gradiente
    glow: 'rgba(59, 130, 246, 0.4)',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  engagement: {
    primary: '#A78BFA',    // Purple corporativo
    glow: 'rgba(167, 139, 250, 0.4)',
    bg: 'rgba(167, 139, 250, 0.1)',
    border: 'rgba(167, 139, 250, 0.3)'
  }
} as const

// ════════════════════════════════════════════════════════════════════════════
// FACTOR 1: ASPIRACIÓN
// ════════════════════════════════════════════════════════════════════════════

const ASPIRATION_FACTOR: FactorContent = {
  key: 'aspiration',
  name: 'Aspiración',
  question: '¿Quiere asumir roles de mayor responsabilidad?',
  icon: Target,
  color: FACTOR_COLORS.aspiration.primary,
  colorGlow: FACTOR_COLORS.aspiration.glow,
  levels: [
    {
      value: 1,
      label: 'BAJO',
      shortDescription: 'Satisfecho con rol actual',
      indicators: [
        'Valora estabilidad sobre crecimiento',
        'No busca promociones activamente',
        'Prefiere profundizar en rol actual'
      ]
    },
    {
      value: 2,
      label: 'MEDIO',
      shortDescription: 'Abierto a crecer',
      indicators: [
        'Acepta desafíos cuando se presentan',
        'Muestra interés en aprender más',
        'Considera opciones de crecimiento'
      ]
    },
    {
      value: 3,
      label: 'ALTO',
      shortDescription: 'Busca activamente crecer',
      indicators: [
        'Expresa claramente metas de carrera',
        'Se postula a proyectos desafiantes',
        'Busca mentores y oportunidades'
      ]
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// FACTOR 2: CAPACIDAD (ABILITY)
// ════════════════════════════════════════════════════════════════════════════

const ABILITY_FACTOR: FactorContent = {
  key: 'ability',
  name: 'Capacidad',
  question: '¿Tiene la capacidad para roles de mayor complejidad?',
  icon: Zap,
  color: FACTOR_COLORS.ability.primary,
  colorGlow: FACTOR_COLORS.ability.glow,
  levels: [
    {
      value: 1,
      label: 'BAJO',
      shortDescription: 'Requiere desarrollo',
      indicators: [
        'Necesita guía frecuente',
        'Dificultad con problemas nuevos',
        'Aprendizaje requiere tiempo'
      ]
    },
    {
      value: 2,
      label: 'MEDIO',
      shortDescription: 'Competente con apoyo',
      indicators: [
        'Resuelve problemas conocidos',
        'Aprende con estructura',
        'Ejecuta bien con dirección clara'
      ]
    },
    {
      value: 3,
      label: 'ALTO',
      shortDescription: 'Aprende rápido',
      indicators: [
        'Resuelve problemas complejos',
        'Aprende de forma autónoma',
        'Pensamiento estratégico'
      ]
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// FACTOR 3: COMPROMISO (ENGAGEMENT)
// ════════════════════════════════════════════════════════════════════════════

const ENGAGEMENT_FACTOR: FactorContent = {
  key: 'engagement',
  name: 'Compromiso',
  question: '¿Qué nivel de compromiso tiene con la organización?',
  icon: Heart,
  color: FACTOR_COLORS.engagement.primary,
  colorGlow: FACTOR_COLORS.engagement.glow,
  levels: [
    {
      value: 1,
      label: 'BAJO',
      shortDescription: 'Desconectado',
      indicators: [
        'Cumple lo mínimo requerido',
        'Bajo interés en cultura',
        'Busca oportunidades fuera'
      ]
    },
    {
      value: 2,
      label: 'MEDIO',
      shortDescription: 'Comprometido con equipo',
      indicators: [
        'Buen compañero de trabajo',
        'Cumple compromisos',
        'Participa cuando se le invita'
      ]
    },
    {
      value: 3,
      label: 'ALTO',
      shortDescription: 'Embajador de cultura',
      indicators: [
        'Va más allá de lo esperado',
        'Promueve valores de la empresa',
        'Alto sentido de pertenencia'
      ]
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export const AAE_FACTORS: Record<FactorKey, FactorContent> = {
  aspiration: ASPIRATION_FACTOR,
  ability: ABILITY_FACTOR,
  engagement: ENGAGEMENT_FACTOR
}

export const FACTORS_ORDER: FactorKey[] = ['aspiration', 'ability', 'engagement']

/**
 * Obtiene el siguiente factor en la secuencia
 */
export function getNextFactor(current: FactorKey): FactorKey | null {
  const currentIndex = FACTORS_ORDER.indexOf(current)
  if (currentIndex === -1 || currentIndex >= FACTORS_ORDER.length - 1) {
    return null
  }
  return FACTORS_ORDER[currentIndex + 1]
}

/**
 * Obtiene el factor anterior en la secuencia
 */
export function getPrevFactor(current: FactorKey): FactorKey | null {
  const currentIndex = FACTORS_ORDER.indexOf(current)
  if (currentIndex <= 0) {
    return null
  }
  return FACTORS_ORDER[currentIndex - 1]
}

/**
 * Obtiene el contenido de un nivel específico
 */
export function getLevelContent(factorKey: FactorKey, level: number) {
  const factor = AAE_FACTORS[factorKey]
  return factor.levels.find(l => l.value === level)
}