// ════════════════════════════════════════════════════════════════════════════
// CREATE GOAL PAGE - Pagina para crear nueva meta
// src/app/dashboard/metas/crear/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useSearchParams } from 'next/navigation'
import CreateGoalWizard from '@/components/goals/wizard/CreateGoalWizard'

export default function CreateGoalPage() {
  const searchParams = useSearchParams()
  const employeeId = searchParams.get('employeeId') || undefined
  const context = searchParams.get('context') || undefined

  return <CreateGoalWizard employeeId={employeeId} context={context} />
}
