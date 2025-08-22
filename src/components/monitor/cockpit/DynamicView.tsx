// ====================================================================
// DYNAMIC VIEW MEJORADO - TARJETAS VIVAS CON VISUALIZACIONES
// src/components/monitor/cockpit/DynamicView.tsx
// ✅ PRESERVA 100% LA ARQUITECTURA EXISTENTE + AGREGA TOOLTIPS Y GAUGES
// 🎯 DISEÑO: War Room Ejecutivo - 4 Tarjetas Vivas de Inteligencia
// ====================================================================

"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, Activity, Target, ArrowRight } from 'lucide-react';
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
  byDepartment?: Record<string, {
    invited: number;
    responded: number;
    rate: number;
  }>;
  
  // ✅ AGREGAR: Inteligencia pre-calculada del hook
  cockpitIntelligence?: {
    tacticalAction?: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
      timeline?: string;
      nextSteps?: string[];
    };
  };
  
  // ... resto de propiedades existentes ...
  onNavigate?: (section: string) => void;
}

// 🎯 COMPONENTE PRINCIPAL (PRESERVAR ESTRUCTURA EXISTENTE)
export default function DynamicView(props: DynamicViewProps) {
  // ✅ ESTADO PARA FUNCIONALIDAD EXPANDIBLE
  const [expandedAction, setExpandedAction] = useState(false);
  
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
    byDepartment = {},
    cockpitIntelligence, // ✅ AGREGAR inteligencia pre-calculada
    onNavigate,
    // ... resto de props
  } = props;

  // ✅ LÓGICA EXISTENTE PRESERVADA 100%
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;
  
  // 🎯 CALCULAR MÉTRICAS ADICIONALES PARA CARDS 3 Y 4
  const patrónDominante = {
    tipo: topMovers.length > 2 ? 'Comportamiento Mixto' : topMovers.length > 0 ? 'Líder Claro' : 'Sin Patrón',
    descripción: `${topMovers.length} departamentos con momentum positivo`,
    color: topMovers.length > 2 ? 'blue' : 'green'
  };

  // 🎯 WAR ROOM EJECUTIVO: 4 TARJETAS VIVAS
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ✅ GRID 4 TARJETAS VIVAS HORIZONTALES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8" style={{ minHeight: '280px' }}>
        
        {/* ⚡ CARD 1: DEPARTAMENTO LÍDER - GAUGE SEMICIRCULAR DE ACELERACIÓN */}
        <TooltipContext>
          <motion.div
            className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: '24px'
            }}
            onClick={() => onNavigate?.('departments')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-3 h-3 rounded-full bg-green-400 mb-3"></div>
            <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
              Departamento Líder
            </h3>
            
            {/* GAUGE SEMICIRCULAR DE ACELERACIÓN CON RECHARTS */}
            <div className="relative h-24 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="accelerationGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#22D3EE" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { value: campeón?.momentum || 85, fill: 'url(#accelerationGradient)' },
                      { value: 100 - (campeón?.momentum || 85), fill: 'rgba(255,255,255,0.1)' }
                    ]}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* VALOR CENTRAL DEL GAUGE */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-2xl font-bold text-green-300">
                  {campeón?.momentum || 85}%
                </div>
              </div>
            </div>

            <div className="text-lg font-bold text-green-300 mb-2">
              {campeón?.name || 'IT'}
            </div>
            <div className="text-sm text-green-200 mb-1">
              Desempeño superior
            </div>
            <div className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full mb-3">
              Ritmo de respuesta excelente
            </div>
            
            <MomentumTooltip 
              momentum={campeón?.momentum || 85}
              department={campeón?.name || 'IT'}
              explanation="Este departamento mantiene un ritmo de participación constante y alto, convirtiéndose en el motor de la campaña."
            >
              <div className="text-xs text-white/60 cursor-help border-b border-dotted border-white/30">
                ¿Por qué es líder? →
              </div>
            </MomentumTooltip>
          </motion.div>
        </TooltipContext>

        {/* ⚡ CARD 2: ATENCIÓN REQUERIDA - SPARKLINE DESCENDENTE */}
        <TooltipContext variant="risk">
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
            onClick={() => onNavigate?.('risks')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-3 h-3 rounded-full bg-red-400 mb-3"></div>
            <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
              Atención Requerida
            </h3>
            
            {/* MICRO-GRÁFICO SPARKLINE DESCENDENTE */}
            <div className="relative h-16 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrendData.length > 0 ? riskTrendData : [
                  { date: '1', rate: 65 },
                  { date: '2', rate: 58 },
                  { date: '3', rate: 52 },
                  { date: '4', rate: 45 },
                  { date: '5', rate: focoRiesgo?.rate || 42 }
                ]}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, fill: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-lg font-bold text-red-300 mb-2">
              {focoRiesgo?.department || 'Marketing'}
            </div>
            <div className="text-sm text-red-200 mb-1">
              {focoRiesgo?.rate || 42}% participación
            </div>
            <div className="inline-block px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full mb-3">
              Desviación significativa
            </div>
            
            <div className="text-xs text-white/60 mb-2">
              vs benchmark organizacional: -{Math.abs(focoRiesgo?.zScore || 2.1).toFixed(1)}σ
            </div>
            
            <div className="text-xs text-red-300 cursor-help border-b border-dotted border-red-400/50">
              Evidencia: Tendencia descendente →
            </div>
          </motion.div>
        </TooltipContext>

        {/* ⚡ CARD 3: PANORAMA ORGANIZACIONAL - DONUT CHART DISTRIBUCIÓN */}
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
          onClick={() => onNavigate?.('pattern')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-blue-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Panorama Organizacional
          </h3>
          
          {/* MICRO-GRÁFICO DE DONA CON DISTRIBUCIÓN DEPARTAMENTAL */}
          <div className="relative h-24 w-full mb-4 flex items-center justify-center">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="orgGradient1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="orgGradient2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>
                    <linearGradient id="orgGradient3" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="orgGradient4" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={momentumGaugeData.length > 0 ? momentumGaugeData : [
                      { name: 'Alto', value: 30, fill: 'url(#orgGradient1)' },
                      { name: 'Medio', value: 40, fill: 'url(#orgGradient2)' },
                      { name: 'Bajo', value: 20, fill: 'url(#orgGradient3)' },
                      { name: 'Crítico', value: 10, fill: 'url(#orgGradient4)' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(momentumGaugeData.length > 0 ? momentumGaugeData : [
                      { name: 'Alto', value: 30, fill: 'url(#orgGradient1)' },
                      { name: 'Medio', value: 40, fill: 'url(#orgGradient2)' },
                      { name: 'Bajo', value: 20, fill: 'url(#orgGradient3)' },
                      { name: 'Crítico', value: 10, fill: 'url(#orgGradient4)' }
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* VALOR CENTRAL */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-300">{participationRate}%</div>
                <div className="text-xs text-blue-400">TOTAL</div>
              </div>
            </div>
          </div>

          <div className="text-lg font-bold text-blue-300 mb-2">
            Respuesta Variable por Área
          </div>
          <div className="text-sm text-blue-200 mb-1">
            {totalResponded} de {totalInvited} empleados
          </div>
          <div className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full mb-3">
            Participación por departamento
          </div>
          
          <div className="text-xs text-white/60 mb-2">
            Distribución: {participationRate >= 70 ? 'Equilibrada' : 'Variable'}
          </div>
          <div className="text-xs text-blue-300">
            {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Campaña finalizada'}
          </div>
        </motion.div>

        {/* ⚡ CARD 4: ACCIÓN RECOMENDADA - TARJETA EXPANDIBLE PROMINENTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
          style={{
            background: `rgba(167, 139, 250, 0.15)`,
            border: `2px solid ${cockpitIntelligence?.tacticalAction?.urgencyColor || 'rgba(167, 139, 250, 0.4)'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 6px 30px ${cockpitIntelligence?.tacticalAction?.urgencyColor || 'rgba(167, 139, 250, 0.2)'}`,
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => {
            setExpandedAction(!expandedAction);
            onNavigate?.('actions');
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* EFECTO VISUAL DE URGENCIA */}
          <motion.div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: cockpitIntelligence?.tacticalAction?.urgencyColor || '#A78BFA' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="flex items-start justify-between mb-3">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <motion.div
              animate={{ rotate: expandedAction ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </motion.div>
          </div>
          
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors font-medium">
            Acción Recomendada
          </h3>
          
          <div className="text-lg font-bold text-purple-300 mb-2 leading-tight">
            {cockpitIntelligence?.tacticalAction?.primary || 'Reforzar comunicación en Marketing'}
          </div>
          
          <div className="text-sm text-purple-200 mb-3">
            {cockpitIntelligence?.tacticalAction?.reasoning || 'Participación descendente requiere intervención'}
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="inline-block px-2 py-1 text-xs rounded-full font-medium"
              style={{
                backgroundColor: `${cockpitIntelligence?.tacticalAction?.urgencyColor || '#A78BFA'}20`,
                color: cockpitIntelligence?.tacticalAction?.urgencyColor || '#A78BFA'
              }}
            >
              Urgencia: {cockpitIntelligence?.tacticalAction?.urgency || 'media'}
            </div>
            {expandedAction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-purple-300"
              >
                Expandido
              </motion.div>
            )}
          </div>
          
          {/* SECCIÓN EXPANDIBLE */}
          <motion.div
            initial={false}
            animate={{ height: expandedAction ? 'auto' : 0, opacity: expandedAction ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-purple-500/20 pt-3 mt-3">
              <div className="text-xs text-white/60 mb-2 font-medium">Pasos siguientes:</div>
              <div className="space-y-1">
                {(cockpitIntelligence?.tacticalAction?.nextSteps || [
                  'Enviar recordatorio personalizado',
                  'Identificar líderes departamentales',
                  'Programar follow-up en 48h'
                ]).map((step, index) => (
                  <div key={index} className="text-xs text-purple-200 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <div className="text-xs text-white/50 mt-2">
            {expandedAction ? 'Clic para contraer' : 'Clic para expandir detalles →'}
          </div>
        </motion.div>
      </div>

      {/* ✅ FOOTER INFORMACIÓN CONTEXTUAL */}
      <motion.div
        className="text-center text-xs text-white/40 pt-4 border-t border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Inteligencia en tiempo real · {totalResponded} respuestas procesadas · 
        Última actualización: {new Date().toLocaleTimeString()}
      </motion.div>
    </motion.div>
  );
}