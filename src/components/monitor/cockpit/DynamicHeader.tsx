// ====================================================================
// DYNAMIC HEADER - VERSIÓN LIMPIA TESLA/APPLE LEVEL
// src/components/monitor/cockpit/DynamicHeader.tsx
// 🎯 PRINCIPIO: Elegancia a través de microanimaciones sutiles + datos reales
// ====================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, AlertTriangle, Users, Target, Clock } from 'lucide-react';
import { 
  ProgressCircle, 
  SparkAreaChart,
  Metric,
  Text
} from '@tremor/react';

// 🎯 INTERFACE PROPS - DEL HOOK useCampaignMonitor
interface DynamicHeaderProps {
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  lastActivity: string;
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
  byDepartment?: Record<string, {
    invited: number;
    responded: number;
    rate: number;
  }>;
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
      methodology: string;
      confidenceText: string;
    };
    action: {
      primary: string;
      reasoning: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
      nextSteps: string[];
      urgencyColor: string;
    };
    pattern: {
      dominantPattern: string;
      description: string;
      insights: string[];
      patternColor: string;
    };
    tacticalAction?: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
      timeline?: string;
    };
  };
  onNavigate?: (section: string) => void;
}

// 🎯 COMPONENTE DINÁMICO - ELEGANCIA SUTIL
export function DynamicHeader({
  participationRate,
  daysRemaining,
  totalInvited,
  totalResponded,
  lastActivity,
  topMovers,
  negativeAnomalies,
  byDepartment,
  cockpitIntelligence,
  onNavigate
}: DynamicHeaderProps) {

  // ✅ DATOS REALES DEL HOOK
  const campeón = topMovers && topMovers.length > 0 ? {
    name: topMovers[0].name,
    momentum: topMovers[0].momentum,
    trend: topMovers[0].trend
  } : null;

  const focoRiesgo = negativeAnomalies && negativeAnomalies.length > 0 ? {
    department: negativeAnomalies[0].department,
    participation: negativeAnomalies[0].rate,
    benchmark: participationRate,
    severity: negativeAnomalies[0].severity === 'high' ? 'crítica' : 'media',
    zScore: negativeAnomalies[0].zScore
  } : null;

  // ✅ ESTADÍSTICAS REALES
  const completados = topMovers ? topMovers.filter(m => m.trend === 'completado').length : 0;
  const acelerando = topMovers ? topMovers.filter(m => m.trend === 'acelerando').length : 0;
  const enRiesgo = negativeAnomalies ? negativeAnomalies.length : 0;
  
  // ✅ ACCIÓN TÁCTICA REAL
  const acciónTáctica = {
    title: cockpitIntelligence?.tacticalAction?.primary || 
           cockpitIntelligence?.action?.primary || 
           'Analizar departamentos críticos',
    description: cockpitIntelligence?.tacticalAction?.reasoning ||
                cockpitIntelligence?.action?.reasoning ||
                'Revisar participación baja y tendencias negativas',
    urgency: cockpitIntelligence?.tacticalAction?.urgency ||
             cockpitIntelligence?.action?.urgency ||
             'media'
  };

  // ✅ VERIFICAR SI HAY ACTIVIDAD RECIENTE REAL
  const isRecentActivity = lastActivity && 
    (lastActivity.includes('minutos') || lastActivity.includes('hace 1 hora'));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full"
    >
      {/* ✅ LAYOUT HORIZONTAL 4 CARDS - MISMO QUE PREDICTIVEVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '280px' }}>
        
        {/* CARD 1: DEPARTAMENTO LÍDER */}
        <motion.div
          className="relative p-6 cursor-pointer"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '16px'
          }}
          onClick={() => onNavigate?.('departamento-lider')}
          whileHover={{ 
            scale: 1.02,
            y: -4,
            borderColor: 'rgba(16, 185, 129, 0.5)',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Header elegante */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-green-400">
                Departamento Líder
              </h3>
            </div>
            {/* Indicador de actividad reciente REAL */}
            {isRecentActivity && campeón?.trend === 'acelerando' && (
              <motion.div
                className="w-2 h-2 rounded-full bg-green-400"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>

          {campeón ? (
            <>
              {/* Título principal */}
              <div className="text-4xl font-bold text-green-300 mb-2">
                {campeón.name}
              </div>
              
              <div className="text-sm text-green-400 mb-3 flex items-center gap-2">
                {/* Contador animado SOLO si hay cambio real */}
                <motion.span
                  key={campeón.momentum} // Re-anima solo cuando cambia
                  initial={{ scale: 1.05, color: '#22D3EE' }}
                  animate={{ scale: 1, color: '#10B981' }}
                  transition={{ duration: 0.3 }}
                  className="font-semibold"
                >
                  {campeón.momentum}%
                </motion.span>
                <span>participación</span>
                
                {/* Badge SOLO si over-performance real */}
                {campeón.momentum > 150 && (
                  <motion.span
                    className="px-2 py-1 text-xs bg-green-500/20 border border-green-500/30 rounded-full text-green-300"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    🚀 {campeón.momentum}%
                  </motion.span>
                )}
              </div>
              
              {/* Gauge central */}
              <div className="flex justify-center mb-4">
                <ProgressCircle 
                  value={Math.min(campeón.momentum, 100)} 
                  size="md"
                  color="emerald"
                >
                  <Text className="text-xs text-white font-medium">
                    {campeón.momentum}%
                  </Text>
                </ProgressCircle>
              </div>
              
              {/* Status con mini progress real */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-300 capitalize flex items-center gap-2">
                  {/* Mini progress bar basado en momentum real */}
                  <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-400 rounded-full"
                      animate={{ width: `${Math.min(campeón.momentum, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  <span>{campeón.trend}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Text className="text-gray-400 text-sm">Sin datos disponibles</Text>
            </div>
          )}
        </motion.div>

        {/* CARD 2: FOCO DE RIESGO */}
        <motion.div
          className="relative p-6 cursor-pointer"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: `1px solid ${focoRiesgo?.severity === 'crítica' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(71, 85, 105, 0.3)'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '16px'
          }}
          onClick={() => onNavigate?.('foco-riesgo')}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Pulso sutil SOLO si severity crítica */}
          {focoRiesgo?.severity === 'crítica' && (
            <motion.div
              className="absolute inset-0 rounded-2xl border border-red-500/30"
              animate={{ 
                borderColor: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.2)']
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">
                Foco de Riesgo
              </h3>
            </div>
          </div>

          {focoRiesgo ? (
            <>
              <div className="text-4xl font-bold text-red-300 mb-2">
                {focoRiesgo.department}
              </div>
              <div className="text-sm text-red-400 mb-3">
                {focoRiesgo.participation}% vs {focoRiesgo.benchmark.toFixed(1)}% esperado
              </div>
              
              {/* Sparkline SOLO si hay datos zScore reales */}
              {focoRiesgo.zScore && (
                <div className="mb-4">
                  <SparkAreaChart
                    data={[
                      { day: 'Benchmark', valor: 0 },
                      { day: 'Actual', valor: focoRiesgo.zScore }
                    ]}
                    categories={['valor']}
                    index="day"
                    colors={['red']}
                    className="h-8 w-full"
                  />
                </div>
              )}
              
              <div className="text-xs text-red-300">
                Severidad: {focoRiesgo.severity}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Text className="text-gray-400 text-sm">Sin anomalías detectadas</Text>
            </div>
          )}
        </motion.div>

        {/* CARD 3: PANORAMA GLOBAL */}
        <motion.div
          className="relative p-6 cursor-pointer"
          style={{
            background: 'rgba(22, 78, 99, 0.8)', // Color especial como PredictiveView
            border: '1px solid rgba(34, 211, 238, 0.4)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(34, 211, 238, 0.15)',
            borderRadius: '16px'
          }}
          onClick={() => onNavigate?.('panorama-organizacional')}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-400">
                Panorama Global
              </h3>
            </div>
          </div>

          <div className="text-4xl font-bold text-cyan-300 mb-2">
            {cockpitIntelligence?.pattern?.dominantPattern || 'Progreso Variable'}
          </div>
          <div className="text-sm text-cyan-400 mb-3">
            {Object.keys(byDepartment || {}).length || topMovers?.length || 0} departamentos
          </div>
          
          {/* Progress bar basado en participación real */}
          <div className="mb-4">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300"
                animate={{ width: `${participationRate}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="text-xs text-cyan-300">
            {completados} completados • {acelerando} acelerando • {enRiesgo} en riesgo
          </div>
        </motion.div>

        {/* CARD 4: ACCIÓN RECOMENDADA */}
        <motion.div
          className="relative p-6 cursor-pointer"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '16px'
          }}
          onClick={() => onNavigate?.('accion-recomendada')}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Glow sutil SOLO si urgencia alta/crítica */}
          {(acciónTáctica.urgency === 'crítica' || acciónTáctica.urgency === 'alta') && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(167, 139, 250, 0.2)',
                  '0 0 20px rgba(167, 139, 250, 0.4)',
                  '0 0 10px rgba(167, 139, 250, 0.2)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-purple-400">
                Acción Recomendada
              </h3>
            </div>
            {daysRemaining > 0 && (
              <div className="flex items-center gap-1 text-xs text-purple-300">
                <Clock className="w-3 h-3" />
                {daysRemaining}d
              </div>
            )}
          </div>

          <div className="text-2xl font-bold text-green-400 mb-2 leading-tight">
            {acciónTáctica.title}
          </div>
          <div className="text-sm text-green-300 mb-3 leading-tight">
            {acciónTáctica.description.slice(0, 60)}...
          </div>
          
          {/* Línea característica PredictiveView */}
          <div className="w-full h-1 bg-red-500 rounded-full opacity-80 mb-3"></div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-purple-300">
              Urgencia: {acciónTáctica.urgency}
            </div>
            <div className="text-xs text-purple-200">
              Ejecutar HOY
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}