// src/app/dashboard/metas/configuracion/grupos/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import GoalGroupManager from '@/components/goals/admin/GoalGroupManager'

export default function GoalGroupsPage() {
  const router = useRouter()

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* NAV */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-2xl font-bold mb-8">
          <span className="fhr-title-gradient">Grupos de Ponderación</span>
        </h1>

        <GoalGroupManager />
      </div>
    </div>
  )
}
