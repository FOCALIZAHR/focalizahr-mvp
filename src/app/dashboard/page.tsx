'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  Plus,
  Bell,
  Calendar,
  Target,
  Zap,
  Shield,
  Award,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useMetrics } from '@/hooks';
import useAlerts from '@/hooks/useAlerts';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';
import './dashboard.css';

// ✅ TIPOS MÉTRICAS (Responsabilidad Dashboard Principal)
interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  recentResponses?: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number | null;
  topPerformingCampaign?: string | null;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
}

// ✅ DASHBOARD PRINCIPAL - ARQUITECTURA v3.0
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ✅ SEPARACIÓN RESPONSABILIDADES CLARA - SOLO MÉTRICAS
  const { metrics, loading: metricsLoading, error: metricsError, lastUpdated, refetch: refetchMetrics } = useMetrics();
  
  // ✅ ALERTAS SIN CAMPAIGNS - EVITA LOOP INFINITO
  const { alerts } = useAlerts([]);

  // ✅ AUTENTICACIÓN Y MONTAJE
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  // ✅ LOADING STATE
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-xl font-medium text-white">Cargando FocalizaHR...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* ✅ NAVEGACIÓN INTEGRADA */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* ✅ CONTENIDO PRINCIPAL */}
      <div className="main-layout">
        <div className="container mx-auto px-4 py-8">
          
          {/* ✅ HEADER DASHBOARD */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold focalizahr-gradient-text mb-2">
                  Dashboard Principal
                </h1>
                <p className="text-white/60">
                  Gestiona y monitorea tus mediciones organizacionales
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refetchMetrics}
                  disabled={metricsLoading}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => router.push('/dashboard/campaigns/new')}
                  className="btn-gradient focus-ring"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Campaña
                </Button>
              </div>
            </div>
            
            {/* ✅ INFORMACIÓN ÚLTIMA ACTUALIZACIÓN */}
            {lastUpdated && (
              <div className="mt-3 text-sm text-white/40">
                Última actualización: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>

          {/* ✅ ERROR STATE MÉTRICAS */}
          {metricsError && (
            <Alert className="mb-8 bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                Error al cargar métricas: {metricsError}
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ MÉTRICAS PRINCIPALES - RESPONSABILIDAD DASHBOARD */}
          <div className="mb-8">
            <MetricsCards 
              metrics={metrics}
              loading={metricsLoading}
              error={metricsError}
            />
          </div>

          {/* ✅ LAYOUT PRINCIPAL - GRID RESPONSIVO */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* ✅ SECCIÓN PRINCIPAL - GESTIÓN CAMPAÑAS */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* ✅ PANEL ALERTAS - SIN CAMPAIGNS PARA EVITAR LOOP */}
              {alerts && alerts.length > 0 && (
                <AlertsPanel alerts={alerts} />
              )}

              {/* ✅ LISTA CAMPAÑAS - COMPONENTE AUTÓNOMO v3.0 SIN PROPS */}
              <CampaignsList />
              
            </div>

            {/* ✅ SIDEBAR DERECHA - INSIGHTS Y ACCESOS RÁPIDOS */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* ✅ ACCESOS RÁPIDOS */}
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="h-5 w-5" />
                    Accesos Rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push('/dashboard/campaigns/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Medición
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push('/dashboard/admin/participants')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Cargar Participantes
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push('/dashboard/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Analytics
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push('/dashboard/reports')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Generar Reportes
                  </Button>
                  
                </CardContent>
              </Card>

              {/* ✅ INSIGHTS RÁPIDOS */}
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="h-5 w-5" />
                    Insights Destacados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {metrics && (
                    <>
                      {/* Participación Global */}
                      <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/70">Participación Global</span>
                          <span className={`text-sm font-medium ${
                            metrics.globalParticipationRate >= 70 ? 'text-green-400' :
                            metrics.globalParticipationRate >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {metrics.globalParticipationRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              metrics.globalParticipationRate >= 70 ? 'bg-green-400' :
                              metrics.globalParticipationRate >= 50 ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${metrics.globalParticipationRate || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actividad Reciente */}
                      {metrics.recentResponses !== undefined && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm text-white/70">Últimas 24h</span>
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {metrics.recentResponses} respuestas
                          </div>
                        </div>
                      )}

                      {/* Crecimiento */}
                      {metrics.weeklyGrowth !== undefined && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-white/70">Crecimiento Semanal</span>
                          </div>
                          <div className={`text-lg font-semibold ${
                            metrics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {metrics.weeklyGrowth >= 0 ? '+' : ''}{metrics.weeklyGrowth}%
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Recordatorio */}
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-medium text-cyan-400">Tip del Día</span>
                    </div>
                    <p className="text-xs text-white/70">
                      Mantén una participación &gt;70% para obtener insights más precisos y valiosos.
                    </p>
                  </div>
                  
                </CardContent>
              </Card>

              {/* ✅ CALENDARIO RÁPIDO */}
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    Próximas Fechas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-white/70">Campañas activas</span>
                      <span className="font-medium text-white">{metrics?.activeCampaigns || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-white/70">Por completar</span>
                      <span className="font-medium text-cyan-400">{metrics?.draftCampaigns || 0}</span>
                    </div>
                    <div className="text-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                        onClick={() => router.push('/dashboard/calendar')}
                      >
                        Ver Calendario Completo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}