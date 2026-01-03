// ====================================================================
// NPS ONBOARDING CARD - DISEÑO FOCALIZAHR PREMIUM v4.1
// src/components/onboarding/NPSOnboardingCard.tsx
// ====================================================================
// 🎯 FILOSOFÍA: BimodalToggle interno + Colores NPS universales
// ✅ viewMode: 'gerencias' | 'departamentos' → cambia groupBy en API
// ✅ COLOR TENDENCIA CONTEXTUAL: Cyan si mejoró pero aún negativo
// ✅ fhr-top-line: Línea Tesla superior
// ✅ RBAC: Backend filtra automáticamente según rol del usuario
// ====================================================================
// CHANGELOG v4.1:
// - ELIMINADO: parentDepartmentId (innecesario, backend filtra por RBAC)
// - SIMPLIFICADO: RankingView sin filtrado manual
// - AGREGADO: groupBy dinámico según viewMode ('gerencia' | 'department')
// - AGREGADO: fhr-top-line (línea Tesla)
// - ELIMINADO: n=X duplicado de NPSScoreBar (solo en DistributionPanel)
// ====================================================================

'use client';

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Trophy } from 'lucide-react';
import { useNPSData } from '@/hooks/useNPSData';

// ============================================
// TYPES
// ============================================
interface NPSInsight {
  id: string;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  scoreDelta: number | null;
  departmentId: string | null;
  department?: {
    id: string;
    displayName: string;
    level: number;
    parentId?: string | null;
  } | null;
}

type ViewMode = 'resumen' | 'ranking';

// ============================================
// 🆕 PROPS BIMODAL
// ============================================
interface NPSOnboardingCardProps {
  /** 
   * Modo de agrupación:
   * - 'gerencias': groupBy='gerencia' (para /dashboard/onboarding/)
   * - 'departamentos': groupBy='department' (para /dashboard/onboarding/executive)
   * El filtrado RBAC lo hace el backend automáticamente
   */
  viewMode?: 'gerencias' | 'departamentos';
}

// ============================================
// CONSTANTS - COLORES NPS UNIVERSALES
// ============================================
const NPS_COLORS = {
  // Distribución (universal)
  promoter: '#10B981',   // Verde - 9-10
  passive: '#F59E0B',    // Amarillo - 7-8
  detractor: '#EF4444',  // Rojo - 0-6
  
  // Score thresholds
  score: {
    excellent: '#10B981',  // ≥50
    good: '#22D3EE',       // 20-49
    warning: '#F59E0B',    // 0-19
    critical: '#EF4444'    // <0
  }
};

// ============================================
// HELPERS
// ============================================
const getScoreColor = (score: number): string => {
  if (score >= 50) return NPS_COLORS.score.excellent;
  if (score >= 20) return NPS_COLORS.score.good;
  if (score >= 0) return NPS_COLORS.score.warning;
  return NPS_COLORS.score.critical;
};

const getScoreLabel = (score: number): string => {
  if (score >= 50) return 'Excelente';
  if (score >= 20) return 'Bueno';
  if (score >= 0) return 'Regular';
  return 'Crítico';
};

// ============================================
// 🆕 HELPER: COLOR TENDENCIA CONTEXTUAL
// ============================================
const getTrendColor = (delta: number | null, currentScore: number): string => {
  if (delta === null || delta === 0) return '#64748B'; // Slate: sin cambio
  
  if (delta > 0) {
    // Mejoró
    if (currentScore < 0) {
      return '#22D3EE';  // Cyan: mejoró PERO aún negativo
    }
    return '#10B981';    // Verde: mejoró Y está bien
  }
  
  return '#F59E0B';      // Amber: empeoró
};

// ============================================
// SUB-COMPONENTE: BIMODAL TOGGLE MINI
// ============================================
const BimodalToggleMini = memo(function BimodalToggleMini({
  activeMode,
  onModeChange,
  secondLabel = 'Por Gerencia'  // 🆕 PROP DINÁMICO
}: {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  secondLabel?: string;
}) {
  return (
    <div 
      className="inline-flex rounded-xl p-1 gap-1"
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(51, 65, 85, 0.5)'
      }}
    >
      <button
        onClick={() => onModeChange('resumen')}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light transition-all
          ${activeMode === 'resumen' 
            ? 'bg-cyan-500/20 text-cyan-400' 
            : 'text-slate-400 hover:text-slate-300'
          }
        `}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        <span>Resumen</span>
      </button>
      
      <button
        onClick={() => onModeChange('ranking')}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light transition-all
          ${activeMode === 'ranking' 
            ? 'bg-purple-500/20 text-purple-400' 
            : 'text-slate-400 hover:text-slate-300'
          }
        `}
      >
        <Trophy className="h-3.5 w-3.5" />
        <span>{secondLabel}</span>  {/* 🆕 LABEL DINÁMICO */}
      </button>
    </div>
  );
});

// ============================================
// SUB-COMPONENTE: NPS SCORE BAR (Barra desde centro 0)
// ============================================
const NPSScoreBar = memo(function NPSScoreBar({ 
  score, 
  delta
}: { 
  score: number; 
  delta: number | null;
}) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  
  // Calcular posición y ancho de la barra desde el centro
  const isPositive = score >= 0;
  const barWidth = Math.abs(score) / 2; // 100 = 50% del ancho total (mitad de la barra)
  
  const TrendIcon = delta === null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  
  // 🆕 COLOR TENDENCIA CONTEXTUAL
  const trendColor = getTrendColor(delta, score);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Score protagonista */}
      <div className="text-center mb-4">
        <motion.span 
          className="text-5xl font-semibold tracking-tight"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {score > 0 ? '+' : ''}{score}
        </motion.span>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          <div 
            className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
            style={{ 
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}30`
            }}
          >
            {label}
          </div>
          
          {delta !== null && (
            <span className="flex items-center gap-1 text-xs" style={{ color: trendColor }}>
              <TrendIcon className="h-3 w-3" />
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progreso desde el centro */}
      <div className="w-full max-w-[280px]">
        <div className="relative h-2 bg-slate-800/60 rounded-full overflow-hidden">
          {/* Barra que crece desde el centro */}
          <motion.div
            className="absolute top-0 h-full rounded-full"
            style={{ 
              backgroundColor: color,
              ...(isPositive 
                ? { left: '50%', width: `${barWidth}%` }
                : { right: '50%', width: `${barWidth}%` }
              )
            }}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          {/* Línea central (marca el 0) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-500/80 z-10"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Escala */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
          <span>-100</span>
          <span className="text-slate-400">0</span>
          <span>+100</span>
        </div>
      </div>

      {/* n=X eliminado - ya está en DistributionPanel */}
    </div>
  );
});

// ============================================
// SUB-COMPONENTE: PANEL DISTRIBUCIÓN
// ============================================
const DistributionPanel = memo(function DistributionPanel({
  promoters,
  passives,
  detractors,
  totalResponses
}: {
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}) {
  const total = promoters + passives + detractors;
  
  const items = useMemo(() => [
    { 
      label: 'Promotores', 
      count: promoters, 
      pct: total > 0 ? (promoters / total) * 100 : 0, 
      color: NPS_COLORS.promoter, 
      range: '9-10' 
    },
    { 
      label: 'Pasivos', 
      count: passives, 
      pct: total > 0 ? (passives / total) * 100 : 0, 
      color: NPS_COLORS.passive, 
      range: '7-8' 
    },
    { 
      label: 'Detractores', 
      count: detractors, 
      pct: total > 0 ? (detractors / total) * 100 : 0, 
      color: NPS_COLORS.detractor, 
      range: '0-6' 
    }
  ], [promoters, passives, detractors, total]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500 uppercase tracking-wider">Distribución</span>
        <span className="text-slate-600">n={totalResponses}</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 font-light">{item.label}</span>
                <span className="text-slate-600 text-[10px]">({item.range})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">{item.pct.toFixed(0)}%</span>
                <span className="text-slate-600 text-[10px]">({item.count})</span>
              </div>
            </div>
            
            <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// ============================================
// SUB-COMPONENTE: VISTA RANKING
// Backend ya filtra por RBAC, solo renderizamos
// ============================================
const RankingView = memo(function RankingView({
  data,
  emptyLabel = 'gerencias'
}: {
  data: NPSInsight[];
  /** Label para empty state */
  emptyLabel?: string;
}) {
  // Backend ya devuelve datos filtrados y agrupados correctamente
  const sortedItems = useMemo(() => {
    return [...data]
      .filter(d => d.department !== null) // Excluir el global
      .sort((a, b) => b.npsScore - a.npsScore);
  }, [data]);

  const top3 = sortedItems.slice(0, 3);
  const rest = sortedItems.slice(3);

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Sin datos de {emptyLabel} disponibles
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* Podio Top 3 */}
      <div className="flex items-end justify-center gap-3">
        {/* 2do lugar */}
        {top3[1] && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div 
              className="w-24 h-20 rounded-xl border flex flex-col items-center justify-center"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'rgba(51, 65, 85, 0.5)'
              }}
            >
              <span 
                className="text-2xl font-extralight"
                style={{ color: getScoreColor(top3[1].npsScore) }}
              >
                {top3[1].npsScore > 0 ? '+' : ''}{top3[1].npsScore}
              </span>
              <span className="text-[10px] text-slate-500">NPS</span>
            </div>
            <span className="text-cyan-400 text-xs mt-1.5">2°</span>
            <span className="text-slate-400 text-[11px] font-light truncate max-w-[96px] text-center">
              {top3[1].department?.displayName}
            </span>
          </motion.div>
        )}

        {/* 1er lugar */}
        {top3[0] && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center"
          >
            <div 
              className="w-28 h-28 rounded-xl border-2 flex flex-col items-center justify-center"
              style={{
                background: 'rgba(34, 211, 238, 0.05)',
                borderColor: 'rgba(34, 211, 238, 0.3)'
              }}
            >
              <span 
                className="text-3xl font-extralight"
                style={{ color: getScoreColor(top3[0].npsScore) }}
              >
                {top3[0].npsScore > 0 ? '+' : ''}{top3[0].npsScore}
              </span>
              <span className="text-[10px] text-slate-500">NPS</span>
            </div>
            <span className="text-cyan-400 text-xs mt-1.5">1°</span>
            <span className="text-slate-400 text-[11px] font-light truncate max-w-[112px] text-center">
              {top3[0].department?.displayName}
            </span>
          </motion.div>
        )}

        {/* 3er lugar */}
        {top3[2] && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div 
              className="w-24 h-16 rounded-xl border flex flex-col items-center justify-center"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'rgba(51, 65, 85, 0.5)'
              }}
            >
              <span 
                className="text-xl font-extralight"
                style={{ color: getScoreColor(top3[2].npsScore) }}
              >
                {top3[2].npsScore > 0 ? '+' : ''}{top3[2].npsScore}
              </span>
              <span className="text-[10px] text-slate-500">NPS</span>
            </div>
            <span className="text-slate-500 text-xs mt-1.5">3°</span>
            <span className="text-slate-400 text-[11px] font-light truncate max-w-[96px] text-center">
              {top3[2].department?.displayName}
            </span>
          </motion.div>
        )}
      </div>

      {/* Lista del resto */}
      {rest.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
          {rest.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-xs w-5">{String(index + 4).padStart(2, '0')}</span>
                <span className="text-slate-400 text-sm font-light truncate max-w-[200px]">
                  {item.department?.displayName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-light"
                  style={{ color: getScoreColor(item.npsScore) }}
                >
                  {item.npsScore > 0 ? '+' : ''}{item.npsScore}
                </span>
                {item.scoreDelta !== null && item.scoreDelta !== 0 && (
                  <span 
                    className="text-[10px]"
                    style={{ color: getTrendColor(item.scoreDelta, item.npsScore) }}
                  >
                    {item.scoreDelta > 0 ? '↑' : '↓'}{Math.abs(item.scoreDelta)}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// SUB-COMPONENTE: ALERTA CRÍTICA
// ============================================
const CriticalAlert = memo(function CriticalAlert({
  gerenciaName,
  delta,
  currentScore
}: {
  gerenciaName: string;
  delta: number;
  currentScore: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-3 rounded-xl border bg-amber-500/5 border-amber-500/20"
    >
      <div className="flex items-start gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 animate-pulse" />
        <div>
          <p className="text-xs text-amber-200/90 font-light">
            <span className="font-medium">{gerenciaName}</span> cayó {Math.abs(delta)} pts
          </p>
          <p className="text-[10px] text-amber-500/60 mt-0.5">
            NPS: {currentScore > 0 ? '+' : ''}{currentScore} · Requiere atención
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// SKELETON LOADING
// ============================================
const NPSOnboardingSkeleton = () => (
  <div className="animate-pulse max-w-[700px] mx-auto">
    <div 
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(51, 65, 85, 0.5)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-slate-800/50 rounded w-32" />
        <div className="h-8 bg-slate-800/50 rounded-xl w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <div className="w-52 h-36 bg-slate-800/50 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-slate-800/50 rounded" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default memo(function NPSOnboardingCard({
  viewMode = 'gerencias'
}: NPSOnboardingCardProps) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('resumen');
  
  // Label dinámico según viewMode
  const rankingLabel = viewMode === 'gerencias' ? 'Por Gerencia' : 'Por Departamento';
  
  // 🎯 groupBy dinámico: gerencia o department según viewMode
  const groupByParam = viewMode === 'gerencias' ? 'gerencia' : 'department';
  
  // Fetch datos
  const { data: globalData, loading: loadingGlobal } = useNPSData({ 
    product: 'onboarding', 
    period: 'latest' 
  });
  
  // 🎯 Aquí se aplica el groupBy dinámico
  const { data: rankingData, loading: loadingRanking } = useNPSData({ 
    product: 'onboarding', 
    groupBy: groupByParam 
  });
  
  const loading = loadingGlobal || loadingRanking;
  
  // Extraer insight global
  const globalInsight = useMemo(() => 
    globalData?.data?.find((d: NPSInsight) => d.departmentId === null),
    [globalData]
  );
  
  // Encontrar gerencia con mayor caída
  const criticalGerencia = useMemo(() => {
    if (!rankingData?.data) return null;
    const withDrop = rankingData.data
      .filter((d: NPSInsight) => d.department?.level === 2 && d.scoreDelta !== null && d.scoreDelta <= -10)
      .sort((a: NPSInsight, b: NPSInsight) => (a.scoreDelta || 0) - (b.scoreDelta || 0));
    return withDrop[0] || null;
  }, [rankingData]);
  
  // Período actual
  const currentPeriod = useMemo(() => {
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  // Loading
  if (loading) {
    return <NPSOnboardingSkeleton />;
  }

  // Empty state
  if (!globalInsight) {
    return (
      <div className="max-w-[700px] mx-auto">
        <div 
          className="rounded-2xl p-10 text-center"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)'
          }}
        >
          <p className="text-slate-400 font-light">Sin datos NPS disponibles</p>
          <p className="text-slate-500 text-sm mt-2">
            Los datos se generan al completar encuestas de onboarding
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          backdropFilter: 'blur(40px)'
        }}
      >
        {/* Línea Tesla superior */}
        <div className="fhr-top-line" />
        {/* Header con BimodalToggle */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-light text-white">eNPS Onboarding</h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentPeriod}</p>
          </div>
          
          <BimodalToggleMini 
            activeMode={internalViewMode}
            onModeChange={setInternalViewMode}
            secondLabel={rankingLabel}  // 🆕 LABEL DINÁMICO
          />
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {internalViewMode === 'resumen' ? (
              <motion.div
                key="resumen"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Izquierda: Score Bar */}
                  <div className="flex justify-center">
                    <NPSScoreBar 
                      score={globalInsight.npsScore}
                      delta={globalInsight.scoreDelta}
                    />
                  </div>

                  {/* Derecha: Distribución */}
                  <DistributionPanel 
                    promoters={globalInsight.promoters}
                    passives={globalInsight.passives}
                    detractors={globalInsight.detractors}
                    totalResponses={globalInsight.totalResponses}
                  />
                </div>

                {/* Alerta crítica (solo en resumen) */}
                {criticalGerencia && (
                  <CriticalAlert 
                    gerenciaName={criticalGerencia.department?.displayName || 'Gerencia'}
                    delta={criticalGerencia.scoreDelta || 0}
                    currentScore={criticalGerencia.npsScore}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* RankingView - datos ya vienen filtrados del backend */}
                <RankingView 
                  data={rankingData?.data || []} 
                  emptyLabel={viewMode === 'gerencias' ? 'gerencias' : 'departamentos'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});