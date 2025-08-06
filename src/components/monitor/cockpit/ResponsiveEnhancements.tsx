// ====================================================================
// FOCALIZAHR RESPONSIVE ENHANCEMENTS - MOBILE-FIRST OPTIMIZATION
// src/components/monitor/cockpit/ResponsiveEnhancements.tsx
// Chat 4: Optimizations para diferentes dispositivos
// ====================================================================

"use client";

import { useState, useEffect } from 'react';

// 🎯 HOOK PARA DETECCIÓN DE DISPOSITIVO
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const isTouchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsTouchDevice(isTouchCapable);
      
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

  return { deviceType, isTouchDevice };
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
      grid: 'grid-cols-3 gap-6',
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

// 🎯 CONFIGURACIÓN ANIMACIONES POR DISPOSITIVO
export function getDeviceAnimationConfig(deviceType: 'mobile' | 'tablet' | 'desktop', isTouchDevice: boolean) {
  return {
    mobile: {
      staggerChildren: 0.1,
      duration: 0.3,
      enableHover: false,
      enableParticles: false,
      reduceMotion: true
    },
    tablet: {
      staggerChildren: 0.15,
      duration: 0.4,
      enableHover: !isTouchDevice,
      enableParticles: true,
      reduceMotion: false
    },
    desktop: {
      staggerChildren: 0.15,
      duration: 0.5,
      enableHover: true,
      enableParticles: true,
      reduceMotion: false
    }
  }[deviceType];
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

// 🎯 COMPONENTE OPTIMIZACIÓN TOUCH
interface TouchOptimizationProps {
  children: React.ReactNode;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isTouchDevice: boolean;
}

export function TouchOptimization({ children, deviceType, isTouchDevice }: TouchOptimizationProps) {
  if (!isTouchDevice) return <>{children}</>;

  return (
    <div 
      className={`
        ${deviceType === 'mobile' ? 'touch-pan-y' : ''}
        ${deviceType === 'mobile' ? 'select-none' : ''}
      `}
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
  const { deviceType, isTouchDevice } = useDeviceType();
  
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
      {deviceType} {isTouchDevice ? '(touch)' : '(mouse)'}
    </div>
  );
}