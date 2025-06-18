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
  Award,
  Menu,
  X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import './dashboard.css';

// Tipos básicos
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

// Hook para métricas
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
      setMetrics(data.overview || data);
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
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, lastUpdated, refetch: fetchMetrics };
}

// Hook para campañas
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
      setCampaigns(data.campaigns || []);
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
    const interval = setInterval(fetchCampaigns, 120000);
    return () => clearInterval(interval);
  }, []);

  return { campaigns, loading, error, lastUpdated, refetch: fetchCampaigns };
}

// Hook para alertas automáticas
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { campaigns } = useCampaigns();

  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];

      campaigns.forEach(campaign => {
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

// Componente para Cards de Métricas
function MetricsCards() {
  const { metrics, loading, error, lastUpdated, refetch } = useMetrics();

  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card className="border-destructive">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">Error al cargar métricas: {error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={refetch} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Campañas */}
        <Card className="metric-card-elegant accent-cyan">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Campañas</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold focalizahr-gradient-text">{metrics.totalCampaigns}</div>
              <div className="flex items-center gap-2 text-xs text-cyan-300 mt-1">
                <Activity className="h-3 w-3 shrink-0" />
                <span>+{metrics.activeCampaigns} activas</span>
                {metrics.weeklyGrowth && (
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    +{metrics.weeklyGrowth}% semanal
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Participación Global */}
        <Card className="metric-card-elegant accent-purple">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Participación Global</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${participationColor}`} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold focalizahr-gradient-text">
                {metrics.globalParticipationRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-300 mt-1">
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate">{metrics.totalResponses} de {metrics.totalParticipants}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Campañas Activas */}
        <Card className="metric-card-elegant accent-blue">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Campañas Activas</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold focalizahr-gradient-text">{metrics.activeCampaigns}</div>
              <div className="flex items-center gap-2 text-xs text-blue-300 mt-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span>En progreso ahora</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Completadas */}
        <Card className="metric-card-elegant accent-green">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Completadas</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold focalizahr-gradient-text">{metrics.completedCampaigns}</div>
              <div className="flex items-center gap-2 text-xs text-green-300 mt-1">
                <Award className="h-3 w-3 shrink-0" />
                <span>Finalizadas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Bar */}
      {lastUpdated && (
        <Card className="status-bar-elegant">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white/90">Sistema Activo</span>
                </div>
                <Separator orientation="vertical" className="h-4 bg-white/20 hidden sm:block" />
                <span className="text-sm text-white/70 hidden sm:block">Actualización automática cada 60s</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Clock className="h-3 w-3" />
                <span>Última: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Componente de Alertas
function AlertsPanel() {
  const { alerts } = useAlerts();

  if (alerts.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </div>
          <CardTitle className="text-base sm:text-lg">Alertas del Sistema</CardTitle>
          <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <Alert key={alert.id} className={`${
            alert.type === 'warning' ? 'border-yellow-200' :
            alert.type === 'success' ? 'border-green-200' :
            'border-blue-200'
          }`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${
              alert.type === 'warning' ? 'text-yellow-600' :
              alert.type === 'success' ? 'text-green-600' :
              'text-blue-600'
            }`} />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{alert.title}</div>
                <AlertDescription className="text-xs">{alert.message}</AlertDescription>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </Alert>
        ))}
        {alerts.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Ver todas las alertas ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para Lista de Campañas
function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = useCampaigns();

  // Función para activar campaña (CORREGIDA)
  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    
    if (!confirmed) return;

    try {
      console.log('🚀 Activando campaña:', campaignId);
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Campaña "${campaignName}" activada!`);
        refetch();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error || 'Error activando campaña'}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      <div className="flex items-center gap-2 flex-wrap">
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
            className="w-full sm:w-auto"
          >
            <Play className="h-3 w-3 mr-1" />
            Activar
          </Button>
        );
      case 'active':
        return (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={() => handleCampaignAction(campaign.id, 'monitor', campaign.name)}
              className="w-full sm:w-auto"
            >
              <Eye className="h-3 w-3 mr-1" />
              Monitor
            </Button>
            {campaign.participationRate > 20 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCampaignAction(campaign.id, 'preview-results', campaign.name)}
                className="w-full sm:w-auto"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Preview
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
            className="w-full sm:w-auto"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Resultados
          </Button>
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
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2 focalizahr-gradient-text">
              <BarChart3 className="h-5 w-5" />
              Mis Campañas
            </CardTitle>
            <CardDescription className="mt-1">
              Gestiona y monitorea tus mediciones de clima organizacional
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/campaigns/new')}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar campañas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
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
                className="flex-1 sm:flex-none"
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <AlertDescription className="flex-1">{error}</AlertDescription>
              <Button size="sm" variant="outline" onClick={refetch} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {sortedCampaigns.length === 0 && !loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {filter === 'all' ? '¡Comienza tu primera medición!' : 'No se encontraron campañas'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto px-4">
              {filter === 'all' 
                ? 'Crea tu primera campaña de clima organizacional y obtén insights valiosos sobre tu equipo.'
                : `No hay campañas en estado "${filter}" que coincidan con tu búsqueda.`
              }
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="w-full sm:w-auto"
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
                className="campaign-card-layout hover:shadow-md transition-shadow"
              >
                {/* Indicador de estado lateral */}
                <div className={`campaign-status-indicator ${
                  campaign.status === 'active' ? 'bg-green-500' :
                  campaign.status === 'completed' ? 'bg-blue-500' :
                  campaign.status === 'draft' ? 'bg-gray-400' : 'bg-red-500'
                }`}></div>

                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header de la campaña */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg focalizahr-gradient-text truncate mb-2">
                          {campaign.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(campaign.status, campaign.riskLevel)}
                          <Badge variant="outline" className="text-xs">
                            {campaign.campaignType.name}
                          </Badge>
                          {campaign.isOverdue && (
                            <Badge variant="destructive" className="animate-pulse text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vencida
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        {getActionButton(campaign)}
                      </div>
                    </div>
                    
                    {/* Métricas de la campaña */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 p-2 sm:p-0">
                        <div className="mini-icon-container bg-primary/20 shrink-0">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground font-normal truncate">
                          <span className="font-semibold text-foreground">{campaign.totalResponded}</span>/{campaign.totalInvited} participantes
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 sm:p-0">
                        <div className="mini-icon-container bg-secondary/20 shrink-0">
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
                      
                      <div className="flex items-center gap-2 p-2 sm:p-0">
                        <div className="mini-icon-container bg-blue-500/20 shrink-0">
                          <Calendar className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-muted-foreground font-normal text-xs sm:text-sm truncate">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {campaign.status === 'active' && campaign.daysRemaining !== undefined && (
                        <div className="flex items-center gap-2 p-2 sm:p-0">
                          <div className={`mini-icon-container shrink-0 ${campaign.daysRemaining > 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                            <Clock className={`h-3 w-3 ${campaign.daysRemaining > 0 ? 'text-blue-600' : 'text-red-600'}`} />
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${
                            campaign.daysRemaining > 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {campaign.daysRemaining > 0 
                              ? `${campaign.daysRemaining} días restantes` 
                              : `Vencida hace ${Math.abs(campaign.daysRemaining)} días`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso visual */}
                  {campaign.status === 'active' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Progreso de participación</span>
                        <span className="font-semibold">{campaign.participationRate.toFixed(1)}%</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {lastUpdated && sortedCampaigns.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Datos actualizados automáticamente</span>
              </div>
              <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente Principal del Dashboard
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm sm:text-lg font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación */}
      <DashboardNavigation 
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      {/* Contenido Principal */}
      <div className="lg:ml-64">
        <div className="neural-dashboard main-layout min-h-screen">      
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 relative z-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold focalizahr-gradient-text">
                  Dashboard FocalizaHR
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  Inteligencia organizacional en tiempo real
                </p>
              </div>
              
              {/* Header Actions - Solo en desktop */}
              <div className="hidden lg:flex items-center gap-4">
                <Card className="glass-card">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sistema Activo</span>
                      <Separator orientation="vertical" className="h-4 mx-2" />
                      <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  Configuración
                </Button>
              </div>
            </div>

            {/* Acciones móviles */}
            <div className="flex lg:hidden flex-col gap-3">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => router.push('/dashboard/settings')}
                className="w-full"
              >
                Configuración
              </Button>
              <Card className="glass-card">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Sistema Activo</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Cards */}
            <MetricsCards />

            {/* Alertas */}
            <AlertsPanel />

            {/* Separador */}
            <div className="h-px bg-border"></div>

            {/* Lista de Campañas */}
            <CampaignsList />

            {/* Footer del Dashboard */}
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                  <span>© {new Date().getFullYear()} FocalizaHR</span>
                  <Separator orientation="vertical" className="h-3 hidden sm:block" />
                  <span>Versión 1.0.0</span>
                  <Separator orientation="vertical" className="h-3 hidden sm:block" />
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