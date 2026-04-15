'use client'

// ════════════════════════════════════════════════════════════════════════════
// CROSS INTELLIGENCE MODAL — Detalle del Acto 3 Amplificador (v3.1)
//
// 3 tabs: Fuga por segmento | Clima por area | Compresion por cargo
// Portal a document.body, z-[9999], Tesla line amber
// src/app/dashboard/workforce/components/cascada/modals/CrossIntelligenceModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupBySegment } from '@/lib/workforce/segmentUtils'
import { formatCurrency } from '../../../utils/format'
import type { WorkforceDiagnosticData, RetentionEntry } from '../../../types/workforce.types'

interface CrossIntelligenceModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

type TabKey = 'fuga' | 'clima' | 'compresion'

export default function CrossIntelligenceModal({ data, onClose }: CrossIntelligenceModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('fuga')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const fugaSegments = useMemo(() => {
    // Mismo source que el Acto 3 Amplificador: retentionPriority filtrado
    // por (intocable+valioso) × alta exposicion
    const fugaRisk = data.retentionPriority.ranking.filter(
      r =>
        (r.tier === 'intocable' || r.tier === 'valioso') &&
        (r.focalizaScore ?? r.observedExposure) > 0.5 &&
        r.acotadoGroup &&
        r.standardCategory
    )
    const grouped = groupBySegment(fugaRisk)
    return Array.from(grouped.entries())
      .map(([key, members]) => ({ key, members }))
      .sort((a, b) => b.members.length - a.members.length)
  }, [data.retentionPriority.ranking])

  const climaAreas = useMemo(() => {
    return [...data.adoptionRisk.departments].sort((a, b) => a.avgEngagement - b.avgEngagement)
  }, [data.adoptionRisk.departments])

  const compresionItems = useMemo(() => {
    return [...data.seniorityCompression.opportunities].sort((a, b) => b.annualSavings - a.annualSavings)
  }, [data.seniorityCompression.opportunities])

  const fugaTotal = useMemo(
    () => fugaSegments.reduce((s, seg) => s + seg.members.length, 0),
    [fugaSegments]
  )

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'fuga', label: 'Fuga', count: fugaTotal },
    { key: 'clima', label: 'Clima', count: data.adoptionRisk.departments.length },
    { key: 'compresion', label: 'Compresión', count: data.seniorityCompression.opportunities.length },
  ]

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
            boxShadow: '0 0 20px #F59E0B',
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* Header */}
        <div className="p-6 pt-8 border-b border-slate-800/50 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Cruces que multiplican el riesgo
          </p>
          <h2 className="text-xl font-light text-white">Tres señales independientes</h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800/50 px-6 flex-shrink-0">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2',
                  activeTab === tab.key
                    ? 'text-amber-400 border-amber-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] text-slate-600 font-mono">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'fuga' && (
            <FugaTab segments={fugaSegments} />
          )}
          {activeTab === 'clima' && (
            <ClimaTab areas={climaAreas} />
          )}
          {activeTab === 'compresion' && (
            <CompresionTab items={compresionItems} />
          )}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function FugaTab({ segments }: { segments: { key: string; members: RetentionEntry[] }[] }) {
  if (segments.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">Sin riesgos de fuga clasificados.</p>
  }
  return (
    <div className="space-y-4">
      {segments.map(seg => (
        <div key={seg.key} className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/30 pb-1.5">
            <span className="text-sm text-cyan-400 font-light">{seg.key}</span>
            <span className="text-xs text-slate-500 font-mono">{seg.members.length} en riesgo</span>
          </div>
          <div className="space-y-1 pl-1">
            {seg.members.map(p => (
              <div
                key={p.employeeId}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-slate-300 font-light">{p.employeeName}</span>
                  <span className="text-slate-500 ml-2">{p.position}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-slate-400 font-mono text-[10px]">
                    exp {Math.round(p.observedExposure * 100)}%
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-wider',
                      p.tier === 'intocable' ? 'text-violet-400' : 'text-cyan-400'
                    )}
                  >
                    {p.tier === 'intocable' ? 'Intocable' : 'Valioso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ClimaTab({ areas }: { areas: WorkforceDiagnosticData['adoptionRisk']['departments'] }) {
  if (areas.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">Sin áreas con clima crítico.</p>
  }
  return (
    <div className="space-y-3">
      {areas.map(area => {
        const climaColor =
          area.avgEngagement < 2 ? 'text-red-400' :
          area.avgEngagement < 3 ? 'text-amber-400' : 'text-slate-300'
        return (
          <div
            key={area.departmentId}
            className="flex items-center justify-between border-b border-slate-800/30 py-3"
          >
            <div>
              <p className="text-sm text-cyan-400 font-light">{area.departmentName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {area.headcount} personas · exposición {Math.round(area.avgExposure * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className={cn('text-lg font-light font-mono', climaColor)}>
                {area.avgEngagement.toFixed(1)}
              </p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">compromiso</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompresionTab({ items }: { items: WorkforceDiagnosticData['seniorityCompression']['opportunities'] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">Sin oportunidades de compresión detectadas.</p>
  }
  return (
    <div className="space-y-3">
      {items.map((opp, i) => (
        <div
          key={i}
          className="border-b border-slate-800/30 py-3 flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-cyan-400 font-light">{opp.position}</p>
            <p className="text-xs text-slate-500 mt-0.5">{opp.departmentName}</p>
            {opp.juniorCandidate && (
              <p className="text-[10px] text-slate-600 mt-1">
                Candidato: {opp.juniorCandidate.name}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-purple-400 font-mono text-sm">{formatCurrency(opp.annualSavings)}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">ahorro/año</p>
          </div>
        </div>
      ))}
    </div>
  )
}
