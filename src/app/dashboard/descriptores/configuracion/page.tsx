'use client'

import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import OccupationMappingCinema from '@/components/descriptores/OccupationMappingCinema'

export default function ConfiguracionPage() {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen bg-[#0F172A] transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <OccupationMappingCinema />
      </main>
    </>
  )
}
