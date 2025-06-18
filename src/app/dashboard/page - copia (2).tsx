'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import './dashboard.css' 
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
      setMetrics(data.overview);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Actualización cada minuto
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, lastUpdated, refetch: fetchMetrics };
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
      setCampaigns(data.campaigns);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 120000); // Actualización cada 2 minutos
    return () => clearInterval(interval);
  }, []);

  return { campaigns, loading, error, lastUpdated, refetch: fetchCampaigns };
}

// Hook para alertas automáticas (LÓGICA MANTENIDA EXACTA)
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { campaigns } = useCampaigns();

  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];

      campaigns.forEach(campaign => {
        // Alerta de baja participación
        if (campaign.status === 'active' && campaign.participationRate < 30) {
          newAlerts.push({
            id: `low-participation-${campaign.id}`,
            type: 'warning',
            title: 'Baja Participación',
            message: `${campaign.name} tiene solo ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alerta de campaña próxima a vencer
        if (campaign.status === 'active' && campaign.daysRemaining !== undefined && campaign.daysRemaining <= 2) {
          newAlerts.push({
            id: `expiring-${campaign.id}`,
            type: 'warning',
            title: 'Campaña Próxima a Vencer',
            message: `${campaign.name} vence en ${campaign.daysRemaining} días`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }

        // Alerta de alta participación (positiva)
        if (campaign.status === 'active' && campaign.participationRate > 80) {
          newAlerts.push({
            id: `high-participation-${campaign.id}`,
            type: 'success',
            title: 'Excelente Participación',
            message: `${campaign.name} alcanzó ${campaign.participationRate.toFixed(1)}% de participación`,
            timestamp: new Date(),
            campaignId: campaign.id
          });
        }
      });

      setAlerts(newAlerts);
    };

    generateAlerts();
  }, [campaigns]);

  return { alerts };
}

// Componente para Cards de Métricas (REFINAMIENTO VISUAL PREMIUM)
function MetricsCards() {
  const { metrics, loading, error, lastUpdated, refetch } = useMetrics();

  if (loading && !metrics) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="professional-card animate-fade-in">
            <div className="h-4 bg-muted rounded w-24 mb-2 skeleton-layout"></div>
            <div className="h-8 bg-muted rounded w-16 mb-1 skeleton-layout"></div>
            <div className="h-3 bg-muted rounded w-32 skeleton-layout"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="metrics-grid">
        <Card className="professional-card border-destructive md:col-span-2 lg:col-span-4">
          <CardContent className="layout-between p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">Error al cargar métricas: {error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} className="focus-ring">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  const participationColor = metrics.globalParticipationRate >= 70 ? 'text-green-600' : 
                            metrics.globalParticipationRate >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      <div className="metrics-grid">
        {/* Card 1: Total Campañas */}
        <div className="metric-card-elegant accent-cyan">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Total Campañas</h3>
            <div className="w-10 h-10 rounded-lg bg-primary/20 layout-center">
              <BarChart3 className="h-4 w-4 text-primary metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.totalCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <Activity className="h-3 w-3" />
              <span>+{metrics.activeCampaigns} activas</span>
              {metrics.weeklyGrowth && (
                <Badge variant="outline" className="text-xs">
                  +{metrics.weeklyGrowth}% semanal
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Participación Global */}
        <div className="metric-card-elegant accent-purple">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Participación Global</h3>
            <div className="w-10 h-10 rounded-lg bg-secondary/20 layout-center">
              <TrendingUp className={`h-4 w-4 metric-icon ${participationColor}`} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">
              {metrics.globalParticipationRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <Users className="h-3 w-3" />
              <span>{metrics.totalResponses} de {metrics.totalParticipants} invitados</span>
            </div>
            {metrics.monthlyGrowth && (
              <div className="mt-2">
                <Badge variant={metrics.monthlyGrowth > 0 ? "default" : "secondary"}>
                  {metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth}% vs mes anterior
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Campañas Activas */}
        <div className="metric-card-elegant accent-blue">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Campañas Activas</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 layout-center">
              <Activity className="h-4 w-4 text-blue-400 metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.activeCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-blue-300">
              <Clock className="h-3 w-3" />
              <span>En progreso ahora</span>
            </div>
            {metrics.averageCompletionTime && (
              <div className="mt-2 text-xs text-white/60">
                Tiempo promedio: {metrics.averageCompletionTime} min
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Completadas */}
        <div className="metric-card-elegant accent-green">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Completadas</h3>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 layout-center">
              <CheckCircle className="h-4 w-4 text-green-400 metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.completedCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-green-300">
              <Award className="h-3 w-3" />
              <span>Finalizadas exitosamente</span>
            </div>
            {metrics.topPerformingCampaign && (
              <div className="mt-2 text-xs text-white/60 truncate">
                Top: {metrics.topPerformingCampaign}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar Elegante */}
      {lastUpdated && (
        <div className="status-bar-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-white/90">Sistema Activo</span>
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

// Componente para Lista de Campañas (MIGRADO AL SISTEMA GLOBAL)
// =======================================================================
// 👇 REEMPLAZA LA FUNCIÓN ANTIGUA CON ESTE BLOQUE COMPLETO 👇
// =======================================================================
function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = useCampaigns();

  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active', action: 'activate' })
      });
      if (response.ok) {
        alert(`✅ Campaña "${campaignName}" activada!`);
        refetch();
      } else {
        alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
    }
  };

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
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock, badgeClass: 'badge-gradient-draft' },
      active: { label: 'Activa', variant: 'default' as const, icon: Activity, badgeClass: 'badge-gradient-active' },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle, badgeClass: 'badge-gradient-completed' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: Clock, badgeClass: 'badge-gradient-cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <Badge className={config.badgeClass}>
          <Icon className="h-3 w-3 mr-1" />
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
                ? 'Crea tu primera campaña de clima organizacional y obtén insights valiosos sobre tu equipo.'
                : `No hay campañas en estado "${filter}" que coincidan con tu búsqueda.`
              }
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="btn-gradient focus-ring"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCampaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className="professional-card campaign-card-layout hover:shadow-md transition-shadow"
              >
                <div className={`campaign-status-indicator ${
                  campaign.status === 'active' ? 'bg-green-500' :
                  campaign.status === 'completed' ? 'bg-blue-500' :
                  campaign.status === 'draft' ? 'bg-gray-400' : 'bg-red-500'
                }`}></div>

                <CardContent className="layout-between flex-wrap gap-y-4 p-4">
                  <div className="flex-1 ml-4" style={{ minWidth: '250px' }}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                      <h3 className="font-semibold text-lg focalizahr-gradient-text">
                        {campaign.name}
                      </h3>
                      {getStatusBadge(campaign.status, campaign.riskLevel)}
                      <Badge variant="outline">
                        {campaign.campaignType.name}
                      </Badge>
                      {campaign.isOverdue && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Vencida
                        </Badge>
                      )}
                      {getTrendIcon(campaign.completionTrend)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="mini-icon-container bg-primary/20">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground font-normal">
                          <span className="font-semibold text-foreground">{campaign.totalResponded}</span>/{campaign.totalInvited} participantes
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="mini-icon-container bg-secondary/20">
                          <TrendingUp className="h-3 w-3 text-secondary" />
                        </div>
                        <span className="text-muted-foreground font-normal">
                          <span className={`font-semibold ${
                            campaign.participationRate >= 70 ? 'text-green-600' :
                            campaign.participationRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {campaign.participationRate.toFixed(1)}%
                          </span> participación
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="mini-icon-container bg-blue-500/20">
                          <Calendar className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-muted-foreground font-normal">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {campaign.status === 'active' && campaign.daysRemaining !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`mini-icon-container ${campaign.daysRemaining > 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                            <Clock className={`h-3 w-3 ${campaign.daysRemaining > 0 ? 'text-blue-600' : 'text-red-600'}`} />
                          </div>
                          <span className={`text-sm font-semibold ${
                            campaign.daysRemaining > 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {campaign.daysRemaining > 0 
                              ? `${campaign.daysRemaining} días restantes` 
                              : `Vencida hace ${Math.abs(campaign.daysRemaining)} días`
                            }
                          </span>
                        </div>
                      )}

                      {campaign.lastActivity && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                          <Zap className="h-3 w-3" />
                          <span>Última actividad: {campaign.lastActivity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {getActionButton(campaign)}
                  </div>
                </CardContent>

                {campaign.status === 'active' && (
                  <div className="mt-3 pt-3 border-t mx-4 pb-4">
                    <div className="layout-between text-xs text-muted-foreground mb-1">
                      <span>Progreso de participación</span>
                      <span>{campaign.participationRate.toFixed(1)}%</span>
                    </div>
                    <div className="progress-container bg-muted">
                      <div 
                        className={`progress-fill ${
                          campaign.participationRate >= 70 ? 'bg-green-500' :
                          campaign.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
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
        <div className="neural-dashboard main-layout min-h-screen">      
          <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold focalizahr-gradient-text">
                  Dashboard FocalizaHR
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Inteligencia organizacional en tiempo real
                </p>
              </div>
              
              <div className="hidden md:flex items-center gap-4">
                <Card className="glass-card">
                  <CardContent className="status-widget-layout p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sistema Activo</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
                  </CardContent>
                </Card>
                
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings')}
                  className="focus-ring hidden lg:flex"
                >
                  Configuración
                </Button>
              </div>
            </div>
{/* Acciones móviles */}
              <div className="flex md:hidden flex-col gap-3">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings')}
                  className="mobile-touch-target w-full"
                >
                  Configuración
                </Button>
                <Card className="glass-card">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Sistema Activo</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            {/* Métricas Cards */}
            <MetricsCards />

            {/* Alertas */}
            <AlertsPanel />

            {/* Separador */}
            <div className="separator-layout bg-border"></div>

            {/* Lista de Campañas */}
            <CampaignsList />

            {/* Footer del Dashboard */}
            <Card className="glass-card">
              <CardContent className="layout-center p-4">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>© {new Date().getFullYear()} FocalizaHR</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Versión 1.0.0</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Inteligencia Organizacional</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}