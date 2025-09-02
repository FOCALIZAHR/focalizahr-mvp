// src/components/monitor/WOWStandards.ts
// Sistema de Diseño Unificado para Componentes WOW de FocalizaHR
// Garantiza consistencia visual en todos los componentes de inteligencia

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

// ============================================
// CLASES CSS ESTANDARIZADAS
// ============================================

export const WOW_STYLES = {
  // CARDS PRINCIPALES
  card: {
    base: "fhr-card glass-card neural-glow backdrop-blur-xl border-2 relative overflow-hidden transition-all duration-300",
    primary: "border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-purple-900/10",
    success: "border-green-500/30 bg-gradient-to-br from-green-950/30 via-emerald-900/20 to-transparent",
    warning: "border-orange-500/30 bg-gradient-to-br from-orange-950/30 via-amber-900/20 to-transparent",
    danger: "border-red-500/30 bg-gradient-to-br from-red-950/30 via-red-900/20 to-transparent",
    info: "border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-purple-900/30 to-pink-900/20"
  },

  // TÍTULOS CON GRADIENTE
  title: {
    xl: "text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent",
    lg: "text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
    md: "text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
    // Variantes de color
    success: "text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent",
    warning: "text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent",
    danger: "text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent"
  },

  // CONTENEDORES DE ICONOS
  iconContainer: {
    base: "p-2.5 rounded-xl backdrop-blur-sm flex items-center justify-center",
    primary: "bg-gradient-to-br from-blue-600/30 to-purple-600/20",
    success: "bg-gradient-to-br from-green-600/30 to-emerald-600/20",
    warning: "bg-gradient-to-br from-orange-600/30 to-amber-600/20",
    danger: "bg-gradient-to-br from-red-600/30 to-pink-600/20",
    info: "bg-gradient-to-br from-purple-600/30 to-pink-600/20"
  },

  // ICONOS
  icon: {
    base: "h-5 w-5",
    lg: "h-6 w-6",
    primary: "text-blue-400",
    success: "text-green-400",
    warning: "text-orange-400",
    danger: "text-red-400",
    info: "text-purple-400"
  },

  // MÉTRICAS Y NÚMEROS
  metric: {
    value: "text-3xl font-bold",
    label: "text-xs text-gray-400 font-semibold uppercase tracking-wider",
    // Colores para valores
    primary: "text-blue-400",
    success: "text-green-400",
    warning: "text-orange-400",
    danger: "text-red-400",
    neutral: "text-gray-100"
  },

  // BADGES
  badge: {
    base: "px-3 py-1 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider",
    primary: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    success: "bg-green-500/20 text-green-300 border-green-500/50",
    warning: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    danger: "bg-red-500/20 text-red-300 border-red-500/50",
    info: "bg-purple-500/20 text-purple-300 border-purple-500/50"
  },

  // SUB-CARDS (cards dentro de cards)
  subCard: {
    base: "p-4 rounded-lg border backdrop-blur-sm relative overflow-hidden",
    primary: "border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-blue-900/20",
    success: "border-green-500/30 bg-gradient-to-r from-green-950/30 to-green-900/20",
    warning: "border-orange-500/30 bg-gradient-to-r from-orange-950/30 to-orange-900/20",
    danger: "border-red-500/30 bg-gradient-to-r from-red-950/30 to-red-900/20"
  },

  // EFECTOS Y ANIMACIONES
  effects: {
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.1),0_0_40px_rgba(167,139,250,0.05)]",
    hover: "hover:transform hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(34,211,238,0.15)]",
    pulse: "animate-pulse",
    fadeIn: "animate-fadeIn"
  }
};

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

interface WOWCardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string | ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'md' | 'lg' | 'xl';
}

// Componente de Header Estandarizado para cards WOW
export const WOWCardHeader = ({ 
  icon: Icon, 
  title, 
  subtitle,
  badge, 
  variant = 'primary',
  size = 'xl'
}: WOWCardHeaderProps) => {
  const titleClass = variant === 'primary' ? WOW_STYLES.title[size] : WOW_STYLES.title[variant];
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`${WOW_STYLES.iconContainer.base} ${WOW_STYLES.iconContainer[variant]}`}>
          <Icon className={`${size === 'xl' ? WOW_STYLES.icon.lg : WOW_STYLES.icon.base} ${WOW_STYLES.icon[variant]}`} />
        </div>
        <div>
          <h3 className={titleClass}>{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && (
        <div className={`${WOW_STYLES.badge.base} ${WOW_STYLES.badge[variant]}`}>
          {badge}
        </div>
      )}
    </div>
  );
};

// ============================================
// HELPERS Y UTILIDADES
// ============================================

// Helper para combinar clases de card
export const getWOWCardClass = (variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary', withHover = true) => {
  const classes = [
    WOW_STYLES.card.base,
    WOW_STYLES.card[variant],
    WOW_STYLES.effects.glow
  ];
  
  if (withHover) {
    classes.push(WOW_STYLES.effects.hover);
  }
  
  return classes.join(' ');
};

// Helper para métricas
export const getMetricClass = (type: 'value' | 'label', variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' = 'primary') => {
  if (type === 'value') {
    return `${WOW_STYLES.metric.value} ${WOW_STYLES.metric[variant]}`;
  }
  return WOW_STYLES.metric.label;
};

// ============================================
// CONFIGURACIÓN DE TEXTOS MEJORADOS
// ============================================

export const WOW_TEXTS = {
  // Textos más positivos y estratégicos
  priority: {
    critical: "Acción Estratégica Prioritaria",
    high: "Optimización Recomendada",
    medium: "Oportunidad de Mejora",
    low: "Punto de Observación"
  },
  
  status: {
    excellent: "Desempeño Ejemplar",
    good: "Progreso Positivo",
    attention: "Área de Enfoque",
    urgent: "Intervención Estratégica"
  },
  
  actions: {
    intervene: "Optimizar Equipos",
    document: "Documentar Prácticas",
    monitor: "Monitorear Progreso",
    replicate: "Replicar Éxito"
  }
};

// ============================================
// EXPORTACIÓN DE CONFIGURACIÓN COMPLETA
// ============================================

export const WOW_CONFIG = {
  styles: WOW_STYLES,
  components: { WOWCardHeader },
  helpers: { getWOWCardClass, getMetricClass },
  texts: WOW_TEXTS
};

export default WOW_CONFIG;