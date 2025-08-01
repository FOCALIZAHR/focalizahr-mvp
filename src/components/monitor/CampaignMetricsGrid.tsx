// ARCHIVO: /src/components/monitor/CampaignMetricsGrid.tsx (VERSIÓN ÚNICA Y CORRECTA)
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Clock, 
  Users, 
  CheckCircle
} from 'lucide-react';

// NOTA: Asumimos que MomentumIndicator se creará después. Si no existe, comente la línea 15 y 145-147.
import { MomentumIndicator } from './MomentumIndicator'; 
import type { DailyResponse } from '@/lib/utils/monitor-utils';

interface CampaignMetricsGridProps {
  participationRate: number;
  totalInvited: number;
  totalResponded: number;
  daysRemaining: number;
  lastActivity: string;
  endDate: string;
  lastRefresh: Date;
  dailyResponses: DailyResponse[];
  getParticipationColor: (rate: number) => string;
}

export function CampaignMetricsGrid({
  participationRate,
  totalInvited,
  totalResponded,
  daysRemaining,
  lastActivity,
  endDate,
  lastRefresh,
  dailyResponses,
  getParticipationColor
}: CampaignMetricsGridProps) {
  
  // Función auxiliar para obtener estado de participación
  const getParticipationStatus = (rate: number) => {
    if (rate >= 70) return { text: 'Excelente', color: 'bg-green-500' };
    if (rate >= 50) return { text: 'Regular', color: 'bg-yellow-500' };
    return { text: 'Bajo', color: 'bg-red-500' };
  };

  return (
    <>
      <div className="metrics-grid">
        {/* Participación */}
        <Card className="glass-card neural-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Participación
            </CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {participationRate}%
            </div>
            <p className="text-xs text-white/60 mb-3">
              {totalResponded} de {totalInvited} participantes
            </p>
            
            <div className="progress-container bg-white/10">
              <div 
                className={`progress-fill bg-gradient-to-r ${getParticipationColor(participationRate)}`}
                style={{ width: `${participationRate}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${getParticipationStatus(participationRate).color}`} />
              <span className="text-xs text-white/80">
                {getParticipationStatus(participationRate).text}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Respuestas */}
        <Card className="glass-card neural-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Respuestas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalResponded}
            </div>
            <p className="text-xs text-white/60">
              Respuestas completadas
            </p>
            <div className="text-sm text-cyan-400 mt-2">
              +{dailyResponses[dailyResponses.length - 1]?.responses || 0} hoy
            </div>
          </CardContent>
        </Card>

        {/* Días restantes */}
        <Card className="glass-card neural-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Tiempo Restante
            </CardTitle>
            <Clock className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {daysRemaining}
            </div>
            <p className="text-xs text-white/60">
              Días restantes
            </p>
            <div className="text-sm text-orange-400 mt-2">
              Finaliza {endDate}
            </div>
          </CardContent>
        </Card>

        {/* Última actividad */}
        <Card className="glass-card neural-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Última Actividad
            </CardTitle>
            <Activity className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">
              {lastActivity.split(' ')[1]}
            </div>
            <p className="text-xs text-white/60">
              {lastActivity.split(' ')[0]}
            </p>
            <div className="text-sm text-green-400 mt-2">
              Actualizado hace {Math.round((Date.now() - lastRefresh.getTime()) / 60000)} min
            </div>
          </CardContent>
        </Card>

      {/* 🚀 ELEMENTO WOW: Momentum Indicator */}
      <div className="mt-8">
        <MomentumIndicator 
          dailyResponses={dailyResponses} 
          lastRefresh={lastRefresh}
          participationRate={participationRate}
          daysRemaining={daysRemaining}
          totalInvited={totalInvited}
          onActionTrigger={(action) => console.log('Acción:', action)}
        />
      </div>
      </div>

      {/* ← ELIMINADO: El div extra que tenías con MomentumIndicator fuera del grid */}
    </>
  );
}