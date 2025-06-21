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
  Settings
} from 'lucide-react';

// Mock CampaignStateManager para mostrar el componente
const CampaignStateManager = ({ campaign, onStateChange, onClose }) => (
  <div className="p-4">
    <h3 className="font-semibold mb-4">Gestionar Estado: {campaign.name}</h3>
    <div className="space-y-2">
      <Button onClick={() => onStateChange(campaign.id, 'active', 'activate')} className="w-full">
        Activar Campaña
      </Button>
      <Button onClick={() => onStateChange(campaign.id, 'completed', 'complete')} variant="outline" className="w-full">
        Completar Campaña
      </Button>
      <Button onClick={onClose} variant="ghost" className="w-full">
        Cerrar
      </Button>
    </div>
  </div>
);

// Tipos extraídos del original
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

interface CampaignsListProps {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

// Mock data para demostración
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Clima Organizacional Q4 2024',
    status: 'active',
    campaignType: { name: 'Clima Organizacional', slug: 'clima' },
    totalInvited: 150,
    totalResponded: 87,
    participationRate: 58,
    startDate: '2024-11-01',
    endDate: '2024-12-15',
    canActivate: true,
    canViewResults: false,
    riskLevel: 'medium',
    daysRemaining: 12,
    lastActivity: 'hace 2 horas'
  },
  {
    id: '2',
    name: 'Satisfacción Empleados Marketing',
    status: 'completed',
    campaignType: { name: 'Satisfacción', slug: 'satisfaccion' },
    totalInvited: 25,
    totalResponded: 23,
    participationRate: 92,
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    canActivate: false,
    canViewResults: true,
    riskLevel: 'low',
    lastActivity: 'hace 1 día'
  },
  {
    id: '3',
    name: 'Encuesta Onboarding 2024',
    status: 'draft',
    campaignType: { name: 'Onboarding', slug: 'onboarding' },
    totalInvited: 50,
    totalResponded: 0,
    participationRate: 0,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    canActivate: true,
    canViewResults: false,
    riskLevel: 'high',
    daysRemaining: -3,
    lastActivity: 'hace 1 semana'
  }
];

export default function CampaignsList({
  campaigns = mockCampaigns,
  loading = false,
  error = null,
  lastUpdated = new Date(),
  onRefresh = () => console.log('Refresh clicked')
}: Partial<CampaignsListProps>) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const router = { push: (path: string) => console.log('Navigate to:', path) };

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
  const getStatusBadge = (status: string, riskLevel?: 'low' | 'medium' | 'high') => {
    const baseConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Eye },
      active: { label: 'Activa', variant: 'default' as const, icon: Play },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertTriangle }
    };

    const config = baseConfig[status as keyof typeof baseConfig] || baseConfig.draft;
    const IconComponent = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <IconComponent className="h-3 w-3" />
          {config.label}
        </Badge>
        {riskLevel && (
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
            >
              <Eye className="h-3 w-3 mr-1" />
              Monitorear
            </Button>
            {campaign.participationRate > 20 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleCampaignAction(campaign.id, 'preview-results', campaign.name)}
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
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <div className="h-6 bg-slate-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Mis Campañas
              </CardTitle>
              <CardDescription className="mt-1 text-slate-400">
                Gestiona y monitorea tus mediciones de clima organizacional
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="border-slate-600 hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm" 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Campaña
              </Button>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar campañas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
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
                  className={filter === key ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 hover:bg-slate-800"}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-slate-700">
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
            <Alert className="mb-4 border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <div className="flex items-center justify-between">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
                <Button size="sm" variant="outline" onClick={onRefresh} className="border-red-500/50 hover:bg-red-500/20">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Lista de campañas o empty state */}
          {sortedCampaigns.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {filter === 'all' ? '¡Comienza tu primera medición!' : `No hay campañas ${filter}`}
              </h3>
              <p className="text-slate-400 mb-4">
                {filter === 'all' 
                  ? 'Crea tu primera campaña para comenzar a medir el clima organizacional'
                  : `Intenta ajustar los filtros o crear una nueva campaña`
                }
              </p>
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                  className="bg-slate-800/50 border-slate-700/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Indicador de estado lateral */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    campaign.status === 'active' ? 'bg-green-500' :
                    campaign.status === 'completed' ? 'bg-blue-500' :
                    campaign.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  
                  <CardContent className="p-6 pl-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                          {getStatusBadge(campaign.status, campaign.riskLevel)}
                        </div>
                        <p className="text-slate-400 mb-2">{campaign.campaignType.name}</p>
                        <div className="flex items-center space-x-6 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Activity className="h-4 w-4 mr-1" />
                            {campaign.startDate} - {campaign.endDate}
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {campaign.totalInvited} participantes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Participation Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Participación</span>
                        <span className="text-sm text-slate-400">
                          {campaign.totalResponded}/{campaign.totalInvited} ({campaign.participationRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            campaign.participationRate >= 80 ? 'bg-green-500' :
                            campaign.participationRate >= 50 ? 'bg-blue-500' :
                            campaign.participationRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Métricas adicionales y badges */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {campaign.riskLevel && (
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                          campaign.riskLevel === 'high' ? 'bg-red-500/20 border border-red-500/30' :
                          campaign.riskLevel === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-green-500/20 border border-green-500/30'
                        }`}>
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            campaign.riskLevel === 'high' ? 'bg-red-500/20' :
                            campaign.riskLevel === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                          }`}>
                            <Shield className={`h-3 w-3 ${
                              campaign.riskLevel === 'high' ? 'text-red-400' :
                              campaign.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                            }`} />
                          </div>
                          <span className={`text-sm font-semibold ${
                            campaign.riskLevel === 'high' ? 'text-red-400' :
                            campaign.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            Riesgo {campaign.riskLevel}
                          </span>
                        </div>
                      )}

                      {campaign.daysRemaining !== undefined && (
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                          campaign.daysRemaining > 0 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            campaign.daysRemaining > 0 ? 'bg-blue-500/20' : 'bg-red-500/20'
                          }`}>
                            <Clock className={`h-3 w-3 ${campaign.daysRemaining > 0 ? 'text-blue-400' : 'text-red-400'}`} />
                          </div>
                          <span className={`text-sm font-semibold ${
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
                        <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2">
                          <Activity className="h-3 w-3" />
                          <span>Última actividad: {campaign.lastActivity}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                      {getActionButton(campaign)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Información de última actualización */}
          {lastUpdated && !loading && (
            <div className="text-center text-xs text-slate-500 mt-4">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de gestión de campaña (MODELO HÍBRIDO) */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Settings className="h-5 w-5" />
              Gestionar Campaña: {selectedCampaign?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <CampaignStateManager
              campaign={selectedCampaign}
              onStateChange={handleStateChange}
              onClose={() => setSelectedCampaign(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}