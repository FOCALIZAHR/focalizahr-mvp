'use client';

// src/app/dashboard/onboarding/pipeline/page.tsx
// ============================================================================
// PIPELINE ONBOARDING - DISEÑO PREMIUM FOCALIZAHR
// Inspirado en: WelcomeScreen.tsx, Hub de Carga, GUIA_MAESTRA_DISEÑO
// ============================================================================

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  FileText,
  Shield,
  Lightbulb,
  Star
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// 🆕 NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// Mapa de iconos para stages
const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Shield,
  Lightbulb,
  Users,
  Star
};

// Hooks y componentes del proyecto
import { useOnboardingJourneys, STAGE_CONFIG } from '@/hooks/useOnboardingJourneys';
import type { Journey } from '@/hooks/useOnboardingJourneys';
import PipelineKanban from '@/components/onboarding/PipelineKanban';
import PipelineJourneyDetailModal from '@/components/onboarding/PipelineJourneyDetailModal';

// ============================================================================
// TIPOS
// ============================================================================

type FilterStatus = 'active' | 'completed' | 'abandoned' | null;
type FilterRisk = 'critical' | 'high' | 'medium' | 'low' | null;

// ============================================================================
// ANIMACIONES (Framer Motion - estilo FocalizaHR)
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

// ============================================================================
// COMPONENTE: METRIC CARD PREMIUM
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'cyan' | 'yellow' | 'green' | 'red';
  delay?: number;
}

const MetricCard = memo(function MetricCard({ 
  icon, 
  label, 
  value, 
  color,
  delay = 0 
}: MetricCardProps) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/20',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`
        relative overflow-hidden
        bg-slate-900/50 backdrop-blur-xl
        border border-slate-700/50
        rounded-2xl p-6
        transition-all duration-300
        hover:border-slate-600/50
        hover:shadow-lg hover:shadow-black/20
      `}
    >
      {/* Gradient overlay sutil */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-30`} />
      
      <div className="relative flex items-center gap-4">
        <div className={`
          w-12 h-12 rounded-xl 
          bg-gradient-to-br ${colorClasses[color]}
          flex items-center justify-center
        `}>
          {icon}
        </div>
        
        <div>
          <p className="text-3xl font-light text-white">{value}</p>
          <p className="text-sm text-slate-400 font-light">{label}</p>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// COMPONENTE: STAGE INDICATOR (Mini pills)
// ============================================================================

interface StageIndicatorProps {
  stages: typeof STAGE_CONFIG;
  counts: Map<number, number>;
}

const StageIndicator = memo(function StageIndicator({ stages, counts }: StageIndicatorProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-3 flex-wrap"
    >
      {stages.map((stage) => {
        const IconComponent = STAGE_ICONS[stage.icon];
        const colorClasses: Record<string, string> = {
          slate: 'text-slate-400',
          cyan: 'text-cyan-400',
          blue: 'text-blue-400',
          purple: 'text-purple-400',
          green: 'text-emerald-400'
        };
        
        return (
          <div 
            key={stage.stage}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full"
          >
            {IconComponent && (
              <IconComponent className={`w-3.5 h-3.5 ${colorClasses[stage.color]}`} />
            )}
            <span className="text-xs text-slate-400">{stage.shortTitle}:</span>
            <span className="text-xs font-medium text-white">{counts.get(stage.stage) || 0}</span>
          </div>
        );
      })}
    </motion.div>
  );
});

// ============================================================================
// COMPONENTE: FILTER DROPDOWN PREMIUM
// ============================================================================

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const FilterSelect = memo(function FilterSelect({ 
  label, 
  value, 
  options, 
  onChange 
}: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          appearance-none
          bg-slate-800/50 backdrop-blur-sm
          border border-slate-700/50
          rounded-xl px-4 py-2.5 pr-10
          text-sm text-white
          focus:outline-none focus:border-cyan-500/50
          transition-all duration-300
          cursor-pointer
          hover:bg-slate-800/70
        "
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
});

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function PipelineOnboardingPage() {
  const router = useRouter();
  
  // ═══════════════════════════════════════════════════════════════
  // 🆕 NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════
  const { isCollapsed } = useSidebar();
  
  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [riskFilter, setRiskFilter] = useState<FilterRisk>(null);
  
  // Estado del modal
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  
  // Hook de datos
  const { 
    journeys,
    journeysByStage, 
    stats,
    loading, 
    error,
    refetch,
    lastUpdated
  } = useOnboardingJourneys({
    status: statusFilter || undefined,
    riskLevel: riskFilter || undefined,
    autoRefresh: true,
    refreshInterval: 60000
  });

  // Conteos por stage
  const stageCounts = useMemo(() => {
    const counts = new Map<number, number>();
    journeysByStage.forEach((journeys, stage) => {
      counts.set(stage, journeys.length);
    });
    return counts;
  }, [journeysByStage]);

  // Handlers
  const handleJourneyClick = (journey: Journey) => {
    setSelectedJourney(journey);
  };

  const handleCloseModal = () => {
    setSelectedJourney(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // 🆕 RENDER CON NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Background pattern sutil */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(167, 139, 250, 0.03) 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative max-w-[1600px] mx-auto px-6 py-8">
          
          {/* ============================================
              HEADER PREMIUM
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            {/* Nav superior */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-slate-800/30 backdrop-blur-sm
                  border border-slate-700/50 rounded-xl
                  text-sm text-slate-400
                  hover:text-white hover:border-slate-600
                  transition-all duration-300
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              {/* Filtros */}
              <div className="flex items-center gap-3">
                <FilterSelect
                  label="Estado"
                  value={statusFilter || 'active'}
                  options={[
                    { value: 'active', label: 'Activos' },
                    { value: 'completed', label: 'Completados' },
                    { value: 'abandoned', label: 'Abandonados' }
                  ]}
                  onChange={(v) => setStatusFilter(v as FilterStatus)}
                />
                
                <FilterSelect
                  label="Riesgo"
                  value={riskFilter || 'all'}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'critical', label: 'Crítico' },
                    { value: 'high', label: 'Alto' },
                    { value: 'medium', label: 'Medio' },
                    { value: 'low', label: 'Bajo' }
                  ]}
                  onChange={(v) => setRiskFilter(v === 'all' ? null : v as FilterRisk)}
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => refetch()}
                  disabled={loading}
                  className="
                    p-2.5 rounded-xl
                    bg-cyan-500/10 border border-cyan-500/30
                    text-cyan-400
                    hover:bg-cyan-500/20
                    disabled:opacity-50
                    transition-all duration-300
                  "
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Título con gradiente */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  Vista Kanban • {journeys.length} journeys
                </span>
                {lastUpdated && (
                  <span className="text-xs text-slate-500">
                    • Actualizado {lastUpdated.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <h1 className="text-6xl font-light text-white mb-2">
                Pipeline{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Onboarding
                </span>
              </h1>
              <p className="text-slate-400 font-light">
                Monitoreo en tiempo real del proceso de integración
              </p>
            </div>
          </motion.div>

          {/* ============================================
              MÉTRICAS PREMIUM
              ============================================ */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <MetricCard
              icon={<Users className="w-5 h-5 text-cyan-400" />}
              label="Total Activos"
              value={stats?.totalActive || 0}
              color="cyan"
              delay={0}
            />
            <MetricCard
              icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />}
              label="En Riesgo"
              value={(stats?.byRisk?.critical || 0) + (stats?.byRisk?.high || 0)}
              color="yellow"
              delay={0.1}
            />
            <MetricCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              label="Completados"
              value={stats?.totalCompleted || 0}
              color="green"
              delay={0.2}
            />
            <MetricCard
              icon={<XCircle className="w-5 h-5 text-red-400" />}
              label="Críticos"
              value={stats?.byRisk?.critical || 0}
              color="red"
              delay={0.3}
            />
          </motion.div>

          {/* Indicadores de Stage */}
          <div className="mb-6">
            <StageIndicator stages={STAGE_CONFIG} counts={stageCounts} />
          </div>

          {/* ============================================
              KANBAN BOARD
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <PipelineKanban
              journeysByStage={journeysByStage}
              loading={loading}
              error={error}
              onJourneyClick={handleJourneyClick}
            />
          </motion.div>

          {/* ============================================
              MODAL DETALLE
              ============================================ */}
          <AnimatePresence>
            {selectedJourney && (
              <PipelineJourneyDetailModal
                journey={selectedJourney}
                onClose={handleCloseModal}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}