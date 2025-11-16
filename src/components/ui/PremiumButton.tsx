// ====================================================================
// FOCALIZAHR PREMIUM BUTTONS SYSTEM
// Inspirado en BimodalToggle.tsx - Tesla/Apple Level Design
// ====================================================================
// 
// 🎯 FILOSOFÍA DE DISEÑO:
// - Minimalista y funcional (NO compete con contenido)
// - Glassmorphism sutil + gradientes corporativos
// - Animaciones spring suaves (framer-motion)
// - Feedback visual premium (hover, active, disabled)
// - Líneas de luz características Tesla
// - Accesibilidad completa (WCAG 2.1 AA)
//
// ====================================================================

"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// ====================================================================
// TYPES
// ====================================================================

type ButtonVariant = 
  | 'primary'      // Cyan gradient - Acciones principales
  | 'secondary'    // Purple gradient - Acciones secundarias  
  | 'ghost'        // Transparente con border - Acciones terciarias
  | 'danger'       // Red gradient - Acciones destructivas
  | 'success';     // Green gradient - Confirmaciones

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;  // Efecto glow en hover
  children: React.ReactNode;
}

// ====================================================================
// CONFIGURACIÓN DE ESTILOS
// ====================================================================

const VARIANT_STYLES = {
  primary: {
    background: 'linear-gradient(135deg, #22D3EE, #0891B2)',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    color: 'rgba(15, 23, 42, 0.95)',
    hoverShadow: '0 8px 24px rgba(34, 211, 238, 0.35)',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    topLine: 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
  },
  secondary: {
    background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
    border: '1px solid rgba(167, 139, 250, 0.3)',
    color: 'rgba(15, 23, 42, 0.95)',
    hoverShadow: '0 8px 24px rgba(167, 139, 250, 0.35)',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    topLine: 'linear-gradient(90deg, transparent, #A78BFA, transparent)'
  },
  ghost: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    color: 'rgba(226, 232, 240, 0.9)',
    hoverShadow: '0 4px 16px rgba(34, 211, 238, 0.15)',
    glowColor: 'rgba(34, 211, 238, 0.2)',
    topLine: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)'
  },
  danger: {
    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'rgba(255, 255, 255, 0.95)',
    hoverShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    topLine: 'linear-gradient(90deg, transparent, #EF4444, transparent)'
  },
  success: {
    background: 'linear-gradient(135deg, #10B981, #059669)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'rgba(15, 23, 42, 0.95)',
    hoverShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    topLine: 'linear-gradient(90deg, transparent, #10B981, transparent)'
  }
};

const SIZE_STYLES = {
  sm: {
    height: '32px',
    padding: '0 16px',
    fontSize: '13px',
    iconSize: 14,
    gap: 6
  },
  md: {
    height: '40px',
    padding: '0 20px',
    fontSize: '14px',
    iconSize: 16,
    gap: 8
  },
  lg: {
    height: '48px',
    padding: '0 24px',
    fontSize: '15px',
    iconSize: 18,
    gap: 10
  },
  xl: {
    height: '56px',
    padding: '0 32px',
    fontSize: '16px',
    iconSize: 20,
    gap: 12
  }
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      fullWidth = false,
      glow = true,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantConfig = VARIANT_STYLES[variant];
    const sizeConfig = SIZE_STYLES[size];

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        className={`premium-button ${className}`}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${sizeConfig.gap}px`,
          height: sizeConfig.height,
          padding: sizeConfig.padding,
          fontSize: sizeConfig.fontSize,
          fontWeight: 600,
          color: variantConfig.color,
          background: variantConfig.background,
          border: variantConfig.border,
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.5 : 1,
          overflow: 'hidden',
          width: fullWidth ? '100%' : 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        whileHover={
          !disabled && !isLoading
            ? {
                scale: 1.02,
                boxShadow: glow ? variantConfig.hoverShadow : undefined
              }
            : undefined
        }
        whileTap={
          !disabled && !isLoading
            ? {
                scale: 0.98
              }
            : undefined
        }
        {...props}
      >
        {/* LÍNEA SUPERIOR LUMINOSA - ESTILO TESLA */}
        <div
          className="button-top-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: variantConfig.topLine,
            opacity: 0.8
          }}
        />

        {/* GLOW EFFECT EN HOVER */}
        {glow && !disabled && (
          <motion.div
            className="button-glow"
            style={{
              position: 'absolute',
              inset: '-2px',
              background: variantConfig.glowColor,
              borderRadius: '12px',
              filter: 'blur(8px)',
              opacity: 0,
              pointerEvents: 'none'
            }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* CONTENIDO DEL BOTÓN */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: `${sizeConfig.gap}px`,
            zIndex: 1
          }}
        >
          {/* LOADING SPINNER */}
          {isLoading && (
            <motion.div
              style={{
                width: sizeConfig.iconSize,
                height: sizeConfig.iconSize,
                border: `2px solid ${variantConfig.color}`,
                borderTopColor: 'transparent',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}

          {/* ICONO IZQUIERDO */}
          {!isLoading && Icon && iconPosition === 'left' && (
            <Icon
              size={sizeConfig.iconSize}
              style={{ flexShrink: 0 }}
            />
          )}

          {/* TEXTO */}
          <span style={{ whiteSpace: 'nowrap' }}>{children}</span>

          {/* ICONO DERECHO */}
          {!isLoading && Icon && iconPosition === 'right' && (
            <Icon
              size={sizeConfig.iconSize}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
      </motion.button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

// ====================================================================
// VARIANTES ESPECÍFICAS PRECONFIGURADAS
// ====================================================================

export const PrimaryButton = (props: Omit<PremiumButtonProps, 'variant'>) => (
  <PremiumButton variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<PremiumButtonProps, 'variant'>) => (
  <PremiumButton variant="secondary" {...props} />
);

export const GhostButton = (props: Omit<PremiumButtonProps, 'variant'>) => (
  <PremiumButton variant="ghost" {...props} />
);

export const DangerButton = (props: Omit<PremiumButtonProps, 'variant'>) => (
  <PremiumButton variant="danger" {...props} />
);

export const SuccessButton = (props: Omit<PremiumButtonProps, 'variant'>) => (
  <PremiumButton variant="success" {...props} />
);

// ====================================================================
// BUTTON GROUP COMPONENT
// ====================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  fullWidth?: boolean;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 12,
  fullWidth = false
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        gap: `${spacing}px`,
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      {children}
    </div>
  );
};

// ====================================================================
// EJEMPLOS DE USO
// ====================================================================

/*
// EJEMPLO 1: Botón primary con icono
<PrimaryButton 
  icon={Send} 
  iconPosition="right"
  onClick={() => handleSubmit()}
>
  Enviar Encuesta
</PrimaryButton>

// EJEMPLO 2: Botón secondary loading
<SecondaryButton 
  icon={Download}
  isLoading={isDownloading}
  size="lg"
>
  {isDownloading ? 'Descargando...' : 'Descargar Reporte'}
</SecondaryButton>

// EJEMPLO 3: Button group
<ButtonGroup spacing={16}>
  <GhostButton icon={X}>
    Cancelar
  </GhostButton>
  <PrimaryButton icon={Check}>
    Confirmar
  </PrimaryButton>
</ButtonGroup>

// EJEMPLO 4: Botón danger con confirmación
<DangerButton 
  icon={Trash2}
  onClick={() => confirmDelete()}
  glow={true}
>
  Eliminar Campaña
</DangerButton>

// EJEMPLO 5: Full width responsive
<PrimaryButton 
  fullWidth
  size="xl"
  icon={Sparkles}
>
  Activar Campaña
</PrimaryButton>
*/