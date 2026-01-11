'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// VEREDICT CARD v2 - EXIT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: src/components/exit/VeredictCard.tsx
// Versión: 2.0
// Fecha: Enero 2025
// Cambios v2: Recibe factors[], muestra Top 3, cita científica, colapsable
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  Users,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

import {
  VERDICT_NARRATIVES,
  QUADRANT_CONFIG,
  getVerdictType,
  getFactorConfig,
  formatPercentage,
  type VerdictType
} from '@/config/exitRootCausesConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface FactorData {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
  estimatedCost?: number;
}

interface VeredictCardProps {
  factors: FactorData[];
  totalExits: number;
  periodLabel?: string;
  onInvestigate?: () => void;
  isLoading?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Barra de progreso visual para el porcentaje de consenso
 */
const ConsensusBar = memo(function ConsensusBar({ 
  percentage, 
  color 
}: { 
  percentage: number; 
  color: string;
}) {
  return (
    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
});

/**
 * Indicador de severidad compacto
 */
const SeverityIndicator = memo(function SeverityIndicator({ 
  severity 
}: { 
  severity: number;
}) {
  const getLabel = (sev: number) => {
    if (sev <= 2) return { text: 'EXTREMO', color: '#EF4444' };
    if (sev <= 3) return { text: 'ALTO', color: '#F59E0B' };
    if (sev <= 4) return { text: 'MEDIO', color: '#22D3EE' };
    return { text: 'BAJO', color: '#10B981' };
  };
  
  const { text, color } = getLabel(severity);
  
  return (
    <span 
      className="text-xs font-medium px-2 py-0.5 rounded"
      style={{ 
        color,
        background: `${color}15`,
        border: `1px solid ${color}30`
      }}
    >
      {severity.toFixed(1)}/5.0 ({text})
    </span>
  );
});

/**
 * Cita científica con fuente
 */
const ScientificQuote = memo(function ScientificQuote({
  quote,
  source,
  factorName
}: {
  quote: string;
  source: string;
  factorName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            "{quote}"
          </p>
          <p className="text-xs text-cyan-400 font-medium">
            — {source}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Factor secundario en lista colapsable
 */
const SecondaryFactor = memo(function SecondaryFactor({
  factor,
  totalExits,
  index
}: {
  factor: FactorData;
  totalExits: number;
  index: number;
}) {
  const factorConfig = getFactorConfig(factor.factor);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/30"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-slate-500 font-medium">#{index + 2}</span>
        <span className="text-sm text-slate-300 truncate">
          {factor.factor}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-slate-400">
          {factor.mentions} de {totalExits}
        </span>
        <SeverityIndicator severity={factor.avgSeverity} />
      </div>
    </motion.div>
  );
});

/**
 * Loading skeleton
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 w-48 bg-slate-700/50 rounded" />
      <div className="h-4 w-64 bg-slate-700/30 rounded" />
      <div className="h-16 w-full bg-slate-700/20 rounded-xl" />
      <div className="h-20 w-full bg-slate-700/20 rounded-xl" />
    </div>
  );
});

/**
 * Empty state
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
      <p className="text-slate-400 font-light">
        Sin datos suficientes para análisis
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Se requieren encuestas completadas
      </p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function VeredictCard({
  factors,
  totalExits,
  periodLabel = 'Global',
  onInvestigate,
  isLoading = false,
  className = ''
}: VeredictCardProps) {
  
  // Estado colapsable
  const [showMore, setShowMore] = useState(false);
  
  // Factor principal (Top 1)
  const topFactor = factors.length > 0 ? factors[0] : null;
  
  // Factores secundarios (Top 2 y 3)
  const nextFactors = factors.slice(1, 3);
  
  // Determinar tipo de veredicto
  const verdictType = useMemo((): VerdictType => {
    if (!topFactor) return 'no_pattern';
    return getVerdictType(
      topFactor.mentionRate,
      topFactor.avgSeverity,
      totalExits
    );
  }, [topFactor, totalExits]);
  
  // Obtener configuración
  const verdictConfig = VERDICT_NARRATIVES[verdictType];
  const factorConfig = topFactor ? getFactorConfig(topFactor.factor) : null;
  
  // Color principal basado en cuadrante
  const primaryColor = useMemo(() => {
    if (!topFactor) return QUADRANT_CONFIG.observe.color;
    
    const isHighFreq = topFactor.mentionRate >= 0.25;
    const isHighSev = topFactor.avgSeverity <= 2.5;
    
    if (isHighFreq && isHighSev) return QUADRANT_CONFIG.critical.color;
    if (!isHighFreq && isHighSev) return QUADRANT_CONFIG.investigate.color;
    if (isHighFreq && !isHighSev) return QUADRANT_CONFIG.monitor.color;
    return QUADRANT_CONFIG.observe.color;
  }, [topFactor]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }
  
  if (!topFactor || totalExits < 1) {
    return (
      <div className={`${className}`}>
        <EmptyState />
      </div>
    );
  }
  
  // Obtener mensaje del veredicto
  const VerdictIcon = verdictConfig.icon;
  const message = verdictConfig.getMainMessage(
    topFactor.mentions,
    totalExits,
    topFactor.factor, // Nombre completo
    topFactor.avgSeverity
  );
  
  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER: Tipo de veredicto
         ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}30`
            }}
          >
            <VerdictIcon className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">
              {verdictConfig.title}
            </h3>
            <p className="text-xs text-slate-400 font-light">
              {verdictConfig.subtitle}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-slate-500">
            <Users className="w-3 h-3 inline mr-1" />
            {totalExits} salidas • {periodLabel}
          </p>
        </div>
      </div>
      
      {/* ════════════════════════════════════════════════════════════════════
          FACTOR PRINCIPAL
         ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="p-5 rounded-2xl text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`,
          border: `1px solid ${primaryColor}25`
        }}
      >
        {/* Mensaje principal */}
        <p className="text-slate-300 font-light text-base mb-1">
          {message.prefix}
        </p>
        
        {/* Nombre del factor - COMPLETO */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="my-4"
        >
          <span 
            className="text-2xl sm:text-3xl font-light tracking-wide"
            style={{ color: primaryColor }}
          >
            {topFactor.factor}
          </span>
        </motion.div>
        
        {/* Métricas */}
        <div className="flex items-center justify-center gap-4 text-sm mb-4">
          <span className="text-slate-400">
            <span className="font-medium" style={{ color: primaryColor }}>
              {formatPercentage(topFactor.mentionRate)}
            </span>
            {' '}menciones
          </span>
          <span className="text-slate-600">•</span>
          <SeverityIndicator severity={topFactor.avgSeverity} />
        </div>
        
        {/* Barra de consenso */}
        <div className="max-w-xs mx-auto">
          <ConsensusBar percentage={topFactor.mentionRate} color={primaryColor} />
        </div>
      </motion.div>
      
      {/* ════════════════════════════════════════════════════════════════════
          CITA CIENTÍFICA
         ════════════════════════════════════════════════════════════════════ */}
      <ScientificQuote
        quote={verdictConfig.scientificBacking.quote}
        source={verdictConfig.scientificBacking.source}
        factorName={topFactor.factor}
      />
      
      {/* ════════════════════════════════════════════════════════════════════
          SIGUIENTES FACTORES (Colapsable)
         ════════════════════════════════════════════════════════════════════ */}
      {nextFactors.length > 0 && (
        <div className="border-t border-slate-700/30 pt-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
          >
            <span className="text-sm text-slate-400 font-light">
              También mencionaron ({nextFactors.length} factores más)
            </span>
            {showMore ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-3">
                  {nextFactors.map((factor, idx) => (
                    <SecondaryFactor
                      key={factor.factor}
                      factor={factor}
                      totalExits={totalExits}
                      index={idx}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});