// ====================================================================
// GERENCIA FOCALIZADO VIEW - ANÁLISIS PROFUNDO
// src/components/monitor/gerencia/GerenciaFocalizadoView.tsx
// Layout 30-40-30 optimizado para toma de decisiones
// ====================================================================

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, AlertCircle, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

// ====================================================================
// INTERFACES
// ====================================================================

interface DepartmentChild {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  responded: number;
  participants: number;
}

interface ProcessedGerencia {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  trend: string;
  velocity: number;
  position: number;
  responded: number;
  participants: number;
  projection?: number;
  children: DepartmentChild[];
}

interface GerenciaFocalizadoViewProps {
  gerencias: ProcessedGerencia[];
  selectedIndex: number;
  onChangeGerencia: (index: number) => void;
}

// ====================================================================
// HELPERS
// ====================================================================

const getTrendIcon = (trend: string) => {
  if (['up', 'subiendo', 'acelerando'].includes(trend)) return '↑';
  if (['down', 'bajando', 'desacelerando'].includes(trend)) return '↓';
  return '→';
};

const getTrendColor = (trend: string) => {
  if (['up', 'subiendo', 'acelerando'].includes(trend)) return '#10B981';
  if (['down', 'bajando', 'desacelerando', 'crítico'].includes(trend)) return '#EF4444';
  return '#94A3B8';
};

const getStatusColor = (rate: number) => {
  if (rate >= 80) return '#10B981';
  if (rate >= 60) return '#22D3EE';
  if (rate >= 40) return '#F59E0B';
  return '#EF4444';
};

// ====================================================================
// MINI GRÁFICO TENDENCIA (7 DÍAS)
// ====================================================================

function MiniTrendChart({ data = [] }: { data?: number[] }) {
  // Mock data si no hay datos reales
  const chartData = data.length > 0 ? data : [65, 68, 70, 72, 71, 73, 75];
  const max = Math.max(...chartData);
  const min = Math.min(...chartData);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-1 h-12 mt-4">
      {chartData.slice(-7).map((value, i) => {
        const height = ((value - min) / range) * 100;
        const isLast = i === chartData.length - 1;
        return (
          <div
            key={i}
            className="flex-1 bg-cyan-500/30 rounded-t transition-all"
            style={{
              height: `${height}%`,
              minHeight: '4px',
              background: isLast ? '#22D3EE' : 'rgba(34, 211, 238, 0.3)'
            }}
          />
        );
      })}
    </div>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function GerenciaFocalizadoView({ 
  gerencias,
  selectedIndex,
  onChangeGerencia
}: GerenciaFocalizadoViewProps) {
  
  if (!gerencias || gerencias.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Sin datos disponibles</p>
      </div>
    );
  }
  
  const selectedGerencia = gerencias[selectedIndex];
  if (!selectedGerencia) return null;
  
  const promedio = Math.round(gerencias.reduce((sum, g) => sum + g.rateNum, 0) / gerencias.length);
  const diferenciaPorcentual = promedio > 0 
    ? Math.round(((selectedGerencia.rateNum - promedio) / promedio) * 100)
    : 0;
  
  // Identificar departamentos críticos y líderes
  const deptosCriticos = selectedGerencia.children
    .filter(d => d.participants > 0 && d.rateNum === 0)
    .sort((a, b) => b.participants - a.participants);
    
  const deptosLideres = selectedGerencia.children
    .filter(d => d.rateNum >= 70)
    .sort((a, b) => b.rateNum - a.rateNum);
  
  return (
    <div className="space-y-4">
      
      {/* SELECTOR GERENCIA */}
      <Select 
        value={selectedIndex.toString()} 
        onValueChange={(v) => onChangeGerencia(parseInt(v))}
      >
        <SelectTrigger 
          className="w-full max-w-sm"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            color: 'white'
          }}
        >
          <SelectValue>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{selectedGerencia.displayName}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                #{selectedGerencia.position}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent style={{ background: 'rgba(30, 41, 59, 0.98)' }}>
          {gerencias.map((g, idx) => (
            <SelectItem key={idx} value={idx.toString()} className="text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs">{g.displayName}</span>
                <span className="ml-auto text-xs">{Math.round(g.rateNum)}%</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* LAYOUT PRINCIPAL 30-40-30 */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-4">
        
        {/* ZONA IZQUIERDA - MÉTRICAS CLAVE */}
        <div 
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <div className="space-y-4">
            {/* Métrica principal */}
            <div>
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-5xl font-bold"
                  style={{ color: getStatusColor(selectedGerencia.rateNum) }}
                >
                  {Math.round(selectedGerencia.rateNum)}%
                </span>
                <span 
                  className="text-2xl"
                  style={{ color: getTrendColor(selectedGerencia.trend) }}
                >
                  {getTrendIcon(selectedGerencia.trend)}
                </span>
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {selectedGerencia.responded}/{selectedGerencia.participants} respondieron
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {diferenciaPorcentual > 0 
                  ? `${diferenciaPorcentual}% sobre promedio`
                  : diferenciaPorcentual < 0
                  ? `${Math.abs(diferenciaPorcentual)}% bajo promedio`
                  : 'En el promedio'}
              </div>
            </div>
            
            {/* Velocity */}
            {selectedGerencia.velocity > 0 && (
              <div className="pt-3 border-t border-slate-700">
                <div className="text-2xl font-semibold text-cyan-400">
                  {selectedGerencia.velocity}
                  <span className="text-sm text-slate-400 ml-1">resp/día</span>
                </div>
              </div>
            )}
            
            {/* Mini gráfico tendencia */}
            <div>
              <div className="text-xs text-slate-500 uppercase">Últimos 7 días</div>
              <MiniTrendChart />
            </div>
            
            {/* Estado general */}
            <div className="pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-500 uppercase mb-1">Estado</div>
              <div 
                className="text-sm font-medium px-3 py-1 rounded-full inline-block"
                style={{
                  background: selectedGerencia.position === 1 
                    ? 'rgba(34, 211, 238, 0.2)' 
                    : 'rgba(71, 85, 105, 0.3)',
                  color: selectedGerencia.position === 1 
                    ? '#22D3EE' 
                    : '#94A3B8'
                }}
              >
                {selectedGerencia.position === 1 ? 'Líder' : `Posición ${selectedGerencia.position}`}
              </div>
            </div>
          </div>
        </div>
        
        {/* ZONA CENTRAL - DEPARTAMENTOS EXPANDIDOS */}
        <div 
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Departamentos
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {selectedGerencia.children.length > 0 ? (
              selectedGerencia.children
                .sort((a, b) => a.rateNum - b.rateNum) // Críticos primero
                .map((dept) => {
                  const hasActivity = dept.responded > 0;
                  const barColor = getStatusColor(dept.rateNum);
                  
                  return (
                    <div key={dept.id} className="space-y-2 pb-3 border-b border-slate-700 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">
                            {dept.displayName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {dept.responded}/{dept.participants} respondieron
                            {!hasActivity && dept.participants > 0 && (
                              <span className="text-red-400 ml-2">• Sin actividad</span>
                            )}
                          </div>
                        </div>
                        <div 
                          className="text-xl font-bold"
                          style={{ color: barColor }}
                        >
                          {Math.round(dept.rateNum)}%
                        </div>
                      </div>
                      
                      {/* Barra progreso */}
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(dept.rateNum, 100)}%`,
                            background: barColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Sin departamentos asignados</p>
              </div>
            )}
          </div>
        </div>
        
        {/* ZONA DERECHA - INSIGHTS Y ACCIONES */}
        <div 
          className="p-6 rounded-xl space-y-4"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(71, 85, 105, 0.3)'
          }}
        >
          {/* Alertas críticas */}
          {deptosCriticos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 uppercase">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Crítico</span>
              </div>
              {deptosCriticos.slice(0, 2).map(dept => (
                <div key={dept.id} className="text-sm text-red-400">
                  {dept.displayName}
                  <span className="text-xs text-slate-500 block">
                    0/{dept.participants} resp
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Departamentos líderes */}
          {deptosLideres.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 uppercase">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Líder</span>
              </div>
              {deptosLideres.slice(0, 2).map(dept => (
                <div key={dept.id} className="text-sm text-emerald-400">
                  {dept.displayName}
                  <span className="text-xs text-slate-500 block">
                    {Math.round(dept.rateNum)}% participación
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Acción recomendada */}
          <div 
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)'
            }}
          >
            <div className="text-xs text-slate-400 uppercase mb-2">
              Acción Recomendada
            </div>
            <div className="text-sm font-medium text-cyan-400">
              {deptosCriticos.length > 0 
                ? `Activar ${deptosCriticos[0].displayName}`
                : selectedGerencia.velocity === 0
                ? 'Enviar recordatorio general'
                : selectedGerencia.rateNum < 50
                ? 'Intensificar comunicación'
                : 'Mantener estrategia actual'}
            </div>
            
            {/* Botón contextual */}
            {deptosCriticos.length > 0 && (
              <button 
                className="mt-3 w-full px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Enviar a {deptosCriticos[0].displayName}
              </button>
            )}
          </div>
          
          {/* Proyección si existe */}
          {selectedGerencia.projection && Math.abs(selectedGerencia.projection - selectedGerencia.rateNum) > 5 && (
            <div className="pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-400 uppercase">Proyección</div>
              <div className="text-xl font-semibold text-white">
                {Math.round(selectedGerencia.projection)}%
              </div>
              <div className="text-xs text-slate-500">al cierre</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GerenciaFocalizadoView;