'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, 
  Search, 
  Plus,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  Target,
  TrendingUp,
  Shield,
  Activity,
  Settings,
  Users,
  Percent,
  Calendar
} from 'lucide-react';
import CampaignStateManager from '@/components/dashboard/CampaignStateManager';

// Import del tipo centralizado
import type { Campaign } from '@/types';

interface CampaignsListProps {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function CampaignsList({
  campaigns,
  loading,
  error,
  lastUpdated,
  onRefresh
}: CampaignsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const router = useRouter();

  // Función para cambiar estado de campaña (MODELO HÍBRIDO)
  const handleStateChange = async (campaignId: string, newStatus: string, action: string) => {
    try {
      console.log('🔄 Cambiando estado campaña:', { campaignId, newStatus, action });
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          action: action 
        })
      });

      if (response.ok) {
        console.log('✅ Estado actualizado exitosamente');
        await onRefresh(); // Refrescar datos
        setSelectedCampaign(null); // Cerrar modal
      } else {
        console.error('❌ Error al actualizar estado:', response.status);
        alert('Error al actualizar el estado de la campaña');
      }
    } catch (error) {
      console.error('❌ Error en handleStateChange:', error);
      alert('Error de conexión al actualizar estado');
    }
  };

  // Función para activar campaña (extraída del original)
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
        onRefresh();
      } else {
        alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`🧪 SIMULACIÓN: Campaña "${campaignName}" activada`);
    }
  };

  // Función para otras acciones (extraída del original)
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

  // Función para badges de estado (extraída exacta del original)
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

  // Función para botones de acción (HÍBRIDO: original + modal)
  const getActionButton = (campaign: Campaign) => {
    return (
      <div className="flex items-center gap-2">
        {/* Botones originales según estado */}
        {campaign.status === 'draft' && (
          <Button 
            size="sm" 
            disabled={!campaign.canActivate}
            onClick={() => handleActivateCampaign(campaign.id, campaign.name)}
            className="btn-gradient focus-ring"
          >
            <Play className="h-3 w-3 mr-1" />
            Activar
          </Button>
        )}
        
        {campaign.status === 'active' && (
          <>
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
          </>
        )}
        
        {campaign.status === 'completed' && (
          <Button 
            size="sm" 
            disabled={!campaign.canViewResults}
            onClick={() => handleCampaignAction(campaign.id, 'view-results', campaign.name)}
            className="focus-ring"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Ver Resultados
          </Button>
        )}

        {/* Botón "Gestionar Estado" adicional para modal */}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setSelectedCampaign(campaign)}
          className="focus-ring"
        >
          <Settings className="h-3 w-3 mr-1" />
          Gestionar
        </Button>
      </div>
    );
  };

  // Función para iconos de tendencia (extraída del original)
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
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

  // Filtrado y ordenamiento (extraído exacto del original)
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

  // Loading state (extraído del original)
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
    <div>
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
                onClick={onRefresh}
                disabled={loading}
                className="focus-ring"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm" 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="btn-gradient focus-ring"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Campaña
              </Button>
            </div>
          </div>

          {/* Filtros y búsqueda (extraídos del original) */}
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
          {/* Error handling */}
          {error && (
            <Alert className="mb-4 border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <div className="layout-between">
                <AlertDescription>{error}</AlertDescription>
                <Button size="sm" variant="outline" onClick={onRefresh} className="focus-ring">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Lista de campañas o empty state */}
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
            {sortedCampaigns.map((campaign) => {
              const statusBadge = getStatusBadge(campaign.status, campaign.riskLevel);
              
              return (
                <Card key={campaign.id} className="professional-card campaign-card-layout hover:shadow-lg transition-all duration-300">
                  <div className={`campaign-status-indicator ${
                    campaign.status === 'active' ? 'bg-green-500' :
                    campaign.status === 'completed' ? 'bg-blue-500' :
                    campaign.status === 'draft' ? 'bg-gray-400' : 'bg-red-500'
                  }`}></div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header con título y badges */}
                      <div className="layout-between">
                        <div className="flex-1">
                          <div className="layout-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold mb-1 text-white">{campaign.name}</h3>
                              <p className="text-sm text-white/60">{campaign.campaignType.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Métricas principales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-white/60">Participantes</span>
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {campaign.participantsCompleted}/{campaign.participantsTotal}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Percent className="h-4 w-4 text-green-400" />
                            <span className="text-xs text-white/60">Progreso</span>
                            {campaign.trend && getTrendIcon(campaign.trend)}
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {campaign.participationRate}%
                          </div>
                        </div>
                        
                        {campaign.daysRemaining !== undefined && (
                          <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Clock className="h-4 w-4 text-orange-400" />
                              <span className="text-xs text-white/60">Días restantes</span>
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {campaign.daysRemaining > 0 ? campaign.daysRemaining : 'Finalizada'}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Calendar className="h-4 w-4 text-purple-400" />
                            <span className="text-xs text-white/60">Duración</span>
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {campaign.campaignType.duration}d
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso elegante */}
                      <div className="space-y-2">
                        <div className="layout-between text-sm">
                          <span className="text-white/60">Progreso de participación</span>
                          <span className="text-white font-medium">{campaign.participationRate}%</span>
                        </div>
                        <div className="progress-container bg-white/10">
                          <div 
                            className={`progress-fill ${
                              campaign.participationRate >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                              campaign.participationRate >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                              'bg-gradient-to-r from-red-500 to-red-400'
                            }`}
                            style={{ width: `${campaign.participationRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Información adicional y acciones */}
                      <div className="layout-between pt-2 border-t border-white/10">
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span>Inicio: {new Date(campaign.startDate).toLocaleDateString('es-ES')}</span>
                          <span>•</span>
                          <span>Fin: {new Date(campaign.endDate).toLocaleDateString('es-ES')}</span>
                          <span>•</span>
                          <span>{campaign.campaignType.questions} preguntas</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getActionButton(campaign)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Modal para gestión de estados (MODELO HÍBRIDO) */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gestionar Estado: {selectedCampaign?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignStateManager
              campaign={selectedCampaign}
              onStateChange={handleStateChange}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}