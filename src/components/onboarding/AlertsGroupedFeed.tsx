// src/components/onboarding/AlertsGroupedFeed.tsx
// COMPONENTE SEPARADO: Feed de Alertas con Jerarquía Completa
// v4.1 DISEÑO FOCALIZAHR: Iconografía profesional + Glassmorphism + Gradientes marca
// ✅ Maneja: personas directas (level=2), departamentos (level=3), huérfanos

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Building,        // ✅ Más profesional que Building2
  AlertCircle,     // ✅ Más sutil que AlertTriangle
  AlertTriangle    // Mantener para huérfanos
} from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';
import AlertsTabsToggle from './AlertsTabsToggle';
import DepartmentCard from './DepartmentCard';
import DirectReportsSection from './DirectReportsSection';

// ============================================================================
// ESTILOS FOCALIZAHR - Gradiente Marca
// ============================================================================
const gradientTextStyle = {
  background: 'linear-gradient(135deg, #22D3EE, #3B82F6, #A78BFA)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
} as const;

interface AlertsGroupedFeedProps {
  alerts: any[];
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
  loading: boolean;
}

// Interfaces para tipar correctamente
interface PersonData {
  journeyId: string;
  journey: any;
  alerts: any[];
  activeCount: number;
  managedCount: number;
  risk: number;
}

interface DepartmentData {
  departmentId: string;
  departmentName: string;
  people: PersonData[];
  totalRisk: number;
  pendingRisk: number;
  managedRisk: number;
  activeCount: number;
  managedCount: number;
}

interface GerenciaData {
  gerenciaId: string;
  gerenciaName: string;
  directReports: PersonData[];  // ✅ NUEVO: personas directas
  departments: DepartmentData[];
  totalRisk: number;
  pendingRisk: number;
  managedRisk: number;
  activeCount: number;
  managedCount: number;
  totalPeople: number;
  isOrphanGroup: boolean;  // ✅ NUEVO: flag para huérfanos
}

export default function AlertsGroupedFeed({
  alerts,
  activeTab,
  onTabChange,
  onAcknowledgeAlert,
  loading
}: AlertsGroupedFeedProps) {
  
  const { success, error: showError } = useToast();
  const [expandedGerencias, setExpandedGerencias] = useState<Set<string>>(new Set());
  
  // ========================================
  // CÁLCULOS
  // ========================================
  
  const activeCount = alerts.filter(a => a.status === 'pending').length;
  const managedCount = alerts.filter(a => a.status !== 'pending').length;
  
  // ========================================
  // HELPERS
  // ========================================

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // ========================================
  // FILTRADO DE ALERTAS
  // ========================================
  
  const filteredAlerts = useMemo(() => {
    switch(activeTab) {
      case 'active': return alerts.filter(a => a.status === 'pending');
      case 'managed': return alerts.filter(a => a.status !== 'pending');
      default: return alerts;
    }
  }, [alerts, activeTab]);

  // ========================================
  // AGRUPACIÓN JERÁRQUICA CON PERSONAS DIRECTAS
  // v4.0: Separa personas directas (level=2) de departamentos (level=3)
  // ========================================
  
  // Paso 1: Construir mapa de departamentos Y gerencias
  const deptMap = useMemo(() => {
    const map = new Map<string, any>();
    alerts.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      map.set(dept.id, dept);
      
      if (dept.parent) {
        map.set(dept.parent.id, dept.parent);
      }
    });
    return map;
  }, [alerts]);
  
  // Paso 2: Agrupar alertas por Gerencia con separación personas directas/departamentos
  const alertsByGerencia = useMemo(() => {
    const gerenciaMap = new Map<string, {
      directReportsMap: Map<string, PersonData>;
      departmentsMap: Map<string, {
        departmentId: string;
        departmentName: string;
        peopleMap: Map<string, PersonData>;
      }>;
    }>();
    
    filteredAlerts.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      // ========================================
      // CLASIFICACIÓN: ¿Gerencia directa, Departamento normal, o Huérfano?
      // ========================================
      const isDirectReport = dept.level === 2 || (!dept.parentId && dept.unitType === 'gerencia');
      const isOrphan = dept.level === 3 && !dept.parentId;
      
      let gerenciaId: string;
      let gerenciaName: string;
      let isInDirectReports = false;
      
      if (isDirectReport) {
        // CASO A: Persona directa en gerencia (Gerente, Secretaria, etc.)
        gerenciaId = dept.id;
        gerenciaName = dept.displayName;
        isInDirectReports = true;
      } else if (isOrphan) {
        // CASO B: Departamento huérfano (sin gerencia)
        gerenciaId = 'sin-gerencia';
        gerenciaName = '⚠️ SIN GERENCIA ASIGNADA';
      } else {
        // CASO C: Departamento normal con gerencia
        gerenciaId = dept.parentId!;
        gerenciaName = deptMap.get(dept.parentId!)?.displayName || 'Gerencia Sin Nombre';
      }
      
      // Inicializar gerencia si no existe
      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, {
          directReportsMap: new Map(),
          departmentsMap: new Map()
        });
      }
      
      const gerencia = gerenciaMap.get(gerenciaId)!;
      const journeyId = alert.journeyId || alert.journey?.id;
      if (!journeyId) return;
      
      if (isInDirectReports) {
        // ✅ PERSONA DIRECTA: Agregar a directReportsMap
        if (!gerencia.directReportsMap.has(journeyId)) {
          gerencia.directReportsMap.set(journeyId, {
            journeyId,
            journey: alert.journey,
            alerts: [],
            activeCount: 0,
            managedCount: 0,
            risk: 0
          });
        }
        
        const person = gerencia.directReportsMap.get(journeyId)!;
        person.alerts.push(alert);
        
        if (alert.status === 'pending') {
          person.activeCount++;
        } else {
          person.managedCount++;
        }
      } else {
        // ✅ PERSONA EN DEPARTAMENTO: Agregar a departmentsMap
        const departmentId = dept.id;
        const departmentName = dept.displayName;
        
        if (!gerencia.departmentsMap.has(departmentId)) {
          gerencia.departmentsMap.set(departmentId, {
            departmentId,
            departmentName,
            peopleMap: new Map()
          });
        }
        
        const department = gerencia.departmentsMap.get(departmentId)!;
        
        if (!department.peopleMap.has(journeyId)) {
          department.peopleMap.set(journeyId, {
            journeyId,
            journey: alert.journey,
            alerts: [],
            activeCount: 0,
            managedCount: 0,
            risk: 0
          });
        }
        
        const person = department.peopleMap.get(journeyId)!;
        person.alerts.push(alert);
        
        if (alert.status === 'pending') {
          person.activeCount++;
        } else {
          person.managedCount++;
        }
      }
    });
    
    // ========================================
    // CALCULAR RIESGOS POR PERSONA ÚNICA
    // ========================================
    const gerenciasArray: GerenciaData[] = Array.from(gerenciaMap.entries()).map(([gerenciaId, data]) => {
      const gerenciaName = gerenciaId === 'sin-gerencia' 
        ? '⚠️ SIN GERENCIA ASIGNADA'
        : deptMap.get(gerenciaId)?.displayName || 'Gerencia Sin Nombre';
      
      // Calcular riesgo personas directas
      const directReports = Array.from(data.directReportsMap.values()).map((person) => {
        const firstAlert = person.alerts[0];
        const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(firstAlert as any, firstAlert.journey);
        const risk = businessCase?.financials?.potentialAnnualLoss || 0;
        
        return {
          ...person,
          risk
        };
      });
      
      // Calcular riesgo departamentos
      const departments = Array.from(data.departmentsMap.values()).map(dept => {
        const people = Array.from(dept.peopleMap.values()).map((person) => {
          const firstAlert = person.alerts[0];
          const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(firstAlert as any, firstAlert.journey);
          const risk = businessCase?.financials?.potentialAnnualLoss || 0;
          
          return {
            ...person,
            risk
          };
        });
        
        const totalRisk = people.reduce((sum, p) => sum + p.risk, 0);
        const pendingRisk = people
          .filter(p => p.activeCount > 0)
          .reduce((sum, p) => sum + p.risk, 0);
        const managedRisk = people
          .filter(p => p.managedCount > 0 && p.activeCount === 0)
          .reduce((sum, p) => sum + p.risk, 0);
        
        const activeCount = people.reduce((sum, p) => sum + p.activeCount, 0);
        const managedCount = people.reduce((sum, p) => sum + p.managedCount, 0);
        
        return {
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          people,
          totalRisk,
          pendingRisk,
          managedRisk,
          activeCount,
          managedCount
        };
      });
      
      // Riesgo total gerencia = personas directas + departamentos
      const directReportsRisk = directReports.reduce((sum, p) => sum + p.risk, 0);
      const departmentsRisk = departments.reduce((sum, d) => sum + d.totalRisk, 0);
      const totalRisk = directReportsRisk + departmentsRisk;
      
      const directReportsPendingRisk = directReports
        .filter(p => p.activeCount > 0)
        .reduce((sum, p) => sum + p.risk, 0);
      const departmentsPendingRisk = departments.reduce((sum, d) => sum + d.pendingRisk, 0);
      const pendingRisk = directReportsPendingRisk + departmentsPendingRisk;
      
      const directReportsManagedRisk = directReports
        .filter(p => p.managedCount > 0 && p.activeCount === 0)
        .reduce((sum, p) => sum + p.risk, 0);
      const departmentsManagedRisk = departments.reduce((sum, d) => sum + d.managedRisk, 0);
      const managedRisk = directReportsManagedRisk + departmentsManagedRisk;
      
      const directReportsActive = directReports.reduce((sum, p) => sum + p.activeCount, 0);
      const departmentsActive = departments.reduce((sum, d) => sum + d.activeCount, 0);
      const activeCount = directReportsActive + departmentsActive;
      
      const directReportsManaged = directReports.reduce((sum, p) => sum + p.managedCount, 0);
      const departmentsManaged = departments.reduce((sum, d) => sum + d.managedCount, 0);
      const managedCount = directReportsManaged + departmentsManaged;
      
      const totalPeople = directReports.length + departments.reduce((sum, d) => sum + d.people.length, 0);
      
      return {
        gerenciaId,
        gerenciaName,
        directReports: directReports.sort((a, b) => b.risk - a.risk),
        departments: departments.sort((a, b) => b.pendingRisk - a.pendingRisk),
        totalRisk,
        pendingRisk,
        managedRisk,
        activeCount,
        managedCount,
        totalPeople,
        isOrphanGroup: gerenciaId === 'sin-gerencia'
      };
    });
    
    // Ordenar: huérfanos al final, resto por riesgo pendiente
    return gerenciasArray.sort((a, b) => {
      if (a.isOrphanGroup) return 1;
      if (b.isOrphanGroup) return -1;
      return b.pendingRisk - a.pendingRisk;
    });
  }, [filteredAlerts, deptMap]);
  
  // Toggle expansión de gerencia
  const toggleGerencia = (gerenciaId: string) => {
    setExpandedGerencias(prev => {
      const next = new Set(prev);
      if (next.has(gerenciaId)) {
        next.delete(gerenciaId);
      } else {
        next.add(gerenciaId);
      }
      return next;
    });
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="space-y-6">
      
      {/* Header + Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-2xl font-light text-white">
            Alertas{' '}
            <span className="text-slate-500">
              Prioritarias
            </span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Intervenciones recomendadas para retener talento clave
          </p>
        </div>
        
        <AlertsTabsToggle 
          activeTab={activeTab} 
          onTabChange={onTabChange}
          counts={{ active: activeCount, managed: managedCount, all: alerts.length }}
          isTransitioning={loading}
        />
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-2">
        
        {/* Empty State */}
        {filteredAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20"
          >
            <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
              <ShieldCheck className="h-10 w-10 text-slate-600" />
            </div>
            <p className="text-lg text-slate-400 font-light">
              {activeTab === 'active' && 'Ecosistema saludable'}
              {activeTab === 'managed' && 'Sin alertas gestionadas aún'}
              {activeTab === 'all' && 'No hay alertas en el sistema'}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {activeTab === 'active' 
                ? 'No hay riesgos de fuga detectados en este momento'
                : 'Las alertas gestionadas aparecerán aquí'
              }
            </p>
          </motion.div>
        ) : (
          /* Feed Agrupado por Gerencia */
          <div className="space-y-6">
            {alertsByGerencia.map((gerenciaGroup, groupIndex) => {
              const isExpanded = expandedGerencias.has(gerenciaGroup.gerenciaId);
              const pendingPercentage = gerenciaGroup.totalRisk > 0 
                ? Math.round((gerenciaGroup.pendingRisk / gerenciaGroup.totalRisk) * 100) 
                : 0;

              return (
                <motion.div
                  key={gerenciaGroup.gerenciaId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="space-y-2"
                >
                  {/* Header Gerencia */}
                  <div
                    onClick={() => toggleGerencia(gerenciaGroup.gerenciaId)}
                    className={`
                      group relative overflow-hidden
                      ${gerenciaGroup.isOrphanGroup
                        ? 'bg-gradient-to-br from-amber-950/30 to-orange-950/20 hover:from-amber-950/40 hover:to-orange-950/30 border-amber-500/20 hover:border-amber-400/30'
                        : 'bg-slate-900/40 hover:bg-slate-900/60 border-slate-700/30 hover:border-cyan-500/30'
                      }
                      backdrop-blur-sm
                      border
                      rounded-xl transition-all duration-300 cursor-pointer
                      hover:shadow-lg hover:shadow-cyan-500/10
                      p-6
                    `}
                  >
                    <div className="flex items-center justify-between">
                      {/* Izquierda: Nombre + Totales */}
                      <div className="flex items-center gap-5">
                        {/* Icono Gerencia */}
                        <div className={`
                          w-14 h-14 rounded-xl flex items-center justify-center
                          transition-all duration-300
                          ${gerenciaGroup.isOrphanGroup
                            ? 'bg-amber-950/50 border border-amber-500/30'
                            : 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 group-hover:border-cyan-400/50'
                          }
                        `}>
                          {gerenciaGroup.isOrphanGroup ? (
                            <AlertTriangle className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
                          ) : (
                            <Building className="h-7 w-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" strokeWidth={1.5} />
                          )}
                        </div>
                        
                        {/* Nombre y stats */}
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <h4 className={`text-2xl font-light transition-colors ${
                              gerenciaGroup.isOrphanGroup
                                ? 'text-amber-100 group-hover:text-amber-300'
                                : 'text-white'
                            }`}>
                              {gerenciaGroup.isOrphanGroup ? (
                                gerenciaGroup.gerenciaName
                              ) : (
                                <>
                                  {gerenciaGroup.gerenciaName.split(' ')[0]}{' '}
                                  <span style={gradientTextStyle}>
                                    {gerenciaGroup.gerenciaName.split(' ').slice(1).join(' ')}
                                  </span>
                                </>
                              )}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                              gerenciaGroup.isOrphanGroup
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                : 'bg-slate-800/50 border border-slate-600/30 text-slate-300'
                            }`}>
                              {gerenciaGroup.totalPeople} {gerenciaGroup.totalPeople === 1 ? 'persona' : 'personas'}
                            </span>
                            {gerenciaGroup.directReports.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
                                {gerenciaGroup.directReports.length} directa{gerenciaGroup.directReports.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {gerenciaGroup.departments.length > 0 && (
                              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                                gerenciaGroup.isOrphanGroup
                                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                  : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                              }`}>
                                {gerenciaGroup.departments.length} {gerenciaGroup.departments.length === 1 ? 'depto' : 'deptos'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-5 text-sm mt-1">
                            <span className={gerenciaGroup.isOrphanGroup ? 'text-amber-200/60' : 'text-slate-400'}>
                              Riesgo Total:{' '}
                              <span className="font-medium text-lg" style={gradientTextStyle}>
                                {formatCurrency(gerenciaGroup.totalRisk)}
                              </span>
                            </span>
                            <span className={gerenciaGroup.isOrphanGroup ? 'text-amber-600/40' : 'text-slate-700'}>•</span>
                            <span className={`font-semibold ${
                              pendingPercentage >= 70 ? 'text-red-400' : 
                              pendingPercentage >= 40 ? 'text-amber-400' : 
                              'text-green-400'
                            }`}>
                              {pendingPercentage}% pendiente
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Derecha: Stats + Toggle */}
                      <div className="flex items-center gap-8">
                        {/* Mini stats */}
                        <div className="hidden md:flex items-center gap-8">
                          <div className="text-center">
                            <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                              gerenciaGroup.isOrphanGroup ? 'text-amber-400/60' : 'text-slate-500'
                            }`}>
                              ACTIVAS
                            </div>
                            <div className="text-2xl font-light text-amber-400">
                              {gerenciaGroup.activeCount}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                              gerenciaGroup.isOrphanGroup ? 'text-amber-400/60' : 'text-slate-500'
                            }`}>
                              GESTIONADAS
                            </div>
                            <div className="text-2xl font-light text-emerald-400">
                              {gerenciaGroup.managedCount}
                            </div>
                          </div>
                        </div>

                        {/* Botón expand/collapse */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className={`
                            w-11 h-11 rounded-xl flex items-center justify-center
                            transition-all duration-300
                            ${gerenciaGroup.isOrphanGroup
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/40'
                              : 'bg-slate-800/30 text-slate-400 border border-slate-600/30 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/40'
                            }
                          `}
                        >
                          <ChevronDown className="h-5 w-5" strokeWidth={2} />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido de la Gerencia (colapsable) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-4 pl-4 pt-2"
                      >
                        {/* SECCIÓN 1: PERSONAS DIRECTAS */}
                        {gerenciaGroup.directReports.length > 0 && (
                          <DirectReportsSection
                            people={gerenciaGroup.directReports}
                            gerenciaName={gerenciaGroup.gerenciaName}
                            onAcknowledgeAlert={onAcknowledgeAlert}
                          />
                        )}
                        
                        {/* SECCIÓN 2: DEPARTAMENTOS */}
                        {gerenciaGroup.departments.length > 0 && (
                          <div className="space-y-2">
                            {gerenciaGroup.directReports.length > 0 && (
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-1 border-t border-slate-700/30" />
                                <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                                  Departamentos
                                </span>
                                <div className="flex-1 border-t border-slate-700/30" />
                              </div>
                            )}
                            {gerenciaGroup.departments.map((department, deptIndex) => (
                              <DepartmentCard
                                key={department.departmentId}
                                department={department}
                                index={deptIndex}
                                onAcknowledgeAlert={onAcknowledgeAlert}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}