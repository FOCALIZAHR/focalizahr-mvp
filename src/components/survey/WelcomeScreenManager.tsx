'use client'

// ════════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN MANAGER - Pantalla Welcome para Evaluación de Jefe
// src/components/survey/WelcomeScreenManager.tsx
// IMPORTANTE: SIN mensaje de anonimato (el jefe se identifica)
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Briefcase, Building2, Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface WelcomeScreenManagerProps {
  evaluatee: {
    fullName: string
    position: string | null
    departmentName: string
    tenure: string
    avatarUrl?: string
  }
  estimatedMinutes?: number
  surveyToken: string
  onBack: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function WelcomeScreenManager({
  evaluatee,
  estimatedMinutes = 10,
  surveyToken,
  onBack
}: WelcomeScreenManagerProps) {
  const router = useRouter()

  const handleStart = () => {
    router.push(`/encuesta/${surveyToken}`)
  }

  const handleBack = () => {
    router.push(onBack)
  }

  // Extraer primer nombre para mensaje personalizado
  const firstName = evaluatee.fullName.split(' ')[0]

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="min-h-screen fhr-bg-main flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fhr-card max-w-md w-full overflow-hidden"
      >
        {/* Top Line decorativa */}
        <div className="fhr-top-line" />

        {/* Contenido */}
        <div className="p-8 text-center">
          {/* Avatar */}
          <div className="mb-6">
            {evaluatee.avatarUrl ? (
              <img
                src={evaluatee.avatarUrl}
                alt={evaluatee.fullName}
                className="w-24 h-24 rounded-full mx-auto border-4 border-cyan-500/30 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center border-4 border-cyan-500/30">
                <span className="text-3xl font-bold text-white">
                  {getInitials(evaluatee.fullName)}
                </span>
              </div>
            )}
          </div>

          {/* Nombre del evaluado */}
          <h1 className="text-2xl font-light text-slate-100 mb-6">
            {evaluatee.fullName}
          </h1>

          {/* Datos del colaborador */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <Briefcase className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{evaluatee.position || 'Sin cargo asignado'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{evaluatee.departmentName}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span>{evaluatee.tenure} en la empresa</span>
            </div>
          </div>

          {/* Divider decorativo */}
          <div className="fhr-divider my-6" />

          {/* Mensaje motivacional - SIN anonimato */}
          <p className="text-slate-400 mb-8 leading-relaxed">
            Tu evaluación ayudará a{' '}
            <span className="text-cyan-400 font-medium">{firstName}</span>{' '}
            a identificar sus fortalezas y oportunidades de desarrollo.
            <br /><br />
            Tómate el tiempo necesario para dar feedback constructivo y específico.
          </p>

          {/* CTA Principal */}
          <button
            onClick={handleStart}
            className="fhr-btn fhr-btn-primary w-full py-4 text-lg font-medium flex items-center justify-center gap-2 mb-4"
          >
            <span>Comenzar Evaluación</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Volver */}
          <button
            onClick={handleBack}
            className="fhr-btn fhr-btn-ghost w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal</span>
          </button>

          {/* Tiempo estimado */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>Tiempo estimado: {estimatedMinutes} minutos</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
})
