// src/components/insights/InsightAccionable.tsx
// REDISEÑO PREMIUM - Filosofía Componentes WOW + Guía Diseño FocalizaHR
// Inspiración: Apple/Tesla - Minimalismo Extremo + Jerarquía Científica

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles
} from 'lucide-react';

interface BusinessCase {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  problemDescription: string;
  financialImpact: {
    currentCost: number;
    potentialLoss: number;
    requiredInvestment: number;
    roiEstimate: number;
    paybackMonths: number;
  };
  recommendations: Array<{
    action: string;
    timeline: string;
    responsible: string;
    validation: string;
  }>;
  timeline: {
    urgency: string;
    interventionWindow: string;
    effectivenessDecline: string;
  };
  successMetrics: Array<{
    metric: string;
    target: string;
  }>;
  methodology: {
    model: string;
    confidence: string;
  };
  createdAt: Date;
  confidenceLevel: string;
}

interface InsightAccionableProps {
  businessCase: BusinessCase;
  companyName: string;
  onActionClick?: (action: string) => void;
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    color: 'red',
    icon: AlertTriangle,
    bgGradient: 'from-red-500/5 via-red-500/10 to-red-500/5',
    borderColor: 'border-red-500/30',
    glowColor: 'shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-400/50'
  },
  high: {
    color: 'orange',
    icon: TrendingDown,
    bgGradient: 'from-orange-500/5 via-orange-500/10 to-orange-500/5',
    borderColor: 'border-orange-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(251,146,60,0.12)]',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-400/50'
  },
  medium: {
    color: 'yellow',
    icon: AlertTriangle,
    bgGradient: 'from-yellow-500/5 via-yellow-500/10 to-yellow-500/5',
    borderColor: 'border-yellow-500/30',
    glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.1)]',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50'
  },
  low: {
    color: 'blue',
    icon: Target,
    bgGradient: 'from-blue-500/5 via-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.08)]',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-400/50'
  }
};

export const InsightAccionable: React.FC<InsightAccionableProps> = ({
  businessCase,
  companyName,
  onActionClick,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    problema: false,
    impacto: false,
    plan: false
  });

  const config = SEVERITY_CONFIG[businessCase.severity];
  const SeverityIcon = config.icon;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${(value / 1_000).toFixed(0)}K`;
  };

  const formatROI = (roi: number) => {
    return roi === Infinity ? '+∞%' : `+${roi.toFixed(0)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${config.bgGradient}
        backdrop-blur-xl
        border ${config.borderColor}
        ${config.glowColor}
        rounded-2xl
        ${className}
      `}
    >
      {/* NIVEL 1: HERO - Punto Focal Máximo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Info Principal */}
          <div className="flex-1 space-y-4">
            {/* Badge + Metadata */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
                {businessCase.severity.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-400/30">
                {businessCase.confidenceLevel}
              </span>
            </div>

            {/* Título Hero con gradiente FocalizaHR */}
            <h3 className="text-2xl font-light text-white leading-tight">
              <span className="fhr-title-gradient font-semibold">
                {businessCase.title}
              </span>
            </h3>

            {/* Metadata Temporal */}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(businessCase.createdAt).toLocaleDateString('es-CL', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {businessCase.methodology.model}
              </span>
            </div>
          </div>

          {/* Right: KPI Hero Destacado */}
          <div className="flex-shrink-0 text-right p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Pérdida Potencial</p>
            <p className={`text-4xl font-bold text-${config.color}-400`}>
              {formatCurrency(businessCase.financialImpact.potentialLoss)}
            </p>
            <p className="text-xs text-slate-500 mt-1">CLP en riesgo</p>
          </div>
        </div>
      </div>

      {/* NIVEL 2: SECCIONES COLLAPSIBLES */}
      <div className="divide-y divide-slate-700/50">
        
        {/* SECCIÓN: Problema Detectado */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('problema')}
            className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <h4 className="text-lg font-medium text-white">Problema Detectado</h4>
            </div>
            {expandedSections.problema ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.problema && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="mt-4 text-slate-300 leading-relaxed">
                  {businessCase.problemDescription}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECCIÓN: Impacto Financiero */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('impacto')}
            className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="text-lg font-medium text-white">Impacto Financiero</h4>
            </div>
            {expandedSections.impacto ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.impacto && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">Costo Actual</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(businessCase.financialImpact.currentCost)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-red-500/20">
                    <p className="text-xs text-slate-500 mb-1">Pérdida Potencial</p>
                    <p className="text-xl font-bold text-red-400">
                      {formatCurrency(businessCase.financialImpact.potentialLoss)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                    <p className="text-xs text-slate-500 mb-1">Inversión</p>
                    <p className="text-xl font-bold text-cyan-400">
                      {formatCurrency(businessCase.financialImpact.requiredInvestment)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/20">
                    <p className="text-xs text-slate-500 mb-1">ROI Estimado</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatROI(businessCase.financialImpact.roiEstimate)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECCIÓN: Plan de Acción */}
        <div className="p-6">
          <button
            onClick={() => toggleSection('plan')}
            className="w-full flex items-center justify-between group hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Target className="h-5 w-5 text-orange-400" />
              </div>
              <h4 className="text-lg font-medium text-white">Plan de Acción Recomendado</h4>
            </div>
            {expandedSections.plan ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.plan && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3">
                  {businessCase.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-white font-medium">{rec.action}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
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
                </div>

                {/* Timeline de Urgencia */}
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                  <p className="text-sm text-amber-400 font-medium mb-2">⏰ Ventana de Intervención</p>
                  <p className="text-xs text-slate-300">{businessCase.timeline.interventionWindow}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER: CTA Principal */}
      <div className="p-6 bg-slate-900/50 border-t border-slate-700/50">
        <button
          onClick={() => onActionClick?.('schedule_meeting')}
          className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30"
        >
          Programar Intervención Inmediata
        </button>
      </div>
    </motion.div>
  );
};