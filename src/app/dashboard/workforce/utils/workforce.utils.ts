// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE UTILS — Narrativas + Computed Values + Ancla Builder
// src/app/dashboard/workforce/utils/workforce.utils.ts
// ════════════════════════════════════════════════════════════════════════════
// Frontend-only computations sobre WorkforceDiagnosticData
// Reemplaza useWorkforceCascade con funciones puras (sin estado)
// ════════════════════════════════════════════════════════════════════════════

import type { WorkforceDiagnosticData } from '../types/workforce.types'
import type { AnclaComponent } from '@/components/executive/AnclaInteligente'

// ════════════════════════════════════════════════════════════════════════════
// TYPES — inline (antes vivian en useWorkforceCascade.ts, ya borrado)
// ════════════════════════════════════════════════════════════════════════════

export interface GerenciaExposure {
  name: string
  avgExposure: number
  headcount: number
}

export interface Francotirador {
  name: string
  department: string
  concentrationPct: number
  costAtRisk: number
  hallazgosCount: number
}

export interface ComputedCascadeValues {
  cantidadHallazgos: number
  costoNoActuar12M: number
  gerenciaMas: GerenciaExposure
  gerenciaMenos: GerenciaExposure
  cantidadGerencias: number
  francotirador: Francotirador
}

// ════════════════════════════════════════════════════════════════════════════
// COMPUTED VALUES — funciones puras (sin estado)
// ════════════════════════════════════════════════════════════════════════════

export function computeHallazgosCount(data: WorkforceDiagnosticData): number {
  return (
    data.zombies.count +
    data.flightRisk.count +
    data.redundancy.pairs.length +
    data.adoptionRisk.departments.length +
    data.seniorityCompression.opportunities.length
  )
}

export function computeCascadeValues(data: WorkforceDiagnosticData): ComputedCascadeValues {
  const cantidadHallazgos = computeHallazgosCount(data)

  const costoNoActuar12M =
    data.severanceLiability.totalSeverance +
    data.flightRisk.totalReplacementCost +
    data.inertiaCost.totalAnnual

  // Gerencias mas/menos expuestas
  const gerencias: GerenciaExposure[] = Object.entries(data.exposure.byCategory)
    .map(([name, val]) => ({ name, avgExposure: val.avgExposure, headcount: val.headcount }))
    .filter(g => g.headcount > 0)

  const sorted = [...gerencias].sort((a, b) => b.avgExposure - a.avgExposure)
  const gerenciaMas = sorted[0] ?? { name: 'Sin datos', avgExposure: 0, headcount: 0 }
  const gerenciaMenos = sorted[sorted.length - 1] ?? { name: 'Sin datos', avgExposure: 0, headcount: 0 }
  const cantidadGerencias = gerencias.length

  // Francotirador — gerencia con mayor concentracion de riesgo financiero
  const deptImpact = new Map<string, { cost: number; hallazgos: number }>()

  const addImpact = (dept: string, cost: number) => {
    const existing = deptImpact.get(dept) ?? { cost: 0, hallazgos: 0 }
    existing.cost += cost
    existing.hallazgos += 1
    deptImpact.set(dept, existing)
  }

  data.zombies.persons.forEach(p => addImpact(p.departmentName, p.financialImpact))
  data.flightRisk.persons.forEach(p => addImpact(p.departmentName, p.replacementCost))
  data.inertiaCost.byDepartment.forEach(d => addImpact(d.departmentName, d.annualCost))

  let francotirador: Francotirador = {
    name: 'Sin datos',
    department: '',
    concentrationPct: 0,
    costAtRisk: 0,
    hallazgosCount: 0,
  }

  if (deptImpact.size > 0) {
    const totalCost = Array.from(deptImpact.values()).reduce((sum, v) => sum + v.cost, 0)
    let maxDept = ''
    let maxCost = 0
    let maxHallazgos = 0
    deptImpact.forEach((val, dept) => {
      if (val.cost > maxCost) {
        maxDept = dept
        maxCost = val.cost
        maxHallazgos = val.hallazgos
      }
    })

    francotirador = {
      name: maxDept,
      department: maxDept,
      concentrationPct: totalCost > 0 ? Math.round((maxCost / totalCost) * 100) : 0,
      costAtRisk: maxCost,
      hallazgosCount: maxHallazgos,
    }
  }

  return {
    cantidadHallazgos,
    costoNoActuar12M,
    gerenciaMas,
    gerenciaMenos,
    cantidadGerencias,
    francotirador,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE — para PanelPortada
// ════════════════════════════════════════════════════════════════════════════

export interface PortadaNarrative {
  statusBadge: { label: string; showCheck?: boolean }
  prefix: string
  highlight: string
  suffix: string
  ctaVariant: 'cyan' | 'amber' | 'red' | 'purple'
  coachingTip: string
}

export function getPortadaNarrative(data: WorkforceDiagnosticData): PortadaNarrative {
  const pct = Math.round(data.exposure.avgExposure * 100)
  const hallazgos = computeHallazgosCount(data)

  // v3.2 — narrativa "La Sentencia". El golpe inicial. NO se suaviza.
  return {
    statusBadge:
      hallazgos > 0
        ? { label: `${hallazgos} situaciones requieren atencion` }
        : { label: 'Sin hallazgos criticos', showCheck: true },
    prefix: '',
    highlight: `${pct}% de las tareas que tu organizacion paga hoy, la IA ya sabe ejecutar.`,
    suffix:
      ' No es prediccion. Es el cruce entre lo que la tecnologia domina — y lo que tu gente hace cada dia.',
    ctaVariant: pct > 60 ? 'red' : pct > 40 ? 'amber' : 'cyan',
    coachingTip:
      'La pregunta no es "cuanto automatizar" — es "donde liberar capacidad".',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ANCLA COMPONENTS BUILDER — para AnclaInteligente
// ════════════════════════════════════════════════════════════════════════════

export function buildAnclaComponents(data: WorkforceDiagnosticData): AnclaComponent[] {
  const autoOrg = Math.round(data.orgAutomationShare * 100)
  const augOrg = Math.round(data.orgAugmentationShare * 100)

  const computed = computeCascadeValues(data)
  const gerenciaMasPct = Math.round(computed.gerenciaMas.avgExposure * 100)

  // ── REGLA DEL ANCLA CIENTIFICA (cascada-ejecutiva.md:273-332) ──────
  // Al menos UN componente debe llevar tooltip con sustento metodologico:
  // 1) Como se calcula (metodo especifico)
  // 2) Que mide (frase ejecutiva)
  // 3) Umbrales de interpretacion
  // El Ancla Cientifica va en el ULTIMO nodo (sello antes del CTA).
  // El nodo cientifico aqui es "Automatizacion vs Augmentacion" porque deriva
  // del Anthropic Economic Index — datos de uso real observado, no opiniones.

  return [
    {
      value: gerenciaMasPct,
      label: computed.gerenciaMas.name,
      narrative: 'La gerencia con mayor concentracion de tareas en zona IA.',
      suffix: '%',
    },
    {
      value: Math.round(data.liberatedFTEs.totalFTEs),
      label: 'FTE Atrapados',
      narrative: 'Capacidad equivalente que la IA puede absorber hoy.',
      suffix: '',
    },
    {
      value: data.zonaCriticaCount,
      label: 'Zona Critica',
      narrative: 'Personas con mas del 70% de exposicion y baja capacidad de adaptacion.',
      suffix: ' personas',
    },
    {
      // Ancla Cientifica — ultimo nodo, sello metodologico antes del CTA
      value: autoOrg,
      label: 'Automatizacion vs Augmentacion',
      narrative: `${autoOrg}% son tareas que la IA ejecuta sin intervencion. El ${augOrg}% restante son tareas donde la IA potencia la productividad.`,
      suffix: '%',
      tooltip:
        'Calculado a partir del Anthropic Economic Index — observaciones reales de millones ' +
        'de conversaciones con Claude. Mide que porcentaje de las tareas del cargo la IA ' +
        'puede ejecutar sin intervencion humana (automatizacion) versus que porcentaje las ' +
        'potencia sin reemplazar (augmentacion). Sobre 50% de automatizacion implica ' +
        'transformacion radical del rol; bajo 30% la IA opera como asistente.',
    },
  ]
}
