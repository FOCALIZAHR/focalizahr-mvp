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
  RefreshCw,
  AlertTriangle,
  Zap,
  Shield,
  Calendar,
  Target
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useCampaignsContext } from '@/context/CampaignsContext';
import useAlerts from '@/hooks/useAlerts';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import CampaignsList from '@/components/dashboard/CampaignsList';
import DashboardWidget_ExitInsights from '@/components/dashboard/DashboardWidget_ExitInsights';
import './dashboard.css';

// ✅ TIPOS MÉTRICAS EXPANDIDAS v3.0
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

// ✅ DASHBOARD PRINCIPAL - ARQUITECTURA v3.0 MAESTRO
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ CONTEXT CAMPAIGNS PARA CÁLCULO MÉTRICAS
  const { campaigns, loading: campaignsLoading, fetchCampaigns } = useCampaignsContext();
  
  // ✅ ALERTAS INTEGRADAS
  const { alerts } = useAlerts(campaigns);

  // ✅ CÁLCULO MÉTRICAS DESDE CAMPAIGNS
  const calculateMetrics = (campaignsList: any[]): DashboardMetrics => {
    const totalCampaigns = campaignsList.length;
    const activeCampaigns = campaignsList.filter(c => c.status === 'active').length;
    const completedCampaigns = campaignsList.filter(c => c.status === 'completed').length;
    const draftCampaigns = campaignsList.filter(c => c.status === 'draft').length;
    const cancelledCampaigns = campaignsList.filter(c => c.status === 'cancelled').length;
    
    const totalParticipants = campaignsList.reduce((sum, c) => sum + (c.totalInvited || 0), 0);
    const totalResponses = campaignsList.reduce((sum, c) => sum + (c.totalResponded || 0), 0);
    const globalParticipationRate = totalParticipants > 0 ? 
      (totalResponses / totalParticipants) * 100 : 0;

    // Mock data para campos adicionales
    const recentResponses = Math.floor(Math.random() * 50) + 10;
    const weeklyGrowth = (Math.random() * 20) + 5;
    const monthlyGrowth = (Math.random() * 40) + 10;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      draftCampaigns,
      cancelledCampaigns,
      globalParticipationRate: Number(globalParticipationRate.toFixed(1)),
      totalResponses,
      totalParticipants,
      recentResponses,
      weeklyGrowth: Number(weeklyGrowth.toFixed(1)),
      monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      averageCompletionTime: null,
      topPerformingCampaign: completedCampaigns > 0 ? campaignsList.find(c => c.status === 'completed')?.name || null : null
    };
  };

  // ✅ FUNCIÓN CARGAR MÉTRICAS
  const loadMetrics = async () => {
    if (!campaigns || campaigns.length === 0) return;
    
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const calculatedMetrics = calculateMetrics(campaigns);
      setMetrics(calculatedMetrics);
      setLastUpdated(new Date());
    } catch (error: any) {
      setMetricsError(error.message || 'Error desconocido');
    } finally {
      setMetricsLoading(false);
    }
  };

  // ✅ AUTENTICACIÓN Y CARGA INICIAL
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  // ✅ CARGAR DATOS CUANDO CAMPAIGNS CAMBIEN
  useEffect(() => {
    if (campaigns.length >= 0) {
      loadMetrics();
    }
  }, [campaigns]);

  // ✅ CARGA INICIAL CAMPAIGNS
  useEffect(() => {
    if (mounted) {
      fetchCampaigns();
    }
  }, [mounted, fetchCampaigns]);

  // ✅ LOADING STATE CON FONDO CORPORATIVO
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold focalizahr-gradient-text mb-2">FocalizaHR</h2>
          <p className="text-white/60">Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* ✅ NAVEGACIÓN LATERAL PREMIUM */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* ✅ CONTENIDO PRINCIPAL CON MARGIN SIDEBAR */}
      <div className="md:ml-64 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          
          {/* ✅ HEADER DASHBOARD PREMIUM */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold focalizahr-gradient-text mb-3">
                  Dashboard Principal
                </h1>
                <p className="text-xl text-white/70">
                  Gestiona y monitorea tus mediciones organizacionales
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadMetrics}
                  disabled={metricsLoading || campaignsLoading}
                  className="border-white/20 text-white hover:bg-white/10 focus-ring"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading || campaignsLoading ? 'animate-spin' : ''}`} />
                  Actualizar Todo
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => router.push('/dashboard/campaigns/new')}
                  className="btn-gradient focus-ring shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Campaña
                </Button>
              </div>
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
              onRefresh={loadMetrics}
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
              
              {/* ✅ ACCESOS RÁPIDOS SIN REDUNDANCIA */}
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
                    onClick={() => router.push('/dashboard/results')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Resultados
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/reports')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Exportar Reportes
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                    onClick={() => router.push('/dashboard/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10 focus-ring transition-all duration-200"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Risk Scoring
                  </Button>
                  
                </CardContent>
              </Card>

              {/* ✅ INSIGHTS PANEL PREMIUM */}
              <Card className="professional-card border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-purple-400" />
                    Insights Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {metrics && (
                    <div className="space-y-3">
                      
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-white">Risk Scoring</span>
                        </div>
                        <p className="text-xs text-white/70">
                          {metrics.activeCampaigns > 0 
                            ? 'Sistema monitoreando riesgos culturales en tiempo real'
                            : 'Activa una campaña para análisis predictivo de riesgos'}
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-white">Analytics Histórico</span>
                        </div>
                        <p className="text-xs text-white/70">
                          {metrics.completedCampaigns > 0
                            ? `Análisis evolutivo disponible: ${metrics.completedCampaigns} estudios completados`
                            : 'Completa más estudios para trends analysis histórico'}
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium text-white">Recomendaciones IA</span>
                        </div>
                        <p className="text-xs text-white/70">
                          {metrics.activeCampaigns > 0
                            ? 'Monitorea alertas automáticas y progreso en tiempo real'
                            : metrics.completedCampaigns > 0
                              ? 'Considera nueva medición trimestral para análisis evolutivo'
                              : 'Inicia con Pulso Express para diagnóstico organizacional rápido'}
                        </p>
                      </div>
                      
                    </div>
                  )}

                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full text-xs border-white/20 text-white hover:bg-white/10 focus-ring"
                    >
                      Ver Insights Detallados
                    </Button>
                  </div>
                  
                </CardContent>
              </Card>

              {/* ✅ TIPS RECOMENDACIONES */}
              <Card className="professional-card border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5 text-orange-400" />
                    Kit Inteligente Comunicación
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
                    className="w-full text-xs border-white/20 text-white hover:bg-white/10 focus-ring"
                  >
                    Mejores Prácticas
                  </Button>
                  
                </CardContent>
              </Card>

            </div>
          </div>
              {/* ✅ NUEVO: Widget Insights Retención Predictiva */}
          <div className="mt-8">
            {campaigns.some(c => c.campaignType?.slug === 'retencion-predictiva') && (
             <DashboardWidget_ExitInsights 
             campaignId={campaigns.find(c => c.campaignType?.slug === 'retencion-predictiva')?.id}
             className="w-full"
             />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}