// ═══════════════════════════════════════════════════════════════════════════════
// ROOTCAUSESMATRIXCARD v2.0 - FocalizaHR Exit Intelligence
// src/components/exit/RootCausesMatrixCard.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: "Entender en 3 segundos → Decidir en 10 segundos → Actuar en 1 clic"
// DISEÑO: 70% Apple + 20% Tesla + 10% Institucional
// VISUALIZACIÓN: Matriz bidimensional Frecuencia × Severidad
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Target, 
  ChevronRight, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Sparkles,
  Users
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface FactorPriority {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
  priority: number;
}

interface RootCausesMatrixCardProps {
  factors: FactorPriority[];
  totalExits: number;
  isLoading?: boolean;
}

interface ChartDataPoint {
  factor: string;
  x: number;
  y: number;
  mentions: number;
  avgSeverity: number;
  mentionRate: number;
  quadrant: 'critical' | 'investigate' | 'monitor' | 'observe';
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM FOCALIZAHR
// ═══════════════════════════════════════════════════════════════════════════════

const FHR = {
  colors: {
    cyan: '#22D3EE',
    purple: '#A78BFA',
    blue: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  quadrants: {
    critical: {
      bg: 'rgba(34, 211, 238, 0.06)',
      dot: '#22D3EE',
      border: 'border-cyan-500/20',
      bgClass: 'bg-cyan-500/5',
      text: 'text-cyan-400',
      label: 'ACTUAR AHORA',
      icon: AlertTriangle,
      glow: '0 0 20px rgba(34, 211, 238, 0.15)'
    },
    investigate: {
      bg: 'rgba(167, 139, 250, 0.05)',
      dot: '#A78BFA',
      border: 'border-purple-500/20',
      bgClass: 'bg-purple-500/5',
      text: 'text-purple-400',
      label: 'INVESTIGAR',
      icon: Sparkles,
      glow: '0 0 20px rgba(167, 139, 250, 0.15)'
    },
    monitor: {
      bg: 'rgba(59, 130, 246, 0.04)',
      dot: '#3B82F6',
      border: 'border-blue-500/20',
      bgClass: 'bg-blue-500/5',
      text: 'text-blue-400',
      label: 'MONITOREAR',
      icon: TrendingDown,
      glow: '0 0 20px rgba(59, 130, 246, 0.15)'
    },
    observe: {
      bg: 'rgba(100, 116, 139, 0.03)',
      dot: '#64748B',
      border: 'border-slate-500/20',
      bgClass: 'bg-slate-500/5',
      text: 'text-slate-400',
      label: 'OBSERVAR',
      icon: TrendingUp,
      glow: 'none'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getQuadrant(mentionRate: number, avgSeverity: number): ChartDataPoint['quadrant'] {
  const highFreq = mentionRate >= 0.10;
  const highSev = avgSeverity <= 2.5;
  
  if (highFreq && highSev) return 'critical';
  if (!highFreq && highSev) return 'investigate';
  if (highFreq && !highSev) return 'monitor';
  return 'observe';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

const CustomTooltip = memo(function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload as ChartDataPoint;
  const config = FHR.quadrants[data.quadrant];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-2xl overflow-hidden"
    >
      {/* Mini Tesla Line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${config.dot}99, transparent)` 
        }}
      />
      
      <div className="flex items-center gap-2.5 mb-3 pt-1">
        <div 
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config.dot }}
        />
        <span className="text-sm font-light text-white">{data.factor}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-light" style={{ color: config.dot }}>
            {Math.round(data.mentionRate * 100)}%
          </p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Frecuencia</p>
        </div>
        <div>
          <p className="text-lg font-light text-slate-200">
            {data.avgSeverity.toFixed(1)}
          </p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Severidad</p>
        </div>
        <div>
          <p className="text-lg font-light text-slate-200">
            {data.mentions}
          </p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Menciones</p>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-slate-800">
        <span className={`text-[10px] font-medium ${config.text}`}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-72 bg-slate-800/30 rounded-xl" />
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-slate-800/20 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-800/20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-5">
          <Target className="h-9 w-9 text-slate-600" />
        </div>
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.1))',
            filter: 'blur(20px)'
          }}
        />
      </div>
      <p className="text-sm text-slate-500 text-center font-light">
        Sin datos de factores disponibles
      </p>
      <p className="text-xs text-slate-600 text-center mt-1">
        Los factores aparecerán cuando haya encuestas completadas
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE FACTOR ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface FactorItemProps {
  data: ChartDataPoint;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

const FactorItem = memo(function FactorItem({ 
  data, 
  isExpanded, 
  onToggle,
  index
}: FactorItemProps) {
  const config = FHR.quadrants[data.quadrant];
  const Icon = config.icon;
  
  const insights = useMemo(() => {
    const messages: { text: string; type: 'warning' | 'info' | 'insight' }[] = [];
    
    if (data.avgSeverity <= 1.5) {
      messages.push({ 
        text: 'Calificado como EXTREMADAMENTE GRAVE por quienes lo mencionan', 
        type: 'warning' 
      });
    } else if (data.avgSeverity <= 2.5) {
      messages.push({ 
        text: 'Severidad alta — requiere atención prioritaria', 
        type: 'warning' 
      });
    }
    
    if (data.mentions >= 3) {
      messages.push({ 
        text: `Patrón confirmado: ${data.mentions} personas independientes coinciden`, 
        type: 'insight' 
      });
    } else if (data.mentions === 1) {
      messages.push({ 
        text: 'Mención única — señal temprana a monitorear', 
        type: 'info' 
      });
    }
    
    if (data.quadrant === 'critical') {
      messages.push({ 
        text: 'Combinación crítica: alta frecuencia + alta severidad', 
        type: 'warning' 
      });
    } else if (data.quadrant === 'investigate') {
      messages.push({ 
        text: 'Pocos lo mencionan, pero lo califican como muy grave', 
        type: 'insight' 
      });
    }
    
    return messages;
  }, [data]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <div 
        className={`
          relative overflow-hidden rounded-xl border transition-all duration-300
          ${config.border} ${config.bgClass}
          ${isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}
        `}
        style={isExpanded ? { boxShadow: config.glow } : undefined}
      >
        {/* Tesla line on expanded */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-0 right-0 h-px"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${config.dot}99, transparent)` 
            }}
          />
        )}
        
        {/* Header - Clickable */}
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center gap-4 text-left"
        >
          {/* Icon */}
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: `${config.dot}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: config.dot }} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-light text-slate-200 truncate">
                {data.factor}
              </p>
              <span 
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                style={{ 
                  backgroundColor: `${config.dot}20`,
                  color: config.dot
                }}
              >
                {config.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-light">
              {data.mentions} {data.mentions === 1 ? 'mención' : 'menciones'} · Severidad {data.avgSeverity.toFixed(1)}/5
            </p>
          </div>
          
          {/* Stats + Chevron */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xl font-extralight tabular-nums" style={{ color: config.dot }}>
                {Math.round(data.mentionRate * 100)}%
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">frecuencia</p>
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-800/50"
            >
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </motion.div>
          </div>
        </button>
        
        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="px-4 pb-4">
                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-700/30" />
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Análisis</span>
                  <div className="flex-1 h-px bg-slate-700/30" />
                </div>
                
                {/* Stats Grid (Mobile) */}
                <div className="grid grid-cols-3 gap-2 mb-4 sm:hidden">
                  <div className="text-center p-3 rounded-lg bg-slate-800/30">
                    <p className="text-lg font-light" style={{ color: config.dot }}>
                      {Math.round(data.mentionRate * 100)}%
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Frecuencia</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30">
                    <p className="text-lg font-light text-slate-300">
                      {data.avgSeverity.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Severidad</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30">
                    <p className="text-lg font-light text-slate-300">
                      {data.mentions}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Menciones</p>
                  </div>
                </div>
                
                {/* Insights */}
                <div className="space-y-2 mb-4">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2.5"
                    >
                      <div 
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ 
                          backgroundColor: insight.type === 'warning' 
                            ? FHR.colors.warning 
                            : insight.type === 'insight'
                              ? config.dot
                              : '#64748B'
                        }}
                      />
                      <span className="text-xs text-slate-400 leading-relaxed">
                        {insight.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Context Card */}
                <div 
                  className="relative p-4 rounded-xl overflow-hidden"
                  style={{ backgroundColor: `${config.dot}08` }}
                >
                  <div 
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: `${config.dot}50` }}
                  />
                  <p className="text-[11px] text-slate-400 italic leading-relaxed pl-3">
                    "Cuando alguien que se va menciona este factor, no tiene nada que perder siendo honesto. 
                    Esta es la verdad que solo los que se van pueden decir."
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function RootCausesMatrixCard({
  factors,
  totalExits,
  isLoading = false
}: RootCausesMatrixCardProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  
  const toggleFactor = useCallback((factor: string) => {
    setExpandedFactor(prev => prev === factor ? null : factor);
  }, []);
  
  // Transform data for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    return factors
      .filter(f => 
        typeof f.avgSeverity === 'number' && 
        !isNaN(f.avgSeverity) &&
        typeof f.mentionRate === 'number'
      )
      .map(f => ({
        factor: f.factor,
        x: f.mentionRate * 100,
        y: 6 - f.avgSeverity,
        mentions: f.mentions,
        avgSeverity: f.avgSeverity,
        mentionRate: f.mentionRate,
        quadrant: getQuadrant(f.mentionRate, f.avgSeverity)
      }));
  }, [factors]);
  
  // Sort by priority
  const sortedData = useMemo(() => {
    return [...chartData].sort((a, b) => {
      const order = { critical: 0, investigate: 1, monitor: 2, observe: 3 };
      const diff = order[a.quadrant] - order[b.quadrant];
      if (diff !== 0) return diff;
      return a.avgSeverity - b.avgSeverity;
    });
  }, [chartData]);
  
  // Calculate max X
  const maxX = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.x), 20);
    return Math.ceil(max / 10) * 10 + 5;
  }, [chartData]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════════════
          TESLA LINE + GLOW
      ══════════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #A78BFA 70%, transparent 100%)'
        }}
      />
      <div 
        className="absolute top-0 left-1/4 right-1/4 h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.08) 0%, transparent 100%)'
        }}
      />
      
      <div className="p-6">
        {/* ══════════════════════════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-extralight text-white tracking-tight">
                  Matriz de{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Causas Raíz
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-light">
                  Frecuencia vs Severidad
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-extralight text-white tabular-nums">{totalExits}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">encuestas</p>
          </div>
        </div>
        
        {isLoading ? (
          <LoadingSkeleton />
        ) : chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════════════
                SCATTER CHART
            ══════════════════════════════════════════════════════════════════════ */}
            <div className="h-64 sm:h-72 mb-6 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 30 }}>
                  {/* Cuadrantes */}
                  <ReferenceArea x1={10} x2={maxX} y1={3.5} y2={5.5} fill={FHR.quadrants.critical.bg} />
                  <ReferenceArea x1={0} x2={10} y1={3.5} y2={5.5} fill={FHR.quadrants.investigate.bg} />
                  <ReferenceArea x1={10} x2={maxX} y1={0.5} y2={3.5} fill={FHR.quadrants.monitor.bg} />
                  <ReferenceArea x1={0} x2={10} y1={0.5} y2={3.5} fill={FHR.quadrants.observe.bg} />
                  
                  {/* Reference Lines */}
                  <ReferenceLine x={10} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="4 4" />
                  <ReferenceLine y={3.5} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="4 4" />
                  
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, maxX]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    label={{ 
                      value: 'Frecuencia (%)', 
                      position: 'bottom', 
                      fill: '#64748B',
                      fontSize: 10,
                      offset: 10
                    }}
                  />
                  
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[0.5, 5.5]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(v) => (6 - v).toFixed(0)}
                    label={{ 
                      value: 'Severidad', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: '#64748B',
                      fontSize: 10,
                      offset: 0
                    }}
                  />
                  
                  <ZAxis type="number" dataKey="mentions" range={[120, 400]} />
                  
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  
                  <Scatter data={chartData}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={FHR.quadrants[entry.quadrant].dot}
                        stroke="rgba(15, 23, 42, 0.8)"
                        strokeWidth={2}
                        fillOpacity={0.9}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            {/* ══════════════════════════════════════════════════════════════════════
                LEYENDA
            ══════════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {(['critical', 'investigate', 'monitor', 'observe'] as const).map((q) => {
                const cfg = FHR.quadrants[q];
                const count = chartData.filter(d => d.quadrant === q).length;
                
                return (
                  <div 
                    key={q}
                    className={`
                      flex items-center gap-2.5 p-2.5 rounded-lg border
                      ${cfg.border} ${cfg.bgClass}
                    `}
                  >
                    <div 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-medium ${cfg.text} truncate`}>
                        {cfg.label}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {count} factor{count !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* ══════════════════════════════════════════════════════════════════════
                DETALLE POR FACTOR (COLAPSABLES)
            ══════════════════════════════════════════════════════════════════════ */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-light">
                  Detalle por Factor
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
              </div>
              
              {sortedData.map((data, index) => (
                <FactorItem
                  key={data.factor}
                  data={data}
                  isExpanded={expandedFactor === data.factor}
                  onToggle={() => toggleFactor(data.factor)}
                  index={index}
                />
              ))}
            </div>
          </>
        )}
        
        {/* ══════════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════════ */}
        {!isLoading && chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between"
          >
            <p className="text-[11px] text-slate-500 flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>
                Basado en {totalExits} {totalExits === 1 ? 'encuesta' : 'encuestas'} de salida
              </span>
            </p>
            <p className="text-[10px] text-slate-600">
              Exit Intelligence
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
});