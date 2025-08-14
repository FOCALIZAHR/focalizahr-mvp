// ====================================================================
// DYNAMIC VIEW MEJORADO - TARJETAS VIVAS CON VISUALIZACIONES
// src/components/monitor/cockpit/DynamicView.tsx
// ✅ PRESERVA 100% LA ARQUITECTURA EXISTENTE + AGREGA TOOLTIPS Y GAUGES
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, Activity, Target } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
// 🔧 NUEVOS IMPORTS PARA TOOLTIPS EDUCATIVOS
import { MomentumTooltip, TooltipContext } from '@/components/ui/TooltipContext';

// 🎯 INTERFACE PROPS EXTENDIDA (AGREGAR NUEVAS PROPIEDADES)
interface DynamicViewProps {
  // ... todas las propiedades existentes ...
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
  
  // 🔧 NUEVAS PROPIEDADES PARA VISUALIZACIÓN
  riskTrendData?: Array<{date: string, rate: number}>;
  departmentSizes?: Record<string, number>;
  momentumGaugeData?: Array<{value: number, fill: string}>;
  
  // ... resto de propiedades existentes ...
  onNavigate?: (section: string) => void;
}

// 🎯 COMPONENTE PRINCIPAL (PRESERVAR ESTRUCTURA EXISTENTE)
export function DynamicView(props: DynamicViewProps) {
  // ✅ DESTRUCTURAR PROPS (MANTENER LÓGICA EXISTENTE)
  const {
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    topMovers,
    negativeAnomalies,
    riskTrendData = [],
    departmentSizes = {},
    momentumGaugeData = [],
    onNavigate,
    // ... resto de props
  } = props;

  // ✅ LÓGICA EXISTENTE PRESERVADA 100%
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ⚡ VISTA DINÁMICA - 4 CARDS HORIZONTALES TESLA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '280px' }}>
        
        {/* 🏆 CARD 1: CAMPEÓN DEL MOMENTO CON MOMENTUM GAUGE */}
        <MomentumTooltip 
          momentum={campeón?.momentum || 0} 
          trend={campeón?.trend || 'estable'}
        >
          <motion.div
            className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: '24px'
            }}
            onClick={() => onNavigate?.('topmovers')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-3 h-3 rounded-full bg-green-400 mb-3"></div>
            <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
              Campeón del Momento
            </h3>
            
            {/* 🔧 NUEVO: GAUGE SEMICIRCULAR MOMENTUM */}
            {momentumGaugeData.length > 0 && (
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={momentumGaugeData}
                      startAngle={180}
                      endAngle={0}
                      innerRadius={25}
                      outerRadius={40}
                      dataKey="value"
                      stroke="none"
                    >
                      {momentumGaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="text-2xl font-bold text-green-300 mb-2">
              {campeón ? campeón.name : 'Sin datos suficientes'}
            </div>
            <div className="text-sm text-green-200 mb-1">
              {campeón ? `${campeón.momentum}%` : 'Esperando actividad'} momentum
            </div>
            <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
              campeón?.trend === 'completado' ? 'bg-green-500/20 text-green-300' :
              campeón?.trend === 'acelerando' ? 'bg-cyan-500/20 text-cyan-300' :
              campeón?.trend === 'desacelerando' ? 'bg-red-500/20 text-red-300' : 
              'bg-gray-500/20 text-gray-300'
            }`}>
              {campeón?.trend === 'completado' ? 'Completado' :
               campeón?.trend === 'acelerando' ? 'Acelerando' :
               campeón?.trend === 'desacelerando' ? 'Desacelerando' : 'Estable'}
            </div>
            <div className="text-xs text-white/60">
              {campeón ? 'Mejor performance organizacional' : 'Análisis disponible con más datos'}
            </div>
          </motion.div>
        </MomentumTooltip>

        {/* ⚠️ CARD 2: FOCO DE RIESGO CON SPARKLINE Y TOOLTIP EXPLICATIVO */}
        <TooltipContext
          variant="risk"
          title="Anomalía Estadística Detectada"
          explanation="Departamento con desviación crítica vs norma organizacional"
          details={[
            `Desviación: ${focoRiesgo?.zScore?.toFixed(1) || '0'}σ vs promedio`,
            `Impacto: ${focoRiesgo ? departmentSizes[focoRiesgo.department] || 0 : 0} colaboradores`,
            `Severidad: ${focoRiesgo?.severity || 'low'}`
          ]}
          actionable="🚨 Intervención recomendada próximas 24h"
          position="bottom"
        >
          <motion.div
            className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: '24px'
            }}
            onClick={() => onNavigate?.('anomalies')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-3 h-3 rounded-full bg-red-400 mb-3"></div>
            <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
              Foco de Riesgo
            </h3>
            <div className="text-2xl font-bold text-red-300 mb-2">
              {focoRiesgo ? focoRiesgo.department : '✅ Sin riesgos detectados'}
            </div>
            <div className="text-sm text-red-200 mb-1">
              {focoRiesgo ? `${focoRiesgo.rate}%` : 'Todas las áreas normales'} {focoRiesgo ? '- Atención requerida' : ''}
            </div>
            <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
              focoRiesgo?.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {focoRiesgo?.severity === 'high' ? 'Crítico' : 'Moderado'}
            </div>
            
            {/* 🔧 NUEVO: SPARKLINE CON TENDENCIA DESCENDENTE */}
            {riskTrendData.length > 0 && (
              <div className="h-6 w-full mt-2">
                <ResponsiveContainer>
                  <LineChart data={riskTrendData}>
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="text-xs text-white/60">
              {focoRiesgo ? 'Intervención requerida próximas 24h' : 'Todas las métricas en rango normal'}
            </div>
          </motion.div>
        </TooltipContext>

        {/* 🎯 CARD 3: PRESERVAR CONTENIDO EXISTENTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('predictions')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-blue-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Proyección Final
          </h3>
          <div className="text-2xl font-bold text-blue-300 mb-2">
            {participationRate.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-200 mb-1">
            En {daysRemaining} días restantes
          </div>
          <div className="text-xs text-white/60">
            Análisis predictivo disponible
          </div>
        </motion.div>

        {/* 🎯 CARD 4: PRESERVAR CONTENIDO EXISTENTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('actions')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-purple-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Acción Recomendada
          </h3>
          <div className="text-2xl font-bold text-purple-300 mb-2">
            {focoRiesgo ? 'Intervenir' : 'Continuar'}
          </div>
          <div className="text-sm text-purple-200 mb-1">
            {focoRiesgo ? 'Urgencia media' : 'Estrategia actual'}
          </div>
          <div className="text-xs text-white/60">
            Recomendación táctica basada en datos
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}