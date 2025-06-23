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
  Settings,
  Calendar
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

  // FIX 2: La función handleStateChange ahora es más robusta y maneja errores correctamente.
  const handleStateChange = async (campaignId: string, newStatus: string, action: string) => {
    try {
      const token = localStorage.getItem('focalizahr_token');
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, action: action })
      });

      // Leer el cuerpo de la respuesta, sea exitosa o no, ANTES de cualquier condición.
      const result = await response.json();

      if (!response.ok) {
        // Ahora 'result.error' existe y se puede mostrar de forma segura.
        throw new Error(result.error || `Error del servidor: ${response.status}`);
      }
      
      setSelectedCampaign(null);
      onRefresh();
      
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(`Error al activar campaña: ${(error as Error).message}`);
    }
  };
  
  const handleActivateCampaign = async (campaignId: string, campaignName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres activar la campaña "${campaignName}"?`)) return;
    try {
      await handleStateChange(campaignId, 'active', 'activate');
    } catch (error) {
      // El error ya es manejado y mostrado por handleStateChange.
    }
  };

  const handleCampaignAction = (campaignId: string, action: string) => {
    switch (action) {
      case 'monitor': router.push(`/dashboard/campaigns/${campaignId}/monitor`); break;
      case 'preview-results': router.push(`/dashboard/campaigns/${campaignId}/preview`); break;
      case 'view-results': router.push(`/dashboard/campaigns/${campaignId}/results`); break;
      default: console.log('Acción no reconocida:', action);
    }
  };

  const getStatusBadge = (status: string, riskLevel?: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Activa', variant: 'default' as const, icon: Activity },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: AlertTriangle }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className="flex items-center gap-1"><Icon className="h-3 w-3" />{config.label}</Badge>
        {riskLevel && status === 'active' && (<Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'secondary' : 'outline'}><Shield className="h-3 w-3 mr-1" />Riesgo {riskLevel}</Badge>)}
      </div>
    );
  };

  const getActionButton = (campaign: Campaign) => {
    return (
      <div className="flex items-center gap-2">
        {campaign.status === 'draft' && <Button size="sm" disabled={!campaign.canActivate} onClick={() => handleActivateCampaign(campaign.id, campaign.name)} className="btn-gradient focus-ring"><Play className="h-3 w-3 mr-1" />Activar</Button>}
        {campaign.status === 'active' && <Button size="sm" onClick={() => handleCampaignAction(campaign.id, 'monitor')} className="focus-ring"><Eye className="h-3 w-3 mr-1" />Monitorear</Button>}
        {campaign.status === 'completed' && <Button size="sm" disabled={!campaign.canViewResults} onClick={() => handleCampaignAction(campaign.id, 'view-results')} className="focus-ring"><BarChart3 className="h-3 w-3 mr-1" />Ver Resultados</Button>}
        <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)} className="focus-ring"><Settings className="h-3 w-3 mr-1" />Gestionar</Button>
      </div>
    );
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null;
    const iconClass = "h-3 w-3";
    switch (trend) {
      case 'up': return <span title="Tendencia positiva"><TrendingUp className={`${iconClass} text-green-600`} /></span>;
      case 'down': return <span title="Tendencia negativa"><TrendingUp className={`${iconClass} text-red-600 rotate-180`} /></span>;
      case 'stable': return <span title="Tendencia estable"><Target className={`${iconClass} text-blue-600`} /></span>;
      default: return null;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    (filter === 'all' || campaign.status === filter) &&
    (campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     campaign.campaignType.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div>
      <Card className="professional-card campaigns-list">
        <CardHeader>
          <div className="layout-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 focalizahr-gradient-text"><BarChart3 className="h-5 w-5" />Mis Campañas</CardTitle>
              <CardDescription className="mt-1">Gestiona y monitorea tus mediciones de clima organizacional</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading} className="focus-ring"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
              <Button size="sm" onClick={() => router.push('/dashboard/campaigns/new')} className="btn-gradient focus-ring"><Plus className="h-4 w-4 mr-1" />Nueva Campaña</Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar campañas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 focus-ring" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ key: 'all', label: 'Todas' }, { key: 'active', label: 'Activas' }, { key: 'completed', label: 'Completadas' }, { key: 'draft', label: 'Borradores' }].map(({ key, label }) => {
                const count = key === 'all' ? campaigns.length : campaigns.filter(c => c.status === key).length;
                return (<Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key as any)} className="focus-ring"><Filter className="h-3 w-3 mr-1" />{label}{count > 0 && <Badge variant="secondary" className="ml-2 text-xs">{count}</Badge>}</Button>);
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert className="mb-4 border-destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {sortedCampaigns.length === 0 && !loading ? (
            <div className="text-center py-12"><div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 layout-center"><BarChart3 className="h-10 w-10 text-muted-foreground" /></div><h3 className="text-lg font-semibold mb-2">{filter === 'all' ? '¡Comienza tu primera medición!' : `No hay campañas en estado "${filter}"`}</h3><p className="text-muted-foreground mb-4 max-w-md mx-auto">{filter === 'all' ? 'Crea tu primera campaña para comenzar.' : `Ajusta los filtros o crea una nueva.`}</p>{filter === 'all' && <Button onClick={() => router.push('/dashboard/campaigns/new')} className="btn-gradient focus-ring"><Plus className="h-4 w-4 mr-2" />Crear Campaña</Button>}</div>
          ) : (
            <div className="space-y-4">
              {sortedCampaigns.map((campaign) => (
                <Card key={campaign.id} className="professional-card campaign-card-layout hover:shadow-md transition-shadow">
                  <div className={`campaign-status-indicator ${campaign.status === 'active' ? 'bg-green-500' : campaign.status === 'completed' ? 'bg-blue-500' : campaign.status === 'draft' ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                  <CardContent className="layout-between p-4">
                    <div className="flex-1 ml-4">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg focalizahr-gradient-text">{campaign.name}</h3>
                        {getStatusBadge(campaign.status, campaign.riskLevel)}
                        <Badge variant="outline">{campaign.campaignType.name}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2"><div className="mini-icon-container bg-primary/20"><Users className="h-3 w-3 text-primary" /></div><span className="text-muted-foreground font-normal"><span className="font-semibold text-foreground">{campaign.totalResponded}</span>/{campaign.totalInvited} part.</span></div>
                        <div className="flex items-center gap-2"><div className="mini-icon-container bg-secondary/20"><TrendingUp className="h-3 w-3 text-secondary" /></div><span className="text-muted-foreground font-normal"><span className={`font-semibold ${campaign.participationRate >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{campaign.participationRate.toFixed(1)}%</span> part.</span></div>
                        <div className="flex items-center gap-2"><div className="mini-icon-container bg-blue-500/20"><Calendar className="h-3 w-3 text-blue-600" /></div><span className="text-muted-foreground font-normal">{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span></div>
                        
                        {/* FIX 1: Esta condición ahora verifica el estado de la campaña antes de mostrar los días restantes. */}
                        {(campaign.status === 'active' && campaign.daysRemaining !== undefined) && (
                          <div className="flex items-center gap-2">
                            <div className={`mini-icon-container ${campaign.daysRemaining > 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}><Clock className={`h-3 w-3 ${campaign.daysRemaining > 0 ? 'text-blue-600' : 'text-red-400'}`} /></div>
                            <span className={`text-sm font-semibold ${campaign.daysRemaining > 0 ? 'text-blue-400' : 'text-red-400'}`}>{campaign.daysRemaining > 0 ? `${campaign.daysRemaining} días restantes` : `Vencida`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getActionButton(campaign)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Gestionar Estado: {selectedCampaign?.name}</DialogTitle></DialogHeader>{selectedCampaign && <CampaignStateManager campaign={selectedCampaign} onStateChange={handleStateChange} isLoading={false} />}</DialogContent>
      </Dialog>
    </div>
  );
}
