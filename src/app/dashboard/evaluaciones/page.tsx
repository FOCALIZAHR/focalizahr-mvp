'use client'

// ════════════════════════════════════════════════════════════════════════════
// MIS EVALUACIONES - Portal del Jefe
// src/app/dashboard/evaluaciones/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import EvaluatorDashboard from '@/components/evaluator/EvaluatorDashboard'

export default function MisEvaluacionesPage() {
  return (
    <div className="space-y-6">
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
