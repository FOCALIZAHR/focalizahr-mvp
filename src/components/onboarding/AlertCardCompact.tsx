// src/components/onboarding/AlertCardCompact.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, TrendingDown, AlertTriangle } from 'lucide-react';

interface AlertCardCompactProps {
  alert: {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    journey: {
      fullName: string;
      department: { displayName: string } | null;
    };
    businessCase?: {
      title: string;
      problem: string;
      financialImpact?: {
        potentialLoss: number;
        roiEstimate: number;
      };
      recommendations?: Array<{
        action: string;
        timeline: string;
        responsible: string;
      }>;
    };
    slaStatus: 'on_time' | 'at_risk' | 'violated';
    status: 'pending' | 'acknowledged' | 'resolved';
    createdAt: Date;
  };
  onAction?: () => void;
}

const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400'
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400'
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400'
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400'
  }
};

export const AlertCardCompact: React.FC<AlertCardCompactProps> = ({ alert, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = SEVERITY_COLORS[alert.severity];
  const businessCase = alert.businessCase;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl overflow-hidden backdrop-blur-xl
        border ${colors.border} ${colors.bg}
        transition-all duration-300
      `}
    >
      {/* HEADER COMPACTO - Siempre visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                {alert.severity.toUpperCase()}
              </span>
              {alert.slaStatus === 'violated' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                  SLA VIOLADO
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-1 truncate">
              {businessCase?.title || 'Alerta sin título'}
            </h3>
            
            <p className="text-sm text-slate-400">
              {alert.journey.fullName} • {alert.journey.department?.displayName || 'Sin departamento'}
            </p>
          </div>

          {/* KPI Destacado */}
          {businessCase?.financialImpact && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500 mb-1">Pérdida Potencial</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                ${(businessCase.financialImpact.potentialLoss / 1_000_000).toFixed(1)}M
              </p>
            </div>
          )}
        </div>

        {/* Problema - Resumen (máximo 2 líneas) */}
        <p className="text-sm text-slate-300 mt-3 line-clamp-2">
          {businessCase?.problem}
        </p>

        {/* Botón Expandir/Colapsar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ver plan completo
            </>
          )}
        </button>
      </div>

      {/* SECCIÓN EXPANDIBLE - Plan de Acción */}
      <AnimatePresence>
        {expanded && businessCase?.recommendations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-cyan-400" />
                Plan de Acción Recomendado
              </h4>
              
              {businessCase.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium mb-1">{rec.action}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {rec.timeline}
                      </span>
                      <span>•</span>
                      <span>{rec.responsible}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* ROI Estimado */}
              {businessCase.financialImpact && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">ROI Estimado:</span>
                    <span className="text-lg font-bold text-green-400">
                      {businessCase.financialImpact.roiEstimate === Infinity 
                        ? '+∞%' 
                        : `+${businessCase.financialImpact.roiEstimate}%`}
                    </span>
                  </div>
                </div>
              )}

              {/* Botón Acción */}
              <button
                onClick={onAction}
                className="w-full py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-all"
              >
                Atender Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER - Metadata compacta */}
      <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {alert.status === 'pending' ? '⏳ Pendiente' :
             alert.status === 'acknowledged' ? '✓ Accionada' :
             '✅ Resuelta'}
          </span>
          <span>
            Creada: {new Date(alert.createdAt).toLocaleDateString('es-CL', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};