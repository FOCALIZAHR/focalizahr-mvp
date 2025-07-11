// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/useSidebar';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  Search, 
  Plus,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  Bell,
  Calendar,
  Target,
  Zap,
  Shield,
  Award,
  Brain
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import MetricsCards from '@/components/dashboard/MetricsCards';
import CampaignsList from '@/components/dashboard/CampaignsList';
import { useCampaignsContext } from '@/context/CampaignsContext';

// Tipos de datos (consistentes con plataforma)
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignType: {
    name: string;
    slug: string;
  };
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  startDate: string;
  endDate: string;
  canActivate?: boolean;
  canViewResults?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
}

interface Metrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  recentResponses: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  averageCompletionTime: number | null;
  topPerformingCampaign: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isCollapsed } = useSidebar();
  // Context campaigns
  const { campaigns, isLoading: campaignsLoading, error: campaignsError, fetchCampaigns } = useCampaignsContext();
  
  // Estados métricas
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ FUNCIÓN CALCULAR MÉTRICAS
  const calculateMetrics = (campaignsList: Campaign[]): Metrics => {
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: '#0D1117'
       }}>

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            FocalizaHR
          </h2>
          <p className="text-slate-300">Cargando Centro de Inteligencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: '#0D1117'
    }}>
      {/* ✅ REMOVER NEURAL PATTERNS Y GRID - USAR COLOR CORPORATIVO SIMPLE */}
      
      {/* ✅ NAVEGACIÓN LATERAL PREMIUM */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* ✅ CONTENIDO PRINCIPAL */}
      <div className={`min-h-screen relative z-10 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="container mx-auto px-6 py-8">
          
          {/* ✅ HEADER DASHBOARD INTELIGENTE SIMPLE */}
          <div className="mb-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Centro de Inteligencia FocalizaHR
                    </h1>
                  </div>
                  <p className="text-lg text-slate-300/90">
                    Dashboard predictivo con análisis organizacional inteligente
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Sistema Activo
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-cyan-400" />
                      Análisis Procesando
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-purple-400" />
                      Datos Seguros
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadMetrics}
                  disabled={metricsLoading || campaignsLoading}
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading || campaignsLoading ? 'animate-spin' : ''}`} />
                  Sincronizar Datos
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => router.push('/dashboard/campaigns/new')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Medición Inteligente
                </Button>
              </div>
            </div>
            
            {/* ✅ STATUS BAR INTELIGENTE */}
            {lastUpdated && (
              <div className="mt-4 p-3 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Target className="h-4 w-4 text-cyan-400" />
                    <span>Última sincronización: {lastUpdated.toLocaleString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Análisis Activo</span>
                    </div>
                    {metrics && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3 text-purple-400" />
                        <span className="text-purple-400 text-xs">{metrics.activeCampaigns} Procesando</span>
                      </div>
                    )}
                  </div>
                </div>
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

          {/* ✅ REMOVER ALERT - NO NECESARIO PARA NUEVOS USUARIOS */}

          {/* ✅ MÉTRICAS IA PREMIUM */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur"></div>
              <div className="relative bg-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1">
                <MetricsCards 
                  metrics={metrics}
                  loading={metricsLoading}
                  error={metricsError}
                  lastUpdated={lastUpdated}
                  onRefresh={loadMetrics}
                />
              </div>
            </div>
          </div>

          {/* ✅ LAYOUT PRINCIPAL - GRID MÁS BALANCEADO SIN WIDGET */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* ✅ SECCIÓN PRINCIPAL - GESTIÓN CAMPAÑAS */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* ✅ PANEL ALERTAS INTEGRADO */}
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-white/10 shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white font-semibold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-cyan-400" />
                      Centro de Alertas
                    </CardTitle>
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      {campaigns.filter(c => c.status === 'active').length} Activas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'active').slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                          <div>
                            <p className="text-white font-medium">{campaign.name}</p>
                            <p className="text-white/60 text-sm">{campaign.participationRate}% participación</p>
                          </div>
                        </div>
                        <Badge 
                          variant={campaign.participationRate > 70 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {campaign.participationRate > 70 ? 'Excelente' : 'En progreso'}
                        </Badge>
                      </div>
                    ))}
                    
                    {campaigns.filter(c => c.status === 'active').length === 0 && (
                      <div className="text-center py-6 text-white/50">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No hay campañas activas</p>
                        <p className="text-sm">Las alertas aparecerán aquí</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ✅ GESTIÓN CAMPAÑAS IA CON GLASS MORPHISM */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur"></div>
                <div className="relative bg-slate-900/20 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
                  <CampaignsList />
                </div>
              </div>
            </div>

            {/* ✅ SIDEBAR INFORMACIÓN Y ACCIONES - MÁS BALANCEADO */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* ✅ PRÓXIMAS ACCIONES */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    Próximas Acciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'draft').length > 0 && (
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-300 font-medium text-sm">Campaña pendiente</span>
                        </div>
                        <p className="text-white/80 text-sm mb-2">
                          Tienes {campaigns.filter(c => c.status === 'draft').length} campaña(s) por activar
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => router.push('/dashboard/campaigns')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Revisar
                        </Button>
                      </div>
                    )}

                    {campaigns.filter(c => c.status === 'active').length > 0 && (
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-green-400" />
                          <span className="text-green-300 font-medium text-sm">Monitoreo activo</span>
                        </div>
                        <p className="text-white/80 text-sm mb-2">
                          {campaigns.filter(c => c.status === 'active').length} campaña(s) recolectando datos
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => router.push('/dashboard/campaigns')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Monitor
                        </Button>
                      </div>
                    )}

                    {campaigns.filter(c => c.status === 'completed').length > 0 && (
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-300 font-medium text-sm">Resultados listos</span>
                        </div>
                        <p className="text-white/80 text-sm mb-2">
                          {campaigns.filter(c => c.status === 'completed').length} estudio(s) completado(s)
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => router.push('/dashboard/campaigns')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Analizar
                        </Button>
                      </div>
                    )}

                    {campaigns.length === 0 && (
                      <div className="text-center py-4">
                        <Target className="h-6 w-6 mx-auto mb-2 text-white/40" />
                        <p className="text-white/50 text-sm">No hay acciones pendientes</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ✅ ANÁLISIS PREDICTIVO IA */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Análisis Inteligente
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {metrics && (
                        <>
                          <div className="text-center p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
                            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                              {metrics.globalParticipationRate}%
                            </div>
                            <p className="text-cyan-200 text-sm mb-1">Participación Global</p>
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Target className="h-3 w-3 text-cyan-400" />
                              <span className="text-slate-300">
                                {metrics.globalParticipationRate > 70 ? 'Engagement Excelente' :
                                 metrics.globalParticipationRate > 50 ? 'Participación Óptima' :
                                 'Requiere Intervención Inteligente'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-lg font-bold text-green-400">
                                  {metrics.completedCampaigns}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs">Análisis Completados</p>
                            </div>
                            <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Activity className="h-4 w-4 text-blue-400" />
                                <span className="text-lg font-bold text-blue-400">
                                  {metrics.activeCampaigns}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs">Análisis Procesando</p>
                            </div>
                          </div>

                          {metrics.topPerformingCampaign && (
                            <div className="text-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                              <div className="flex items-center justify-center gap-1 mb-2">
                                <Award className="h-4 w-4 text-green-400" />
                                <span className="text-green-300 font-medium text-sm">Mejor Performance</span>
                              </div>
                              <p className="text-white text-sm">{metrics.topPerformingCampaign}</p>
                            </div>
                          )}

                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-300 text-sm flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-400" />
                                Crecimiento Semanal
                              </span>
                              <span className="text-green-400 text-sm font-medium">+{metrics.weeklyGrowth}%</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(metrics.weeklyGrowth, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      )}

                      {!metrics && (
                        <div className="text-center py-6">
                          <Brain className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-pulse" />
                          <p className="text-slate-400 text-sm">Iniciando análisis inteligente...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ ACCESOS RÁPIDOS IA */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/10 to-slate-400/10 rounded-xl blur"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-xl shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 bg-gradient-to-r from-slate-500 to-slate-400 rounded-md flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Accesos Inteligentes
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 group border border-transparent hover:border-cyan-500/30 transition-all duration-300"
                        onClick={() => router.push('/dashboard/campaigns')}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-purple-500 rounded-lg flex items-center justify-center transition-all duration-300">
                            <BarChart3 className="h-4 w-4 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 text-left">Dashboard Campañas</span>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 group border border-transparent hover:border-purple-500/30 transition-all duration-300"
                        onClick={() => router.push('/dashboard/admin/participants')}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-blue-500 rounded-lg flex items-center justify-center transition-all duration-300">
                            <Users className="h-4 w-4 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 text-left">Gestión Participantes</span>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 group border border-transparent hover:border-green-500/30 transition-all duration-300"
                        onClick={() => router.push('/dashboard/settings')}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 rounded-lg flex items-center justify-center transition-all duration-300">
                            <Shield className="h-4 w-4 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 text-left">Configuración Inteligente</span>
                        </div>
                      </Button>
                      
                      <div className="pt-3 mt-3 border-t border-slate-700/50">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 group border border-transparent hover:border-blue-500/40 transition-all duration-300"
                          onClick={() => router.push('/dashboard/campaigns/new')}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                              <Plus className="h-4 w-4 text-white" />
                            </div>
                            <span className="flex-1 text-left font-medium">Nueva Medición Inteligente</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}