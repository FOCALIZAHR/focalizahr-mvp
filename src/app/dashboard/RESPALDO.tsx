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
import './dashboard.css'; // 🎨 ÚNICO IMPORT AGREGADO

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

// Componente para Cards de Métricas (SOLO CLASES CSS CAMBIADAS)
function MetricsCards() {
  const { metrics, loading, error, lastUpdated, refetch } = useMetrics();

  if (loading && !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="neural-card animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-16 mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="neural-card error-state md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-300">Error al cargar métricas: {error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} className="neural-button-outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const participationColor = metrics.globalParticipationRate >= 70 ? 'text-green-500' : 
                            metrics.globalParticipationRate >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Campañas - SOLO CLASES CAMBIADAS */}
        <div className="neural-card metric-card-primary">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Total Campañas</h3>
            <div className="neural-icon-wrapper primary">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400 neural-glow">{metrics.totalCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <Activity className="h-3 w-3" />
              <span>+{metrics.activeCampaigns} activas</span>
              {metrics.weeklyGrowth && (
                <Badge className="neural-badge-outline text-xs">
                  +{metrics.weeklyGrowth}% semanal
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Participación Global - SOLO CLASES CAMBIADAS */}
        <div className="neural-card metric-card-secondary">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Participación Global</h3>
            <div className="neural-icon-wrapper secondary">
              <TrendingUp className={`h-4 w-4 ${participationColor}`} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold neural-glow ${participationColor}`}>
              {metrics.globalParticipationRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <Users className="h-3 w-3" />
              <span>{metrics.totalResponses} de {metrics.totalParticipants} invitados</span>
            </div>
            {metrics.monthlyGrowth && (
              <div className="mt-2">
                <Badge className={metrics.monthlyGrowth > 0 ? "neural-badge-success" : "neural-badge-secondary"} >
                  {metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth}% vs mes anterior
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Campañas Activas - SOLO CLASES CAMBIADAS */}
        <div className="neural-card metric-card-tertiary">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Campañas Activas</h3>
            <div className="neural-icon-wrapper tertiary">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 neural-glow">{metrics.activeCampaigns}</div>
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

        {/* Card 4: Completadas - SOLO CLASES CAMBIADAS */}
        <div className="neural-card metric-card-quaternary">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Completadas</h3>
            <div className="neural-icon-wrapper quaternary">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400 neural-glow">{metrics.completedCampaigns}</div>
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

      {/* Status Bar Premium - SOLO CLASES CAMBIADAS */}
      {lastUpdated && (
        <div className="neural-status-bar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="neural-pulse-dot"></div>
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
      )}
    </>
  );
}

// Componente de Alertas Premium - SOLO CLASES CAMBIADAS
function AlertsPanel() {
  const { alerts } = useAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="neural-card alerts-panel">
      <div className="flex items-center gap-2 mb-6">
        <div className="neural-icon-wrapper warning">
          <Bell className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">Alertas del Sistema</h3>
        <Badge className="neural-badge-secondary">{alerts.length}</Badge>
      </div>
      <div className="space-y-3">
        {alerts.slice(0, 3).map((alert) => (
          <div key={alert.id} className={`neural-alert alert-${alert.type}`}>
            <AlertTriangle className={`h-4 w-4 ${
              alert.type === 'warning' ? 'text-yellow-400' :
              alert.type === 'success' ? 'text-green-400' :
              'text-blue-400'
            }`} />
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-white">{alert.title}</div>
                <div className="text-sm text-white/70">{alert.message}</div>
              </div>
              <span className="text-xs text-white/50">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {alerts.length > 3 && (
          <div className="text-center pt-2">
            <Button className="neural-button-outline text-sm">
              Ver todas las alertas ({alerts.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para Lista de Campañas Premium - LÓGICA EXACTA, SOLO CLASES CAMBIADAS
function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { campaigns, loading, error, lastUpdated, refetch } = useCampaigns();

  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', className: 'neural-badge-secondary', icon: Clock },
      active: { label: 'Activa', className: 'neural-badge-success', icon: Activity },
      completed: { label: 'Completada', className: 'neural-badge-primary', icon: CheckCircle },
      cancelled: { label: 'Cancelada', className: 'neural-badge-error', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={config.className}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        {riskLevel && status === 'active' && (
          <Badge className={`${
            riskLevel === 'high' ? 'neural-badge-error' :
            riskLevel === 'medium' ? 'neural-badge-warning' : 'neural-badge-outline'
          }`}>
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
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/activate`)}
            className="neural-button-primary"
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
              onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/monitor`)}
              className="neural-button-secondary"
            >
              <Eye className="h-3 w-3 mr-1" />
              Monitorear
            </Button>
            {campaign.participationRate > 20 && (
              <Button 
                size="sm" 
                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/preview-results`)}
                className="neural-button-outline"
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
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/results`)}
            className="neural-button-tertiary"
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
        // LÍNEA CORREGIDA:
return (
  <span title="Tendencia positiva">
    <TrendingUp className="h-3 w-3 text-green-400 neural-glow" />
  </span>
);
      case 'down':
        return (
  <span title="Tendencia negativa">
    <TrendingUp className="h-3 w-3 text-red-400 rotate-180 neural-glow" />
  </span>
);
      case 'stable':
        // LÍNEA CORREGIDA:
return (
  <span title="Tendencia estable">
    <Target className="h-3 w-3 text-blue-400 neural-glow" />
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
      <div className="neural-card">
        <div className="h-6 bg-white/10 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-white/10 rounded w-48 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="neural-card campaigns-list">
      <div className="neural-card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2 text-white neural-glow">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Mis Campañas
            </h3>
            <p className="text-white/60 mt-1">
              Gestiona y monitorea tus mediciones de clima organizacional
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={refetch}
              disabled={loading}
              className="neural-button-outline"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/campaigns/new')}
              className="neural-button-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input 
              placeholder="Buscar campañas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neural-input pl-9"
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
                onClick={() => setFilter(key as any)}
                className={filter === key ? 'neural-button-primary' : 'neural-button-outline'}
              >
                <Filter className="h-3 w-3 mr-1" />
                {label}
                {count > 0 && (
                  <Badge className="neural-badge-secondary ml-1 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="neural-alert alert-error mb-4">
            <div className="flex items-center justify-between">
              <span className="text-white">{error}</span>
              <Button size="sm" onClick={refetch} className="neural-button-outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {sortedCampaigns.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="neural-icon-wrapper large mx-auto mb-4">
              <BarChart3 className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">
              {filter === 'all' ? '¡Comienza tu primera medición!' : 'No se encontraron campañas'}
            </h3>
            <p className="text-white/60 mb-4 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Crea tu primera campaña de clima organizacional y obtén insights valiosos sobre tu equipo.'
                : `No hay campañas en estado "${filter}" que coincidan con tu búsqueda.`
              }
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="neural-button-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="neural-campaign-card"
              >
                {/* Indicador de estado lateral */}
                <div className={`campaign-status-indicator status-${campaign.status}`}></div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 ml-4">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-white neural-glow">
                        {campaign.name}
                      </h3>
                      {getStatusBadge(campaign.status, campaign.riskLevel)}
                      <Badge className="neural-badge-outline">
                        {campaign.campaignType.name}
                      </Badge>
                      {campaign.isOverdue && (
                        <Badge className="neural-badge-error animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Vencida
                        </Badge>
                      )}
                      {getTrendIcon(campaign.completionTrend)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="neural-mini-icon primary">
                          <Users className="h-3 w-3" />
                        </div>
                        <span className="text-white/70">
                          <span className="font-medium text-white">{campaign.totalResponded}</span>/{campaign.totalInvited} participantes
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="neural-mini-icon secondary">
                          <TrendingUp className="h-3 w-3" />
                        </div>
                        <span className="text-white/70">
                          <span className={`font-medium ${
                            campaign.participationRate >= 70 ? 'text-green-400' :
                            campaign.participationRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {campaign.participationRate.toFixed(1)}%
                          </span> participación
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="neural-mini-icon tertiary">
                          <Calendar className="h-3 w-3" />
                        </div>
                        <span className="text-white/70">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {campaign.status === 'active' && campaign.daysRemaining !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`neural-mini-icon ${campaign.daysRemaining > 0 ? 'primary' : 'error'}`}>
                            <Clock className="h-3 w-3" />
                          </div>
                          <span className={`text-sm font-medium ${
                            campaign.daysRemaining > 0 ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {campaign.daysRemaining > 0 
                              ? `${campaign.daysRemaining} días restantes` 
                              : `Vencida hace ${Math.abs(campaign.daysRemaining)} días`
                            }
                          </span>
                        </div>
                      )}

                      {campaign.lastActivity && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Zap className="h-3 w-3" />
                          <span>Última actividad: {campaign.lastActivity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {getActionButton(campaign)}
                  </div>
                </div>

                {/* Barra de progreso visual */}
                {campaign.status === 'active' && (
                  <div className="mt-3 pt-3 border-t border-white/10 mx-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                      <span>Progreso de participación</span>
                      <span>{campaign.participationRate.toFixed(1)}%</span>
                    </div>
                    <div className="neural-progress-bar">
                      <div 
                        className={`neural-progress-fill ${
                          campaign.participationRate >= 70 ? 'success' :
                          campaign.participationRate >= 50 ? 'warning' : 'error'
                        }`}
                        style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {lastUpdated && sortedCampaigns.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <div className="neural-pulse-dot small"></div>
              <span>Datos actualizados automáticamente</span>
            </div>
            <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Principal del Dashboard - LÓGICA EXACTA, SOLO CLASES CAMBIADAS
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="neural-loading-screen">
        <div className="neural-loader">
          <div className="neural-spinner"></div>
          <span className="text-lg font-medium text-white mt-4">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="neural-dashboard">
      <div className="neural-background"></div>
      
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Header Premium - SOLO CLASES CAMBIADAS */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neural-gradient-text">
              Dashboard FocalizaHR
            </h1>
            <p className="text-white/70 mt-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Inteligencia organizacional en tiempo real
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="neural-status-widget">
              <div className="flex items-center gap-2">
                <div className="neural-pulse-dot"></div>
                <span className="font-medium text-white/90">Sistema Activo</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/20" />
              <span className="text-white/70">{new Date().toLocaleDateString()}</span>
            </div>
            
            <Button 
              size="sm"
              onClick={() => router.push('/dashboard/settings')}
              className="neural-button-outline"
            >
              Configuración
            </Button>
          </div>
        </div>

        {/* Métricas Cards Premium */}
        <MetricsCards />

        {/* Alertas Premium */}
        <AlertsPanel />

        {/* Separador Neural */}
        <div className="neural-separator"></div>

        {/* Lista de Campañas Premium */}
        <CampaignsList />

        {/* Footer del Dashboard */}
        <div className="neural-footer">
          <div className="flex items-center justify-center gap-4 text-xs text-white/50">
            <span>© {new Date().getFullYear()} FocalizaHR</span>
            <Separator orientation="vertical" className="h-3 bg-white/20" />
            <span>Versión 1.0.0</span>
            <Separator orientation="vertical" className="h-3 bg-white/20" />
            <span>Inteligencia Organizacional</span>
          </div>
        </div>
      </div>
    </div>
  );
}