// src/components/goals/RequestClosureButton.tsx
'use client'

import { memo, useState, useCallback } from 'react'
import { CheckCircle, Loader2, Clock } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface RequestClosureButtonProps {
  goalId: string
  status: string
  progress: number
  onSuccess: () => void
}

export const RequestClosureButton = memo(function RequestClosureButton({
  goalId,
  status,
  progress,
  onSuccess,
}: RequestClosureButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRequest = useCallback(async () => {
    if (!confirm('¿Solicitar cierre de esta meta? El CEO deberá aprobarla.')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/goals/${goalId}/request-closure`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (res.ok) {
        onSuccess()
      } else {
        const json = await res.json()
        alert(json.error || 'Error al solicitar cierre')
      }
    } finally {
      setLoading(false)
    }
  }, [goalId, onSuccess])

  // Pendiente de cierre: mostrar badge
  if (status === 'PENDING_CLOSURE') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
        <Clock className="w-4 h-4" />
        Pendiente de aprobación
      </div>
    )
  }

  // Solo mostrar si progreso >= 80% y no está cerrada
  if (progress < 80 || status === 'COMPLETED' || status === 'CANCELLED') {
    return null
  }

  return (
    <PrimaryButton
      icon={loading ? Loader2 : CheckCircle}
      onClick={handleRequest}
      disabled={loading}
      isLoading={loading}
    >
      Solicitar Cierre
    </PrimaryButton>
  )
})
