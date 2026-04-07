'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import DescriptorWizard from '@/components/descriptores/DescriptorWizard'
import type { DescriptorProposal, PositionWithStatus } from '@/lib/services/JobDescriptorService'

export default function DescriptorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const jobTitle = decodeURIComponent(params.jobTitle as string)

  const [proposal, setProposal] = useState<DescriptorProposal | null>(null)
  const [positions, setPositions] = useState<PositionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch proposal + positions list (for next job navigation)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [proposalRes, positionsRes] = await Promise.all([
        fetch('/api/descriptors/proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle }),
        }),
        fetch('/api/descriptors'),
      ])

      if (!proposalRes.ok) throw new Error('Error al generar propuesta')
      const proposalJson = await proposalRes.json()
      if (proposalJson.success) {
        setProposal(proposalJson.data)
      } else {
        setError(proposalJson.error ?? 'Error desconocido')
      }

      if (positionsRes.ok) {
        const posJson = await positionsRes.json()
        if (posJson.success) setPositions(posJson.data.positions)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [jobTitle])

  useEffect(() => { fetchData() }, [fetchData])

  // Find employee count and department for this job
  const currentPosition = positions.find(
    p => p.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim()
  )
  const employeeCount = currentPosition?.employeeCount ?? 0
  const departmentName = currentPosition?.departmentNames?.[0] ?? null

  // Find next pending job after this one
  const pendingPositions = positions
    .filter(p => p.descriptorStatus === 'NONE')
    .sort((a, b) => b.employeeCount - a.employeeCount)
  const currentIdx = pendingPositions.findIndex(
    p => p.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim()
  )
  const nextPending = pendingPositions[currentIdx + 1] ?? pendingPositions[0]

  function handleNextJob() {
    if (nextPending && nextPending.jobTitle.toLowerCase() !== jobTitle.toLowerCase()) {
      router.push(`/dashboard/descriptores/${encodeURIComponent(nextPending.jobTitle)}`)
    } else {
      router.push('/dashboard/descriptores')
    }
  }

  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen fhr-bg-main transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10">
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
                onClick={fetchData}
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : proposal ? (
            <DescriptorWizard
              proposal={proposal}
              employeeCount={employeeCount}
              departmentName={departmentName}
              onBack={() => router.push('/dashboard/descriptores')}
              onHome={() => router.push('/dashboard/descriptores')}
              onNextJob={handleNextJob}
            />
          ) : null}
        </div>
      </main>
    </>
  )
}
