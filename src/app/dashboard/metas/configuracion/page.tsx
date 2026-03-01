// src/app/dashboard/metas/configuracion/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Workflow } from 'lucide-react'
import GoalEligibilityManager from '@/components/goals/admin/GoalEligibilityManager'
import { PrimaryButton } from '@/components/ui/PremiumButton'

export default function GoalConfigPage() {
  const router = useRouter()

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* NAV */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-2xl font-bold mb-8">
          <span className="fhr-title-gradient">Configuración de Metas</span>
        </h1>

        {/* Banner wizard */}
        <div className="fhr-card mb-6 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
              <Workflow className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Configurar paso a paso</h3>
              <p className="text-slate-400 text-xs">
                Grupos, elegibilidad y cascadeo en un asistente guiado.
              </p>
            </div>
          </div>
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => router.push('/dashboard/metas/configuracion/wizard')}
          >
            Iniciar Asistente
          </PrimaryButton>
        </div>

        <GoalEligibilityManager />
      </div>
    </div>
  )
}
