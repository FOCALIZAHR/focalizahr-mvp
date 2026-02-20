'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Check, Clock } from 'lucide-react'

interface ProgressDotsProps {
  hasED: boolean
  hasPT: boolean
  hasPDI: boolean
  edScore?: number | null
  edLevel?: string | null
  ptScore?: number | null
  ptLevel?: string | null
  className?: string
}

export default memo(function ProgressDots({
  hasED,
  hasPT,
  hasPDI,
  edScore,
  edLevel,
  ptScore,
  ptLevel,
  className
}: ProgressDotsProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 12
      })
    }
    setShowTooltip(true)
  }

  const dots = [
    {
      key: 'ED',
      label: 'Desempeño',
      done: hasED,
      value: hasED ? `${edScore?.toFixed(1) || '-'} · Completado` : 'Pendiente'
    },
    {
      key: 'PT',
      label: 'Potencial',
      done: hasPT,
      value: hasPT ? `${ptScore?.toFixed(1) || '-'} · ${ptLevel || 'Asignado'}` : 'Pendiente'
    },
    {
      key: 'PDI',
      label: 'Plan Desarrollo',
      done: hasPDI,
      value: hasPDI ? 'Creado' : 'Pendiente'
    }
  ]

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative cursor-pointer select-none", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* 3 Dots - TODOS PÚRPURA */}
        <div className="flex items-center justify-center gap-1.5">
          {dots.map((dot) => (
            <div
              key={dot.key}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                dot.done
                  ? "bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                  : "bg-slate-700"
              )}
            />
          ))}
        </div>

        {/* Labels */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[8px] text-slate-600 font-medium">ED</span>
          <span className="text-[8px] text-slate-600 font-medium">PT</span>
          <span className="text-[8px] text-slate-600 font-medium">PDI</span>
        </div>
      </div>

      {/* TOOLTIP CON PORTAL - Sin framer-motion para evitar conflicto de transform */}
      {mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: showTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          {/* Card - MISMO ESTILO QUE DashboardIndicators tooltip */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl w-56">
            {/* Línea Tesla arriba */}
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

            {/* Título - mismo estilo que DashboardIndicators */}
            <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                Estado de Evaluación
              </span>
            </div>

            {/* Contenido */}
            <div className="space-y-2 mt-2">
              {dots.map((dot) => (
                <div key={dot.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {dot.done ? (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className={cn(
                      "text-[10px] text-slate-400 leading-relaxed",
                      dot.done && "text-slate-300"
                    )}>
                      {dot.label}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    dot.done ? "text-purple-400" : "text-slate-600"
                  )}>
                    {dot.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Arrow - mismo estilo que DashboardIndicators */}
            <div className="absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent border-t-slate-950" />
          </div>
        </div>,
        document.body
      )}
    </>
  )
})
