// ====================================================================
// VISTA OPERACIONAL - ONBOARDING BY DEPARTAMENTOS
// src/app/dashboard/onboarding/executive/page.tsx
// v3.2 - Gauge compacto + UN CTA claro + lista unificada
// FILOSOFÍA: "Above fold = Decisión en 3 segundos"
// ====================================================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  LayoutDashboard,
  Trophy,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Navegación
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// Componentes
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import VerticalTabsNav, { TabItem } from '@/components/ui/VerticalTabsNav';
import GerenciaOnboardingBimodal from '@/components/onboarding/GerenciaOnboardingBimodal';
import AlertasGerenciaRanking from '@/components/onboarding/AlertasGerenciaRanking';
import NPSOnboardingCard from '@/components/onboarding/NPSOnboardingCard';


// Hook y tipos
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import { isGlobalDashboard } from '@/types/onboarding';
import type { OnboardingDashboardData } from '@/types/onboarding';

// ====================================================================
// CONSTANTES
// ====================================================================

const GLOBAL_ROLES = ['CEO', 'HR_ADMIN', 'HR_MANAGER', 'ACCOUNT_OWNER', 'FOCALIZAHR_ADMIN'];

type TabValue = 'resumen' | 'ranking' | 'alertas' | 'enps';

const TABS_CONFIG: TabItem<TabValue>[] = [
  { value: 'resumen', label: 'Resumen', icon: LayoutDashboard, color: 'cyan' },
  { value: 'ranking', label: 'Ranking', icon: Trophy, color: 'cyan' },
  { value: 'alertas', label: 'Alertas', icon: AlertTriangle, color: 'amber' },
  { value: 'enps', label: 'eNPS', icon: BarChart3, color: 'purple' }
];

// ====================================================================
// HELPERS - Clasificación semántica
// ====================================================================

const getScoreClassification = (score: number) => {
  if (score >= 80) return { label: 'EXCELENTE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
  if (score >= 60) return { label: 'BUENO', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.1)' };
  if (score >= 40) return { label: 'REGULAR', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
  return { label: 'CRÍTICO', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
};

const getInsightMessage = (score: number, benchmark: number) => {
  const diff = score - benchmark;
  if (diff >= 10) return 'Muy por encima del mercado. Mantén el ritmo.';
  if (diff >= 0) return 'Alineado con el mercado. Hay espacio para destacar.';
  if (diff >= -10) return 'Ligeramente bajo promedio. Oportunidad de mejora.';
  return 'Tu onboarding tiene fricciones. Los nuevos talentos lo sienten.';
};

// ====================================================================
// INTERFACES
// ====================================================================

interface AccumulatedDepartment {
  id: string;
  displayName: string;
  standardCategory: string;
  accumulatedExoScore: number | null;
  accumulatedExoJourneys: number | null;
  accumulatedPeriodCount: number | null;
  level?: number;
  parentId?: string | null;
  unitType?: string;
  criticalAlerts?: number;
  exoScoreTrend?: number;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function OnboardingExecutiveView() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const { data, loading, error, refetch } = useOnboardingMetrics();

  const userRole: string = 'CEO';
  const userDepartmentId: string | null = null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !isGlobalDashboard(data)) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen px-4">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
              <p className="text-slate-300">Error cargando datos</p>
              <button 
                onClick={() => refetch()}
                className="px-6 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ExecutiveContent 
      data={data}
      loading={loading}
      refetch={refetch}
      isCollapsed={isCollapsed}
      userRole={userRole}
      userDepartmentId={userDepartmentId}
    />
  );
}

// ====================================================================
// CONTENIDO
// ====================================================================

interface ExecutiveContentProps {
  data: OnboardingDashboardData;
  loading: boolean;
  refetch: () => void;
  isCollapsed: boolean;
  userRole: string;
  userDepartmentId: string | null;
}

function ExecutiveContent({
  data,
  loading,
  refetch,
  isCollapsed,
  userRole,
  userDepartmentId
}: ExecutiveContentProps) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabValue>('resumen');
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(true);

  const showGerenciaFilter = GLOBAL_ROLES.includes(userRole);

  // Gerencias disponibles
  const gerenciasDisponibles = useMemo(() => {
    if (!showGerenciaFilter) return [];
    const depts = data.accumulated?.departments as AccumulatedDepartment[] | undefined;
    if (!depts) return [];
    return depts
      .filter((d) => d.level === 2 || d.unitType === 'gerencia')
      .map((d) => ({ id: d.id, name: d.displayName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.accumulated?.departments, showGerenciaFilter]);

  // Departamentos filtrados y ordenados
  const departamentosFiltrados = useMemo(() => {
    const depts = data.accumulated?.departments as AccumulatedDepartment[] | undefined;
    if (!depts) return [];
    
    let filtered = depts;
    if (selectedGerenciaId) {
      filtered = depts.filter(d => 
        (d.level === 3 || d.unitType === 'departamento') && 
        d.parentId === selectedGerenciaId
      );
    } else {
      filtered = depts.filter(d => d.level === 3 || d.unitType === 'departamento');
    }

    return filtered
      .filter(d => d.accumulatedExoScore !== null)
      .sort((a, b) => (b.accumulatedExoScore || 0) - (a.accumulatedExoScore || 0));
  }, [data.accumulated?.departments, selectedGerenciaId]);

  // Departamento crítico (peor score)
  const criticalDepartment = useMemo(() => {
    if (departamentosFiltrados.length === 0) return null;
    return departamentosFiltrados[departamentosFiltrados.length - 1];
  }, [departamentosFiltrados]);

  // Datos calculados
  const { accumulated, global } = data;
  const scoreForGauge = accumulated?.globalExoScore ?? global?.avgEXOScore ?? 0;
  const totalJourneys = accumulated?.totalJourneys ?? global?.totalActiveJourneys ?? 0;
  const criticalAlerts = global?.criticalAlerts || 0;
  const benchmark = 62; // TODO: Traer de API

  const classification = getScoreClassification(scoreForGauge);
  const insightMessage = getInsightMessage(scoreForGauge, benchmark);
  const vsMarket = scoreForGauge - benchmark;

  // Tabs con badge
  const tabsWithBadges = useMemo(() => 
    TABS_CONFIG.map(tab => 
      tab.value === 'alertas' && criticalAlerts > 0
        ? { ...tab, badge: criticalAlerts }
        : tab
    ),
    [criticalAlerts]
  );

  // ================================================================
  // RENDER
  // ================================================================
  
  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      <DashboardNavigation />
      
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
        <div className="p-4 md:p-6 lg:p-8">
          
          {/* ══════════════════════════════════════════════════════
              HEADER COMPACTO
             ══════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/dashboard/onboarding')}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-light text-white">Vista Operacional</h1>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">DEPTOS</Badge>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filtro gerencia */}
          {showGerenciaFilter && gerenciasDisponibles.length > 0 && (
            <div className="relative mb-4 max-w-xs">
              <select
                value={selectedGerenciaId || ''}
                onChange={(e) => setSelectedGerenciaId(e.target.value || null)}
                className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Todas las gerencias</option>
                {gerenciasDisponibles.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              LAYOUT: TABS + CONTENIDO
             ══════════════════════════════════════════════════════ */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            
            {/* TABS */}
            <VerticalTabsNav
              tabs={tabsWithBadges}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* CONTENIDO */}
            <div className="flex-1 min-w-0 space-y-4">
              
              {/* ════════════════════════════════════════════════
                  TAB: RESUMEN - ABOVE THE FOLD = DECISIÓN
                 ════════════════════════════════════════════════ */}
              {activeTab === 'resumen' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* ═══════════════════════════════════════════════
                      HERO: Score + Insight + CTA (UN protagonista)
                     ═══════════════════════════════════════════════ */}
                  <div 
                    className="relative rounded-2xl p-4 md:p-6 overflow-hidden"
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(51, 65, 85, 0.4)',
                    }}
                  >
                    {/* Línea Tesla */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)` }}
                    />

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      
                      {/* Gauge COMPACTO (no gigante) */}
                      <div className="flex-shrink-0">
                        <EXOScoreGauge 
                          score={scoreForGauge}
                          label="EXO Score"
                          size="md"  // ← CAMBIO: de "lg" a "md"
                          standardCategory="ALL"
                          country="CL"
                        />
                      </div>

                      {/* Insight + CTA */}
                      <div className="flex-1 text-center md:text-left">
                        {/* Clasificación semántica */}
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                          <Badge 
                            className="text-xs font-semibold"
                            style={{ backgroundColor: classification.bg, color: classification.color, border: 'none' }}
                          >
                            {classification.label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {vsMarket >= 0 ? '+' : ''}{vsMarket.toFixed(0)}% vs mercado CL
                          </span>
                        </div>

                        {/* Mensaje insight */}
                        <p className="text-sm text-slate-300 mb-3">
                          {insightMessage}
                        </p>

                        {/* Mini stats */}
                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {totalJourneys} journeys
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className={`h-3 w-3 ${criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                            {criticalAlerts} alertas
                          </span>
                          <span>{departamentosFiltrados.length} deptos</span>
                        </div>

                        {/* ═══════════════════════════════════════════
                            UN CTA CLARO - El más importante
                           ═══════════════════════════════════════════ */}
                        {criticalDepartment && criticalDepartment.accumulatedExoScore && criticalDepartment.accumulatedExoScore < 60 && (
                          <button
                            onClick={() => router.push(`/dashboard/onboarding/alerts?departmentId=${criticalDepartment.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#EF4444'
                            }}
                          >
                            Intervenir en {criticalDepartment.displayName}
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════
                      LISTA UNIFICADA (Score + Journeys + Trend + Alertas)
                      Sin "Ver Compliance" separado
                     ═══════════════════════════════════════════════ */}
                  <div>
                    <button
                      onClick={() => setIsListExpanded(!isListExpanded)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl transition-all group"
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(51, 65, 85, 0.4)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-purple-400" />
                        <span className="text-white font-medium">Mis Departamentos</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {departamentosFiltrados.length}
                        </Badge>
                      </div>
                      <motion.div
                        animate={{ rotate: isListExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-purple-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isListExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div 
                            className="mt-2 rounded-2xl overflow-hidden"
                            style={{
                              background: 'rgba(15, 23, 42, 0.4)',
                              border: '1px solid rgba(51, 65, 85, 0.3)',
                            }}
                          >
                            {/* Línea Tesla */}
                            <div 
                              className="h-px w-full"
                              style={{ background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)' }}
                            />

                            {/* Header de tabla */}
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 border-b border-slate-800/50">
                              <div className="col-span-1">#</div>
                              <div className="col-span-5">Departamento</div>
                              <div className="col-span-2 text-center">Journeys</div>
                              <div className="col-span-2 text-center">Trend</div>
                              <div className="col-span-2 text-right">Score</div>
                            </div>

                            {/* Lista */}
                            <div className="max-h-[300px] overflow-y-auto">
                              {departamentosFiltrados.map((dept, index) => {
                                const score = dept.accumulatedExoScore || 0;
                                const journeys = dept.accumulatedExoJourneys || 0;
                                const alerts = dept.criticalAlerts || 0;
                                const trendVal = dept.exoScoreTrend;
                                const trend = trendVal && trendVal > 1 ? 'up' : trendVal && trendVal < -1 ? 'down' : 'stable';
                                const scoreClass = getScoreClassification(score);

                                return (
                                  <div 
                                    key={dept.id}
                                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/onboarding/alerts?departmentId=${dept.id}`)}
                                  >
                                    {/* Rank */}
                                    <div className="col-span-1">
                                      <span className="text-slate-600 text-sm">{index + 1}</span>
                                    </div>

                                    {/* Nombre + alertas */}
                                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                                      <span className="text-white text-sm truncate">{dept.displayName}</span>
                                      {alerts > 0 && (
                                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                                          {alerts}
                                        </span>
                                      )}
                                    </div>

                                    {/* Journeys */}
                                    <div className="col-span-2 text-center">
                                      <span className="text-slate-400 text-sm">{journeys}</span>
                                    </div>

                                    {/* Trend */}
                                    <div className="col-span-2 flex justify-center">
                                      {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                                      {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
                                      {trend === 'stable' && <Minus className="h-4 w-4 text-slate-500" />}
                                    </div>

                                    {/* Score */}
                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                      <span 
                                        className="text-sm font-medium tabular-nums"
                                        style={{ color: scoreClass.color }}
                                      >
                                        {score.toFixed(0)}
                                      </span>
                                      <ChevronRight className="h-4 w-4 text-slate-600" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CTAs secundarios (menos prominentes) */}
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => router.push('/dashboard/onboarding/pipeline')}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      Ver Pipeline
                    </button>
                    <span className="text-slate-700">·</span>
                    <button
                      onClick={() => router.push('/dashboard/onboarding/alerts')}
                      className="text-sm text-slate-500 hover:text-purple-400 transition-colors"
                    >
                      Centro Alertas
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                  TAB: RANKING (componente existente)
                 ════════════════════════════════════════════════ */}
              {activeTab === 'ranking' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GerenciaOnboardingBimodal 
                    data={data}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                  TAB: ALERTAS (componente existente)
                 ════════════════════════════════════════════════ */}
              {activeTab === 'alertas' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertasGerenciaRanking />
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════
                  TAB: eNPS (componente existente)
                 ════════════════════════════════════════════════ */}
              {activeTab === 'enps' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NPSOnboardingCard viewMode="gerencias" />
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}