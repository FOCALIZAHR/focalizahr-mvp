'use client'

// ════════════════════════════════════════════════════════════════════════════
// useWorkforceCascade — Step navigation + computed values para la cascada
// Todos los valores computados son frontend-only (sin llamadas backend)
// src/app/dashboard/workforce/hooks/useWorkforceCascade.ts
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import type { CascadeStep, WorkforceDiagnosticData } from '../types/workforce.types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
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

export interface WorkforceCascadeState {
  currentStep: CascadeStep
  stepIndex: number
  totalSteps: number
  computed: ComputedCascadeValues
  next: () => void
  back: () => void
  canGoNext: boolean
  canGoBack: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const STEP_ORDER: CascadeStep[] = [
  'portada', 'ancla', 'acto1', 'acto2', 'acto3', 'acto4', 'sintesis'
]

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useWorkforceCascade(data: WorkforceDiagnosticData): WorkforceCascadeState {
  const [stepIndex, setStepIndex] = useState(0)

  const currentStep = STEP_ORDER[stepIndex]
  const totalSteps = STEP_ORDER.length
  const canGoNext = stepIndex < totalSteps - 1
  const canGoBack = stepIndex > 0

  const next = () => { if (canGoNext) setStepIndex(i => i + 1) }
  const back = () => { if (canGoBack) setStepIndex(i => i - 1) }

  const computed = useMemo<ComputedCascadeValues>(() => {
    // ── Cantidad de hallazgos ─────────────────────────────────────────
    const cantidadHallazgos =
      data.zombies.count +
      data.flightRisk.count +
      data.redundancy.pairs.length +
      data.adoptionRisk.departments.length +
      data.seniorityCompression.opportunities.length

    // ── Costo de no actuar 12 meses ───────────────────────────────────
    const costoNoActuar12M =
      data.severanceLiability.totalSeverance +
      data.flightRisk.totalReplacementCost +
      data.inertiaCost.totalAnnual

    // ── Gerencia mas/menos expuesta ───────────────────────────────────
    const gerencias: GerenciaExposure[] = Object.entries(data.exposure.byCategory)
      .map(([name, val]) => ({ name, avgExposure: val.avgExposure, headcount: val.headcount }))
      .filter(g => g.headcount > 0)

    const sorted = [...gerencias].sort((a, b) => b.avgExposure - a.avgExposure)
    const gerenciaMas = sorted[0] ?? { name: 'Sin datos', avgExposure: 0, headcount: 0 }
    const gerenciaMenos = sorted[sorted.length - 1] ?? { name: 'Sin datos', avgExposure: 0, headcount: 0 }
    const cantidadGerencias = gerencias.length

    // ── Francotirador — gerencia con mayor concentracion de riesgo ────
    const deptImpact = new Map<string, { cost: number; hallazgos: number }>()

    const addImpact = (dept: string, cost: number) => {
      const existing = deptImpact.get(dept) ?? { cost: 0, hallazgos: 0 }
      existing.cost += cost
      existing.hallazgos += 1
      deptImpact.set(dept, existing)
    }

    // Agregar impacto de cada hallazgo por departamento
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
  }, [data])

  return {
    currentStep,
    stepIndex,
    totalSteps,
    computed,
    next,
    back,
    canGoNext,
    canGoBack,
  }
}
