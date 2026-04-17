// ════════════════════════════════════════════════════════════════════════════
// ACTO NARRATIVO — Una decisión con narrativa editable + autosave 1.5s
// src/components/efficiency/plan/ActoNarrativo.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cada acto = justificación al directorio de una decisión específica.
// El Plan NO es una tabla de datos — es la prosa del "por qué" de cada
// movimiento. El CEO edita si el copy no suena a él.
//
// - Línea lateral color por familia (cyan / purple / amber)
// - Narrativa en textarea auto-redimensionable
// - Autosave debounce 1.5s (lift state al padre)
// - [Aprobar esta decisión] / [Eliminar del plan]
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Trash2, CircleDot, CheckCircle2 } from 'lucide-react'
import type { DecisionItem } from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  LENTES_META,
  formatCLP,
  type FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// COLORES POR FAMILIA
// ════════════════════════════════════════════════════════════════════════════

const FAMILIA_COLORS: Record<FamiliaId, { accent: string; label: string }> = {
  choque_tecnologico: {
    accent: '#22D3EE',
    label: 'Diagnóstico',
  },
  grasa_organizacional: {
    accent: '#A78BFA',
    label: 'Oportunidad',
  },
  riesgo_financiero: {
    accent: '#F59E0B',
    label: 'Protección',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface ActoNarrativoProps {
  decision: DecisionItem
  /** Narrativa editada por el CEO — sobreescribe decision.narrativa si existe */
  narrativaEditada?: string
  /** Callback con debounce 1.5s al editar — el padre persiste */
  onNarrativaChange: (decisionKey: string, nuevaNarrativa: string) => void
  onApprove: () => void
  onRevoke: () => void
  onRemove: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function ActoNarrativo({
  decision,
  narrativaEditada,
  onNarrativaChange,
  onApprove,
  onRevoke,
  onRemove,
}: ActoNarrativoProps) {
  const familia = LENTES_META[decision.lenteId].familia
  const color = FAMILIA_COLORS[familia]

  // Local editable text — autosave con debounce lift state al padre
  const initial = narrativaEditada ?? decision.narrativa ?? ''
  const [localText, setLocalText] = useState(initial)
  const [saving, setSaving] = useState<'idle' | 'pending' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincroniza cuando cambia la prop externa (ej. reset desde el padre)
  useEffect(() => {
    setLocalText(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision.id, narrativaEditada])

  // Autosave debounce 1.5s
  useEffect(() => {
    if (localText === initial) {
      setSaving('idle')
      return
    }
    setSaving('pending')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onNarrativaChange(`${decision.tipo}:${decision.id}`, localText)
      setSaving('saved')
      // Vuelve a idle 1.2s después
      setTimeout(() => setSaving('idle'), 1200)
    }, 1500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localText])

  const aprobado = decision.aprobado

  return (
    <article
      className={`relative rounded-xl bg-slate-900/50 backdrop-blur-xl border transition-colors ${
        aprobado
          ? 'border-emerald-500/40'
          : 'border-slate-800/70 hover:border-slate-700'
      }`}
      style={
        aprobado
          ? { boxShadow: '0 0 18px rgba(16, 185, 129, 0.15)' }
          : undefined
      }
    >
      {/* Línea lateral color familia */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-xl"
        style={{
          background: `linear-gradient(to bottom, ${color.accent}, transparent)`,
          boxShadow: `0 0 12px ${color.accent}40`,
        }}
        aria-hidden
      />

      <div className="pl-6 pr-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-[0.18em] font-medium"
              style={{ color: color.accent }}
            >
              {color.label} · {LENTES_META[decision.lenteId].titulo}
            </p>
            <h3 className="text-base font-medium text-white mt-1 leading-tight">
              {formatNombre(decision.nombre)}
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              {decision.gerencia} · {formatTipo(decision.tipo)}
            </p>
          </div>
          <div className="flex-shrink-0">
            {aprobado ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Aprobada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-slate-700 bg-slate-800/60 text-slate-400">
                <CircleDot className="w-3 h-3" />
                Borrador
              </span>
            )}
          </div>
        </div>

        {/* Monto */}
        <div className="flex items-baseline gap-5 text-xs mb-4 pb-4 border-b border-slate-800/50">
          {decision.ahorroMes > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Ahorro / mes
              </p>
              <p className="text-sm font-medium text-emerald-300 mt-0.5">
                {formatCLP(decision.ahorroMes)}
              </p>
            </div>
          )}
          {decision.finiquito > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                Inversión
              </p>
              <p className="text-sm font-medium text-amber-300 mt-0.5">
                {formatCLP(decision.finiquito)}
              </p>
            </div>
          )}
          {decision.fteEquivalente > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">
                FTE
              </p>
              <p className="text-sm font-medium text-cyan-300 mt-0.5">
                {decision.fteEquivalente.toLocaleString('es-CL', {
                  maximumFractionDigits: 1,
                })}
              </p>
            </div>
          )}
        </div>

        {/* Narrativa editable */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              La justificación al directorio
            </p>
            <AutoSaveIndicator state={saving} />
          </div>
          <textarea
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            rows={Math.max(3, Math.min(10, localText.split('\n').length + 1))}
            className="w-full text-sm text-slate-200 font-light leading-relaxed bg-slate-900/70 border border-slate-800 rounded-md p-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors resize-none"
            placeholder="Edita la narrativa si el copy no suena a ti…"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar del plan
          </button>

          {aprobado ? (
            <button
              onClick={onRevoke}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              Revertir aprobación
            </button>
          ) : (
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/25 transition-colors"
              style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)' }}
            >
              <Check className="w-3.5 h-3.5" />
              Aprobar esta decisión
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// AUTO-SAVE INDICATOR
// ════════════════════════════════════════════════════════════════════════════

function AutoSaveIndicator({
  state,
}: {
  state: 'idle' | 'pending' | 'saved'
}) {
  if (state === 'idle') return null
  return (
    <span
      className={`text-[10px] font-light transition-colors ${
        state === 'pending' ? 'text-slate-500' : 'text-emerald-400'
      }`}
    >
      {state === 'pending' ? 'guardando…' : '✓ guardado'}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE FORMATEO — limpia sufijos internos (· timing, · blindaje-*, etc.)
// ════════════════════════════════════════════════════════════════════════════

function formatNombre(nombre: string): string {
  // Remueve el marker interno "· xxx" al final (convención L2/L5/L7L8/L9)
  return nombre.replace(/\s*·\s*[a-z0-9_\-]+$/i, '').trim()
}

function formatTipo(tipo: 'persona' | 'cargo' | 'area'): string {
  return tipo === 'persona'
    ? 'persona'
    : tipo === 'cargo'
    ? 'cargo'
    : 'área'
}
