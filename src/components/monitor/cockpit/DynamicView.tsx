// ====================================================================
// DYNAMIC VIEW - COMPONENTE 100% TONTO FINAL
// src/components/monitor/cockpit/DynamicView.tsx
// RESPONSABILIDAD: Solo presentación de datos pre-calculados del hook
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Eye, AlertTriangle, Activity, Target } from 'lucide-react';

interface DynamicViewProps {
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: string;
  }>;
  negativeAnomalies: Array<{
    department: string;
    rate: number;
    severity: string;
  }>;
  
  cockpitIntelligence?: {
    action: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
    };
    pattern: {
      dominantPattern: string;
      description: string;
    };
  };
  
  onNavigate?: (section: string) => void;
  isLoading: boolean;
}

export function DynamicView({ 
  participationRate,
  daysRemaining,
  totalInvited, 
  totalResponded,
  topMovers,
  negativeAnomalies,
  cockpitIntelligence,
  onNavigate,
  isLoading 
}: DynamicViewProps) {
  
  if (isLoading) {
    return <div className="w-full animate-pulse fhr-card h-32"></div>;
  }

  // ✅ USAR SOLO DATOS DEL HOOK - SIN CÁLCULOS
  const leader = topMovers[0] || null;
  const risk = negativeAnomalies[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: DEPARTAMENTO LÍDER */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Departamento Líder</h3>
            <Eye className="h-5 w-5 text-green-400" />
          </div>
          
          {leader ? (
            <>
              <div className="fhr-title-gradient text-xl font-bold mb-2">
                {leader.name}
              </div>
              <div className="text-lg text-white mb-2">
                {leader.momentum}% participación
              </div>
              <div className="fhr-badge-completed text-xs mb-2">
                {leader.trend}
              </div>
              <div className="text-sm text-white/70">
                Metodología replicable
              </div>
            </>
          ) : (
            <div className="text-white/60">Sin datos disponibles</div>
          )}
        </div>

        {/* CARD 2: ATENCIÓN REQUERIDA */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Atención Requerida</h3>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          
          {risk ? (
            <>
              <div className="text-xl font-bold text-red-400 mb-2">
                {risk.department}
              </div>
              <div className="text-lg text-white mb-2">
                {risk.rate}% participación
              </div>
              <div className="fhr-badge-warning text-xs mb-2">
                {risk.severity === 'high' ? 'Crítico' : 'Moderado'}
              </div>
              <div className="text-sm text-white/70">
                Intervención requerida
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-green-400 mb-2">
                ✅ Sin riesgos
              </div>
              <div className="text-lg text-white/70 mb-2">
                Todas las áreas normales
              </div>
              <div className="fhr-badge-completed text-xs">
                Estado óptimo
              </div>
            </>
          )}
        </div>

        {/* CARD 3: PANORAMA */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Panorama</h3>
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
          <div className="fhr-title-gradient text-xl font-bold mb-2">
            {totalResponded}/{totalInvited}
          </div>
          <div className="text-lg text-white mb-2">
            {participationRate.toFixed(0)}% total
          </div>
          <div className="text-sm text-white/70">
            {cockpitIntelligence?.pattern?.dominantPattern || 'Análisis en progreso'}
          </div>
        </div>

        {/* CARD 4: ACCIÓN */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Acción</h3>
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mb-2">
            {cockpitIntelligence?.action?.primary || 'Mantener monitoreo'}
          </div>
          <div className="text-sm text-white/70 mb-2">
            {cockpitIntelligence?.action?.reasoning || 'Seguimiento regular'}
          </div>
          <div className={`text-sm ${cockpitIntelligence?.action?.urgencyColor || 'text-cyan-400'}`}>
            {cockpitIntelligence?.action?.urgency || 'Media'}
          </div>
          
          {onNavigate && (
            <button
              onClick={() => onNavigate('action-buttons')}
              className="fhr-btn-primary w-full mt-3 text-sm"
            >
              Ejecutar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}