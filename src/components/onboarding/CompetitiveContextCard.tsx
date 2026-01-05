// ====================================================================
// COMPETITIVE CONTEXT CARD v2.0 - Tab Resumen Card #1
// src/components/onboarding/CompetitiveContextCard.tsx
// 🎯 Posición vs mercado con filosofía FocalizaHR premium
// ====================================================================

'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Target, ChevronDown } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';

interface CompetitiveContextCardProps {
  globalEXO: number;
  country: string;
  journeyCount: number;
}

export default function CompetitiveContextCard({ 
  globalEXO, 
  country,
  journeyCount 
}: CompetitiveContextCardProps) {
  
  // Estado para progressive disclosure
  const [showDetails, setShowDetails] = useState(false);
  
  // Fetch benchmark empresa completa vs mercado
  const { data: benchmark, loading } = useBenchmark(
    'onboarding_exo',
    'ALL',        // Empresa completa
    undefined,    // Sin departmentId específico
    country
  );

  // Mensaje de clasificación dinámico (SIN EMOJIS)
  const getStatusMessage = useMemo(() => {
    if (!benchmark?.comparison) return null;
    
    const { status, percentageGap } = benchmark.comparison;
    const absGap = Math.abs(percentageGap);
    
    if (status === 'above') {
      if (absGap > 15) return 'Significativamente sobre el promedio';
      if (absGap > 5) return 'Sobre el promedio del mercado';
      return 'Ligeramente sobre el promedio';
    }
    
    if (status === 'below') {
      if (absGap > 15) return 'Significativamente bajo el promedio';
      if (absGap > 5) return 'Bajo el promedio del mercado';
      return 'Ligeramente bajo el promedio';
    }
    
    return 'En línea con el promedio del mercado';
  }, [benchmark]);

  // Micro-insight accionable
  const getActionableInsight = useMemo(() => {
    if (!benchmark?.comparison) return null;
    
    const { status, percentageGap } = benchmark.comparison;
    const absGap = Math.abs(percentageGap);
    
    if (status === 'above' && absGap > 10) {
      return 'Benchmark interno a replicar';
    }
    if (status === 'below' && absGap > 10) {
      return 'Foco de optimización prioritario';
    }
    if (status === 'below' && absGap > 5) {
      return 'Oportunidad de mejora identificada';
    }
    return 'Proceso consolidado';
  }, [benchmark]);

  // Loading state
  if (loading) {
    return (
      <div className="
        relative overflow-hidden
        fhr-card border-l-4 border-l-cyan-400 
        max-w-xs
        animate-pulse
      ">
        <div className="h-32 bg-slate-800/50 rounded" />
      </div>
    );
  }

  // No benchmark disponible
  if (!benchmark?.comparison || !benchmark?.benchmark) {
    return (
      <div className="
        relative overflow-hidden
        fhr-card border-l-4 border-l-slate-600 
        max-w-xs
      ">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-slate-800/50 rounded-lg">
            <Target className="h-3 w-3 text-slate-500" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Posición Competitiva
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Benchmark no disponible aún. Se requiere más data del mercado.
        </p>
      </div>
    );
  }

  const { comparison, benchmark: marketData } = benchmark;

  return (
    <div className="
      relative overflow-hidden
      fhr-card border-l-4 border-l-cyan-400 
      max-w-xs
      transition-all duration-300 ease-out
      hover:bg-slate-900/50
      hover:border-cyan-400/70
    ">
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* LÍNEA TESLA (Patrón distintivo FocalizaHR) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      
      {/* Blur decorativo sutil */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/10 rounded-lg">
          <Target className="h-3 w-3 text-cyan-400" />
        </div>
        <p className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-medium">
          VS MERCADO {country}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROTAGONISTA: Comparación de scores (50% del espacio) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative space-y-3">
        
        {/* Scores lado a lado - JERARQUÍA CLARA */}
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-light text-white tabular-nums">
              {globalEXO}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          
          <span className="text-xs text-slate-500">vs</span>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-cyan-400 tabular-nums">
              {marketData.avgScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500">mercado</span>
          </div>
        </div>
        
        {/* Gap porcentual CON ICONO */}
        <div className="flex items-center gap-2">
          {comparison.status === 'above' && (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          )}
          {comparison.status === 'below' && (
            <TrendingDown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          )}
          <span className={`text-sm font-semibold ${
            comparison.status === 'above' ? 'text-emerald-400' : 
            comparison.status === 'below' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {comparison.percentageGap > 0 ? '+' : ''}
            {comparison.percentageGap.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">
            {getStatusMessage}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CONTEXTO: Barra percentil simplificada (30%) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="relative mt-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Tu posición</span>
          <span className="text-cyan-400 font-medium">
            P{comparison.percentileRank || 50}
          </span>
        </div>
        
        {/* Barra de percentil SIMPLIFICADA (sin labels) */}
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${comparison.percentileRank || 50}%` }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MICRO-INSIGHT ACCIONABLE (20%) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mt-3">
        <p className={`text-[9px] font-medium ${
          comparison.status === 'above' ? 'text-emerald-300/60' :
          comparison.status === 'below' ? 'text-amber-300/60' :
          'text-slate-400'
        }`}>
          {getActionableInsight}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROGRESSIVE DISCLOSURE: Detalles técnicos colapsados */}
      {/* ═══════════════════════════════════════════════════════ */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="
          w-full mt-3 pt-3 border-t border-slate-800/50
          flex items-center justify-between
          text-xs text-cyan-400
          hover:text-cyan-300
          transition-colors
          group
        "
      >
        <span>Ver detalles</span>
        <ChevronDown className={`
          h-3 w-3 
          transition-transform duration-200
          ${showDetails ? 'rotate-180' : ''}
        `} />
      </button>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="mt-2 p-3 bg-slate-800/30 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Empresas en muestra</span>
            <span className="text-slate-300 font-medium">
              {marketData.companyCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Journeys activos</span>
            <span className="text-slate-300 font-medium">
              {journeyCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Categoría</span>
            <span className="text-slate-300 font-medium">
              Empresa completa
            </span>
          </div>
        </div>
      )}
    </div>
  );
}