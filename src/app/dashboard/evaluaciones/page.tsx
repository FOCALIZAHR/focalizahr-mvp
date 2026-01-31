'use client'

// ════════════════════════════════════════════════════════════════════════════
// MIS EVALUACIONES - Portal del Jefe
// src/app/dashboard/evaluaciones/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { Home, ChevronRight, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import EvaluatorDashboard from '@/components/evaluator/EvaluatorDashboard'

export default function MisEvaluacionesPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="flex items-center gap-1 text-slate-200">
          <ClipboardList className="w-3.5 h-3.5" />
          Mis Evaluaciones
        </span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-200">
          Mis Evaluaciones
        </h1>
        <p className="text-slate-400 mt-1">
          Evalúa el desempeño de tu equipo
        </p>
      </div>

      {/* Dashboard */}
      <EvaluatorDashboard />
    </div>
  )
}
