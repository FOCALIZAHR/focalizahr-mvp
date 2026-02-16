'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY RADAR MODAL - Visualización Radar de Competencias
// src/components/performance/CompetencyRadarModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Recharts RadarChart con diseño premium FocalizaHR
// Muestra Self vs Manager en un vistazo
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Radar } from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface CompetencyScore {
  competencyCode: string
  competencyName: string
  selfScore: number | null
  managerScore: number | null
  peerAvgScore?: number | null
  overallAvgScore: number
}

interface CompetencyRadarModalProps {
  isOpen: boolean
  onClose: () => void
  competencyScores: CompetencyScore[]
  employeeName: string
}

// ════════════════════════════════════════════════════════════════════════════
// COLORES FOCALIZAHR
// ════════════════════════════════════════════════════════════════════════════

const COLORS = {
  self: {
    stroke: '#3B82F6',      // Blue
    fill: 'rgba(59, 130, 246, 0.25)'
  },
  manager: {
    stroke: '#10B981',      // Emerald
    fill: 'rgba(16, 185, 129, 0.25)'
  },
  peer: {
    stroke: '#A78BFA',      // Purple
    fill: 'rgba(167, 139, 250, 0.25)'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-white mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.value?.toFixed(1) ?? '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyRadarModal({
  isOpen,
  onClose,
  competencyScores,
  employeeName
}: CompetencyRadarModalProps) {
  
  // Preparar datos para Recharts
  const chartData = useMemo(() => {
    return competencyScores.map(c => ({
      competency: c.competencyName.length > 15 
        ? c.competencyName.slice(0, 12) + '...' 
        : c.competencyName,
      fullName: c.competencyName,
      self: c.selfScore ?? 0,
      manager: c.managerScore ?? 0,
      peer: c.peerAvgScore ?? 0
    }))
  }, [competencyScores])

  // Verificar si hay datos de peer
  const hasPeerData = useMemo(() => {
    return competencyScores.some(c => c.peerAvgScore !== null && c.peerAvgScore !== undefined)
  }, [competencyScores])

  // Obtener primer nombre
  const firstName = employeeName.split(' ').slice(-2, -1)[0] || employeeName.split(' ')[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden z-50 flex flex-col"
          >
            {/* Línea Tesla superior */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Radar className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">
                    Radar de Competencias
                  </h2>
                  <p className="text-sm text-slate-500">
                    {firstName} · {competencyScores.length} competencias
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chart */}
            <div className="flex-1 p-6 min-h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid 
                    stroke="rgba(148, 163, 184, 0.2)" 
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis 
                    dataKey="competency" 
                    tick={{ 
                      fill: 'rgba(148, 163, 184, 0.8)', 
                      fontSize: 11,
                      fontWeight: 500
                    }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }}
                    tickCount={6}
                    axisLine={false}
                  />
                  
                  {/* Self */}
                  <RechartsRadar
                    name="Autoevaluación"
                    dataKey="self"
                    stroke={COLORS.self.stroke}
                    fill={COLORS.self.fill}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS.self.stroke }}
                  />
                  
                  {/* Manager */}
                  <RechartsRadar
                    name="Tu evaluación"
                    dataKey="manager"
                    stroke={COLORS.manager.stroke}
                    fill={COLORS.manager.fill}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS.manager.stroke }}
                  />
                  
                  {/* Peer (si hay datos) */}
                  {hasPeerData && (
                    <RechartsRadar
                      name="Pares"
                      dataKey="peer"
                      stroke={COLORS.peer.stroke}
                      fill={COLORS.peer.fill}
                      strokeWidth={2}
                      dot={{ r: 4, fill: COLORS.peer.stroke }}
                    />
                  )}

                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => (
                      <span className="text-slate-300">{value}</span>
                    )}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer con leyenda */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.self.stroke }} />
                  <span>Cómo se percibe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.manager.stroke }} />
                  <span>Cómo lo ves tú</span>
                </div>
                {hasPeerData && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.peer.stroke }} />
                    <span>Cómo lo ven pares</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})