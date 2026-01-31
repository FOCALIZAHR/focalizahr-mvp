'use client'

// ════════════════════════════════════════════════════════════════════════════
// REPORT LANDING - Acceso anónimo a reporte individual
// src/app/report/[token]/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  MessageSquare,
  ShieldCheck,
  Users,
  BarChart3,
  Loader2
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CategoryScore {
  category: string
  avgScore: number | null
  responseCount: number
  qualitativeFeedback: string[]
}

interface ReportData {
  token: string
  employeeName: string
  cycleName: string
  companyName: string
  sentAt: string
  confirmedAt: string | null
  expiresAt: string
  overallScore: number | null
  evaluatorCount: number
  categoryScores: CategoryScore[]
  totalResponses: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ReportLandingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Cargar reporte
  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/reports/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setErrorCode(data.code || 'ERROR')
          throw new Error(data.error || 'Error cargando reporte')
        }

        if (data.success) {
          setReport(data.report)
          if (data.report.confirmedAt) {
            setConfirmed(true)
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) loadReport()
  }, [token])

  // Confirmar recepción
  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      const response = await fetch(`/api/reports/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      if (data.success) {
        setConfirmed(true)
      }
    } catch (err) {
      console.error('Error confirming:', err)
    } finally {
      setIsConfirming(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getScoreColor = (score: number | null) => {
    if (score == null) return 'text-slate-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBarColor = (score: number | null) => {
    if (score == null) return 'from-slate-500 to-slate-600'
    if (score >= 80) return 'from-green-500 to-emerald-400'
    if (score >= 60) return 'from-cyan-500 to-blue-400'
    if (score >= 40) return 'from-amber-500 to-yellow-400'
    return 'from-red-500 to-orange-400'
  }

  // ════════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="min-h-screen fhr-bg-main flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando tu reporte...</p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // ERROR / EXPIRED
  // ════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="min-h-screen fhr-bg-main flex items-center justify-center p-4">
        <div className="fhr-card p-8 max-w-md text-center">
          {errorCode === 'EXPIRED' ? (
            <>
              <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h1 className="text-xl font-light text-amber-400 mb-2">Enlace Expirado</h1>
              <p className="text-slate-400">
                Este enlace de reporte ha expirado. Contacta a tu departamento de RRHH para solicitar un nuevo enlace.
              </p>
            </>
          ) : errorCode === 'NOT_FOUND' ? (
            <>
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-light text-red-400 mb-2">Reporte No Encontrado</h1>
              <p className="text-slate-400">
                El enlace no es valido. Verifica que la URL sea correcta.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-light text-red-400 mb-2">Error</h1>
              <p className="text-slate-400">{error}</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!report) return null

  // ════════════════════════════════════════════════════════════════════════
  // REPORT VIEW
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen fhr-bg-main">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fhr-card p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h1 className="text-2xl font-light text-slate-200">
              <span className="fhr-title-gradient">Reporte de Desempeno</span>
            </h1>
            <p className="text-slate-400 mt-1">{report.companyName} · {report.cycleName}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400">Documento confidencial</span>
          </div>

          {/* Employee Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <h2 className="text-xl font-medium text-slate-200">{report.employeeName}</h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {report.evaluatorCount} evaluadores
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                {report.totalResponses} respuestas
              </span>
            </div>
          </div>

          {/* Overall Score */}
          {report.overallScore != null && (
            <div className="mt-6 text-center">
              <div className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore.toFixed(0)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Score General (0-100)</div>
              <div className="mt-3 h-3 bg-slate-700 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(report.overallScore)}`}
                  style={{ width: `${report.overallScore}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Scores */}
        {report.categoryScores.map((cat, idx) => (
          <motion.div
            key={cat.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
            className="fhr-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {cat.category}
              </h3>
              {cat.avgScore != null && (
                <span className={`text-lg font-bold ${getScoreColor(cat.avgScore)}`}>
                  {cat.avgScore.toFixed(0)}
                </span>
              )}
            </div>

            {/* Score Bar */}
            {cat.avgScore != null && (
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(cat.avgScore)}`}
                  style={{ width: `${cat.avgScore}%` }}
                />
              </div>
            )}

            {/* Qualitative Feedback */}
            {cat.qualitativeFeedback.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Feedback Cualitativo</p>
                {cat.qualitativeFeedback.map((fb, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300 italic">{fb}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Confirm Reception */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fhr-card p-6 text-center"
        >
          {confirmed ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-green-400 mb-1">
                Recepcion Confirmada
              </h3>
              <p className="text-sm text-slate-400">
                Has confirmado la recepcion de tu reporte de desempeno.
              </p>
              <p className="text-xs text-slate-500 mt-3">
                Si tienes dudas sobre los resultados, contacta a tu departamento de RRHH.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Confirmar Recepcion</h3>
              <p className="text-sm text-slate-400 mb-4">
                Al confirmar, se registrara que has revisado tu reporte de desempeno.
              </p>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="fhr-btn fhr-btn-primary flex items-center gap-2 mx-auto"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirmar Recepcion
              </button>
              <p className="text-xs text-slate-500 mt-4">
                Enlace valido hasta {formatDate(report.expiresAt)}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
