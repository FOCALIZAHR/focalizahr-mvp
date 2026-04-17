'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { formatNombre } from './format'

interface CambiosDetectados {
  hayCambios: boolean
  personasSalieron: string[]
  prescindiblesSalieron: string[]
  deltaHeadcount: number
  deltaMasaSalarial: number
  headcountActual: number
  headcountAlGuardar: number
}

interface ChangeBannerProps {
  scenarioName: string
  createdAt: string
  cambios: CambiosDetectados
  nombresPersonas?: Record<string, string>
  onRecalcular: () => void
  onDismiss: () => void
}

export default function ChangeBanner({
  scenarioName,
  createdAt,
  cambios,
  nombresPersonas = {},
  onRecalcular,
  onDismiss,
}: ChangeBannerProps) {
  if (!cambios.hayCambios) return null

  const fecha = new Date(createdAt).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const chips: string[] = []
  if (cambios.personasSalieron.length > 0) {
    const nombres = cambios.personasSalieron
      .slice(0, 3)
      .map(id => formatNombre(nombresPersonas[id]) || id.slice(0, 8))
      .join(', ')
    const extra = cambios.personasSalieron.length > 3
      ? ` y ${cambios.personasSalieron.length - 3} mas`
      : ''
    chips.push(`${cambios.personasSalieron.length} personas ya salieron: ${nombres}${extra}`)
  }
  if (cambios.deltaHeadcount > 0) {
    chips.push(`Headcount subio de ${cambios.headcountAlGuardar} a ${cambios.headcountActual}`)
  } else if (cambios.deltaHeadcount < 0) {
    chips.push(`Headcount bajo de ${cambios.headcountAlGuardar} a ${cambios.headcountActual}`)
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-amber-500/[0.04] border border-amber-500/20 p-4">
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }}
      />
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 font-light">
            <span className="text-white font-normal">{scenarioName}</span> fue guardado el {fecha}. Desde entonces:
          </p>
          <ul className="mt-2 space-y-1">
            {chips.map((c, i) => (
              <li key={i} className="text-xs text-slate-400 font-light flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400/60 mt-1.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={onRecalcular}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-normal hover:bg-amber-500/20 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Recalcular con datos actuales
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:text-slate-300 font-light transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
