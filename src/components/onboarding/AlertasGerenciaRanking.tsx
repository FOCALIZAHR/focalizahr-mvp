// ====================================================================
// ALERTAS GERENCIA RANKING - USA useOnboardingAlerts (DATOS REALES)
// src/components/onboarding/AlertasGerenciaRanking.tsx
// v1.6 - TIPOS CORREGIDOS - Department extendido
// ====================================================================

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Building2, 
  DollarSign,
  ChevronRight,
  Shield,
  Loader2
} from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';

// ====================================================================
// INTERFACES LOCALES (extendidas para jerarquía)
// ====================================================================

interface DepartmentExtended {
  id: string;
  displayName: string;
  standardCategory: string | null;
  level?: number;
  parentId?: string | null;
  unitType?: string;
  parent?: {
    id: string;
    displayName: string;
  } | null;
}

interface JourneyExtended {
  id: string;
  fullName: string;
  departmentId: string;
  currentStage: number;
  exoScore: number | null;
  retentionRisk: string | null;
  department: DepartmentExtended | null;
}

interface AlertExtended {
  id: string;
  journeyId: string;
  severity: string;
  status: string;
  journey: JourneyExtended;
  [key: string]: any; // Otros campos
}

interface GerenciaAlertData {
  gerenciaId: string;
  gerenciaName: string;
  alertasCriticas: number;
  alertasAltas: number;
  alertasPendientes: number;
  totalAlertas: number;
  montoRiesgo: number;
  personasEnRiesgo: number;
  departamentosCount: number;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default function AlertasGerenciaRanking() {
  
  const router = useRouter();
  
  // ================================================================
  // USAR HOOK DE ALERTAS REALES
  // ================================================================
  const { alerts, loading } = useOnboardingAlerts();

  // ================================================================
  // PROCESAR Y AGRUPAR POR GERENCIA
  // ================================================================
  const gerenciasRanking = useMemo((): GerenciaAlertData[] => {
    if (!alerts || alerts.length === 0) {
      return [];
    }

    // Cast a tipo extendido
    const alertsExtended = alerts as AlertExtended[];

    // Mapa para acumular datos por gerencia
    const gerenciaMap = new Map<string, GerenciaAlertData>();
    
    // Mapa de departamentos para resolver nombres de gerencias
    const deptMap = new Map<string, DepartmentExtended>();
    alertsExtended.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      deptMap.set(dept.id, dept);
      if (dept.parent) {
        deptMap.set(dept.parent.id, dept.parent as DepartmentExtended);
      }
    });

    // Set para contar personas únicas por gerencia
    const personasPorGerencia = new Map<string, Set<string>>();

    // Filtrar solo alertas pendientes (activas)
    const alertasPendientes = alertsExtended.filter(a => a.status === 'pending');

    alertasPendientes.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      // ============================================================
      // CLASIFICACIÓN JERÁRQUICA (mismo patrón que AlertsGroupedFeed)
      // ============================================================
      const level = dept.level;
      const parentId = dept.parentId;
      const unitType = dept.unitType;
      
      const isGerenciaDirecta = level === 2 || (!parentId && unitType === 'gerencia');
      
      let gerenciaId: string;
      let gerenciaName: string;
      
      if (isGerenciaDirecta) {
        // Persona directa en gerencia
        gerenciaId = dept.id;
        gerenciaName = dept.displayName;
      } else if (parentId) {
        // Departamento con gerencia padre
        gerenciaId = parentId;
        const parentDept = deptMap.get(parentId);
        gerenciaName = parentDept?.displayName || dept.parent?.displayName || 'Gerencia';
      } else {
        // Huérfano - saltar
        return;
      }

      // ============================================================
      // Inicializar gerencia si no existe
      // ============================================================
      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, {
          gerenciaId,
          gerenciaName,
          alertasCriticas: 0,
          alertasAltas: 0,
          alertasPendientes: 0,
          totalAlertas: 0,
          montoRiesgo: 0,
          personasEnRiesgo: 0,
          departamentosCount: 0
        });
        personasPorGerencia.set(gerenciaId, new Set());
      }

      const gerencia = gerenciaMap.get(gerenciaId)!;
      const personasSet = personasPorGerencia.get(gerenciaId)!;
      
      // Contar alertas por severidad
      if (alert.severity === 'critical') {
        gerencia.alertasCriticas += 1;
      } else if (alert.severity === 'high') {
        gerencia.alertasAltas += 1;
      }
      gerencia.alertasPendientes += 1;
      gerencia.totalAlertas += 1;
      
      // Contar persona única (por journeyId)
      const journeyId = alert.journeyId || alert.journey?.id;
      if (journeyId && !personasSet.has(journeyId)) {
        personasSet.add(journeyId);
        
        // Calcular riesgo solo para persona única
        try {
          const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
            alert as any, 
            alert.journey as any
          );
          gerencia.montoRiesgo += businessCase?.financials?.potentialAnnualLoss || 0;
        } catch {
          // Si falla el cálculo, usar valor default
          gerencia.montoRiesgo += 5400000; // ~$5.4M default
        }
      }
    });

    // Actualizar conteo de personas únicas
    gerenciaMap.forEach((gerencia, id) => {
      gerencia.personasEnRiesgo = personasPorGerencia.get(id)?.size || 0;
    });

    // Contar departamentos únicos por gerencia
    const deptsPorGerencia = new Map<string, Set<string>>();
    alertasPendientes.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      const level = dept.level;
      const parentId = dept.parentId;
      const unitType = dept.unitType;
      
      const isGerenciaDirecta = level === 2 || (!parentId && unitType === 'gerencia');
      const gerenciaId = isGerenciaDirecta ? dept.id : (parentId || dept.id);
      
      if (!deptsPorGerencia.has(gerenciaId)) {
        deptsPorGerencia.set(gerenciaId, new Set());
      }
      deptsPorGerencia.get(gerenciaId)!.add(dept.id);
    });
    
    gerenciaMap.forEach((gerencia, id) => {
      gerencia.departamentosCount = deptsPorGerencia.get(id)?.size || 1;
    });

    // ============================================================
    // Ordenar por alertas críticas DESC, luego por monto riesgo
    // ============================================================
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

  const getSeverityColor = (alertas: number): string => {
    if (alertas >= 10) return 'text-red-400';
    if (alertas >= 5) return 'text-orange-400';
    if (alertas >= 1) return 'text-amber-400';
    return 'text-slate-400';
  };

  const handleClick = (gerenciaId: string) => {
    router.push(`/dashboard/onboarding/alerts?gerenciaId=${gerenciaId}`);
  };

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
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-sm">Cargando alertas...</span>
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
          className="w-full max-w-[700px] p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <Shield className="h-10 w-10 mx-auto text-green-400 mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            Sin Alertas Activas
          </h3>
          <p className="text-sm text-slate-400">
            Todas las alertas han sido gestionadas.
          </p>
        </div>
      </div>
    );
  }

  // ================================================================
  // CÁLCULOS TOTALES
  // ================================================================
  const totalCriticas = gerenciasRanking.reduce((sum, g) => sum + g.alertasCriticas, 0);
  const totalPendientes = gerenciasRanking.reduce((sum, g) => sum + g.alertasPendientes, 0);
  const totalRiesgo = gerenciasRanking.reduce((sum, g) => sum + g.montoRiesgo, 0);

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
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-base font-semibold text-white">
              Alertas por Gerencia
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-sm font-semibold">
                {totalCriticas} críticas
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-purple-400 text-sm font-semibold">
                {totalPendientes} activas
              </span>
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div 
          className="divide-y divide-slate-800/50 max-h-[280px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}
        >
          {gerenciasRanking.map((gerencia, index) => (
            <motion.div
              key={gerencia.gerenciaId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleClick(gerencia.gerenciaId)}
              className="px-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {/* Posición */}
                <div className={`
                  w-6 h-6 rounded-md flex items-center justify-center
                  text-xs font-bold shrink-0
                  ${index === 0 ? 'bg-red-500/20 text-red-400' : 
                    index === 1 ? 'bg-orange-500/20 text-orange-400' :
                    index === 2 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'}
                `}>
                  {index + 1}
                </div>
                
                {/* Icono */}
                <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                    {gerencia.gerenciaName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {gerencia.personasEnRiesgo} personas • {gerencia.departamentosCount} {gerencia.departamentosCount === 1 ? 'depto' : 'deptos'}
                  </p>
                </div>
                
                {/* Métricas */}
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="text-center">
                    <span className={`font-bold ${getSeverityColor(gerencia.alertasCriticas)}`}>
                      {gerencia.alertasCriticas}
                    </span>
                    <span className="text-slate-500 ml-1">crít</span>
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-purple-400">
                      {gerencia.alertasPendientes}
                    </span>
                    <span className="text-slate-500 ml-1">activas</span>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <span className="font-bold text-red-400">
                      {formatCurrency(gerencia.montoRiesgo)}
                    </span>
                  </div>
                </div>
                
                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
              </div>
            </motion.div>
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DollarSign className="h-3 w-3" />
            <span>Riesgo Total</span>
          </div>
          <span className="text-base font-bold text-red-400">
            {formatCurrency(totalRiesgo)}
          </span>
        </div>
      </div>
    </div>
  );
}