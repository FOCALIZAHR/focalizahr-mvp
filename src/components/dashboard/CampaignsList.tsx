'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Settings,
  Calendar,
  Target,
  Users
} from 'lucide-react';

// Interfaces (extraídas de page.tsx)
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

// Props del componente
interface CampaignsListProps {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  onManageState: (campaign: Campaign) => void;
  onRefresh: () => void;
}

export default function CampaignsList({ 
  campaigns, 
  loading, 
  error, 
  onManageState, 
  onRefresh 
}: CampaignsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar campañas
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Ordenar campañas (activas primero, luego por fecha)
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  // Función para obtener configuración visual del estado
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      active: { label: 'Activa', variant: 'default' as const, icon: Play },
      completed: { label: 'Completada', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: Clock }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campañas Recientes</CardTitle>
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="professional-card border-l-4 border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-600">Error al cargar campañas</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="focus-ring"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card">
      <CardHeader>
        <div className="layout-between">
          <div>
            <CardTitle className="text-xl">Campañas Recientes</CardTitle>
            <CardDescription>
              Gestiona y monitorea tus campañas de análisis organizacional
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="focus-ring"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="focus-ring">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            {['all', 'active', 'completed', 'draft'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status as any)}
                className="focus-ring"
              >
                <Filter className="h-3 w-3 mr-1" />
                {status === 'all' ? 'Todas' : 
                 status === 'active' ? 'Activas' :
                 status === 'completed' ? 'Completadas' : 'Borradores'}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de campañas */}
        {sortedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted layout-center">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filter !== 'all' ? 'No se encontraron campañas' : 'No hay campañas'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera campaña de análisis organizacional'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button className="focus-ring">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCampaigns.map((campaign) => {
              const statusConfig = getStatusConfig(campaign.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={campaign.id} className="campaign-item-card hover-lift border transition-all">
                  <CardContent className="p-4">
                    <div className="layout-between items-start">
                      <div className="flex-1">
                        <div className="layout-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {campaign.campaignType.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.totalInvited} participantes
                          </span>
                        </div>

                        {/* Barra de progreso para campañas activas */}
                        {campaign.status === 'active' && (
                          <div className="mb-3">
                            <div className="layout-between text-xs text-muted-foreground mb-1">
                              <span>Participación: {campaign.participationRate.toFixed(1)}%</span>
                              <span>{campaign.totalResponded} de {campaign.totalInvited} respuestas</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  campaign.participationRate >= 70 ? 'bg-green-500' :
                                  campaign.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(campaign.participationRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-2 ml-4">
                        {campaign.canViewResults && (
                          <Button variant="outline" size="sm" className="focus-ring">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Resultados
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onManageState(campaign)}
                          className="focus-ring"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Gestionar Estado
                        </Button>
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
  );
}