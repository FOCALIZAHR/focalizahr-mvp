// src/components/exit/OpportunityToggle.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TOGGLE: Tu Alerta vs Autopsia Real
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Skull } from 'lucide-react';

export type OpportunityMode = 'alerta' | 'autopsia';

interface OpportunityToggleProps {
  mode: OpportunityMode;
  onModeChange: (mode: OpportunityMode) => void;
  disabled?: boolean;
}

export default memo(function OpportunityToggle({
  mode,
  onModeChange,
  disabled = false
}: OpportunityToggleProps) {
  const isAlerta = mode === 'alerta';
  
  return (
    <div className="flex justify-center mb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: '320px',
          height: '48px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(71, 85, 105, 0.3)'
        }}
      >
        {/* Línea superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: isAlerta 
              ? 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
              : 'linear-gradient(90deg, transparent, #A78BFA, transparent)'
          }}
        />
        
        {/* Slider */}
        <motion.div
          className="absolute top-1 rounded-xl"
          style={{
            width: '152px',
            height: '40px',
            background: isAlerta ? '#22D3EE' : '#A78BFA',
            boxShadow: isAlerta
              ? '0 4px 20px rgba(34, 211, 238, 0.3)'
              : '0 4px 20px rgba(167, 139, 250, 0.3)'
          }}
          animate={{ x: isAlerta ? 4 : 164 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        {/* Botones */}
        <div className="absolute inset-0 flex items-center">
          <button
            onClick={() => onModeChange('alerta')}
            disabled={disabled}
            className="relative z-10 flex items-center justify-center gap-2 w-1/2 h-full transition-colors"
            style={{
              color: isAlerta ? 'rgba(15, 23, 42, 0.95)' : 'rgba(148, 163, 184, 0.7)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <Building2 className="w-4 h-4" />
            <span>Tu Alerta</span>
          </button>
          
          <button
            onClick={() => onModeChange('autopsia')}
            disabled={disabled}
            className="relative z-10 flex items-center justify-center gap-2 w-1/2 h-full transition-colors"
            style={{
              color: !isAlerta ? 'rgba(15, 23, 42, 0.95)' : 'rgba(148, 163, 184, 0.7)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <Skull className="w-4 h-4" />
            <span>Autopsia Real</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
});