// src/components/exit/ExitAlertsTabsToggle.tsx
// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tabs Toggle Estilo Tesla/Apple - EXIT INTELLIGENCE
// ════════════════════════════════════════════════════════════════════════════
// RÉPLICA EXACTA del patrón AlertsTabsToggle de Onboarding
// Filosofía FocalizaHR: Premium, slider animado, colores correctos
// ════════════════════════════════════════════════════════════════════════════

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, LayoutGrid } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface ExitAlertsTabsToggleProps {
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
  color: 'orange' | 'green' | 'cyan';
};

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE TABS
// ════════════════════════════════════════════════════════════════════════════

const TABS: TabConfig[] = [
  { value: 'active', label: 'Activas', icon: AlertTriangle, color: 'orange' },
  { value: 'managed', label: 'Gestionadas', icon: CheckCircle, color: 'green' },
  { value: 'all', label: 'Todas', icon: LayoutGrid, color: 'cyan' }
];

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function ExitAlertsTabsToggle({ 
  activeTab, 
  onTabChange,
  counts,
  isTransitioning = false 
}: ExitAlertsTabsToggleProps) {
  
  // Calcular posición del slider según tab activo
  const getSliderPosition = () => {
    const index = TABS.findIndex(tab => tab.value === activeTab);
    const tabWidth = 190;
    const gap = 4;
    return (tabWidth + gap) * index + 2;
  };

  // Determinar color del slider según tab activo
  const getSliderGradient = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    if (activeConfig?.color === 'orange') {
      return 'linear-gradient(135deg, #F97316, #EA580C)';
    } else if (activeConfig?.color === 'green') {
      return 'linear-gradient(135deg, #10B981, #059669)';
    } else {
      return 'linear-gradient(135deg, #22D3EE, #0891B2)';
    }
  };

  const getSliderShadow = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    if (activeConfig?.color === 'orange') {
      return '0 4px 15px rgba(249, 115, 22, 0.4)';
    } else if (activeConfig?.color === 'green') {
      return '0 4px 15px rgba(16, 185, 129, 0.4)';
    } else {
      return '0 4px 15px rgba(34, 211, 238, 0.4)';
    }
  };

  return (
    <div className="flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative inline-flex p-1 rounded-xl bg-slate-800/80 border border-slate-700/50"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {/* Slider animado */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg"
          initial={false}
          animate={{
            x: getSliderPosition(),
            background: getSliderGradient(),
            boxShadow: getSliderShadow()
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
          style={{
            width: 190,
            zIndex: 0
          }}
        />

        {/* Tabs */}
        <div className="relative flex gap-1 z-10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const count = counts[tab.value];
            
            return (
              <button
                key={tab.value}
                onClick={() => !isTransitioning && onTabChange(tab.value)}
                disabled={isTransitioning}
                className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200"
                style={{
                  width: 190,
                  color: isActive 
                    ? 'rgba(15, 23, 42, 0.95)' 
                    : 'rgba(148, 163, 184, 0.7)',
                  cursor: isTransitioning ? 'not-allowed' : 'pointer'
                }}
                aria-label={`Ver alertas ${tab.label}`}
              >
                <Icon 
                  className="h-4 w-4 flex-shrink-0" 
                  style={{
                    color: isActive 
                      ? 'rgba(15, 23, 42, 0.95)' 
                      : 'rgba(148, 163, 184, 0.5)'
                  }}
                />
                <span className="font-medium text-sm">
                  {tab.label}
                </span>
                
                {/* Badge con conteo */}
                <span 
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums"
                  style={{
                    background: isActive 
                      ? 'rgba(15, 23, 42, 0.2)' 
                      : 'rgba(51, 65, 85, 0.5)',
                    color: isActive 
                      ? 'rgba(15, 23, 42, 0.8)' 
                      : 'rgba(148, 163, 184, 0.8)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Glow effects sutiles */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none rounded-l-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.05), transparent)'
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none rounded-r-xl"
          style={{
            background: 'linear-gradient(270deg, rgba(34, 211, 238, 0.05), transparent)'
          }}
        />
      </motion.div>
    </div>
  );
}