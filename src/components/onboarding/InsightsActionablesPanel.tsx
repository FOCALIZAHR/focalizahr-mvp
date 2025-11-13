'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Lightbulb, 
  ArrowRight,
  TrendingDown,
  Users,
  Calendar
} from 'lucide-react';

// ============================================
// TYPES - Según backend docs
// ============================================
interface TopIssue {
  issue: string;
  count: number;
}

interface Insights {
  topIssues: TopIssue[];
  recommendations: string[];
}

interface InsightsActionablesPanelProps {
  insights: Insights;
}

// ============================================
// COMPONENT
// ============================================
export const InsightsActionablesPanel = memo(function InsightsActionablesPanel({ 
  insights 
}: InsightsActionablesPanelProps) {
  
  const { topIssues = [], recommendations = [] } = insights;

  // Mapeo de issues a configuración visual
  const getIssueConfig = (issue: string) => {
    // Detección de severidad basada en el nombre del issue
    const isLowScore = issue.includes('low_') || issue.includes('bajo');
    const isCritical = issue.includes('critical') || issue.includes('critico');
    
    if (isCritical) {
      return {
        color: '#EF4444',
        bgColor: 'from-red-500/10 to-transparent',
        borderColor: 'border-red-500/20',
        icon: AlertCircle,
        severity: 'CRÍTICO'
      };
    } else if (isLowScore) {
      return {
        color: '#F59E0B',
        bgColor: 'from-amber-500/10 to-transparent',
        borderColor: 'border-amber-500/20',
        icon: TrendingDown,
        severity: 'MEDIO'
      };
    } else {
      return {
        color: '#3B82F6',
        bgColor: 'from-blue-500/10 to-transparent',
        borderColor: 'border-blue-500/20',
        icon: Users,
        severity: 'BAJO'
      };
    }
  };

  // Parsear prioridad de recommendation
  const getRecommendationPriority = (rec: string): 'Alta' | 'Media' | 'Baja' => {
    if (rec.toLowerCase().includes('prioridad alta') || rec.toLowerCase().includes('crítico')) {
      return 'Alta';
    } else if (rec.toLowerCase().includes('prioridad media')) {
      return 'Media';
    }
    return 'Baja';
  };

  const PRIORITY_CONFIG = {
    'Alta': {
      color: '#EF4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    'Media': {
      color: '#F59E0B',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    'Baja': {
      color: '#3B82F6',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    }
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* COLUMNA IZQUIERDA: PROBLEMAS DETECTADOS */}
      <div className="fhr-card">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="text-xl font-light text-white">
            Problemas Detectados
          </h3>
          {topIssues.length > 0 && (
            <span className="ml-auto text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-700/50">
              {topIssues.length}
            </span>
          )}
        </div>

        {topIssues.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
              <AlertCircle className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm text-slate-400 font-light">
              No hay problemas críticos detectados
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topIssues.map((issue, index) => {
              const config = getIssueConfig(issue.issue);
              const Icon = config.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`p-4 rounded-lg bg-gradient-to-r ${config.bgColor} border ${config.borderColor} hover:border-opacity-50 transition-all duration-300`}
                >
                  <div className="flex items-start gap-3">
                    {/* ICON */}
                    <div 
                      className="flex-shrink-0 p-2 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon 
                        className="h-4 w-4" 
                        style={{ color: config.color }}
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0">
                      {/* ISSUE + SEVERITY */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">
                          {issue.issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide"
                          style={{ 
                            color: config.color,
                            backgroundColor: `${config.color}20`
                          }}
                        >
                          {config.severity}
                        </span>
                      </div>

                      {/* COUNT */}
                      {issue.count > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          <span>
                            {issue.count} caso{issue.count !== 1 ? 's' : ''} detectado{issue.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: RECOMENDACIONES */}
      <div className="fhr-card">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="h-5 w-5 text-cyan-400" />
          <h3 className="text-xl font-light text-white">
            Acciones Recomendadas
          </h3>
          {recommendations.length > 0 && (
            <span className="ml-auto text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-700/50">
              {recommendations.length}
            </span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-3">
              <Lightbulb className="h-6 w-6 text-cyan-400" />
            </div>
            <p className="text-sm text-slate-400 font-light">
              Sistema analizando patrones...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const priority = getRecommendationPriority(rec);
              const config = PRIORITY_CONFIG[priority];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`group p-4 rounded-lg border ${config.borderColor} hover:border-cyan-400/50 transition-all duration-300 cursor-pointer ${config.bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    {/* PRIORITY BADGE */}
                    <div 
                      className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wide"
                      style={{ 
                        color: config.color,
                        backgroundColor: `${config.color}20`,
                        borderLeft: `2px solid ${config.color}`
                      }}
                    >
                      {priority}
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-2 leading-relaxed">
                        {rec}
                      </p>

                      {/* IMPACT INDICATOR */}
                      <div className="flex items-start gap-2">
                        <ArrowRight className="h-3 w-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Impacto esperado en experiencia onboarding
                        </p>
                      </div>
                    </div>

                    {/* HOVER INDICATOR */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});

InsightsActionablesPanel.displayName = 'InsightsActionablesPanel';