// ====================================================================
// SISTEMA TOOLTIPS EDUCATIVOS - COCKPIT HEADER
// src/components/ui/TooltipContext.tsx
// Fase 2.1: Educación simultánea con estabilización
// ====================================================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, HelpCircle, TrendingUp, Target, Zap } from 'lucide-react';

// 🎯 INTERFACE TOOLTIP CONTEXTUAL
interface TooltipContextProps {
  children: React.ReactNode;
  title: string;
  explanation: string;
  details?: string[];
  actionable?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'momentum' | 'projection' | 'action' | 'risk' | 'pattern';
  showIcon?: boolean;
}

// 🎨 VARIANTES VISUALES POR TIPO
const getVariantStyles = (variant: string) => {
  const variants = {
    momentum: {
      border: 'border-purple-500/40',
      bg: 'bg-purple-900/20',
      titleColor: 'text-purple-300',
      icon: TrendingUp
    },
    projection: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-900/20', 
      titleColor: 'text-cyan-300',
      icon: Target
    },
    action: {
      border: 'border-green-500/40',
      bg: 'bg-green-900/20',
      titleColor: 'text-green-300',
      icon: Zap
    },
    risk: {
      border: 'border-red-500/40',
      bg: 'bg-red-900/20',
      titleColor: 'text-red-300',
      icon: HelpCircle
    },
    pattern: {
      border: 'border-blue-500/40',
      bg: 'bg-blue-900/20',
      titleColor: 'text-blue-300',
      icon: Info
    }
  };
  
  return variants[variant as keyof typeof variants] || variants.momentum;
};

// 🧠 COMPONENTE PRINCIPAL TOOLTIP CONTEXTUAL
export function TooltipContext({
  children,
  title,
  explanation,
  details = [],
  actionable,
  position = 'top',
  variant = 'momentum',
  showIcon = false
}: TooltipContextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const styles = getVariantStyles(variant);
  const IconComponent = styles.icon;

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const positionClasses = {
    top: 'bottom-full mb-3',
    bottom: 'top-full mt-3', 
    left: 'right-full mr-3',
    right: 'left-full ml-3'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => !isMobile && setIsVisible(true)}
      onMouseLeave={() => !isMobile && setIsVisible(false)}
      onClick={() => isMobile && setIsVisible(!isVisible)}
    >
      {/* Trigger Element */}
      <div className={`${showIcon ? 'flex items-center gap-2' : ''} cursor-help`}>
        {children}
        {showIcon && (
          <Info className="h-4 w-4 text-white/40 hover:text-white/70 transition-colors" />
        )}
      </div>

      {/* Tooltip Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              absolute z-50 ${positionClasses[position]}
              ${isMobile ? 'w-80' : 'w-96'} max-w-screen-sm
              ${styles.bg} ${styles.border} backdrop-blur-xl
              rounded-xl p-4 shadow-2xl
              left-1/2 transform -translate-x-1/2
            `}
          >
            {/* Header con icono */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${styles.bg} ${styles.border}`}>
                <IconComponent className={`h-4 w-4 ${styles.titleColor}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${styles.titleColor} mb-1`}>
                  {title}
                </h4>
                <p className="text-white/90 text-xs leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>

            {/* Details List */}
            {details.length > 0 && (
              <div className="mb-3">
                <div className="text-white/70 text-xs space-y-1">
                  {details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white/40 rounded-full mt-2 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Insight */}
            {actionable && (
              <div className={`${styles.bg} ${styles.border} rounded-lg p-3`}>
                <div className="flex items-start gap-2">
                  <Zap className={`h-3 w-3 ${styles.titleColor} mt-0.5 flex-shrink-0`} />
                  <p className={`text-xs font-medium ${styles.titleColor}`}>
                    {actionable}
                  </p>
                </div>
              </div>
            )}

            {/* Arrow Pointer */}
            <div 
              className={`
                absolute w-0 h-0
                ${position === 'top' ? 'top-full border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800' : ''}
                ${position === 'bottom' ? 'bottom-full border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-slate-800' : ''}
                left-1/2 transform -translate-x-1/2
              `} 
            />

            {/* Mobile: Tap para cerrar */}
            {isMobile && (
              <div className="text-center mt-3 pt-2 border-t border-white/10">
                <span className="text-xs text-white/50">Toca fuera para cerrar</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Overlay para cerrar */}
      {isMobile && isVisible && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsVisible(false)}
        />
      )}
    </div>
  );
}

// 🎯 TOOLTIPS ESPECÍFICOS COCKPIT HEADER

// MOMENTUM TOOLTIP
export const MomentumTooltip = ({ children, momentum, trend }: {
  children: React.ReactNode;
  momentum: number;
  trend: string;
}) => (
  <TooltipContext
    variant="momentum"
    title="Momentum Organizacional"
    explanation="Velocidad actual de respuesta comparada con el promedio histórico de tu organización"
    details={[
      `Valor ${momentum}: ${momentum > 100 ? 'Por encima del promedio' : momentum < 80 ? 'Por debajo del promedio' : 'En rango normal'}`,
      `Tendencia "${trend}": ${
        trend === 'acelerando' ? 'Aumentando velocidad últimas 48h' :
        trend === 'desacelerando' ? 'Disminuyendo velocidad últimas 48h' :
        trend === 'completado' ? 'Departamento terminó su participación' :
        'Velocidad constante últimos días'
      }`,
      'Se calcula: (Velocidad actual ÷ Promedio 7 días) × 100'
    ]}
    actionable={
      trend === 'acelerando' ? '🚀 Aprovechar momento - intensificar comunicación' :
      trend === 'desacelerando' ? '⚠️ Intervención recomendada próximas 24h' :
      trend === 'completado' ? '✅ Analizar y replicar metodología exitosa' :
      '📊 Mantener estrategia actual'
    }
    position="bottom"
  >
    {children}
  </TooltipContext>
);

// PROJECTION TOOLTIP  
export const ProjectionTooltip = ({ children, current, projection, confidence }: {
  children: React.ReactNode;
  current: number;
  projection: number;
  confidence: number;
}) => (
  <TooltipContext
    variant="projection"
    title="Proyección Inteligente"
    explanation="Predicción matemática del resultado final basada en patrones actuales de respuesta"
    details={[
      `Participación actual: ${current}%`,
      `Si continúa este ritmo: ${projection}% final`,
      `Confianza estadística: ${confidence}% ${confidence > 75 ? '(Alta)' : confidence > 50 ? '(Media)' : '(Baja)'}`,
      'Metodología: Regresión lineal + análisis temporal'
    ]}
    actionable={
      projection > current + 10 ? '📈 Proyección positiva - mantener estrategia' :
      projection < current - 5 ? '📉 Riesgo de descenso - acelerar acciones' :
      '📊 Resultado estable proyectado'
    }
    position="bottom"
  >
    {children}
  </TooltipContext>
);

// ACTION TOOLTIP
export const ActionTooltip = ({ children, action, reasoning }: {
  children: React.ReactNode;
  action: string;
  reasoning: string;
}) => (
  <TooltipContext
    variant="action"
    title="Acción Recomendada"
    explanation="Próximo paso más efectivo basado en análisis de datos actual"
    details={[
      `Recomendación: ${action}`,
      `Razón: ${reasoning}`,
      'Basado en: Momentum + proyección + patrones históricos'
    ]}
    actionable="🎯 Implementar en próximas 24-48 horas para máxima efectividad"
    position="bottom"
  >
    {children}
  </TooltipContext>
);

// PATTERN TOOLTIP
export const PatternTooltip = ({ children, pattern, departments }: {
  children: React.ReactNode;
  pattern: string;
  departments: number;
}) => (
  <TooltipContext
    variant="pattern"
    title="Patrón Organizacional Detectado"
    explanation="Análisis automático del comportamiento dominante en tu organización"
    details={[
      `Patrón actual: ${pattern}`,
      `Departamentos involucrados: ${departments}`,
      pattern === 'completado' ? 'Respuesta rápida y efectiva detectada' :
      pattern === 'acelerando' ? 'Momentum creciente organizacional' :
      pattern === 'mixto' ? 'Comportamiento heterogéneo - requiere análisis específico' :
      'Patrón estable identificado'
    ]}
    actionable={
      pattern === 'completado' ? '✅ Documentar metodología exitosa para futuras campañas' :
      pattern === 'acelerando' ? '🚀 Capitalizar momentum organizacional' :
      '📊 Análizar departamentos específicos individualmente'
    }
    position="bottom"
  >
    {children}
  </TooltipContext>
);