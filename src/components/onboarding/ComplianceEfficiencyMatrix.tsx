// src/components/onboarding/ComplianceEfficiencyMatrix.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  ChevronDown,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface EmployeeDetail {
  id: string;
  fullName: string;
  currentStage: number;
  daysSinceHire: number;
  complianceStatus: 'completed' | 'overdue' | 'pending';
  daysOverdue?: number;
}

export interface ComplianceDepartment {
  departmentId: string;
  departmentName: string;
  compliance: number;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';
  responded: number;
  overdue: number;
  pending: number;
  employeeDetail: EmployeeDetail[]; 
}

interface ComplianceEfficiencyMatrixProps {
  departments: ComplianceDepartment[];
  loading?: boolean;
}

const getPerformanceStyles = (compliance: number, status: string) => {
  if (status === 'neutral') return {
    bg: 'from-slate-800/60 to-slate-700/40',
    text: 'text-slate-400',
    border: 'border-slate-700/30',
    progress: 'from-slate-500 to-slate-400'
  };
  if (compliance >= 90) return {
    bg: 'from-emerald-950/40 to-green-950/20',
    text: 'text-emerald-400',
    border: 'border-green-500/30',
    progress: 'from-green-500 to-emerald-400'
  };
  if (compliance >= 75) return {
    bg: 'from-cyan-950/40 to-blue-950/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    progress: 'from-cyan-500 to-blue-400'
  };
  if (compliance >= 60) return {
    bg: 'from-amber-950/40 to-yellow-950/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    progress: 'from-amber-500 to-yellow-400'
  };
  return {
    bg: 'from-red-950/40 to-rose-950/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    progress: 'from-red-500 to-rose-400'
  };
};

const getEmployeeStatusBadge = (status: string, days?: number) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex gap-1 items-center">
          <CheckCircle2 className="w-3 h-3" /> Al día
        </Badge>
      );
    case 'overdue':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 flex gap-1 items-center">
          <AlertCircle className="w-3 h-3" /> Vencido {days ? `(${days}d)` : ''}
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30 flex gap-1 items-center">
          <Clock className="w-3 h-3" /> En plazo
        </Badge>
      );
    default:
      return null;
  }
};

export default function ComplianceEfficiencyMatrix({ 
  departments = [], 
  loading 
}: ComplianceEfficiencyMatrixProps) {
  
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

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

  if (!departments || !Array.isArray(departments) || departments.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-white/5">
        <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
        <p className="text-slate-400">No hay datos departamentales disponibles</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
        
        <div 
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px -1px rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
          className="relative backdrop-blur-xl transition-all duration-300"
        >
          {/* 🔥 HEADER CON INLINE STYLES NUCLEAR 🔥 */}
          <div 
            style={{
              borderRadius: '12px 12px 0 0',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}
            className="px-6 py-4"
          >
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-slate-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Departamento</div>
              <div className="col-span-4">Eficiencia (Cumplimiento)</div>
              <div className="col-span-1 text-center">Total</div>
              <div className="col-span-2 text-center">Estado</div>
            </div>
          </div>
          
          {/* BODY */}
          <div className="divide-y divide-white/[0.05]">
            {departments.map((dept, index) => {
              const styles = getPerformanceStyles(dept.compliance, dept.status);
              const isExpanded = expandedDepts.has(dept.departmentId);
              const isHovered = hoveredIndex === index;
              
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
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className={`
                      relative px-6 py-5 cursor-pointer transition-all duration-300
                      ${isHovered ? 'bg-white/[0.04]' : 'bg-transparent'}
                      ${isExpanded ? 'bg-white/[0.02]' : ''}
                    `}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => toggleDepartment(dept.departmentId)}
                  >
                    {isExpanded && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500" />
                    )}

                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* RANK */}
                      <div className="col-span-1 flex justify-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          text-xs font-bold bg-gradient-to-br ${styles.bg}
                          border ${styles.border} shadow-lg
                        `}>
                          {index + 1}
                        </div>
                      </div>
                      
                      {/* NOMBRE */}
                      <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                        <div className={`transition-transform duration-300 text-slate-500 ${isExpanded ? 'rotate-90 text-cyan-400' : ''}`}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium text-sm truncate">
                            {dept.departmentName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {totalEmployees} personas
                            </span>
                            {dept.overdue > 0 && (
                              <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                {dept.overdue} fallas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* BARRA */}
                      <div className="col-span-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Tasa de Respuesta</span>
                            <span className={`font-bold ${styles.text}`}>
                              {dept.compliance}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.compliance}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full bg-gradient-to-r ${styles.progress} shadow-[0_0_10px_rgba(0,0,0,0.3)] relative`}
                            />
                          </div>
                          <div className="flex gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {dept.responded} OK
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              {dept.pending} Pendientes
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* TOTAL */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-slate-300">
                          {dept.responded + dept.overdue}
                        </span>
                      </div>
                      
                      {/* BADGE */}
                      <div className="col-span-2 flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`
                            bg-transparent border ${styles.border} ${styles.text}
                            shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-sm
                          `}
                        >
                          {dept.status === 'excellent' && 'Excelente'}
                          {dept.status === 'good' && 'Bueno'}
                          {dept.status === 'warning' && 'Regular'}
                          {dept.status === 'critical' && 'Crítico'}
                          {dept.status === 'neutral' && 'Sin Datos'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* DRAWER LISTA */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-slate-900/40 border-t border-white/5"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Search className="w-3 h-3" />
                              Auditoría de Empleados ({sortedEmployees.length})
                            </h4>
                            <div className="flex gap-2 text-[10px]">
                              <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                ● Vencidos: {dept.overdue}
                              </span>
                              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ● Al Día: {dept.responded}
                              </span>
                            </div>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1">
                            {sortedEmployees.map((emp) => (
                              <div 
                                key={emp.id}
                                className={`
                                  flex items-center justify-between px-4 py-3 rounded-lg border transition-colors
                                  ${emp.complianceStatus === 'overdue' 
                                    ? 'bg-red-500/[0.02] border-red-500/10 hover:bg-red-500/[0.05]' 
                                    : emp.complianceStatus === 'completed'
                                    ? 'bg-emerald-500/[0.02] border-emerald-500/10 hover:bg-emerald-500/[0.05]'
                                    : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                                    ${emp.complianceStatus === 'overdue' ? 'bg-red-500/20 text-red-400' : 
                                      emp.complianceStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                                      'bg-slate-700 text-slate-300'}
                                  `}>
                                    {emp.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm text-slate-200 font-medium">
                                      {emp.fullName}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Etapa: Día {emp.currentStage === 1 ? '1' : emp.currentStage === 2 ? '7' : emp.currentStage === 3 ? '30' : '90'} 
                                      • Días: {emp.daysSinceHire}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {getEmployeeStatusBadge(emp.complianceStatus, emp.daysOverdue)}
                                </div>
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
    </motion.div>
  );
}