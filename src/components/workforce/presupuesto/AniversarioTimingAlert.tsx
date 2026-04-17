'use client'

// Alerta ejecutiva en Paso 4 cuando hay aniversarios inminentes.
// Narrativa McKinsey: consecuencia de no actuar, sin instruccion.
// Solo aparece si hay aniversarios en los proximos 2 meses con costo > umbral.

import { Clock } from 'lucide-react'
import { formatCLP } from './format'
import type { AniversarioAgregado } from './types'

interface AniversarioTimingAlertProps {
  aniversarios: AniversarioAgregado[]
  mesActual: number
}

export default function AniversarioTimingAlert({
  aniversarios,
  mesActual,
}: AniversarioTimingAlertProps) {
  const inminentes = aniversarios.filter(a => {
    const mesesRestantes = (a.mes - mesActual + 12) % 12 || 12
    return mesesRestantes <= 2 && a.costoAdicional >= 500_000
  })

  if (inminentes.length === 0) return null

  const costoTotal = inminentes.reduce((s, a) => s + a.costoAdicional, 0)
  const personas = inminentes.reduce((s, a) => s + a.personasCount, 0)
  const proximoMes = inminentes.sort((a, b) => a.mes - b.mes)[0]

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/30">
      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1.5">
        <p className="text-sm text-amber-200 font-light leading-relaxed">
          {personas} {personas === 1 ? 'persona' : 'personas'} de la lista roja
          alcanza su aniversario antes de {proximoMes.mesNombre}.
        </p>
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          Si la decision se posterga, la base de finiquito sube en{' '}
          <span className="text-white font-medium">{formatCLP(costoTotal)}</span>.
          No es un ahorro — es un costo que se activa solo.
        </p>
      </div>
    </div>
  )
}
