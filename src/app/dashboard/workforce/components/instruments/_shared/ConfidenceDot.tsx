// ════════════════════════════════════════════════════════════════════════════
// CONFIDENCE DOT — radical honesty del Workforce Deck
// src/app/dashboard/workforce/components/instruments/_shared/ConfidenceDot.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cada instrumento muestra el confidence del motor backend que consume.
// cyan = high · amber = medium · slate = low
// ════════════════════════════════════════════════════════════════════════════

import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Confidence = 'high' | 'medium' | 'low'

interface ConfidenceDotProps {
  confidence: Confidence
}

export default function ConfidenceDot({ confidence }: ConfidenceDotProps) {
  const color =
    confidence === 'high'
      ? 'bg-cyan-400'
      : confidence === 'medium'
      ? 'bg-amber-400'
      : 'bg-slate-500'

  const label =
    confidence === 'high' ? 'ALTA' : confidence === 'medium' ? 'MEDIA' : 'BAJA'

  const textColor =
    confidence === 'high'
      ? 'text-cyan-400'
      : confidence === 'medium'
      ? 'text-amber-400'
      : 'text-slate-500'

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/5">
      <ShieldCheck className={cn('w-3 h-3', textColor)} />
      <div className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
        Confianza · <span className={textColor}>{label}</span>
      </span>
    </div>
  )
}
