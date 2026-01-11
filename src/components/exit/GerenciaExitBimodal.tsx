// ====================================================================
// GERENCIA EXIT BIMODAL - RANKING EIS SCORE
// src/components/exit/GerenciaExitBimodal.tsx
// v2.0 - Copiado de GerenciaOnboardingBimodal, adaptado para Exit
// ====================================================================
// CAMBIOS:
// - Props: departments: DepartmentExitMetrics[] (no OnboardingDashboardData)
// - Hook: useExitAlerts en lugar de useOnboardingAlerts
// - Textos: EXO → EIS, Onboarding → Exit
// - Rutas: /dashboard/exit/...
// ====================================================================

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Building2 } from 'lucide-react';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { useExitAlerts } from '@/hooks/useExitAlerts';
import type { DepartmentExitMetrics } from '@/types/exit';

// ====================================================================
// INTERFACES
// ====================================================================

interface GerenciaExitBimodalProps {
  departments: DepartmentExitMetrics[];
  loading: boolean;
  viewMode?: 'gerencias' | 'departamentos';
  parentDepartmentId?: string;
}

interface RankingItem {
  id: string;
  name: string;
  score: number;
  position: number;
  totalExits: number;
  pendingAlerts: number;
  criticalAlerts: number;
}

// ====================================================================
// HELPERS
// ====================================================================

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // green - Healthy
  if (score >= 60) return '#22D3EE'; // cyan - Neutral
  if (score >= 40) return '#F59E0B'; // amber - Problematic
  return '#EF4444'; // red - Toxic
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function GerenciaExitBimodal({
  departments,
  loading,
  viewMode = 'gerencias',
  parentDepartmentId
}: GerenciaExitBimodalProps) {

  const router = useRouter();
  const [selectedGerencia, setSelectedGerencia] = useState<RankingItem | null>(null);
  const [showAllRest, setShowAllRest] = useState(false);

  // ================================================================
  // ALERTAS (para métricas en modal)
  // ================================================================
  const { alerts } = useExitAlerts({ scope: 'company' });

  const RIESGO_POR_SALIDA = 5400000; // $5.4M CLP estimado por salida

  // ================================================================
  // CONSTRUIR RANKING
  // ================================================================
  const ranking = useMemo((): RankingItem[] => {
    if (!departments || departments.length === 0) return [];

    // Filtrar según viewMode
    let filtered = departments;
    if (viewMode === 'departamentos' && parentDepartmentId) {
      // Modo departamentos: solo hijos de la gerencia (gerencia es agregado)
      filtered = departments.filter(d => d.parentId === parentDepartmentId);
    } else {
      // Modo gerencias: solo nivel 2 (gerencias)
      filtered = departments.filter(d => d.level === 2);
    }

    return filtered
      .filter(d => d.avgEIS !== null && d.avgEIS > 0)
      .sort((a, b) => (b.avgEIS || 0) - (a.avgEIS || 0))
      .map((d, i) => ({
        id: d.departmentId,
        name: d.departmentName,
        score: d.avgEIS || 0,
        position: i + 1,
        totalExits: d.totalExits,
        pendingAlerts: d.pendingAlerts,
        criticalAlerts: d.criticalAlerts
      }));
  }, [departments, viewMode, parentDepartmentId]);

  // Score global promedio
  const globalScore = useMemo(() => {
    if (ranking.length === 0) return null;
    const sum = ranking.reduce((acc, item) => acc + item.score, 0);
    return sum / ranking.length;
  }, [ranking]);

  // Separar top 3 y resto
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  // ================================================================
  // MÉTRICAS POR GERENCIA (para modal)
  // ================================================================
  const gerenciaMetrics = useMemo(() => {
    if (!selectedGerencia) return null;

    // Obtener departamento del ranking
    const dept = departments.find(d => d.departmentId === selectedGerencia.id);

    // Calcular alertas de esta gerencia
    const alertasPendientes = (alerts || []).filter((a: any) =>
      a.status === 'pending' && a.department?.id === selectedGerencia.id
    );

    const alertasCriticas = alertasPendientes.filter((a: any) =>
      a.severity === 'critical'
    ).length;

    const riesgo = (dept?.totalExits || 0) * RIESGO_POR_SALIDA;

    return {
      totalExits: dept?.totalExits ?? 0,
      totalAlertas: alertasPendientes.length,
      alertasCriticas,
      riesgo
    };
  }, [selectedGerencia, departments, alerts, RIESGO_POR_SALIDA]);

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleGerenciaClick = (item: RankingItem) => {
    setSelectedGerencia(item);
  };

  const closeModal = () => {
    setSelectedGerencia(null);
  };

  // ================================================================
  // LOADING
  // ================================================================
  if (loading) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="fhr-card relative p-4 sm:p-6">
          {/* Linea Tesla superior */}
          <div className="fhr-top-line" />

          <div className="animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-40 mb-8"></div>
            <div className="flex justify-center items-end gap-4 mb-6">
              <div className="w-28 h-24 bg-slate-800/50 rounded-xl"></div>
              <div className="w-32 h-32 bg-slate-800/70 rounded-xl"></div>
              <div className="w-28 h-20 bg-slate-800/30 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // EMPTY STATE
  // ================================================================
  if (ranking.length === 0) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="fhr-card relative p-6 sm:p-8 text-center">
          {/* Linea Tesla superior */}
          <div className="fhr-top-line" />
          <p className="text-slate-500 text-sm">Sin datos de ranking EIS</p>
        </div>
      </div>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <>
      <div className="w-full max-w-[700px] mx-auto">
        <div className="fhr-card relative p-4 sm:p-6">
          {/* Linea Tesla superior */}
          <div className="fhr-top-line" />

          {/* HEADER */}
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="text-sm font-light text-slate-400 uppercase tracking-wide">
              Ranking Gerencias
            </h3>
            <span className="text-xs text-slate-600">EIS Score</span>
          </div>

          {/* PODIO - Top 3 */}
          {podium.length >= 1 && (
            <div className="flex justify-center items-end gap-3 sm:gap-4 mb-8">

              {/* #2 - Izquierda - BORDE PURPURA + HOVER */}
              {podium[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleGerenciaClick(podium[1])}
                  className="flex flex-col items-center w-[110px] sm:w-[130px] group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div
                    className="w-full h-[75px] sm:h-[85px] rounded-xl flex flex-col items-center justify-center
                               bg-slate-800/60 border border-purple-500/30 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               group-hover:border-purple-500/60 group-hover:-translate-y-1
                               group-hover:shadow-[0_8px_20px_rgba(168,85,247,0.15)]"
                  >
                    <span
                      className="text-2xl sm:text-3xl font-light tabular-nums transition-transform duration-300 group-hover:scale-105"
                      style={{ color: getScoreColor(podium[1].score) }}
                    >
                      {podium[1].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">EIS</span>
                  </div>

                  {/* Posicion + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-purple-400 text-xs font-light">2</span>
                    <p
                      className="text-slate-300 text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]
                                 transition-colors duration-300 group-hover:text-white"
                      title={podium[1].name}
                    >
                      {podium[1].name}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* #1 - Centro (Protagonista) - HOVER ESPECIAL */}
              {podium[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  onClick={() => handleGerenciaClick(podium[0])}
                  className="flex flex-col items-center w-[130px] sm:w-[150px] -mt-6 group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div
                    className="w-full h-[100px] sm:h-[115px] rounded-xl flex flex-col items-center justify-center
                               bg-gradient-to-b from-cyan-500/10 to-purple-500/5
                               border border-cyan-500/30 backdrop-blur-sm
                               shadow-[0_0_20px_rgba(34,211,238,0.15)]
                               transition-all duration-300 ease-out
                               group-hover:border-cyan-400/60 group-hover:-translate-y-2
                               group-hover:shadow-[0_12px_30px_rgba(34,211,238,0.25)]"
                  >
                    <span
                      className="text-4xl sm:text-5xl font-extralight tabular-nums transition-transform duration-300 group-hover:scale-110"
                      style={{ color: getScoreColor(podium[0].score) }}
                    >
                      {podium[0].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-cyan-400/70 mt-0.5">EIS</span>
                  </div>

                  {/* Posicion + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-cyan-400 text-xs font-light">1</span>
                    <p
                      className="text-white text-sm mt-1 leading-tight line-clamp-2 font-light min-h-[40px]
                                 transition-colors duration-300 group-hover:text-cyan-300"
                      title={podium[0].name}
                    >
                      {podium[0].name}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* #3 - Derecha - HOVER SUTIL */}
              {podium[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleGerenciaClick(podium[2])}
                  className="flex flex-col items-center w-[110px] sm:w-[130px] group cursor-pointer"
                >
                  {/* Card con hover */}
                  <div
                    className="w-full h-[60px] sm:h-[70px] rounded-xl flex flex-col items-center justify-center
                               bg-slate-800/40 border border-slate-700/30 backdrop-blur-sm
                               transition-all duration-300 ease-out
                               group-hover:border-slate-600/50 group-hover:-translate-y-1
                               group-hover:shadow-[0_6px_16px_rgba(100,116,139,0.1)]"
                  >
                    <span
                      className="text-xl sm:text-2xl font-light tabular-nums transition-transform duration-300 group-hover:scale-105"
                      style={{ color: getScoreColor(podium[2].score) }}
                    >
                      {podium[2].score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-600 mt-0.5">EIS</span>
                  </div>

                  {/* Posicion + Nombre */}
                  <div className="mt-2 text-center w-full">
                    <span className="text-slate-600 text-xs font-light">3</span>
                    <p
                      className="text-slate-400 text-xs mt-1 leading-tight line-clamp-2 min-h-[32px]
                                 transition-colors duration-300 group-hover:text-slate-300"
                      title={podium[2].name}
                    >
                      {podium[2].name}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* SEPARADOR */}
          {rest.length > 0 && (
            <div className="border-t border-dashed border-slate-800 mb-4"></div>
          )}

          {/* LISTA - Posicion 4+ (maximo 2 visibles) */}
          {rest.length > 0 && (
            <>
              <div className="space-y-1">
                {/* Siempre mostrar primeras 2 */}
                {rest.slice(0, 2).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleGerenciaClick(item)}
                    className="flex items-center justify-between py-2 px-2 rounded-lg
                               hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-600 text-sm tabular-nums w-6">
                        {String(item.position).padStart(2, '0')}
                      </span>
                      <span className="text-slate-400 text-sm truncate group-hover:text-slate-200 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-sm tabular-nums font-light ml-2"
                      style={{ color: getScoreColor(item.score) }}
                    >
                      {item.score.toFixed(0)}
                    </span>
                  </motion.div>
                ))}

                {/* Resto expandible */}
                {showAllRest && rest.slice(2).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => handleGerenciaClick(item)}
                    className="flex items-center justify-between py-2 px-2 rounded-lg
                               hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-600 text-sm tabular-nums w-6">
                        {String(item.position).padStart(2, '0')}
                      </span>
                      <span className="text-slate-400 text-sm truncate group-hover:text-slate-200 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-sm tabular-nums font-light ml-2"
                      style={{ color: getScoreColor(item.score) }}
                    >
                      {item.score.toFixed(0)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Boton toggle expandir/colapsar */}
              {rest.length > 2 && (
                <button
                  onClick={() => setShowAllRest(!showAllRest)}
                  className="fhr-btn fhr-btn-ghost w-full mt-3 text-sm"
                >
                  {showAllRest
                    ? 'Mostrar menos'
                    : `Ver ${rest.length - 2} mas`
                  }
                </button>
              )}
            </>
          )}

          {/* FOOTER */}
          <div className="mt-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                {ranking.length} {ranking.length === 1 ? 'gerencia' : 'gerencias'}
              </span>
              {globalScore && (
                <span className="text-slate-500">
                  Promedio <span className="text-slate-300 font-light">{globalScore.toFixed(0)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL DETALLE GERENCIA (FUNCIONAL)
          ============================================================ */}
      <AnimatePresence>
        {selectedGerencia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fhr-card relative w-full max-w-md overflow-hidden"
            >
              {/* Linea Tesla superior */}
              <div className="fhr-top-line" />

              {/* Boton cerrar */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500
                           hover:text-white hover:bg-slate-800/50 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>

              {/* Contenido */}
              <div className="p-6 pt-8">

                {/* Header: Nombre gerencia */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-light text-white mb-3">
                    {selectedGerencia.name}
                  </h3>
                  {/* Divider decorativo */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-600" />
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-600" />
                  </div>
                </div>

                {/* Score Protagonista */}
                <div className="text-center mb-8">
                  <motion.span
                    className="text-6xl font-light tabular-nums"
                    style={{ color: getScoreColor(selectedGerencia.score) }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {selectedGerencia.score.toFixed(0)}
                  </motion.span>
                  <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
                    EIS Score
                  </p>
                </div>

                {/* 3 Metricas (datos reales) */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {/* Salidas */}
                  <div className="text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <p className="text-2xl font-light text-white">
                      {gerenciaMetrics?.totalExits ?? 0}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                      Salidas
                    </p>
                  </div>

                  {/* Alertas - Clickeable con punto parpadeante */}
                  <div
                    onClick={() => {
                      closeModal();
                      router.push(`/dashboard/exit?tab=alertas&gerenciaId=${selectedGerencia.id}`);
                    }}
                    className="text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30
                               cursor-pointer hover:bg-slate-700/40 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {(gerenciaMetrics?.totalAlertas ?? 0) > 0 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                      <p className={`text-2xl font-light ${
                        (gerenciaMetrics?.totalAlertas ?? 0) > 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {gerenciaMetrics?.totalAlertas ?? 0}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                      Alertas
                    </p>
                  </div>

                  {/* Riesgo */}
                  <div className="text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <p className="text-2xl font-light text-amber-400">
                      {gerenciaMetrics?.riesgo
                        ? `$${(gerenciaMetrics.riesgo / 1000000).toFixed(1)}M`
                        : '$0'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                      En riesgo
                    </p>
                  </div>
                </div>

                {/* CTA Principal */}
                <PrimaryButton
                  fullWidth
                  icon={AlertTriangle}
                  onClick={() => {
                    closeModal();
                    router.push(`/dashboard/exit?tab=alertas&gerenciaId=${selectedGerencia.id}`);
                  }}
                >
                  Ver Alertas de esta Gerencia
                </PrimaryButton>

                {/* Link secundario */}
                <div className="mt-3">
                  <GhostButton
                    fullWidth
                    icon={Building2}
                    onClick={() => {
                      closeModal();
                      router.push(`/dashboard/exit/executive?gerenciaId=${selectedGerencia.id}`);
                    }}
                  >
                    Ver todos los departamentos
                  </GhostButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
