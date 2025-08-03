// ====================================================================
// DEPARTMENT PULSE PANEL - COMPONENTE HÍBRIDO REFACTORIZADO
// src/components/monitor/DepartmentPulsePanel.tsx
// ARQUITECTURA: Resumen Ejecutivo + Lista Detallada
// ====================================================================

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, AlertTriangle, Users } from 'lucide-react';

interface DepartmentData {
  name: string;
  participationRate: number;
  count: number;
  total: number;
  rank?: number;
  medal?: string;
  status?: string;
  urgency?: string;
  action?: string;
  icon?: string;
}

interface DepartmentalIntelligence {
  topPerformers: DepartmentData[];
  attentionNeeded: DepartmentData[];
  totalDepartments: number;
  averageRate: number;
  excellentCount: number;
  criticalCount: number;
  allDepartments: DepartmentData[];
   hasRealData: boolean;    // ← AGREGAR ESTA LÍNEA
   scenarioType: 'NO_DATA' | 'ALL_ZERO' | 'MIXED_DATA';  // ← AGREGAR
   displayMessage: string;                                 // ← AGREGAR
}

interface DepartmentPulsePanelProps {
  departmentalIntelligence: DepartmentalIntelligence;
  handleSendDepartmentReminder: (department: string) => void;
  lastRefresh: Date;
}

type FilterType = 'critical' | 'progress' | 'excellent' | 'all';

export function DepartmentPulsePanel({ 
  departmentalIntelligence, 
  handleSendDepartmentReminder,
  lastRefresh 
}: DepartmentPulsePanelProps) {

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filtrar departamentos según pestaña activa
  const getFilteredDepartments = () => {
    const { allDepartments } = departmentalIntelligence;
    
    switch (activeFilter) {
      case 'critical':
        return allDepartments.filter(dept => dept.participationRate < 50);
      case 'progress': 
        return allDepartments.filter(dept => dept.participationRate >= 50 && dept.participationRate < 85);
      case 'excellent':
        return allDepartments.filter(dept => dept.participationRate >= 85);
      default:
        return allDepartments.sort((a, b) => {
          // Orden: Críticos -> Progreso -> Exitosos
          if (a.participationRate < 50 && b.participationRate >= 50) return -1;
          if (a.participationRate >= 50 && b.participationRate < 50) return 1;
          if (a.participationRate < 85 && b.participationRate >= 85) return -1;
          if (a.participationRate >= 85 && b.participationRate < 85) return 1;
          return a.participationRate - b.participationRate;
        });
    }
  };

  const filteredDepartments = getFilteredDepartments();

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 glass-card neural-glow backdrop-blur-md border-fhr-cyan/20">
      <CardHeader>
        <CardTitle className="fhr-title-gradient text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          Pulso Departamental
          <div className="ml-auto text-xs text-white/60">
            Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* ==================== PARTE SUPERIOR: RESUMEN EJECUTIVO ==================== */}
        <div className="space-y-6">
          
          {/* MÉTRICAS AGREGADAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-slate-700/50 to-transparent rounded-lg border border-slate-600/30">
              <div className="text-2xl font-bold text-white">{departmentalIntelligence.totalDepartments}</div>
              <div className="text-xs text-white/60">Departamentos</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{departmentalIntelligence.averageRate}%</div>
              <div className="text-xs text-white/60">Promedio</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-transparent rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{departmentalIntelligence.excellentCount}</div>
              <div className="text-xs text-white/60">Excelentes</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-red-500/10 to-transparent rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{departmentalIntelligence.criticalCount}</div>
              <div className="text-xs text-white/60">Críticos</div>
            </div>
          </div>

          {/* GRID EXECUTIVE: TOP PERFORMERS + ATTENTION NEEDED */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TOP 3 PERFORMERS */}
            <div className="bg-gradient-to-r from-green-500/10 to-transparent p-4 rounded-lg border border-green-500/20">
              <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                🏆 Top Performers
              </h3>
              <div className="space-y-3">
                {departmentalIntelligence.topPerformers.map((dept) => (
                                      <div key={dept.name} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{dept.medal}</span>
                      <div>
                        <div className="text-white font-medium capitalize">{dept.name}</div>
                        <div className="text-xs text-white/60">{dept.count}/{dept.total} participantes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{dept.participationRate}%</div>
                      <div className="text-xs text-green-400">⭐ Excelente</div>
                    </div>
                  </div>
                ))}
                {departmentalIntelligence.topPerformers.length === 0 && (
                  <div className="text-center text-white/60 py-4">
                    Sin datos suficientes
                  </div>
                )}
              </div>
            </div>

            {/* ATTENTION NEEDED */}
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-lg border border-orange-500/20">
              <h3 className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                ⚠️ Attention Needed
              </h3>
              <div className="space-y-3">
                {departmentalIntelligence.attentionNeeded.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{dept.icon}</span>
                      <div>
                        <div className="text-white font-medium capitalize">{dept.name}</div>
                        <div className="text-xs text-white/60">{dept.count}/{dept.total} participantes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{dept.participationRate}%</div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={`text-xs mt-1 ${
                          dept.urgency === 'critical' ? 'border-red-500/30 text-red-400 hover:bg-red-500/20' :
                          dept.urgency === 'high' ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' :
                          'border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                        }`}
                        onClick={() => handleSendDepartmentReminder(dept.name)}
                      >
                        {dept.urgency === 'critical' ? '📞 Llamar' :
                         dept.urgency === 'high' ? '📧 Recordar' : '👁️ Seguir'}
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-center py-4">
                 <div className="text-white/80 font-medium">
                    {departmentalIntelligence.displayMessage}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PARTE INFERIOR: LISTA DETALLADA ==================== */}
        <div className="space-y-4">
          
          {/* PESTAÑAS DE FILTRO */}
          <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setActiveFilter('critical')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'critical' 
                  ? 'bg-gradient-to-r from-red-500/20 to-transparent text-red-400 border border-red-500/20' 
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              🚨 Críticos ({departmentalIntelligence.allDepartments.filter(d => d.participationRate < 50).length})
            </button>
            <button 
              onClick={() => setActiveFilter('progress')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'progress' 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-transparent text-yellow-400 border border-yellow-500/20' 
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              ⚡ Progreso ({departmentalIntelligence.allDepartments.filter(d => d.participationRate >= 50 && d.participationRate < 85).length})
            </button>
            <button 
              onClick={() => setActiveFilter('excellent')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'excellent' 
                  ? 'bg-gradient-to-r from-green-500/20 to-transparent text-green-400 border border-green-500/20' 
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              ✅ Exitosos ({departmentalIntelligence.excellentCount})
            </button>
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'all' 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border border-cyan-500/20' 
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              📊 Todos ({departmentalIntelligence.totalDepartments})
            </button>
          </div>

          {/* LISTA DETALLADA CON SCROLL FOCALIZAHR */}
          <div className="max-h-80 overflow-y-auto focalizahr-scroll space-y-2">
            {filteredDepartments.map((dept) => (
              <div key={dept.name} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-cyan-400/30 transition-all duration-200">
                
                {/* HEADER DEPARTAMENTO */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      dept.participationRate >= 85 ? 'bg-green-400' : 
                      dept.participationRate >= 70 ? 'bg-yellow-400' : 
                      dept.participationRate >= 50 ? 'bg-orange-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <span className="text-white font-medium capitalize">{dept.name}</span>
                      <div className="text-xs text-white/60">{dept.count}/{dept.total} participantes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">{dept.participationRate}%</span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mb-3">
                  <Progress 
                    value={dept.participationRate} 
                    className="h-2 mb-2"
                  />
                </div>

                {/* FOOTER CON ACCIÓN */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">
                    {dept.participationRate >= 85 ? '🎉 Excelente performance' :
                     dept.participationRate >= 70 ? '⚡ Buen progreso' :
                     dept.participationRate >= 50 ? '📈 En desarrollo' : '🚨 Requiere atención'}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={`text-xs ${
                      dept.participationRate >= 85 
                        ? 'border-green-500/30 text-green-400 hover:bg-green-500/20' 
                        : dept.participationRate >= 70 
                        ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                        : dept.participationRate >= 50
                        ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                        : 'border-red-500/30 text-red-400 hover:bg-red-500/20'
                    }`}
                    onClick={() => handleSendDepartmentReminder(dept.name)}
                  >
                    {dept.participationRate >= 85 ? '🎉 Felicitar' : 
                     dept.participationRate >= 70 ? '📧 Recordar' :
                     dept.participationRate >= 50 ? '⚡ Motivar' : '📞 Llamar'}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredDepartments.length === 0 && (
              <div className="text-center text-white/60 py-8">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <div className="text-sm">No hay departamentos en esta categoría</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}