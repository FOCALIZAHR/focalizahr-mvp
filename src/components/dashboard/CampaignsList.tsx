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
import type { Campaign } from '@/types'; // Asumiendo que Campaign completa está en types

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

  // 🔧 FIX STALE CLOSURE: Remover async/await
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
        // 🎯 SOLUCIÓN: onRefresh() automático para actualizar UI
        onRefresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar campaña');
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al activar campaña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [onRefresh]);

  // ✅ FUNCIÓN PARA OTRAS ACCIONES (Compatible con CampaignActionButtons)
  const handleCampaignAction = useCallback(async (campaignId: string, action: string, campaignName: string) => {
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
        console.log(`Acción "${action}" para "${campaignName}"`);
    }
  }, [router]);

  const filteredCampaigns = campaigns.filter(campaign =>
    (filter === 'all' || campaign.status === filter) &&
    (campaign.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ❌ FUNCIÓN ELIMINADA - CampaignActionButtons maneja badges
  // const getStatusBadge = (status: string) => { ... }

  return (
    <div className="space-y-4">
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campañas ({filteredCampaigns.length})
              </CardTitle>
              <CardDescription>
                Gestiona el estado y monitorea el progreso de tus campañas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar campañas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2 pt-4">
            {(['all', 'draft', 'active', 'completed', 'cancelled'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status === 'all' ? 'Todas' : status === 'draft' ? 'Borradores' : 
                 status === 'active' ? 'Activas' : status === 'completed' ? 'Completadas' : 'Canceladas'}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
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
                          {/* ❌ BADGE ELIMINADO - CampaignActionButtons lo maneja */}
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
                      
                      {/* 🎯 CAMBIO PRINCIPAL: Usar CampaignActionButtons + Modal complementario */}
                      <div className="flex items-center gap-2">
                        <CampaignActionButtons
                          campaign={campaign}
                          onActivateCampaign={handleActivateCampaign}
                          onCampaignAction={handleCampaignAction}
                        />
                        
                        {/* Modal complementario para casos especiales */}
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

      {/* Modal para gestión avanzada (preservado) */}
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