'use client';

import { useEffect, useState, useCallback } from 'react';
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
  AlertTriangle,
  Settings,
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useMetrics } from '@/hooks';
import useAlerts from '@/hooks/useAlerts';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';
import { useCampaignsContext } from '@/context/CampaignsContext';
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

export default function DashboardPage() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ HOOKS ESPECIALIZADOS POR RESPONSABILIDAD
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    fetchMetrics 
  } = useMetrics();
  
  const { alerts } = useAlerts();
  const { fetchCampaigns } = useCampaignsContext();

  // ✅ FUNCIÓN REFRESH UNIVERSAL - ARTICULADOR COMPLETO
  const handleRefreshAll = useCallback(async () => {
    console.log('🔄 Dashboard: Actualizando métricas y campañas...');
    try {
      // Actualizar métricas y campañas en paralelo
      await Promise.all([
        fetchMetrics(),
        fetchCampaigns()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [fetchMetrics, fetchCampaigns]);

  // ✅ VERIFICACIÓN AUTENTICACIÓN
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // ✅ CARGA INICIAL DATOS
  useEffect(() => {
    const initializeDashboard = async () => {
      await handleRefreshAll();
    };
    
    initializeDashboard();
  }, [handleRefreshAll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800">
      
      {/* ✅ NAVEGACIÓN DASHBOARD */}
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✅ HEADER PRINCIPAL CON ACCIÓN REFRESH UNIVERSAL */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard Principal
              </h1>
              <p className="text-white/70">
                Centro de control para métricas organizacionales y gestión de campañas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRefreshAll}
                disabled={metricsLoading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
                Actualizar Todo
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

        {/* ✅ ERROR STATE GLOBAL */}
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
            lastUpdated={lastUpdated}
            onRefresh={handleRefreshAll}
          />
        </div>

        {/* ✅ LAYOUT PRINCIPAL - GRID RESPONSIVO */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* ✅ SECCIÓN PRINCIPAL - GESTIÓN CAMPAÑAS CON NUEVOS COMPONENTES */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* ✅ PANEL ALERTAS - SIN CAMPAIGNS PARA EVITAR LOOP */}
            {alerts && alerts.length > 0 && (
              <AlertsPanel alerts={alerts} />
            )}

            {/* ✅ LISTA CAMPAÑAS - COMPONENTE CON ARQUITECTURA ESPECIALIZADA v3.0 */}
            <div className="campaign-management-section">
              <CampaignsList />
            </div>
            
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
                  Analytics Avanzado
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push('/dashboard/campaigns?filter=active')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Activas
                </Button>
                
              </CardContent>
            </Card>

            {/* ✅ RESUMEN ACTIVIDAD RECIENTE */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {metrics?.recentResponses && metrics.recentResponses > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {metrics.recentResponses} nuevas respuestas
                          </p>
                          <p className="text-xs text-white/60">Última hora</p>
                        </div>
                      </div>
                    </div>

                    {metrics.activeCampaigns > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {metrics.activeCampaigns} campañas activas
                            </p>
                            <p className="text-xs text-white/60">Recibiendo respuestas</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-white/30 mx-auto mb-2" />
                    <p className="text-sm text-white/60">Sin actividad reciente</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3 border-white/20 text-white hover:bg-white/10"
                      onClick={() => router.push('/dashboard/campaigns/new')}
                    >
                      Crear Primera Campaña
                    </Button>
                  </div>
                )}
                
              </CardContent>
            </Card>

            {/* ✅ MÉTRICAS RESUMIDAS SIDEBAR */}
            {metrics && (
              <Card className="professional-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5" />
                    Resumen Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Total Campañas</span>
                    <span className="text-sm font-medium text-white">{metrics.totalCampaigns}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Participación Global</span>
                    <span className="text-sm font-medium text-white">{metrics.globalParticipationRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Total Respuestas</span>
                    <span className="text-sm font-medium text-white">{metrics.totalResponses}</span>
                  </div>

                  {metrics.weeklyGrowth !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Crecimiento Semanal</span>
                      <span className={`text-sm font-medium ${metrics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.weeklyGrowth > 0 ? '+' : ''}{metrics.weeklyGrowth}%
                      </span>
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}