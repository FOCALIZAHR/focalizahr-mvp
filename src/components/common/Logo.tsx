import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'light' | 'dark' | 'gradient'
  className?: string
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  theme = 'gradient',
  className,
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const getIconColor = () => {
    switch (theme) {
      case 'light':
        return 'text-gray-900'
      case 'dark':
        return 'text-white'
      case 'gradient':
      default:
        return 'focalizahr-gradient-text'
    }
  }

  const getTextColor = () => {
    switch (theme) {
      case 'light':
        return 'text-gray-900'
      case 'dark':
        return 'text-white'
      case 'gradient':
      default:
        return 'focalizahr-gradient-text'
    }
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Icono FocalizaHR - Representación abstracta de análisis y personas */}
      <div className={cn(sizeClasses[size], 'relative flex items-center justify-center')}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn('w-full h-full', getIconColor())}
        >
          {/* Círculo central representando el "pulso" */}
          <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.8"/>
          
          {/* Ondas concéntricas representando el análisis que se expande */}
          <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4"/>
          
          {/* Puntos representando personas/colaboradores */}
          <circle cx="16" cy="6" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="26" cy="16" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="16" cy="26" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="6" cy="16" r="1.5" fill="currentColor" opacity="0.9"/>
          
          {/* Líneas conectoras sutiles */}
          <line x1="16" y1="8" x2="16" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="24" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="16" y1="24" x2="16" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      </div>

      {/* Texto del logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold leading-tight tracking-tight',
            textSizeClasses[size],
            getTextColor()
          )}>
            FocalizaHR
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className={cn(
              'text-xs font-medium opacity-70 -mt-1',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>
              Pulso de Bienestar
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default Logo