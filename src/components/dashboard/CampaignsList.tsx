'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  BarChart3, 
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';
import { useCampaignsContext } from '@/context/CampaignsContext';
// ✅ COMPONENTES ESPECIALIZADOS v3.0 - DOCUMENTO MAESTRO
import CampaignStateTransition from '@/components/campaign-states/CampaignStateTransition';
import type { Campaign } from '@/types';

// ✅ ELIMINAR PROPS - SOLO CONTEXT
export default function CampaignsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const router = useRouter();

  // ✅ USAR SOLO CONTEXT - NO PROPS
  const { campaigns, loading, error, fetchCampaigns } = useCampaignsContext();

  // ✅ CARGA INICIAL AUTOMÁTICA
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ✅ FUNCIÓN CAMBIO ESTADO - COMPATIBLE CON API MAESTRO
  const handleStateChange = useCallback(async (campaignId: string, newStatus: string, action: string) => {
    try {
      console.log(`🔄 Cambiando estado: ${action} → ${newStatus}`);
      
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado');
      }

      console.log('✅ Estado cambiado exitosamente');
      fetchCampaigns(); // Refrescar lista
      
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      throw error;
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
                className="focus-ring"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                size="sm" 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="btn-gradient focus-ring"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controles de filtrado */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Cargando campañas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
                  <p className="text-destructive font-medium">Error al cargar campañas</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button size="sm" variant="outline" onClick={fetchCampaigns}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {campaigns.length === 0 ? 'No tienes campañas aún' : 'No se encontraron campañas'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {campaigns.length === 0 
                        ? 'Crea tu primera campaña de medición organizacional'
                        : 'Ajusta los filtros para encontrar lo que buscas'
                      }
                    </p>
                    {campaigns.length === 0 && (
                      <Button 
                        onClick={() => router.push('/dashboard/campaigns/new')}
                        className="btn-gradient"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primera campaña
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="professional-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-cyan-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-foreground">{campaign.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                              <Users className="h-3 w-3 text-cyan-600" />
                            </div>
                            <span><strong className="text-foreground">{campaign.totalInvited}</strong> participantes</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-5 h-5 rounded bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                              <BarChart3 className="h-3 w-3 text-green-600" />
                            </div>
                            <span><strong className="text-foreground">{campaign.participationRate}%</strong> participación</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                              <Calendar className="h-3 w-3 text-purple-600" />
                            </div>
                            <span>{new Date(campaign.startDate).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* ✅ GESTIÓN ESTADOS v3.0 - COMPONENTE ESPECIALIZADO */}
                      <div className="flex items-center gap-3 ml-6">
                        <CampaignStateTransition
                          campaign={campaign}
                          onStateChange={handleStateChange}
                          variant="compact"
                          showValidation={false}
                        />
                        
                        {/* Botón gestión avanzada opcional */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                          className="text-muted-foreground hover:text-foreground focus-ring"
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
        </CardContent>
      </Card>

      {/* ✅ MODAL GESTIÓN AVANZADA OPCIONAL */}
      {selectedCampaign && (
        <Card className="mt-4 professional-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Gestión Avanzada - {selectedCampaign.name}</h3>
            <CampaignStateTransition
              campaign={selectedCampaign}
              onStateChange={handleStateChange}
              variant="default"
              showValidation={true}
            />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCampaign(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}