ðŸ“Š Sistema NPS FocalizaHR - Frontend

VersiÃ³n: 1.0.0
Fecha: Diciembre 2025
Tipo: GuÃ­a de Componentes Frontend
Complemento de: Sistema_NPS_FocalizaHR.md (Backend)


ðŸ“‹ ÃNDICE

Directrices de Frontend
Componentes NPS
GuÃ­a de Colores NPS
Hook useNPSData
Ejemplo Dashboard NPS


1. DIRECTRICES DE FRONTEND
1.1 Mejores PrÃ¡cticas de VisualizaciÃ³n NPS
Basado en investigaciÃ³n de estÃ¡ndares de la industria:
yamlVISUALIZACIONES RECOMENDADAS:
  1. Gauge Semicircular:
     - Para mostrar NPS score individual (-100 a +100)
     - Ideal para dashboards ejecutivos
     - Impacto visual inmediato
  
  2. Barra Stacked Horizontal:
     - Muestra distribuciÃ³n Promoters/Passives/Detractors
     - Permite comparar mÃºltiples perÃ­odos o departamentos
     - Revela composiciÃ³n del score
  
  3. GrÃ¡fico de LÃ­nea Temporal:
     - Trend de NPS en el tiempo
     - Combinar con scoreDelta para contexto
     - Ideal para detectar tendencias
  
  4. Barra + LÃ­nea Combinado:
     - Mejor de ambos mundos
     - Muestra composiciÃ³n Y tendencia
     - Recomendado para anÃ¡lisis profundo

VISUALIZACIONES NO RECOMENDADAS:
  âŒ Pie Chart: DifÃ­cil determinar NPS real
  âŒ Solo nÃºmero: Pierde contexto de composiciÃ³n
1.2 Patrones UX para NPS
yamlPATRONES RECOMENDADOS:
  - Mostrar siempre el N (total de respuestas)
  - Incluir scoreDelta con indicador visual (â†‘â†“)
  - Color coding consistente para clasificaciones
  - Tooltips con desglose en hover
  - ComparaciÃ³n con perÃ­odo anterior visible
  - Drill-down a detalle por departamento

ANTI-PATRONES:
  - Mostrar solo el score sin contexto
  - Ocultar muestra pequeÃ±a (puede ser engaÃ±oso)
  - Mezclar escalas de colores
  - Animaciones excesivas en datos crÃ­ticos

2. COMPONENTES NPS
2.1 NPSGaugeCard - Score Principal
typescript// src/components/nps/NPSGaugeCard.tsx
'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface NPSGaugeCardProps {
  score: number;           // -100 a +100
  previousScore?: number | null;
  totalResponses: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default memo(function NPSGaugeCard({
  score,
  previousScore,
  totalResponses,
  title = 'NPS Score',
  size = 'md'
}: NPSGaugeCardProps) {
  
  // Calcular delta
  const delta = previousScore !== null && previousScore !== undefined 
    ? score - previousScore 
    : null;
  
  // Determinar color basado en score
  const scoreColor = useMemo(() => {
    if (score >= 50) return 'text-emerald-400';
    if (score >= 0) return 'text-amber-400';
    return 'text-red-400';
  }, [score]);
  
  // Calcular rotaciÃ³n del gauge (0 = -100, 180 = +100)
  const rotation = ((score + 100) / 200) * 180;
  
  const sizes = {
    sm: { width: 120, height: 70, fontSize: 'text-2xl' },
    md: { width: 180, height: 100, fontSize: 'text-4xl' },
    lg: { width: 240, height: 130, fontSize: 'text-5xl' }
  };
  
  const { width, height, fontSize } = sizes[size];
  
  return (
    <div className="fhr-card p-6 text-center">
      <h3 className="text-sm font-medium text-slate-400 mb-4">{title}</h3>
      
      {/* Gauge SVG */}
      <div className="relative mx-auto" style={{ width, height }}>
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored segments */}
          <path
            d="M 10 50 A 40 40 0 0 1 30 15"
            fill="none"
            stroke="#EF4444"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 30 15 A 40 40 0 0 1 70 15"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="8"
            opacity="0.6"
          />
          <path
            d="M 70 15 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#10B981"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Needle */}
          <motion.line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: rotation - 90 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="4" fill="#22D3EE" />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className={`${fontSize} font-bold ${scoreColor}`}>
            {score > 0 ? '+' : ''}{score}
          </span>
        </div>
      </div>
      
      {/* Meta info */}
      <div className="mt-4 flex justify-center items-center gap-4 text-sm">
        <span className="text-slate-500">
          n={totalResponses}
        </span>
        
        {delta !== null && (
          <span className={`flex items-center gap-1 ${
            delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {delta > 0 ? 'â†‘' : delta < 0 ? 'â†“' : 'â†’'}
            {Math.abs(delta)} pts
          </span>
        )}
      </div>
      
      {/* Labels */}
      <div className="mt-2 flex justify-between text-xs text-slate-500 px-4">
        <span>-100</span>
        <span>0</span>
        <span>+100</span>
      </div>
    </div>
  );
});
2.2 NPSDistributionBar - DistribuciÃ³n
typescript// src/components/nps/NPSDistributionBar.tsx
'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface NPSDistributionBarProps {
  promoters: number;
  passives: number;
  detractors: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  height?: number;
}

export default memo(function NPSDistributionBar({
  promoters,
  passives,
  detractors,
  showLabels = true,
  showPercentages = true,
  height = 32
}: NPSDistributionBarProps) {
  
  const total = promoters + passives + detractors;
  
  const percentages = useMemo(() => ({
    promoters: total > 0 ? (promoters / total) * 100 : 0,
    passives: total > 0 ? (passives / total) * 100 : 0,
    detractors: total > 0 ? (detractors / total) * 100 : 0
  }), [promoters, passives, detractors, total]);
  
  if (total === 0) {
    return (
      <div className="text-center text-slate-500 py-4">
        Sin datos disponibles
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {/* Bar */}
      <div 
        className="flex rounded-full overflow-hidden bg-slate-800"
        style={{ height }}
      >
        {/* Promoters */}
        <motion.div
          className="bg-emerald-500 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${percentages.promoters}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {percentages.promoters > 10 && showPercentages && (
            <span className="text-xs font-medium text-white">
              {percentages.promoters.toFixed(0)}%
            </span>
          )}
        </motion.div>
        
        {/* Passives */}
        <motion.div
          className="bg-amber-500 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${percentages.passives}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          {percentages.passives > 10 && showPercentages && (
            <span className="text-xs font-medium text-white">
              {percentages.passives.toFixed(0)}%
            </span>
          )}
        </motion.div>
        
        {/* Detractors */}
        <motion.div
          className="bg-red-500 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${percentages.detractors}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {percentages.detractors > 10 && showPercentages && (
            <span className="text-xs font-medium text-white">
              {percentages.detractors.toFixed(0)}%
            </span>
          )}
        </motion.div>
      </div>
      
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-400">
              Promotores ({promoters})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-slate-400">
              Pasivos ({passives})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-slate-400">
              Detractores ({detractors})
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
2.3 NPSTrendChart - Tendencia Temporal
typescript// src/components/nps/NPSTrendChart.tsx
'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { NPSTrendPoint } from '@/types/nps';

interface NPSTrendChartProps {
  data: NPSTrendPoint[];
  height?: number;
}

export default memo(function NPSTrendChart({
  data,
  height = 300
}: NPSTrendChartProps) {
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500" style={{ height }}>
        Sin datos de tendencia disponibles
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        
        <XAxis 
          dataKey="period" 
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        
        <YAxis 
          domain={[-100, 100]}
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => value > 0 ? `+${value}` : value}
        />
        
        {/* LÃ­nea de referencia en 0 */}
        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="5 5" />
        
        {/* Zona de excelencia (>50) */}
        <ReferenceLine y={50} stroke="#10B981" strokeDasharray="3 3" opacity={0.5} />
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => [
            `${value > 0 ? '+' : ''}${value}`,
            'NPS Score'
          ]}
        />
        
        <Line
          type="monotone"
          dataKey="npsScore"
          stroke="#22D3EE"
          strokeWidth={3}
          dot={{ fill: '#22D3EE', strokeWidth: 2, r: 4 }}
          activeDot={{ fill: '#A78BFA', strokeWidth: 2, r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
2.4 NPSJourneyCard - Comparativo Journey
typescript// src/components/nps/NPSJourneyCard.tsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { NPSJourneyComparison } from '@/types/nps';

interface NPSJourneyCardProps {
  data: NPSJourneyComparison;
}

const stages = [
  { key: 'onboarding', label: 'Ingreso', icon: 'ðŸš€' },
  { key: 'pulso', label: 'Clima', icon: 'ðŸ’“' },
  { key: 'experiencia', label: 'Experiencia', icon: 'â­' },
  { key: 'exit', label: 'Salida', icon: 'ðŸšª' }
] as const;

export default memo(function NPSJourneyCard({ data }: NPSJourneyCardProps) {
  
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 50) return 'text-emerald-400';
    if (score >= 0) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const formatScore = (score: number | null) => {
    if (score === null) return 'â€”';
    return score > 0 ? `+${score}` : score.toString();
  };
  
  return (
    <div className="fhr-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="fhr-title-gradient">Journey NPS del Colaborador</span>
      </h3>
      
      {/* Journey flow */}
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const score = data[stage.key as keyof NPSJourneyComparison] as number | null;
          
          return (
            <div key={stage.key} className="flex items-center">
              {/* Stage */}
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-2xl mb-2">{stage.icon}</div>
                <span className="text-xs text-slate-400 mb-1">{stage.label}</span>
                <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                  {formatScore(score)}
                </span>
              </motion.div>
              
              {/* Connector arrow */}
              {index < stages.length - 1 && (
                <div className="mx-4 flex items-center">
                  <div className="w-8 h-0.5 bg-slate-700" />
                  <div className="text-slate-500">â†’</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Journey Delta */}
      {data.journeyDelta !== null && (
        <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
          <span className="text-sm text-slate-400">
            Delta Ingreso â†’ Salida: {' '}
          </span>
          <span className={`font-bold ${
            data.journeyDelta > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {data.journeyDelta > 0 ? '-' : '+'}{Math.abs(data.journeyDelta)} pts
          </span>
          {data.journeyDelta > 30 && (
            <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
              âš ï¸ Gap crÃ­tico
            </span>
          )}
        </div>
      )}
    </div>
  );
});
2.5 NPSRankingTable - Ranking por Gerencia
typescript// src/components/nps/NPSRankingTable.tsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { NPSInsightWithDepartment } from '@/types/nps';

interface NPSRankingTableProps {
  data: NPSInsightWithDepartment[];
  maxItems?: number;
}

export default memo(function NPSRankingTable({
  data,
  maxItems = 10
}: NPSRankingTableProps) {
  
  const sortedData = [...data]
    .sort((a, b) => b.npsScore - a.npsScore)
    .slice(0, maxItems);
  
  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-emerald-400 bg-emerald-400/10';
    if (score >= 0) return 'text-amber-400 bg-amber-400/10';
    return 'text-red-400 bg-red-400/10';
  };
  
  const getMedal = (index: number) => {
    if (index === 0) return 'ðŸ¥‡';
    if (index === 1) return 'ðŸ¥ˆ';
    if (index === 2) return 'ðŸ¥‰';
    return `${index + 1}.`;
  };
  
  if (data.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        Sin datos de ranking disponibles
      </div>
    );
  }
  
  return (
    <div className="fhr-card overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-white">Ranking NPS por Gerencia</h3>
      </div>
      
      <div className="divide-y divide-slate-700/30">
        {sortedData.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg w-8">{getMedal(index)}</span>
              <div>
                <p className="font-medium text-white">
                  {item.department?.displayName || 'Global'}
                </p>
                <p className="text-xs text-slate-500">
                  n={item.totalResponses}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {item.scoreDelta !== null && (
                <span className={`text-xs ${
                  item.scoreDelta > 0 ? 'text-emerald-400' : 
                  item.scoreDelta < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {item.scoreDelta > 0 ? 'â†‘' : item.scoreDelta < 0 ? 'â†“' : 'â†’'}
                  {Math.abs(item.scoreDelta)}
                </span>
              )}
              
              <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(item.npsScore)}`}>
                {item.npsScore > 0 ? '+' : ''}{item.npsScore}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

3. GUÃA DE COLORES NPS
3.1 Paleta EstÃ¡ndar NPS
css/* Variables CSS para NPS */
:root {
  /* ClasificaciÃ³n de respuestas */
  --nps-promoter: #10B981;      /* Verde - Ratings 9-10 */
  --nps-passive: #F59E0B;       /* Amarillo - Ratings 7-8 */
  --nps-detractor: #EF4444;     /* Rojo - Ratings 0-6 */
  
  /* Score total (-100 a +100) */
  --nps-excellent: #10B981;     /* >= 50 */
  --nps-good: #F59E0B;          /* 0 a 49 */
  --nps-critical: #EF4444;      /* < 0 */
  
  /* Trend indicators */
  --nps-trend-up: #10B981;      /* Mejora */
  --nps-trend-down: #EF4444;    /* CaÃ­da */
  --nps-trend-neutral: #64748B; /* Sin cambio */
  
  /* IntegraciÃ³n con Design System FocalizaHR */
  --nps-accent: #22D3EE;        /* Cyan corporativo */
  --nps-highlight: #A78BFA;     /* Purple corporativo */
}
3.2 Tailwind Classes
typescript// Colores para clasificaciÃ³n de respuestas
const PROMOTER_CLASSES = 'bg-emerald-500 text-white';
const PASSIVE_CLASSES = 'bg-amber-500 text-white';
const DETRACTOR_CLASSES = 'bg-red-500 text-white';

// Colores para score total
const getScoreClasses = (score: number) => {
  if (score >= 50) return 'text-emerald-400 bg-emerald-400/10';
  if (score >= 0) return 'text-amber-400 bg-amber-400/10';
  return 'text-red-400 bg-red-400/10';
};

// Colores para trend
const getTrendClasses = (delta: number | null) => {
  if (delta === null) return 'text-slate-400';
  if (delta > 0) return 'text-emerald-400';
  if (delta < 0) return 'text-red-400';
  return 'text-slate-400';
};
3.3 Escala Visual NPS
SCORE        CLASIFICACIÃ“N    COLOR           USO
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
+70 a +100   World-Class      Verde Intenso   Celebrar
+50 a +69    Excelente        Verde           Mantener
+30 a +49    Bueno            Verde Claro     Mejorar
+0 a +29     Promedio         Amarillo        AtenciÃ³n
-30 a -1     Bajo             Naranja         Urgente
-100 a -31   CrÃ­tico          Rojo            Crisis

4. HOOK useNPSData
typescript// src/hooks/useNPSData.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { NPSApiResponse, NPSQueryParams } from '@/types/nps';

export function useNPSData(params: NPSQueryParams = {}) {
  const [data, setData] = useState<NPSApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = new URLSearchParams({
        product: params.product || 'all',
        period: params.period || 'latest',
        ...(params.groupBy && { groupBy: params.groupBy }),
        ...(params.history && { history: 'true' })
      }).toString();
      
      const response = await fetch(`/api/analytics/nps?${queryString}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener datos NPS');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [params.product, params.period, params.groupBy, params.history]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}

5. EJEMPLO DASHBOARD NPS
typescript// src/app/dashboard/nps/page.tsx
'use client';

import { useNPSData } from '@/hooks/useNPSData';
import NPSGaugeCard from '@/components/nps/NPSGaugeCard';
import NPSDistributionBar from '@/components/nps/NPSDistributionBar';
import NPSTrendChart from '@/components/nps/NPSTrendChart';
import NPSRankingTable from '@/components/nps/NPSRankingTable';

export default function NPSDashboardPage() {
  // Datos globales
  const { data: globalData, loading: loadingGlobal } = useNPSData({
    product: 'onboarding',
    period: 'latest'
  });
  
  // Ranking por gerencia
  const { data: rankingData, loading: loadingRanking } = useNPSData({
    product: 'onboarding',
    groupBy: 'gerencia'
  });
  
  // HistÃ³rico para trend
  const { data: trendData, loading: loadingTrend } = useNPSData({
    product: 'onboarding',
    history: true
  });
  
  if (loadingGlobal || loadingRanking || loadingTrend) {
    return <div className="animate-pulse">Cargando...</div>;
  }
  
  const globalInsight = globalData?.data.find(d => d.departmentId === null);
  
  return (
    <div className="space-y-6 p-6">
      <h1 className="fhr-title-gradient text-2xl font-bold">
        Dashboard NPS Onboarding
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Score Principal */}
        {globalInsight && (
          <NPSGaugeCard
            score={globalInsight.npsScore}
            previousScore={globalInsight.previousScore}
            totalResponses={globalInsight.totalResponses}
            title="NPS Global Onboarding"
            size="lg"
          />
        )}
        
        {/* DistribuciÃ³n */}
        {globalInsight && (
          <div className="fhr-card p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">
              DistribuciÃ³n de Respuestas
            </h3>
            <NPSDistributionBar
              promoters={globalInsight.promoters}
              passives={globalInsight.passives}
              detractors={globalInsight.detractors}
            />
          </div>
        )}
        
        {/* Trend */}
        <div className="fhr-card p-6 lg:col-span-1">
          <h3 className="text-sm font-medium text-slate-400 mb-4">
            Tendencia NPS
          </h3>
          <NPSTrendChart 
            data={trendData?.data.map(d => ({
              period: d.period,
              npsScore: d.npsScore,
              scoreDelta: d.scoreDelta,
              totalResponses: d.totalResponses
            })) || []}
            height={200}
          />
        </div>
      </div>
      
      {/* Ranking */}
      <NPSRankingTable data={rankingData?.data || []} />
    </div>
  );
}

ðŸ“š REFERENCIAS
yamlDOCUMENTO BACKEND:
  - Sistema_NPS_FocalizaHR.md v1.1.0 (arquitectura, API, servicios)

TIPOS TYPESCRIPT:
  - src/types/nps.ts (definido en documento backend)

LIBRERÃAS UTILIZADAS:
  - recharts (grÃ¡ficos)
  - framer-motion (animaciones)
  - tailwindcss (estilos)

PATRONES DESIGN SYSTEM:
  - GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR.md
  - Torre_de_Control_-_Arquitectura_Maestra_v6_0.md

"Componentes premium para visualizar NPS."
â€” Sistema NPS FocalizaHR Frontend v1.0.0

---

## AS-BUILT 2026-07-06 — Fix rating=0 tratado como falsy en submit (sellado)

### Registro del bug y fix

- **Bug:** ambas rutas de submit trataban `rating: 0` como ausencia de valor
  (`rating > 0`), perdiendo el detractor más extremo de NPS (0 en escala 0-10).
  - Ruta estándar (`src/app/api/survey/[token]/submit/route.ts`): dropeaba el 0
    silenciosamente → fila Response con rating y normalizedScore null.
  - Ruta Onboarding (`src/app/api/onboarding/survey/[token]/submit/route.ts`):
    peor — `validateResponse` rechazaba el 0 como "respuesta vacía" → 400 al
    submit completo; el detractor no podía terminar `onboarding-day-90`.
- **Fix (commit `a98b626`):** guard `rating >= (question.minValue ?? 1)` en
  ambas rutas — `question.minValue` de BD (schema: `Int @default(1)`; NPS=0)
  es la fuente de verdad del rango válido. En Onboarding, `validateResponse`
  ahora recibe la question con su minValue real. El filtro del
  PerformanceRating parcial (:293 ruta estándar) usa el mismo guard
  (defensivo; performance no tiene preguntas nps_scale).
- **Alcance:** `retencion-predictiva` (Exit), `pulso-express`,
  `experiencia-full` (ruta estándar) + `onboarding-day-90` (ruta propia).
  Los 4 campaignTypes con pregunta nps_scale, todos minValue=0/maxValue=10.
- **Smoke 3/3 PASS** (fixtures sintéticos, cleanup por accountId; script
  borrado al sellar): rating=0 persiste con normalizedScore=0.0 en ambas
  rutas; onboarding responde 201 (no 400) y genera la alerta detractor
  day-90; regresión performance intacta (managerScore 4.0 con ratings
  5/4/3, rating=0 en rating_scale minValue=1 sigue excluido).

### eNPS histórico: CONFIABLE — sin disclaimer ni recálculo

Verificado con query real (Gate 0, 2026-07-06): **0 filas Response huérfanas**
de preguntas nps_scale (un 0 dropeado habría dejado fila con nulls — rastro
forense) contra 114 respuestas NPS con rating persistido. Ningún participante
envió jamás un 0 antes del fix. Los **22 registros NPSInsight** existentes
(Corporación Enterprise: exit 2026-01 + onboarding 2025-11/2025-12;
FocalizaHR: onboarding 2025-11) están **sin contaminación**. No se requiere
backfill, recálculo ni disclaimer sobre el eNPS histórico.

### Referencia para el próximo que toque estas rutas de submit

- El contrato correcto ya existía en el frontend: `responseValidator.ts:19-22`
  discrimina nps `>= 0` vs rating `>= 1`. El autosave
  (`survey/[token]/save/route.ts`) siempre persistió con `rating ?? null`.
  La capa de normalización/agregación (`responseNormalizer.ts`,
  `NPSAggregationService`, `ExitAggregationService`, `OnboardingAlertService`,
  `OnboardingIntelligenceEngine`) usa `!== null` / `normalizedScore` — es
  correcta para 0; NO agregar guards `> 0` ahí.
- **Regla:** todo guard de rating en submit/persistencia debe usar
  `question.minValue`, nunca literales (`> 0`, `>= 1`).
- Backlog fuera de este pase (legacy muerto, no urgente): `SurveyForm.tsx:100`
  y `ConditionalSurveyComponent.tsx:131` (importados en encuesta/[token]/
  page.tsx pero no renderizados — solo UnifiedSurveyComponent se usa),
  `getScaleLabels.ts:39` (`minValue || 1` — cosmético).
- Evidencia completa del Gate 0 (grep transversal file:line, contrato
  responseType en submit, queries de alcance e impacto): conversación
  Claude Code 2026-07-06, resumen en este registro.