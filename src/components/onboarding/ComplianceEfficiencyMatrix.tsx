// ============================================================================
// REEMPLAZAR src/components/onboarding/ComplianceEfficiencyMatrix.tsx
// ============================================================================
// ComplianceEfficiencyMatrix V2.8 - Fix Agregación Completa para Gerencias
// Fecha: 6 Enero 2026
// Fix V2.8: participation y efficiency ahora se promedian del backend (no se recalculan)
// Fix V2.7: scores 4C agregados con promedio ponderado
// ============================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  ChevronDown,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Minus,
  AlertTriangle,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FocalizaIntelligenceModal, { 
  NPSAmplifier, 
  DimensionsGrid 
} from '@/components/ui/FocalizaIntelligenceModal';
import { 
  DIMENSION_NARRATIVES, 
  DIMENSION_KEY_MAP,
  getPositionLabel,
  getNPSLabel
} from '@/lib/constants/onboarding-narratives';
import type { ComplianceEfficiencyDataV2, ComplianceEmployeeDetailV2 } from '@/types/onboarding';


// ============================================================================
// INTERFACES
// ============================================================================

interface StageDetail {
  stage: 1 | 2 | 3 | 4;
  label: 'D1' | 'D7' | 'D30' | 'D90';
  status: 'responded' | 'overdue' | 'not_sent';
}

interface EmployeeDetail {
  id: string;
  fullName: string;
  currentStage: number;
  daysSinceHire: number;
  complianceStatus: 'completed' | 'overdue' | 'pending';
  daysOverdue?: number;
  stages?: StageDetail[];
}


interface ComplianceEfficiencyMatrixProps {
  departments: ComplianceEfficiencyDataV2[];
  loading?: boolean;
  viewMode?: 'gerencias' | 'departamentos';
  parentDepartmentId?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const DIMENSION_NAMES: Record<string, string> = {
  avgComplianceScore: 'Compliance',
  avgClarificationScore: 'Clarificación',
  avgCultureScore: 'Cultura',
  avgConnectionScore: 'Conexión'
};

// Solo ALERTAS tiene color semántico
const getAlertIndicator = (pct: number) => {
  if (pct >= 50) return { color: 'text-red-400', dot: 'bg-red-400' };
  if (pct >= 20) return { color: 'text-amber-400', dot: 'bg-amber-400' };
  return { color: 'text-emerald-400', dot: 'bg-emerald-400' };
};

const getStageColor = (status: string) => {
  switch (status) {
    case 'responded': return 'bg-cyan-500';
    case 'overdue': return 'bg-amber-500';
    case 'not_sent': return 'bg-slate-600';
    default: return 'bg-slate-700';
  }
};

const getEmployeeStatusBadge = (status: string, days?: number) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex gap-1 items-center text-xs">
          <CheckCircle2 className="w-3 h-3" /> Al día
        </Badge>
      );
    case 'overdue':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 flex gap-1 items-center text-xs">
          <AlertCircle className="w-3 h-3" /> Vencido {days ? `(${days}d)` : ''}
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30 flex gap-1 items-center text-xs">
          <Clock className="w-3 h-3" /> En plazo
        </Badge>
      );
    default:
      return null;
  }
};

const getWeakestDimension = (dept: ComplianceEfficiencyDataV2): { 
  name: string; 
  score: number; 
  key: keyof typeof DIMENSION_NARRATIVES;
} | null => {
  const scores = [
    { key: 'avgComplianceScore', value: dept.avgComplianceScore },
    { key: 'avgClarificationScore', value: dept.avgClarificationScore },
    { key: 'avgCultureScore', value: dept.avgCultureScore },
    { key: 'avgConnectionScore', value: dept.avgConnectionScore }
  ].filter(s => s.value !== null && s.value !== undefined) as { key: string; value: number }[];
  
  if (scores.length === 0) return null;
  
  const weakest = scores.reduce((min, s) => s.value < min.value ? s : min);
  const name = DIMENSION_NAMES[weakest.key];
  const scoreNormalized = Math.round((weakest.value / 5) * 100);
  const dimensionKey = DIMENSION_KEY_MAP[name];
  
  if (!dimensionKey) return null;
  
  return { name, score: scoreNormalized, key: dimensionKey };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ComplianceEfficiencyMatrix({ 
  departments = [], 
  loading,
  viewMode = 'departamentos',
  parentDepartmentId
}: ComplianceEfficiencyMatrixProps) {
  
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Estado para modal
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    dept: ComplianceEfficiencyDataV2;
    weakest: { name: string; score: number; key: keyof typeof DIMENSION_NARRATIVES };
    rank: number;
  } | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // FIX v2.8: Filtrar/AGRUPAR departamentos según viewMode
  // - Scores 4C: promedio ponderado por totalJourneys
  // - Participation/Efficiency: promedio ponderado por totalJourneys (del backend)
  // ══════════════════════════════════════════════════════════════════════════
  const filteredDepartments = useMemo(() => {
    // CASO 1: Modo departamentos con filtro de padre
    if (viewMode === 'departamentos' && parentDepartmentId) {
      return departments.filter(d => d.parentId === parentDepartmentId);
    }
    
    // CASO 2: Modo gerencias - AGREGAR datos de hijos a nivel gerencia
    if (viewMode === 'gerencias') {
      // Mapa principal de gerencias
      const gerenciaMap = new Map<string, ComplianceEfficiencyDataV2>();
      
      // ✅ FIX v2.8: Mapas auxiliares para acumular TODAS las métricas ponderadas
      const accumulators = new Map<string, {
        // Scores 4C
        sumCompliance: number; countCompliance: number;
        sumClarification: number; countClarification: number;
        sumCulture: number; countCulture: number;
        sumConnection: number; countConnection: number;
        // ✅ FIX v2.8: Participation y Efficiency del backend
        sumParticipation: number; countParticipation: number;
        sumEfficiency: number; countEfficiency: number;
      }>();
      
      for (const dept of departments) {
        const isGerencia = dept.level === 2 || dept.unitType === 'gerencia';
        
        let gerenciaId: string;
        let gerenciaName: string;
        
        if (isGerencia) {
          // Es una gerencia directa
          gerenciaId = dept.departmentId;
          gerenciaName = dept.departmentName;
        } else if (dept.parentId) {
          // Es departamento hijo → agregar a su gerencia padre
          gerenciaId = dept.parentId;
          gerenciaName = dept.parentName || 'Gerencia';
        } else {
          // Sin padre y no es gerencia → skip
          continue;
        }
        
        // Crear entrada de gerencia si no existe
        if (!gerenciaMap.has(gerenciaId)) {
          gerenciaMap.set(gerenciaId, {
            departmentId: gerenciaId,
            departmentName: gerenciaName,
            compliance: 0,
            status: 'neutral',
            responded: 0,
            overdue: 0,
            pending: 0,
            employeeDetail: [],
            level: 2,
            parentId: null,
            unitType: 'gerencia',
            participation: 0,
            efficiency: 0,
            avgComplianceScore: null,
            avgClarificationScore: null,
            avgCultureScore: null,
            avgConnectionScore: null,
            avgEXOScore: null,
            npsScore: null,
            totalJourneys: 0,
            atRiskJourneys: 0,
            alertsPercentage: 0
          });
          
          // ✅ FIX v2.8: Inicializar acumuladores
          accumulators.set(gerenciaId, {
            sumCompliance: 0, countCompliance: 0,
            sumClarification: 0, countClarification: 0,
            sumCulture: 0, countCulture: 0,
            sumConnection: 0, countConnection: 0,
            sumParticipation: 0, countParticipation: 0,
            sumEfficiency: 0, countEfficiency: 0
          });
        }
        
        const gerencia = gerenciaMap.get(gerenciaId)!;
        const acc = accumulators.get(gerenciaId)!;
        
        // Acumular métricas de conteo
        gerencia.responded += dept.responded;
        gerencia.overdue += dept.overdue;
        gerencia.pending += dept.pending;
        gerencia.employeeDetail = [...gerencia.employeeDetail, ...dept.employeeDetail];
        gerencia.totalJourneys = (gerencia.totalJourneys || 0) + (dept.totalJourneys || 0);
        gerencia.atRiskJourneys = (gerencia.atRiskJourneys || 0) + (dept.atRiskJourneys || 0);
        
        // Peso para promedios ponderados
        const weight = dept.totalJourneys || 1;
        
        // ✅ Acumular scores 4C
        if (dept.avgComplianceScore != null) {
          acc.sumCompliance += dept.avgComplianceScore * weight;
          acc.countCompliance += weight;
        }
        if (dept.avgClarificationScore != null) {
          acc.sumClarification += dept.avgClarificationScore * weight;
          acc.countClarification += weight;
        }
        if (dept.avgCultureScore != null) {
          acc.sumCulture += dept.avgCultureScore * weight;
          acc.countCulture += weight;
        }
        if (dept.avgConnectionScore != null) {
          acc.sumConnection += dept.avgConnectionScore * weight;
          acc.countConnection += weight;
        }
        
        // ✅ FIX v2.8: Acumular participation y efficiency del BACKEND
        if (dept.participation != null) {
          acc.sumParticipation += dept.participation * weight;
          acc.countParticipation += weight;
        }
        if (dept.efficiency != null) {
          acc.sumEfficiency += dept.efficiency * weight;
          acc.countEfficiency += weight;
        }
      }
      
      // Calcular métricas agregadas para cada gerencia
      return Array.from(gerenciaMap.entries()).map(([gerenciaId, g]) => {
        const acc = accumulators.get(gerenciaId)!;
        
        // Compliance basado en personas
        const total = g.responded + g.overdue;
        g.compliance = total > 0 
          ? Math.round((g.responded / total) * 100) 
          : 0;
        
        // ✅ FIX v2.8: Promediar participation y efficiency del backend
        g.participation = acc.countParticipation > 0 
          ? Math.round(acc.sumParticipation / acc.countParticipation)
          : 0;
        
        g.efficiency = acc.countEfficiency > 0 
          ? Math.round(acc.sumEfficiency / acc.countEfficiency)
          : 0;
        
        // Alertas
        g.alertsPercentage = g.totalJourneys && g.totalJourneys > 0
          ? Math.round(((g.atRiskJourneys || 0) / g.totalJourneys) * 100)
          : 0;
        
        // Status
        g.status = g.compliance >= 80 ? 'excellent' 
          : g.compliance >= 60 ? 'good' 
          : g.compliance >= 40 ? 'warning' 
          : g.compliance > 0 ? 'critical' 
          : 'neutral';
        
        // ✅ Calcular promedios ponderados de 4C
        g.avgComplianceScore = acc.countCompliance > 0 
          ? acc.sumCompliance / acc.countCompliance 
          : null;
        g.avgClarificationScore = acc.countClarification > 0 
          ? acc.sumClarification / acc.countClarification 
          : null;
        g.avgCultureScore = acc.countCulture > 0 
          ? acc.sumCulture / acc.countCulture 
          : null;
        g.avgConnectionScore = acc.countConnection > 0 
          ? acc.sumConnection / acc.countConnection 
          : null;
        
        return g;
      }).sort((a, b) => b.compliance - a.compliance);
    }
    
    // CASO 3: Sin filtro - retornar todo
    return departments;
  }, [departments, viewMode, parentDepartmentId]);

  const hasV2Data = filteredDepartments.some(d => d.participation !== undefined);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const openModal = (dept: ComplianceEfficiencyDataV2, index: number) => {
    const weakest = getWeakestDimension(dept);
    if (!weakest) return;
    
    setModalData({
      isOpen: true,
      dept,
      weakest,
      rank: index + 1
    });
  };

  // ════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <p className="text-slate-500 text-sm">Cargando matriz de eficiencia...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ════════════════════════════════════════════════════════════════════════
  if (!filteredDepartments || filteredDepartments.length === 0) {
    return (
      <div className="text-center py-16 fhr-card">
        <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
        <p className="text-slate-400">No hay datos departamentales disponibles</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="fhr-card overflow-hidden">
        
        {/* ═══════════════════════════════════════════════════════════════
            TABLA - DISTRIBUCIÓN OPTIMIZADA (1-3-2-2-2-2)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            
            {/* HEADER - FIX: Fuente reducida, gap-2 */}
            <div className="px-4 py-3 border-b border-slate-700/30 bg-slate-800/20">
              <div className="grid grid-cols-12 gap-2 items-center text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">{viewMode === 'gerencias' ? 'Gerencia' : 'Departamento'}</div>
                {hasV2Data ? (
                  <>
                    <div className="col-span-2 text-center">Participación</div>
                    <div className="col-span-2 text-center">Eficiencia</div>
                    <div className="col-span-2 text-center">Alertas</div>
                    <div className="col-span-2 text-center">Foco</div>
                  </>
                ) : (
                  <>
                    <div className="col-span-4">Cumplimiento</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-2 text-center">Estado</div>
                  </>
                )}
              </div>
            </div>
            
            {/* FILAS */}
            <div className="divide-y divide-slate-700/20">
              {filteredDepartments.map((dept, index) => {
                const isExpanded = expandedDepts.has(dept.departmentId);
                const isHovered = hoveredIndex === index;
                const weakest = getWeakestDimension(dept);
                const alertIndicator = getAlertIndicator(dept.alertsPercentage ?? 0);
                
                const sortedEmployees = [...(dept.employeeDetail || [])].sort((a, b) => {
                  const priorities = { overdue: 0, pending: 1, completed: 2 };
                  return priorities[a.complianceStatus] - priorities[b.complianceStatus];
                });

                const totalEmployees = dept.responded + dept.overdue + dept.pending;

                return (
                  <motion.div
                    key={dept.departmentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {/* FILA PRINCIPAL */}
                    <div
                      className={`
                        relative px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg mx-2
                        ${isHovered ? 'bg-white/[0.04]' : 'bg-transparent'}
                        ${isExpanded ? 'bg-slate-800/20' : ''}
                      `}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => toggleDepartment(dept.departmentId)}
                    >
                      {isExpanded && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500" />
                      )}

                      {/* FIX: gap-2 en lugar de gap-4 */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* # */}
                        <div className="col-span-1 text-center">
                          <span className="text-slate-400 text-sm">{index + 1}</span>
                        </div>
                        
                        {/* DEPARTAMENTO - col-span-3 */}
                        <div className="col-span-3 flex items-center gap-2 overflow-hidden">
                          <div className={`transition-transform duration-200 text-slate-500 flex-shrink-0 ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`}>
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span 
                                className="text-white font-medium text-sm truncate"
                                title={dept.departmentName}
                              >
                                {dept.departmentName}
                              </span>
                              {dept.unitType === 'gerencia' && (
                                <Badge variant="outline" className="text-[8px] bg-purple-500/10 text-purple-400 border-purple-500/30 px-1 py-0 flex-shrink-0">
                                  G
                                </Badge>
                              )}
                            </div>
                            <span className="text-slate-500 text-[10px]">{totalEmployees} {totalEmployees === 1 ? 'persona' : 'personas'}</span>
                          </div>
                        </div>
                        
                        {hasV2Data ? (
                          <>
                            {/* PARTICIPACIÓN - col-span-2 */}
                            <div className="col-span-2 text-center">
                              <span className="text-slate-300 text-sm">{dept.participation ?? 0}%</span>
                            </div>
                            
                            {/* EFICIENCIA - col-span-2 */}
                            <div className="col-span-2 text-center">
                              <span className="text-slate-300 text-sm">{dept.efficiency ?? 0}%</span>
                            </div>
                            
                            {/* ALERTAS - col-span-2 */}
                            <div className="col-span-2 text-center flex items-center justify-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${alertIndicator.dot}`} />
                              <span className={`text-sm ${alertIndicator.color}`}>
                                {dept.alertsPercentage ?? 0}%
                              </span>
                            </div>
                            
                            {/* FOCO - col-span-2, compacto con tooltip */}
                            <div className="col-span-2 flex justify-center">
                              {weakest ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(dept, index);
                                  }}
                                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors group"
                                  title={`${DIMENSION_NARRATIVES[weakest.key].humanName} - Día ${DIMENSION_NARRATIVES[weakest.key].day}`}
                                >
                                  <Target className="w-4 h-4 text-cyan-400/70 group-hover:text-cyan-400" />
                                  <span className="text-xs">Ver</span>
                                </button>
                              ) : (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </div>
                          </>
                        ) : (
                          /* LAYOUT LEGACY */
                          <>
                            <div className="col-span-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-cyan-500 transition-all"
                                    style={{ width: `${Math.min(dept.compliance, 100)}%` }}
                                  />
                                </div>
                                <span className="text-slate-300 text-xs w-10 text-right">
                                  {dept.compliance}%
                                </span>
                              </div>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-white text-sm">{totalEmployees}</span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <div className={`w-2 h-2 rounded-full ${
                                dept.status === 'excellent' || dept.status === 'good' ? 'bg-emerald-400' :
                                dept.status === 'warning' ? 'bg-amber-400' :
                                dept.status === 'critical' ? 'bg-red-400' : 'bg-slate-500'
                              }`} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PANEL EXPANDIDO */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-4 bg-slate-900/40 border-t border-slate-700/20">
                            
                            {/* LISTA EMPLEADOS */}
                            <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" />
                              Detalle ({sortedEmployees.length})
                            </h4>
                            
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {sortedEmployees.map((emp) => (
                                <div
                                  key={emp.id}
                                  className="flex items-center justify-between p-2 bg-slate-800/20 rounded border border-slate-700/20 hover:border-slate-600/30 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`
                                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                                      ${emp.complianceStatus === 'overdue' ? 'bg-red-500/20 text-red-400' : 
                                        emp.complianceStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                                        'bg-slate-700 text-slate-400'}
                                    `}>
                                      {emp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-slate-300 text-sm">{emp.fullName}</div>
                                      <div className="text-slate-500 text-[10px]">{emp.daysSinceHire}d</div>
                                    </div>
                                  </div>

                                  {emp.stages && emp.stages.length > 0 ? (
                                    <div className="flex items-center gap-1">
                                      {emp.stages.map((stage) => (
                                        <div key={stage.stage} className="flex flex-col items-center" title={`${stage.label}: ${stage.status}`}>
                                          <div className={`w-4 h-4 rounded-full ${getStageColor(stage.status)} flex items-center justify-center`}>
                                            {stage.status === 'responded' && <CheckCircle2 className="w-2 h-2 text-white" />}
                                            {stage.status === 'overdue' && <AlertCircle className="w-2 h-2 text-white" />}
                                            {stage.status === 'not_sent' && <Minus className="w-2 h-2 text-slate-400" />}
                                          </div>
                                          <span className="text-[7px] text-slate-500">{stage.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    getEmployeeStatusBadge(emp.complianceStatus, emp.daysOverdue)
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL - FOCALIZAHR INTELLIGENCE
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalData && (() => {
        const { dept, weakest, rank } = modalData;
        const narrative = DIMENSION_NARRATIVES[weakest.key];
        const position = getPositionLabel(rank, filteredDepartments.length);
        const npsScore = dept.npsScore ?? null;
        const npsLabel = npsScore !== null ? getNPSLabel(npsScore) : null;
        
        const dimensions = [
          { 
            day: 1, 
            name: 'Primera Impresión', 
            score: dept.avgComplianceScore ? Math.round((dept.avgComplianceScore / 5) * 100) : null, 
            description: '¿Tuvo todo listo?',
            isWeakest: weakest.key === 'compliance'
          },
          { 
            day: 7, 
            name: 'Claridad del Rol', 
            score: dept.avgClarificationScore ? Math.round((dept.avgClarificationScore / 5) * 100) : null, 
            description: '¿Sabe qué se espera?',
            isWeakest: weakest.key === 'clarification'
          },
          { 
            day: 30, 
            name: 'Conexión con Equipo', 
            score: dept.avgCultureScore ? Math.round((dept.avgCultureScore / 5) * 100) : null, 
            description: '¿Se siente parte?',
            isWeakest: weakest.key === 'culture'
          },
          { 
            day: 90, 
            name: 'Visión de Futuro', 
            score: dept.avgConnectionScore ? Math.round((dept.avgConnectionScore / 5) * 100) : null, 
            description: '¿Ve crecimiento?',
            isWeakest: weakest.key === 'connection'
          }
        ];
        
        return (
          <FocalizaIntelligenceModal
            isOpen={modalData.isOpen}
            onClose={() => setModalData(null)}
            entityName={dept.departmentName}
            entityType="departamento"
            detection={{
              title: narrative.humanName,
              subtitle: `Día ${narrative.day}`,
              description: narrative.headline(dept.departmentName),
              score: weakest.score,
              maxScore: 100,
              position: position.label,
              icon: Target
            }}
            cta={{
              label: "Ver Alertas de este Departamento",
              icon: AlertTriangle,
              onClick: () => {
                console.log('Navigate to alerts for:', dept.departmentId);
              }
            }}
            sections={[
              {
                id: 'whatMeasures',
                title: '¿Qué mide?',
                content: narrative.whatItMeasures
              },
              {
                id: 'whyMatters',
                title: '¿Por qué importa?',
                content: (
                  <div className="space-y-3">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {narrative.whyItMatters}
                    </p>
                    {npsScore !== null && npsLabel && (
                      <NPSAmplifier score={npsScore} label={npsLabel} />
                    )}
                  </div>
                )
              },
              {
                id: 'dimensions',
                title: 'Ver las 4 dimensiones',
                content: <DimensionsGrid dimensions={dimensions} />
              }
            ]}
            source="Modelo 4C Bauer"
          />
        );
      })()}
    </motion.div>
  );
}