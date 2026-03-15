'use client'

import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import TACOrchestrator from '@/components/talent-actions/TACOrchestrator'

export default function TalentActionsPage() {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <DashboardNavigation />
      <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <div className="max-w-7xl mx-auto px-3 py-6 md:px-6 md:py-12">
          <TACOrchestrator />
        </div>
      </main>
    </>
  )
}
