'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import SalaryConfigSettings from '@/components/settings/SalaryConfigSettings'

export default function ConfiguracionEmpresaPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/')
      return
    }
    setMounted(true)
  }, [router])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold">
              <span className="fhr-title-gradient">Configuración de Empresa</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Personaliza los parámetros salariales de tu empresa para obtener cálculos de ROI más precisos.
          </p>
        </div>

        {/* Salary Config Component */}
        <SalaryConfigSettings />
      </div>
    </div>
  )
}
