'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Award
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import CampaignActionButtons from '@/components/dashboard/CampaignActionButtons';
import '../dashboard.css'; // Estilos corporativos (un nivel arriba)

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

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    fetchCampaigns();
  }, [router]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
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
          router.push('/');
          return;
        }
        throw new Error('Error al cargar campañas');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar campañas
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    
    if (!confirmed) return;

    try {
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
        fetchCampaigns();
      } else {
        alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
    }
  };

  const handleCampaignAction = (campaignId: string, action: string, campaignName: string) => {
    switch (action) {
      case 'monitor':
        router.push(`/dashboard/campaigns/${campaignId}/monitor`);
        break;
      case 'view-results':
        router.push(`/dashboard/campaigns/${campaignId}/results`);
        break;
      case 'edit':
        router.push(`/dashboard/campaigns/${campaignId}/edit`);
        break;
      default:
        alert(`🧪 SIMULACIÓN: Acción "${action}" para "${campaignName}"`);
    }
  };

  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const },
      active: { label: 'Activa', variant: 'default' as const },
      completed: { label: 'Completada', variant: 'secondary' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const }
    };

    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
  };

  if (loading) {
    return (
      <div className="neural-dashboard">
        <DashboardNavigation />
        <div className="lg:ml-64 p-6">
          <div className="layout-center min-h-[400px]">
            <div className="layout-column items-center layout-gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium text-white/90">Cargando campañas...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neural-dashboard">
      <DashboardNavigation />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="layout-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Gestión de Campañas
                </h1>
                <p className="text-white/70">
                  Administra y monitorea tus campañas de análisis organizacional.
                </p>
              </div>
              
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="btn-gradient focus-ring"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Campaña
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="professional-card p-6 mb-6">
              <div className="layout-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Buscar campañas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm focus-ring backdrop-blur-sm"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <option value="all" style={{ background: '#1e293b', color: 'white' }}>Todas</option>
                    <option value="draft" style={{ background: '#1e293b', color: 'white' }}>Borradores</option>
                    <option value="active" style={{ background: '#1e293b', color: 'white' }}>Activas</option>
                    <option value="completed" style={{ background: '#1e293b', color: 'white' }}>Completadas</option>
                  </select>
                </div>
                
                <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
              
              <div className="text-sm text-white/60">
                {filteredCampaigns.length} campaña{filteredCampaigns.length !== 1 ? 's' : ''} 
                {filterStatus !== 'all' && ` (filtrado por: ${filterStatus})`}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Campaigns List */}
          {filteredCampaigns.length === 0 ? (
            <div className="professional-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 layout-center">
                <BarChart3 className="h-10 w-10 text-white/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {searchTerm || filterStatus !== 'all' ? 'No se encontraron campañas' : '¡Comienza tu primera medición!'}
              </h3>
              <p className="text-white/60 mb-4 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda.'
                  : 'Crea tu primera campaña de clima organizacional y obtén insights valiosos sobre tu equipo.'
                }
              </p>
              {(!searchTerm && filterStatus === 'all') && (
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
              {filteredCampaigns.map((campaign) => {
                const statusBadge = getStatusBadge(campaign.status, campaign.riskLevel);
                
                return (
                  <Card key={campaign.id} className="professional-card campaign-card-layout hover:shadow-lg transition-all duration-300">
                    <div className={`campaign-status-indicator ${
                      campaign.status === 'active' ? 'bg-green-500' :
                      campaign.status === 'completed' ? 'bg-blue-500' :
                      campaign.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    
                    <CardContent className="p-6">
                      <div className="layout-between mb-4">
                        <div className="flex-1">
                          <div className="layout-between items-start mb-2">
                            <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                            <Badge variant={statusBadge.variant} className="ml-4">
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-white/60 mb-2">{campaign.campaignType.name}</p>
                          <div className="flex items-center space-x-6 text-sm text-white/50">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {campaign.startDate} - {campaign.endDate}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {campaign.totalInvited} participantes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Participation Progress */}
                      <div className="mb-4">
                        <div className="layout-between items-center mb-2">
                          <span className="text-sm font-medium text-white/80">Participación</span>
                          <span className="text-sm text-white/60">
                            {campaign.totalResponded}/{campaign.totalInvited} ({campaign.participationRate}%)
                          </span>
                        </div>
                        <div className="progress-container bg-white/10">
                          <div 
                            className={`progress-fill ${
                              campaign.participationRate >= 80 ? 'bg-green-500' :
                              campaign.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="layout-between">
                        <div className="flex items-center space-x-3">
                          {campaign.status === 'draft' && campaign.totalInvited > 0 && (
                            <Button 
                              onClick={() => handleActivateCampaign(campaign.id, campaign.name)}
                              size="sm"
                              className="btn-gradient"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Activar
                            </Button>
                          )}
                          
                          {campaign.status === 'active' && (
                            <Button 
                              onClick={() => handleCampaignAction(campaign.id, 'monitor', campaign.name)}
                              size="sm"
                              variant="outline"
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Monitor
                            </Button>
                          )}
                          
                          {campaign.canViewResults && (
                            <Button 
                              onClick={() => handleCampaignAction(campaign.id, 'view-results', campaign.name)}
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Resultados
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-white/40">
                          {campaign.lastActivity && `Última actividad: ${campaign.lastActivity}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}