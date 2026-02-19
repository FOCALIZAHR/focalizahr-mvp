// ════════════════════════════════════════════════════════════════════════════
// ORPHAN ALERT - Alerta de metas sin alinear
// src/components/goals/tree/OrphanAlert.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface OrphanAlertProps {
  count: number
  orphans: Array<{
    id: string
    title: string
    owner?: { id: string; fullName: string } | null
  }>
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const OrphanAlert = memo(function OrphanAlert({ count, orphans }: OrphanAlertProps) {
  const router = useRouter()

  if (count === 0) return null

  return (
    <div className="fhr-card p-4 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium mb-1">
            {count} {count === 1 ? 'meta sin alinear' : 'metas sin alinear'}
          </h4>
          <p className="text-sm text-slate-400 mb-3">
            Estas metas no están conectadas a la estrategia corporativa
          </p>

          {/* Preview de orphans */}
          <div className="space-y-1 mb-3">
            {orphans.slice(0, 3).map(orphan => (
              <button
                key={orphan.id}
                onClick={() => router.push(`/dashboard/metas/${orphan.id}`)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-400 transition-colors w-full text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="truncate">{orphan.title}</span>
                {orphan.owner && (
                  <span className="text-slate-500 flex-shrink-0">({orphan.owner.fullName})</span>
                )}
              </button>
            ))}
            {count > 3 && (
              <span className="text-xs text-slate-500 pl-3.5">
                y {count - 3} más...
              </span>
            )}
          </div>

          <GhostButton
            size="sm"
            icon={ArrowRight}
            onClick={() => router.push('/dashboard/metas?filter=orphan')}
          >
            Ver todas las metas huérfanas
          </GhostButton>
        </div>
      </div>
    </div>
  )
})
