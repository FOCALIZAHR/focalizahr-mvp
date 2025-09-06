// src/lib/survey/utils.ts

import { COLORS, GRADIENTS, LAYOUT, SPACING } from './constants';

/**
 * Utilidades del Sistema de Diseño FocalizaHR
 */

// ========================================
// UTILIDAD DE CLASES CSS
// ========================================

/**
 * Combina clases CSS de manera segura, filtrando valores falsy
 * Similar a clsx pero más simple
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ========================================
// UTILIDADES DE COLORES
// ========================================

/**
 * Convierte hex a rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Genera un gradiente personalizado
 */
export function createGradient(
  startColor: string,
  endColor: string,
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal'
): string {
  const angles = {
    horizontal: '90deg',
    vertical: '180deg',
    diagonal: '135deg',
  };
  return `linear-gradient(${angles[direction]}, ${startColor} 0%, ${endColor} 100%)`;
}

/**
 * Obtiene el gradiente de marca predefinido
 */
export function getBrandGradient(type: keyof typeof GRADIENTS = 'brand'): string {
  return GRADIENTS[type];
}

// ========================================
// UTILIDADES DE ESPACIADO
// ========================================

/**
 * Convierte unidades de espaciado a pixeles
 */
export function spacing(unit: keyof typeof SPACING): string {
  return `${SPACING[unit]}px`;
}

/**
 * Genera padding dinámico
 */
export function padding(
  top: keyof typeof SPACING,
  right?: keyof typeof SPACING,
  bottom?: keyof typeof SPACING,
  left?: keyof typeof SPACING
): string {
  if (right === undefined) {
    return `${SPACING[top]}px`;
  }
  if (bottom === undefined) {
    return `${SPACING[top]}px ${SPACING[right]}px`;
  }
  if (left === undefined) {
    return `${SPACING[top]}px ${SPACING[right]}px ${SPACING[bottom]}px`;
  }
  return `${SPACING[top]}px ${SPACING[right]}px ${SPACING[bottom]}px ${SPACING[left]}px`;
}

// ========================================
// UTILIDADES DE LAYOUT
// ========================================

/**
 * Calcula altura de contenido considerando el header
 */
export function getContentHeight(fullHeight: string = '100vh'): string {
  return `calc(${fullHeight} - ${LAYOUT.height.header}px)`;
}

/**
 * Genera max-width responsivo
 */
export function getMaxWidth(size: keyof typeof LAYOUT.maxWidth): string {
  return `${LAYOUT.maxWidth[size]}px`;
}

// ========================================
// UTILIDADES DE RESPONSIVE
// ========================================

/**
 * Verifica si estamos en un breakpoint específico
 */
export function isBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop'): boolean {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  
  switch (breakpoint) {
    case 'mobile':
      return width < 768;
    case 'tablet':
      return width >= 768 && width < 1024;
    case 'desktop':
      return width >= 1024;
    default:
      return false;
  }
}

/**
 * Hook para detectar el breakpoint actual (usar con React)
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  return 'xl';
}

// ========================================
// UTILIDADES DE ANIMACIÓN
// ========================================

/**
 * Genera delays escalonados para animaciones en cascada
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}

/**
 * Genera configuración de animación consistente
 */
export function getAnimation(
  duration: number = 300,
  easing: string = 'ease-out',
  delay: number = 0
) {
  return {
    transition: `all ${duration}ms ${easing} ${delay}ms`,
  };
}

// ========================================
// UTILIDADES DE FORMATO
// ========================================

/**
 * Formatea tiempo en minutos a texto legible
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hora${hours !== 1 ? 's' : ''}${mins > 0 ? ` y ${mins} minuto${mins !== 1 ? 's' : ''}` : ''}`;
}

/**
 * Formatea progreso como porcentaje
 */
export function formatProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
}

/**
 * Trunca texto con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}