'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Award
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import CampaignActionButtons from '@/components/dashboard/CampaignActionButtons';
import './dashboard.css'; // Solo estilos de layout

// Tipos básicos (MANTENIDOS EXACTOS)
interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number;
  topPerformingCampaign?: string;
}

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

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
}

// Hook para métricas (LÓGICA MANTENIDA 100% EXACTA)
function useMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('focalizahr_token');
      
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const response = await fetch('/api/campaigns/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      // Datos simulados para desarrollo
      setMetrics({
        totalCampaigns: 21,
        activeCampaigns: 0,
        completedCampaigns: 0,
        globalParticipationRate: 0.0,
        totalResponses: 0,
        totalParticipants: 0,
        weeklyGrowth: 25,
        monthlyGrowth: 15,
        averageCompletionTime: 8.5,
        topPerformingCampaign: 'Evaluación Q4 2024'
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Auto-refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, lastUpdated, refetch: fetchMetrics };
}

// Hook para alertas (LÓGICA MANTENIDA 100% EXACTA)
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulación de alertas para desarrollo
    setAlerts([
      {
        id: '1',
        type: 'info',
        title: 'Sistema actualizado',
        message: 'Nueva versión disponible con mejoras de rendimiento.',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'warning', 
        title: 'Campaña próxima a vencer',
        message: 'La campaña "Q4 2024" finaliza en 2 días.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        campaignId: 'campaign-123'
      }
    ]);
  }, []);

  return { alerts, loading };
}

// Hook para campañas (LÓGICA MANTENIDA 100% EXACTA)
function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCampaigns = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('focalizahr_token');
      
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCampaigns(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      // Datos simulados para desarrollo
      setCampaigns([]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 60000); // Auto-refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  return { campaigns, loading, error, lastUpdated, refetch: fetchCampaigns };
}

// Componente de Métricas (MANTENIDO 100% ORIGINAL)
function MetricsOverview() {
  const { metrics, loading, error, lastUpdated } = useMetrics();

  if (loading) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="professional-card">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse skeleton-layout"></div>
              <div className="h-8 bg-muted rounded w-16 mb-4 animate-pulse skeleton-layout"></div>
              <div className="h-3 bg-muted rounded w-32 animate-pulse skeleton-layout"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error cargando métricas: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const metricCards = [
    {
      title: "Total Campañas",
      value: metrics.totalCampaigns,
      description: `+${metrics.activeCampaigns} activas`,
      trend: `+${metrics.weeklyGrowth}% semanal`,
      icon: BarChart3,
      accent: 'cyan' as const
    },
    {
      title: "Participación Global", 
      value: `${metrics.globalParticipationRate.toFixed(1)}%`,
      description: `${metrics.totalParticipants} de ${metrics.totalParticipants} invitados`,
      trend: `+100% vs mes anterior`,
      icon: Users,
      accent: 'purple' as const
    },
    {
      title: "Campañas Activas",
      value: metrics.activeCampaigns,
      description: "En progreso ahora",
      trend: metrics.activeCampaigns > 0 ? "En tiempo real" : "Sin actividad",
      icon: Activity,
      accent: 'blue' as const
    },
    {
      title: "Completadas", 
      value: metrics.completedCampaigns,
      description: "Finalizadas exitosamente",
      trend: metrics.completedCampaigns > 0 ? "Con resultados" : "Próximamente",
      icon: CheckCircle,
      accent: 'green' as const
    }
  ];

  return (
    <>
      <div className="metrics-grid">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className={`metric-card-elegant accent-${metric.accent}`}>
              <CardContent className="p-6">
                <div className="layout-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {metric.title}
                    </p>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {metric.value}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                  <div className="mini-icon-container bg-primary/10">
                    <Icon className="h-4 w-4 text-primary metric-icon" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {metric.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lastUpdated && (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-4">
          <div className="layout-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Sistema Operativo</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Última actualización:</span>
                <time className="text-xs">{lastUpdated.toLocaleTimeString()}</time>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/20" />
              <span className="text-white/70">Actualización automática cada 60s</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="h-3 w-3" />
              <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente de Alertas (MIGRADO AL SISTEMA GLOBAL)
function AlertsPanel() {
  const { alerts } = useAlerts();

  if (alerts.length === 0) return null;

  return (
    <Card className="professional-card border-l-4 border-l-yellow-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 layout-center">
            <Bell className="h-5 w-5 text-yellow-600" />
          </div>
          <CardTitle className="text-lg">Alertas del Sistema</CardTitle>
          <Badge variant="secondary">{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <Alert key={alert.id} className={`${
            alert.type === 'warning' ? 'border-yellow-200' :
            alert.type === 'success' ? 'border-green-200' :
            'border-blue-200'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              alert.type === 'warning' ? 'text-yellow-600' :
              alert.type === 'success' ? 'text-green-600' :
              'text-blue-600'
            }`} />
            <div className="layout-between items-start">
              <div>
                <div className="font-medium">{alert.title}</div>
                <AlertDescription className="text-sm">{alert.message}</AlertDescription>
              </div>
              <span className="text-xs text-muted-foreground">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </Alert>
        ))}
        {alerts.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" className="focus-ring">
              Ver todas las alertas ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para Lista de Campañas (🔥 CON BOTÓN ACTIVAR AGREGADO)
function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = useCampaigns();

  // 🔥 FUNCIONES NUEVAS AGREGADAS - INCREMENTAL SEGURO
  
  // Función para activar campaña
  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    
    if (!confirmed) return;

    try {
      console.log('🚀 Activando campaña:', campaignId);
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'activate' })
      });

      if (response.ok) {
        alert(`✅ Campaña "${campaignName}" activada!`);
        refetch();
      } else {
        // Simulación mientras no existe API
        alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
    }
  };

  // Función para otras acciones
  const handleCampaignAction = async (campaignId: string, action: string, campaignName: string) => {
    console.log('🎯 Acción:', action, 'para campaña:', campaignName);
    
    switch (action) {
      case 'monitor':
        router.push(`/dashboard/campaigns/${campaignId}/monitor`);
        break;
      case 'view-results':
        router.push(`/dashboard/campaigns/${campaignId}/results`);
        break;
      case 'preview-results':
        router.push(`/dashboard/campaigns/${campaignId}/preview-results`);
        break;
      default:
        alert(`🧪 SIMULACIÓN: Acción "${action}" para "${campaignName}"`);
    }
  };

  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700' },
      active: { label: 'Activa', variant: 'default' as const, className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completada', variant: 'outline' as const, className: 'bg-blue-100 text-blue-700' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
        {riskLevel && status === 'active' && (
          <Badge variant={
            riskLevel === 'high' ? 'destructive' :
            riskLevel === 'medium' ? 'secondary' : 'outline'
          }>
            <Shield className="h-3 w-3 mr-1" />
            Riesgo {riskLevel === 'high' ? 'Alto' : riskLevel === 'medium' ? 'Medio' : 'Bajo'}
          </Badge>
        )}
      </div>
    );
  };

  // 🔥 FUNCIÓN ACTUALIZADA - getActionButton CON NUEVAS FUNCIONES
  const getActionButton = (campaign: Campaign) => {
    switch (campaign.status) {
      case 'draft':
        return (
          <Button 
            size="sm" 
            disabled={!campaign.canActivate}
            onClick={() => handleActivateCampaign(campaign.id, campaign.name)}
            className="btn-gradient focus-ring"
          >
            <Play className="h-3 w-3 mr-1" />
            Activar
          </Button>
        );
      case 'active':
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleCampaignAction(campaign.id, 'monitor', campaign.name)}
              className="focus-ring"
            >
              <Eye className="h-3 w-3 mr-1" />
              Monitorear
            </Button>
            {campaign.participationRate > 20 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCampaignAction(campaign.id, 'preview-results', campaign.name)}
                className="focus-ring"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Vista Previa
              </Button>
            )}
          </div>
        );
      case 'completed':
        return (
          <Button 
            size="sm" 
            disabled={!campaign.canViewResults}
            onClick={() => handleCampaignAction(campaign.id, 'view-results', campaign.name)}
            className="focus-ring"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Ver Resultados
          </Button>
        );
      default:
        return null;
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return (
          <span title="Tendencia positiva">
            <TrendingUp className="h-3 w-3 text-green-600" />
          </span>
        );
      case 'down':
        return (
          <span title="Tendencia negativa">
            <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
          </span>
        );
      case 'stable':
        return (
          <span title="Tendencia estable">
            <Target className="h-3 w-3 text-blue-600" />
          </span>
        );
      default:
        return null;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.campaignType.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Ordenar campañas: activas primero, luego por fecha de creación
  const sortedCampaigns = filteredCampaigns.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  if (loading && campaigns.length === 0) {
    return (
      <Card className="professional-card">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 mb-2 animate-pulse skeleton-layout"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse skeleton-layout"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse skeleton-layout"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card campaigns-list">
      <CardHeader>
        <div className="layout-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 focalizahr-gradient-text">
              <BarChart3 className="h-5 w-5" />
              Mis Campañas
            </CardTitle>
            <CardDescription className="mt-1">
              Gestiona y monitorea tus mediciones de clima organizacional
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="focus-ring"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/campaigns/new')}
              className="btn-gradient focus-ring"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar campañas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 focus-ring"
            />
          </div>

          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todas', count: campaigns.length },
              { key: 'active', label: 'Activas', count: campaigns.filter(c => c.status === 'active').length },
              { key: 'completed', label: 'Completadas', count: campaigns.filter(c => c.status === 'completed').length },
              { key: 'draft', label: 'Borradores', count: campaigns.filter(c => c.status === 'draft').length }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                onClick={() => setFilter(key as any)}
                className="focus-ring"
              >
                <Filter className="h-3 w-3 mr-1" />
                {label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <div className="layout-between">
              <AlertDescription>{error}</AlertDescription>
              <Button size="sm" variant="outline" onClick={refetch} className="focus-ring">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        {sortedCampaigns.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 layout-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'all' ? '¡Comienza tu primera medición!' : 'No se encontraron campañas'}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Crea tu primera campaña para comenzar a medir el clima organizacional de tu empresa'
                : `No hay campañas con el filtro "${filter}" aplicado`
              }
            </p>
            <Button 
              onClick={() => router.push('/dashboard/campaigns/new')}
              className="btn-gradient focus-ring"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Campaña
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCampaigns.map((campaign) => (
              <Card key={campaign.id} className="campaign-card-layout hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="layout-between">
                    <div className="flex-1">
                      <div className="layout-between mb-2">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.totalResponded}/{campaign.totalInvited} respuestas
                        </div>
                        {campaign.lastActivity && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {campaign.lastActivity}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {campaign.status === 'active' && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {campaign.participationRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Participación
                          </div>
                        </div>
                      )}
                      
                      <CampaignActionButtons 
                        campaign={campaign}
                        onActivateCampaign={handleActivateCampaign}
                        onCampaignAction={handleCampaignAction}
                      />
                    </div>
                  </div>
                  
                  {campaign.status === 'active' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="layout-between text-xs text-muted-foreground mb-2">
                        <span>Progreso de respuestas</span>
                        <span>{campaign.participationRate}% completado</span>
                      </div>
                      <div className="progress-container">
                        <div className={`progress-fill ${
                          campaign.participationRate >= 70 ? 
                          'bg-green-500' :
                          campaign.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {lastUpdated && sortedCampaigns.length > 0 && (
          <div className="mt-6 pt-4 border-t layout-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Datos actualizados automáticamente</span>
            </div>
            <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente Principal del Dashboard (🔥 ACTUALIZADO CON NAVEGACIÓN)
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen layout-center">
        <div className="layout-column items-center layout-gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium mt-4">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔥 NAVEGACIÓN INTEGRADA */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* 🔥 CONTENIDO PRINCIPAL CON OFFSET PARA NAVEGACIÓN */}
      <div className="lg:ml-64">
        <div className="neural-dashboard main-layout">      
          <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
            {/* Header */}
            <div className="layout-between">
              <div>
                <h1 className="text-4xl font-bold focalizahr-gradient-text">
                  Dashboard FocalizaHR
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Inteligencia organizacional en tiempo real
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Card className="glass-card">
                  <CardContent className="status-widget-layout p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sistema Activo</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </div>
                    <Button size="sm" variant="outline" className="focus-ring">
                      <Bell className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Métricas Overview */}
            <MetricsOverview />

            {/* Alertas Panel */}
            <AlertsPanel />

            {/* Lista de Campañas */}
            <CampaignsList />

            {/* Quick Actions Footer - SECCIÓN RECUPERADA */}
            <Card className="professional-card">
              <CardContent className="p-6">
                <div className="layout-between">
                  <div>
                    <h3 className="font-semibold mb-1">¿Necesitas ayuda?</h3>
                    <p className="text-sm text-muted-foreground">
                      Accede a recursos y documentación para aprovechar al máximo FocalizaHR
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="focus-ring">
                      <Target className="h-4 w-4 mr-2" />
                      Documentación
                    </Button>
                    <Button variant="outline" size="sm" className="focus-ring">
                      <Award className="h-4 w-4 mr-2" />
                      Soporte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Quick View - NUEVA SECCIÓN PREMIUM */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Vista Rápida Analytics
                </CardTitle>
                <CardDescription>
                  Resumen de tendencias y patrones organizacionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">8.5/10</div>
                    <div className="text-sm text-muted-foreground">Clima Promedio</div>
                    <div className="text-xs text-green-600 mt-1">+0.3 vs anterior</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">87%</div>
                    <div className="text-sm text-muted-foreground">Engagement</div>
                    <div className="text-xs text-green-600 mt-1">+5% este mes</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">2.1%</div>
                    <div className="text-sm text-muted-foreground">Riesgo Rotación</div>
                    <div className="text-xs text-green-600 mt-1">-0.8% mejora</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Analytics Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}2">
                          {getTrendIcon(campaign.completionTrend)}
                          {getStatusBadge(campaign.status, campaign.riskLevel)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {campaign.campaignType.name} • {campaign.totalInvited} participantes
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-