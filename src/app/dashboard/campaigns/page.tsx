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
import CampaignActionButtons from '@/components/campaign-states/CampaignActionButtons';
import { useCampaignsContext } from '@/context/CampaignsContext';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ✅ USAR ÚNICAMENTE CONTEXT - NO ESTADO LOCAL
  const { campaigns, isLoading: loading, error, fetchCampaigns } = useCampaignsContext();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    // ✅ CARGAR INICIAL USANDO CONTEXT
    fetchCampaigns();
  }, [router, fetchCampaigns]);

  // ✅ FUNCIÓN PARA ACTIVAR CAMPAÑA - USAR CONTEXT
  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          toStatus: 'active',
          action: 'activate' 
        })
      });

      if (response.ok) {
        alert(`✅ Campaña "${campaignName}" activada!`);
        fetchCampaigns(); // ✅ REFRESH VIA CONTEXT
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar campaña');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // ✅ FUNCIÓN PARA OTRAS ACCIONES - USAR CONTEXT
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
        // ✅ REFRESH PARA ACCIONES DE API
        if (['complete', 'cancel', 'pause'].includes(action)) {
          fetchCampaigns();
        }
    }
  };

  // Filtrar campañas
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => fetchCampaigns()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/campaigns/new')}
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Campaña
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      placeholder="Buscar campañas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-white/60" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded-md border border-white/20 bg-white/5 text-white px-3 py-2 text-sm"
                    >
                      <option value="all">Todas</option>
                      <option value="draft">Borradores</option>
                      <option value="active">Activas</option>
                      <option value="completed">Completadas</option>
                      <option value="cancelled">Canceladas</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Campaigns Grid */}
          <div className="grid gap-6">
            {filteredCampaigns.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="text-center py-12">
                  <div className="mb-4">
                    <Target className="h-12 w-12 text-white/40 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchTerm || filterStatus !== 'all' ? 'No se encontraron campañas' : 'No hay campañas creadas'}
                  </h3>
                  <p className="text-white/60 mb-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Comienza creando tu primera campaña de análisis'
                    }
                  </p>
                  {!searchTerm && filterStatus === 'all' && (
                    <Button 
                      onClick={() => router.push('/dashboard/campaigns/new')}
                      className="bg-white text-black hover:bg-white/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Campaña
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => {
                const statusBadge = getStatusBadge(campaign.status, campaign.riskLevel);
                
                return (
                  <Card key={campaign.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <div className={`h-1 ${
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
                            style={{ width: `${campaign.participationRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end">
                        <CampaignActionButtons
                          campaign={campaign}
                          onActivateCampaign={handleActivateCampaign}
                          onCampaignAction={handleCampaignAction}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}