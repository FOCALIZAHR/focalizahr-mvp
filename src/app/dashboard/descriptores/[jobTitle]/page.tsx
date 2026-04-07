'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import DescriptorWizard from '@/components/descriptores/DescriptorWizard'
import type { DescriptorProposal } from '@/lib/services/JobDescriptorService'

export default function DescriptorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const jobTitle = decodeURIComponent(params.jobTitle as string)

  const [proposal, setProposal] = useState<DescriptorProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposal = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/descriptors/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle }),
      })
      if (!res.ok) throw new Error('Error al generar propuesta')
      const json = await res.json()
      if (json.success) {
        setProposal(json.data)
      } else {
        setError(json.error ?? 'Error desconocido')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [jobTitle])

  useEffect(() => { fetchProposal() }, [fetchProposal])

  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen fhr-bg-main transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Generando descriptor para {jobTitle}...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={fetchProposal}
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : proposal ? (
            <DescriptorWizard
              proposal={proposal}
              onBack={() => router.push('/dashboard/descriptores')}
              onHome={() => router.push('/dashboard/descriptores')}
              onNextJob={(nextTitle) => router.push(`/dashboard/descriptores/${encodeURIComponent(nextTitle)}`)}
            />
          ) : null}
        </div>
      </main>
    </>
  )
}
