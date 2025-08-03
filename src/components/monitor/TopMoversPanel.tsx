// ====================================================================
// TOP MOVERS DEPARTAMENTAL - INTELIGENCIA PREDICTIVA DESBLOQUEADA
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
  Award
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
// COMPONENTE PRINCIPAL - CATALIZADOR INTELIGENCIA PREDICTIVA
// ====================================================================

export function TopMoversPanel({ topMovers = [], lastRefresh }: TopMoversPanelProps) {
  
  // 🧠 ANÁLISIS INTELIGENTE DE PATRONES DEPARTAMENTALES
  const movementAnalysis = useMemo(() => {
    if (topMovers.length === 0) {
      return {
        hasData: false,
        dominantPattern: 'sin_datos',
        insights: ['Datos insuficientes para análisis departamental'],
        recommendations: ['Esperar más actividad departamental']
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
      insights.push('Patrón: Respuesta rápida y efectiva detectado');
      recommendations.push('Replicar metodología para próximas campañas');
      recommendations.push('Documentar mejores prácticas identificadas');
    }

    if (patterns.acelerando > 0) {
      insights.push(`${patterns.acelerando} departamentos acelerando momentum`);
      recommendations.push('Mantener comunicación con departamentos activos');
    }

    if (patterns.desacelerando > 0) {
      insights.push(`${patterns.desacelerando} departamentos desacelerando`);
      recommendations.push('Intervención preventiva recomendada');
    }

    // Identificar departamento líder
    const topPerformer = topMovers[0];
    if (topPerformer) {
      insights.push(`${topPerformer.name} lidera con momentum ${topPerformer.momentum}`);
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
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          emoji: '✅'
        };
      case 'acelerando':
        return {
          icon: TrendingUp,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          emoji: '🚀'
        };
      case 'estable':
        return {
          icon: Activity,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          emoji: '📊'
        };
      case 'desacelerando':
        return {
          icon: Target,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          emoji: '⚠️'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          emoji: '📊'
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
              <Trophy className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-white font-semibold">
                🏆 Top Movers Departamental
              </span>
              <div className="text-sm text-cyan-400 font-medium">
                Inteligencia Predictiva Activada
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* LISTA TOP MOVERS */}
          {movementAnalysis.hasData ? (
            <div className="space-y-3">
              {topMovers.slice(0, 5).map((mover, index) => {
                const styling = getTrendStyling(mover.trend);
                const IconComponent = styling.icon;
                
                return (
                  <motion.div
                    key={mover.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${styling.bg} ${styling.border} hover:scale-[1.02] transition-transform duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Award className="h-4 w-4 text-yellow-400" />}
                          <span className="text-lg">{styling.emoji}</span>
                        </div>
                        
                        <div>
                          <div className="font-semibold text-white">
                            {mover.name}
                          </div>
                          <div className="text-sm text-white/60 capitalize">
                            {mover.trend.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xl font-bold ${styling.color}`}>
                          {mover.momentum}
                        </div>
                        <div className="text-xs text-white/60">
                          momentum
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <div className="text-white/60">
                Calculando inteligencia departamental...
              </div>
              <div className="text-sm text-white/40 mt-2">
                Los datos aparecerán cuando haya actividad suficiente
              </div>
            </div>
          )}

          {/* INSIGHTS INTELIGENTES */}
          {movementAnalysis.hasData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="border-t border-white/10 pt-4 space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400">
                  Insights Predictivos
                </span>
              </div>
              
              {movementAnalysis.insights.map((insight, index) => (
                <div
                  key={index}
                  className="text-sm text-white/80 bg-white/5 p-3 rounded-lg border border-white/10"
                >
                  💡 {insight}
                </div>
              ))}

              {movementAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-cyan-400">
                    🎯 Recomendaciones Automáticas:
                  </div>
                  {movementAnalysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="text-sm text-white/70 pl-4 border-l-2 border-cyan-500/30"
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
            <div className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
              Última actualización: {lastRefresh.toLocaleTimeString('es-CL')}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default TopMoversPanel;