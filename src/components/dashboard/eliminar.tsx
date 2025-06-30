'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Users, 
  BarChart3, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useAlerts } from '@/hooks/useAlerts';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';

export default function DashboardPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ HOOKS ESPECIALIZADOS v3.0 - RESPONSABILIDADES SEPARADAS
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    refetch: refetchMetrics 
  } = useMetrics();

  const { 
    alerts, 
    loading: alertsLoading, 
    error: alertsError 
  } = useAlerts();

  // ✅ FUNCIÓN REFRESH MANUAL COMPLETA
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchMetrics()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error al actualizar dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ AUTO-REFRESH MÉTRICAS (5 MINUTOS)
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        await refetchMetrics();
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error carga inicial métricas:', error);
      }
    };

    loadMetrics();

    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refetchMetrics]);

  return (
    <div className="neural-dashboard main-layout min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        
        {/* ✅ HEADER PRINCIPAL CON GRADIENTE CORPORATIVO */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold focalizahr-gradient-text mb-2">
              Dashboard Principal
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Control total de tus campañas y métricas organizacionales en tiempo real
            </p>
            
            {/* ✅ ACCIONES PRINCIPALES CENTRALIZADAS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                onClick={handleRefreshAll}
                disabled={isRefreshing || metricsLoading}
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus-ring transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || metricsLoading ? 'animate-spin' : ''}`} />
                Actualizar Todo
              </Button>
              
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="btn-gradient focus-ring shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
            
            {/* ✅ INFORMACIÓN ÚLTIMA ACTUALIZACIÓN */}
            {lastUpdated && (
              <div className="mt-4 text-sm text-white/40">
                Última actualización: {lastUpdated.toLocaleString('es-ES')}
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

          {/* ✅ MÉTRICAS PRINCIPALES v3.0 */}
          <div className="mb-8">
            <MetricsCards 
              metrics={metrics}
              loading={metricsLoading}
              error={metricsError}
              lastUpdated={lastUpdated}
              onRefresh={refetchMetrics}
            />
          </div>

          {/* ✅ LAYOUT PRINCIPAL - GRID RESPONSIVO PREMIUM */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* ✅ SECCIÓN PRINCIPAL - GESTIÓN CAMPAÑAS */}
            <div className="xl:col-span-3 space-y-8">
              
              {/* ✅ PANEL ALERTAS INTEGRADO */}
              {alerts && alerts.length > 0 && (
                <AlertsPanel alerts={alerts} />
              )}

              {/* ✅ LISTA CAMPAÑAS CON COMPONENTES ESPECIALIZADOS v3.0 */}
              <CampaignsList />
              
            </div>

            {/* ✅ SIDEBAR DERECHA - INSIGHTS Y ACCESOS RÁPIDOS PREMIUM */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* ✅ ACCESOS RÁPIDOS PREMIUM */}
              <Card className="professional-card border-l-4 border-l-cyan-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="h-5 w-5 text-cyan-400" />
                    Accesos Rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/campaigns/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Campaña
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/admin/participants')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Participantes
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Risk Scoring
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/reports')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Reportes
                  </Button>
                  
                </CardContent>
              </Card>

              {/* ✅ INSIGHTS AUTOMÁTICOS PREMIUM */}
              <Card className="professional-card border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-purple-400" />
                    Insights AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Insight participación */}
                  {metrics?.activeStudies > 0 && (
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-white">Participación</span>
                      </div>
                      <p className="text-xs text-white/70">
                        {metrics.avgParticipation >= 70 
                          ? '🎉 Excelente nivel de participación en campañas activas'
                          : metrics.avgParticipation >= 50
                            ? '⚠️ Participación moderada, considera enviar recordatorios'
                            : '🚨 Baja participación, revisa estrategia de comunicación'
                        }
                      </p>
                    </div>
                  )}

                  {/* Insight temporal */}
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Timing</span>
                    </div>
                    <p className="text-xs text-white/70">
                      {metrics?.totalCampaigns === 0 
                        ? '💡 Comienza creando tu primera campaña de pulso organizacional'
                        : metrics?.activeStudies === 0
                          ? '📊 Buen momento para lanzar una nueva medición'
                          : '⏰ Monitorea el progreso de tus campañas activas'
                      }
                    </p>
                  </div>

                  {/* CTA próximas acciones */}
                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full text-xs border-white/20 text-white hover:bg-white/10"
                      onClick={() => router.push('/dashboard/insights')}
                    >
                      Ver Insights Detallados
                    </Button>
                  </div>
                  
                </CardContent>
              </Card>

              {/* ✅ TIPS CONTEXTUALES */}
              <Card className="professional-card border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5 text-orange-400" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  <div className="text-xs text-white/70 space-y-2">
                    <p>• Realiza pulsos trimestrales para mantener el engagement</p>
                    <p>• Segmenta por departamentos para insights específicos</p>
                    <p>• Comunica resultados para cerrar el loop de feedback</p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push('/dashboard/best-practices')}
                  >
                    Mejores Prácticas
                  </Button>
                  
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}