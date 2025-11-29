// ====================================================================
// BENCHMARK INSIGHTS PANEL - INSIGHTS ACCIONABLES
// src/components/onboarding/BenchmarkInsightsPanel.tsx
// 💡 Panel con insights priorizados del benchmark competitivo
// ====================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useOnboardingBenchmark } from '@/hooks/useOnboardingBenchmark';
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  TrendingUp,
  Award,
  Target,
  AlertCircle
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface BenchmarkInsightsPanelProps {
  departmentId: string;
  country?: string;
}

interface InsightItem {
  type: 'positive' | 'neutral' | 'improvement';
  title: string;
  description: string;
  priority: number;
}

// ============================================
// CONSTANTS
// ============================================
const INSIGHT_CONFIG = {
  positive: {
    icon: CheckCircle2,
    bgColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    iconColor: '#10B981',
    badgeColor: 'bg-green-400/10 text-green-400 border-green-400/30'
  },
  neutral: {
    icon: Info,
    bgColor: 'rgba(34, 211, 238, 0.05)',
    borderColor: 'rgba(34, 211, 238, 0.2)',
    iconColor: '#22D3EE',
    badgeColor: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30'
  },
  improvement: {
    icon: AlertTriangle,
    bgColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    iconColor: '#F59E0B',
    badgeColor: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
  }
};

// ============================================
// ANIMATIONS
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// ============================================
// LOADING STATE
// ============================================
const LoadingState = memo(function LoadingState() {
  return (
    <div className="fhr-card p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-slate-700 rounded"></div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-slate-700 rounded"></div>
      ))}
    </div>
  );
});

// ============================================
// ERROR STATE
// ============================================
const ErrorState = memo(function ErrorState({ message }: { message: string }) {
  return (
    <div className="fhr-card p-6 border-l-4 border-l-red-500">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 mt-1" />
        <div>
          <p className="text-red-400 font-semibold mb-1">Error al cargar insights</p>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = memo(function EmptyState() {
  return (
    <div className="fhr-card p-8 text-center">
      <Info className="h-12 w-12 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 mb-2">No hay insights disponibles</p>
      <p className="text-xs text-slate-500">
        Se generarán insights cuando haya suficientes datos de benchmark
      </p>
    </div>
  );
});

// ============================================
// INSIGHT CARD
// ============================================
const InsightCard = memo(function InsightCard({ 
  insight 
}: { 
  insight: InsightItem 
}) {
  const config = INSIGHT_CONFIG[insight.type];
  const Icon = config.icon;
  
  // Determinar icono adicional según prioridad
  const PriorityIcon = insight.priority >= 9 ? Award : 
                       insight.priority >= 7 ? TrendingUp : 
                       Target;
  
  return (
    <motion.div
      variants={itemVariants}
      className="p-4 rounded-lg border transition-all hover:shadow-lg"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon principal */}
        <div 
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${config.iconColor}20` }}
        >
          <Icon 
            className="h-5 w-5"
            style={{ color: config.iconColor }}
          />
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header con título y prioridad */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-white leading-tight">
              {insight.title}
            </h4>
            
            {/* Badge prioridad */}
            {insight.priority >= 8 && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${config.badgeColor}`}>
                <PriorityIcon className="h-3 w-3" />
                {insight.priority >= 9 ? 'Alta' : 'Media'}
              </div>
            )}
          </div>
          
          {/* Descripción */}
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            {insight.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const BenchmarkInsightsPanel = memo(function BenchmarkInsightsPanel({
  departmentId,
  country = 'CL'
}: BenchmarkInsightsPanelProps) {
  
  // ========================================
  // FETCH DATA
  // ========================================
  const { data, loading, error } = useOnboardingBenchmark(departmentId, country);
  
  // ========================================
  // SORT INSIGHTS BY PRIORITY
  // ========================================
  const sortedInsights = useMemo(() => {
    if (!data?.insights) return [];
    return [...data.insights].sort((a, b) => b.priority - a.priority);
  }, [data]);
  
  // ========================================
  // STATISTICS
  // ========================================
  const insightStats = useMemo(() => {
    if (!sortedInsights.length) return null;
    
    const positive = sortedInsights.filter(i => i.type === 'positive').length;
    const improvement = sortedInsights.filter(i => i.type === 'improvement').length;
    const neutral = sortedInsights.filter(i => i.type === 'neutral').length;
    
    return { positive, improvement, neutral, total: sortedInsights.length };
  }, [sortedInsights]);
  
  // ========================================
  // RENDER STATES
  // ========================================
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data || sortedInsights.length === 0) return <EmptyState />;
  
  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <motion.div 
      className="fhr-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-light text-white">
            Insights Competitivos
          </h3>
          
          {/* Badge total insights */}
          {insightStats && (
            <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
              {insightStats.total} insight{insightStats.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <p className="text-sm text-slate-400 font-light">
          Análisis comparativo de tu desempeño vs mercado
        </p>
        
        {/* Stats mini badges */}
        {insightStats && (
          <div className="flex items-center gap-2 mt-3">
            {insightStats.positive > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-400/10 border border-green-400/30">
                <CheckCircle2 className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">{insightStats.positive}</span>
              </div>
            )}
            {insightStats.improvement > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">{insightStats.improvement}</span>
              </div>
            )}
            {insightStats.neutral > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30">
                <Info className="h-3 w-3 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">{insightStats.neutral}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* INSIGHTS LIST */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sortedInsights.map((insight, index) => (
          <InsightCard 
            key={index} 
            insight={insight}
          />
        ))}
      </motion.div>
      
      {/* FOOTER - CONTEXT */}
      <div className="mt-6 pt-5 border-t border-slate-700/50">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
          <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Los insights se generan automáticamente comparando tu departamento 
              <span className="font-medium text-slate-300"> {data.department.category}</span> con 
              <span className="font-medium text-slate-300"> {data.benchmark.sampleSize} departamentos</span> similares 
              en <span className="font-medium text-slate-300">{data.benchmark.country}</span>.
            </p>
          </div>
        </div>
      </div>
      
      {/* LAST UPDATED */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600 font-light">
          Actualizado {new Date(data.benchmark.lastUpdated).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  );
});

export default BenchmarkInsightsPanel;