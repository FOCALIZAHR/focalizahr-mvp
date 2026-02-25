'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { GLOBAL_ACCESS_ROLES } from '@/lib/services/AuthorizationService'

export default function GoalsHubRedirector() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()

    if (!user) {
      router.push('/login')
      return
    }

    const role = (user as any).userRole || user.role

    if (GLOBAL_ACCESS_ROLES.includes(role as any)) {
      router.push('/dashboard/metas/estrategia')
    } else {
      router.push('/dashboard/metas/equipo')
    }
  }, [router])

  return (
    <div className="fhr-bg-main min-h-screen flex items-center justify-center">
      <div className="fhr-skeleton w-8 h-8 rounded-full animate-pulse" />
    </div>
  )
}
