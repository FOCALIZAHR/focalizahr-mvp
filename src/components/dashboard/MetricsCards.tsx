'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  Clock
} from 'lucide-react';

// Interfaz para métricas (extraída de page.tsx)
interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  recentResponses?: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number | null;
  topPerformingCampaign?: string | null;
}

// Props del componente
interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function MetricsCards({ 
  metrics, 
  loading, 
  error, 
  lastUpdated, 
  onRefresh 
}: MetricsCardsProps) {
  if (loading && !metrics) {
    return (
      <div className="metrics-loading-skeleton grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="professional-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="professional-card border-l-4 border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-600">Error al cargar métricas</h3>
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

  if (!metrics) {
    return null;
  }

  return (
    <>
      {/* Grid principal de métricas */}
      <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Campañas */}
        <Card className="professional-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Campañas
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 layout-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">
              {metrics.totalCampaigns}
            </div>
            {metrics.weeklyGrowth !== undefined && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">
                  +{metrics.weeklyGrowth}% esta semana
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campañas Activas */}
        <Card className="professional-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Campañas Activas
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 layout-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">
              {metrics.activeCampaigns}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics.draftCampaigns} borradores
              </span>
              <Badge variant="outline" className="text-xs">
                En curso
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Participación Global */}
        <Card className="professional-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participación Global
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 layout-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">
              {metrics.globalParticipationRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics.totalResponses} respuestas
              </span>
              <Badge 
                variant={metrics.globalParticipationRate >= 70 ? "default" : "secondary"}
                className="text-xs"
              >
                {metrics.globalParticipationRate >= 70 ? "Excelente" : "Mejorable"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Respuestas Recientes */}
        <Card className="professional-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Respuestas Recientes
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 layout-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-foreground">
              {metrics.recentResponses || 0}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Últimas 24h
              </span>
              {metrics.monthlyGrowth !== undefined && (
                <Badge variant="outline" className="text-xs">
                  +{metrics.monthlyGrowth}% mes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer con última actualización */}
      {lastUpdated && (
        <div className="mt-6 pt-4 border-t layout-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Datos actualizados automáticamente</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="h-3 w-3" />
            <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </>
  );
}