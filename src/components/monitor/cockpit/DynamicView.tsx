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
    };
  };
  
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
    tipo: topMovers.length > 2 ? 'Respuesta Variable por Área' : 'Tendencia Uniforme',
    departamentos: topMovers.length,
    insights: [`${topMovers.length} departamentos en análisis`, 'Participación por departamento']
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* 🏆 CARD 1: DEPARTAMENTO LÍDER CON TOOLTIP EDUCATIVO */}
      <MomentumTooltip
        title="¿Qué es Departamento Líder?"
        explanation="Equipo con mayor velocidad de respuesta y engagement organizacional"
        calculation={`${campeón?.momentum || 0} pts = Velocidad respuesta + Completitud + Consistencia temporal`}
        insights={[
          `Líder organizacional: ${campeón?.name || 'Esperando datos'}`,
          `Velocidad: ${campeón?.trend || 'Analizando'} (${campeón?.momentum || 0} puntos)`,
          `Metodología replicable: Analizar sus mejores prácticas`
        ]}
        position="bottom-left"
      >
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
          onClick={() => onNavigate?.('momentum')}
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
          <div className="text-2xl font-bold text-green-300 mb-2">
            {campeón ? campeón.name : 'Sin datos suficientes'}
          </div>
          <div className="text-sm text-green-200 mb-1">
            {campeón ? `${campeón.momentum}%` : 'Esperando actividad'} ritmo de respuesta superior
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
            {campeón ? (
              <>
                <div>Participación completa vs benchmark organizacional</div>
                <div className="text-green-300 mt-1">
                  Replicar metodología en otras áreas
                </div>
              </>
            ) : 'Análisis disponible con más datos'}
          </div>
        </motion.div>
      </MomentumTooltip>

      {/* ⚠️ CARD 2: ATENCIÓN REQUERIDA CON SPARKLINE Y TOOLTIP EXPLICATIVO */}
      <TooltipContext
        variant="success"
        title="Estado Organizacional Excelente"
        explanation="Todas las áreas presentan participación satisfactoria sin desviaciones críticas"
        details={[
          'No se detectaron departamentos en riesgo',
          'Participación equilibrada en toda la organización', 
          'Metodología de engagement efectiva aplicada'
        ]}
        actionable="✅ Continuar con estrategia actual - resultados optimizados"
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
            Atención Requerida {daysRemaining <= 3 ? 'INMEDIATA' : daysRemaining <= 7 ? 'ALTA' : 'PRIORITARIA'}
          </h3>
          <div className="text-2xl font-bold text-red-300 mb-2">
            {focoRiesgo ? focoRiesgo.department : '✅ Sin riesgos detectados'}
          </div>
          <div className="text-sm text-red-200 mb-1">
            {focoRiesgo ? (
              byDepartment[focoRiesgo.department] ? 
                `${byDepartment[focoRiesgo.department].responded} de ${byDepartment[focoRiesgo.department].invited} empleados (${focoRiesgo.rate}%)` :
                `${focoRiesgo.rate}% participación`
            ) : 'Todas las áreas normales'}
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
            {focoRiesgo ? (
              <>
                <div>Intervención inmediata requerida</div>
                <div className="text-orange-200 mt-1">
                  {daysRemaining <= 3 ? 'Intervención inmediata requerida' : 
                   daysRemaining <= 7 ? 'Acción prioritaria esta semana' : 
                   'Seguimiento recomendado'}
                </div>
              </>
            ) : 'Todas las métricas en rango normal'}
          </div>
        </motion.div>
      </TooltipContext>

      {/* 🎯 CARD 3: PANORAMA ORGANIZACIONAL */}
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
        <div className="text-2xl font-bold text-blue-300 mb-2">
          {totalResponded} de {totalInvited} empleados ({participationRate}%)
        </div>
        <div className="text-sm text-blue-200 mb-1">
          {participationRate < 50 ? 'Participación baja detectada' : participationRate >= 70 ? 'Participación satisfactoria' : 'Participación moderada'}
        </div>
        <div className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full mb-3">
          Participación por departamento
        </div>
        
        {/* 🔧 NUEVO: DONUT CHART DISTRIBUCIÓN DEPARTAMENTAL */}
        {momentumGaugeData.length > 0 && (
          <div className="h-16 w-full mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={momentumGaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {momentumGaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="text-xs text-white/60">
          {totalResponded} de {totalInvited} empleados total organización ({participationRate}%)
        </div>
        <div className="text-xs text-blue-300 mt-1">
          {daysRemaining > 0 ? `Termina en ${daysRemaining} días` : 'Campaña finalizada'}
        </div>
      </motion.div>

      {/* ⚡ CARD 4: ACCIÓN RECOMENDADA NUEVA */}
      <motion.div
        className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
        style={{
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: '12px',
          padding: '24px'
        }}
        onClick={() => onNavigate?.('action')}
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
          {cockpitIntelligence?.tacticalAction?.primary || 'Analizando recomendación...'}
        </div>
        <div className="text-sm text-purple-200 mb-1">
          Prioridad: {cockpitIntelligence?.tacticalAction?.urgency || 'Media'}
        </div>
        <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
          cockpitIntelligence?.tacticalAction?.urgencyColor === 'green' ? 'bg-green-500/20 text-green-300' :
          cockpitIntelligence?.tacticalAction?.urgencyColor === 'red' ? 'bg-red-500/20 text-red-300' :
          'bg-purple-500/20 text-purple-300'
        }`}>
          {cockpitIntelligence?.tacticalAction?.timeline || 'Evaluando...'}
        </div>
        
        {/* 🔧 NUEVO: BARRA HORIZONTAL INDICADOR URGENCIA */}
        <div className="w-full bg-white/10 rounded-full h-2 mt-3 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              daysRemaining <= 3 ? 'bg-red-400 w-full' : 
              daysRemaining <= 7 ? 'bg-purple-400 w-3/4' : 
              'bg-purple-300 w-1/2'
            }`}
          ></div>
        </div>
        
        <div className="text-xs text-white/60">
          {cockpitIntelligence?.tacticalAction?.reasoning || 'Evaluando contexto organizacional...'}
        </div>
        <div className="text-xs text-purple-300 mt-1">
          {participationRate >= 100 ? 'Campaña exitosa completada' :
           participationRate < 50 ? 'Participación requiere atención' : 'Participación estable'}
        </div>
      </motion.div>
    </div>
  );
}