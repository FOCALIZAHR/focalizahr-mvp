// ====================================================================
// VISTA OPERACIONAL - ONBOARDING BY DEPARTAMENTOS
// src/app/dashboard/onboarding/executive/page.tsx
// v5.0 - Layout FocalizaHR + Selector Gerencias RBAC
// 
// FILOSOFÍA: 
// - Página = Orquestador (coordina, no implementa)
// - Auth = meta del backend (no mocks, no localStorage)
// - Componentes = Bimodales con viewMode + scope
// - Estilos = Solo clases .fhr-* + Design System FocalizaHR
//
// CAMBIOS v5.0:
// - Layout clon de /dashboard/onboarding (fondos blur, línea Tesla)
// - Selector de gerencias para CEO/HR/Admin
// - AREA_MANAGER ve badge fijo (sin selector)
// - Responsive mejorado
// ====================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  ArrowLeft, 
  AlertTriangle,
  LayoutDashboard,
  Trophy,
  BarChart3,
  Users,
  Building2,
  ChevronDown
} from 'lucide-react';

// ====================================================================
// NAVEGACIÓN Y LAYOUT
// ====================================================================
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ====================================================================
// COMPONENTES BIMODALES
// ====================================================================
import VerticalTabsNav, { TabItem } from '@/components/ui/VerticalTabsNav';
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import GerenciaOnboardingBimodal from '@/components/onboarding/GerenciaOnboardingBimodal';
import AlertasGerenciaRanking from '@/components/onboarding/AlertasGerenciaRanking';
import NPSOnboardingCard from '@/components/onboarding/NPSOnboardingCard';
import OnboardingScoreClassificationCard from '@/components/onboarding/OnboardingScoreClassificationCard';
import BalanceDepartmentalCard from '@/components/onboarding/BalanceDepartmentalCard';
import ComplianceEfficiencyMatrix from '@/components/onboarding/ComplianceEfficiencyMatrix';

// ====================================================================
// HOOKS
// ====================================================================
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import { isGlobalDashboard } from '@/types/onboarding';

// ====================================================================
// TYPES
// ====================================================================
type TabValue = 'resumen' | 'equipos' | 'ranking' | 'alertas' | 'enps';

const TABS_CONFIG: TabItem<TabValue>[] = [
  { value: 'resumen', label: 'Resumen', icon: LayoutDashboard, color: 'cyan' },
  { value: 'equipos', label: 'Equipos', icon: Users, color: 'cyan' },
  { value: 'ranking', label: 'Ranking', icon: Trophy, color: 'cyan' },
  { value: 'alertas', label: 'Alertas', icon: AlertTriangle, color: 'amber' },
  { value: 'enps', label: 'eNPS', icon: BarChart3, color: 'purple' }
];

// Roles que pueden ver selector de gerencias
const ROLES_WITH_GERENCIA_SELECTOR = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'CEO',
  'HR_MANAGER',
  'CLIENT' // Compatibilidad sistema antiguo
];

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function OnboardingExecutivePage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabValue>('resumen');
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<string | null>(null);
  
  // ══════════════════════════════════════════════════════════════════
  // HOOK CON scope='filtered' - RBAC automático del backend
  // ══════════════════════════════════════════════════════════════════
  const { data, loading, error, refetch } = useOnboardingMetrics(undefined, 'filtered');
  
  // ══════════════════════════════════════════════════════════════════
  // ESTADOS: LOADING
  // ══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" strokeWidth={1.5} />
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS: ERROR o datos inválidos
  // ══════════════════════════════════════════════════════════════════
  if (error || !isGlobalDashboard(data)) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen px-4">
            <div className="fhr-card p-8 text-center space-y-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" strokeWidth={1.5} />
              <p className="text-slate-300">Error cargando datos</p>
              <button 
                onClick={() => refetch()}
                className="fhr-btn fhr-btn-secondary"
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MÉTRICAS Y META (después del type guard)
  // ══════════════════════════════════════════════════════════════════
  const userDepartmentId = data.meta?.userDepartmentId;
  const userRole = data.meta?.userRole || '';
  
  // Derivar nombre del departamento del usuario desde accumulated.departments
  const userDepartmentName = data.accumulated?.departments?.find(
    d => d.id === userDepartmentId
  )?.displayName || '';
  
  // ══════════════════════════════════════════════════════════════════
  // SELECTOR DE GERENCIAS - Solo para roles ejecutivos
  // ══════════════════════════════════════════════════════════════════
  const canSelectGerencia = ROLES_WITH_GERENCIA_SELECTOR.includes(userRole);
  
  // Extraer gerencias (nivel 2) de los datos
  const gerencias = (data?.accumulated?.departments || [])
    .filter(d => d.level === 2 || d.unitType === 'gerencia')
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  // ══════════════════════════════════════════════════════════════════
  // GERENCIA EFECTIVA (selector O RBAC del usuario)
  // ══════════════════════════════════════════════════════════════════
  const effectiveGerenciaId = selectedGerenciaId || userDepartmentId;
  
  // Buscar la gerencia seleccionada en los datos YA AGREGADOS del backend
  const selectedGerenciaData = effectiveGerenciaId
    ? data.accumulated?.departments?.find(d => d.id === effectiveGerenciaId)
    : null;
  
  // Nombre de la gerencia seleccionada
  const selectedGerenciaName = selectedGerenciaData?.displayName || '';
  
  // ══════════════════════════════════════════════════════════════════
  // MÉTRICAS - Usar datos de gerencia seleccionada O globales
  // (El backend YA calculó todo, frontend solo SELECCIONA)
  // ══════════════════════════════════════════════════════════════════
  const scoreForGauge = selectedGerenciaData?.accumulatedExoScore 
    ?? data.accumulated?.globalExoScore 
    ?? data.global?.avgEXOScore 
    ?? 0;
  
  const totalJourneys = selectedGerenciaData?.accumulatedExoJourneys 
    ?? data.accumulated?.totalJourneys 
    ?? data.global?.totalActiveJourneys 
    ?? 0;
  
  const periodCount = selectedGerenciaData?.accumulatedPeriodCount 
    ?? data.accumulated?.periodCount 
    ?? 1;
  
  // Alertas críticas (TODO: el backend debería filtrar por gerencia también)
  const criticalAlerts = data.live?.criticalAlerts || data.global?.criticalAlerts || 0;
  
  // ══════════════════════════════════════════════════════════════════
  // TOP/BOTTOM INFLUENCER
  // Si hay gerencia seleccionada → mostrar sus departamentos hijos con contribution calculado
  // Si no → mostrar global del backend
  // ══════════════════════════════════════════════════════════════════
  const { topInfluencer, bottomImpact } = (() => {
    if (!effectiveGerenciaId) {
      // Sin filtro: usar global del backend
      return {
        topInfluencer: data.accumulated?.departmentImpact?.topInfluencer ?? null,
        bottomImpact: data.accumulated?.departmentImpact?.bottomImpact ?? null
      };
    }
    
    // Con filtro: buscar departamentos HIJOS de la gerencia
    const hijos = (data.accumulated?.departments || [])
      .filter(d => d.parentId === effectiveGerenciaId && d.accumulatedExoScore > 0);
    
    if (hijos.length === 0) {
      return { topInfluencer: null, bottomImpact: null };
    }
    
    // Calcular contribution de cada hijo respecto al score de la gerencia
    // Fórmula: (score_hijo - score_gerencia) × (journeys_hijo / total_journeys_gerencia)
    const gerenciaScore = selectedGerenciaData?.accumulatedExoScore || 0;
    const gerenciaTotalJourneys = selectedGerenciaData?.accumulatedExoJourneys || 1;
    
    const hijosWithContribution = hijos.map(hijo => {
      const hijoScore = hijo.accumulatedExoScore || 0;
      const hijoJourneys = hijo.accumulatedExoJourneys || 0;
      
      const contribution = (hijoScore - gerenciaScore) * (hijoJourneys / gerenciaTotalJourneys);
      
      return {
        departmentId: hijo.id,
        departmentName: hijo.displayName,
        score: hijoScore,
        journeys: hijoJourneys,
        contribution: parseFloat(contribution.toFixed(2))
      };
    });
    
    // Ordenar por contribution (mayor a menor)
    hijosWithContribution.sort((a, b) => b.contribution - a.contribution);
    
    return {
      topInfluencer: hijosWithContribution[0] || null,
      bottomImpact: hijosWithContribution[hijosWithContribution.length - 1] || null
    };
  })();
  
  // ══════════════════════════════════════════════════════════════════
  // FILTRAR COMPLIANCE DATA POR GERENCIA
  // ══════════════════════════════════════════════════════════════════
  const allComplianceData = data.complianceEfficiency || [];
  const complianceData = !effectiveGerenciaId 
    ? allComplianceData 
    : allComplianceData.filter(dept => {
        if (dept.departmentId === effectiveGerenciaId) return true;
        // @ts-ignore - parentId puede existir en el tipo extendido
        if (dept.parentId === effectiveGerenciaId) return true;
        return false;
      });
  
  // ══════════════════════════════════════════════════════════════════
  // TABS CON BADGE DE ALERTAS
  // ══════════════════════════════════════════════════════════════════
  const tabsWithBadges = TABS_CONFIG.map(tab => 
    tab.value === 'alertas' && criticalAlerts > 0
      ? { ...tab, badge: criticalAlerts }
      : tab
  );

  // ══════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen fhr-bg-main flex relative">
      
      {/* ════════════════════════════════════════════════════════════
          FONDOS BLUR - Signature FocalizaHR
         ════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>
      
      <DashboardNavigation />
      
      <main className={`
        flex-1 relative z-10
        transition-all duration-300 
        ${isCollapsed ? 'ml-20' : 'ml-72'}
      `}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          
          {/* ════════════════════════════════════════════════════════
              HEADER - Estilo FocalizaHR con línea Tesla
             ════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            {/* Navegación superior */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/dashboard/onboarding')}
                className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
              
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              </button>
            </div>
            
            {/* Título con gradiente */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-tight mb-3">
                Vista{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  Operacional
                </span>
              </h1>
              
              {/* Línea Tesla - Signature FocalizaHR */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
              </div>
              
              <p className="text-sm sm:text-base text-slate-500 font-light">
                Análisis por departamentos
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              SELECTOR DE GERENCIA - Solo CEO/HR/Admin
             ════════════════════════════════════════════════════════ */}
          {canSelectGerencia && gerencias.length > 1 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                </div>
                
                <select
                  value={selectedGerenciaId || ''}
                  onChange={(e) => setSelectedGerenciaId(e.target.value || null)}
                  className="
                    appearance-none
                    bg-slate-800/50 backdrop-blur-sm
                    border border-slate-700/50 hover:border-cyan-500/30
                    rounded-xl pl-10 pr-10 py-3
                    text-white text-sm font-medium
                    cursor-pointer
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
                    min-w-[260px]
                  "
                >
                  <option value="" className="bg-slate-900">
                    Todas las Gerencias
                  </option>
                  {gerencias.map((g) => (
                    <option key={g.id} value={g.id} className="bg-slate-900">
                      {g.displayName}
                    </option>
                  ))}
                </select>
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* Badge fijo para AREA_MANAGER */}
          {!canSelectGerencia && userDepartmentName && (
            <div className="flex justify-center mb-6">
              <div className="
                flex items-center gap-2 
                bg-slate-800/30 border border-slate-700/30 
                rounded-xl px-4 py-2.5
              ">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-slate-300 font-medium">
                  {userDepartmentName}
                </span>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              LAYOUT: TABS + CONTENIDO
             ════════════════════════════════════════════════════════ */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            
            {/* TABS VERTICALES */}
            <VerticalTabsNav
              tabs={tabsWithBadges}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* CONTENIDO */}
            <div className="flex-1 min-w-0">
              
              {/* ══════════════════════════════════════════════════
                  TAB: RESUMEN
                 ══════════════════════════════════════════════════ */}
              {activeTab === 'resumen' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Hero: Gauge izquierda + Cards apiladas derecha */}
                  <div className="fhr-card p-4 sm:p-6">
                    <div className="fhr-top-line" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Gauge - Protagonista (centrado verticalmente) */}
                      <div className="flex items-center justify-center">
                        <EXOScoreGauge 
                          score={scoreForGauge}
                          label="EXO Score"
                          size="md"
                          standardCategory="ALL"
                          country="CL"
                        />
                      </div>
                      
                      {/* Cards apiladas verticalmente */}
                      <div className="flex flex-col gap-4">
                        <OnboardingScoreClassificationCard 
                          score={scoreForGauge}
                          periodCount={periodCount}
                          totalJourneys={totalJourneys}
                          companyName={selectedGerenciaName || userDepartmentName || 'tu área'}
                        />
                        
                        <BalanceDepartmentalCard 
                          topInfluencer={topInfluencer}
                          bottomImpact={bottomImpact}
                        />
                      </div>
                    </div>
                    
                    {/* Mini stats */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-slate-800/50">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <Users className="h-4 w-4" strokeWidth={1.5} />
                        <span>{totalJourneys} journeys activos</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <AlertTriangle 
                          className={`h-4 w-4 ${criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`} 
                          strokeWidth={1.5} 
                        />
                        <span>{criticalAlerts} alertas críticas</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTAs secundarios */}
                  <div className="flex items-center justify-center gap-3">
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

              {/* ══════════════════════════════════════════════════════
                  TAB: EQUIPOS (ComplianceEfficiencyMatrix)
                 ══════════════════════════════════════════════════════ */}
              {activeTab === 'equipos' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ComplianceEfficiencyMatrix 
                    departments={complianceData}
                    loading={loading}
                  />
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: RANKING (viewMode=departamentos)
                 ══════════════════════════════════════════════════ */}
              {activeTab === 'ranking' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GerenciaOnboardingBimodal 
                    data={data}
                    loading={loading}
                    viewMode="departamentos"
                    parentDepartmentId={selectedGerenciaId || userDepartmentId || undefined}
                  />
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: ALERTAS (scope=filtered)
                 ══════════════════════════════════════════════════ */}
              {activeTab === 'alertas' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertasGerenciaRanking 
                    viewMode="departamentos"
                    scope="filtered"
                    parentDepartmentId={selectedGerenciaId || userDepartmentId || undefined}
                  />
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: eNPS (scope=filtered + parentDepartmentId)
                 ══════════════════════════════════════════════════ */}
              {activeTab === 'enps' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NPSOnboardingCard 
                    viewMode="departamentos"
                    scope="filtered"
                    parentDepartmentId={selectedGerenciaId || userDepartmentId || undefined}
                  />
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}