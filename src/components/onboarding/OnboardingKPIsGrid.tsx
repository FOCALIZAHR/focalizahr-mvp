'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import type { OnboardingMetrics } from '@/hooks/useOnboardingMetrics';

// ============================================
// TYPES
// ============================================
interface OnboardingKPIsGridProps {
  metrics: OnboardingMetrics;
}

interface KPICard {
  id: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  trend?: number | null;
  suffix?: string;
}

// ============================================
// COMPONENT
// ============================================
export const OnboardingKPIsGrid = memo(function OnboardingKPIsGrid({ 
  metrics 
}: OnboardingKPIsGridProps) {
  
  // ========================================
  // CÁLCULOS DERIVADOS
  // ========================================
  const kpiCards: KPICard[] = useMemo(() => {
    const completionRate = metrics.totalJourneys > 0
      ? Math.round((metrics.completedJourneys / metrics.totalJourneys) * 100)
      : 0;

    return [
      {
        id: 'active',
        label: 'Journeys Activos',
        value: metrics.activeJourneys || 0,
        icon: Users,
        color: '#22D3EE', // cyan
        bgGradient: 'from-cyan-500/20 to-cyan-600/10',
        trend: null,
        suffix: ''
      },
      {
        id: 'exo',
        label: 'EXO Score Promedio',
        value: metrics.avgEXOScore || 0,
        icon: TrendingUp,
        color: '#A78BFA', // purple
        bgGradient: 'from-purple-500/20 to-purple-600/10',
        trend: metrics.exoScoreTrend || null,
        suffix: ' pts'
      },
      {
        id: 'completion',
        label: 'Tasa Completitud',
        value: completionRate,
        icon: CheckCircle2,
        color: '#10B981', // green
        bgGradient: 'from-green-500/20 to-green-600/10',
        trend: null,
        suffix: '%'
      },
      {
        id: 'risk',
        label: 'En Riesgo',
        value: metrics.atRiskJourneys || 0,
        icon: AlertTriangle,
        color: '#F59E0B', // warning
        bgGradient: 'from-amber-500/20 to-amber-600/10',
        trend: null,
        suffix: ''
      }
    ];
  }, [metrics]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: index * 0.1 
          }}
          className="fhr-card-metric group cursor-default"
          style={{
            borderLeftColor: card.color
          }}
        >
          {/* HEADER: ICONO + LABEL */}
          <div className="flex items-center justify-between mb-3">
            <div 
              className={`p-2 rounded-lg bg-gradient-to-br ${card.bgGradient}`}
            >
              <card.icon 
                className="h-4 w-4" 
                style={{ color: card.color }}
              />
            </div>
            
            {/* TREND INDICATOR (si existe) */}
            {card.trend !== null && card.trend !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp 
                  className={`h-3 w-3 ${
                    card.trend > 0 
                      ? 'text-green-400' 
                      : card.trend < 0 
                        ? 'text-red-400 rotate-180' 
                        : 'text-slate-500'
                  }`}
                />
                <span 
                  className={`text-xs font-medium ${
                    card.trend > 0 
                      ? 'text-green-400' 
                      : card.trend < 0 
                        ? 'text-red-400' 
                        : 'text-slate-500'
                  }`}
                >
                  {card.trend > 0 ? '+' : ''}{card.trend}
                </span>
              </div>
            )}
          </div>

          {/* LABEL */}
          <p className="text-slate-400 text-xs font-light mb-2 tracking-wide uppercase">
            {card.label}
          </p>

          {/* VALUE */}
          <div className="flex items-baseline gap-1">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.2,
                type: "spring",
                stiffness: 200
              }}
              className="text-3xl font-bold text-white"
            >
              {card.value}
            </motion.span>
            {card.suffix && (
              <span className="text-lg text-slate-400 font-light">
                {card.suffix}
              </span>
            )}
          </div>

          {/* HOVER EFFECT INDICATOR */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`
            }}
          />
        </motion.div>
      ))}
    </div>
  );
});

OnboardingKPIsGrid.displayName = 'OnboardingKPIsGrid';