// src/app/dashboard/metas/configuracion/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import GoalEligibilityManager from '@/components/goals/admin/GoalEligibilityManager'

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

        <GoalEligibilityManager />
      </div>
    </div>
  )
}
