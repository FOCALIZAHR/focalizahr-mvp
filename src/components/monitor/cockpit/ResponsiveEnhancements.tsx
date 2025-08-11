// ====================================================================
// FOCALIZAHR RESPONSIVE ENHANCEMENTS - MOBILE-FIRST OPTIMIZATION
// src/components/monitor/cockpit/ResponsiveEnhancements.tsx
// VERSIÓN CORREGIDA: Hook unificado + animaciones completas
// ====================================================================

"use client";

import { useState, useEffect } from 'react';

// 🎯 HOOK UNIFICADO PARA DETECCIÓN DE DISPOSITIVO - VERSIÓN CORREGIDA
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}

// 🎯 CONFIGURACIÓN ANIMACIONES COMPLETA CON VARIANTES - VERSIÓN CORREGIDA
export function getDeviceAnimationConfig(deviceType: 'mobile' | 'tablet' | 'desktop') {
  const baseCardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const configs = {
    mobile: {
      container: {
        transition: { staggerChildren: 0.1 }
      },
      card: { ...baseCardVariants, transition: { duration: 0.3 } }
    },
    tablet: {
      container: {
        transition: { staggerChildren: 0.15 }
      },
      card: { ...baseCardVariants, transition: { duration: 0.4, type: "spring", damping: 20 } }
    },
    desktop: {
      container: {
        transition: { staggerChildren: 0.15 }
      },
      card: { ...baseCardVariants, transition: { duration: 0.5, type: "spring", damping: 25 } }
    }
  };

  return configs[deviceType] || configs['desktop']; // Fallback a desktop
}

// 🎨 CLASSES RESPONSIVAS DINÁMICAS
export function getResponsiveClasses(deviceType: 'mobile' | 'tablet' | 'desktop') {
  const classes = {
    mobile: {
      container: 'px-4 py-6',
      grid: 'grid-cols-1 gap-4',
      text: {
        title: 'text-lg',
        subtitle: 'text-sm',
        metric: 'text-2xl'
      },
      spacing: 'space-y-4',
      padding: 'p-4'
    },
    tablet: {
      container: 'px-6 py-8', 
      grid: 'grid-cols-2 gap-6',
      text: {
        title: 'text-xl',
        subtitle: 'text-sm',
        metric: 'text-3xl'
      },
      spacing: 'space-y-6',
      padding: 'p-6'
    },
    desktop: {
      container: 'px-6 py-8',
      grid: 'grid-cols-4 gap-6', // 4 columnas para desktop
      text: {
        title: 'text-xl',
        subtitle: 'text-sm', 
        metric: 'text-4xl'
      },
      spacing: 'space-y-8',
      padding: 'p-6'
    }
  };

  return classes[deviceType];
}

// 📊 CONFIGURACIÓN VISTA MÓVIL OPTIMIZADA
export function getMobileViewConfig(deviceType: 'mobile' | 'tablet' | 'desktop') {
  return {
    mobile: {
      // Vista predictiva compacta
      predictive: {
        showAllModules: false,
        priorityModules: ['nucleo-predictivo', 'punto-partida'],
        layout: 'vertical'
      },
      // Vista dinámica simplificada
      dynamic: {
        showAllPanels: false,
        priorityPanels: ['champion-momentum', 'risk-focus'],
        layout: 'stacked'
      },
      // Toggle simplificado
      toggle: {
        showSubtitles: false,
        compactMode: true
      }
    },
    tablet: {
      predictive: {
        showAllModules: true,
        layout: 'grid-2x2'
      },
      dynamic: {
        showAllPanels: true,
        layout: 'grid-vertical'
      },
      toggle: {
        showSubtitles: true,
        compactMode: false
      }
    },
    desktop: {
      predictive: {
        showAllModules: true,
        layout: 'grid-horizontal'
      },
      dynamic: {
        showAllPanels: true,
        layout: 'grid-horizontal'
      },
      toggle: {
        showSubtitles: true,
        compactMode: false
      }
    }
  }[deviceType];
}

// 🎯 COMPONENTE OPTIMIZACIÓN TOUCH SIMPLIFICADO
interface TouchOptimizationProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TouchOptimization({ children, isActive }: TouchOptimizationProps) {
  if (!isActive) return <>{children}</>;

  return (
    <div 
      className="touch-pan-y select-none"
      style={{
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'rgba(0,0,0,0)'
      }}
    >
      {children}
    </div>
  );
}

// 📱 COMPONENTE INDICADOR RESPONSIVE
export function ResponsiveIndicator() {
  const deviceType = useDeviceType();
  
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
      {deviceType}
    </div>
  );
}