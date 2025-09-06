// src/lib/survey/constants.ts

/**
 * Constantes del Sistema de Diseño FocalizaHR
 * Valores fundamentales para mantener consistencia
 */

// ========================================
// ESPACIADO - Sistema basado en 8px
// ========================================
export const SPACING = {
  xs: 8,     // 8px
  sm: 16,    // 16px
  md: 24,    // 24px
  lg: 32,    // 32px
  xl: 48,    // 48px
  '2xl': 64, // 64px
  '3xl': 96, // 96px
} as const;

// ========================================
// COLORES - Paleta oficial FocalizaHR
// ========================================
export const COLORS = {
  // Marca
  brand: {
    cyan: '#22D3EE',
    cyanLight: '#67E8F9',
    cyanDark: '#0891B2',
    cyanMuted: 'rgba(34, 211, 238, 0.1)',
    
    purple: '#A78BFA',
    purpleLight: '#C4B5FD',
    purpleDark: '#7C3AED',
    purpleMuted: 'rgba(167, 139, 250, 0.1)',
  },
  
  // Neutros
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  
  // Semánticos
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },
  
  // Backgrounds
  background: {
    primary: '#0F172A',
    secondary: '#1E293B',
    elevated: 'rgba(30, 41, 59, 0.5)',
    overlay: 'rgba(15, 23, 42, 0.8)',
  },
} as const;

// ========================================
// TIPOGRAFÍA
// ========================================
export const TYPOGRAPHY = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  fontWeight: {
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ========================================
// LAYOUT
// ========================================
export const LAYOUT = {
  maxWidth: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    content: 720,
  },
  
  height: {
    header: 80,
    footer: 60,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    header: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
} as const;

// ========================================
// ANIMACIONES
// ========================================
export const ANIMATIONS = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 600,
    slower: 800,
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

// ========================================
// BREAKPOINTS
// ========================================
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ========================================
// GRADIENTS
// ========================================
export const GRADIENTS = {
  brand: 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)',
  brandHorizontal: 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 100%)',
  brandVertical: 'linear-gradient(180deg, #22D3EE 0%, #A78BFA 100%)',
  dark: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
  subtle: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
} as const;