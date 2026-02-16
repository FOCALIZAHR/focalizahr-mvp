'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Radar, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
  Tooltip
} from 'recharts'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// 1. CONFIGURACIÓN VISUAL (FOCALIZAHR DESIGN SYSTEM v2)
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

// Paleta Oficial Enterprise v2 
const THEME = {
  self: { 
    stroke: '#22D3EE', // Cyan-400
    fill: 'rgba(34, 211, 238, 0.25)',
    hover: '#06B6D4' 
  },
  manager: { 
    stroke: '#A78BFA', // Purple-400
    fill: 'rgba(167, 139, 250, 0.25)',
    hover: '#8B5CF6'
  },
  peer: { 
    stroke: '#94A3B8', // Slate-400 (Neutral)
    fill: 'rgba(148, 163, 184, 0.15)',
    hover: '#64748B'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. COMPONENTE TOOLTIP (GLASSMORPHISM)
// ════════════════════════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl shadow-2xl z-[10000] min-w-[200px]">
      <p className="text-white font-semibold mb-3 text-sm border-b border-slate-700/50 pb-2">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                style={{ backgroundColor: entry.stroke }} 
              />
              <span className="text-slate-300 font-medium">{entry.name}</span>
            </div>
            <span 
              className="font-mono font-bold text-sm" 
              style={{ color: entry.stroke }}
            >
              {Number(entry.value).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 3. COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyRadarModal({
  isOpen,
  onClose,
  competencyScores,
  employeeName
}: CompetencyRadarModalProps) {
  
  // LOGICA DE RENDERIZADO (NO TOCAR - Mantiene el fix funcional)
  const [readyToDraw, setReadyToDraw] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen) {
      setReadyToDraw(false)
      timer = setTimeout(() => { setReadyToDraw(true) }, 300)
    } else {
      setReadyToDraw(false)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  // LÓGICA DE DATOS
  const chartData = useMemo(() => {
    if (!competencyScores) return []
    return competencyScores.map(c => ({
      competency: c.competencyName.length > 18 ? c.competencyName.slice(0, 16) + '...' : c.competencyName,
      fullCompetency: c.competencyName,
      self: Number(c.selfScore || 0),
      manager: Number(c.managerScore || 0),
      peer: Number(c.peerAvgScore || 0),
      fullMark: 5
    }))
  }, [competencyScores])

  const hasPeerData = useMemo(() => competencyScores?.some(c => c.peerAvgScore != null), [competencyScores])

  // INSIGHTS AUTOMÁTICOS (Top Strength & Top Gap)
  const insights = useMemo(() => {
    if (!competencyScores.length) return { top: null, gap: null }
    const sortedByScore = [...competencyScores].sort((a, b) => (b.managerScore || 0) - (a.managerScore || 0))
    const sortedByGap = [...competencyScores].sort((a, b) => 
      Math.abs((b.selfScore || 0) - (b.managerScore || 0)) - Math.abs((a.selfScore || 0) - (a.managerScore || 0))
    )
    return { top: sortedByScore[0], gap: sortedByGap[0] }
  }, [competencyScores])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          
          {/* Backdrop con Blur Intenso */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container con "Tesla Glow"  */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={cn(
              "relative w-full max-w-4xl bg-[#0F172A] border border-slate-800",
              "rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Efecto de Luz Superior (Tesla Glow) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)]" />

            {/* 2. Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Radar className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Análisis 360°</h2>
                  <p className="text-sm text-slate-400 font-medium">
                    {employeeName} <span className="text-slate-600 mx-1">•</span> {competencyScores.length} Competencias
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3. Área del Gráfico + Sidebar de Insights */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-[500px]">
              
              {/* Columna Izquierda: Gráfico */}
              <div className="flex-1 p-6 relative flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#0B1120]">
                {!readyToDraw && (
                  <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium tracking-widest uppercase">Generando Visualización...</span>
                  </div>
                )}

                {readyToDraw && (
                  <div className="w-full h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#334155" strokeDasharray="4 4" />
                        <PolarAngleAxis 
                          dataKey="competency" 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                        />
                        <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                        
                        {/* Capas del Radar con colores del Design System */}
                        <RechartsRadar
                          name="Autoevaluación"
                          dataKey="self"
                          stroke={THEME.self.stroke}
                          fill={THEME.self.fill}
                          fillOpacity={1}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                        <RechartsRadar
                          name="Evaluación Jefe"
                          dataKey="manager"
                          stroke={THEME.manager.stroke}
                          fill={THEME.manager.fill}
                          fillOpacity={1}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                        {hasPeerData && (
                          <RechartsRadar
                            name="Pares"
                            dataKey="peer"
                            stroke={THEME.peer.stroke}
                            fill={THEME.peer.fill}
                            fillOpacity={1}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            isAnimationActive={false}
                          />
                        )}
                        
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontFamily: 'Inter' }}
                          iconType="circle"
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Insights Rápidos (Sidebar) */}
              <div className="w-full lg:w-[300px] bg-slate-900/40 border-l border-slate-800/60 p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Insights Detectados
                </h3>

                {/* Card Fortaleza */}
                {insights.top && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors cursor-default group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-emerald-300">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-2xl font-bold text-emerald-400">
                        {insights.top.managerScore?.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-500/80 font-semibold uppercase tracking-wider mb-1">
                      Mayor Fortaleza
                    </p>
                    <p className="text-sm text-slate-200 font-medium leading-tight">
                      {insights.top.competencyName}
                    </p>
                  </div>
                )}

                {/* Card Brecha */}
                {insights.gap && Math.abs((insights.gap.selfScore || 0) - (insights.gap.managerScore || 0)) > 1 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-default group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:text-amber-300">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span className="text-2xl font-bold text-amber-400">
                        {Math.abs((insights.gap.selfScore || 0) - (insights.gap.managerScore || 0)).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-amber-500/80 font-semibold uppercase tracking-wider mb-1">
                      Diferencia de Percepción
                    </p>
                    <p className="text-sm text-slate-200 font-medium leading-tight">
                      {insights.gap.competencyName}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Tú: {insights.gap.selfScore?.toFixed(1)} vs Jefe: {insights.gap.managerScore?.toFixed(1)}
                    </p>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Datos sincronizados en tiempo real
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
})