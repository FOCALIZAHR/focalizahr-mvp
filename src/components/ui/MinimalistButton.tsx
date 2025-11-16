// ====================================================================
// FOCALIZAHR MINIMALIST BUTTONS V2.0
// Filosofía: Elegancia Minimalista - Inspirado en Toggle Bimodal Real
// ====================================================================
// 
// 🎯 DIFERENCIAS CLAVE VS V1.0:
// ✅ Colores SÓLIDOS 100% (NO gradientes)
// ✅ Forma "píldora" elegante (border-radius alto)
// ✅ NO línea luminosa superior
// ✅ Glow MUY sutil (solo en active)
// ✅ Swap limpio de estados
// ✅ Minimalismo extremo
//
// 📐 BASADO EN TUS IMÁGENES:
// - Futuro: bg-dark sólido + text-gray
// - Ahora: bg-purple-500 sólido + text-dark
// - Transición suave sin efectos excesivos
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
  | 'cyan'      // Botón cyan sólido (estado activo)
  | 'purple'    // Botón purple sólido (estado activo)
  | 'neutral'   // Botón neutral oscuro (estado inactivo)
  | 'danger'    // Botón rojo sólido (destructivo)
  | 'success';  // Botón verde sólido (confirmación)

type ButtonSize = 'sm' | 'md' | 'lg';

interface MinimalistButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  isActive?: boolean;  // Para toggles binarios
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ====================================================================
// CONFIGURACIÓN DE ESTILOS - MINIMALISTA PURO
// ====================================================================

const VARIANT_STYLES = {
  cyan: {
    background: '#22D3EE',  // Cyan 100% sólido
    color: 'rgba(15, 23, 42, 0.95)',  // Texto oscuro
    border: 'none',
    hoverBg: '#06B6D4',  // Cyan más oscuro en hover
    shadow: '0 4px 14px rgba(34, 211, 238, 0.25)'  // Sombra sutil
  },
  purple: {
    background: '#A78BFA',  // Purple 100% sólido
    color: 'rgba(15, 23, 42, 0.95)',  // Texto oscuro
    border: 'none',
    hoverBg: '#9333EA',  // Purple más oscuro en hover
    shadow: '0 4px 14px rgba(167, 139, 250, 0.25)'
  },
  neutral: {
    background: 'rgba(30, 41, 59, 0.95)',  // Gris oscuro
    color: 'rgba(148, 163, 184, 0.9)',  // Texto gris claro
    border: '1px solid rgba(71, 85, 105, 0.3)',
    hoverBg: 'rgba(51, 65, 85, 0.95)',  // Más claro en hover
    shadow: 'none'
  },
  danger: {
    background: '#EF4444',  // Rojo sólido
    color: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    hoverBg: '#DC2626',
    shadow: '0 4px 14px rgba(239, 68, 68, 0.25)'
  },
  success: {
    background: '#10B981',  // Verde sólido
    color: 'rgba(15, 23, 42, 0.95)',
    border: 'none',
    hoverBg: '#059669',
    shadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
  }
};

const SIZE_STYLES = {
  sm: {
    height: '32px',
    padding: '0 20px',
    fontSize: '13px',
    iconSize: 14,
    gap: 6,
    borderRadius: '20px'  // Muy redondeado (píldora)
  },
  md: {
    height: '40px',
    padding: '0 24px',
    fontSize: '14px',
    iconSize: 16,
    gap: 8,
    borderRadius: '24px'  // Píldora perfecta
  },
  lg: {
    height: '48px',
    padding: '0 32px',
    fontSize: '15px',
    iconSize: 18,
    gap: 10,
    borderRadius: '28px'  // Extra redondeado
  }
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export const MinimalistButton = React.forwardRef<HTMLButtonElement, MinimalistButtonProps>(
  (
    {
      variant = 'cyan',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      isActive = false,
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantConfig = VARIANT_STYLES[variant];
    const sizeConfig = SIZE_STYLES[size];

    // Estado visual dinámico
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        className={`minimalist-button ${className}`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${sizeConfig.gap}px`,
          height: sizeConfig.height,
          padding: sizeConfig.padding,
          fontSize: sizeConfig.fontSize,
          fontWeight: 500,  // Font-medium (NO bold excesivo)
          color: variantConfig.color,
          background: isHovered ? variantConfig.hoverBg : variantConfig.background,
          border: variantConfig.border,
          borderRadius: sizeConfig.borderRadius,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.5 : 1,
          overflow: 'hidden',
          width: fullWidth ? '100%' : 'auto',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',  // Transición suave
          boxShadow: isActive && !disabled ? variantConfig.shadow : 'none'
        }}
        whileHover={
          !disabled && !isLoading
            ? {
                scale: 1.02,  // Scale MUY sutil
              }
            : undefined
        }
        whileTap={
          !disabled && !isLoading
            ? {
                scale: 0.98  // Compresión suave
              }
            : undefined
        }
        {...props}
      >
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

MinimalistButton.displayName = 'MinimalistButton';

// ====================================================================
// COMPONENTES PRECONFIGURADOS
// ====================================================================

export const CyanButton = (props: Omit<MinimalistButtonProps, 'variant'>) => (
  <MinimalistButton variant="cyan" {...props} />
);

export const PurpleButton = (props: Omit<MinimalistButtonProps, 'variant'>) => (
  <MinimalistButton variant="purple" {...props} />
);

export const NeutralButton = (props: Omit<MinimalistButtonProps, 'variant'>) => (
  <MinimalistButton variant="neutral" {...props} />
);

export const DangerButton = (props: Omit<MinimalistButtonProps, 'variant'>) => (
  <MinimalistButton variant="danger" {...props} />
);

export const SuccessButton = (props: Omit<MinimalistButtonProps, 'variant'>) => (
  <MinimalistButton variant="success" {...props} />
);

// ====================================================================
// TOGGLE GROUP - INSPIRADO EN TUS IMÁGENES
// ====================================================================

interface ToggleOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface MinimalistToggleProps {
  options: [ToggleOption, ToggleOption];  // Exactamente 2 opciones
  activeValue: string;
  onChange: (value: string) => void;
  size?: ButtonSize;
}

export const MinimalistToggle: React.FC<MinimalistToggleProps> = ({
  options,
  activeValue,
  onChange,
  size = 'md'
}) => {
  const sizeConfig = SIZE_STYLES[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '4px',
        borderRadius: `${parseInt(sizeConfig.borderRadius) + 4}px`,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(71, 85, 105, 0.2)'
      }}
    >
      {options.map((option, index) => {
        const isActive = option.value === activeValue;
        const Icon = option.icon;

        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${sizeConfig.gap}px`,
              height: sizeConfig.height,
              padding: sizeConfig.padding,
              fontSize: sizeConfig.fontSize,
              fontWeight: 500,
              color: isActive 
                ? 'rgba(15, 23, 42, 0.95)' 
                : 'rgba(148, 163, 184, 0.8)',
              background: isActive
                ? (index === 0 ? '#22D3EE' : '#A78BFA')  // Cyan o Purple según posición
                : 'transparent',
              border: 'none',
              borderRadius: sizeConfig.borderRadius,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: isActive 
                ? `0 2px 8px ${index === 0 ? 'rgba(34, 211, 238, 0.3)' : 'rgba(167, 139, 250, 0.3)'}` 
                : 'none'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {Icon && <Icon size={sizeConfig.iconSize} />}
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// ====================================================================
// BUTTON GROUP
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
        width: fullWidth ? '100%' : 'auto',
        flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap'
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
// EJEMPLO 1: Botón cyan simple (como "Ahora" en tu imagen)
<CyanButton>
  Ahora
</CyanButton>

// EJEMPLO 2: Botón neutral (como "Futuro" en tu imagen)
<NeutralButton>
  Futuro
</NeutralButton>

// EJEMPLO 3: Toggle bimodal (exactamente como tus imágenes)
<MinimalistToggle
  options={[
    { value: 'futuro', label: 'Futuro' },
    { value: 'ahora', label: 'Ahora' }
  ]}
  activeValue={mode}
  onChange={setMode}
  size="md"
/>

// EJEMPLO 4: Botón con icono
<CyanButton icon={Send} iconPosition="right">
  Enviar Encuesta
</CyanButton>

// EJEMPLO 5: Botón loading
<PurpleButton isLoading={isProcessing}>
  {isProcessing ? 'Procesando...' : 'Continuar'}
</PurpleButton>

// EJEMPLO 6: Button group
<ButtonGroup spacing={12}>
  <NeutralButton>Cancelar</NeutralButton>
  <CyanButton>Confirmar</CyanButton>
</ButtonGroup>

// EJEMPLO 7: Botón full-width
<CyanButton fullWidth size="lg">
  Activar Campaña
</CyanButton>
*/