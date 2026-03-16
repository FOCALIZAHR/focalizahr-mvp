'use client'

import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'

// ══════════════════════════════════════════════════════════════════
// SWAP: Cambia cual linea esta comentada para alternar
// Si te gusta Cinema Mode → deja como esta
// Si quieres volver al anterior → comenta Cinema, descomenta viejo
// ══════════════════════════════════════════════════════════════════
// import TACOrchestrator from '@/components/talent-actions/TACOrchestrator'
import TACCinemaOrchestrator from '@/components/talent-actions/cinema/TACCinemaOrchestrator'

export default function TalentActionsPage() {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <TACCinemaOrchestrator />
      </main>
    </>
  )
}
