'use client'

import { CheckCircle2 } from 'lucide-react'
import type { EmployeeCardStatus } from '@/types/evaluator-cinema'

export function StatusDot({ status }: { status: EmployeeCardStatus }) {
  if (status === 'ready' || status === 'in_progress') {
    return <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
  }
  if (status === 'completed') {
    return <CheckCircle2 className="w-3 h-3 text-emerald-500" />
  }
  return <div className="w-2 h-2 rounded-full bg-slate-700" />
}
