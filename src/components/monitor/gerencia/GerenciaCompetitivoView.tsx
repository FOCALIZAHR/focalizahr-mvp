// ====================================================================
// GERENCIA COMPETITIVO VIEW - DISEÑO PREMIUM FINAL FOCALIZAHR
// src/components/monitor/gerencia/GerenciaCompetitivoView.tsx
// Versión Premium: Apple simplicidad + Tesla datos + Netflix engagement
// ====================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  ChevronDown,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';

// ====================================================================
// INTERFACES
// ====================================================================

interface DepartmentChild {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  responded: number;
  projection?: number;  // ← AGREGAR ESTA LÍNEA
  participants: number;
}

interface ProcessedGerencia {
  id: string;
  displayName: string;
  scoreNum: number;
  rateNum: number;
  trend: string;
  velocity: number;
  projection: number;
  position: number;
  responded: number;
  participants: number;
  children: DepartmentChild[];
}

interface GerenciaCompetitivoViewProps {
  gerencias: ProcessedGerencia[];
  selectedIndex: number;
  onSelectGerencia: (index: number) => void;
}

// ====================================================================
// HELPERS PREMIUM
// ====================================================================

// Sistema de performance con colores corporativos
const getPerformanceStyles = (rate: number) => {
  if (rate >= 85) return { 
    label: 'EXCELENTE',
    gradient: 'from-emerald-500 via-emerald-400 to-cyan-400',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    glowColor: 'shadow-emerald-500/20'
  };
  if (rate >= 70) return { 
    label: 'BUENO',
    gradient: 'from-cyan-500 via-cyan-400 to-purple-500',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    glowColor: 'shadow-cyan-500/20'
  };
  if (rate >= 50) return { 
    label: 'REGULAR',
    gradient: 'from-amber-500 via-amber-400 to-orange-400',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    glowColor: 'shadow-amber-500/20'
  };
  return { 
    label: 'CRÍTICO',
    gradient: 'from-red-500 via-red-400 to-pink-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    glowColor: 'shadow-red-500/20'
  };
};

// Trend inteligente con fallbacks
const getTrendDisplay = (trend: string | null, velocity: number) => {
  const normalizedTrend = trend?.toLowerCase().trim() || '';
  
  // Inferir trend si no viene pero hay velocity
  if (!normalizedTrend && velocity !== undefined && velocity !== 0) {
    if (velocity > 5) return {
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      value: `+${Math.abs(velocity).toFixed(0)}%`,
      label: 'Acelerando'
    };
    if (velocity < -5) return {
      icon: TrendingDown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      value: `${velocity.toFixed(0)}%`,
      label: 'Desacelerando'
    };
  }
  
  switch (normalizedTrend) {
    case 'acelerando':
      return {
        icon: TrendingUp,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        value: velocity > 0 ? `+${Math.abs(velocity).toFixed(0)}%` : '+0%',
        label: 'Acelerando'
      };
    case 'desacelerando':
      return {
        icon: TrendingDown,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        value: velocity !== 0 ? `${velocity.toFixed(0)}%` : '-0%',
        label: 'Desacelerando'
      };
    case 'crítico':
      return {
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        value: velocity !== 0 ? `${velocity.toFixed(0)}%` : '!',
        label: 'Crítico'
      };
    case 'estable':
      return {
        icon: Activity,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        value: '0%',
        label: 'Estable'
      };
    default:
      return {
        icon: Activity,
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/5',
        value: '0%',
        label: 'Sin datos'
      };
  }
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function GerenciaCompetitivoView({ 
  gerencias, 
  selectedIndex, 
  onSelectGerencia 
}: GerenciaCompetitivoViewProps) {
  
  const [expandedGerencias, setExpandedGerencias] = useState<Set<string>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const toggleExpand = (gerenciaId: string, index: number) => {
    const newExpanded = new Set(expandedGerencias);
    if (newExpanded.has(gerenciaId)) {
      newExpanded.delete(gerenciaId);
    } else {
      newExpanded.add(gerenciaId);
    }
    setExpandedGerencias(newExpanded);
    onSelectGerencia(index);
  };
  
  // Métricas agregadas
  const topPerformer = gerencias[0];
  const averageRate = gerencias.reduce((sum, g) => sum + g.rateNum, 0) / gerencias.length;
  const excellentCount = gerencias.filter(g => g.rateNum >= 85).length;
  const criticalCount = gerencias.filter(g => g.trend === 'crítico' || g.rateNum < 50).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* TABLA PRINCIPAL - Glassmorphism sutil */}
      <div className="relative">
        {/* Glow sutil de fondo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-2xl opacity-50" />
        
        <div 
          className="relative overflow-hidden rounded-xl backdrop-blur-md"
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}
        >
          
          {/* HEADER ELEGANTE */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm border-b border-slate-700/30">
            <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-slate-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Gerencia</div>
              <div className="col-span-4">Progreso</div>
              <div className="col-span-1 text-center">Part.</div>
              <div className="col-span-2 text-center">Tendencia</div>
            </div>
          </div>
          
          {/* FILAS CON MICRO-ANIMACIONES */}
          <div className="divide-y divide-slate-800/30">
            {gerencias.map((gerencia, index) => {
              const performanceStyles = getPerformanceStyles(gerencia.rateNum);
              const trendDisplay = getTrendDisplay(gerencia.trend, gerencia.velocity);
              const TrendIcon = trendDisplay.icon;
              const isExpanded = expandedGerencias.has(gerencia.id);
              const isSelected = selectedIndex === index;
              const isHovered = hoveredIndex === index;
              
              return (
                <motion.div
                  key={gerencia.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  
                  {/* FILA PRINCIPAL */}
                  <motion.div
                    className={`
                      relative px-6 py-5 cursor-pointer transition-all duration-300
                      ${isSelected ? 'bg-cyan-950/20' : ''}
                    `}
                    onClick={() => toggleExpand(gerencia.id, index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                  >
                    {/* Indicador lateral animado */}
                    {isSelected && (
                      <motion.div
                        layoutId="selected-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    <div className="grid grid-cols-12 gap-4 items-center">
                      
                      {/* RANKING PREMIUM */}
                      <div className="col-span-1 text-center">
                        <motion.div
                          animate={{ scale: isHovered ? 1.1 : 1 }}
                          className={`
                            text-lg font-bold
                            ${index === 0 ? 'text-cyan-400' :
                              index === 1 ? 'text-cyan-400/70' :
                              index === 2 ? 'text-cyan-400/50' :
                              'text-slate-500'}
                          `}
                        >
                          {gerencia.position}
                        </motion.div>
                      </div>
                      
                      {/* INFO GERENCIA */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-slate-400"
                          >
                            {gerencia.children.length > 0 ? (
                              isExpanded ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                          </motion.div>
                          
                          <div className="text-slate-400">
                            {/* Sin icono - Diseño más limpio y minimalista */}
                          </div>
                          
                          <div>
                            <div className="text-white font-medium text-sm">
                              {gerencia.displayName}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                <Users className="w-3 h-3 inline mr-1" />
                                {gerencia.responded}/{gerencia.participants}
                              </span>
                              {/* Mostrar proyección solo si viene del backend */}
                              {gerencia.projection > 0 && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-xs text-slate-500">
                                    Proyección: {gerencia.projection.toFixed(0)}%
                                  </span>
                                </>
                              )}
                              {/* Mostrar tendencia como texto si viene del backend */}
                              {gerencia.trend && gerencia.trend !== 'estable' && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className={`text-xs ${
                                    gerencia.trend === 'acelerando' ? 'text-emerald-400' :
                                    gerencia.trend === 'crítico' ? 'text-red-400' :
                                    gerencia.trend === 'desacelerando' ? 'text-amber-400' :
                                    'text-slate-500'
                                  }`}>
                                    {gerencia.trend === 'acelerando' ? 'Acelerando' :
                                     gerencia.trend === 'crítico' ? 'Crítico' :
                                     gerencia.trend === 'desacelerando' ? 'Desacelerando' :
                                     ''}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* BARRA PROGRESO PREMIUM */}
                      <div className="col-span-4">
                        <div className="space-y-2">
                          <div className="relative">
                            {/* Track de fondo con patrón */}
                            <div className="absolute inset-0 h-2 bg-slate-800/30 rounded-full overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="h-full w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700" />
                              </div>
                            </div>
                            
                            {/* Barra de progreso */}
                            <div className="relative h-2 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full bg-gradient-to-r ${performanceStyles.gradient} shadow-lg`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(gerencia.rateNum, 100)}%` }}
                                transition={{ 
                                  duration: 1,
                                  delay: index * 0.1,
                                  ease: [0.4, 0, 0.2, 1]
                                }}
                                style={{
                                  boxShadow: `0 0 20px ${performanceStyles.textColor.replace('text-', '')}40`
                                }}
                              >
                                {/* Efecto shimmer premium */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ 
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatDelay: 5,
                                    ease: "linear"
                                  }}
                                />
                              </motion.div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium ${performanceStyles.textColor}`}>
                              {performanceStyles.label}
                            </span>
                            {gerencia.velocity > 0 && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {gerencia.velocity}/día
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* PARTICIPACIÓN */}
                      <div className="col-span-1 text-center">
                        <motion.div
                          animate={{ scale: isHovered ? 1.05 : 1 }}
                          className={`text-2xl font-bold ${performanceStyles.textColor}`}
                        >
                          {gerencia.rateNum.toFixed(0)}%
                        </motion.div>
                      </div>
                      
                      {/* TENDENCIA PREMIUM */}
                      <div className="col-span-2 flex justify-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            ${trendDisplay.bgColor} ${trendDisplay.color}
                            border ${trendDisplay.color.replace('text', 'border')}/20
                          `}
                        >
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            {trendDisplay.value}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* DEPARTAMENTOS EXPANDIBLES PREMIUM */}
                  <AnimatePresence>
                    {isExpanded && gerencia.children.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 bg-gradient-to-b from-slate-900/20 to-transparent">
                          <div className="ml-12 pt-4 space-y-2">
                            {/* Header de sección */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider mb-3">
                              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1" />
                              <span>Departamentos ({gerencia.children.length})</span>
                              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1" />
                            </div>
                            
                            {/* Lista de departamentos */}
                            {gerencia.children.map((dept, deptIdx) => {
                              const deptStyles = getPerformanceStyles(dept.rateNum);
                              
                              return (
                                <motion.div
                                  key={dept.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: deptIdx * 0.05 }}
                                  whileHover={{ x: 4 }}
                                  className={`
                                    group flex items-center justify-between py-3 px-4 rounded-lg
                                    bg-slate-800/20 hover:bg-slate-800/40 transition-all duration-200
                                    border ${deptStyles.borderColor} hover:${deptStyles.borderColor.replace('/20', '/40')}
                                  `}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-600 text-sm group-hover:text-slate-400 transition-colors">
                                      └
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white text-sm font-medium">
                                        {dept.displayName}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        ({dept.responded}/{dept.participants})
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    {/* Mini barra elegante */}
                                    <div className="w-20 h-1 bg-slate-700/30 rounded-full overflow-hidden">
                                      <motion.div
                                        className={`h-full bg-gradient-to-r ${deptStyles.gradient}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(dept.rateNum, 100)}%` }}
                                        transition={{ duration: 0.6, delay: deptIdx * 0.05 }}
                                      />
                                    </div>
                                    
                                    {/* Métricas */}
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-bold ${deptStyles.textColor} w-12 text-right`}>
                                        {dept.rateNum.toFixed(0)}%
                                      </span>
                                      <div className="text-xs text-slate-500 w-20 text-right">
                                        {dept.projection && dept.projection > 0 ? (
                                          <>Proy: {dept.projection.toFixed(0)}%</>
                                        ) : (
                                          <></>
)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
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
      
      {/* PANEL DE INSIGHTS PREMIUM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-xl backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.05), rgba(167, 139, 250, 0.05))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Líder */}
          <motion.div whileHover={{ y: -2 }} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 uppercase tracking-wider">Líder</span>
            </div>
            <div className="text-white font-semibold text-lg">
              {topPerformer?.displayName || 'N/A'}
            </div>
            <div className="text-xs text-slate-400">
              {topPerformer?.rateNum.toFixed(1) || '0'}% participación
            </div>
          </motion.div>
          
          {/* Card 2: Promedio */}
          <motion.div whileHover={{ y: -2 }} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 uppercase tracking-wider">Promedio Empresa</span>
            </div>
            <div className="text-white font-semibold text-lg">
              {averageRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400">
              Entre {gerencias.length} gerencias
            </div>
          </motion.div>
          
          {/* Card 3: Top Performers */}
          <motion.div whileHover={{ y: -2 }} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-400 uppercase tracking-wider">Top Performers</span>
            </div>
            <div className="text-white font-semibold text-lg">
              {excellentCount} gerencias
            </div>
            <div className="text-xs text-slate-400">
              Superan el 85% meta
            </div>
          </motion.div>
          
          {/* Card 4: Atención */}
          {criticalCount > 0 && (
            <motion.div whileHover={{ y: -2 }} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 uppercase tracking-wider">Atención</span>
              </div>
              <div className="text-white font-semibold text-lg">
                {criticalCount} gerencias
              </div>
              <div className="text-xs text-slate-400">
                Requieren apoyo urgente
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GerenciaCompetitivoView;