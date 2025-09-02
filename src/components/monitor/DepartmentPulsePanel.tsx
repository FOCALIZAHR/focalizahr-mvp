// ====================================================================
// DEPARTMENT PULSE PANEL - VERSIÓN WOW CORPORATIVA
// src/components/monitor/DepartmentPulsePanel.tsx
// ARQUITECTURA: Resumen Ejecutivo + Lista Detallada
// ====================================================================

'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Target, Users, Phone, Mail, Star } from 'lucide-react';

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
  hasRealData: boolean;
  scenarioType: 'NO_DATA' | 'ALL_ZERO' | 'MIXED_DATA';
  displayMessage: string;
}

interface DepartmentPulsePanelProps {
  departmentalIntelligence: DepartmentalIntelligence;
  handleSendDepartmentReminder: (department: string) => void;
  lastRefresh: Date;
}

type FilterType = 'priority' | 'progress' | 'excellent' | 'all';

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
      case 'priority':
        return allDepartments.filter(dept => dept.participationRate < 50);
      case 'progress': 
        return allDepartments.filter(dept => dept.participationRate >= 50 && dept.participationRate < 85);
      case 'excellent':
        return allDepartments.filter(dept => dept.participationRate >= 85);
      default:
        return allDepartments.sort((a, b) => {
          // Orden: Prioritarios -> Progreso -> Excelentes
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
    <Card className="fhr-card glass-card backdrop-blur-xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pulso Departamental
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitor de participación por equipo • {lastRefresh.toLocaleTimeString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* ==================== MÉTRICAS EJECUTIVAS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-gray-800/50 to-transparent rounded-lg border border-gray-700/30">
            <div className="text-2xl font-bold text-gray-100">{departmentalIntelligence.totalDepartments}</div>
            <div className="text-xs text-gray-400 font-medium">Departamentos</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-900/30 to-transparent rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{departmentalIntelligence.averageRate}%</div>
            <div className="text-xs text-gray-400 font-medium">Promedio General</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-900/30 to-transparent rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{departmentalIntelligence.excellentCount}</div>
            <div className="text-xs text-gray-400 font-medium">Excelentes</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-900/30 to-transparent rounded-lg border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{departmentalIntelligence.criticalCount}</div>
            <div className="text-xs text-gray-400 font-medium">Prioritarios</div>
          </div>
        </div>

        {/* ==================== RESUMEN EJECUTIVO ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* LÍDERES DE PARTICIPACIÓN */}
          <div className="bg-gradient-to-br from-green-950/30 to-transparent p-4 rounded-xl border border-green-500/20">
            <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Líderes de Participación
            </h3>
            <div className="space-y-2">
              {departmentalIntelligence.topPerformers.length > 0 ? (
                departmentalIntelligence.topPerformers.map((dept, index) => (
                  <div key={dept.name} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg hover:bg-gray-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <div className="text-gray-100 font-medium capitalize">{dept.name}</div>
                        <div className="text-xs text-gray-400">{dept.count} de {dept.total} participantes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-lg">{dept.participationRate}%</div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Excelente
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin datos suficientes</p>
                </div>
              )}
            </div>
          </div>

          {/* ACCIÓN ESTRATÉGICA */}
          <div className="bg-gradient-to-br from-orange-950/30 to-transparent p-4 rounded-xl border border-orange-500/20">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Acción Estratégica
            </h3>
            <div className="space-y-2">
              {departmentalIntelligence.attentionNeeded.length > 0 ? (
                departmentalIntelligence.attentionNeeded.map((dept) => (
                  <div key={dept.name} className="bg-gray-800/30 p-3 rounded-lg hover:bg-gray-800/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-gray-100 font-medium capitalize">{dept.name}</div>
                        <div className="text-xs text-gray-400">{dept.count} de {dept.total} participantes</div>
                      </div>
                      <div className="text-orange-400 font-bold text-lg">{dept.participationRate}%</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 text-xs bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 border border-orange-500/20"
                        onClick={() => handleSendDepartmentReminder(dept.name)}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Recordatorio
                      </Button>
                      {dept.participationRate < 30 && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 text-xs bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20"
                          onClick={() => handleSendDepartmentReminder(dept.name)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Contactar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-400 font-medium">
                    {departmentalIntelligence.displayMessage || 'Todos los departamentos en buen progreso'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== VISTA DETALLADA ==================== */}
        <div className="space-y-4">
          
          {/* FILTROS EJECUTIVOS */}
          <div className="flex space-x-1 bg-gray-800/30 p-1 rounded-lg">
            <button 
              onClick={() => setActiveFilter('priority')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'priority' 
                  ? 'bg-gradient-to-r from-orange-500/20 to-transparent text-orange-300 border border-orange-500/20' 
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Prioritarios ({departmentalIntelligence.allDepartments.filter(d => d.participationRate < 50).length})
            </button>
            <button 
              onClick={() => setActiveFilter('progress')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'progress' 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-transparent text-yellow-300 border border-yellow-500/20' 
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              En Progreso ({departmentalIntelligence.allDepartments.filter(d => d.participationRate >= 50 && d.participationRate < 85).length})
            </button>
            <button 
              onClick={() => setActiveFilter('excellent')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'excellent' 
                  ? 'bg-gradient-to-r from-green-500/20 to-transparent text-green-300 border border-green-500/20' 
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Excelentes ({departmentalIntelligence.excellentCount})
            </button>
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                activeFilter === 'all' 
                  ? 'bg-gradient-to-r from-blue-500/20 to-transparent text-blue-300 border border-blue-500/20' 
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Todos ({departmentalIntelligence.totalDepartments})
            </button>
          </div>

          {/* LISTA SCROLLEABLE */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {filteredDepartments.map((dept) => (
              <div key={dept.name} className="bg-gray-800/20 p-4 rounded-lg border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200">
                
                {/* HEADER DEPARTAMENTO */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      dept.participationRate >= 85 ? 'bg-green-400' : 
                      dept.participationRate >= 70 ? 'bg-yellow-400' : 
                      dept.participationRate >= 50 ? 'bg-orange-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <span className="text-gray-100 font-medium capitalize">{dept.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{dept.count}/{dept.total} participantes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-100 font-bold text-lg">{dept.participationRate}%</span>
                  </div>
                </div>

                {/* BARRA DE PROGRESO */}
                <Progress 
                  value={dept.participationRate} 
                  className="h-1.5 mb-3 bg-gray-700/50"
                />

                {/* ACCIONES */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {dept.participationRate >= 85 ? 'Desempeño ejemplar' :
                     dept.participationRate >= 70 ? 'Buen progreso' :
                     dept.participationRate >= 50 ? 'En desarrollo' : 'Requiere atención'}
                  </span>
                  <Button 
                    size="sm"
                    variant="ghost"
                    className={`h-7 px-3 text-xs ${
                      dept.participationRate >= 85 
                        ? 'text-green-400 hover:bg-green-500/10' 
                        : dept.participationRate >= 70 
                        ? 'text-yellow-400 hover:bg-yellow-500/10'
                        : dept.participationRate >= 50
                        ? 'text-orange-400 hover:bg-orange-500/10'
                        : 'text-red-400 hover:bg-red-500/10'
                    }`}
                    onClick={() => handleSendDepartmentReminder(dept.name)}
                  >
                    {dept.participationRate >= 85 ? 'Reconocer' : 
                     dept.participationRate >= 70 ? 'Motivar' :
                     dept.participationRate >= 50 ? 'Impulsar' : 'Intervenir'}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredDepartments.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <div className="text-sm">No hay departamentos en esta categoría</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}