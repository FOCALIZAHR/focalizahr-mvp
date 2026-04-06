// ════════════════════════════════════════════════════════════════════════════
// UTILS - PLTalent
// src/app/dashboard/executive-hub/components/PLTalent/PLTalent.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import { ROLEFIT_BAR_COLORS } from './PLTalent.constants'
import type { PLTalentData, PLTalentPortadaNarrative, BrechaProductivaData } from './PLTalent.types'
import type { AnclaComponent } from '@/components/executive/AnclaInteligente'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE ENGINE
// Dato ancla: productividad (globalRoleFit 0-100).
// Foco en negocio: "capacidad instalada", "capacidad que pagas pero no recibes".
// CTA siempre cyan. CTA lleva al Acto Ancla.
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrative(
  data: PLTalentData,
  productividad?: number
): PLTalentPortadaNarrative {
  const { brecha, semaforo } = data

  // Sin brecha → caso especial (zona legal o saludable)
  if (brecha.totalPeople === 0) {
    if (semaforo.totalPeople > 0) {
      return {
        highlight: `${semaforo.totalPeople} persona${semaforo.totalPeople > 1 ? 's' : ''} en zona crítica.`,
        suffix: ` ${formatCurrency(semaforo.totalLiability)} acumulado en exposición legal. Cada mes sin actuar suma ${formatCurrency(semaforo.monthlyGrowth)}.`,
        ctaLabel: 'Ver evidencia',
        ctaVariant: 'cyan',
        coachingTip: 'No es una decisión de RRHH — es una decisión financiera.',
      }
    }

    return {
      statusBadge: { label: 'Sin alertas financieras', showCheck: true },
      highlight: 'Sin alertas',
      suffix: ' financieras activas. Tu organización opera dentro de los estándares de productividad.',
      ctaLabel: 'Ver detalle',
      ctaVariant: 'cyan',
      coachingTip: 'Todos los colaboradores evaluados superan el 75% de dominio del cargo.',
    }
  }

  // Con brecha — Paso 1 (GANCHO) + Paso 2 (RIESGO DE NEGOCIO).
  // Zero costo, zero $, zero amplificador. Eso vive en la Cascada.
  const pct = productividad ?? 0

  if (pct >= 75) {
    return {
      prefix: 'Tu organización opera al ',
      highlight: `${pct}%`,
      suffix: ' de lo que sus cargos exigen. Sobre el estándar mínimo.',
      ctaLabel: 'Ver evidencia',
      ctaVariant: 'cyan',
      coachingTip: 'El desafío es mantener este nivel ante rotación y cambios de estándar.',
    }
  }

  return {
    prefix: 'Tu organización opera al ',
    highlight: `${pct}%`,
    suffix: ' de lo que sus cargos exigen. Bajo el umbral mínimo.',
    ctaLabel: 'Ver evidencia',
    ctaVariant: 'cyan',
    coachingTip: 'Eso expone directamente el cumplimiento de los objetivos del negocio.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO ANCLA — "Masa y Gravedad" para <AnclaInteligente />
// Patrón: Radiografía de Riesgo Físico (no adelanta la cascada).
// Nodos: FTE Fantasma · Mayor Lastre · Sobre el Estándar · Umbral 75%
// Narrativas auditadas contra 6 Reglas de Oro (skill focalizahr-narrativas).
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construye los 4 nodos del Acto Ancla para P&L del Talento.
 * Principio: el CEO debe creer en el 68% y sentir fragilidad,
 * sin revelar aún a los culpables (eso es la Cascada).
 */
export function buildPLTalentAnclaComponents(
  brecha: BrechaProductivaData,
  riskProfiles: ExecutiveRiskPayload[]
): AnclaComponent[] {
  const total = riskProfiles.length
  if (total === 0) return []

  // ── 1. FTE FANTASMA — volumen del problema en headcount
  const fteLoss = brecha.fteLoss

  // ── 2. DETRACTOR DINÁMICO — familia con mayor impacto (severidad × volumen)
  const detractor = brecha.byCargoFamily.length > 0
    ? [...brecha.byCargoFamily]
        .map(f => ({
          label: f.label,
          avgRoleFit: f.avgRoleFit,
          headcount: f.headcount,
          impact: Math.round((75 - f.avgRoleFit) * f.headcount),
        }))
        .sort((a, b) => b.impact - a.impact)[0]
    : null

  // ── 3. SUBSIDIO — % de personas sobre el umbral del 75%
  const sobreEstandar = riskProfiles.filter(p => p.data.roleFitScore >= 75).length
  const pctSobreEstandar = Math.round((sobreEstandar / total) * 100)
  const cada10 = Math.max(1, Math.round(pctSobreEstandar / 10))

  return [
    // Nodo 1: FTE Fantasma
    {
      value: fteLoss,
      suffix: '',
      label: 'FTE fantasma',
      narrative: fteLoss === 1
        ? 'Capacidad de 1 persona a tiempo completo que pagas pero no opera en la organización.'
        : `Capacidad de ${fteLoss} personas a tiempo completo que pagas pero no opera en la organización.`,
    },
    // Nodo 2: Donde se concentra (detractor dinámico)
    {
      value: detractor ? Math.round(detractor.avgRoleFit) : 0,
      label: 'Donde se concentra',
      narrative: detractor
        ? `${detractor.label} concentra el mayor impacto en el indicador.`
        : 'Sin datos de familias de cargo.',
    },
    // Nodo 3: Sobre el estándar (subsidio simplificado)
    {
      value: pctSobreEstandar,
      label: 'Sobre el estándar',
      narrative: pctSobreEstandar >= 70
        ? `${cada10} de cada 10 operan sobre el mínimo. Base mayoritariamente sólida.`
        : `${cada10} de cada 10 sostienen los resultados. El resto depende de ellos.`,
    },
    // Nodo 4: Umbral de referencia (ancla científica)
    {
      value: 75,
      label: 'Umbral de referencia',
      narrative: 'El punto óptimo de rentabilidad del talento.',
      tooltip:
        'Firmas top-tier (McKinsey, Korn Ferry, Harvard) sitúan el estándar de máxima productividad ' +
        'y retención en el rango del 70% al 80% de preparación ("readiness"). Un RoleFit menor a ' +
        'este rango exige subsidio operativo constante por parte de los líderes. ' +
        'Exigir un 100% es un error estratégico: indica sobrecalificación, nulo espacio de ' +
        'desarrollo y alto riesgo de fuga a corto plazo.',
    },
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL ROLEFIT — Productividad global desde riskProfiles
// ════════════════════════════════════════════════════════════════════════════

export function computeGlobalRoleFit(riskProfiles: ExecutiveRiskPayload[]): number {
  if (riskProfiles.length === 0) return 0
  return Math.round(
    riskProfiles.reduce((sum, p) => sum + p.data.roleFitScore, 0) / riskProfiles.length
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FORMAT CURRENCY — Chilean pesos ($47.3M, $1.2M, $850K)
// ════════════════════════════════════════════════════════════════════════════

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    return `${sign}$${m >= 10 ? Math.round(m) : (Math.round(m * 10) / 10)}M`
  }
  if (abs >= 1_000) {
    const k = Math.round(abs / 1_000)
    return `${sign}$${k}K`
  }
  return `${sign}$${Math.round(abs).toLocaleString('es-CL')}`
}

// ════════════════════════════════════════════════════════════════════════════
// ROLEFIT BAR COLOR — Returns Tailwind class for bar
// ════════════════════════════════════════════════════════════════════════════

export function getRoleFitBarColor(avgRoleFit: number): string {
  if (avgRoleFit >= 90) return ROLEFIT_BAR_COLORS.optimal
  if (avgRoleFit >= 75) return ROLEFIT_BAR_COLORS.solid
  if (avgRoleFit >= 60) return ROLEFIT_BAR_COLORS.developing
  if (avgRoleFit >= 45) return ROLEFIT_BAR_COLORS.gap
  return ROLEFIT_BAR_COLORS.risk
}
