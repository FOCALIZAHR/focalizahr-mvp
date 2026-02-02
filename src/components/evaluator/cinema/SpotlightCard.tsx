'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye } from 'lucide-react'
import { getInitials } from '@/lib/utils/formatName'
import { StatusBadge } from './StatusBadge'
import InsightCard from './InsightCard'
import type { SpotlightCardProps } from '@/types/evaluator-cinema'

export default function SpotlightCard({
  employee,
  onBack,
  onEvaluate,
  onViewSummary
}: SpotlightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">

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
        <div className="w-full md:w-[65%] p-10 md:p-12 flex flex-col justify-between bg-gradient-to-br from-[#0F172A] to-[#162032]">

          {/* Grid de datos */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {employee.insights.map((insight) => (
              <InsightCard key={insight.type} insight={insight} />
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-800">

            {/* CTA Primario */}
            {employee.status !== 'completed' && employee.participantToken && (
              <button
                onClick={() => onEvaluate(employee.participantToken!)}
                className="flex-1 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:to-cyan-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <span>COMENZAR EVALUACION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {employee.status === 'completed' && (
              <button
                onClick={() => onViewSummary(employee.assignmentId)}
                className="flex-1 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all"
              >
                <Eye className="w-5 h-5" />
                <span>VER RESUMEN</span>
              </button>
            )}

            {/* CTA Secundario */}
            <button className="h-14 px-6 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all text-sm font-medium">
              Historial
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
