'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  Award
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { DashboardMetrics } from '@/types';

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

// Componente MetricsCards extraído exacto del original
export default function MetricsCards({ 
  metrics, 
  loading, 
  error, 
  lastUpdated, 
  onRefresh 
}: MetricsCardsProps) {

  if (loading && !metrics) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="professional-card animate-fade-in">
            <div className="h-4 bg-muted rounded w-24 mb-2 skeleton-layout"></div>
            <div className="h-8 bg-muted rounded w-16 mb-1 skeleton-layout"></div>
            <div className="h-3 bg-muted rounded w-32 skeleton-layout"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="metrics-grid">
        <Card className="professional-card border-destructive md:col-span-2 lg:col-span-4">
          <CardContent className="layout-between p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">Error al cargar métricas: {error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="focus-ring">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  const participationColor = metrics.globalParticipationRate >= 70 ? 'text-green-600' : 
                            metrics.globalParticipationRate >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      <div className="metrics-grid">
        {/* Card 1: Total Campañas */}
        <div className="metric-card-elegant accent-cyan">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Total Campañas</h3>
            <div className="w-10 h-10 rounded-lg bg-primary/20 layout-center">
              <BarChart3 className="h-4 w-4 text-primary metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.totalCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <Activity className="h-3 w-3" />
              <span>+{metrics.activeCampaigns} activas</span>
              {metrics.weeklyGrowth && (
                <Badge variant="outline" className="text-xs">
                  +{metrics.weeklyGrowth}% semanal
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Participación Global */}
        <div className="metric-card-elegant accent-purple">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Participación Global</h3>
            <div className="w-10 h-10 rounded-lg bg-secondary/20 layout-center">
              <TrendingUp className={`h-4 w-4 metric-icon ${participationColor}`} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">
              {metrics.globalParticipationRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <Users className="h-3 w-3" />
              <span>{metrics.totalResponses} de {metrics.totalParticipants} invitados</span>
            </div>
            {metrics.monthlyGrowth && (
              <div className="mt-2">
                <Badge variant={metrics.monthlyGrowth > 0 ? "default" : "secondary"}>
                  {metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth}% vs mes anterior
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Campañas Activas */}
        <div className="metric-card-elegant accent-blue">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Campañas Activas</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 layout-center">
              <Activity className="h-4 w-4 text-blue-400 metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.activeCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-blue-300">
              <Clock className="h-3 w-3" />
              <span>En progreso ahora</span>
            </div>
            {metrics.averageCompletionTime && (
              <div className="mt-2 text-xs text-white/60">
                Tiempo promedio: {metrics.averageCompletionTime} min
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Completadas */}
        <div className="metric-card-elegant accent-green">
          <div className="layout-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-white/80">Completadas</h3>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 layout-center">
              <CheckCircle className="h-4 w-4 text-green-400 metric-icon" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold focalizahr-gradient-text">{metrics.completedCampaigns}</div>
            <div className="flex items-center gap-2 text-xs text-green-300">
              <Award className="h-3 w-3" />
              <span>Finalizadas exitosamente</span>
            </div>
            {metrics.topPerformingCampaign && (
              <div className="mt-2 text-xs text-white/60 truncate">
                Top: {metrics.topPerformingCampaign}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar Elegante */}
      {lastUpdated && (
        <div className="status-bar-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-white/90">Sistema Activo</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/20" />
              <span className="text-white/70">Actualización automática cada 60s</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="h-3 w-3" />
              <span>Última actualización: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}