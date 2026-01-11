'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY MATRIX CARD - EXIT INTELLIGENCE VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: src/components/exit/PriorityMatrixCard.tsx
// Versión: 1.0
// Fecha: Enero 2025
// Propósito: Matriz visual 2×2 de priorización (Severidad × Frecuencia) con
//            bubbles que muestran factores y costos estimados en CLP
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info,
  Zap,
  Search,
  Activity,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';

import {
  QUADRANT_CONFIG,
  METHODOLOGY_SOURCES,
  CLASSIFICATION_THRESHOLDS,
  getQuadrant,
  getFactorConfig,
  formatPercentage,
  formatCLP,
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

interface PriorityMatrixCardProps {
  factors: FactorData[];
  totalExits: number;
  onFactorClick?: (factor: string, quadrant: QuadrantId) => void;
  isLoading?: boolean;
  className?: string;
}

interface BubbleData extends FactorData {
  quadrant: QuadrantId;
  x: number; // 0-100 position
  y: number; // 0-100 position
  size: number; // bubble size
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const MATRIX_PADDING = 12; // % padding from edges
const MIN_BUBBLE_SIZE = 32;
const MAX_BUBBLE_SIZE = 64;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Leyenda de cuadrantes
 */
const QuadrantLegend = memo(function QuadrantLegend() {
  const quadrants = [
    { id: 'critical' as const, position: 'top-right' },
    { id: 'investigate' as const, position: 'top-left' },
    { id: 'monitor' as const, position: 'bottom-right' },
    { id: 'observe' as const, position: 'bottom-left' }
  ];
  
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {quadrants.map(({ id }) => {
        const config = QUADRANT_CONFIG[id];
        const Icon = config.icon;
        
        return (
          <div 
            key={id}
            className="flex items-center gap-2 p-2 rounded-lg text-xs"
            style={{ background: config.bgColor }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
            <div>
              <span className="font-medium" style={{ color: config.color }}>
                {config.label}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {config.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Tooltip para bubble
 */
const BubbleTooltip = memo(function BubbleTooltip({
  bubble,
  onClose,
  onAction
}: {
  bubble: BubbleData;
  onClose: () => void;
  onAction?: () => void;
}) {
  const factorConfig = getFactorConfig(bubble.factor);
  const quadrantConfig = QUADRANT_CONFIG[bubble.quadrant];
  const Icon = quadrantConfig.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50 w-64 p-4 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded hover:bg-slate-700/50 transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ 
            background: quadrantConfig.bgColor,
            border: `1px solid ${quadrantConfig.borderColor}`
          }}
        >
          <Icon className="w-4 h-4" style={{ color: quadrantConfig.color }} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">
            {factorConfig.labelShort}
          </p>
          <p className="text-[10px]" style={{ color: quadrantConfig.color }}>
            {quadrantConfig.label}
          </p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Menciones</span>
          <span className="text-slate-200">{bubble.mentions} ({formatPercentage(bubble.mentionRate)})</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Severidad</span>
          <span className="text-slate-200">{bubble.avgSeverity.toFixed(1)}/5.0</span>
        </div>
        {bubble.estimatedCost && bubble.estimatedCost > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Costo estimado</span>
            <span className="text-amber-400 font-medium">{formatCLP(bubble.estimatedCost)}</span>
          </div>
        )}
      </div>
      
      {/* Narrative */}
      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        {quadrantConfig.narrative.interpretation}
      </p>
      
      {/* Action */}
      {onAction && (
        <button
          onClick={onAction}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          style={{ 
            background: quadrantConfig.bgColor,
            color: quadrantConfig.color,
            border: `1px solid ${quadrantConfig.borderColor}`
          }}
        >
          {quadrantConfig.narrative.action}
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
});

/**
 * Bubble individual en la matriz
 */
const MatrixBubble = memo(function MatrixBubble({
  bubble,
  isSelected,
  onClick
}: {
  bubble: BubbleData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const factorConfig = getFactorConfig(bubble.factor);
  const quadrantConfig = QUADRANT_CONFIG[bubble.quadrant];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: isSelected ? 1.15 : 1,
        zIndex: isSelected ? 20 : 10
      }}
      transition={{ 
        duration: 0.4, 
        delay: Math.random() * 0.3,
        type: 'spring',
        stiffness: 200
      }}
      whileHover={{ scale: 1.1, zIndex: 15 }}
      onClick={onClick}
      className="absolute cursor-pointer"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Bubble container */}
      <div
        className="rounded-full flex flex-col items-center justify-center transition-shadow duration-300"
        style={{
          width: bubble.size,
          height: bubble.size,
          background: `radial-gradient(circle at 30% 30%, ${quadrantConfig.color}40, ${quadrantConfig.color}20)`,
          border: `2px solid ${quadrantConfig.color}`,
          boxShadow: isSelected 
            ? `0 0 20px ${quadrantConfig.color}50, 0 0 40px ${quadrantConfig.color}20`
            : `0 0 10px ${quadrantConfig.color}20`
        }}
      >
        {/* Factor label */}
        <span 
          className="text-[10px] font-medium text-center px-1 leading-tight"
          style={{ color: quadrantConfig.color }}
        >
          {factorConfig.labelShort.length > 10 
            ? factorConfig.labelShort.substring(0, 8) + '...'
            : factorConfig.labelShort
          }
        </span>
        
        {/* Cost if available */}
        {bubble.estimatedCost && bubble.estimatedCost > 0 && bubble.size >= 48 && (
          <span className="text-[9px] text-amber-400 font-medium">
            {formatCLP(bubble.estimatedCost)}
          </span>
        )}
      </div>
    </motion.div>
  );
});

/**
 * Área de la matriz con ejes y cuadrantes
 */
const MatrixArea = memo(function MatrixArea({
  bubbles,
  selectedBubble,
  onBubbleClick,
  onBubbleAction
}: {
  bubbles: BubbleData[];
  selectedBubble: string | null;
  onBubbleClick: (factor: string) => void;
  onBubbleAction?: (factor: string, quadrant: QuadrantId) => void;
}) {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-slate-900/50">
      {/* Cuadrantes de fondo */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* Top-Left: INVESTIGAR (Pocos + Grave) */}
        <div 
          className="border-r border-b border-slate-700/30"
          style={{ background: QUADRANT_CONFIG.investigate.bgColor }}
        >
          <div className="p-2">
            <span className="text-[10px] font-medium" style={{ color: QUADRANT_CONFIG.investigate.color }}>
              {QUADRANT_CONFIG.investigate.labelShort}
            </span>
          </div>
        </div>
        
        {/* Top-Right: ACTUAR (Muchos + Grave) */}
        <div 
          className="border-b border-slate-700/30"
          style={{ background: QUADRANT_CONFIG.critical.bgColor }}
        >
          <div className="p-2 text-right">
            <span className="text-[10px] font-medium" style={{ color: QUADRANT_CONFIG.critical.color }}>
              {QUADRANT_CONFIG.critical.labelShort}
            </span>
          </div>
        </div>
        
        {/* Bottom-Left: OBSERVAR (Pocos + Leve) */}
        <div 
          className="border-r border-slate-700/30"
          style={{ background: QUADRANT_CONFIG.observe.bgColor }}
        >
          <div className="p-2 flex items-end h-full">
            <span className="text-[10px] font-medium" style={{ color: QUADRANT_CONFIG.observe.color }}>
              {QUADRANT_CONFIG.observe.labelShort}
            </span>
          </div>
        </div>
        
        {/* Bottom-Right: MONITOREAR (Muchos + Leve) */}
        <div style={{ background: QUADRANT_CONFIG.monitor.bgColor }}>
          <div className="p-2 flex items-end justify-end h-full">
            <span className="text-[10px] font-medium" style={{ color: QUADRANT_CONFIG.monitor.color }}>
              {QUADRANT_CONFIG.monitor.labelShort}
            </span>
          </div>
        </div>
      </div>
      
      {/* Ejes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Línea vertical central */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-px"
          style={{ background: 'rgba(100, 116, 139, 0.3)' }}
        />
        {/* Línea horizontal central */}
        <div 
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ background: 'rgba(100, 116, 139, 0.3)' }}
        />
      </div>
      
      {/* Labels de ejes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Y-axis: Severidad */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
          <span className="text-[9px] text-slate-500 whitespace-nowrap">
            ← SEVERIDAD (grave → leve) →
          </span>
        </div>
        
        {/* X-axis: Frecuencia */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <span className="text-[9px] text-slate-500">
            ← FRECUENCIA (baja → alta) →
          </span>
        </div>
      </div>
      
      {/* Bubbles */}
      {bubbles.map((bubble) => (
        <MatrixBubble
          key={bubble.factor}
          bubble={bubble}
          isSelected={selectedBubble === bubble.factor}
          onClick={() => onBubbleClick(bubble.factor)}
        />
      ))}
      
      {/* Tooltip overlay */}
      <AnimatePresence>
        {selectedBubble && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 z-40"
              onClick={() => onBubbleClick('')}
            />
            
            {/* Tooltip */}
            {bubbles.find(b => b.factor === selectedBubble) && (
              <BubbleTooltip
                bubble={bubbles.find(b => b.factor === selectedBubble)!}
                onClose={() => onBubbleClick('')}
                onAction={onBubbleAction 
                  ? () => onBubbleAction(
                      selectedBubble, 
                      bubbles.find(b => b.factor === selectedBubble)!.quadrant
                    )
                  : undefined
                }
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Loading skeleton
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="aspect-square rounded-xl bg-slate-800/30" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-lg bg-slate-800/20" />
        ))}
      </div>
    </div>
  );
});

/**
 * Estado vacío
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="aspect-square rounded-xl bg-slate-800/20 flex items-center justify-center">
      <div className="text-center">
        <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-light text-sm">
          Sin datos para matriz
        </p>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function PriorityMatrixCard({
  factors,
  totalExits,
  onFactorClick,
  isLoading = false,
  className = ''
}: PriorityMatrixCardProps) {
  
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  
  // Calcular posiciones de bubbles en la matriz
  const bubbles = useMemo((): BubbleData[] => {
    if (factors.length === 0) return [];
    
    // Encontrar rangos para normalización
    const maxMentionRate = Math.max(...factors.map(f => f.mentionRate), 0.5);
    const minSeverity = Math.min(...factors.map(f => f.avgSeverity), 1);
    const maxSeverity = Math.max(...factors.map(f => f.avgSeverity), 5);
    const maxMentions = Math.max(...factors.map(f => f.mentions), 1);
    
    return factors.map(factor => {
      const quadrant = getQuadrant(factor.mentionRate, factor.avgSeverity);
      
      // X: Frecuencia (0 = izquierda/baja, 100 = derecha/alta)
      const normalizedFreq = factor.mentionRate / maxMentionRate;
      const x = MATRIX_PADDING + (normalizedFreq * (100 - 2 * MATRIX_PADDING));
      
      // Y: Severidad (0 = arriba/grave, 100 = abajo/leve)
      // Invertir porque 1 = muy grave (arriba) y 5 = leve (abajo)
      const normalizedSev = (factor.avgSeverity - minSeverity) / (maxSeverity - minSeverity);
      const y = MATRIX_PADDING + (normalizedSev * (100 - 2 * MATRIX_PADDING));
      
      // Tamaño basado en menciones
      const normalizedSize = factor.mentions / maxMentions;
      const size = MIN_BUBBLE_SIZE + (normalizedSize * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE));
      
      return {
        ...factor,
        quadrant,
        x,
        y,
        size
      };
    });
  }, [factors]);
  
  // Contar factores por cuadrante
  const quadrantCounts = useMemo(() => {
    const counts: Record<QuadrantId, number> = {
      critical: 0,
      investigate: 0,
      monitor: 0,
      observe: 0
    };
    
    bubbles.forEach(b => {
      counts[b.quadrant]++;
    });
    
    return counts;
  }, [bubbles]);
  
  const handleBubbleClick = (factor: string) => {
    setSelectedBubble(prev => prev === factor ? null : factor);
  };
  
  const handleBubbleAction = (factor: string, quadrant: QuadrantId) => {
    setSelectedBubble(null);
    onFactorClick?.(factor, quadrant);
  };
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div className={`fhr-card relative overflow-hidden ${className}`}>
      {/* Tesla line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #A78BFA 30%, #22D3EE 70%, transparent 100%)'
        }}
      />
      <div 
        className="absolute top-[2px] left-0 right-0 h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.06) 0%, transparent 100%)'
        }}
      />
      
      <div className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-light text-white">
              Matriz de Priorización
            </h3>
            <p className="text-xs text-slate-400 font-light mt-1">
              Severidad × Frecuencia — Click en bubble para detalle
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-2">
            {quadrantCounts.critical > 0 && (
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ 
                  color: QUADRANT_CONFIG.critical.color,
                  background: QUADRANT_CONFIG.critical.bgColor
                }}
              >
                {quadrantCounts.critical} urgente{quadrantCounts.critical > 1 ? 's' : ''}
              </span>
            )}
            {quadrantCounts.investigate > 0 && (
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ 
                  color: QUADRANT_CONFIG.investigate.color,
                  background: QUADRANT_CONFIG.investigate.bgColor
                }}
              >
                {quadrantCounts.investigate} investigar
              </span>
            )}
          </div>
        </div>
        
        {/* Matrix */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : factors.length === 0 ? (
          <EmptyState />
        ) : (
          <MatrixArea
            bubbles={bubbles}
            selectedBubble={selectedBubble}
            onBubbleClick={handleBubbleClick}
            onBubbleAction={onFactorClick ? handleBubbleAction : undefined}
          />
        )}
        
        {/* Leyenda */}
        <QuadrantLegend />
        
        {/* Footer metodológico */}
        <div className="pt-3 border-t border-slate-700/30 space-y-2">
          <div className="flex items-start gap-2 text-[10px] text-slate-500">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p className="font-light">
              <strong className="text-slate-400">Metodología:</strong> Costo rotación calculado como {' '}
              <span className="text-cyan-400">120% del salario anual</span> por empleado (SHRM 2024). 
              Tamaño de bubble = % de menciones.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-[9px]">
            <span className="px-2 py-0.5 rounded bg-slate-800/50 text-slate-400">
              📊 Fuente: {METHODOLOGY_SOURCES.shrm_2024.name} {METHODOLOGY_SOURCES.shrm_2024.year}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/50 text-slate-400">
              👥 Muestra: {METHODOLOGY_SOURCES.shrm_2024.sampleSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});