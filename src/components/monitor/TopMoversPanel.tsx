// ====================================================================
// TOP MOVERS DEPARTAMENTAL - VERSIÓN WOW CORPORATIVA
// /src/components/monitor/TopMoversPanel.tsx
// Diferenciador competitivo: Momentum departamental en tiempo real
// ====================================================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react';

// ====================================================================
// INTERFACES - INTELIGENCIA DEPARTAMENTAL
// ====================================================================

interface TopMover {
  name: string;
  momentum: number;
  trend: 'acelerando' | 'estable' | 'desacelerando' | 'completado';
}

interface TopMoversPanelProps {
  topMovers?: TopMover[];
  lastRefresh?: Date;
}

// ====================================================================
// COMPONENTE PRINCIPAL - INTELIGENCIA PREDICTIVA
// ====================================================================

export function TopMoversPanel({ topMovers = [], lastRefresh }: TopMoversPanelProps) {
  
  // 🧠 ANÁLISIS INTELIGENTE DE PATRONES DEPARTAMENTALES
  const movementAnalysis = useMemo(() => {
    if (topMovers.length === 0) {
      return {
        hasData: false,
        dominantPattern: 'sin_datos',
        insights: ['Datos insuficientes para análisis departamental'],
        recommendations: ['Esperando actividad departamental']
      };
    }

    // Analizar patrones dominantes
    const patterns = {
      completado: topMovers.filter(m => m.trend === 'completado').length,
      acelerando: topMovers.filter(m => m.trend === 'acelerando').length,
      estable: topMovers.filter(m => m.trend === 'estable').length,
      desacelerando: topMovers.filter(m => m.trend === 'desacelerando').length
    };

    const dominantPattern = Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Generar insights inteligentes basados en datos reales
    const insights = [];
    const recommendations = [];

    if (dominantPattern === 'completado') {
      insights.push(`${patterns.completado} departamentos completaron exitosamente`);
      insights.push('Patrón de respuesta rápida y efectiva detectado');
      recommendations.push('Replicar metodología en próximas campañas');
      recommendations.push('Documentar mejores prácticas identificadas');
    }

    if (patterns.acelerando > 0) {
      insights.push(`${patterns.acelerando} departamentos incrementando velocidad`);
      recommendations.push('Mantener comunicación con equipos activos');
    }

    if (patterns.desacelerando > 0) {
      insights.push(`${patterns.desacelerando} departamentos reduciendo ritmo`);
      recommendations.push('Activar plan de impulso estratégico');
    }

    // Identificar departamento líder
    const topPerformer = topMovers[0];
    if (topPerformer) {
      insights.push(`${topPerformer.name} lidera con índice ${topPerformer.momentum}`);
    }

    return {
      hasData: true,
      dominantPattern,
      insights,
      recommendations,
      patterns
    };
  }, [topMovers]);

  // 🎨 FUNCIÓN PARA OBTENER STYLING POR TREND
  const getTrendStyling = (trend: string) => {
    switch (trend) {
      case 'completado':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bg: 'bg-gradient-to-r from-green-950/30 to-emerald-950/20',
          border: 'border-green-500/30',
          badge: 'Completado',
          badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30'
        };
      case 'acelerando':
        return {
          icon: TrendingUp,
          color: 'text-blue-400',
          bg: 'bg-gradient-to-r from-blue-950/30 to-cyan-950/20',
          border: 'border-blue-500/30',
          badge: 'Acelerando',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'estable':
        return {
          icon: Activity,
          color: 'text-purple-400',
          bg: 'bg-gradient-to-r from-purple-950/30 to-indigo-950/20',
          border: 'border-purple-500/30',
          badge: 'Estable',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'desacelerando':
        return {
          icon: Target,
          color: 'text-orange-400',
          bg: 'bg-gradient-to-r from-orange-950/30 to-amber-950/20',
          border: 'border-orange-500/30',
          badge: 'Optimizando',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-400',
          bg: 'bg-gray-800/30',
          border: 'border-gray-700/30',
          badge: 'Analizando',
          badgeColor: 'bg-gray-700/20 text-gray-300 border-gray-700/30'
        };
    }
  };

  return (
    <motion.div
      data-component="TopMoversPanel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="fhr-card glass-card backdrop-blur-xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-sm">
                <Trophy className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Momentum Departamental
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Análisis predictivo con inteligencia artificial
                </p>
              </div>
            </div>
            {movementAnalysis.hasData && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Tiempo Real
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* LISTA TOP MOVERS */}
          {movementAnalysis.hasData ? (
            <div className="space-y-2">
              {topMovers.slice(0, 5).map((mover, index) => {
                const styling = getTrendStyling(mover.trend);
                const IconComponent = styling.icon;
                
                return (
                  <motion.div
                    key={mover.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${styling.bg} border ${styling.border} hover:scale-[1.01] transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <Award className="h-4 w-4 text-yellow-400" />
                        )}
                        <IconComponent className={`h-4 w-4 ${styling.color}`} />
                        
                        <div>
                          <div className="font-semibold text-gray-100 capitalize">
                            {mover.name}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${styling.badgeColor} text-xs mt-1`}
                          >
                            {styling.badge}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${styling.color}`}>
                          {mover.momentum}
                        </div>
                        <div className="text-xs text-gray-500">
                          índice
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <div className="text-gray-400 font-medium">
                Calculando momentum departamental
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Los datos aparecerán con actividad suficiente
              </div>
            </div>
          )}

          {/* INSIGHTS INTELIGENTES */}
          {movementAnalysis.hasData && movementAnalysis.insights.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="border-t border-gray-800/50 pt-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400">
                  Análisis Predictivo
                </span>
              </div>
              
              <div className="space-y-2">
                {movementAnalysis.insights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-300 bg-gray-800/30 p-2.5 rounded-lg border border-gray-700/30 flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>

              {movementAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    Acciones Recomendadas
                  </div>
                  {movementAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-400 pl-3 border-l-2 border-orange-500/30"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* METADATA */}
          {lastRefresh && (
            <div className="text-xs text-gray-500 text-right pt-2 border-t border-gray-800/50">
              Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TopMoversPanel;