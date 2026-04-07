'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXPLORAR ORGANIZACIÓN — Full screen ReactFlow org tree
// Sin sidebar (Cinema Mode), header minimalista
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import OrgExplorer from '@/components/descriptores/OrgExplorer'

interface OrgTreeData {
  companyName: string
  departments: Array<{
    id: string
    displayName: string
    parentId: string | null
    standardCategory: string | null
    level: number
  }>
  positions: Array<{
    jobTitle: string
    departmentId: string
    departmentName: string
    employeeCount: number
    descriptorStatus: 'CONFIRMED' | 'DRAFT' | 'NONE'
    descriptorId: string | null
    socCode: string | null
    employees: Array<{ id: string; fullName: string }>
  }>
}

export default function ExplorarPage() {
  const [data, setData] = useState<OrgTreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/descriptors/org-tree')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(json.error)
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            FocalizaHR
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Centro de Inteligencia de Roles
          </span>
        </div>
        <Link href="/dashboard/descriptores">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Descriptores
          </button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Cargando estructura organizacional...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : data ? (
          <OrgExplorer data={data} />
        ) : null}
      </div>
    </div>
  )
}
