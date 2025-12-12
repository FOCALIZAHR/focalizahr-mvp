// src/components/insights/InsightAccionable.tsx
// REDISEÑO PREMIUM - Adaptado a estructura REAL OnboardingAlertEngine
// Filosofía: Componentes WOW + Guía Diseño FocalizaHR + Collapsibles
// CORRECCIONES APLICADAS: Sin scores (Punto 2), Botón ejecutivo (Punto 3)

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
  Sparkles,
  Clock,
  Play
} from 'lucide-react';

// ========================================
// TYPES - Importar desde el proyecto REAL
// ========================================

import { BusinessCase } from '@/types/BusinessCase';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface InsightAccionableProps {
  businessCase: BusinessCase;
  companyName?: string;
  onActionClick?: (action: string) => void;
  className?: string;
}

// ========================================
// CONFIG VISUAL POR SEVERIDAD
// ========================================

// COPIADO DE CampaignRhythmPanel - Sutileza real FocalizaHR
const SEVERITY_CONFIG = {
  crítica: {
    color: 'red',
    icon: AlertTriangle,
    bgGradient: 'from-red-500/5 to-transparent',
    borderColor: 'border-red-500/30',
    glowColor: 'shadow-lg',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-400/30',
    textColor: 'text-red-400'
  },
  alta: {
    color: 'orange',
    icon: TrendingDown,
    bgGradient: 'from-orange-500/5 to-transparent',
    borderColor: 'border-orange-500/30',
    glowColor: 'shadow-lg',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-400/30',
    textColor: 'text-orange-400'
  },
  media: {
    color: 'yellow',
    icon: Clock,
    bgGradient: 'from-yellow-500/5 to-transparent',
    borderColor: 'border-yellow-500/30',
    glowColor: 'shadow-lg',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
    textColor: 'text-yellow-400'
  },
  baja: {
    color: 'blue',
    icon: Target,
    bgGradient: 'from-blue-500/5 to-transparent',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-md',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
    textColor: 'text-blue-400'
  }
};

// ========================================
// COMPONENT
// ========================================

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

  // ========================================
  // FORMATTERS
  // ========================================

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${(value / 1_000).toFixed(0)}K`;
  };

  const formatROI = (roi: number | undefined) => {
    if (!roi || roi === 0) return '0%';
    if (roi === Infinity) return '+∞%';
    if (roi > 1000) return '+1000%';
    return `+${roi.toFixed(0)}%`;
  };

  // Parsear recommendedActions que vienen como string con formato especial
  const parseAction = (actionString: string) => {
    // Formato: "1. Acción\n   ⏱️ Plazo: X\n   👤 Responsable: Y\n   ✓ Validación: Z"
    const lines = actionString.split('\n').map(l => l.trim());
    const mainAction = lines[0];
    
    let timeline = 'Por definir';
    let responsible = 'RRHH';
    
    lines.forEach(line => {
      if (line.includes('Plazo:')) {
        timeline = line.split('Plazo:')[1]?.trim() || timeline;
      }
      if (line.includes('Responsable:')) {
        responsible = line.split('Responsable:')[1]?.trim() || responsible;
      }
    });
    
    return { mainAction, timeline, responsible };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        relative overflow-hidden
        bg-slate-900/60
        backdrop-blur-sm
        border ${config.borderColor}
        ${config.glowColor}
        rounded-xl
        ${className}
      `}
    >
      {/* Gradiente de fondo muy sutil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50 pointer-events-none`} />

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header - Similar a CampaignRhythmPanel */}
        <div className="p-6 border-b border-slate-700/30">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Título + Metadata */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
                  {businessCase.severity.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-400/30">
                  Confianza: {businessCase.confidenceLevel}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                {businessCase.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(businessCase.createdAt).toLocaleDateString('es-CL', { 
                    day: '2-digit', 
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Right: KPI Principal */}
            <div className="flex-shrink-0 text-right">
              <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Pérdida Potencial</p>
                <p className={`text-3xl md:text-4xl font-bold ${config.textColor}`}>
                  {formatCurrency(businessCase.financials.potentialAnnualLoss)}
                </p>
                <p className="text-xs text-slate-500 mt-1">CLP/año</p>
              </div>
            </div>
          </div>
        </div>

      {/* Secciones Collapsibles */}
      <div className="p-6 space-y-4">
        
        {/* SECCIÓN: Problema Detectado */}
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('problema')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-semibold text-white">Problema Detectado</h4>
                <p className="text-xs text-slate-400">Análisis del caso</p>
              </div>
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
                <div className="px-4 pb-4 border-t border-slate-700/30">
                  <p className="text-sm text-slate-300 leading-relaxed mt-4">
                    {businessCase.problemDescription}
                  </p>
                  
                  {/* CORRECCIÓN 2: Sección scores ELIMINADA - distrae en alertas críticas */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECCIÓN: Impacto Financiero */}
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('impacto')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-semibold text-white">Impacto Financiero</h4>
                <p className="text-xs text-slate-400">Valorización ROI</p>
              </div>
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
                <div className="px-4 pb-4 border-t border-slate-700/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-4">
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-center">
                      <p className="text-xs text-slate-500 mb-1">Costo Actual</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(businessCase.financials.currentAnnualCost)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-red-500/20 text-center">
                      <p className="text-xs text-slate-500 mb-1">Pérdida Potencial</p>
                      <p className="text-lg font-semibold text-red-400">
                        {formatCurrency(businessCase.financials.potentialAnnualLoss)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20 text-center">
                      <p className="text-xs text-slate-500 mb-1">Inversión</p>
                      <p className="text-lg font-semibold text-cyan-400">
                        {formatCurrency(businessCase.financials.recommendedInvestment)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-green-500/20 text-center">
                      <p className="text-xs text-slate-500 mb-1">ROI</p>
                      <p className="text-lg font-semibold text-green-400">
                        {formatROI(businessCase.financials.estimatedROI)}
                      </p>
                    </div>
                  </div>

                  {/* Fuentes */}
                  {businessCase.financials.methodologySources && businessCase.financials.methodologySources.length > 0 && (
                    <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                      <p className="text-xs text-blue-400 font-medium mb-1">📚 Fuentes Metodológicas</p>
                      <p className="text-xs text-slate-300">
                        {businessCase.financials.methodologySources.join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECCIÓN: Plan de Acción */}
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('plan')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* CAMBIO 2: orange → cyan */}
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-semibold text-white">Plan de Acción</h4>
                <p className="text-xs text-slate-400">Intervención recomendada</p>
              </div>
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
                <div className="px-4 pb-4 border-t border-slate-700/30 space-y-3 mt-4">
                  {businessCase.recommendedActions.map((actionString, idx) => {
                    const { mainAction, timeline, responsible } = parseAction(actionString);
                    
                    return (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                          <span className="text-sm font-semibold text-cyan-400">{idx + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-white font-medium leading-relaxed">
                            {mainAction}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded">
                              <Calendar className="h-3 w-3" />
                              {timeline}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded">
                              <Users className="h-3 w-3" />
                              {responsible}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* CAMBIO 3: Timeline amber → slate */}
                  <div className="p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                    <p className="text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Timeline Sugerido
                    </p>
                    <p className="text-sm text-slate-300">{businessCase.suggestedTimeline}</p>
                  </div>

                  {/* Métricas */}
                  {businessCase.successMetrics && businessCase.successMetrics.length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                      <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        Métricas de Éxito
                      </p>
                      <ul className="space-y-1.5">
                        {businessCase.successMetrics.map((metric, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer CTA - CAMBIO 4: Usar PrimaryButton del sistema FocalizaHR */}
      <div className="p-6 bg-slate-900/30 border-t border-slate-700/30">
        <PrimaryButton
          onClick={() => onActionClick?.('schedule_meeting')}
          icon={Play}
          fullWidth
          size="lg"
        >
          INICIAR PROTOCOLO DE SOLUCIÓN
        </PrimaryButton>
        <p className="text-center text-xs text-slate-500 mt-3">
          Acción temprana = Mayor probabilidad de éxito
        </p>
      </div>
      </div>
    </motion.div>
  );
};