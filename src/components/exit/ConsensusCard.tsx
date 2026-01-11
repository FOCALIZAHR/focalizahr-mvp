'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSENSUS CARD - EXIT INTELLIGENCE PATTERN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: src/components/exit/ConsensusCard.tsx
// Versión: 1.0
// Fecha: Enero 2025
// Propósito: Componente que muestra el patrón emergente de factores de salida
//            con visualización humanizada (X de Y eligieron) y costos estimados
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  Info
} from 'lucide-react';

import {
  QUADRANT_CONFIG,
  getQuadrant,
  getFactorConfig,
  formatPercentage,
  formatCLP,
  generateFactorInsights,
  type QuadrantId
} from '@/config/exitRootCausesConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FactorData {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
  estimatedCost?: number;
}

interface ConsensusCardProps {
  factors: FactorData[];
  totalExits: number;
  avgSalaryCLP?: number;
  maxFactorsVisible?: number;
  onFactorClick?: (factor: string) => void;
  isLoading?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Barra de frecuencia horizontal
 */
const FrequencyBar = memo(function FrequencyBar({
  percentage,
  color
}: {
  percentage: number;
  color: string;
}) {
  return (
    <div className="flex-1 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage * 100, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ 
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />
    </div>
  );
});

/**
 * Badge de severidad compacto
 */
const SeverityBadge = memo(function SeverityBadge({
  severity
}: {
  severity: number;
}) {
  const getConfig = (sev: number) => {
    if (sev <= 2.0) return { label: 'CRÍTICO', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (sev <= 2.5) return { label: 'GRAVE', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (sev <= 3.5) return { label: 'MODERADO', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.15)' };
    return { label: 'LEVE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  };
  
  const config = getConfig(severity);
  
  return (
    <span 
      className="px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ 
        color: config.color, 
        background: config.bg,
        border: `1px solid ${config.color}30`
      }}
    >
      {severity.toFixed(1)} {config.label}
    </span>
  );
});

/**
 * Badge de cuadrante/acción
 */
const QuadrantBadge = memo(function QuadrantBadge({
  quadrant
}: {
  quadrant: QuadrantId;
}) {
  const config = QUADRANT_CONFIG[quadrant];
  const Icon = config.icon;
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ 
        color: config.color,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`
      }}
    >
      <Icon className="w-3 h-3" />
      {config.labelShort}
    </span>
  );
});

/**
 * Fila individual de factor
 */
const FactorRow = memo(function FactorRow({
  factor,
  index,
  totalExits,
  onClick,
  isExpanded,
  onToggle
}: {
  factor: FactorData;
  index: number;
  totalExits: number;
  onClick?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const factorConfig = getFactorConfig(factor.factor);
  const quadrant = getQuadrant(factor.mentionRate, factor.avgSeverity);
  const quadrantConfig = QUADRANT_CONFIG[quadrant];
  const Icon = factorConfig.icon;
  
  // Generar insights para este factor
  const insights = useMemo(() => 
    generateFactorInsights(
      factor.factor,
      factor.mentionRate,
      factor.avgSeverity,
      factor.mentions,
      quadrant
    ),
    [factor, quadrant]
  );
  
  // Determinar si es señal temprana (pocos pero muy grave)
  const isEarlySignal = factor.mentions <= 2 && factor.avgSeverity <= 2.0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`
        p-4 rounded-xl transition-all duration-300 cursor-pointer
        ${isEarlySignal 
          ? 'bg-yellow-500/5 border border-yellow-500/20' 
          : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50'
        }
      `}
      onClick={onToggle}
    >
      {/* Señal temprana badge */}
      {isEarlySignal && (
        <div className="flex items-center gap-1.5 mb-2 text-yellow-500">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px] font-medium">SEÑAL TEMPRANA</span>
        </div>
      )}
      
      {/* Header del factor */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icono del factor */}
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ 
              background: `${quadrantConfig.color}15`,
              border: `1px solid ${quadrantConfig.color}30`
            }}
          >
            <Icon className="w-4 h-4" style={{ color: quadrantConfig.color }} />
          </div>
          
          {/* Nombre y menciones */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-200 truncate">
                {factorConfig.label}
              </span>
              <QuadrantBadge quadrant={quadrant} />
            </div>
            
            {/* Frecuencia simple */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {factor.mentions} de {totalExits} mencionaron
              </span>
              <span className="text-xs font-medium" style={{ color: quadrantConfig.color }}>
                {formatPercentage(factor.mentionRate)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Toggle */}
        <button 
          className="p-1 rounded hover:bg-slate-700/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded 
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </button>
      </div>
      
      {/* Barra de frecuencia y severidad */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 w-16">Frecuencia</span>
          <FrequencyBar percentage={factor.mentionRate} color={quadrantConfig.color} />
          <span className="text-xs font-medium" style={{ color: quadrantConfig.color }}>
            {formatPercentage(factor.mentionRate)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 w-16">Severidad</span>
          <div className="flex-1">
            <SeverityBadge severity={factor.avgSeverity} />
          </div>
        </div>
        
        {/* Costo estimado */}
        {factor.estimatedCost && factor.estimatedCost > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 w-16">Costo est.</span>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">
                ~{formatCLP(factor.estimatedCost)} en rotación atribuible
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-slate-700/30 space-y-3">
              {/* Narrativa del factor */}
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  {factorConfig.narrativeWhenTop}
                </p>
              </div>
              
              {/* Insights generados */}
              {insights.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Insights
                  </span>
                  {insights.slice(0, 2).map((insight, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span>{insight.icon}</span>
                      <span className={`
                        ${insight.type === 'warning' ? 'text-amber-400' : ''}
                        ${insight.type === 'insight' ? 'text-cyan-400' : ''}
                        ${insight.type === 'info' ? 'text-slate-400' : ''}
                        ${insight.type === 'neutral' ? 'text-slate-500' : ''}
                      `}>
                        {insight.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Acción recomendada */}
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: quadrantConfig.bgColor }}>
                <quadrantConfig.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: quadrantConfig.color }} />
                <div>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: quadrantConfig.color }}>
                    Acción recomendada
                  </span>
                  <p className="text-xs text-slate-300 mt-1">
                    {factorConfig.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

/**
 * Loading skeleton
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-700/50 rounded" />
              <div className="h-3 w-48 bg-slate-700/30 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Estado vacío
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-8">
      <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-light text-sm">
        Sin factores de salida registrados
      </p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function ConsensusCard({
  factors,
  totalExits,
  avgSalaryCLP = 1_600_000,
  maxFactorsVisible = 5,
  onFactorClick,
  isLoading = false,
  className = ''
}: ConsensusCardProps) {
  
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Ordenar factores por menciones
  const sortedFactors = useMemo(() => 
    [...factors].sort((a, b) => b.mentions - a.mentions),
    [factors]
  );
  
  // Factores visibles
  const visibleFactors = useMemo(() => 
    showAll ? sortedFactors : sortedFactors.slice(0, maxFactorsVisible),
    [sortedFactors, showAll, maxFactorsVisible]
  );
  
  // Calcular costo total estimado
  const totalEstimatedCost = useMemo(() => 
    factors.reduce((sum, f) => sum + (f.estimatedCost || 0), 0),
    [factors]
  );
  
  const handleToggle = useCallback((index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  }, []);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div className={`fhr-card relative overflow-hidden ${className}`}>
      {/* Tesla line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #A78BFA 70%, transparent 100%)'
        }}
      />
      <div 
        className="absolute top-[2px] left-0 right-0 h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.06) 0%, transparent 100%)'
        }}
      />
      
      <div className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-light text-white">
              Patrón Detectado
            </h3>
            <p className="text-xs text-slate-400 font-light mt-1">
              Factores señalados por quienes se fueron
            </p>
          </div>
          
          {totalEstimatedCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Costo total estimado</p>
              <p className="text-sm font-medium text-amber-400">
                {formatCLP(totalEstimatedCost)}
              </p>
            </div>
          )}
        </div>
        
        {/* Leyenda */}
        <div className="flex items-center gap-4 p-2 rounded-lg bg-slate-800/30 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500/30 border border-cyan-500/50" />
            <span className="text-slate-400">= 1 persona que ELIGIÓ señalar este factor</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Info className="w-3 h-3" />
            <span>Click para expandir</span>
          </div>
        </div>
        
        {/* Lista de factores */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : factors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {visibleFactors.map((factor, index) => (
              <FactorRow
                key={factor.factor}
                factor={factor}
                index={index}
                totalExits={totalExits}
                onClick={onFactorClick ? () => onFactorClick(factor.factor) : undefined}
                isExpanded={expandedIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>
        )}
        
        {/* Ver más/menos */}
        {sortedFactors.length > maxFactorsVisible && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Ver {sortedFactors.length - maxFactorsVisible} más
              </>
            )}
          </button>
        )}
        
        {/* Footer metodológico */}
        <div className="pt-3 border-t border-slate-700/30">
          <p className="text-[10px] text-slate-500 font-light">
            💡 Los factores fueron elegidos libremente por cada persona (multi-select de 13 opciones). 
            La coincidencia independiente indica patrón sistémico.
          </p>
        </div>
      </div>
    </div>
  );
});