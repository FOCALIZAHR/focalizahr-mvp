'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA DETAIL VIEW — Las 3 Palancas
// src/app/dashboard/executive-hub/components/PLTalent/shared/GerenciaDetailView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Vista completa dentro del panel (no drawer lateral).
// Diagnóstico → La pregunta → 3 palancas → CTA registrar conversación
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Send, BookOpen, Users, Repeat } from 'lucide-react'
import type { BrechaProductivaData, SemaforoLegalData } from '../PLTalent.types'
import { formatCurrency } from '../PLTalent.utils'

interface GerenciaDetailViewProps {
  gerenciaId: string
  gerenciaName: string
  brechaData: BrechaProductivaData
  semaforoData: SemaforoLegalData
  onBack: () => void
}

const PALANCAS = [
  {
    num: '①',
    icon: BookOpen,
    title: 'Acelerar Desarrollo',
    description: 'Invertir en cerrar la brecha de competencias. Los gerentes se comprometen con PDI individuales con plazo y seguimiento.',
    plazo: '6-12 meses',
    requiere: 'Compromiso gerencial + inversión en formación',
  },
  {
    num: '②',
    icon: Users,
    title: 'Exigir Accountability Gerencial',
    description: 'El problema no es solo la persona — es que su jefe no está actuando. Forzar reuniones de seguimiento con fecha y responsable.',
    plazo: '3-6 meses',
    requiere: 'Presión de dirección ejecutiva',
  },
  {
    num: '③',
    icon: Repeat,
    title: 'Planificar Recambio',
    description: 'Para los que llevan meses sin mejora con bajo compromiso: ¿por qué siguen aquí? Mantenerlos tiene un costo acumulativo.',
    plazo: 'Variable',
    requiere: 'Plan de sucesión + decisión ejecutiva',
  },
]

export const GerenciaDetailView = memo(function GerenciaDetailView({
  gerenciaId,
  gerenciaName,
  brechaData,
  semaforoData,
  onBack,
}: GerenciaDetailViewProps) {
  const [actionDone, setActionDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Find gerencia data
  const ger = brechaData.byGerencia.find(g => g.gerenciaId === gerenciaId)
  const gapMonthly = ger?.gapMonthly || 0
  const headcount = ger?.headcount || 0

  // Cross with semaforo for breakeven
  const legalPeople = semaforoData.people.filter(p =>
    p.departmentName.toLowerCase().includes(gerenciaName.toLowerCase().split(' ')[0])
  )
  const groupFiniquito = legalPeople.reduce((s, p) => s + p.finiquitoToday, 0)
  const breakevenMonths = gapMonthly > 0 && groupFiniquito > 0
    ? Math.round(groupFiniquito / gapMonthly)
    : null

  const handleRegister = useCallback(async () => {
    if (actionDone || loading) return
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch('/api/executive-hub/pl-talent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: gerenciaId,
          employeeName: gerenciaName,
          yearsOfService: 0,
          targetType: 'DEPARTMENT',
          actionCode: 'BRECHA_PRODUCTIVA',
          gapMonthly,
        }),
      })

      if (res.ok || res.status === 409) {
        setActionDone(true)
      }
    } catch (err) {
      console.error('[GerenciaDetail] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [actionDone, loading, gerenciaId, gerenciaName, gapMonthly])

  return (
    <div className="space-y-8">

      {/* ═══ BACK ═══ */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Mapa
      </button>

      {/* ═══ SECCIÓN 1: DIAGNÓSTICO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-center space-y-2"
      >
        <h3 className="text-xl font-light text-white">{gerenciaName}</h3>
        <p className="text-sm text-slate-400">
          <span className="text-purple-400 font-medium">{formatCurrency(gapMonthly)}/mes</span>
          {' · '}{headcount} persona{headcount !== 1 ? 's' : ''} bajo el estándar
        </p>
      </motion.div>

      {/* ═══ SECCIÓN 2: LA PREGUNTA ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center"
      >
        <p className="text-2xl md:text-3xl font-light text-slate-300 leading-relaxed max-w-lg mx-auto">
          ¿Por qué estas {headcount} personas siguen operando bajo las expectativas de su cargo?
        </p>
      </motion.div>

      {/* ═══ DIVIDER ═══ */}
      <div className="flex justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
      </div>

      {/* ═══ SECCIÓN 3: LAS 3 PALANCAS ═══ */}
      <div className="space-y-3">
        {PALANCAS.map((palanca, idx) => {
          const Icon = palanca.icon
          const isRecambio = idx === 2

          return (
            <motion.div
              key={palanca.num}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.08 }}
              className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium mb-1.5">{palanca.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {palanca.description}
                  </p>

                  {/* Breakeven for recambio palanca */}
                  {isRecambio && breakevenMonths && (
                    <p className="text-[11px] text-amber-400/70 font-light italic mb-3">
                      En {breakevenMonths} meses, haberlos mantenido costará más que haberlos reemplazado hoy.
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span>Plazo: {palanca.plazo}</span>
                    <span>·</span>
                    <span>{palanca.requiere}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ═══ SECCIÓN 4: CTA ÚNICO ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex justify-center pt-2"
      >
        <button
          onClick={handleRegister}
          disabled={actionDone || loading}
          className={cn(
            'flex items-center gap-2.5 px-7 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]',
            actionDone
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
              : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-900 shadow-[0_8px_20px_-6px_rgba(34,211,238,0.4)] hover:shadow-[0_8px_24px_-4px_rgba(34,211,238,0.5)]'
          )}
        >
          {actionDone ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Conversación registrada
            </>
          ) : loading ? (
            <span className="text-slate-600">Registrando...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Registrar que esta conversación se tuvo
            </>
          )}
        </button>
      </motion.div>

      {/* ═══ COACHING ═══ */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="text-[10px] text-slate-600 text-center leading-relaxed max-w-sm mx-auto"
      >
        Registrar la conversación crea trazabilidad ejecutiva. No elige la palanca — eso lo define la conversación con el gerente responsable.
      </motion.p>
    </div>
  )
})
