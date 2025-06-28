'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Filter, RefreshCw, BarChart3, Users, Calendar } from 'lucide-react';

// ✅ IMPORTS COMPONENTES ESPECIALIZADOS NUEVOS
import CampaignStatusBadge from '@/components/campaign-states/CampaignStatusBadge';
import CampaignActionButtons from '@/components/campaign-states/CampaignActionButtons';
import CampaignStateTransition from '@/components/campaign-states/CampaignStateTransition';

import { useCampaignsContext } from '@/context/CampaignsContext';
import type { Campaign } from '@/types';

export default function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const router = useRouter();

  // ✅ USAR CONTEXT ÚNICAMENTE
  const { campaigns, isLoading: loading, error, fetchCampaigns } = useCampaignsContext();

  // ✅ FUNCIÓN ESTABILIZADA - ACTUALIZACIÓN DESPUÉS DE CAMBIOS
  const handleCampaignUpdate = useCallback(() => {
    console.log('🔄 Refrescando datos después de cambio exitoso...');
    fetchCampaigns();
    setSelectedCampaign(null);
  }, [fetchCampaigns]);

  // ✅ FUNCIÓN ACTIVAR CAMPAÑA - COMPATIBLE CON APIS EXISTENTES
  const handleActivateCampaign = useCallback(async (campaignId: string, campaignName: string) => {
    try {
      setIsActivating(campaignId);
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
        await fetchCampaigns(); // Refresh inmediato
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar campaña');
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al activar campaña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsActivating(null);
    }
  }, [fetchCampaigns]);

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

  // ✅ FUNCIÓN STATE CHANGE UNIVERSAL
  const handleStateChange = useCallback(async (campaignId: string, newStatus: string, action: string) => {
    try {
      console.log('🔄 Cambiando estado:', { campaignId, newStatus, action });
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          toStatus: newStatus,
          action 
        })
      });

      if (response.ok) {
        console.log(`✅ Estado cambiado a ${newStatus} exitosamente`);
        await fetchCampaigns(); // Refresh inmediato
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al cambiar estado a ${newStatus}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(campaign =>
    (filter === 'all' || campaign.status === filter) &&
    (campaign.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                onClick={fetchCampaigns}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
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
          {/* ✅ FILTROS Y BÚSQUEDA */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar campañas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todas</option>
                <option value="draft">Borradores</option>
                <option value="active">Activas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          {/* ✅ LOADING Y ERROR STATES */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando campañas...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={fetchCampaigns} variant="outline" className="mt-2">
                Reintentar
              </Button>
            </div>
          )}

          {/* ✅ LISTA CAMPAÑAS CON COMPONENTES ESPECIALIZADOS */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {filter === 'all' ? 'No tienes campañas aún' : `No hay campañas ${filter}`}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {filter === 'all' 
                      ? 'Crea tu primera campaña para comenzar a medir tu organización'
                      : 'Prueba con otros filtros o crea una nueva campaña'
                    }
                  </p>
                  <Button onClick={() => router.push('/dashboard/campaigns/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Campaña
                  </Button>
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="campaign-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* ✅ INFO CAMPAÑA CON BADGE ESPECIALIZADO */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <CampaignStatusBadge 
                              status={campaign.status}
                              variant="compact"
                              showIcon={true}
                            />
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{campaign.totalInvited} participantes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{campaign.campaignType.name}</span>
                            </div>
                          </div>

                          {/* ✅ MÉTRICAS SI TIENE RESPUESTAS */}
                          {campaign.totalResponded > 0 && (
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="text-green-600 font-medium">
                                {campaign.totalResponded} respuestas ({campaign.participationRate}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* ✅ BOTONES DE ACCIÓN ESPECIALIZADOS */}
                        <div className="flex items-center gap-2">
                          <CampaignActionButtons
                            campaign={campaign}
                            onAction={handleCampaignAction}
                            isLoading={isActivating === campaign.id}
                          />
                          
                          {/* ✅ BOTÓN GESTIÓN AVANZADA */}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setSelectedCampaign(campaign)}
                            title="Gestión avanzada de estados"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL GESTIÓN AVANZADA CON COMPONENTE ESPECIALIZADO */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestión Avanzada - {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <CampaignStateTransition
              campaign={selectedCampaign}
              onStateChange={handleStateChange}
              onActivateCampaign={handleActivateCampaign}
              onCampaignAction={handleCampaignAction}
              layout="card"
              showValidation={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}