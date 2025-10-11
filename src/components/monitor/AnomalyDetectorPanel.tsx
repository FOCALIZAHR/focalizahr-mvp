// ====================================================================
// ANOMALY DETECTOR PANEL - VERSIÓN WOW CORPORATIVA
// src/components/monitor/AnomalyDetectorPanel.tsx
// Inteligencia de variaciones departamentales significativas
// ====================================================================

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Search, BarChart3 } from 'lucide-react';
import type { DepartmentAnomalyData } from '@/types';

interface AnomalyDetectorPanelProps {
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];
  negativeAnomalies: DepartmentAnomalyData[];
  meanRate: number;
  totalDepartments: number;
  lastRefresh: Date;
}

export function AnomalyDetectorPanel({ 
  departmentAnomalies,
  positiveAnomalies,
  negativeAnomalies,
  meanRate,
  totalDepartments,
  lastRefresh 
}: AnomalyDetectorPanelProps) {
  
  // DEBUG ESPECÍFICO: Ver estructura exacta
  if (departmentAnomalies.length > 0) {
    console.log('🔍 AnomalyDetector - Estructura primer elemento:', {
      primerAnomalía: departmentAnomalies[0],
      tieneType: 'type' in departmentAnomalies[0],
      valorType: departmentAnomalies[0].type,
      propiedades: Object.keys(departmentAnomalies[0])
    });
  }
  
  // Componente para mostrar una variación individual
  const AnomalyItem = ({ anomaly }: { anomaly: DepartmentAnomalyData }) => {
    // FALLBACK: Si no tiene type, inferir del zScore
    const inferredType = anomaly.type || (anomaly.zScore > 0 ? 'positive_outlier' : 'negative_outlier');
    const isPositive = inferredType === 'positive_outlier';
    const isHigh = anomaly.severity === 'high';
    
    const config = {
      positive: {
        color: 'text-green-400',
        bgColor: 'from-green-950/30 to-emerald-950/20',
        borderColor: 'border-green-500/30',
        icon: TrendingUp,
        label: 'Desempeño Superior',
        badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
        badgeText: isHigh ? 'Excepcional' : 'Destacado'
      },
      negative: {
        color: 'text-orange-400', 
        bgColor: 'from-orange-950/30 to-amber-950/20',
        borderColor: 'border-orange-500/30',
        icon: TrendingDown,
        label: 'Requiere Atención',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        badgeText: isHigh ? 'Prioritario' : 'Seguimiento'
      }
    };
    
    const currentConfig = isPositive ? config.positive : config.negative;
    const IconComponent = currentConfig.icon;
    
    return (
      <div className={`p-3 rounded-lg bg-gradient-to-r ${currentConfig.bgColor}
                      border ${currentConfig.borderColor} transition-all duration-200 
                      hover:scale-[1.01]`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <IconComponent className={`h-5 w-5 ${currentConfig.color} mt-0.5 flex-shrink-0`} />
            
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-100 capitalize">
                  {anomaly.department}
                </span>
                <Badge variant="secondary" className={`${currentConfig.badgeColor} text-xs`}>
                  {currentConfig.badgeText}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-400">
                {currentConfig.label}: {anomaly.rate}% 
                {isPositive ? ' sobre' : ' bajo'} el promedio ({meanRate.toFixed(1)}%)
              </div>
              
              <div className="text-xs text-gray-500">
                Variación estadística: {Math.abs(anomaly.zScore).toFixed(1)}σ | 
                Diferencia: {Math.abs(anomaly.rate - meanRate).toFixed(1)} puntos
              </div>
            </div>
          </div>
          
          {/* Indicador visual de tasa */}
          <div className="text-right">
            <div className={`text-xl font-bold ${currentConfig.color}`}>
              {anomaly.rate}%
            </div>
            <div className="text-xs text-gray-500">
              participación
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card 
      data-component="AnomalyDetectorPanel"
      className="fhr-card glass-card backdrop-blur-xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Análisis de Variaciones
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Detección estadística de outliers • {lastRefresh.toLocaleTimeString('es-CL')}
              </p>
            </div>
          </div>
          {departmentAnomalies.length > 0 && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {departmentAnomalies.length} detectadas
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* MÉTRICAS ESTADÍSTICAS */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2.5 bg-gradient-to-br from-gray-800/50 to-transparent 
                          rounded-lg border border-gray-700/30">
            <div className="text-lg font-bold text-gray-100">
              {totalDepartments}
            </div>
            <div className="text-xs text-gray-400 font-medium">Total</div>
          </div>
          
          <div className="text-center p-2.5 bg-gradient-to-br from-blue-900/30 to-transparent 
                          rounded-lg border border-blue-500/20">
            <div className="text-lg font-bold text-blue-400">
              {meanRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 font-medium">Promedio</div>
          </div>
          
          <div className="text-center p-2.5 bg-gradient-to-br from-green-900/30 to-transparent 
                          rounded-lg border border-green-500/20">
            <div className="text-lg font-bold text-green-400">
              {positiveAnomalies.length}
            </div>
            <div className="text-xs text-gray-400 font-medium">Superiores</div>
          </div>
          
          <div className="text-center p-2.5 bg-gradient-to-br from-orange-900/30 to-transparent 
                          rounded-lg border border-orange-500/20">
            <div className="text-lg font-bold text-orange-400">
              {negativeAnomalies.length}
            </div>
            <div className="text-xs text-gray-400 font-medium">Atención</div>
          </div>
        </div>

        {/* LISTA DE VARIACIONES SIGNIFICATIVAS */}
        <div className="space-y-2">
          {departmentAnomalies.length > 0 ? (
            <>
              {/* Outliers positivos primero */}
              {positiveAnomalies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider pl-1">
                    Desempeño Excepcional
                  </h4>
                  {positiveAnomalies.map((anomaly) => (
                    <AnomalyItem key={anomaly.department} anomaly={anomaly} />
                  ))}
                </div>
              )}
              
              {/* Separador si hay ambos tipos */}
              {positiveAnomalies.length > 0 && negativeAnomalies.length > 0 && (
                <div className="border-t border-gray-800/50 my-3" />
              )}
              
              {/* Outliers negativos */}
              {negativeAnomalies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider pl-1">
                    Requieren Intervención
                  </h4>
                  {negativeAnomalies.map((anomaly) => (
                    <AnomalyItem key={anomaly.department} anomaly={anomaly} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Search className="h-10 w-10 mx-auto mb-3 text-gray-600" />
              <div className="text-gray-400 font-medium">
                Sin variaciones significativas detectadas
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Todos los departamentos dentro de rangos esperados
              </div>
            </div>
          )}
        </div>

        {/* INSIGHT ESTADÍSTICO */}
        {departmentAnomalies.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-950/20 to-purple-950/20 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300">
                <span className="font-semibold">Análisis estadístico:</span> Se detectaron {departmentAnomalies.length} departamentos 
                con variaciones significativas (|z| &gt; 1.5). {positiveAnomalies.length > 0 && `${positiveAnomalies.length} superan expectativas.`} 
                {negativeAnomalies.length > 0 && ` ${negativeAnomalies.length} requieren seguimiento estratégico.`}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnomalyDetectorPanel;