// ====================================================================
// ONBOARDING TABS TOGGLE - RESPONSIVE MOBILE + DESKTOP
// src/components/onboarding/OnboardingTabsToggle.tsx
// 🎯 FILOSOFÍA: Estilo Tesla/Apple con soporte móvil completo
// ====================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Trophy, BarChart3, AlertCircle } from 'lucide-react';

interface OnboardingTabsToggleProps {
  activeTab: 'resumen' | 'ranking' | 'alertas' | 'diagnostic';
  onTabChange: (tab: 'resumen' | 'ranking' | 'alertas' | 'diagnostic') => void;
   isTransitioning?: boolean;  // ← AGREGAR ESTA LÍNEA SI FALTA
}

type TabConfig = {
  value: 'resumen' | 'ranking' | 'alertas' | 'diagnostic';
  label: string;
  icon: React.ElementType;
  color: 'cyan' | 'purple';
};



const TABS: TabConfig[] = [
  { value: 'resumen', label: 'Resumen', icon: FileText, color: 'cyan' },
  { value: 'ranking', label: 'Ranking Gerencias', icon: Trophy, color: 'cyan' },
  { value: 'alertas', label: 'Alertas Críticas', icon: AlertCircle, color: 'purple' },
  { value: 'diagnostic', label: 'Diagnóstico 4C', icon: BarChart3, color: 'purple' }
];

export default function OnboardingTabsToggle({ 
  activeTab, 
  onTabChange, 
  isTransitioning = false 
}: OnboardingTabsToggleProps) {
  
  // Calcular posición del slider según tab activo
  const getSliderPosition = () => {
    const index = TABS.findIndex(tab => tab.value === activeTab);
    // Mobile: 80px tabs, Desktop: 170px tabs (proporcional)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const tabWidth = isMobile ? 80 : 170;
    const gap = 4;
    return (tabWidth + gap) * index + 2;
  };

  // Determinar color del slider según tab activo
  const getSliderGradient = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    return activeConfig?.color === 'cyan'
      ? 'linear-gradient(135deg, #22D3EE, #0891B2)'
      : 'linear-gradient(135deg, #A78BFA, #8B5CF6)';
  };

  const getSliderShadow = () => {
    const activeConfig = TABS.find(tab => tab.value === activeTab);
    return activeConfig?.color === 'cyan'
      ? '0 2px 8px rgba(34, 211, 238, 0.3)'
      : '0 2px 8px rgba(167, 139, 250, 0.3)';
  };

  return (
    <div className="w-full flex justify-center mb-8 px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden w-full max-w-[340px] sm:max-w-[700px]"
        style={{
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
        {/* LÍNEA SUPERIOR LUMINOSA TESLA */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)'
          }}
        />

        {/* SLIDER INDICATOR CON GRADIENTE DINÁMICO */}
        <motion.div
          className="absolute top-1 rounded-xl h-10 flex items-center justify-center w-[80px] sm:w-[170px]"
          style={{
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

        {/* TABS BUTTONS - RESPONSIVE */}
        <div className="absolute inset-0 flex items-center p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                disabled={isTransitioning}
                className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl transition-all duration-200 w-[80px] sm:w-[170px] text-[10px] sm:text-xs"
                style={{
                  height: '40px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500',
                  color: isActive 
                    ? 'rgba(15, 23, 42, 0.95)' 
                    : 'rgba(148, 163, 184, 0.7)',
                  cursor: isTransitioning ? 'not-allowed' : 'pointer'
                }}
                aria-label={`Ver ${tab.label}`}
              >
                <Icon 
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" 
                  style={{
                    color: isActive 
                      ? 'rgba(15, 23, 42, 0.95)' 
                      : 'rgba(148, 163, 184, 0.5)'
                  }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* GLOW EFFECTS SUTILES EN EXTREMOS */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.05), transparent)'
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{
            background: 'linear-gradient(270deg, rgba(167, 139, 250, 0.05), transparent)'
          }}
        />
      </motion.div>
    </div>
  );
}

// Named export para compatibilidad
export { OnboardingTabsToggle };