'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye } from 'lucide-react'
import { getInitials } from '@/lib/utils/formatName'
import { StatusBadge } from './StatusBadge'
import StorytellingGuide from './StorytellingGuide'
import AvatarInfoModal from './AvatarInfoModal'
import type { SpotlightCardProps } from '@/types/evaluator-cinema'

export default function SpotlightCard({
  employee,
  onBack,
  onEvaluate,
  onViewSummary,
  onEvaluatePotential
}: SpotlightCardProps) {
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const hasPotential = employee.potentialScore != null

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

        {/* COLUMNA IZQUIERDA: Identidad (280px fijo) */}
        <div className="w-full md:w-[280px] md:flex-shrink-0 bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar CLICKEABLE con hover effect */}
          <div
            onClick={() => setShowAvatarModal(true)}
            className="relative mb-6 cursor-pointer group"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700 shadow-2xl group-hover:border-cyan-500/50 transition-colors">
              {getInitials(employee.displayNameFull)}
            </div>

            {/* Indicador de "clickeable" */}
            <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors flex items-center justify-center">
              <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Ver info
              </span>
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
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
              {employee.displayNameFull}
            </h2>
            <p className="text-sm text-slate-400 font-medium mb-1">
              {employee.position}
            </p>
            <p className="text-xs text-slate-600 mb-6">
              {employee.departmentName}
            </p>
          </div>

          {/* BOTÓN VER RESUMEN - Solo si tiene PT */}
          {hasPotential && (
            <button
              onClick={() => onViewSummary(employee.assignmentId)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50
                        hover:bg-slate-800 hover:border-cyan-500/30 transition-all
                        text-sm text-slate-400 hover:text-cyan-400 font-medium
                        flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Resumen
            </button>
          )}
        </div>

        {/* COLUMNA DERECHA: StorytellingGuide */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#162032]">
          <StorytellingGuide
            employee={{
              id: employee.id,
              displayName: employee.displayName,
              status: employee.status,
              avgScore: employee.avgScore,
              potentialScore: employee.potentialScore,
              potentialLevel: employee.potentialLevel,
              assignmentId: employee.assignmentId,
              participantToken: employee.participantToken
            }}
            onEvaluate={onEvaluate}
            onEvaluatePotential={onEvaluatePotential}
            onViewSummary={onViewSummary}
          />
        </div>
      </div>

      {/* Avatar Info Modal */}
      <AvatarInfoModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        employee={{
          displayName: employee.displayNameFull,
          position: employee.position,
          department: employee.departmentName,
          tenure: employee.tenure,
          status: employee.status,
          avgScore: employee.avgScore,
          potentialScore: employee.potentialScore,
          potentialLevel: employee.potentialLevel
        }}
      />
    </motion.div>
  )
}
