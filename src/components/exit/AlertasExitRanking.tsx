// ====================================================================
// ALERTAS EXIT RANKING v2.0 - ADAPTADO DE ONBOARDING
// src/components/exit/AlertasExitRanking.tsx
// ====================================================================
// REDISENO COMPLETO - Lista escaneable nivel Apple/Tesla
//
// FILOSOFIA:
// "Entender en 3 segundos -> Decidir en 10 segundos -> Actuar en 1 clic"
// "Un podio celebra. Las alertas NO se celebran."
//
// CAMBIOS DE ONBOARDING A EXIT:
// - useOnboardingAlerts -> useExitAlerts
// - Rutas: /dashboard/exit/...
// - Textos adaptados para Exit Intelligence
// ====================================================================

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useExitAlerts } from '@/hooks/useExitAlerts';

// ====================================================================
// INTERFACES
// ====================================================================

interface AlertasExitRankingProps {
  viewMode?: 'gerencias' | 'departamentos';
  parentDepartmentId?: string;
  scope?: 'company' | 'filtered';
}

interface GerenciaAlertData {
  gerenciaId: string;
  gerenciaName: string;
  alertasCriticas: number;
  alertasAltas: number;
  alertasPendientes: number;
  alertasLeyKarin: number;
  montoRiesgo: number;
  exitsCount: number;
}

// ====================================================================
// CONSTANTES
// ====================================================================

const COSTO_POR_SALIDA = 5400000; // $5.4M CLP estimado por salida

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function AlertasExitRanking({
  viewMode = 'gerencias',
  parentDepartmentId,
  scope = 'filtered'
}: AlertasExitRankingProps) {

  const router = useRouter();
  const { alerts, metrics, loading } = useExitAlerts({ scope });

  // ================================================================
  // HELPERS
  // ================================================================

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleGerenciaClick = (gerenciaId: string) => {
    router.push(`/dashboard/exit?tab=alertas&gerenciaId=${gerenciaId}`);
  };

  // ================================================================
  // CEO METRICS
  // ================================================================

  const ceoMetrics = useMemo(() => {
    if (!alerts || alerts.length === 0) {
      return {
        alertasPendientes: 0,
        alertasLeyKarin: 0,
        montoTotal: 0,
        tasaCriticas: 0
      };
    }

    const alertasPendientes = alerts.filter((a: any) => a.status === 'pending');
    const alertasLeyKarin = alertasPendientes.filter((a: any) =>
      a.alertType === 'ley_karin'
    ).length;

    // Estimar monto basado en alertas criticas (cada una representa potencial salida)
    const exitosEnRiesgo = new Set<string>();
    alertasPendientes.forEach((alert: any) => {
      if (alert.exitRecord?.id) {
        exitosEnRiesgo.add(alert.exitRecord.id);
      }
    });

    const montoTotal = exitosEnRiesgo.size * COSTO_POR_SALIDA;

    const totalAlertas = alertasPendientes.length;
    const criticas = alertasPendientes.filter((a: any) => a.severity === 'critical').length;
    const tasaCriticas = totalAlertas > 0
      ? Math.round((criticas / totalAlertas) * 100)
      : 0;

    return {
      alertasPendientes: alertasPendientes.length,
      alertasLeyKarin,
      montoTotal,
      tasaCriticas
    };
  }, [alerts]);

  // ================================================================
  // RANKING POR GERENCIA
  // ================================================================

  const gerenciasRanking = useMemo((): GerenciaAlertData[] => {
    if (!alerts || alerts.length === 0) return [];

    const gerenciaMap = new Map<string, GerenciaAlertData>();
    const alertasPendientes = alerts.filter((a: any) => a.status === 'pending');

    // FILTRAR segun viewMode (gerencia + sus hijos)
    const filteredAlerts = viewMode === 'departamentos' && parentDepartmentId
      ? alertasPendientes.filter((a: any) => {
          const dept = a.department;
          return dept?.id === parentDepartmentId || dept?.parentId === parentDepartmentId;
        })
      : alertasPendientes;

    filteredAlerts.forEach((alert: any) => {
      const dept = alert.department;
      if (!dept) return;

      let gerenciaId: string;
      let gerenciaName: string;

      if (viewMode === 'departamentos' && parentDepartmentId) {
        gerenciaId = dept.id;
        gerenciaName = dept.displayName;
      } else {
        // Agrupar por gerencia (nivel 2) o el departamento si es nivel 2
        const isGerencia = dept.level === 2;
        if (isGerencia) {
          gerenciaId = dept.id;
          gerenciaName = dept.displayName;
        } else if (dept.parentId) {
          // Buscar en alertas anteriores si tenemos info del padre
          gerenciaId = dept.parentId;
          gerenciaName = dept.parentName || dept.displayName;
        } else {
          gerenciaId = dept.id;
          gerenciaName = dept.displayName;
        }
      }

      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, {
          gerenciaId,
          gerenciaName,
          alertasCriticas: 0,
          alertasAltas: 0,
          alertasPendientes: 0,
          alertasLeyKarin: 0,
          montoRiesgo: 0,
          exitsCount: 0
        });
      }

      const gerencia = gerenciaMap.get(gerenciaId)!;

      if (alert.severity === 'critical') {
        gerencia.alertasCriticas += 1;
      } else if (alert.severity === 'high') {
        gerencia.alertasAltas += 1;
      }

      if (alert.alertType === 'ley_karin') {
        gerencia.alertasLeyKarin += 1;
      }

      gerencia.alertasPendientes += 1;

      // Contar exits unicos
      if (alert.exitRecord?.id) {
        gerencia.exitsCount += 1;
        gerencia.montoRiesgo = gerencia.exitsCount * COSTO_POR_SALIDA;
      }
    });

    return Array.from(gerenciaMap.values())
      .sort((a, b) => {
        // Priorizar Ley Karin
        if (b.alertasLeyKarin !== a.alertasLeyKarin) {
          return b.alertasLeyKarin - a.alertasLeyKarin;
        }
        // Luego criticas
        if (b.alertasCriticas !== a.alertasCriticas) {
          return b.alertasCriticas - a.alertasCriticas;
        }
        return b.montoRiesgo - a.montoRiesgo;
      });

  }, [alerts, viewMode, parentDepartmentId]);

  // Datos derivados
  const totalCriticas = gerenciasRanking.reduce((sum, g) => sum + g.alertasCriticas, 0);
  const totalLeyKarin = gerenciasRanking.reduce((sum, g) => sum + g.alertasLeyKarin, 0);
  const top3 = gerenciasRanking.slice(0, 3);
  const resto45 = gerenciasRanking.slice(3, 5);
  const restantes = gerenciasRanking.length - 5;
  const labelUnidad = viewMode === 'gerencias' ? 'gerencias' : 'departamentos';

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <div className="w-full max-w-[700px] mx-auto">
        <div className="fhr-card p-4 sm:p-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-700/30 rounded-xl" />
            ))}
          </div>
          <div className="h-px bg-slate-700/30 my-6" />
          <div className="space-y-0 rounded-xl border border-slate-700/30 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[52px] bg-slate-700/20 border-b border-slate-700/30 last:border-b-0" />
            ))}
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
        <div className="fhr-card p-6 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-green-400" strokeWidth={1.5} />
          </div>
          <p className="text-slate-300 font-light mb-1">
            Todo en orden
          </p>
          <p className="text-slate-500 text-sm">
            No hay alertas activas por {labelUnidad}
          </p>
        </div>
      </div>
    );
  }

  // ================================================================
  // RENDER PRINCIPAL
  // ================================================================

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <div className="fhr-card p-4 sm:p-6 relative overflow-hidden">

        {/* LINEA TESLA SUPERIOR */}
        <div className="fhr-top-line" />

        {/* CEO SUMMARY - Mobile-first (2 cols -> 3 cols) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">

          {/* Alertas Pendientes */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                Pendientes
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-light text-white tabular-nums">
              {ceoMetrics.alertasPendientes}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-600 mt-1">alertas</p>
          </div>

          {/* Ley Karin */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ShieldAlert className="w-3 h-3 text-red-400" strokeWidth={1.5} />
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                Ley Karin
              </span>
            </div>
            <p className={`text-3xl sm:text-4xl font-light tabular-nums ${
              ceoMetrics.alertasLeyKarin > 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {ceoMetrics.alertasLeyKarin}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-600 mt-1">
              {ceoMetrics.alertasLeyKarin > 0 ? 'atencion' : 'sin alertas'}
            </p>
          </div>

          {/* Monto en Juego - Full width en mobile */}
          <div className="text-center col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-slate-500" strokeWidth={1.5} />
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                Impacto Est.
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-light text-white tabular-nums">
              {formatCurrency(ceoMetrics.montoTotal)}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-600 mt-1">CLP</p>
          </div>

        </div>

        {/* DIVIDER FOCALIZAHR */}
        <div className="fhr-divider my-6">
          <div className="fhr-divider-line" />
          <div className="fhr-divider-dot" />
          <div className="fhr-divider-line" />
        </div>

        {/* HEADER SECCION */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
            <span className="text-xs sm:text-sm font-light text-slate-400 uppercase tracking-wide">
              Por {viewMode === 'gerencias' ? 'Gerencia' : 'Departamento'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalLeyKarin > 0 && (
              <span className="fhr-badge fhr-badge-error text-xs flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {totalLeyKarin} Ley Karin
              </span>
            )}
            {totalCriticas > 0 && (
              <span className="fhr-badge fhr-badge-warning text-xs">
                {totalCriticas} criticas
              </span>
            )}
          </div>
        </div>

        {/* LISTA UNICA - UN solo contenedor */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden bg-slate-800/20">

          {/* TOP 3 - Items destacados */}
          <div className="divide-y divide-slate-700/30">
            {top3.map((gerencia, index) => (
              <motion.div
                key={gerencia.gerenciaId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGerenciaClick(gerencia.gerenciaId)}
                className="
                  flex items-center justify-between
                  p-3 sm:p-4
                  hover:bg-slate-800/40
                  cursor-pointer
                  transition-colors
                  group
                  min-h-[52px]
                "
              >
                {/* Izquierda: Posicion + Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">

                  {/* Posicion destacada */}
                  <div className={`
                    w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                    text-sm font-medium shrink-0
                    ${index === 0
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : index === 1
                        ? 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                        : 'bg-amber-700/15 text-amber-600 border border-amber-700/30'
                    }
                  `}>
                    {index + 1}
                  </div>

                  {/* Nombre + Exits */}
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-light text-white truncate group-hover:text-cyan-400 transition-colors">
                      {toTitleCase(gerencia.gerenciaName)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
                      <span>{gerencia.exitsCount} exits</span>
                      {gerencia.alertasLeyKarin > 0 && (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          {gerencia.alertasLeyKarin}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Derecha: Metricas */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">

                  {/* Criticas - UNICO ROJO */}
                  <div className="text-right">
                    <span className={`text-base sm:text-lg font-light tabular-nums ${
                      gerencia.alertasCriticas > 0 ? 'text-red-400' : 'text-slate-600'
                    }`}>
                      {gerencia.alertasCriticas}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-600 uppercase ml-1 hidden sm:inline">
                      crit
                    </span>
                  </div>

                  {/* Monto - NEUTRO */}
                  <span className="text-xs sm:text-sm font-light text-slate-400 tabular-nums w-14 sm:w-16 text-right">
                    {formatCurrency(gerencia.montoRiesgo)}
                  </span>

                  {/* Arrow */}
                  <ChevronRight
                    className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors hidden sm:block"
                    strokeWidth={1.5}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Separador visual dashed */}
          {resto45.length > 0 && (
            <div className="border-t border-dashed border-slate-700/50" />
          )}

          {/* POSICIONES 4-5 - Compactos */}
          {resto45.map((gerencia, index) => (
            <motion.div
              key={gerencia.gerenciaId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.03 }}
              onClick={() => handleGerenciaClick(gerencia.gerenciaId)}
              className="
                flex items-center justify-between
                py-2.5 sm:py-3 px-3 sm:px-4
                hover:bg-slate-800/30
                cursor-pointer
                transition-colors
                group
                min-h-[44px]
                border-t border-slate-700/30 first:border-t-0
              "
            >
              {/* Izquierda */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <span className="text-slate-600 text-xs tabular-nums w-5 shrink-0">
                  {String(index + 4).padStart(2, '0')}
                </span>
                <span className="text-slate-400 text-sm font-light truncate group-hover:text-white transition-colors">
                  {toTitleCase(gerencia.gerenciaName)}
                </span>
                {gerencia.alertasLeyKarin > 0 && (
                  <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                )}
              </div>

              {/* Derecha */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className={`text-sm tabular-nums ${
                  gerencia.alertasCriticas > 0 ? 'text-red-400' : 'text-slate-600'
                }`}>
                  {gerencia.alertasCriticas}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 tabular-nums w-14 sm:w-16 text-right">
                  {formatCurrency(gerencia.montoRiesgo)}
                </span>
                <ChevronRight
                  className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 transition-colors hidden sm:block"
                  strokeWidth={1.5}
                />
              </div>
            </motion.div>
          ))}

        </div>

        {/* BOTON VER MAS */}
        {restantes > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/dashboard/exit?tab=alertas')}
            className="fhr-btn fhr-btn-ghost w-full mt-4 min-h-[44px]"
          >
            Mostrar {restantes} mas
            <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </motion.button>
        )}

      </div>
    </div>
  );
}
