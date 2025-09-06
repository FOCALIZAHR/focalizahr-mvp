// src/lib/survey/styles.ts

/**
 * Clases de estilo unificadas para el sistema de encuestas
 * Usar con cn() para combinar clases
 */

// ========================================
// BOTONES
// ========================================
export const buttonStyles = {
  // Base para todos los botones
  base: `
    font-medium tracking-wide rounded-full 
    transition-all duration-300
    inline-flex items-center justify-center gap-2
    active:scale-[0.98]
  `,
  
  // Variantes
  variants: {
    primary: `
      bg-transparent border border-[#22D3EE]/50
      text-[#22D3EE]
      hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]
    `,
    secondary: `
      bg-transparent border border-slate-600/50
      text-slate-300
      hover:border-slate-500 hover:text-slate-200
    `,
    solid: `
      bg-[#22D3EE] text-[#0F172A] border border-[#22D3EE]
      hover:bg-[#A78BFA] hover:border-[#A78BFA] hover:shadow-lg
    `,
    ghost: `
      bg-transparent border-none
      text-slate-400
      hover:text-slate-200 hover:bg-slate-800/50
    `,
  },
  
  // Tamaños
  sizes: {
    xs: 'px-4 py-1.5 text-xs',
    sm: 'px-6 py-2 text-sm',
    md: 'px-10 py-3 text-sm',
    lg: 'px-12 py-4 text-base',
  },
  
  // Estados
  states: {
    disabled: 'opacity-30 cursor-not-allowed hover:bg-transparent',
    loading: 'cursor-wait',
  },
};

// ========================================
// CARDS
// ========================================
export const cardStyles = {
  base: `
    bg-slate-900/50 
    border border-slate-800 
    rounded-2xl 
    backdrop-blur-sm
  `,
  
  variants: {
    elevated: `
      bg-slate-800/50
      shadow-xl shadow-black/20
    `,
    flat: `
      bg-transparent
      border-slate-700/50
    `,
    gradient: `
      bg-gradient-to-br from-slate-900/90 to-slate-800/90
    `,
  },
  
  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },
};

// ========================================
// INPUTS
// ========================================
export const inputStyles = {
  // Radio buttons
  radio: `
    w-5 h-5 
    text-[#22D3EE] 
    bg-transparent 
    border-slate-600
    focus:ring-2 focus:ring-[#22D3EE] 
    focus:ring-offset-0
    focus:ring-offset-transparent
  `,
  
  // Checkboxes
  checkbox: `
    w-5 h-5 
    text-[#22D3EE] 
    bg-transparent 
    border-slate-600
    rounded
    focus:ring-2 focus:ring-[#22D3EE] 
    focus:ring-offset-0
    focus:ring-offset-transparent
  `,
  
  // Text inputs
  text: `
    w-full px-4 py-3
    bg-slate-900/50
    border border-slate-700
    rounded-xl
    text-white placeholder-slate-500
    focus:outline-none focus:border-[#22D3EE]
    focus:ring-2 focus:ring-[#22D3EE]/20
    transition-all duration-200
  `,
  
  // Textarea
  textarea: `
    w-full px-4 py-3
    bg-slate-900/50
    border border-slate-700
    rounded-xl
    text-white placeholder-slate-500
    focus:outline-none focus:border-[#22D3EE]
    focus:ring-2 focus:ring-[#22D3EE]/20
    transition-all duration-200
    resize-none
  `,
};

// ========================================
// OPCIONES DE RESPUESTA (para renderers)
// ========================================
export const optionStyles = {
  base: `
    p-4
    border border-slate-700/50
    rounded-xl
    cursor-pointer
    transition-all duration-200
    hover:border-slate-600
    hover:bg-slate-800/30
  `,
  
  selected: `
    border-[#22D3EE]
    bg-[#22D3EE]/10
  `,
  
  disabled: `
    opacity-50
    cursor-not-allowed
    hover:border-slate-700/50
    hover:bg-transparent
  `,
};

// ========================================
// TEXTO
// ========================================
export const textStyles = {
  // Headings
  h1: 'text-4xl md:text-5xl lg:text-6xl font-extralight',
  h2: 'text-3xl md:text-4xl lg:text-5xl font-light',
  h3: 'text-2xl md:text-3xl font-light',
  h4: 'text-xl md:text-2xl font-normal',
  h5: 'text-lg md:text-xl font-normal',
  h6: 'text-base md:text-lg font-medium',
  
  // Body
  body: 'text-base text-slate-400',
  bodyLarge: 'text-lg text-slate-400',
  bodySmall: 'text-sm text-slate-400',
  
  // Caption
  caption: 'text-xs text-slate-500',
  captionUppercase: 'text-xs text-slate-500 uppercase tracking-wider',
  
  // Gradient
  gradient: `
    bg-gradient-to-r from-[#22D3EE] to-[#A78BFA]
    bg-clip-text text-transparent
  `,
};

// ========================================
// CONTENEDORES
// ========================================
export const containerStyles = {
  // Páginas
  page: 'min-h-screen bg-[#0F172A]',
  pageWithHeader: 'min-h-[calc(100vh-80px)] mt-20',
  
  // Secciones
  section: 'py-12 px-6',
  sectionCentered: 'py-12 px-6 flex items-center justify-center min-h-[calc(100vh-80px)]',
  
  // Content wrapper
  content: 'max-w-2xl mx-auto',
  contentWide: 'max-w-4xl mx-auto',
  contentNarrow: 'max-w-xl mx-auto',
};

// ========================================
// UTILIDADES
// ========================================
export const utilityStyles = {
  // Separadores
  dividerHorizontal: 'h-px bg-slate-800',
  dividerVertical: 'w-px bg-slate-800',
  dividerGradient: 'h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent',
  
  // Overlays
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 focus:ring-offset-slate-900',
  
  // Animations
  fadeIn: 'animate-fadeIn',
  slideUp: 'animate-slideUp',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

// ========================================
// BADGES
// ========================================
export const badgeStyles = {
  base: `
    inline-flex items-center gap-1.5
    px-3 py-1 
    text-xs font-medium
    rounded-full
  `,
  
  variants: {
    default: 'bg-slate-800 text-slate-300',
    cyan: 'bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20',
    purple: 'bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
};

// ========================================
// PROGRESS BARS
// ========================================
export const progressStyles = {
  container: 'w-full h-1 bg-slate-800 rounded-full overflow-hidden',
  bar: 'h-full bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] transition-all duration-500 ease-out',
  text: 'text-xs text-slate-500',
};