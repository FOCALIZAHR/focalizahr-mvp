// ====================================================================
// GERENCIA ONBOARDING BIMODAL - RANKING POR EXO SCORE
// src/components/onboarding/GerenciaOnboardingBimodal.tsx
// v1.4 - ANCHO ALINEADO AL TAB (max-w-[700px] centrado)
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Trophy, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { OnboardingDashboardData, OnboardingMetrics } from '@/types/onboarding';

// ====================================================================
// INTERFACES
// ====================================================================

interface GerenciaOnboardingBimodalProps {
  data: OnboardingDashboardData | null;
  loading: boolean;
}

interface GerenciaRankingItem {
  id: string;
  displayName: string;
  exoScore: number;
  completionRate: number;
  totalJourneys: number;
  completedJourneys: number;
  activeJourneys: number;
  atRiskJourneys: number;
  trend: 'up' | 'down' | 'stable';
  position: number;
  isGerencia: boolean;
  children: ChildDepartment[];
}

interface ChildDepartment {
  id: string;
  displayName: string;
  exoScore: number;
  totalJourneys: number;
}

// ====================================================================
// HELPERS
// ====================================================================

function getTrendFromValue(trend: number | null | undefined): 'up' | 'down' | 'stable' {
  if (trend === null || trend === undefined) return 'stable';
  if (trend > 1) return 'up';
  if (trend < -1) return 'down';
  return 'stable';
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function GerenciaOnboardingBimodal({ 
  data, 
  loading 
}: GerenciaOnboardingBimodalProps) {
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ================================================================
  // PROCESAR GERENCIAS (level === 2)
  // ================================================================
  const gerenciasRanking = useMemo((): GerenciaRankingItem[] => {
    if (!data?.departments || data.departments.length === 0) {
      return [];
    }

    const gerencias: OnboardingMetrics[] = [];
    const departamentos: OnboardingMetrics[] = [];
    
    data.departments.forEach(dept => {
      const deptInfo = dept.department;
      if (!deptInfo) return;
      if (deptInfo.displayName === 'Departamentos sin Asignar') return;
      
      if (deptInfo.level === 2 || deptInfo.unitType === 'gerencia') {
        gerencias.push(dept);
      } else if (deptInfo.level === 3 || deptInfo.unitType === 'departamento') {
        departamentos.push(dept);
      } else {
        departamentos.push(dept);
      }
    });

    const itemsToRank = gerencias.length > 0 ? gerencias : departamentos;

    const items = itemsToRank
      .filter(dept => dept.totalJourneys > 0)
      .map(dept => {
        const deptInfo = dept.department;
        const totalJourneys = dept.totalJourneys || 0;
        const completedJourneys = dept.completedJourneys || 0;
        
        const children: ChildDepartment[] = [];
        if (deptInfo?.level === 2 || deptInfo?.unitType === 'gerencia') {
          departamentos
            .filter(d => d.department?.parentId === dept.departmentId)
            .forEach(child => {
              children.push({
                id: child.departmentId,
                displayName: child.department?.displayName || 'Sin nombre',
                exoScore: child.avgEXOScore || 0,
                totalJourneys: child.totalJourneys || 0
              });
            });
        }
        
        return {
          id: dept.departmentId,
          displayName: deptInfo?.displayName || 'Sin nombre',
          exoScore: dept.avgEXOScore || 0,
          completionRate: totalJourneys > 0
            ? Math.round((completedJourneys / totalJourneys) * 100)
            : 0,
          totalJourneys,
          completedJourneys,
          activeJourneys: dept.activeJourneys || 0,
          atRiskJourneys: dept.atRiskJourneys || 0,
          trend: getTrendFromValue(dept.exoScoreTrend),
          position: 0,
          isGerencia: deptInfo?.level === 2 || deptInfo?.unitType === 'gerencia',
          children
        };
      })
      .sort((a, b) => b.exoScore - a.exoScore)
      .map((item, idx) => ({
        ...item,
        position: idx + 1
      }));

    return items;

  }, [data?.departments]);

  // ================================================================
  // LOADING STATE
  // ================================================================
  if (loading) {
    return (
      <div className="w-full flex justify-center">
        <div 
          className="w-full max-w-[700px] p-6 rounded-2xl"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
            <span className="text-slate-400 text-sm">Cargando ranking...</span>
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
      <div className="w-full flex justify-center">
        <div 
          className="w-full max-w-[700px] p-6 rounded-2xl"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-white mb-1">
              Sin datos de ranking
            </p>
            <p className="text-xs text-slate-500">
              No hay gerencias con journeys activos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // HELPERS DE UI
  // ================================================================
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-cyan-500/10 border-cyan-500/20';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getPositionStyle = (pos: number): string => {
    if (pos === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900';
    if (pos === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900';
    if (pos === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-slate-500" />;
  };

  const hasGerencias = gerenciasRanking.some(g => g.isGerencia);
  const title = hasGerencias ? 'Ranking Gerencias' : 'Ranking Departamentos';

  // ================================================================
  // RENDER - ANCHO ALINEADO AL TAB (700px centrado)
  // ================================================================
  return (
    <div className="w-full flex justify-center">
      <div 
        className="w-full max-w-[700px] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* HEADER */}
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              {title}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {gerenciasRanking.length} {hasGerencias ? 'gerencias' : 'departamentos'}
          </span>
        </div>
        
        {/* LISTA */}
        <div 
          className="divide-y divide-slate-800/50 max-h-[320px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}
        >
          {gerenciasRanking.map((gerencia) => (
            <div key={gerencia.id}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === gerencia.id ? null : gerencia.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Posición */}
                  <div className={`
                    w-7 h-7 rounded-lg flex items-center justify-center
                    text-xs font-bold shrink-0 ${getPositionStyle(gerencia.position)}
                  `}>
                    {gerencia.position}
                  </div>
                  
                  {/* Expand icon si tiene hijos */}
                  {gerencia.children.length > 0 && (
                    <div className="shrink-0">
                      {expandedId === gerencia.id ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  )}
                  
                  {/* Nombre */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {gerencia.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {gerencia.activeJourneys} activos • {gerencia.completedJourneys}/{gerencia.totalJourneys}
                    </p>
                  </div>
                  
                  {/* EXO Score */}
                  <div className={`
                    px-3 py-1.5 rounded-lg border text-center min-w-[60px] shrink-0
                    ${getScoreBg(gerencia.exoScore)}
                  `}>
                    <div className={`text-lg font-bold ${getScoreColor(gerencia.exoScore)}`}>
                      {gerencia.exoScore.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">EXO</div>
                  </div>
                  
                  {/* Trend */}
                  <div className="shrink-0">
                    <TrendIcon trend={gerencia.trend} />
                  </div>
                </div>
              </motion.div>
              
              {/* Departamentos hijos expandidos */}
              <AnimatePresence>
                {expandedId === gerencia.id && gerencia.children.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-900/30"
                  >
                    <div className="px-4 py-2 space-y-1">
                      {gerencia.children.map(child => (
                        <div 
                          key={child.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/30"
                        >
                          <div className="w-6 h-6 rounded bg-slate-700/50 flex items-center justify-center">
                            <Users className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="flex-1 text-sm text-slate-300 truncate">
                            {child.displayName}
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(child.exoScore)}`}>
                            {child.exoScore.toFixed(0)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {child.totalJourneys}j
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span>EXO Score</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>Tendencia</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            <span>
              {gerenciasRanking.reduce((sum, d) => sum + d.totalJourneys, 0)} journeys
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}