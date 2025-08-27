// ====================================================================
// BIMODAL TOGGLE - DISEÑO MINIMALISTA TESLA/APPLE LEVEL
// src/components/monitor/cockpit/BimodalToggle.tsx
// 🎯 FILOSOFÍA: Sutil, funcional, NO compete con el gauge
// ====================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface BimodalToggleProps {
  mode: 'predictivo' | 'dinamico';
  onToggle: () => void;
  isTransitioning?: boolean;
  // DATO REAL DEL INVENTARIO: daysRemaining calculado desde endDate
  daysRemaining?: number;
}

export default function BimodalToggle({ 
  mode, 
  onToggle, 
  isTransitioning = false, 
  daysRemaining = 0
}: BimodalToggleProps) {
  
  // CÁLCULO URGENCIA VISUAL
  const urgencyColor = daysRemaining <= 2 ? '#ef4444' : daysRemaining <= 7 ? '#f59e0b' : '#10b981';
  
  return (
    <div className="absolute top-4 right-4 flex items-center space-x-3 z-50">
      
      {/* CUENTA REGRESIVA SUTIL - TESLA STYLE */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center space-x-1.5 px-2 py-1 rounded-md"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${urgencyColor}40`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <Clock 
          className="w-3 h-3" 
          style={{ color: urgencyColor }}
        />
        <div className="text-xs font-medium" style={{ color: urgencyColor }}>
          {daysRemaining}d
        </div>
      </motion.div>

      {/* TOGGLE TESLA STYLE - LÍNEA DE LUZ + MINIMALISTA */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative rounded-xl overflow-hidden"
        style={{
          width: '100px',
          height: '32px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(34, 211, 238, 0.2)'
        }}
        whileHover={{ 
          borderColor: 'rgba(34, 211, 238, 0.6)',
          scale: 1.02
        }}
      >
        {/* LÍNEA SUPERIOR LUMINOSA TESLA */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
          }}
        />

        {/* SLIDER INDICATOR CON GRADIENTE SUTIL */}
        <motion.div
          className="absolute top-1 rounded-lg h-6 flex items-center justify-center"
          style={{
            width: '46px',
            left: mode === 'predictivo' ? '2px' : '52px',
            background: mode === 'predictivo'
              ? 'linear-gradient(135deg, #22D3EE, #3B82F6)'
              : 'linear-gradient(135deg, #8B5CF6, #A855F7)',
            boxShadow: `0 2px 8px rgba(34, 211, 238, ${mode === 'predictivo' ? '0.3' : '0.2'})`
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30 
          }}
        >
          {mode === 'predictivo' ? '🔮' : '⚡'}
        </motion.div>

        {/* CLICKABLE AREA */}
        <button
          onClick={onToggle}
          disabled={isTransitioning}
          className="absolute inset-0 w-full h-full focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          aria-label={`Cambiar a modo ${mode === 'predictivo' ? 'dinámico' : 'predictivo'}`}
        />

        {/* LABELS SUTILES CON ICONOS */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <span className={`text-xs transition-all duration-300 ${
            mode === 'predictivo' ? 'opacity-0' : 'opacity-40 text-slate-400'
          }`}>
            🔮
          </span>
          <span className={`text-xs transition-all duration-300 ${
            mode === 'dinamico' ? 'opacity-0' : 'opacity-40 text-slate-400'
          }`}>
            ⚡
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Named export para compatibilidad
export { BimodalToggle };