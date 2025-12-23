// ====================================================================
// ALERTAS GERENCIA RANKING - CON CEO SUMMARY INTEGRADO
// src/components/onboarding/AlertasGerenciaRanking.tsx
// v2.4 - Reducción de rojo + Click "personas en riesgo" → panel alertas
// ====================================================================

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ChevronRight,
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';

// ====================================================================
// INTERFACES
// ====================================================================

interface GerenciaAlertData {
  gerenciaId: string;
  gerenciaName: string;
  alertasCriticas: number;
  alertasAltas: number;
  alertasPendientes: number;
  montoRiesgo: number;
  personasEnRiesgo: number;
}

// ====================================================================
// CONSTANTES
// ====================================================================

const RIESGO_POR_PERSONA = 5400000; // ~$5.4M CLP

const CARD_STYLES = {
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  backdropFilter: 'blur(16px)'
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function AlertasGerenciaRanking() {
  
  const router = useRouter();
  const { alerts, metrics, loading } = useOnboardingAlerts();

  // ================================================================
  // CEO METRICS (cálculos rápidos, sin Engine)
  // ================================================================
  
  const ceoMetrics = useMemo(() => {
    if (!alerts || alerts.length === 0) {
      return {
        personasEnRiesgo: 0,
        montoTotal: 0,
        tasaIncidencia: 0,
        tendencia: { value: 0, direction: 'stable' as const }
      };
    }

    // Personas únicas con alertas pendientes
    const personasUnicas = new Set<string>();
    alerts.forEach((alert: any) => {
      if (alert.status === 'pending') {
        const journeyId = alert.journeyId || alert.journey?.id;
        if (journeyId) personasUnicas.add(journeyId);
      }
    });

    const personasEnRiesgo = personasUnicas.size;
    const montoTotal = personasEnRiesgo * RIESGO_POR_PERSONA;

    // Tasa de incidencia (personas con alertas / total journeys)
    const totalJourneys = metrics?.totalJourneys || personasEnRiesgo;
    const tasaIncidencia = totalJourneys > 0 
      ? Math.round((personasUnicas.size / totalJourneys) * 100)
      : 0;

    // Tendencia desde metrics (si existe)
    const tendencia = {
      value: metrics?.trend?.value || 0,
      direction: (metrics?.trend?.direction || 'stable') as 'up' | 'down' | 'stable'
    };

    return {
      personasEnRiesgo,
      montoTotal,
      tasaIncidencia,
      tendencia
    };
  }, [alerts, metrics]);

  // ================================================================
  // RANKING POR GERENCIA
  // ================================================================
  
  const gerenciasRanking = useMemo((): GerenciaAlertData[] => {
    if (!alerts || alerts.length === 0) return [];

    const gerenciaMap = new Map<string, GerenciaAlertData>();
    const deptMap = new Map<string, any>();
    
    alerts.forEach((alert: any) => {
      const dept = alert.journey?.department;
      if (!dept) return;
      deptMap.set(dept.id, dept);
      if (dept.parent) {
        deptMap.set(dept.parent.id, dept.parent);
      }
    });

    const personasPorGerencia = new Map<string, Set<string>>();
    const alertasPendientes = alerts.filter((a: any) => a.status === 'pending');

    alertasPendientes.forEach((alert: any) => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      const level = dept.level;
      const parentId = dept.parentId;
      const unitType = dept.unitType;
      const isGerenciaDirecta = level === 2 || (!parentId && unitType === 'gerencia');
      
      let gerenciaId: string;
      let gerenciaName: string;
      
      if (isGerenciaDirecta) {
        gerenciaId = dept.id;
        gerenciaName = dept.displayName;
      } else if (parentId) {
        gerenciaId = parentId;
        const parentDept = deptMap.get(parentId);
        gerenciaName = parentDept?.displayName || dept.parent?.displayName || 'Gerencia';
      } else {
        return;
      }

      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, {
          gerenciaId,
          gerenciaName,
          alertasCriticas: 0,
          alertasAltas: 0,
          alertasPendientes: 0,
          montoRiesgo: 0,
          personasEnRiesgo: 0
        });
        personasPorGerencia.set(gerenciaId, new Set());
      }

      const gerencia = gerenciaMap.get(gerenciaId)!;
      const personasSet = personasPorGerencia.get(gerenciaId)!;
      
      if (alert.severity === 'critical') {
        gerencia.alertasCriticas += 1;
      } else if (alert.severity === 'high') {
        gerencia.alertasAltas += 1;
      }
      gerencia.alertasPendientes += 1;
      
      const journeyId = alert.journeyId || alert.journey?.id;
      if (journeyId && !personasSet.has(journeyId)) {
        personasSet.add(journeyId);
        gerencia.montoRiesgo += RIESGO_POR_PERSONA;
      }
    });

    gerenciaMap.forEach((gerencia, id) => {
      gerencia.personasEnRiesgo = personasPorGerencia.get(id)?.size || 0;
    });

    return Array.from(gerenciaMap.values())
      .sort((a, b) => {
        if (b.alertasCriticas !== a.alertasCriticas) {
          return b.alertasCriticas - a.alertasCriticas;
        }
        return b.montoRiesgo - a.montoRiesgo;
      });

  }, [alerts]);

  // ================================================================
  // HELPERS
  // ================================================================

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const handleGerenciaClick = (gerenciaId: string) => {
    router.push(`/dashboard/onboarding/alerts?gerenciaId=${gerenciaId}`);
  };

  const handlePersonasClick = () => {
    router.push('/dashboard/onboarding/alerts');
  };

  const TrendIcon = ceoMetrics.tendencia.direction === 'up' 
    ? TrendingUp 
    : ceoMetrics.tendencia.direction === 'down' 
    ? TrendingDown 
    : Minus;

  // Tendencia: up = más alertas = malo (rojo), down = menos = bueno (verde)
  const trendColor = ceoMetrics.tendencia.direction === 'up'
    ? 'text-red-400'
    : ceoMetrics.tendencia.direction === 'down'
    ? 'text-emerald-400'
    : 'text-slate-400';

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="p-4 sm:p-6 rounded-2xl" style={CARD_STYLES}>
          <div className="animate-pulse space-y-6">
            {/* CEO Summary skeleton */}
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-xl"></div>
              ))}
            </div>
            <div className="h-px bg-slate-800"></div>
            {/* Ranking skeleton */}
            <div className="space-y-2">
              <div className="h-14 bg-slate-800/50 rounded-xl"></div>
              <div className="h-12 bg-slate-800/30 rounded-xl"></div>
              <div className="h-12 bg-slate-800/30 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // EMPTY STATE
  // ================================================================

  if (gerenciasRanking.length === 0) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="p-6 sm:p-8 text-center rounded-2xl" style={CARD_STYLES}>
          <div className="inline-flex p-4 rounded-full bg-emerald-500/10 mb-4">
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">
            Sin Alertas Activas
          </h3>
          <p className="text-sm text-slate-500">
            Todas las gerencias están en buen estado
          </p>
        </div>
      </div>
    );
  }

  // ================================================================
  // CÁLCULOS
  // ================================================================
  const totalCritical = gerenciasRanking.reduce((sum, g) => sum + g.alertasCriticas, 0);
  const top3 = gerenciasRanking.slice(0, 3);
  const rest = gerenciasRanking.slice(3);

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <div className="rounded-2xl overflow-hidden" style={CARD_STYLES}>
        
        {/* ============================================================
            CEO SUMMARY - 4 Métricas (COLORES REDUCIDOS)
            ============================================================ */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 border-b border-slate-700/30"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* MÉTRICA 1: Personas en Riesgo - CLICKEABLE → Panel Alertas */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handlePersonasClick}
              className="relative group cursor-pointer"
            >
              <div className="flex flex-col items-center sm:items-start p-3 rounded-xl
                            bg-slate-800/40 border border-slate-600/30
                            transition-all duration-300 
                            hover:border-cyan-500/40 hover:bg-slate-800/60
                            hover:shadow-[0_4px_12px_rgba(34,211,238,0.1)]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    En Riesgo
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-red-400 tabular-nums">
                  {ceoMetrics.personasEnRiesgo}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-600">personas</span>
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              {/* Pulso sutil si hay muchas */}
              {ceoMetrics.personasEnRiesgo >= 10 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </div>
              )}
            </motion.div>

            {/* MÉTRICA 2: Monto en Juego - AMBER (no rojo) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center sm:items-start p-3 rounded-xl
                        bg-slate-800/40 border border-slate-600/30
                        transition-all duration-300 hover:border-amber-500/30"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  En Juego
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
                {formatCurrency(ceoMetrics.montoTotal)}
              </span>
              <span className="text-[10px] text-slate-600">CLP/año</span>
            </motion.div>

            {/* MÉTRICA 3: Tasa Incidencia - PURPLE (dato, no alerta) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center sm:items-start p-3 rounded-xl
                        bg-slate-800/40 border border-slate-600/30
                        transition-all duration-300 hover:border-purple-500/30"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Incidencia
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-purple-400 tabular-nums">
                {ceoMetrics.tasaIncidencia}%
              </span>
              <span className="text-[10px] text-slate-600">con alertas</span>
            </motion.div>

            {/* MÉTRICA 4: Tendencia */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center sm:items-start p-3 rounded-xl
                        bg-slate-800/40 border border-slate-600/30
                        transition-all duration-300 hover:border-slate-500/40"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Tendencia
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${trendColor}`}>
                  {ceoMetrics.tendencia.value > 0 ? '+' : ''}{ceoMetrics.tendencia.value}%
                </span>
              </div>
              <span className="text-[10px] text-slate-600">vs mes ant.</span>
            </motion.div>
          </div>
        </motion.div>

        {/* ============================================================
            RANKING POR GERENCIA (COLORES SUAVIZADOS)
            ============================================================ */}
        <div className="p-4 sm:p-5">
          
          {/* HEADER RANKING */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Por <span className="text-amber-400">Gerencia</span>
              </h3>
            </div>
            {totalCritical > 0 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {totalCritical} críticas
              </span>
            )}
          </div>

          {/* TOP 3 - Colores suavizados */}
          <div className="space-y-2 mb-4">
            {top3.map((gerencia, index) => (
              <motion.div
                key={gerencia.gerenciaId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => handleGerenciaClick(gerencia.gerenciaId)}
                className={`
                  p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 group
                  ${index === 0 
                    ? 'bg-slate-800/50 border border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_8px_20px_rgba(245,158,11,0.1)] hover:-translate-y-0.5' 
                    : index === 1
                    ? 'bg-slate-800/40 border border-slate-600/30 hover:border-slate-500/50 hover:shadow-[0_6px_16px_rgba(100,116,139,0.08)] hover:-translate-y-0.5'
                    : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 hover:shadow-[0_4px_12px_rgba(100,116,139,0.05)] hover:-translate-y-0.5'
                  }
                `}
              >
                <div className="flex items-start sm:items-center gap-3">
                  
                  {/* Posición - Colores suavizados */}
                  <div className={`
                    w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center 
                    text-xs sm:text-sm font-bold shrink-0 transition-transform duration-300 group-hover:scale-110
                    ${index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                      index === 1 ? 'bg-slate-600/30 text-slate-300' :
                      'bg-slate-700/30 text-slate-400'}
                  `}>
                    {index + 1}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                      
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                          {gerencia.gerenciaName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {gerencia.personasEnRiesgo} {gerencia.personasEnRiesgo === 1 ? 'persona' : 'personas'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0 shrink-0">
                        {/* Críticas - Solo este en rojo */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-lg sm:text-xl font-semibold tabular-nums transition-transform duration-300 group-hover:scale-105 ${
                            gerencia.alertasCriticas > 0 ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            {gerencia.alertasCriticas}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-600 uppercase">crít</span>
                        </div>
                        
                        {/* Monto - AMBER (no rojo) */}
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-medium text-amber-400/80 tabular-nums">
                            {formatCurrency(gerencia.montoRiesgo)}
                          </span>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all hidden sm:block" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RESTO */}
          {rest.length > 0 && (
            <>
              <div className="border-t border-dashed border-slate-800 my-4"></div>
              
              <div 
                className="space-y-1 max-h-[120px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
              >
                {rest.map((gerencia, index) => (
                  <motion.div
                    key={gerencia.gerenciaId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + index * 0.03 }}
                    onClick={() => handleGerenciaClick(gerencia.gerenciaId)}
                    className="flex items-center justify-between py-2.5 px-2 sm:px-3 rounded-lg 
                               hover:bg-slate-800/30 cursor-pointer group transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-slate-600 text-xs tabular-nums w-5">
                        {String(index + 4).padStart(2, '0')}
                      </span>
                      <span className="text-slate-400 text-sm truncate group-hover:text-slate-200 transition-colors">
                        {gerencia.gerenciaName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className={`text-sm tabular-nums ${
                        gerencia.alertasCriticas > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}>
                        {gerencia.alertasCriticas}
                      </span>
                      {/* Monto en amber */}
                      <span className="text-xs text-amber-400/70 tabular-nums min-w-[45px] sm:min-w-[55px] text-right">
                        {formatCurrency(gerencia.montoRiesgo)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* FOOTER */}
          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {gerenciasRanking.length} {gerenciasRanking.length === 1 ? 'gerencia' : 'gerencias'}
              </span>
              <span className="text-slate-500">
                Riesgo total <span className="text-amber-400 font-medium">{formatCurrency(ceoMetrics.montoTotal)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}