// src/components/onboarding/HeroAlertStatus.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';

interface HeroAlertStatusProps {
  criticalCount: number;
  highCount: number;
  totalAtRisk: number;
  potentialLossCLP: number;
  totalAlerts: number;
}

export const HeroAlertStatus: React.FC<HeroAlertStatusProps> = ({
  criticalCount,
  highCount,
  totalAtRisk,
  potentialLossCLP,
  totalAlerts
}) => {
  
  // ========================================
  // LÓGICA: Determinar estado general
  // ========================================
  const hasCritical = criticalCount > 0;
  const hasHigh = highCount > 0;
  const isHealthy = totalAlerts === 0;
  
  // ========================================
  // RENDER: Estado Saludable
  // ========================================
  if (isHealthy) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-16 overflow-hidden"
      >
        {/* Background Glow Verde */}
        <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent blur-3xl" />
        
        <div className="relative fhr-glass border border-green-500/20 rounded-2xl p-12 text-center">
          {/* Icono Hero */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl"
          >
            <CheckCircle className="h-12 w-12 text-green-400" strokeWidth={1.5} />
          </motion.div>
          
          {/* Título Principal */}
          <h1 className="text-5xl md:text-6xl font-light text-white mb-4">
            Todo Bajo Control
          </h1>
          
          {/* Subtítulo */}
          <p className="text-xl text-slate-300 mb-8">
            0 alertas críticas activas
          </p>
          
          {/* Stat Line */}
          <div className="flex items-center justify-center gap-2 text-green-400">
            <TrendingUp className="h-5 w-5" />
            <span className="text-lg font-medium">
              Todos los colaboradores en proceso saludable
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // ========================================
  // RENDER: Estado Crítico
  // ========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-16 overflow-hidden"
    >
      {/* Background Glow Rojo/Amarillo */}
      <div className={`absolute inset-0 blur-3xl ${
        hasCritical 
          ? 'bg-gradient-radial from-red-500/15 via-orange-500/10 to-transparent'
          : 'bg-gradient-radial from-yellow-500/15 via-amber-500/10 to-transparent'
      }`} />
      
      <div className={`relative fhr-glass rounded-2xl p-12 ${
        hasCritical 
          ? 'border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
          : 'border border-yellow-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
      }`}>
        
        {/* Layout Responsive: Icono + Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
          
          {/* Icono Hero */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full backdrop-blur-xl ${
              hasCritical
                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
                : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20'
            }`}
          >
            <AlertTriangle 
              className={hasCritical ? 'h-16 w-16 text-red-400' : 'h-16 w-16 text-yellow-400'} 
              strokeWidth={1.5} 
            />
          </motion.div>
          
          {/* Contenido Principal */}
          <div className="text-center lg:text-left">
            
            {/* Título Dramático */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-6xl font-light text-white mb-2">
                {hasCritical ? (
                  <>
                    <span className="text-red-400 font-medium">{criticalCount}</span>
                    <span className="text-white"> {criticalCount === 1 ? 'Riesgo Crítico' : 'Riesgos Críticos'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-400 font-medium">{highCount}</span>
                    <span className="text-white"> {highCount === 1 ? 'Alerta de Alta Prioridad' : 'Alertas de Alta Prioridad'}</span>
                  </>
                )}
              </h1>
              
              {/* Subtítulo Contextual */}
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                {totalAtRisk > 0 && (
                  <>
                    <span className="font-medium text-white">{totalAtRisk}</span> colaborador{totalAtRisk !== 1 ? 'es' : ''} {' '}
                    {hasCritical ? 'podrían renunciar esta semana' : 'requieren atención'}
                  </>
                )}
                {totalAtRisk === 0 && 'Requieren atención inmediata'}
              </p>
            </motion.div>
            
            {/* KPIs Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* KPI: Pérdida Potencial */}
              {potentialLossCLP > 0 && (
                <div className="fhr-glass border border-slate-700/50 rounded-xl p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      Pérdida Potencial
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-red-400">
                    ${(potentialLossCLP / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    CLP en riesgo
                  </p>
                </div>
              )}
              
              {/* KPI: Colaboradores en Riesgo */}
              {totalAtRisk > 0 && (
                <div className="fhr-glass border border-slate-700/50 rounded-xl p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Users className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      En Riesgo
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-amber-400">
                    {totalAtRisk}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Colaborador{totalAtRisk !== 1 ? 'es' : ''} afectado{totalAtRisk !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              
              {/* KPI: Total Alertas */}
              <div className="fhr-glass border border-slate-700/50 rounded-xl p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">
                    Alertas Activas
                  </span>
                </div>
                <p className="text-3xl font-bold text-cyan-400">
                  {totalAlerts}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Caso{totalAlerts !== 1 ? 's' : ''} de negocio
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};