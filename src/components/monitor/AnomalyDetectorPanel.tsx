// ====================================================================
// FOCALIZAHR ANOMALY DETECTOR PANEL - WOW Foundation Intelligence
// src/components/monitor/AnomalyDetectorPanel.tsx
// Chat 4A: Foundation Intelligence Component 3/3 - CORREGIDO SIN CÁLCULOS
// ====================================================================

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Search } from 'lucide-react';
import type { DepartmentAnomalyData } from '@/types';

interface AnomalyDetectorPanelProps {
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];      // ✅ YA CALCULADO EN HOOK
  negativeAnomalies: DepartmentAnomalyData[];      // ✅ YA CALCULADO EN HOOK
  meanRate: number;                                // ✅ YA CALCULADO EN HOOK
  totalDepartments: number;                        // ✅ YA CALCULADO EN HOOK
  lastRefresh: Date;
}

export function AnomalyDetectorPanel({ 
  departmentAnomalies,
  positiveAnomalies,     // ✅ RECIBIR YA CALCULADO
  negativeAnomalies,     // ✅ RECIBIR YA CALCULADO  
  meanRate,              // ✅ RECIBIR YA CALCULADO
  totalDepartments,      // ✅ RECIBIR YA CALCULADO
  lastRefresh 
}: AnomalyDetectorPanelProps) {
  
  // ❌ CÁLCULOS REMOVIDOS - AHORA VIENEN DEL HOOK
  // const departmentRates = Object.values(byDepartment).map(d => d.rate);
  // const meanRate = departmentRates.length > 0 ? ... : 0;
  // const positiveAnomalies = departmentAnomalies.filter(a => a.type === 'positive_outlier');
  // const negativeAnomalies = departmentAnomalies.filter(a => a.type === 'negative_outlier');
  
  // Componente para mostrar una anomalía individual
  const AnomalyItem = ({ anomaly }: { anomaly: DepartmentAnomalyData }) => {
    const isPositive = anomaly.type === 'positive_outlier';
    const isHigh = anomaly.severity === 'high';
    
    const config = {
      positive: {
        color: 'text-green-400',
        bgColor: 'from-green-500/10 to-emerald-500/5',
        borderColor: 'border-green-500/30',
        icon: TrendingUp,
        label: 'Rendimiento Superior',
        badgeColor: 'bg-green-500/20 text-green-300'
      },
      negative: {
        color: 'text-red-400', 
        bgColor: 'from-red-500/10 to-pink-500/5',
        borderColor: 'border-red-500/30',
        icon: TrendingDown,
        label: 'Rendimiento Inferior',
        badgeColor: 'bg-red-500/20 text-red-300'
      }
    };
    
    const currentConfig = isPositive ? config.positive : config.negative;
    const IconComponent = currentConfig.icon;
    
    return (
      <div className={`p-3 rounded-lg bg-gradient-to-r ${currentConfig.bgColor} 
                      border ${currentConfig.borderColor} transition-all duration-200 
                      hover:scale-[1.02]`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <IconComponent className={`h-5 w-5 ${currentConfig.color} mt-0.5 flex-shrink-0`} />
            
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">
                  {anomaly.department}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${currentConfig.badgeColor}`}>
                  {isHigh ? 'Crítico' : 'Moderado'}
                </span>
              </div>
              
              <div className="text-xs text-white/70">
                {currentConfig.label}: {anomaly.currentRate}% 
                {isPositive ? ' sobre' : ' bajo'} promedio ({meanRate.toFixed(1)}%)
              </div>
              
              <div className="text-xs text-white/50">
                Z-Score: {anomaly.zScore} | 
                Desviación: {Math.abs(anomaly.currentRate - meanRate).toFixed(1)} puntos
              </div>
            </div>
          </div>
          
          {/* Indicador visual rate */}
          <div className="text-right">
            <div className={`text-lg font-bold ${currentConfig.color}`}>
              {anomaly.currentRate}%
            </div>
            <div className="text-xs text-white/50">
              Participación
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-card neural-glow border-orange-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <Search className="h-5 w-5 text-orange-400" />
            Detector de Anomalías Departamentales
          </CardTitle>
          <div className="text-xs text-white/60">
            Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* RESUMEN ESTADÍSTICO - USANDO DATOS YA CALCULADOS */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-gradient-to-br from-slate-800/50 to-transparent 
                          rounded border border-slate-600/30">
            <div className="text-lg font-bold text-white">
              {totalDepartments}
            </div>
            <div className="text-xs text-white/60">Departamentos</div>
          </div>
          
          <div className="text-center p-2 bg-gradient-to-br from-blue-500/10 to-transparent 
                          rounded border border-blue-500/20">
            <div className="text-lg font-bold text-blue-400">
              {meanRate.toFixed(1)}%
            </div>
            <div className="text-xs text-white/60">Promedio</div>
          </div>
          
          <div className="text-center p-2 bg-gradient-to-br from-green-500/10 to-transparent 
                          rounded border border-green-500/20">
            <div className="text-lg font-bold text-green-400">
              {positiveAnomalies.length}
            </div>
            <div className="text-xs text-white/60">Superiores</div>
          </div>
          
          <div className="text-center p-2 bg-gradient-to-br from-red-500/10 to-transparent 
                          rounded border border-red-500/20">
            <div className="text-lg font-bold text-red-400">
              {negativeAnomalies.length}
            </div>
            <div className="text-xs text-white/60">Inferiores</div>
          </div>
        </div>

        {/* LISTA DE ANOMALÍAS */}
        <div className="space-y-3">
          {departmentAnomalies.length > 0 ? (
            <>
              {/* Anomalías positivas primero */}
              {positiveAnomalies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Departamentos con Rendimiento Superior
                  </div>
                  {positiveAnomalies.map((anomaly, index) => (
                    <AnomalyItem key={`positive-${index}`} anomaly={anomaly} />
                  ))}
                </div>
              )}
              
              {/* Anomalías negativas */}
              {negativeAnomalies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-400 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Departamentos con Rendimiento Inferior
                  </div>
                  {negativeAnomalies.map((anomaly, index) => (
                    <AnomalyItem key={`negative-${index}`} anomaly={anomaly} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Sin anomalías detectadas */
            <div className="text-center py-8 space-y-2">
              <Activity className="h-12 w-12 text-white/30 mx-auto" />
              <div className="text-sm text-white/60">
                No se detectaron anomalías significativas
              </div>
              <div className="text-xs text-white/40">
                Todas las departamentales dentro de rango normal (Z-Score {'<'} 1.5)
              </div>
            </div>
          )}
        </div>

        {/* INFORMACIÓN METODOLÓGICA */}
        {departmentAnomalies.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-slate-800/30 to-transparent 
                          rounded-lg border border-slate-600/20">
            <div className="text-xs text-white/70">
              <strong>Metodología:</strong> Análisis estadístico Z-Score. 
              Anomalías detectadas cuando |Z| {'>'} 1.5 (moderadas) o |Z| {'>'} 2.0 (críticas).
              Basado en desviación estándar de participación departamental.
            </div>
          </div>
        )}

        {/* FOOTER ALGORITMO */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <div className="text-xs text-white/40">
            Algoritmo: Statistical Z-Score Analysis
          </div>
          <div className="text-xs text-orange-400/80">
            🔍 Anomaly Detection Engine
          </div>
        </div>
      </CardContent>
    </Card>
  );
}