// src/components/exit/CollapsibleSection.tsx
// 🎯 Sección colapsable con glassmorphism y línea decorativa

'use client';

import { memo, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  /** Título de la sección */
  title: string;
  /** Ícono (componente React) */
  icon: ReactNode;
  /** Contenido de la sección */
  children: ReactNode;
  /** Abierto por defecto */
  defaultOpen?: boolean;
}

export default memo(function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl
      "
    >
      {/* Header clickeable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full p-5 flex items-center justify-between 
          hover:bg-slate-800/30 transition-colors
          focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:ring-inset
        "
      >
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">{icon}</span>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      
      {/* Contenido animado */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5">
              {/* Línea decorativa ── • ── */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-700" />
              </div>
              
              {/* Contenido */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});