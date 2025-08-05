import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  Target,
  Calendar,
  Users,
  Zap
} from 'lucide-react';

// ====================================================================
// INTERFACES - DATOS DEL HOOK useCampaignMonitor
// ====================================================================

interface VelocimetroEngagementProps {
  // Datos principales del velocímetro
  participationRate: number;           // Métrica principal FIJA
  participationPrediction?: {          // Datos de proyección
    finalProjection: number;
    velocity: number;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
  
  // Contexto campaña para HUD
  name: string;
  type: string;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // Sistema alertas
  alerts: Array<{
    type: string;
    priority?: string;
    department?: string;
  }>;
  
  // Datos adicionales para inteligencia
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: string;
  }>;
  departmentAnomalies?: Array<any>;
  lastRefresh: Date;
}

// ====================================================================
// COMPONENTE PRINCIPAL - TESLA REFINED v2.0
// ====================================================================

export default function VelocimetroEngagement({
  participationRate,
  participationPrediction,
  name,
  type,
  daysRemaining,
  totalInvited,
  totalResponded,
  alerts = [],
  topMovers = [],
  departmentAnomalies = [],
  lastRefresh
}: VelocimetroEngagementProps) {

  // 🎯 MOMENTUM CALCULATION - NARRATIVA DEL PROGRESO
  const momentum = useMemo(() => {
    if (!participationPrediction) return { value: 0, trend: 'stable', icon: Activity };
    
    const projection = participationPrediction.finalProjection;
    const current = participationRate;
    const difference = projection - current;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let icon = Activity;
    
    if (difference > 5) {
      trend = 'up';
      icon = TrendingUp;
    } else if (difference < -2) {
      trend = 'down';
      icon = TrendingDown;
    }
    
    return {
      value: Math.abs(difference),
      trend,
      icon,
      velocity: participationPrediction.velocity
    };
  }, [participationRate, participationPrediction]);

  // 🚨 CLUSTER DE ALERTAS INTELIGENTE
  const alertCluster = useMemo(() => {
    const criticalAlerts = alerts.filter(a => a.priority === 'high').length;
    const warningAlerts = alerts.filter(a => a.priority === 'medium').length;
    const anomalies = departmentAnomalies.length;
    
    const alertTypes = [];
    
    // Alerta crítica
    if (criticalAlerts > 0) {
      alertTypes.push({
        icon: AlertTriangle,
        count: criticalAlerts,
        color: 'text-red-400',
        glow: 'shadow-red-500/50',
        active: true,
        type: 'critical'
      });
    }
    
    // Anomalías departamentales
    if (anomalies > 0) {
      alertTypes.push({
        icon: Target,
        count: anomalies,
        color: 'text-orange-400',
        glow: 'shadow-orange-500/50',
        active: true,
        type: 'anomaly'
      });
    }
    
    // Advertencias generales
    if (warningAlerts > 0) {
      alertTypes.push({
        icon: Activity,
        count: warningAlerts,
        color: 'text-yellow-400',
        glow: 'shadow-yellow-500/50',
        active: true,
        type: 'warning'
      });
    }
    
    return alertTypes;
  }, [alerts, departmentAnomalies]);

  // 🎯 FOCO DE ACCIÓN TESLA-STYLE
  const focoAccion = useMemo(() => {
    const criticalDept = alerts.find(a => a.priority === 'high')?.department;
    if (criticalDept) {
      return { text: `Intervenir ${criticalDept}`, urgency: 'high', icon: '🚨' };
    }
    
    const topDept = topMovers[0];
    if (topDept && topDept.trend === 'acelerando') {
      return { text: `Potenciar ${topDept.name}`, urgency: 'medium', icon: '🚀' };
    }
    
    if (participationRate < 50) {
      return { text: 'Impulsar participación', urgency: 'medium', icon: '📢' };
    }
    
    return { text: 'Mantener ritmo', urgency: 'low', icon: '✅' };
  }, [alerts, topMovers, participationRate]);

  // 🔄 CÁLCULOS ARCOS VELOCÍMETRO REFINADOS
  const arcoCalculations = useMemo(() => {
    const radio = 85;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radio;
    
    const projection = participationPrediction?.finalProjection || participationRate + 10;
    
    // Arco exterior (proyección) - línea punteada cyan
    const proyeccionOffset = circumference - (projection / 100) * circumference;
    
    // Arco interior (actual) - línea sólida gradiente
    const actualOffset = circumference - (participationRate / 100) * circumference;
    
    return {
      radio,
      strokeWidth,
      circumference,
      proyeccionOffset,
      actualOffset,
      projection
    };
  }, [participationRate, participationPrediction]);

  return (
    <div className="relative w-full bg-gradient-to-br from-slate-900/98 to-slate-800/95 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden">
      
      {/* EFECTOS DE FONDO SUTILES */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-purple-500/3" />
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10">
        
        {/* =============================================================== */}
        /* CLUSTER DE ALERTAS - SUPERIOR DERECHA (LUCES TABLERO) */}
        {/* =============================================================== */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-3">
            {alertCluster.map((alert, index) => {
              const IconComponent = alert.icon;
              return (
                <motion.div
                  key={alert.type}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: alert.active ? 1 : 0.7,
                    opacity: alert.active ? 1 : 0.3
                  }}
                  whileHover={{ scale: 1.1 }}
                  className={`
                    relative cursor-pointer transition-all duration-300
                    ${alert.active ? 'drop-shadow-lg' : ''}
                  `}
                >
                  {/* Icono con glow cuando activo */}
                  <div className={`
                    p-2 rounded-full border transition-all duration-300
                    ${alert.active 
                      ? `${alert.color} border-current shadow-lg ${alert.glow} bg-current/10` 
                      : 'text-white/20 border-white/10 bg-white/5'
                    }
                  `}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  {/* Contador cuando hay alertas */}
                  <AnimatePresence>
                    {alert.active && alert.count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`
                          absolute -top-1 -right-1 w-5 h-5 rounded-full 
                          ${alert.color} bg-current text-black text-xs font-bold 
                          flex items-center justify-center
                        `}
                      >
                        {alert.count}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* =============================================================== */}
        /* HEAD-UP DISPLAY (HUD) - INFORMACIÓN CONTEXTUAL */}
        {/* =============================================================== */}
        
        {/* TOP LEFT - Contexto Campaña */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 left-4"
        >
          <div className="text-white/60 text-sm font-medium">{name}</div>
          <div className="text-white/40 text-xs">{type}</div>
        </motion.div>

        {/* BOTTOM LEFT - Días Restantes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-4 left-4"
        >
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{daysRemaining}d restantes</span>
          </div>
        </motion.div>

        {/* BOTTOM RIGHT - Foco de Acción (Tarjeta Tesla-style) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 right-4"
        >
          <div className={`
            px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300
            ${focoAccion.urgency === 'high' 
              ? 'border-red-400/40 bg-red-500/10 text-red-400' 
              : focoAccion.urgency === 'medium'
              ? 'border-orange-400/40 bg-orange-500/10 text-orange-400'
              : 'border-green-400/40 bg-green-500/10 text-green-400'
            }
          `}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{focoAccion.icon}</span>
              <span>{focoAccion.text}</span>
            </div>
          </div>
        </motion.div>

        {/* =============================================================== */}
        /* VELOCÍMETRO CENTRAL - NARRATIVA DEL PROGRESO */}
        {/* =============================================================== */}
        <div className="flex items-center justify-center min-h-[320px]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            
            {/* SVG VELOCÍMETRO REFINADO */}
            <svg 
              width="220" 
              height="220" 
              viewBox="0 0 220 220"
              className="transform -rotate-90"
            >
              
              {/* Arco exterior - Proyección (punteado cyan) */}
              <motion.circle
                cx="110"
                cy="110" 
                r={arcoCalculations.radio}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="3"
                strokeDasharray="6 3"
                strokeDashoffset={arcoCalculations.proyeccionOffset}
                strokeLinecap="round"
                opacity="0.7"
                initial={{ strokeDashoffset: arcoCalculations.circumference }}
                animate={{ strokeDashoffset: arcoCalculations.proyeccionOffset }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />
              
              {/* Arco interior - Progreso (sólido gradiente) */}
              <motion.circle
                cx="110"
                cy="110"
                r={arcoCalculations.radio}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={arcoCalculations.strokeWidth}
                strokeDasharray={arcoCalculations.circumference}
                strokeDashoffset={arcoCalculations.actualOffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: arcoCalculations.circumference }}
                animate={{ strokeDashoffset: arcoCalculations.actualOffset }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="drop-shadow-lg"
              />
              
              {/* Gradientes SVG */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="1" />
                  <stop offset="50%" stopColor="#22D3EE" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>

            {/* CORAZÓN DEL MOMENTUM - CENTRO REFINADO */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, delay: 1 }}
                className="text-center"
              >
                {/* Número principal - Participación actual */}
                <div className="text-5xl font-light text-white mb-1">
                  {participationRate}%
                </div>
                
                {/* Momentum - Narrativa del progreso */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <momentum.icon className={`
                    h-4 w-4 
                    ${momentum.trend === 'up' ? 'text-green-400' : 
                      momentum.trend === 'down' ? 'text-red-400' : 'text-blue-400'}
                  `} />
                  <span className={`
                    text-sm font-medium
                    ${momentum.trend === 'up' ? 'text-green-400' : 
                      momentum.trend === 'down' ? 'text-red-400' : 'text-blue-400'}
                  `}>
                    {momentum.trend === 'up' ? '+' : momentum.trend === 'down' ? '-' : ''}
                    {momentum.value.toFixed(1)}%
                  </span>
                </motion.div>
                
                {/* Velocidad subtle */}
                {participationPrediction && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="text-white/50 text-xs mt-2"
                  >
                    {momentum.velocity > 0 ? '+' : ''}{momentum.velocity.toFixed(1)} resp/día
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Proyección sutil en la parte inferior */}
            {participationPrediction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
              >
                <div className="text-center">
                  <div className="text-cyan-400/80 text-sm font-medium">
                    → {arcoCalculations.projection}%
                  </div>
                  <div className="text-white/30 text-xs">proyección</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* HUD INFERIOR - Stats mínimas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalResponded}/{totalInvited}
            </div>
            <div>•</div>
            <div>{lastRefresh.toLocaleTimeString('es-CL')}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}