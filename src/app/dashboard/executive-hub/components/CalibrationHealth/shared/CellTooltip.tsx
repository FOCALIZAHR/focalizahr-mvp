'use client'

import { memo, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import type { TooltipData } from '../CalibrationHealth.types'

interface CellTooltipProps {
  data: TooltipData
  visible: boolean
  x: number
  y: number
}

export const CellTooltip = memo(function CellTooltip({ data, visible, x, y }: CellTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !visible) return

    // Reset position (React already set left: x via style prop)
    el.style.left = `${x}px`

    // Measure actual rendered position (includes transform -50%)
    const rect = el.getBoundingClientRect()
    const pad = 16

    let shift = 0
    if (rect.right > window.innerWidth - pad) {
      shift = -(rect.right - window.innerWidth + pad)
    } else if (rect.left < pad) {
      shift = pad - rect.left
    }

    if (shift !== 0) {
      el.style.left = `${x + shift}px`
      const arrow = el.querySelector<HTMLElement>('[data-arrow]')
      if (arrow) arrow.style.left = `calc(50% - ${shift}px)`
    } else {
      const arrow = el.querySelector<HTMLElement>('[data-arrow]')
      if (arrow) arrow.style.left = '50%'
    }
  }, [visible, x, y])

  if (!visible || !data.title || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -100%) translateY(-12px)' }}
    >
      <div
        className="rounded-xl border border-slate-700/80 shadow-2xl"
        style={{
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(20px)',
          minWidth: '220px',
          maxWidth: '280px',
          padding: '14px 16px',
        }}
      >
        <p className="text-white font-semibold text-sm mb-1.5">{data.title}</p>
        <p className="text-slate-300 text-xs leading-relaxed">{data.body}</p>
        {data.action && (
          <div className="mt-3 pt-2.5 border-t border-slate-700/60">
            <span className="text-cyan-400 text-xs font-medium">
              {data.action.label} →
            </span>
          </div>
        )}
        {/* Arrow */}
        <div
          data-arrow
          className="absolute -translate-x-1/2 -bottom-[6px] w-3 h-3 rotate-45 border-b border-r border-slate-700/80"
          style={{ background: 'rgba(15, 23, 42, 0.97)', left: '50%' }}
        />
      </div>
    </div>,
    document.body
  )
})
