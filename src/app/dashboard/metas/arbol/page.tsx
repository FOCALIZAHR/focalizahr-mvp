// ════════════════════════════════════════════════════════════════════════════
// ALIGNMENT TREE PAGE - Visualización del árbol de alineación estratégica
// src/app/dashboard/metas/arbol/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { ArrowLeft, TreePine } from 'lucide-react'
import { useAlignmentTree } from '@/hooks/useAlignmentTree'
import { AlignmentTree } from '@/components/goals/tree/AlignmentTree'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function AlignmentTreePage() {
  const router = useRouter()
  const { tree, orphans, report, isLoading, isError, refresh } = useAlignmentTree()

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleRefresh = useCallback(() => {
    refresh()
  }, [refresh])

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Metas</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
              <TreePine className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="fhr-hero-title text-2xl md:text-3xl">
                Árbol de{' '}
                <span className="fhr-title-gradient">Alineación</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Visualiza cómo las metas se conectan con la estrategia
              </p>
            </div>
          </div>
        </div>

        {/* Tree */}
        {isError ? (
          <div className="fhr-card p-8 text-center">
            <p className="text-red-400 mb-2">No pudimos cargar el árbol de alineación</p>
            <p className="text-slate-400 text-sm">Revisa tu conexión y reintenta</p>
          </div>
        ) : (
          <AlignmentTree
            tree={tree}
            orphans={orphans}
            report={report}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  )
}
