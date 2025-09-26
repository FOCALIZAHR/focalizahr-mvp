// ====================================================================
// GERENCIA PULSE BIMODAL - COMPONENTE WOW NIVEL 2
// src/components/monitor/GerenciaPulseBimodal.tsx
// Vista dual: Competitivo (ranking) vs Focalizado (detalle)
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertCircle
} from 'lucide-react';

// ====================================================================
// INTERFACES
// ====================================================================

interface GerenciaData {
  id: string;
  displayName: string;
  score: number;
  participants: number;
  totalParticipants: number;
  percentage: number;
  momentum?: number;
  velocity?: number;
  projection?: number;
  children: Array<{
    id: string;
    name: string;
    score: number;
    participants: number;
    totalParticipants: number;
    percentage: number;
  }>;
}

interface GerenciaPulseBimodalProps {
  gerenciaData?: GerenciaData[];
  hasHierarchy?: boolean;
  isLoading?: boolean;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function GerenciaPulseBimodal({ 
  gerenciaData = [],
  hasHierarchy = false,
  isLoading = false
}: GerenciaPulseBimodalProps) {
  
  // Estado del modo de vista
  const [mode, setMode] = useState<'competitivo' | 'focalizado'>('competitivo');
  const [selectedGerenciaIndex, setSelectedGerenciaIndex] = useState(0);
  const [expandedGerencias, setExpandedGerencias] = useState<Set<string>>(new Set());
  
  // Calcular rankings y enriquecer datos
  const enrichedGerencias = useMemo(() => {
    if (!gerenciaData || gerenciaData.length === 0) return [];
    
    // Calcular porcentajes si no vienen
    const gerenciasWithPercentage = gerenciaData.map(g => ({
      ...g,
      percentage: g.percentage || Math.round((g.participants / g.totalParticipants) * 100),
      momentum: g.momentum || Math.floor(Math.random() * 20) - 5, // Mock si no viene
      velocity: g.velocity || Math.floor(Math.random() * 30) + 10, // Mock si no viene
      projection: g.projection || Math.round((g.participants / g.totalParticipants) * 100 * 1.1) // Mock
    }));
    
    // Ordenar por porcentaje para ranking
    return gerenciasWithPercentage
      .sort((a, b) => b.percentage - a.percentage)
      .map((g, idx) => ({ ...g, position: idx + 1 }));
  }, [gerenciaData]);
  
  const selectedGerencia = enrichedGerencias[selectedGerenciaIndex];
  
  // Toggle para expandir/colapsar gerencias en vista competitivo
  const toggleExpand = (gerenciaId: string) => {
    const newExpanded = new Set(expandedGerencias);
    if (newExpanded.has(gerenciaId)) {
      newExpanded.delete(gerenciaId);
    } else {
      newExpanded.add(gerenciaId);
    }
    setExpandedGerencias(newExpanded);
  };
  
  // Si no hay datos o no hay jerarquía
  if (!hasHierarchy || enrichedGerencias.length === 0) {
    return (
      <Card className="fhr-card p-6">
        <div className="text-center text-gray-400">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
              <span>Cargando datos de gerencias...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-500" />
              <p>No hay datos jerárquicos disponibles</p>
              <p className="text-sm">La vista por gerencias requiere estructura organizacional configurada</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="fhr-card w-full">
      {/* HEADER CON TOGGLE BIMODAL */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Participación por Gerencia
        </h2>
        
        {/* Toggle Bimodal estilo CockpitHeader */}
        <div className="relative">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('competitivo')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'competitivo'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏆 Competitivo
            </button>
            <button
              onClick={() => setMode('focalizado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'focalizado'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎯 Focalizado
            </button>
          </div>
        </div>
      </div>
      
      {/* CONTENIDO - VISTAS MUTUAMENTE EXCLUYENTES */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          
          {/* VISTA COMPETITIVO - RANKING */}
          {mode === 'competitivo' ? (
            <motion.div
              key="competitivo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {enrichedGerencias.map((gerencia, idx) => (
                <motion.div
                  key={gerencia.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <div
                    className={`
                      p-4 rounded-lg border transition-all cursor-pointer
                      ${selectedGerenciaIndex === idx 
                        ? 'border-cyan-500/50 bg-cyan-950/20' 
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/30'
                      }
                    `}
                    onClick={() => {
                      setSelectedGerenciaIndex(idx);
                      toggleExpand(gerencia.id);
                    }}
                  >
                    {/* Fila principal de la gerencia */}
                    <div className="flex items-center justify-between">
                      {/* Izquierda: Ranking + Nombre */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Medalla o número */}
                        <div className="text-2xl w-10">
                          {idx === 0 && '🥇'}
                          {idx === 1 && '🥈'}
                          {idx === 2 && '🥉'}
                          {idx > 2 && <span className="text-gray-500">{idx + 1}</span>}
                        </div>
                        
                        {/* Expand icon */}
                        <div className="text-gray-400">
                          {expandedGerencias.has(gerencia.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </div>
                        
                        {/* Nombre y stats */}
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{gerencia.displayName}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {gerencia.participants}/{gerencia.totalParticipants} personas · 
                            Velocidad: {gerencia.velocity}/día · 
                            Proyección: {gerencia.projection}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Centro: Barra de progreso */}
                      <div className="flex-1 max-w-md mx-6">
                        <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${gerencia.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                        </div>
                      </div>
                      
                      {/* Derecha: Métricas */}
                      <div className="text-right">
                        <div className="text-2xl font-bold">{gerencia.percentage}%</div>
                        <div className="text-sm">
                          {gerencia.momentum && gerencia.momentum > 0 ? (
                            <span className="text-cyan-400">⚡+{gerencia.momentum}</span>
                          ) : gerencia.momentum && gerencia.momentum < 0 ? (
                            <span className="text-orange-400">⚠️ {gerencia.momentum}</span>
                          ) : (
                            <span className="text-gray-400">➡️ 0</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Departamentos expandibles */}
                    <AnimatePresence>
                      {expandedGerencias.has(gerencia.id) && gerencia.children && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 ml-16 space-y-2"
                        >
                          {gerencia.children.map(dept => (
                            <div 
                              key={dept.id}
                              className="flex items-center justify-between py-2 px-4 bg-gray-800/30 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400">├─</span>
                                <span>{dept.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">
                                  {dept.participants}/{dept.totalParticipants} personas
                                </span>
                                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500"
                                    style={{ width: `${dept.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right">
                                  {dept.percentage}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
              
              {/* Insights automáticos */}
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-950/20 to-purple-950/20 rounded-lg border border-cyan-500/20">
                <div className="space-y-2">
                  {enrichedGerencias[0] && (
                    <div className="flex items-center gap-2">
                      <span>💡</span>
                      <span className="text-sm">
                        {enrichedGerencias[0].displayName} lidera con {enrichedGerencias[0].percentage}% de participación
                        {enrichedGerencias[0].momentum > 0 && ` y momentum positivo (+${enrichedGerencias[0].momentum}%)`}
                      </span>
                    </div>
                  )}
                  {enrichedGerencias[enrichedGerencias.length - 1]?.percentage < 60 && (
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span className="text-sm text-orange-400">
                        {enrichedGerencias[enrichedGerencias.length - 1].displayName} requiere atención urgente 
                        ({enrichedGerencias[enrichedGerencias.length - 1].percentage}% participación)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
          ) : (
            
            /* VISTA FOCALIZADO - DETALLE */
            <motion.div
              key="focalizado"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Selector de gerencia */}
              <div className="mb-6">
                <Select 
                  value={selectedGerenciaIndex.toString()} 
                  onValueChange={(v) => setSelectedGerenciaIndex(parseInt(v))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue>
                      {selectedGerencia?.displayName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {enrichedGerencias.map((g, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        <div className="flex items-center gap-2">
                          {g.position <= 3 && ['🥇','🥈','🥉'][g.position - 1]}
                          <span>{g.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedGerencia && (
                <div className="grid grid-cols-[300px_1fr] gap-8">
                  {/* COLUMNA IZQUIERDA: Gauge + Métricas */}
                  <div className="space-y-6">
                    {/* Gauge */}
                    <div className="relative">
                      <div className="w-full aspect-square max-w-[280px] mx-auto">
                        {/* Círculo de fondo */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="20"
                          />
                          {/* Círculo de progreso */}
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${selectedGerencia.percentage * 2.83} 283`}
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#22D3EE" />
                              <stop offset="100%" stopColor="#A78BFA" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Texto central */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {selectedGerencia.percentage}%
                          </div>
                          <div className="text-sm text-gray-400 mt-2">Participación</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Métricas */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Participantes</span>
                        <span className="font-semibold">
                          {selectedGerencia.participants}/{selectedGerencia.totalParticipants}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Momentum</span>
                        <span className="font-semibold">
                          {selectedGerencia.momentum > 0 ? (
                            <span className="text-cyan-400">+{selectedGerencia.momentum}%</span>
                          ) : selectedGerencia.momentum < 0 ? (
                            <span className="text-orange-400">{selectedGerencia.momentum}%</span>
                          ) : (
                            <span>0%</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Velocidad</span>
                        <span className="font-semibold">{selectedGerencia.velocity} resp/día</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Proyección</span>
                        <span className="font-semibold text-purple-400">{selectedGerencia.projection}%</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Ranking</span>
                        <span className="font-semibold flex items-center gap-2">
                          #{selectedGerencia.position}
                          {selectedGerencia.position <= 3 && (
                            <span>{['🥇','🥈','🥉'][selectedGerencia.position - 1]}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* COLUMNA DERECHA: Departamentos */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Departamentos de {selectedGerencia.displayName}
                    </h3>
                    
                    <div className="space-y-3">
                      {selectedGerencia.children?.map(dept => (
                        <div key={dept.id} className="p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-medium flex items-center gap-2">
                              {dept.percentage >= 80 && '✅'}
                              {dept.percentage < 80 && dept.percentage >= 60 && '⚠️'}
                              {dept.percentage < 60 && '🔴'}
                              <span>{dept.name}</span>
                            </div>
                            <div className="text-2xl font-bold">
                              {dept.percentage}%
                            </div>
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.percentage}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          
                          {/* Información adicional */}
                          <div className="mt-2 text-sm text-gray-400">
                            {dept.participants}/{dept.totalParticipants} personas · 
                            {dept.percentage >= 80 && ' Líder del área'}
                            {dept.percentage < 80 && dept.percentage >= 60 && ' Necesita impulso'}
                            {dept.percentage < 60 && ' Atención urgente'}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Insights de departamentos */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg">
                      <div className="text-sm space-y-2">
                        {selectedGerencia.children?.filter(d => d.percentage >= 80).length > 0 && (
                          <div className="flex items-center gap-2">
                            <span>💡</span>
                            <span>
                              {selectedGerencia.children.filter(d => d.percentage >= 80).map(d => d.name).join(' y ')} 
                              lideran en participación
                            </span>
                          </div>
                        )}
                        {selectedGerencia.children?.filter(d => d.percentage < 60).length > 0 && (
                          <div className="flex items-center gap-2 text-orange-400">
                            <span>⚠️</span>
                            <span>
                              {selectedGerencia.children.filter(d => d.percentage < 60).map(d => d.name).join(' y ')} 
                              necesitan intervención urgente
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export default GerenciaPulseBimodal;