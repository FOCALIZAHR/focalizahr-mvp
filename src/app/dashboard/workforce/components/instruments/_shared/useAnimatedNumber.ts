// ════════════════════════════════════════════════════════════════════════════
// useAnimatedNumber — interpolación con requestAnimationFrame
// src/app/dashboard/workforce/components/instruments/_shared/useAnimatedNumber.ts
// ════════════════════════════════════════════════════════════════════════════
// Sin libs externas. Easing cubic out, ~400ms por defecto.
// Usado en HUDs/odómetros del Workforce Deck.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target: number, duration = 400): number {
  const [current, setCurrent] = useState(target)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = null
    startValueRef.current = current

    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time
      const elapsed = time - startTimeRef.current
      const t = Math.min(1, elapsed / duration)
      // cubic out easing
      const eased = 1 - Math.pow(1 - t, 3)
      const value =
        startValueRef.current + (target - startValueRef.current) * eased
      setCurrent(value)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return current
}
