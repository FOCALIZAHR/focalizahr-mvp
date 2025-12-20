// src/app/dashboard/seguimiento/page.tsx
// ============================================================================
// HUB SEGUIMIENTO v3.0 - Centro de Productos Permanentes
// Filosofía: Puerta elegante de diferenciación, minimalismo Tesla/Apple
// v3: Feedback incorporado - botón md, Off-Boarding, footer educativo, gap-8
// ============================================================================

'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  DoorOpen, 
  ArrowRight, 
  Users,
  AlertTriangle,
  Lock,
  Activity,
  Info
} from 'lucide-react';

// Hooks
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';

// Components
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';

// ============================================================================
// ANIMATIONS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
} as const;

// ============================================================================
// HELPER: Clasificar EXO Score
// ============================================================================

function getScoreStatus(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: 'Excelente', color: 'text-emerald-400', bgColor: 'bg-emerald-400' };
  if (score >= 60) return { label: 'Bueno', color: 'text-cyan-400', bgColor: 'bg-cyan-400' };
  if (score >= 40) return { label: 'Regular', color: 'text-amber-400', bgColor: 'bg-amber-400' };
  return { label: 'Crítico', color: 'text-red-400', bgColor: 'bg-red-400' };
}

// ============================================================================
// SCORE BAR COMPONENT
// ============================================================================

const ScoreBar = memo(function ScoreBar({ score }: { score: number }) {
  const { bgColor } = getScoreStatus(score);
  
  return (
    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${bgColor}`}
      />
    </div>
  );
});

// ============================================================================
// METRIC ROW COMPONENT
// ============================================================================

const MetricRow = memo(function MetricRow({
  label,
  value,
  icon: Icon,
  variant = 'default'
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'alert';
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-400 font-light">{label}</span>
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className={`w-4 h-4 ${variant === 'alert' ? 'text-red-400' : 'text-slate-500'}`} />
        )}
        {variant === 'alert' ? (
          <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm font-medium text-red-400">
            {value}
          </span>
        ) : (
          <span className="text-lg font-light text-white">{value}</span>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// ONBOARDING CARD COMPONENT
// ============================================================================

const OnboardingCard = memo(function OnboardingCard({
  metrics,
  onClick
}: {
  metrics: { avgEXOScore: number; activeJourneys: number; criticalAlerts: number } | null;
  onClick: () => void;
}) {
  const score = metrics?.avgEXOScore ?? 0;
  const { label: scoreLabel, color: scoreColor } = getScoreStatus(score);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="
        relative overflow-hidden rounded-2xl cursor-pointer
        border border-cyan-500/20 hover:border-cyan-400/40
        bg-gradient-to-br from-slate-800/60 to-slate-900/80
        backdrop-blur-xl
        transition-all duration-300
        hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]
      "
      onClick={onClick}
    >
      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="p-6">
        {/* Header con icono Lucide */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
            <Rocket className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Onboarding Intelligence
            </h3>
            <p className="text-sm text-slate-500 font-light mt-0.5">
              Journey predictivo 4C Bauer
            </p>
          </div>
        </div>

        {/* EXO Score con contexto visual */}
        <div className="mb-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400 font-light">EXO Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-light text-white">{score || '—'}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor} bg-slate-700/50`}>
                {score ? scoreLabel : ''}
              </span>
            </div>
          </div>
          {score > 0 && <ScoreBar score={score} />}
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-1 border-t border-slate-700/30 pt-4">
          <MetricRow
            label="Journeys Activos"
            value={metrics?.activeJourneys ?? '—'}
            icon={Users}
          />
          
          {(metrics?.criticalAlerts ?? 0) > 0 && (
            <MetricRow
              label="Alertas Críticas"
              value={metrics?.criticalAlerts ?? 0}
              icon={AlertTriangle}
              variant="alert"
            />
          )}
        </div>

        {/* CTA Button - size="md", NO fullWidth */}
        <div className="mt-6 flex justify-center">
          <PrimaryButton 
            icon={ArrowRight} 
            iconPosition="right"
            size="md"
            glow={true}
          >
            Ver Dashboard
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// OFF-BOARDING CARD COMPONENT (Próximamente)
// ============================================================================

const OffBoardingCard = memo(function OffBoardingCard() {
  return (
    <motion.div
      variants={itemVariants}
      className="
        relative overflow-hidden rounded-2xl
        border border-slate-700/30
        bg-slate-800/20
        backdrop-blur-sm
      "
    >
      <div className="p-6">
        {/* Header con icono Lucide + Badge INLINE */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
            <DoorOpen className="w-6 h-6 text-slate-500" />
          </div>
          <div className="flex-1">
            {/* Título + Badge en misma línea */}
            <div className="flex items-center justify-between gap-3 mb-0.5">
              <h3 className="text-xl font-semibold text-slate-400 tracking-tight">
                Off-Boarding Intelligence
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/40 border border-slate-600/30 rounded-full flex-shrink-0">
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Próximamente
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 font-light">
              Análisis predictivo de salidas
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/20 mb-4">
          <p className="text-sm text-slate-500 font-light leading-relaxed">
            Análisis post-salida con correlación automática a experiencia de onboarding. Cierra el ciclo de inteligencia de talento.
          </p>
        </div>

        {/* Teaser Features */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span>Exit Interview Score (EIS)</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span>Correlación Onboarding ↔ Off-Boarding</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span>Alertas Ley Karin predictivas</span>
          </div>
        </div>

        {/* Notify CTA */}
        <div className="mt-6 flex justify-center">
          <GhostButton size="sm" disabled>
            Notificarme cuando esté disponible
          </GhostButton>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SeguimientoHubPage() {
  const router = useRouter();
  
  // Fetch métricas onboarding
  const { data } = useOnboardingMetrics();

  // Extraer métricas live
  const liveMetrics = useMemo(() => {
    if (!data) return null;
    
    const live = (data as any).live;
    
    return {
      avgEXOScore: live?.avgEXOScore ?? 0,
      activeJourneys: live?.activeJourneys ?? 0,
      criticalAlerts: live?.criticalAlerts ?? 0
    };
  }, [data]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/8 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* ══════════════════════════════════════════════════════════════
              PORTADA LIGERA - Sin badge pesado (según feedback Victor)
             ══════════════════════════════════════════════════════════════ */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            
            {/* Título Principal */}
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
              Centro de{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Seguimiento
              </span>
            </h1>

            {/* Subtítulo - integra contexto */}
            <p className="text-base md:text-lg text-slate-400 font-light">
              Monitoreo continuo del ciclo de vida del talento
            </p>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════
              GRID DE PRODUCTOS - gap-8 para más respiración
             ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card Onboarding (ACTIVO) */}
            <OnboardingCard
              metrics={liveMetrics}
              onClick={() => router.push('/dashboard/onboarding/inicio')}
            />

            {/* Card Off-Boarding (PRÓXIMAMENTE) */}
            <OffBoardingCard />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              FOOTER EDUCATIVO - Diferenciación premium
             ══════════════════════════════════════════════════════════════ */}
          <motion.div 
            variants={itemVariants}
            className="p-5 bg-slate-800/20 backdrop-blur-sm border border-slate-700/30 rounded-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 flex-shrink-0">
                <Info className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  ¿Qué son los productos permanentes?
                </h4>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  A diferencia de los estudios temporales (con fecha de inicio y cierre), 
                  los productos permanentes monitorean <span className="text-cyan-400">continuamente</span> el 
                  ciclo de vida del talento. Son sistemas predictivos que generan alertas 
                  y análisis en tiempo real.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════
              FOOTER SUTIL - Icono diferenciador
             ══════════════════════════════════════════════════════════════ */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-2 pt-2"
          >
            <Activity className="w-4 h-4 text-slate-600" />
            <p className="text-xs text-slate-600 font-light tracking-wide">
              Productos permanentes • Monitoreo continuo • Inteligencia predictiva
            </p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}