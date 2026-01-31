'use client'

// ════════════════════════════════════════════════════════════════════════════
// REPORT CONFIRM - Página standalone de confirmación
// src/app/report/[token]/confirm/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  FileText,
  ShieldCheck
} from 'lucide-react'

export default function ReportConfirmPage() {
  const params = useParams()
  const token = params.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null)

  useEffect(() => {
    const confirmReport = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/reports/${token}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()

        if (response.status === 410) {
          setError('Este enlace ha expirado')
          return
        }

        if (response.status === 404) {
          setError('Reporte no encontrado')
          return
        }

        if (data.success) {
          setConfirmed(true)
          setAlreadyConfirmed(data.alreadyConfirmed || false)
          setConfirmedAt(data.confirmedAt)
        } else {
          setError(data.error || 'Error al confirmar')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) confirmReport()
  }, [token])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen fhr-bg-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Confirmando recepcion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen fhr-bg-main flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fhr-card p-8 max-w-md text-center"
      >
        {error ? (
          <>
            {error.includes('expirado') ? (
              <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h1 className="text-xl font-light text-red-400 mb-2">
              {error.includes('expirado') ? 'Enlace Expirado' : 'Error'}
            </h1>
            <p className="text-slate-400">{error}</p>
            <p className="text-sm text-slate-500 mt-4">
              Contacta a tu departamento de RRHH para mas informacion.
            </p>
          </>
        ) : confirmed ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-light text-green-400 mb-2">
              {alreadyConfirmed ? 'Ya Confirmado' : 'Recepcion Confirmada'}
            </h1>
            <p className="text-slate-400 mb-4">
              {alreadyConfirmed
                ? 'Ya habias confirmado la recepcion de tu reporte anteriormente.'
                : 'Has confirmado exitosamente la recepcion de tu reporte de desempeno.'
              }
            </p>

            {confirmedAt && (
              <p className="text-xs text-slate-500 mb-4">
                Confirmado: {formatDate(confirmedAt)}
              </p>
            )}

            <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Informacion Importante</span>
              </div>
              <p className="text-xs text-slate-400">
                Si tienes preguntas sobre los resultados de tu evaluacion,
                contacta a tu departamento de Recursos Humanos.
                Tu feedback es confidencial.
              </p>
            </div>

            {/* Link to full report */}
            <a
              href={`/report/${token}`}
              className="fhr-btn fhr-btn-secondary flex items-center gap-2 mx-auto mt-6 inline-flex"
            >
              <FileText className="w-4 h-4" />
              Ver Reporte Completo
            </a>
          </>
        ) : null}
      </motion.div>
    </div>
  )
}
