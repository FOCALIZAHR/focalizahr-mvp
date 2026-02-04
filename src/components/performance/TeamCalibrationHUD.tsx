'use client'

// ════════════════════════════════════════════════════════════════════════════
// TEAM CALIBRATION HUD - Ranking Visual Compacto con Colores de Clasificación
// src/components/performance/TeamCalibrationHUD.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Formatear nombres legibles
// "VELIZ,IVALU XIMENA" → "Ivalu V."
// "REYES,PAULINA ISABEL" → "Paulina R."
// ════════════════════════════════════════════════════════════════════════════

function formatShortName(fullName: string): string {
  if (!fullName) return 'Sin nombre'

  // Si tiene coma, es formato "APELLIDO,NOMBRE"
  if (fullName.includes(',')) {
    const [apellido, nombres] = fullName.split(',').map(s => s.trim())
    const primerNombre = nombres?.split(' ')[0] || ''
    const inicialApellido = apellido?.[0] || ''

    // Capitalizar: "IVALU" → "Ivalu"
    const nombreCapitalizado = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase()

    return `${nombreCapitalizado} ${inicialApellido}.`
  }

  // Formato normal "Nombre Apellido"
  const parts = fullName.trim().split(' ')
  if (parts.length >= 2) {
    const nombre = parts[0]
    const apellido = parts[parts.length - 1]
    return `${nombre} ${apellido[0]}.`
  }

  return fullName
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface TeamMember {
  id: string
  name: string
  score: number  // 1-5
}

interface TeamCalibrationHUDProps {
  teamMembers: TeamMember[]
  currentEvaluateeId?: string
  maxVisible?: number
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function TeamCalibrationHUD({
  teamMembers,
  currentEvaluateeId,
  maxVisible = 5,
  className = ''
}: TeamCalibrationHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Ordenar por score descendente
  const sorted = [...teamMembers].sort((a, b) => b.score - a.score)
  const visibleMembers = isExpanded ? sorted : sorted.slice(0, maxVisible)
  const hasMore = sorted.length > maxVisible

  // Encontrar posición del evaluado actual
  const currentPosition = sorted.findIndex(m => m.id === currentEvaluateeId) + 1

  // Calcular promedio del equipo
  const teamAvg = sorted.length > 0
    ? sorted.reduce((sum, m) => sum + m.score, 0) / sorted.length
    : 0

  // Determinar si el evaluado actual está en top 10%
  const isTopPerformer = currentPosition > 0 && currentPosition <= Math.ceil(sorted.length * 0.1)

  return (
    <div className={`relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden ${className}`}>
      {/* ════════════════════════════════════════════════════════════════════
          LÍNEA TESLA PURPLE - Signature Element FocalizaHR
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
          boxShadow: '0 0 15px #A78BFA'
        }}
      />

      {/* Header - Compacto */}
      <div className="px-3 py-2 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span className="text-xs font-medium text-slate-300">
            CALIBRACIÓN
          </span>
        </div>
        {isTopPerformer && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
            TOP 10%
          </span>
        )}
      </div>

      {/* Lista de miembros - Compacta */}
      <div className="p-2 space-y-1">
        {visibleMembers.map((member) => {
          const rank = sorted.indexOf(member) + 1
          const classification = getPerformanceClassification(member.score)
          const isCurrentUser = member.id === currentEvaluateeId
          const barWidth = (member.score / 5) * 100
          const shortName = formatShortName(member.name)

          return (
            <div
              key={member.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                isCurrentUser
                  ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              {/* Posición */}
              <span className={`w-5 text-[10px] font-mono ${
                isCurrentUser ? 'text-cyan-400 font-bold' : 'text-slate-500'
              }`}>
                {String(rank).padStart(2, '0')}
              </span>

              {/* Nombre */}
              <span className={`flex-1 text-xs truncate ${
                isCurrentUser ? 'text-cyan-300 font-bold' : 'text-slate-300'
              }`}>
                {shortName}
                {isCurrentUser && <span className="ml-1 text-cyan-400 text-[10px]">◀</span>}
              </span>

              {/* Score con color de clasificación */}
              <span
                className={`w-8 text-xs text-right ${isCurrentUser ? 'font-bold' : 'font-medium'}`}
                style={{ color: classification.color }}
              >
                {member.score.toFixed(1)}
              </span>

              {/* Barra con color de clasificación */}
              <div className="w-16 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: classification.color
                  }}
                />
              </div>
            </div>
          )
        })}

        {/* Botón Mostrar más/menos */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-1.5 text-[10px] text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                +{sorted.length - maxVisible} más
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer - Compacto */}
      <div className="px-3 py-2 border-t border-slate-700/30 bg-slate-800/30">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">
            Promedio: <span className="text-slate-300 font-medium">{teamAvg.toFixed(2)}</span>
          </span>
          {currentPosition > 0 && (
            <span className="text-slate-500">
              Posición <span className="text-cyan-400 font-bold">#{currentPosition}</span> de {sorted.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
