'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Star, Pencil, Eye } from 'lucide-react'
import { getInitials } from '@/lib/utils/formatName'
import { StatusBadge } from './StatusBadge'
import InsightCard from './InsightCard'
import { PerformanceResultCard } from '@/components/performance/PerformanceResultCard'
import PotentialNineBoxCard from '@/components/performance/PotentialNineBoxCard'
import { GhostButton } from '@/components/ui/PremiumButton'
import type { SpotlightCardProps } from '@/types/evaluator-cinema'

export default function SpotlightCard({
  employee,
  onBack,
  onEvaluate,
  onViewSummary,
  onEvaluatePotential
}: SpotlightCardProps) {
  const isCompleted = employee.status === 'completed'
  const hasPotential = employee.potentialScore != null
  const needsPotential = isCompleted && !hasPotential
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">

        {/* LINEA TESLA */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />

        {/* Boton Volver */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </button>

        {/* COLUMNA IZQUIERDA: Identidad (35%) */}
        <div className="w-full md:w-[35%] bg-slate-900/50 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar con ring de estado */}
          <div className="relative mb-6">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
              {getInitials(employee.displayNameFull)}
            </div>

            {employee.status === 'ready' && (
              <div className="absolute inset-[-4px] rounded-full border border-cyan-500/30 animate-pulse" />
            )}

            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <StatusBadge status={employee.status} />
            </div>
          </div>

          {/* Info */}
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
              {employee.displayNameFull}
            </h2>
            <p className="text-sm text-slate-400 font-medium">{employee.position}</p>
            <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-widest">
              {employee.departmentName}
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: Inteligencia (65%) */}
        <div className="w-full md:w-[65%] p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-[#0F172A] to-[#162032]">

          {/* Grid de datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {employee.insights.map((insight, idx) => (
              insight.type === 'resultado' ? (
                <PerformanceResultCard
                  key={idx}
                  score={employee.avgScore ?? 0}
                  variant="compact"
                />
              ) : (
                <InsightCard
                  key={insight.type}
                  insight={insight}
                  rawDate={
                    insight.type === 'completedAt' ? employee.completedAt :
                    insight.type === 'dueDate' ? employee.dueDate :
                    undefined
                  }
                />
              )
            ))}
          </div>

          {/* Potencial y 9-Box */}
          {employee.potentialScore && (
            <div className="flex items-start gap-3 mb-4">
              <PotentialNineBoxCard
                potentialScore={employee.potentialScore}
                potentialLevel={employee.potentialLevel}
                nineBoxPosition={employee.nineBoxPosition}
                showTeslaLine={true}
                className="flex-1"
              />

              <GhostButton
                icon={Eye}
                size="sm"
                onClick={() => {
                  if (employee.status === 'completed' && employee.assignmentId) {
                    onViewSummary(employee.assignmentId)
                  }
                }}
              >
                Ver Resumen
              </GhostButton>
            </div>
          )}

          {/* CTAs dinámicos según estado */}
          <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-slate-800">

            {/* CASO 1: No completado → Comenzar Evaluación */}
            {!isCompleted && employee.participantToken && (
              <button
                onClick={() => onEvaluate(employee.participantToken!)}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:to-cyan-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <span>COMENZAR EVALUACION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* CASO 2: Completado SIN potencial → Evaluar Potencial + Resumen deshabilitado */}
            {needsPotential && (
              <>
                <button
                  onClick={onEvaluatePotential}
                  className="w-full h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:to-purple-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                >
                  <Star className="w-4 h-4" />
                  <span>EVALUAR POTENCIAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  disabled
                  className="w-full h-12 bg-slate-800/50 text-slate-500 cursor-not-allowed rounded-xl font-semibold text-sm flex items-center justify-center gap-3"
                >
                  <Eye className="w-4 h-4" />
                  <span>VER RESUMEN</span>
                </button>
                <p className="text-[10px] text-slate-600 text-center -mt-1">
                  Completa el potencial para ver el resumen
                </p>
              </>
            )}

            {/* CASO 3: Completado CON potencial → Info 9-Box + Resumen activo */}
            {isCompleted && hasPotential && (
              <>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Potencial:</span>
                    <span className="text-purple-400 font-semibold">
                      {employee.potentialScore?.toFixed(1)} ({employee.potentialLevel})
                    </span>
                  </div>
                  {employee.nineBoxPosition && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-400">9-Box:</span>
                      <span className="text-cyan-400 font-semibold">
                        {employee.nineBoxPosition.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onViewSummary(employee.assignmentId)}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:to-cyan-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                >
                  <Eye className="w-5 h-5" />
                  <span>VER RESUMEN COMPLETO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onEvaluatePotential}
                  className="w-full h-10 bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50 hover:text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Reevaluar Potencial</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
