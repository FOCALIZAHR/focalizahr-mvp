// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY CALCULATOR — Totales del carrito + proyecciones del plan
// src/lib/services/efficiency/EfficiencyCalculator.ts
// ════════════════════════════════════════════════════════════════════════════
// Funciones puras. Sin BD, sin efectos laterales.
// Consumido por:
//   - CarritoBar (resumen en vivo)
//   - Plan Documento (métricas + proyecciones)
// ════════════════════════════════════════════════════════════════════════════

import type { LenteId } from './EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Decisión individual agregada al carrito (shape canónico del TASK).
 * El carrito deduplica por key compuesta `${tipo}:${id}` — si la misma
 * persona/cargo aparece desde dos lentes, el último actualiza.
 */
export interface DecisionItem {
  /** Identificador natural: employeeId | cargoId (socCode) | departmentId */
  id: string
  /** Lente que detectó la decisión (el último actualiza) */
  lenteId: LenteId
  /** Granularidad de la decisión */
  tipo: 'persona' | 'cargo' | 'area'
  /** Etiqueta humana (nombre persona / título cargo / nombre gerencia) */
  nombre: string
  /** Gerencia asociada (para el Plan Documento) */
  gerencia: string
  /** Ahorro mensual recurrente CLP */
  ahorroMes: number
  /** Inversión one-time CLP (finiquito, reskill, etc.) */
  finiquito: number
  /** Fracción de FTE liberado (0..1) */
  fteEquivalente: number
  /** Narrativa editable (inicializada desde el lente) */
  narrativa: string
  /** true cuando el CEO la aprueba desde el Plan Documento */
  aprobado: boolean
}

/** Helper para armar la key canónica del Map del carrito */
export function decisionKey(item: Pick<DecisionItem, 'tipo' | 'id'>): string {
  return `${item.tipo}:${item.id}`
}

export interface ResumenCarrito {
  decisiones: number           // cantidad (personas únicas)
  fteLiberados: number         // suma de fte
  ahorroMensual: number        // CLP
  ahorroAnual: number          // CLP
  inversion: number            // CLP
  paybackMeses: number | null  // null si ahorroMensual <= 0 (sin breakeven)
}

export interface ProyeccionMes {
  mes: number                  // 3 | 6 | 12 | 24 | 36
  neto: number                 // ahorroMensual*mes - inversion (CLP)
  esPayback: boolean           // marca el mes donde neto cruza 0
}

// ════════════════════════════════════════════════════════════════════════════
// CALCULAR RESUMEN DEL CARRITO
// ════════════════════════════════════════════════════════════════════════════

export function calcularResumenCarrito(
  decisiones: DecisionItem[]
): ResumenCarrito {
  if (!decisiones.length) {
    return {
      decisiones: 0,
      fteLiberados: 0,
      ahorroMensual: 0,
      ahorroAnual: 0,
      inversion: 0,
      paybackMeses: null,
    }
  }

  const fteLiberados = decisiones.reduce(
    (sum, d) => sum + (d.fteEquivalente ?? 0),
    0
  )
  const ahorroMensual = decisiones.reduce(
    (sum, d) => sum + (d.ahorroMes ?? 0),
    0
  )
  const inversion = decisiones.reduce((sum, d) => sum + (d.finiquito ?? 0), 0)

  // Payback — guard division por cero.
  // Si ahorroMensual <= 0 → null (sin breakeven).
  const paybackMeses =
    ahorroMensual > 0 ? Math.ceil(inversion / ahorroMensual) : null

  return {
    decisiones: decisiones.length,
    fteLiberados: Math.round(fteLiberados * 10) / 10,
    ahorroMensual,
    ahorroAnual: ahorroMensual * 12,
    inversion,
    paybackMeses,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CALCULAR PROYECCIONES (mes 3/6/12/24/36)
// ════════════════════════════════════════════════════════════════════════════

const HORIZONTES: ReadonlyArray<number> = [3, 6, 12, 24, 36]

export function calcularProyecciones(
  ahorroMes: number,
  inversion: number
): ProyeccionMes[] {
  // Mes exacto donde el acumulado cruza 0 (null si nunca).
  const mesPaybackExacto =
    ahorroMes > 0 ? Math.ceil(inversion / ahorroMes) : null

  return HORIZONTES.map(mes => {
    const neto = ahorroMes * mes - inversion
    // "esPayback" marca el primer horizonte ≥ mesPaybackExacto (si existe).
    const esPayback =
      mesPaybackExacto !== null &&
      mes >= mesPaybackExacto &&
      mes - mesPaybackExacto < 3 // solo el horizonte más cercano al cruce
    return { mes, neto, esPayback }
  })
}
