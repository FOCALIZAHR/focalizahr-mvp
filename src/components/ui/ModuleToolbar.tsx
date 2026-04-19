'use client'

// ModuleToolbar — barra lateral flotante de diagnostico rapido.
// Glassmorphism, 36px colapsada, panel expandible al click.
// Reutilizable en cualquier modulo con props genericas.
// Mobile (<640px): se oculta.

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, type LucideIcon } from 'lucide-react'

export interface ToolBreakdown {
  label: string
  value: number
  formatted: string
}

export interface ToolDefinition {
  id: string
  label: string
  icon: LucideIcon
  metric: string
  unit?: string
  color: string
  breakdown: ToolBreakdown[]
  narrative?: string
}

interface ModuleToolbarProps {
  tools: ToolDefinition[]
  ctaLabel?: string
  onCTA?: () => void
}

const GLASS_BG = 'rgba(15,23,42,0.60)'
const GLASS_BLUR = 'blur(24px)'
const GLASS_BORDER = '0.5px solid rgba(255,255,255,0.08)'
const GLASS_SHADOW = '0 0 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'

export default function ModuleToolbar({ tools, ctaLabel, onCTA }: ModuleToolbarProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleToggle = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id))
  }, [])

  if (isMobile) return null

  const activeTool = tools.find(t => t.id === activeId) ?? null
  const hoveredTool = tools.find(t => t.id === hoveredId)

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[55] flex flex-row-reverse items-center">
      {/* Icon strip */}
      <div
        className="flex flex-col gap-0.5 p-[5px] rounded-[14px]"
        style={{
          background: GLASS_BG,
          backdropFilter: GLASS_BLUR,
          WebkitBackdropFilter: GLASS_BLUR,
          border: GLASS_BORDER,
          boxShadow: GLASS_SHADOW,
        }}
      >
        {tools.map(t => {
          const Icon = t.icon
          const isActive = activeId === t.id
          return (
            <div key={t.id} className="relative">
              <button
                type="button"
                onClick={() => handleToggle(t.id)}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="toolbar-indicator"
                    className="absolute top-1 left-[30%] right-[30%] h-0.5 rounded-full"
                    style={{
                      background: '#22D3EE',
                      boxShadow: '0 0 6px rgba(34,211,238,0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className="w-[15px] h-[15px] transition-all duration-200"
                  style={{
                    color: isActive ? '#22D3EE' : 'rgba(148,163,184,0.30)',
                    filter: isActive ? 'drop-shadow(0 0 4px rgba(34,211,238,0.3))' : 'none',
                  }}
                />
              </button>

              {/* Custom tooltip — slide left on hover */}
              <AnimatePresence>
                {hoveredId === t.id && activeId !== t.id && (
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-light text-slate-300"
                    style={{
                      background: GLASS_BG,
                      backdropFilter: GLASS_BLUR,
                      WebkitBackdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                    }}
                  >
                    {t.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {ctaLabel && onCTA && (
          <>
            <div className="h-px mx-2 my-[3px] bg-slate-700/[0.15]" />
            <div className="relative">
              <button
                type="button"
                onClick={onCTA}
                onMouseEnter={() => setHoveredId('__cta__')}
                onMouseLeave={() => setHoveredId(null)}
                className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-200"
                style={{ background: 'rgba(34,211,238,0.06)' }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400/50" />
              </button>
              <AnimatePresence>
                {hoveredId === '__cta__' && (
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-light text-cyan-400/70"
                    style={{
                      background: GLASS_BG,
                      backdropFilter: GLASS_BLUR,
                      WebkitBackdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                    }}
                  >
                    {ctaLabel}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0, width: 0, marginRight: 0 }}
            animate={{ opacity: 1, width: 280, marginRight: 8 }}
            exit={{ opacity: 0, width: 0, marginRight: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div
              className="w-[280px] rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                boxShadow: '0 0 40px rgba(34,211,238,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* Tesla line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                  boxShadow: '0 0 10px rgba(34,211,238,0.15)',
                }}
              />

              {/* Header */}
              <div className="flex justify-between items-center mb-3.5">
                <div className="flex items-center gap-[7px]">
                  <activeTool.icon
                    className="w-[13px] h-[13px]"
                    style={{
                      color: activeTool.color,
                      filter: `drop-shadow(0 0 4px ${activeTool.color}40)`,
                    }}
                  />
                  <span className="text-xs font-normal text-slate-200">{activeTool.label}</span>
                </div>
                <div className="flex items-baseline gap-[3px]">
                  <span
                    className="text-lg font-extralight tabular-nums"
                    style={{ color: activeTool.color }}
                  >
                    {activeTool.metric}
                  </span>
                  {activeTool.unit && (
                    <span className="text-[9px] text-slate-500/35 font-light">{activeTool.unit}</span>
                  )}
                </div>
              </div>

              {/* Breakdown — label izquierda + valor derecha (sin barra).
                  El valor se colorea con el accent del tool activo; preserva
                  la jerarquía tipográfica del diseño previo. */}
              <div className="flex flex-col gap-[5px]">
                {[...activeTool.breakdown]
                  .sort((a, b) => b.value - a.value)
                  .map(item => (
                    <div
                      key={item.label}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="text-[10px] font-light text-slate-500/45 truncate">
                        {item.label}
                      </span>
                      <span
                        className="text-[11px] font-light tabular-nums text-right flex-shrink-0"
                        style={{ color: activeTool.color }}
                      >
                        {item.formatted}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Narrative */}
              {activeTool.narrative && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.04]">
                  <p className="text-[10px] font-light text-slate-500/40 leading-relaxed">
                    {activeTool.narrative}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
