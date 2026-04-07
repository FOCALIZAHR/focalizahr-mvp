'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES PORTADA — Smart Router Orchestrator
// Clonado de CinemaModeOrchestrator, adaptado a descriptores.
// MissionControl (lobby) + Rail (colapsable bottom) + Victory confetti
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import DescriptoresHeader from './DescriptoresHeader'
import DescriptoresMissionControl from './DescriptoresMissionControl'
import DescriptoresRail from './DescriptoresRail'
import type { DescriptorSummary, PositionWithStatus } from '@/lib/services/JobDescriptorService'

interface DescriptoresPortadaProps {
  summary: DescriptorSummary
  positions: PositionWithStatus[]
  onRefresh?: () => void
}

export default memo(function DescriptoresPortada({
  summary,
  positions,
  onRefresh,
}: DescriptoresPortadaProps) {
  const router = useRouter()
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'pendientes' | 'confirmados'>(
    summary.pending > 0 ? 'pendientes' : 'confirmados'
  )

  const allDone = summary.totalPositions > 0 && summary.pending === 0

  // Victory confetti when all done
  useEffect(() => {
    if (!allDone) return
    const victoryKey = 'descriptores-victory-shown'
    if (sessionStorage.getItem(victoryKey)) return
    sessionStorage.setItem(victoryKey, 'true')

    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#22D3EE', '#A78BFA', '#FFFFFF']
    ;(function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }, [allDone])

  const handleToggleRail = useCallback(() => {
    setIsRailExpanded(prev => !prev)
  }, [])

  const handleSelectFromRail = useCallback((jobTitle: string) => {
    router.push(`/dashboard/descriptores/${encodeURIComponent(jobTitle)}`)
  }, [router])

  const handleStartFromCTA = useCallback((jobTitle: string) => {
    router.push(`/dashboard/descriptores/${encodeURIComponent(jobTitle)}`)
  }, [router])

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <DescriptoresHeader
        totalPositions={summary.totalPositions}
        confirmed={summary.confirmed}
      />

      {/* Stage — MissionControl centrado */}
      <div className={cn(
        'flex-1 relative flex items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[320px]' : 'mb-[50px]'
      )}>
        <AnimatePresence mode="wait">
          <DescriptoresMissionControl
            key="lobby"
            summary={summary}
            positions={positions}
            onStart={handleStartFromCTA}
          />
        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded */}
      <AnimatePresence>
        {isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            onClick={handleToggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail */}
      <DescriptoresRail
        positions={positions}
        selectedJobTitle={null}
        isExpanded={isRailExpanded}
        activeTab={activeTab}
        onToggle={handleToggleRail}
        onSelect={handleSelectFromRail}
        onTabChange={setActiveTab}
      />
    </div>
  )
})
