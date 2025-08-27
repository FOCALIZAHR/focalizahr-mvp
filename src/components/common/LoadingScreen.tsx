// src/components/common/LoadingScreen.tsx
'use client';

import React from 'react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  variant?: 'default' | 'minimal' | 'fullscreen';
}

export default function LoadingScreen({ 
  title = 'FocalizaHR',
  subtitle = 'Cargando Centro de Inteligencia...',
  showLogo = true,
  variant = 'default'
}: LoadingScreenProps) {
  
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          {subtitle && (
            <p className="text-white/70">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }
  
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center neural-gradient">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          {showLogo && (
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-white/70">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden neural-gradient">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="text-center relative z-10">
        {/* Spinner principal */}
        <div className="relative mx-auto mb-8">
          <div className="w-20 h-20 border-4 border-cyan-400/30 rounded-full absolute"></div>
          <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Logo/Título */}
        {showLogo && (
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-pulse">
            {title}
          </h2>
        )}
        
        {/* Subtítulo */}
        {subtitle && (
          <p className="text-lg text-white/70 mb-4">{subtitle}</p>
        )}
        
        {/* Indicador de progreso con puntos */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para loading inline
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  return (
    <div className={`${sizeClasses[size]} border-cyan-400 border-t-transparent rounded-full animate-spin ${className}`}></div>
  );
}

// Componente para loading de cards/secciones
export function LoadingCard({ 
  title = 'Cargando...',
  description
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="professional-card p-6">
      <div className="flex items-center space-x-4">
        <LoadingSpinner size="md" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          {description && (
            <p className="text-sm text-white/60 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para skeleton loading
export function LoadingSkeleton({ 
  lines = 3,
  className = ''
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded animate-pulse"
          style={{ width: `${100 - (i * 15)}%` }}
        ></div>
      ))}
    </div>
  );
}