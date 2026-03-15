'use client'

// ════════════════════════════════════════════════════════════════════════════
// CHECKOUT PANEL — 3 acciones ejecutivas por patron
// NOTIFY_HRBP / SCHEDULE_COMMITTEE / FLAG_FOR_REVIEW
// Registra en TACActionLog quien vio el riesgo y que hizo
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Flag, Loader2, Check } from 'lucide-react'

interface CheckoutPanelProps {
  gerenciaId: string
  gerenciaName: string
  pattern: string
}

const ACTIONS = [
  {
    key: 'NOTIFY_HRBP',
    label: 'Notificar HR Business Partner',
    description: 'Envia alerta al equipo de RRHH para que active protocolo',
    icon: Bell,
    color: 'text-cyan-400',
    bgHover: 'hover:bg-cyan-500/10 hover:border-cyan-500/30'
  },
  {
    key: 'SCHEDULE_COMMITTEE',
    label: 'Agendar Comite de Riesgo',
    description: 'Programa reunion de comite para revisar esta gerencia',
    icon: Calendar,
    color: 'text-purple-400',
    bgHover: 'hover:bg-purple-500/10 hover:border-purple-500/30'
  },
  {
    key: 'FLAG_FOR_REVIEW',
    label: 'Marcar para revision trimestral',
    description: 'Agrega badge visible en el mapa para seguimiento',
    icon: Flag,
    color: 'text-amber-400',
    bgHover: 'hover:bg-amber-500/10 hover:border-amber-500/30'
  }
]

export default function CheckoutPanel({
  gerenciaId,
  gerenciaName,
  pattern
}: CheckoutPanelProps) {
  const [executing, setExecuting] = useState<string | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setExecuting(action)
    setError(null)

    try {
      const res = await fetch('/api/talent-actions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gerenciaId, pattern, action })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(data.error || `Error ${res.status}`)
      }

      setCompleted(prev => new Set([...prev, action]))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExecuting(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Acciones</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ACTIONS.map(action => {
          const Icon = action.icon
          const isCompleted = completed.has(action.key)
          const isExecuting = executing === action.key

          return (
            <motion.button
              key={action.key}
              onClick={() => !isCompleted && handleAction(action.key)}
              disabled={isExecuting || isCompleted}
              whileHover={!isCompleted ? { scale: 1.01 } : {}}
              whileTap={!isCompleted ? { scale: 0.98 } : {}}
              className={`text-left p-3 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-emerald-500/5 border-emerald-500/20 cursor-default'
                  : `bg-slate-900/50 border-slate-800 ${action.bgHover} cursor-pointer`
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : isCompleted ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${action.color}`} />
                )}
                <span className={`text-xs font-medium ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                  {isCompleted ? 'Listo' : action.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {action.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs text-amber-400">{error}</p>
      )}
    </div>
  )
}
