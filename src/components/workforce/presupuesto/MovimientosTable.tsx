'use client'

// Paso 2 del Wizard: lista de movimientos de dotacion con impacto financiero.
// Patron G: narrativa → selector → tabla de evidencia → accion.
// Impacto calculado en backend (zero aritmetica frontend).

import { Trash2, AlertTriangle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCLPSigned } from './format'
import type { Movimiento } from './types'

interface MovimientosTableProps {
  movimientos: Movimiento[]
  onEliminar: (id: string) => void
  deltaHeadcount: number
  deltaMasaSalarial: number
  deltaCostoEmpresa: number
  onContinue: () => void
  onBack: () => void
  children?: React.ReactNode
}

const FAMILIA_LABELS: Record<string, string> = {
  alta_gerencia: 'Alta Gerencia',
  mandos_medios: 'Mandos Medios',
  profesionales: 'Profesionales',
  base_operativa: 'Base Operativa',
}

export default function MovimientosTable({
  movimientos,
  onEliminar,
  deltaHeadcount,
  deltaMasaSalarial,
  deltaCostoEmpresa,
  onContinue,
  onBack,
  children,
}: MovimientosTableProps) {
  const vacio = movimientos.length === 0

  return (
    <div className="space-y-6">
      {/* NARRATIVA — Patron G paso 2 */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Paso 2 · Movimientos
        </span>
        <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight">
          Quien entra.{' '}
          <span className="fhr-title-gradient">Quien sale.</span>
        </h2>
        <p className="text-sm text-slate-400 font-light leading-relaxed">
          Planifica los cambios de dotacion del proximo ciclo. El sistema calcula
          el impacto mensual contra el salario efectivo del cargo y bloquea
          movimientos que toquen al talento protegido.
        </p>
      </div>

      {/* SELECTOR — children del formulario */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 md:p-5">
        {children}
      </div>

      {/* EVIDENCIA — tabla de movimientos */}
      {vacio ? (
        <div className="rounded-xl border border-dashed border-slate-700/40 p-6 text-center">
          <p className="text-sm text-slate-400 font-light">
            Aun no hay movimientos. Agrega el primero arriba para ver el impacto.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-medium px-4 py-3">Familia</th>
                  <th className="text-left font-medium px-4 py-3">Cargo</th>
                  <th className="text-right font-medium px-4 py-3">Δ</th>
                  <th className="text-right font-medium px-4 py-3">Impacto mes</th>
                  <th className="text-right font-medium px-4 py-3">Anual</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr
                    key={m.id}
                    className={cn(
                      'border-b border-slate-800/40 transition-colors',
                      m.bloqueado
                        ? 'bg-red-500/5'
                        : 'hover:bg-slate-800/20',
                    )}
                  >
                    <td className="px-4 py-3 text-slate-300 font-light text-xs align-top">
                      {FAMILIA_LABELS[m.acotadoGroup] ?? m.acotadoGroup}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-light align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{m.cargo}</span>
                        {m.bloqueado && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            {m.motivo}
                          </span>
                        )}
                      </div>
                      {/* Warning sutil intocables — informativo, NO bloquea */}
                      {!m.bloqueado && m.delta < 0 && (m.warningIntocables ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-light mt-1">
                          <Shield className="w-3 h-3 text-cyan-400/70" />
                          <span>
                            Este cargo incluye {m.warningIntocables}{' '}
                            {m.warningIntocables === 1 ? 'persona' : 'personas'} con alto
                            dominio. El sistema las excluira del paso 4 automaticamente.
                          </span>
                        </div>
                      )}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-light tabular-nums',
                        m.delta > 0 ? 'text-emerald-400' : 'text-amber-400',
                      )}
                    >
                      {m.delta > 0 ? '+' : ''}
                      {m.delta}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-light tabular-nums',
                        m.bloqueado
                          ? 'text-slate-500'
                          : m.impactoMensual > 0
                            ? 'text-slate-300'
                            : 'text-emerald-400',
                      )}
                    >
                      {formatCLPSigned(m.impactoMensual)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-light tabular-nums',
                        m.bloqueado
                          ? 'text-slate-500'
                          : m.impactoAnual > 0
                            ? 'text-slate-300'
                            : 'text-emerald-400',
                      )}
                    >
                      {formatCLPSigned(m.impactoAnual)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => onEliminar(m.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800/30 border-t border-slate-700/50">
                  <td
                    className="px-4 py-3 text-cyan-400 font-medium text-xs uppercase tracking-wider"
                    colSpan={2}
                  >
                    Neto
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-light tabular-nums',
                      deltaHeadcount > 0
                        ? 'text-emerald-400'
                        : deltaHeadcount < 0
                          ? 'text-amber-400'
                          : 'text-slate-400',
                    )}
                  >
                    {deltaHeadcount > 0 ? '+' : ''}
                    {deltaHeadcount}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium tabular-nums">
                    {formatCLPSigned(deltaMasaSalarial)}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium tabular-nums">
                    {formatCLPSigned(deltaCostoEmpresa)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ACCION */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white font-light transition-colors"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium transition-colors"
        >
          Continuar a supuestos
        </button>
      </div>
    </div>
  )
}
