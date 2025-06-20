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
  Users,
  Activity,
  Settings
} from 'lucide-react';
import CampaignStateManager from '@/components/dashboard/CampaignStateManager';
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
      console.log('🔑 Token found:', !!token);
      
      const payload = { 
        toStatus: newStatus,
        action: action 
      };
      console.log('📤 Sending payload:', payload);
      
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      console.log('✅ Success response:', result);
      
      // Cerrar modal y refrescar FORZADO
      setSelectedCampaign(null);
      
      // REFRESH DOBLE para asegurar actualización
      await onRefresh();
      setTimeout(() => {
        onRefresh();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      
      // ✅ PATRÓN ESTÁNDAR: Error handling simple
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error: ${errorMessage}`);
      
      setSelectedCampaign(null);
    }
  };

  // Funciones de acciones de campaña (extraídas del original)
  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    try {
      console.log('🚀 Activando campaña:', campaignName);
      await handleStateChange(campaignId, 'active', 'activate');
    } catch (error) {
      console.error('❌ Error activando campaña:', error);
    }
  };

  const handleCampaignAction = (campaignId: string, action: string, campaignName: string) => {
    console.log(`📊 Acción ${action} en campaña:`, campaignName);
    
    switch (action) {
      case 'monitor':
        router.push(`/dashboard/campaigns/${campaignId}/monitor`);
        break;
      case 'preview-results':
        router.push(`/dashboard/campaigns/${campaignId}/preview`);
        break;
      case 'view-results':
        router.push(`/dashboard/campaigns/${campaignId}/results`);
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  };

  // Función para badges de estado (extraída del original)
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
            <Alert className="mb-4 border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div className="layout-between">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
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
                {filter === 'all' ? '¡Comienza tu primera medición!' : `No hay campañas ${filter}`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Crea tu primera campaña para comenzar a medir el clima organizacional'
                  : `Intenta ajustar los filtros o crear una nueva campaña`
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
                <Card 
                  key={campaign.id} 
                  className="professional-card campaign-card-layout hover:shadow-md transition-shadow"
                >
                  {/* Indicador de estado lateral */}
                  <div className={`campaign-status-indicator ${
                    campaign.status === 'active' ? 'bg-green-500' :
                    campaign.status === 'completed' ? 'bg-blue-500' :
                    campaign.status === 'draft' ? 'bg-gray-400' : 'bg-red-500'
                  }`}></div>

                  <CardContent className="layout-between p-4">
                    <div className="flex-1 ml-4">
                      <div className="flex items-center gap-3 mb-3">
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
                              campaign.participationRate >= 50 ? 'text-blue-600' :
                              campaign.participationRate >= 30 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {campaign.participationRate}%
                            </span> participación
                          </span>
                        </div>

                        {campaign.daysRemaining !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="mini-icon-container bg-accent/20">
                              <Clock className="h-3 w-3 text-accent" />
                            </div>
                            <span className="text-muted-foreground font-normal">
                              <span className={`font-semibold ${
                                campaign.daysRemaining <= 3 ? 'text-red-600' :
                                campaign.daysRemaining <= 7 ? 'text-blue-600' : 'text-green-600'
                              }`}>
                                {campaign.daysRemaining > 0 ? `${campaign.daysRemaining} días` : 'Vencida'}
                              </span> restantes
                            </span>
                          </div>
                        )}

                        {campaign.lastActivity && (
                          <div className="flex items-center gap-2">
                            <div className="mini-icon-container bg-muted/20">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground font-normal text-xs">
                              Última actividad: {new Date(campaign.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Barra de progreso visual premium */}
                      <div className="progress-container mt-3 mb-2">
                        <div 
                          className={`progress-fill ${
                            campaign.participationRate >= 70 ? 'bg-green-500' :
                            campaign.participationRate >= 50 ? 'bg-blue-500' :
                            campaign.participationRate >= 30 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${campaign.participationRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Botones de acción a la derecha */}
                    <div className="ml-4">
                      {getActionButton(campaign)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para gestionar estado (MODELO HÍBRIDO) */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
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