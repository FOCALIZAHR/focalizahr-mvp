// src/components/onboarding/TopAlertsPanel.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface TopAlertsPanelProps {
  topAlertTypes: Array<{ type: string; count: number }>;
}

/**
 * ALERT TYPE LABELS MAPPING
 */
const ALERT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  stage_incomplete: { 
    label: 'Etapa Incompleta', 
    color: 'text-orange-400' 
  },
  abandono_dia_1: { 
    label: 'Abandono Día 1', 
    color: 'text-red-400' 
  },
  bienvenida_fallida: { 
    label: 'Bienvenida Fallida', 
    color: 'text-orange-400' 
  },
  confusion_rol: { 
    label: 'Confusión de Rol', 
    color: 'text-yellow-400' 
  },
  desajuste_rol: { 
    label: 'Desajuste de Rol', 
    color: 'text-orange-400' 
  },
  riesgo_fuga: { 
    label: 'Riesgo de Fuga', 
    color: 'text-red-400' 
  },
  detractor_cultural: { 
    label: 'Detractor Cultural', 
    color: 'text-purple-400' 
  }
};

export const TopAlertsPanel: React.FC<TopAlertsPanelProps> = ({ topAlertTypes }) => {
  
  if (topAlertTypes.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fhr-card mb-8"
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          Top 3 Alertas Más Frecuentes
        </h3>
      </div>
      
      {/* TOP ALERTS LIST */}
      <div className="space-y-4">
        {topAlertTypes.map((alertType, index) => {
          const config = ALERT_TYPE_LABELS[alertType.type] || {
            label: alertType.type,
            color: 'text-slate-400'
          };
          
          const totalAlerts = topAlertTypes.reduce((sum, a) => sum + a.count, 0);
          const percentage = Math.round((alertType.count / totalAlerts) * 100);
          
          return (
            <motion.div
              key={alertType.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Ranking Badge */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${index === 1 ? 'bg-slate-500/20 text-slate-400' : ''}
                    ${index === 2 ? 'bg-orange-500/20 text-orange-400' : ''}
                  `}>
                    #{index + 1}
                  </div>
                  
                  {/* Alert Type Label */}
                  <div>
                    <p className={`text-base font-semibold ${config.color}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {alertType.count} {alertType.count === 1 ? 'alerta' : 'alertas'}
                    </p>
                  </div>
                </div>
                
                {/* Count Badge */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {alertType.count}
                  </p>
                  <p className="text-xs text-slate-500">
                    {percentage}% del total
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + (0.1 * index) }}
                  className={`h-full rounded-full ${
                    index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                    'bg-gradient-to-r from-yellow-500 to-cyan-500'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* INSIGHT TEXT */}
      <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyan-300 font-medium mb-1">
              Insight Inteligencia
            </p>
            <p className="text-xs text-cyan-200/70 leading-relaxed">
              Los {topAlertTypes.length} tipos de alertas más frecuentes representan el{' '}
              {Math.round(
                (topAlertTypes.reduce((sum, a) => sum + a.count, 0) / 
                topAlertTypes.reduce((sum, a) => sum + a.count, 0)) * 100
              )}% de todas las alertas activas. 
              Focalizar recursos en resolver estas alertas maximizará el impacto en la retención.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};