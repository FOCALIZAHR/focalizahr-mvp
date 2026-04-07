'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import DescriptorWizard from '@/components/descriptores/DescriptorWizard'
import RoleCard from '@/components/descriptores/RoleCard'
import type { DescriptorProposal, PositionWithStatus } from '@/lib/services/JobDescriptorService'

interface ConfirmedDescriptor {
  id: string
  jobTitle: string
  purpose: string | null
  responsibilities: any[]
  competencies: any[]
  employeeCount: number
  confirmedAt: string | null
  matchConfidence: string | null
  status: string
}

export default function DescriptorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const jobTitle = decodeURIComponent(params.jobTitle as string)

  const [proposal, setProposal] = useState<DescriptorProposal | null>(null)
  const [confirmedDescriptor, setConfirmedDescriptor] = useState<ConfirmedDescriptor | null>(null)
  const [positions, setPositions] = useState<PositionWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch positions list first to check status
      const positionsRes = await fetch('/api/descriptors')
      let positionsList: PositionWithStatus[] = []
      if (positionsRes.ok) {
        const posJson = await positionsRes.json()
        if (posJson.success) positionsList = posJson.data.positions
      }
      setPositions(positionsList)

      // Check if this position is already confirmed
      const currentPosition = positionsList.find(
        p => p.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim()
      )

      if (currentPosition?.descriptorStatus === 'CONFIRMED') {
        // Fetch the confirmed descriptor for RoleCard view
        const descRes = await fetch(`/api/descriptors/by-title?jobTitle=${encodeURIComponent(jobTitle)}`)
        if (descRes.ok) {
          const descJson = await descRes.json()
          if (descJson.success && descJson.data) {
            setConfirmedDescriptor({
              ...descJson.data,
              employeeCount: currentPosition.employeeCount,
            })
            return // Don't need proposal
          }
        }
      }

      // Not confirmed — fetch proposal for wizard
      const proposalRes = await fetch('/api/descriptors/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle }),
      })

      if (!proposalRes.ok) throw new Error('Error al generar propuesta')
      const proposalJson = await proposalRes.json()
      if (proposalJson.success) {
        setProposal(proposalJson.data)
      } else {
        setError(proposalJson.error ?? 'Error desconocido')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [jobTitle])

  useEffect(() => { fetchData() }, [fetchData])

  // Position data
  const currentPosition = positions.find(
    p => p.jobTitle.toLowerCase().trim() === jobTitle.toLowerCase().trim()
  )
  const employeeCount = currentPosition?.employeeCount ?? 0
  const departmentName = currentPosition?.departmentNames?.[0] ?? null

  // Next pending job
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
                <p className="text-slate-400 text-sm">Cargando descriptor...</p>
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
          ) : confirmedDescriptor ? (
            <RoleCard
              jobTitle={confirmedDescriptor.jobTitle}
              purpose={confirmedDescriptor.purpose}
              responsibilities={confirmedDescriptor.responsibilities ?? []}
              competencies={confirmedDescriptor.competencies ?? []}
              employeeCount={confirmedDescriptor.employeeCount}
              departmentName={departmentName}
              confirmedAt={confirmedDescriptor.confirmedAt}
              matchConfidence={confirmedDescriptor.matchConfidence}
              onBack={() => router.push('/dashboard/descriptores')}
            />
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
