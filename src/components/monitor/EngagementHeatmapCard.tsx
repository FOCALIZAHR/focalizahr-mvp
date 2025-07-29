// ====================================================================
// FOCALIZAHR ENGAGEMENT HEATMAP CARD - WOW Foundation Intelligence
// src/components/monitor/EngagementHeatmapCard.tsx
// Chat 4A: Foundation Intelligence Component 1/3
// ====================================================================

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, Lightbulb } from 'lucide-react';
import type { EngagementHeatmapData } from '@/types';

interface EngagementHeatmapCardProps {
  engagementHeatmap: EngagementHeatmapData;
  lastRefresh: Date;
}

export function EngagementHeatmapCard({ 
  engagementHeatmap, 
  lastRefresh 
}: EngagementHeatmapCardProps) {
  const { hourlyData, recommendations } = engagementHeatmap;

  // Calcular hora pico
  const maxHour = hourlyData.indexOf(Math.max(...hourlyData));
  const maxActivity = Math.max(...hourlyData);
  const totalActivity = hourlyData.reduce((sum, count) => sum + count, 0);

  // Generar visualización de horas (0-23)
  const hourBars = hourlyData.map((count, hour) => ({
    hour,
    count,
    percentage: totalActivity > 0 ? (count / totalActivity) * 100 : 0,
    isPeak: hour === maxHour && count > 0
  }));

  return (
    <Card className="glass-card neural-glow border-fhr-cyan/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <Clock className="h-5 w-5 text-fhr-cyan" />
            Mapa de Calor - Engagement Temporal
          </CardTitle>
          <div className="text-xs text-white/60">
            Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* VISUALIZACIÓN HEATMAP HORAS */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80 mb-3">
            Distribución Horaria Actividad
          </div>
          
          <div className="grid grid-cols-12 gap-1 mb-4">
            {Array.from({ length: 24 }, (_, i) => {
              const bar = hourBars[i];
              const height = Math.max(4, (bar.percentage / 10) * 20); // Min 4px, max ~40px
              
              return (
                <div
                  key={i}
                  className="flex flex-col items-center group relative"
                >
                  {/* Barra visual */}
                  <div
                    className={`w-4 rounded-t transition-all duration-300 mb-1 ${
                      bar.isPeak 
                        ? 'bg-gradient-to-t from-fhr-cyan to-cyan-300 shadow-lg shadow-cyan-500/30' 
                        : bar.count > 0 
                          ? 'bg-gradient-to-t from-fhr-purple/60 to-purple-400/60'
                          : 'bg-slate-700/40'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  
                  {/* Hora label */}
                  <div className="text-xs text-white/50 font-mono">
                    {i.toString().padStart(2, '0')}
                  </div>
                  
                  {/* Tooltip en hover */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 
                                  bg-black/90 text-white text-xs px-2 py-1 rounded 
                                  opacity-0 group-hover:opacity-100 transition-opacity
                                  pointer-events-none z-10 whitespace-nowrap">
                    {i}:00 - {bar.count} actividad(es)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MÉTRICAS DESTACADAS */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-fhr-cyan/10 to-transparent 
                          rounded-lg border border-fhr-cyan/20">
            <div className="text-lg font-bold text-fhr-cyan">
              {maxHour}:00
            </div>
            <div className="text-xs text-white/60">Hora Pico</div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-transparent 
                          rounded-lg border border-green-500/20">
            <div className="text-lg font-bold text-green-400">
              {maxActivity}
            </div>
            <div className="text-xs text-white/60">Máx. Actividad</div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-transparent 
                          rounded-lg border border-purple-500/20">
            <div className="text-lg font-bold text-purple-400">
              {totalActivity}
            </div>
            <div className="text-xs text-white/60">Total Eventos</div>
          </div>
        </div>

        {/* RECOMENDACIONES INTELIGENTES */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Recomendaciones Timing
          </div>
          
          <div className="space-y-2">
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-gradient-to-r from-slate-800/50 to-transparent 
                             rounded border-l-2 border-fhr-cyan/40"
                >
                  <TrendingUp className="h-3 w-3 text-fhr-cyan mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-white/80">{rec}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-white/50 italic">
                No hay suficiente actividad para generar recomendaciones.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER STATUS */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <div className="text-xs text-white/40">
            Basado en {totalActivity} eventos de actividad
          </div>
          <div className="text-xs text-fhr-cyan/80">
            🧠 Intelligence Engine
          </div>
        </div>
      </CardContent>
    </Card>
  );
}