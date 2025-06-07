'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3, Users, TrendingUp, Clock } from 'lucide-react'

interface DashboardMetrics {
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  totalResponses: number
  averageParticipation: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalResponses: 0,
    averageParticipation: 0
  })
  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    // Obtener datos de la cuenta
    const accountData = localStorage.getItem('focalizahr_account')
    if (accountData) {
      setAccount(JSON.parse(accountData))
    }

    // TODO: Cargar métricas reales desde la API en Chat 2
    // Por ahora usar datos mock para mostrar la estructura
    setMetrics({
      totalCampaigns: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      totalResponses: 0,
      averageParticipation: 0
    })
  }, [])

  const handleCreateCampaign = () => {
    router.push('/dashboard/campana/nueva')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido de vuelta, {account?.adminName}. Gestiona tus campañas de Pulso de Bienestar.
          </p>
        </div>
        <Button 
          variant="gradient" 
          size="lg" 
          onClick={handleCreateCampaign}
          className="mt-4 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campañas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Todas las campañas creadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Campañas Activas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              En curso actualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Respuestas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Colaboradores que han respondido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Participación Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.averageParticipation}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de todas las campañas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estado inicial - Sin campañas */}
      {metrics.totalCampaigns === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-focalizahr rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">
              ¡Comienza tu primera campaña!
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Crea tu primera campaña de Pulso de Bienestar para comenzar a medir 
              el clima laboral de tu equipo y obtener insights valiosos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={handleCreateCampaign}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Campaña
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Próximas acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pasos</CardTitle>
          <CardDescription>
            Recomendaciones para aprovechar al máximo FocalizaHR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Crea tu primera campaña</p>
              <p className="text-sm text-muted-foreground">
                Mide el clima laboral de tu equipo con 12 preguntas científicamente validadas
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Invita a tu equipo</p>
              <p className="text-sm text-muted-foreground">
                Sube un CSV con los emails de tus colaboradores para enviar invitaciones automáticas
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-sm">Analiza los resultados</p>
              <p className="text-sm text-muted-foreground">
                Obtén insights automáticos y recomendaciones basadas en evidencia científica
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}