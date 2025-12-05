// ====================================================================
// ALERTS TABS TOGGLE - DISEÑO TESLA/APPLE LEVEL
// src/components/onboarding/AlertsTabsToggle.tsx
// 🎯 FILOSOFÍA: Tab switcher premium para centro de comando de alertas
// ====================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, LayoutGrid } from 'lucide-react';

interface AlertsTabsToggleProps {
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  counts: {
    active: number;
    managed: number;
    all: number;
  };
  isTransitioning?: boolean;
}

type TabConfig = {
  value: 'active' | 'managed' | 'all';
  label: string;
  icon: React.ElementType;
  color: 'red' | 'green' | 'cyan';
};

const TABS: TabConfig[] = [
  { value: 'active', label: 'Activas', icon: AlertTriangle, color: 'red' },
  { value: 'managed', label: 'Gestionadas', icon: CheckCircle, color: 'green' },
  { value: 'all', label: 'Todas', icon: LayoutGrid, color: 'cyan' }
];

export default function AlertsTabsToggle({ 
  activeTab, 
  onTabChange,
  counts,
  isTransitioning = false 
}: AlertsTabsToggleProps) {
  
  // Calcular posición del slider según tab activo
  const getSliderPosition = () => {
    const index = TABS.findIndex(tab => tab.value === activeTab);
    const tabWidth = 190; // Ancho de cada tab
    const gap = 4; // Gap entre tabs
    return (tabWidth + gap) * index + 2; // +2 por el padding inicial
  };

  // Determinar color del slider según tab activo
  const getSliderGradient = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    if (activeConfig?.color === 'red') {
      return 'linear-gradient(135deg, #EF4444, #DC2626)';
    } else if (activeConfig?.color === 'green') {
      return 'linear-gradient(135deg, #10B981, #059669)';
    } else {
      return 'linear-gradient(135deg, #22D3EE, #0891B2)';
    }
  };

  const getSliderShadow = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    if (activeConfig?.color === 'red') {
      return '0 2px 8px rgba(239, 68, 68, 0.3)';
    } else if (activeConfig?.color === 'green') {
      return '0 2px 8px rgba(16, 185, 129, 0.3)';
    } else {
      return '0 2px 8px rgba(34, 211, 238, 0.3)';
    }
  };

  // Obtener color de la línea superior
  const getTopLineGradient = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    if (activeConfig?.color === 'red') {
      return 'linear-gradient(90deg, transparent, #EF4444, #DC2626, transparent)';
    } else if (activeConfig?.color === 'green') {
      return 'linear-gradient(90deg, transparent, #10B981, #059669, transparent)';
    } else {
      return 'linear-gradient(90deg, transparent, #22D3EE, #0891B2, transparent)';
    }
  };

  return (
    <div className="w-full flex justify-center mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: '600px',
          height: '48px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(34, 211, 238, 0.2)'
        }}
        whileHover={{ 
          borderColor: 'rgba(34, 211, 238, 0.4)',
          scale: 1.005
        }}
      >
        {/* LÍNEA SUPERIOR LUMINOSA DINÁMICA */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: getTopLineGradient()
          }}
        />

        {/* SLIDER INDICATOR CON GRADIENTE DINÁMICO */}
        <motion.div
          className="absolute top-1 rounded-xl h-10 flex items-center justify-center"
          style={{
            width: '190px',
            background: getSliderGradient(),
            boxShadow: getSliderShadow()
          }}
          animate={{
            x: getSliderPosition()
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
        />

        {/* TABS BUTTONS */}
        <div className="absolute inset-0 flex items-center p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const count = counts[tab.value];
            
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                disabled={isTransitioning}
                className="relative z-10 flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
                style={{
                  width: '190px',
                  height: '40px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: isActive 
                    ? 'rgba(15, 23, 42, 0.95)' 
                    : 'rgba(148, 163, 184, 0.7)',
                  cursor: isTransitioning ? 'not-allowed' : 'pointer'
                }}
                aria-label={`Ver alertas ${tab.label.toLowerCase()}`}
              >
                <Icon 
                  className="h-4 w-4" 
                  style={{
                    color: isActive 
                      ? 'rgba(15, 23, 42, 0.95)' 
                      : 'rgba(148, 163, 184, 0.5)'
                  }}
                />
                <span>{tab.label}</span>
                <span 
                  className="px-1.5 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: isActive 
                      ? 'rgba(15, 23, 42, 0.15)' 
                      : 'rgba(148, 163, 184, 0.1)',
                    color: isActive 
                      ? 'rgba(15, 23, 42, 0.7)' 
                      : 'rgba(148, 163, 184, 0.6)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* GLOW EFFECTS SUTILES EN EXTREMOS */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.05), transparent)'
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: 'linear-gradient(270deg, rgba(34, 211, 238, 0.05), transparent)'
          }}
        />
      </motion.div>
    </div>
  );
}

// Named export para compatibilidad
export { AlertsTabsToggle };