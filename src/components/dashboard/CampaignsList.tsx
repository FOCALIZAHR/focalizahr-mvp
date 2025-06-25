'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Filter, RefreshCw, Settings, BarChart3, Eye, Clock, Activity, CheckCircle, AlertTriangle, Users, Calendar } from 'lucide-react';
import CampaignStateManager from '@/components/dashboard/CampaignStateManager';
import CampaignActionButtons from '@/components/dashboard/CampaignActionButtons';
import type { Campaign } from '@/types';

interface CampaignsListProps {
  campaigns: Campaign[];
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export default function CampaignsList({ campaigns, onRefresh, loading, error, lastUpdated }: CampaignsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const router = useRouter();

  // ✅ FUNCIÓN ESTABILIZADA - SOLUCIÓN STALE CLOSURE
  const handleCampaignUpdate = useCallback(() => {
    console.log('🔄 Refrescando datos después de cambio exitoso...');
    onRefresh();
    setSelectedCampaign(null);
  }, [onRefresh]);

  // ✅ FUNCIÓN PARA ACTIVAR CAMPAÑA (Compatible con CampaignActionButtons)
  const handleActivateCampaign = useCallback(async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `¿Activar la campaña "${campaignName}"?\n\nEsta acción enviará emails a participantes.`
    );
    
    if (!confirmed) return;

    try {
      console.log('🚀 Activando campaña:', campaignId);
      
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
        console.log('✅ Campaña activada exitosamente');
        onRefresh(); // ← SOLUCIÓN STALE CLOSURE
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar campaña');
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al activar campaña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [onRefresh]);

  // ✅ NAVEGACIÓN INTELIGENTE
  const handleCampaignAction = useCallback((action: string, campaignId: string, campaign?: Campaign) => {
    switch (action) {
      case 'view':
        if (campaign?.status === 'completed') {
          router.push(`/dashboard/campaigns/${campaignId}/results`);
        } else if (campaign?.status === 'active') {
          router.push(`/dashboard/campaigns/${campaignId}/monitor`);
        } else {
          router.push(`/dashboard/campaigns/${campaignId}/config`);
        }
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
        console.warn('Acción no reconocida:', action);
    }
  }, [router]);

  const filteredCampaigns = campaigns.filter(campaign =>
    (filter === 'all' || campaign.status === filter) &&
    (campaign.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Activa', variant: 'default' as const, icon: Activity },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertTriangle }
    };
    const statusConfig = config[status as keyof typeof config] || config.draft;
    const Icon = statusConfig.icon;
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Mis Campañas
              </CardTitle>
              <CardDescription>
                Gestiona y monitorea tus mediciones organizacionales
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm"
                onClick={() => router.push('/dashboard/campaigns/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">Todas</option>
                <option value="draft">Borrador</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campañas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Lista de campañas */}
          <div className="space-y-3">
            {loading && campaigns.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Cargando campañas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">{error}</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron campañas</p>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="professional-card-nested hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.totalInvited} participantes
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {campaign.participationRate}% participación
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(campaign.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        <CampaignActionButtons
                          campaign={campaign}
                          onActivateCampaign={handleActivateCampaign}
                          onCampaignAction={handleCampaignAction}
                        />
                        
                        {/* Modal complementario para gestión avanzada */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedCampaign(campaign)}
                          title="Gestionar estado avanzado"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para gestión avanzada */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="professional-dialog max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestionar: {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedCampaign && (
              <CampaignStateManager
                campaign={selectedCampaign}
                onCampaignUpdate={handleCampaignUpdate}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}