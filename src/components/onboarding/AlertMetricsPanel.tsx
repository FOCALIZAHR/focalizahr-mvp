// src/components/onboarding/AlertMetricsPanel.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, BarChart3 } from 'lucide-react';

interface AlertMetricsPanelProps {
  metrics: {
    totalAlerts: number;
    totalJourneys: number;
    alertRate: number;
    topDepartments: Array<{ name: string; count: number }>;
    severityDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    slaDistribution: {
      on_time: number;
      at_risk: number;
      violated: number;
    };
  };
}

export const AlertMetricsPanel: React.FC<AlertMetricsPanelProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* MÉTRICA 1: Total Alertas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="fhr-card border-l-4 border-l-red-400"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Total Alertas</p>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {metrics.totalAlerts}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">De {metrics.totalJourneys} journeys</span>
        </div>
      </motion.div>
      
      {/* MÉTRICA 2: % Alertas vs Journeys */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fhr-card border-l-4 border-l-orange-400"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Tasa de Alertas</p>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {metrics.alertRate}%
        </p>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-orange-400" />
          <span className="text-slate-500">vs Total Journeys</span>
        </div>
      </motion.div>
      
      {/* MÉTRICA 3: Críticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fhr-card border-l-4 border-l-cyan-400"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Alertas Críticas</p>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {metrics.severityDistribution.critical}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-red-400 font-medium">
            {metrics.severityDistribution.high} High
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-yellow-400">
            {metrics.severityDistribution.medium} Medium
          </span>
        </div>
      </motion.div>
      
      {/* MÉTRICA 4: SLA Violado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fhr-card border-l-4 border-l-purple-400"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">SLA Status</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Violado</span>
            <span className="text-sm font-bold text-red-400">
              {metrics.slaDistribution.violated}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">En Riesgo</span>
            <span className="text-sm font-bold text-yellow-400">
              {metrics.slaDistribution.at_risk}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">A Tiempo</span>
            <span className="text-sm font-bold text-green-400">
              {metrics.slaDistribution.on_time}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* TOP DEPARTAMENTOS - Full Width */}
      {metrics.topDepartments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fhr-card md:col-span-2 lg:col-span-4"
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Top 3 Departamentos con Más Alertas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.topDepartments.map((dept, index) => (
              <div 
                key={dept.name}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">#{index + 1}</span>
                  <span className="text-2xl font-bold text-cyan-400">
                    {dept.count}
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium truncate">
                  {dept.name}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};