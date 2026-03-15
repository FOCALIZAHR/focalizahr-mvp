'use client'

// ════════════════════════════════════════════════════════════════════════════
// INSUFFICIENT DATA GUARD — Bloqueador visual cuando no hay datos suficientes
// Nunca mostrar matriz incompleta ni porcentajes enganosos
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface InsufficientDataGuardProps {
  message: string
  detail?: string
}

export default memo(function InsufficientDataGuard({ message, detail }: InsufficientDataGuardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-slate-500" />
        </div>
      </div>
      <p className="text-sm text-slate-300 mb-2">{message}</p>
      {detail && (
        <p className="text-xs text-slate-500">{detail}</p>
      )}
    </div>
  )
})
