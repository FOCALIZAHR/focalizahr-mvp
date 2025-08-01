// ====================================================================
// DEPARTMENT PULSE PANEL - COMPONENTE WOW MEJORADO
// /src/components/monitor/DepartmentPulsePanel.tsx
// Integración perfecta con CampaignRhythmPanel + Accionabilidad inteligente
// ====================================================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Send, 
  AlertTriangle, 
  Award, 
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import type { DepartmentMonitorData } from '@/types';

// ====================================================================
// INTERFACES - TIPADO ESTRICTO
// ====================================================================

interface DepartmentPulsePanelProps {
  byDepartment: Record<string, DepartmentMonitorData>;
  handleSendDepartmentReminder?: (department: string) => void;
  lastRefresh?: Date;
}

interface DepartmentAnalysis {
  name: string;
  data: DepartmentMonitorData;
  status: 'critical' | 'warning' | 'good' | 'excellent';
  statusColor: string;
  statusIcon: React.ComponentType<any>;
  actionLabel: string;
  actionColor: string;
  priority: number;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function DepartmentPulsePanel({ 
  byDepartment, 
  handleSendDepartmentReminder,
  lastRefresh 
}: DepartmentPulsePanelProps) {
  
  // 🧠 ANÁLISIS INTELIGENTE DE DEPARTAMENTOS
  const departmentAnalysis = useMemo((): DepartmentAnalysis[] => {
    const departments = Object.entries(byDepartment);
    
    if (departments.length === 0) return [];
    
    return departments
      .map(([name, data]) => {
        let status: DepartmentAnalysis['status'];
        let statusColor: string;
        let statusIcon: React.ComponentType<any>;
        let actionLabel: string;
        let actionColor: string;
        let priority: number;
        
        if (data.rate < 30) {
          status = 'critical';
          statusColor = 'text-red-400';
          statusIcon = AlertTriangle;
          actionLabel = 'Intervenir Ya';
          actionColor = 'hover:bg-red-400/10 text-red-400 border-red-400/30';
          priority = 1;
        } else if (data.rate < 70) {
          status = 'warning';
          statusColor = 'text-yellow-400';
          statusIcon = TrendingDown;
          actionLabel = 'Recordar';
          actionColor = 'hover:bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
          priority = 2;
        } else if (data.rate < 90) {
          status = 'good';
          statusColor = 'text-green-400';
          statusIcon = Target;
          actionLabel = 'En Objetivo';
          actionColor = 'hover:bg-green-400/10 text-green-400 border-green-400/30';
          priority = 3;
        } else {
          status = 'excellent';
          statusColor = 'text-cyan-400';
          statusIcon = Award;
          actionLabel = 'Felicitar';
          actionColor = 'hover:bg-cyan-400/10 text-cyan-400 border-cyan-400/30';
          priority = 4;
        }
        
        return {
          name,
          data,
          status,
          statusColor,
          statusIcon,
          actionLabel,
          actionColor,
          priority
        };
      })
      .sort((a, b) => a.priority - b.priority); // Críticos primero
  }, [byDepartment]);

  // 📊 ESTADÍSTICAS GENERALES
  const stats = useMemo(() => {
    if (departmentAnalysis.length === 0) return null;
    
    const total = departmentAnalysis.length;
    const critical = departmentAnalysis.filter(d => d.status === 'critical').length;
    const warning = departmentAnalysis.filter(d => d.status === 'warning').length;
    const excellent = departmentAnalysis.filter(d => d.status === 'excellent').length;
    
    const avgRate = departmentAnalysis.reduce((sum, d) => sum + d.data.rate, 0) / total;
    
    return {
      total,
      critical,
      warning,
      excellent,
      avgRate: Math.round(avgRate)
    };
  }, [departmentAnalysis]);

  // 🎨 COMPONENTE VACÍO
  if (departmentAnalysis.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-fhr-cyan" />
              Pulso Departamental
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/60">
              No hay datos departamentales para mostrar.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-1 lg:col-span-2"
    >
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-fhr-cyan" />
              <span className="text-white font-semibold">
                Pulso Departamental
              </span>
            </CardTitle>
            
            {/* ESTADÍSTICAS GENERALES */}
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                {stats.critical > 0 && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{stats.critical}</span>
                  </div>
                )}
                {stats.warning > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <TrendingDown className="h-4 w-4" />
                    <span>{stats.warning}</span>
                  </div>
                )}
                <div className="text-white/60">
                  Promedio: <span className="text-white font-medium">{stats.avgRate}%</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-1">
          <div className="grid grid-cols-1 gap-4">
            {departmentAnalysis.map((dept, index) => {
              const StatusIcon = dept.statusIcon;
              
              return (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.1 * index 
                  }}
                  className="group p-4 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${dept.statusColor}`} />
                      <span className="font-medium text-white truncate">
                        {dept.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${dept.statusColor}`}>
                          {dept.data.rate}%
                        </div>
                        <div className="text-xs text-white/60">
                          {dept.data.responded}/{dept.data.invited}
                        </div>
                      </div>
                      
                      {/* BOTÓN ACCIÓN CONTEXTUAL */}
                      {handleSendDepartmentReminder && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendDepartmentReminder(dept.name)}
                          className={`
                            opacity-0 group-hover:opacity-100 transition-all duration-300 
                            border ${dept.actionColor} bg-transparent
                            ${dept.status === 'excellent' ? 'cursor-default' : 'cursor-pointer'}
                          `}
                          disabled={dept.status === 'excellent'}
                        >
                          {dept.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {dept.status === 'warning' && <Send className="h-3 w-3 mr-1" />}
                          {dept.status === 'excellent' && <Award className="h-3 w-3 mr-1" />}
                          <span className="text-xs">{dept.actionLabel}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* PROGRESS BAR ANIMADO */}
                  <div className="relative">
                    <Progress 
                      value={dept.data.rate} 
                      className="h-2 bg-white/10 rounded-full overflow-hidden"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.data.rate}%` }}
                      transition={{ duration: 1, delay: 0.3 + (0.1 * index) }}
                      className={`
                        absolute top-0 left-0 h-2 rounded-full
                        ${dept.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                          dept.status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                          dept.status === 'good' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                          'bg-gradient-to-r from-cyan-500 to-cyan-400'}
                      `}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FOOTER CON TIMESTAMP */}
          {lastRefresh && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-center text-xs text-white/40">
                Última actualización: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}