// ============================================================================
// EXECUTIVE REVELATION CARD v2.0
// FocalizaHR Design System - Piel Apple/Tesla
// ============================================================================
//
// FILOSOFÍA APLICADA:
// - UN protagonista (insight, no el número)
// - Sin cajas/contenedores para métricas
// - font-light en elementos grandes
// - Espaciado generoso (el silencio comunica)
// - Gradiente PARCIAL
// - Línea decorativa ── • ──
// - CTA único
//
// ============================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface DepartmentData {
  id: string;
  name: string;
  score: number;
  trend: number;
  ranking?: number;
  totalDepartments?: number;
  atRiskCount: number;
  totalJourneys: number;
}

interface ExecutiveRevelationCardProps {
  department: DepartmentData;
  onActionClick: () => void;
  isLoading?: boolean;
}

// ============================================================================
// INSIGHT GENERATOR - Datos → Insight → Acción
// ============================================================================

function generateInsight(dept: DepartmentData): {
  headline: string;
  subtext: string;
  severity: 'critical' | 'warning' | 'neutral' | 'positive';
} {
  const { score, trend, atRiskCount, totalJourneys } = dept;
  
  // Crítico: Score bajo + tendencia negativa + personas en riesgo
  if (score < 50 && atRiskCount > 0) {
    return {
      headline: `${atRiskCount} personas necesitan intervención`,
      subtext: `Score ${score.toFixed(1)} con tendencia negativa`,
      severity: 'critical'
    };
  }
  
  // Warning: Score moderado o tendencia preocupante
  if (score < 65 || (trend < -3 && atRiskCount > 0)) {
    const personas = atRiskCount > 0 ? `${atRiskCount} personas en seguimiento` : 'Tendencia a la baja';
    return {
      headline: personas,
      subtext: `Score ${score.toFixed(1)} · ${trend > 0 ? '+' : ''}${trend.toFixed(1)} tendencia`,
      severity: 'warning'
    };
  }
  
  // Neutral: En rango aceptable
  if (score < 75) {
    return {
      headline: totalJourneys > 0 
        ? `${totalJourneys} journeys en progreso` 
        : 'Integración en curso',
      subtext: `Score ${score.toFixed(1)}/100 · Estable`,
      severity: 'neutral'
    };
  }
  
  // Positive: Excelente
  return {
    headline: 'Integración saludable',
    subtext: `Score ${score.toFixed(1)}/100 · ${trend > 0 ? 'Mejorando' : 'Estable'}`,
    severity: 'positive'
  };
}

// ============================================================================
// SEVERITY STYLES
// ============================================================================

const severityConfig = {
  critical: {
    accentColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.15)',
    ctaGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  },
  warning: {
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.12)',
    ctaGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  neutral: {
    accentColor: '#22D3EE',
    glowColor: 'rgba(34, 211, 238, 0.08)',
    ctaGradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)'
  },
  positive: {
    accentColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.10)',
    ctaGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  }
};

// ============================================================================
// SKELETON LOADER
// ============================================================================

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8 py-16 px-8">
      <div className="h-4 w-32 bg-slate-800 rounded mx-auto" />
      <div className="h-12 w-3/4 bg-slate-800 rounded mx-auto" />
      <div className="flex justify-center gap-4">
        <div className="h-px w-16 bg-slate-800" />
        <div className="h-2 w-2 bg-slate-800 rounded-full" />
        <div className="h-px w-16 bg-slate-800" />
      </div>
      <div className="h-6 w-1/2 bg-slate-800 rounded mx-auto" />
      <div className="h-14 w-64 bg-slate-800 rounded-xl mx-auto" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ExecutiveRevelationCard({
  department,
  onActionClick,
  isLoading = false
}: ExecutiveRevelationCardProps) {
  
  // Generate insight from data
  const insight = useMemo(() => generateInsight(department), [department]);
  const config = severityConfig[insight.severity];
  
  // Loading state
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/50">
        <Skeleton />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* ══════════════════════════════════════════════════════════════════
          CARD CONTAINER
      ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="relative rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/50"
        style={{
          boxShadow: `0 0 80px ${config.glowColor}`
        }}
      >
        
        {/* Tesla Top Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)` 
          }} 
        />
        
        {/* ════════════════════════════════════════════════════════════════
            CONTENT - Estructura Portada FocalizaHR
        ═════════════════════════════════════════════════════════════════ */}
        <div className="relative z-10 text-center px-6 py-16 md:py-20 lg:py-24">
          
          {/* 1. Badge contextual */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium">
              {department.name}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs tracking-[0.2em] uppercase text-slate-500">
              {department.totalJourneys} journeys activos
            </span>
          </motion.div>
          
          {/* 2. PROTAGONISTA - El Insight (NO el número) */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 max-w-3xl mx-auto leading-tight"
          >
            {insight.headline}
          </motion.h2>
          
          {/* 3. Línea decorativa ── • ── */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-12 md:w-16 h-px bg-gradient-to-r from-transparent to-slate-600" />
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: config.accentColor }}
            />
            <div className="w-12 md:w-16 h-px bg-gradient-to-l from-transparent to-slate-600" />
          </motion.div>
          
          {/* 4. Contexto (métricas como texto, NO en cajas) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base md:text-lg text-slate-400 font-light mb-4"
          >
            {insight.subtext}
          </motion.p>
          
          {/* 5. Métricas secundarias en UNA línea */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-12"
          >
            {department.ranking && department.totalDepartments && (
              <>
                <span>Ranking #{department.ranking} de {department.totalDepartments}</span>
                <span className="text-slate-700">·</span>
              </>
            )}
            <span>
              Tendencia {department.trend > 0 ? '+' : ''}{department.trend.toFixed(1)}
            </span>
            {department.atRiskCount > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span style={{ color: config.accentColor }}>
                  {department.atRiskCount} requieren atención
                </span>
              </>
            )}
          </motion.div>
          
          {/* 6. CTA ÚNICO - Estilo FocalizaHR */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onActionClick}
            className="
              group relative inline-flex items-center gap-3
              px-8 py-4 rounded-xl
              text-slate-900 font-medium
              transition-all duration-300
              hover:scale-[1.02]
            "
            style={{
              background: config.ctaGradient,
              boxShadow: `0 10px 40px ${config.glowColor}`
            }}
            whileHover={{
              boxShadow: `0 15px 50px ${config.glowColor.replace('0.', '0.3')}`
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span>
              {department.atRiskCount > 0 
                ? `Ver ${department.atRiskCount} personas` 
                : 'Ver detalles'
              }
            </span>
            <ArrowRight 
              className="w-4 h-4 transition-transform group-hover:translate-x-1" 
              strokeWidth={2}
            />
          </motion.button>
          
          {/* 7. Scroll hint (si hay más contenido below) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-xs text-slate-600 uppercase tracking-widest"
          >
            Más detalles abajo
          </motion.div>
          
        </div>
        
      </div>
    </motion.div>
  );
}

ExecutiveRevelationCard.displayName = 'ExecutiveRevelationCard';

export default memo(ExecutiveRevelationCard);