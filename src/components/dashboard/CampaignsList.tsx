'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  BarChart3, 
  AlertTriangle,
  Users,
  Calendar,
  CheckCircle,
  Play,
  Clock,
  Square,
  Eye,
  Settings
} from 'lucide-react';
import { useCampaignsContext } from '@/context/CampaignsContext';
import { useToast, useParticipantsNotifications } from '@/components/ui/toast-system';
import { useConfirmationDialog, confirmationActions } from '@/components/ui/confirmation-dialog';
import CampaignStatusGuide from '@/components/ui/campaign-status-guide';

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

export default function EnhancedCampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Context y hooks
  const { campaigns, isLoading, error, fetchCampaigns } = useCampaignsContext();
  const { success, error: showError } = useToast();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // Hook para notificaciones automáticas de participantes
  useParticipantsNotifications(campaigns);

  // Carga inicial automática
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Función para cambio de estado con confirmación y feedback
  const handleStateChange = useCallback(async (campaignId: string, newStatus: string, action: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Crear acción de confirmación apropiada
    let confirmAction;
    switch (action) {
      case 'activate':
        confirmAction = confirmationActions.activateCampaign(campaign.name, campaign.totalInvited);
        break;
      case 'cancel':
        confirmAction = confirmationActions.cancelCampaign(campaign.name, campaign.totalResponded);
        break;
      case 'complete':
        confirmAction = confirmationActions.completeCampaign(campaign.name, campaign.participationRate);
        break;
      default:
        return;
    }

    // Mostrar diálogo de confirmación
    showConfirmation(confirmAction, async () => {
      try {
        console.log(`🔄 Cambiando estado: ${action} → ${newStatus}`);
        
        const token = localStorage.getItem('focalizahr_token');
        const response = await fetch(`/api/campaigns/${campaignId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ toStatus: newStatus, action })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cambiar estado');
        }

        console.log('✅ Estado cambiado exitosamente');
        
        // Success feedback específico por acción
        const successMessages = {
          activate: `✅ Campaña "${campaign.name}" activada. Invitaciones enviadas a ${campaign.totalInvited} participantes.`,
          complete: `✅ Campaña "${campaign.name}" completada. Resultados disponibles.`,
          cancel: `✅ Campaña "${campaign.name}" cancelada exitosamente.`
        };
        
        success(successMessages[action as keyof typeof successMessages] || 'Operación completada exitosamente');
        
        // Refrescar lista
        fetchCampaigns();
        
      } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        showError(error instanceof Error ? error.message : 'Error desconocido al cambiar estado');
        throw error;
      }
    });
  }, [campaigns, fetchCampaigns, success, showError, showConfirmation]);

  // Navegación inteligente
  const handleCampaignAction = useCallback((action: string, campaignId: string, campaignName?: string) => {
    switch (action) {
      case 'view':
        router.push(`/dashboard/campaigns/${campaignId}`);
        break;
      case 'monitor':
        router.push(`/dashboard/campaigns/${campaignId}/monitor`);
        break;
      case 'results':
        router.push(`/dashboard/campaigns/${campaignId}/results`);
        break;
      case 'edit':
        router.push(`/dashboard/campaigns/${campaignId}/edit`);
        break;
      default:
        console.log(`Acción: ${action} para campaña ${campaignName}`);
    }
  }, [router]);

  // Refresh manual con feedback
  const handleRefresh = useCallback(async () => {
    setIsUpdating(true);
    try {
      await fetchCampaigns();
      success('Lista de campañas actualizada');
    } catch (error) {
      showError('Error al actualizar las campañas');
    } finally {
      setIsUpdating(false);
    }
  }, [fetchCampaigns, success, showError]);

  // Filtrado de campañas
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || campaign.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Obtener badge de estado
  const getStatusBadge = (status: string, riskLevel?: string) => {
    const variants = {
      active: 'default',
      draft: 'secondary',
      completed: 'outline',
      cancelled: 'destructive'
    } as const;

    const labels = {
      active: 'Activa',
      draft: 'Borrador',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Obtener acciones disponibles para cada campaña
  const getAvailableActions = (campaign: Campaign) => {
    const actions = [];

    // Acción ver siempre disponible
    actions.push({
      id: 'view',
      label: 'Ver Detalles',
      icon: Eye,
      variant: 'outline' as const,
      onClick: () => handleCampaignAction('view', campaign.id, campaign.name)
    });

    // Acciones basadas en estado
    switch (campaign.status) {
      case 'draft':
        if (campaign.totalInvited > 0 && campaign.canActivate) {
          actions.push({
            id: 'activate',
            label: 'Activar',
            icon: Play,
            variant: 'default' as const,
            onClick: () => handleStateChange(campaign.id, 'active', 'activate')
          });
        }
        actions.push({
          id: 'edit',
          label: 'Editar',
          icon: Settings,
          variant: 'outline' as const,
          onClick: () => handleCampaignAction('edit', campaign.id, campaign.name)
        });
        break;

      case 'active':
        actions.push({
          id: 'monitor',
          label: 'Monitorear',
          icon: BarChart3,
          variant: 'outline' as const,
          onClick: () => handleCampaignAction('monitor', campaign.id, campaign.name)
        });
        actions.push({
          id: 'complete',
          label: 'Completar',
          icon: CheckCircle,
          variant: 'secondary' as const,
          onClick: () => handleStateChange(campaign.id, 'completed', 'complete')
        });
        actions.push({
          id: 'cancel',
          label: 'Cancelar',
          icon: Square,
          variant: 'destructive' as const,
          onClick: () => handleStateChange(campaign.id, 'cancelled', 'cancel')
        });
        break;

      case 'completed':
        if (campaign.canViewResults) {
          actions.push({
            id: 'results',
            label: 'Ver Resultados',
            icon: BarChart3,
            variant: 'default' as const,
            onClick: () => handleCampaignAction('results', campaign.id, campaign.name)
          });
        }
        break;
    }

    return actions;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Gestión de Campañas</CardTitle>
              <CardDescription>
                Administra y monitorea tus campañas de análisis organizacional
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isUpdating}
                className="focus-ring"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                size="sm" 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="focus-ring"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controles de filtrado */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campañas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'draft', 'completed', 'cancelled'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? 'default' : 'outline'}
                  onClick={() => setFilter(status)}
                  className="capitalize"
                >
                  {status === 'all' ? 'Todas' : 
                   status === 'active' ? 'Activas' :
                   status === 'draft' ? 'Borrador' :
                   status === 'completed' ? 'Completadas' : 'Canceladas'}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de campañas */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Cargando campañas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-destructive">Error al cargar campañas</h3>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={fetchCampaigns}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-center space-y-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">No se encontraron campañas</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filter === 'all' 
                        ? 'Comienza creando tu primera campaña de análisis'
                        : `No hay campañas en estado "${filter}"`
                      }
                    </p>
                  </div>
                  {filter === 'all' && (
                    <Button onClick={() => router.push('/dashboard/campaigns/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Campaña
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card 
                  key={campaign.id}
                  className={`transition-all duration-200 hover:shadow-md ${selectedCampaign?.id === campaign.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header de campaña */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            {getStatusBadge(campaign.status, campaign.riskLevel)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.campaignType.name}
                          </p>
                        </div>
                        
                        {/* SECCIÓN BOTONES OPTIMIZADA - TAMAÑOS UNIFORMES */}
                        {/* SECCIÓN BOTONES OPTIMIZADA - ESTILO SITIO OFICIAL FOCALIZAHR */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {getAvailableActions(campaign).map((action) => {
                            const IconComponent = action.icon;
                            
                            // Determinar si es botón primario según estado campaña
                            const isPrimary = (campaign.status === 'active' && action.id === 'monitor') || 
                                            (campaign.status === 'draft' && action.id === 'activate') ||
                                            (campaign.status === 'completed' && action.id === 'results');
                            
                            return (
                              <button
                                key={action.id}
                                onClick={action.onClick}
                                className={`
                                  inline-flex items-center justify-center
                                  font-semibold text-sm whitespace-nowrap
                                  border-radius-12 transition-all duration-300
                                  min-w-[130px] h-[40px]
                                  ${isPrimary 
                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-0.5' 
                                    : action.variant === 'destructive'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:scale-105'
                                      : action.variant === 'secondary' 
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 hover:scale-105'
                                        : 'bg-white/5 text-gray-300 border border-white/20 hover:bg-white/10 hover:border-cyan-400 hover:scale-105'
                                  }
                                `}
                                style={{ borderRadius: '12px' }}
                              >
                                <IconComponent className="h-4 w-4 mr-2" />
                                {action.label === 'Completar' ? 'Finalizar' : action.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Panel de estado guía */}
                      <CampaignStatusGuide 
                        campaign={campaign}
                        className="bg-muted/50"
                      />

                      {/* Métricas de campaña */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                            <Users className="h-3 w-3 text-cyan-600" />
                          </div>
                          <span>
                            <strong className="text-foreground">{campaign.totalInvited}</strong> participantes
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                            <BarChart3 className="h-3 w-3 text-green-600" />
                          </div>
                          <span>
                            <strong className="text-foreground">{campaign.participationRate}%</strong> participación
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Calendar className="h-3 w-3 text-purple-600" />
                          </div>
                          <span>
                            {new Date(campaign.startDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <ConfirmationDialog />
    </>
  );
}