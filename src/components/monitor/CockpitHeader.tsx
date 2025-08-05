import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Activity, Clock } from 'lucide-react';

// Interface para datos reales del hook
interface CockpitHeaderProps {
  monitorData: {
    name: string;
    daysRemaining: number;
    participationRate: number;
    totalInvited: number;
    totalResponded: number;
    participationPrediction?: {
      finalProjection: number;
      confidence: number;
      trendDirection?: string;
    };
    departmentAnomalies: Array<{
      department: string;
      severity: string;
    }>;
    alerts: Array<{
      id: string | number;
      type: string;
      message: string;
      priority: string;
    }>;
  };
  onScrollToSection?: (section: 'anomalies' | 'departments' | 'predictions') => void;
}

// Datos por defecto si no se pasan props
const defaultMonitorData = {
  name: "Campaña de Prueba",
  daysRemaining: 0,
  participationRate: 0,
  totalInvited: 0,
  totalResponded: 0,
  participationPrediction: {
    finalProjection: 0,
    confidence: 0,
    trendDirection: "neutral"
  },
  departmentAnomalies: [],
  alerts: []
};

interface CockpitHeaderProps {
  monitorData?: typeof mockMonitorData;
  onScrollToSection?: (section: 'anomalies' | 'departments' | 'predictions') => void;
}

const CockpitHeader: React.FC<CockpitHeaderProps> = ({ 
  monitorData = defaultMonitorData, 
  onScrollToSection = () => {} 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentValue, setCurrentValue] = useState(monitorData.participationRate || 0);
  const [mounted, setMounted] = useState(false);

  // Evitar hydration error con timestamp
  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar cuando cambien los datos reales
  useEffect(() => {
    if (monitorData.participationRate !== currentValue) {
      setIsUpdating(true);
      setCurrentValue(monitorData.participationRate || 0);
      setTimeout(() => setIsUpdating(false), 800);
    }
  }, [monitorData.participationRate]);

  // Cálculos para el velocímetro Tesla simple
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (currentValue / 100) * circumference;
  
  // Colores dinámicos Tesla style
  const getStatusColor = (value: number) => {
    if (value >= 80) return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' }; // Verde
    if (value >= 60) return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' }; // Amarillo  
    return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }; // Rojo
  };

  const status = getStatusColor(currentValue);
  const criticalAlerts = (monitorData.alerts || []).filter(a => a.priority === 'high').length;
  const hasAnomalies = (monitorData.departmentAnomalies || []).length > 0;
  
  // Calcular momentum del cambio de participación
  const projectedChange = (monitorData.participationPrediction?.finalProjection || 0) - currentValue;
  const isPositiveTrend = projectedChange > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* ====================================================================== */}
          {/* HUD IZQUIERDA - INFORMACIÓN CONTEXTUAL */}
          {/* ====================================================================== */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="space-y-4">
              {/* Información campaña */}
              <div className="space-y-2">
                <h1 className="text-white font-semibold text-xl lg:text-2xl truncate">
                  {monitorData.name}
                </h1>
                <div className="flex flex-col gap-2 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{monitorData.daysRemaining} días restantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">{monitorData.totalResponded} de {monitorData.totalInvited} respuestas</span>
                  </div>
                </div>
              </div>
              
              {/* Acción inmediata */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20"
              >
                <div className="text-xs text-cyan-400 uppercase tracking-wider font-medium mb-1">
                  Acción Inmediata
                </div>
                <div className="text-sm text-white">
                  {criticalAlerts > 0 ? 
                    `${criticalAlerts} departamentos requieren intervención` : 
                    "Campaña en buen curso, mantener momentum"
                  }
                </div>
              </motion.div>
            </div>
          </div>

          {/* ====================================================================== */}
          {/* VELOCÍMETRO TESLA CENTRO - ORIGINAL + PROYECCIÓN CLARA */}
          {/* ====================================================================== */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Contenedor velocímetro Tesla original */}
              <div className="relative w-80 h-80 flex items-center justify-center">
                
                {/* SVG Círculo Tesla simple */}
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 200 200"
                >
                  {/* Círculo base */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="rgba(100, 116, 139, 0.3)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  
                  {/* Círculo progreso ÚNICO - Tesla style */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke={status.color}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-500 ease-out ${isUpdating ? 'drop-shadow-lg' : ''}`}
                    style={{
                      filter: isUpdating ? `drop-shadow(0 0 12px ${status.color})` : 'none'
                    }}
                  />
                </svg>

                {/* Contenido central Tesla */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  
                  {/* NÚMERO GIGANTE TESLA - PRINCIPAL */}
                  <div 
                    className={`text-8xl lg:text-9xl font-light tracking-tight transition-all duration-300 ${isUpdating ? 'scale-105' : ''}`}
                    style={{ color: status.color }}
                  >
                    {currentValue}
                    <span className="text-5xl lg:text-6xl opacity-80">%</span>
                  </div>
                  
                  {/* Momentum sutil - NO competitivo */}
                  <div className="flex items-center gap-2 mt-2 opacity-70">
                    {isPositiveTrend ? 
                      <TrendingUp className="w-4 h-4 text-green-400" /> :
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    }
                    <span className="text-sm text-green-400 font-medium">
                      {isPositiveTrend ? '+' : ''}{projectedChange.toFixed(1)}%
                    </span>
                  </div>

                  {/* PROYECCIÓN - CLARA Y DIFERENCIADA */}
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="text-xs text-cyan-400 uppercase tracking-wider font-medium mb-1">
                      Proyección Final
                    </div>
                    <div className="text-3xl lg:text-4xl font-light text-cyan-400">
                      {monitorData.participationPrediction?.finalProjection || 0}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {monitorData.participationPrediction?.confidence || 0}% confianza
                    </div>
                  </motion.div>
                </div>

                {/* Label base */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-sm text-slate-500 uppercase tracking-wider">
                    Participación Actual
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ====================================================================== */}
          {/* ALERTAS DERECHA - NEURAL GLOW CONDICIONAL */}
          {/* ====================================================================== */}
          <div className="lg:col-span-3 order-3">
            <div className="flex lg:flex-col gap-4 justify-center lg:justify-end items-center lg:items-end">
              
              {/* Alertas críticas */}
              <AnimatePresence>
                {criticalAlerts > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onScrollToSection('anomalies')}
                    className="relative group"
                  >
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm">
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{criticalAlerts}</span>
                      </div>
                      <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Anomalías departamentales */}
              <AnimatePresence>
                {hasAnomalies && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onScrollToSection('departments')}
                    className="relative group"
                  >
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 backdrop-blur-sm">
                      <Target className="w-7 h-7 text-amber-400" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{monitorData.departmentAnomalies?.length || 0}</span>
                      </div>
                      <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Insights disponibles */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onScrollToSection('predictions')}
                className="relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
                  <Activity className="w-7 h-7 text-cyan-400" />
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                </div>
              </motion.button>
            </div>
            
            {/* Labels alertas */}
            <div className="hidden lg:block mt-4 space-y-2 text-right">
              {criticalAlerts > 0 && (
                <div className="text-xs text-red-400">Críticas</div>
              )}
              {hasAnomalies && (
                <div className="text-xs text-amber-400">Anomalías</div>
              )}
              <div className="text-xs text-cyan-400">Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp discreto - FIXED HYDRATION */}
      <div className="absolute bottom-2 right-4 text-xs text-slate-600">
        {mounted ? `Datos vivos • ${new Date().toLocaleTimeString('es-CL', { hour12: false })}` : 'Datos vivos • --:--:--'}
      </div>
    </motion.div>
  );
};

export default CockpitHeader;