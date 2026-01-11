// ====================================================================
// EXIT METRICS CARDS - HERO METRICS EXIT INTELLIGENCE
// src/components/exit/ExitMetricsCards.tsx
// ====================================================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import type { ExitMetricsSummary } from '@/types/exit';

// ============================================
// TYPES
// ============================================
interface ExitMetricsCardsProps {
  summary: ExitMetricsSummary | null;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number | null;
  icon: React.ElementType;
  color: 'cyan' | 'amber' | 'red' | 'purple';
  delay?: number;
}

// ============================================
// CONSTANTS
// ============================================
const COLORS = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    icon: 'text-cyan-400'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400'
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    icon: 'text-purple-400'
  }
};

// ============================================
// SUB-COMPONENT: METRIC CARD
// ============================================
const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color,
  delay = 0
}: MetricCardProps) {
  
  const colors = COLORS[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`
        fhr-card p-6 relative overflow-hidden
        hover:scale-[1.02] transition-transform duration-300
      `}
    >
      {/* Top line */}
      <div className="fhr-top-line" />
      
      {/* Icon */}
      <div className={`${colors.bg} ${colors.border} border p-3 rounded-xl inline-block mb-4`}>
        <Icon className={`h-5 w-5 ${colors.icon}`} strokeWidth={1.5} />
      </div>
      
      {/* Value */}
      <div className={`text-3xl font-light ${colors.text} mb-1`}>
        {value}
      </div>
      
      {/* Title */}
      <div className="text-sm text-slate-400 font-light mb-2">
        {title}
      </div>
      
      {/* Subtitle or Trend */}
      {subtitle && (
        <div className="text-xs text-slate-500">
          {subtitle}
        </div>
      )}
      
      {trend !== null && trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-red-400" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3 text-green-400" />
          ) : null}
          <span className={`text-xs font-light ${
            trend > 0 ? 'text-red-400' : 
            trend < 0 ? 'text-green-400' : 
            'text-slate-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs mes anterior
          </span>
        </div>
      )}
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';

// ============================================
// MAIN COMPONENT
// ============================================
const ExitMetricsCards = memo(function ExitMetricsCards({
  summary,
  loading
}: ExitMetricsCardsProps) {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="fhr-card p-6 animate-pulse"
          >
            <div className="h-12 w-12 bg-slate-700 rounded-xl mb-4" />
            <div className="h-8 bg-slate-700 rounded mb-2 w-20" />
            <div className="h-4 bg-slate-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="text-center py-12 text-slate-400">
        No hay datos disponibles
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Total Exits */}
      <MetricCard
        title="Total Salidas"
        value={summary.totalExits}
        subtitle={`${summary.totalDepartments} departamentos`}
        icon={Users}
        color="cyan"
        delay={0}
      />
      
      {/* Avg EIS */}
      <MetricCard
        title="EIS Promedio"
        value={summary.globalAvgEIS !== null ? summary.globalAvgEIS.toFixed(1) : '--'}
        subtitle={
          summary.globalAvgEIS !== null
            ? summary.globalAvgEIS >= 70
              ? 'Healthy'
              : summary.globalAvgEIS >= 50
              ? 'Neutral'
              : summary.globalAvgEIS >= 25
              ? 'Problematic'
              : 'Toxic'
            : 'Sin datos'
        }
        icon={TrendingUp}
        color={
          summary.globalAvgEIS !== null
            ? summary.globalAvgEIS >= 70
              ? 'cyan'
              : summary.globalAvgEIS >= 50
              ? 'amber'
              : summary.globalAvgEIS >= 25
              ? 'amber'
              : 'red'
            : 'purple'
        }
        delay={0.1}
      />
      
      {/* Alertas Críticas */}
      <MetricCard
        title="Alertas Activas"
        value={summary.alerts.pending}
        subtitle={`${summary.alerts.critical} críticas`}
        icon={AlertTriangle}
        color={summary.alerts.critical > 0 ? 'red' : 'amber'}
        delay={0.2}
      />
      
      {/* Ley Karin */}
      <MetricCard
        title="Ley Karin"
        value={summary.alerts.leyKarin}
        subtitle={summary.alerts.leyKarin > 0 ? '⚠️ Atención inmediata' : 'Sin alertas'}
        icon={ShieldAlert}
        color={summary.alerts.leyKarin > 0 ? 'red' : 'cyan'}
        delay={0.3}
      />
      
    </div>
  );
});

ExitMetricsCards.displayName = 'ExitMetricsCards';

export default ExitMetricsCards;