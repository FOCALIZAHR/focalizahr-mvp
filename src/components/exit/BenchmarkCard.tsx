// src/components/exit/BenchmarkCard.tsx
// 🎯 Comparación vs Mercado - Contexto competitivo
// Filosofía v3.0: "El benchmark da contexto. No compite con el gauge."
// ✅ USA exitAlertConfig.ts centralizado
// ✅ Nombres de país completos (Chile, no CL)

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2, Info, BrainCircuit } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';
import { getBenchmarkConfig } from '@/config/exitAlertConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface BenchmarkCardProps {
  /** Tipo de alerta para obtener config */
  alertType: string;
  /** Score EIS actual */
  score: number;
  /** Categoría del departamento para benchmark */
  departmentCategory?: string;
  /** País (default: CL) */
  country?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const COUNTRY_NAMES: Record<string, string> = {
  'CL': 'Chile',
  'AR': 'Argentina',
  'MX': 'México',
  'CO': 'Colombia',
  'PE': 'Perú',
  'BR': 'Brasil',
  'US': 'Estados Unidos',
  'ES': 'España'
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

// Narrativa contextual según score
function getNarrative(score: number) {
  if (score >= 70) return { 
    line1: 'Salida en buenos términos.', 
    line2: 'No hay señales de alarma.'
  };
  if (score >= 50) return { 
    line1: 'Salida con fricciones.', 
    line2: 'Vale la pena investigar.'
  };
  if (score >= 25) return { 
    line1: 'Salida problemática.', 
    line2: 'Hay patrones que atender.'
  };
  return { 
    line1: 'Exit tóxico detectado.', 
    line2: 'Riesgo de contagio al equipo.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function BenchmarkCard({
  alertType,
  score,
  departmentCategory,
  country = 'CL'
}: BenchmarkCardProps) {
  
  // ✅ Obtener config desde exitAlertConfig.ts
  const benchmarkConfig = useMemo(() => getBenchmarkConfig(alertType), [alertType]);
  
  // Hook real de benchmark (solo si showBenchmark = true)
  const { data: benchmarkData, loading, error } = useBenchmark(
    'eis',
    departmentCategory || 'ALL',
    undefined,
    country,
    { enabled: benchmarkConfig.showBenchmark }
  );

  // Calcular comparación
  const benchmark = useMemo(() => {
    if (!benchmarkConfig.showBenchmark) return null;
    if (loading || error || !benchmarkData?.benchmark) return null;
    
    const marketAvg = benchmarkData.benchmark.avgScore;
    const diff = score - marketAvg;
    const diffPercent = Math.round(Math.abs((diff / marketAvg) * 100));
    const isAbove = diff > 2;
    const isBelow = diff < -2;

    return {
      marketAvg: Math.round(marketAvg * 10) / 10,
      diffPercent,
      isAbove,
      isBelow,
      icon: isAbove ? TrendingUp : isBelow ? TrendingDown : Minus,
      color: isAbove ? 'text-emerald-400' : isBelow ? 'text-amber-400' : 'text-slate-400',
      bgColor: isAbove ? 'bg-emerald-500/10' : isBelow ? 'bg-amber-500/10' : 'bg-slate-800/40',
      borderColor: isAbove ? 'border-emerald-500/20' : isBelow ? 'border-amber-500/20' : 'border-slate-700/40',
      companyCount: benchmarkData.benchmark.companyCount
    };
  }, [score, benchmarkData, loading, error, benchmarkConfig.showBenchmark]);

  const narrative = useMemo(() => getNarrative(score), [score]);
  const countryName = getCountryName(country);
  
  // Construir label de comparación con nombre completo
  const comparisonLabel = useMemo(() => {
    const configLabel = benchmarkConfig.comparisonLabel || '';
    // Reemplazar códigos ISO por nombres completos
    return configLabel
      .replace('CL', 'Chile')
      .replace('AR', 'Argentina')
      .replace('MX', 'México')
      || `vs Mercado ${countryName}`;
  }, [benchmarkConfig.comparisonLabel, countryName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl p-5
        transition-all duration-300
        hover:bg-slate-900/50 hover:border-slate-600/50
      "
    >
      {/* Línea Tesla sutil */}
      <div className="fhr-top-line opacity-40" />
      
      {/* Efecto decorativo */}
      <div className="absolute -top-16 -right-16 w-28 h-28 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Susurra, no grita
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center gap-2 mb-4 pt-2">
        <BarChart3 className="h-4 w-4 text-slate-500" />
        <p className="text-xs font-light text-slate-500 tracking-wide">
          {comparisonLabel}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENIDO - Estados según config y data
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {!benchmarkConfig.showBenchmark ? (
          // Config dice no mostrar benchmark
          <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-700/30 mb-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-light text-slate-400 mb-1">
                  {benchmarkConfig.emptyStateTitle}
                </p>
                <p className="text-xs font-light text-slate-600">
                  {benchmarkConfig.emptyStateMessage}
                </p>
              </div>
            </div>
          </div>
        ) : loading ? (
          // Loading State
          <div className="flex items-center gap-2 p-4 bg-slate-800/30 rounded-lg mb-4">
            <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
            <span className="text-xs font-light text-slate-500">Cargando benchmark...</span>
          </div>
        ) : benchmark ? (
          // Con Datos - Comparación
          <div className={`${benchmark.bgColor} ${benchmark.borderColor} border rounded-lg p-4 mb-4`}>
            <div className="flex items-center gap-3">
              <benchmark.icon className={`h-6 w-6 ${benchmark.color}`} />
              <div>
                <span className={`text-2xl font-light ${benchmark.color}`}>
                  {benchmark.isAbove ? '+' : benchmark.isBelow ? '-' : '≈'}{benchmark.diffPercent}%
                </span>
                <p className="text-xs font-light text-slate-500">
                  {benchmark.isAbove ? 'sobre' : benchmark.isBelow ? 'bajo' : 'igual al'} promedio industria
                </p>
              </div>
            </div>
            
            {/* Detalles */}
            <div className="mt-3 pt-3 border-t border-slate-700/30 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-light text-slate-300">{score.toFixed(1)}</p>
                <p className="text-[10px] font-light text-slate-600">Tu score</p>
              </div>
              <div>
                <p className="text-lg font-light text-slate-400">{benchmark.marketAvg}</p>
                <p className="text-[10px] font-light text-slate-600">Promedio mercado</p>
              </div>
            </div>
          </div>
        ) : (
          // Empty State - Sin datos de benchmark
          <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-700/30 mb-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-light text-slate-400 mb-1">
                  {benchmarkConfig.emptyStateTitle || 'Sin datos suficientes'}
                </p>
                <p className="text-xs font-light text-slate-600">
                  {benchmarkConfig.emptyStateMessage || 'Requiere más empresas de tu industria.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            INTELIGENCIA FOCALIZAHR - El insight (susurra en slate)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="pt-3 border-t border-slate-700/30">
          <div className="flex items-start gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-300">
                {narrative.line1}
              </p>
              <p className="text-xs font-light text-slate-500 mt-0.5">
                {narrative.line2}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});