'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION GAP BANNER — Potencial perdido como banner global
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface SuccessionGapBannerProps {
  count: number
}

export default memo(function SuccessionGapBanner({ count }: SuccessionGapBannerProps) {
  if (count <= 0) return null

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-sm text-slate-300">
        <span className="text-amber-400 font-medium">{count} {count === 1 ? 'persona' : 'personas'}</span>
        {' '}con perfil de sucesor natural sin nominacion formal.
        <span className="text-slate-500 ml-1">Potencial que se pierde si no se activa.</span>
      </p>
    </div>
  )
})
