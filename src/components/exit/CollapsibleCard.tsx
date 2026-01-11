// ====================================================================
// COLLAPSIBLE CARD - Componente Reutilizable
// src/components/exit/CollapsibleCard.tsx
// v2.0 - MOBILE FIRST - Touch targets correctos
//
// FILOSOFÍA:
// - Touch targets mínimo 44px
// - Progressive disclosure
// - Animación suave con framer-motion
// ====================================================================

'use client';

import { memo, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, LucideIcon } from 'lucide-react';

// ====================================================================
// TYPES
// ====================================================================

interface CollapsibleCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default memo(function CollapsibleCard({
  title,
  icon: Icon,
  iconColor = 'text-slate-400',
  defaultOpen = false,
  children
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header clickeable - Touch target mínimo 44px */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full min-h-[52px] px-4 lg:px-6 py-3 lg:py-4
          flex items-center justify-between gap-3
          hover:bg-white/[0.02] active:bg-white/[0.04]
          transition-colors
          touch-manipulation
        "
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="p-1.5 lg:p-2 bg-slate-800/50 rounded-lg flex-shrink-0">
              <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.5} />
            </div>
          )}
          <span className="text-sm lg:text-base text-white font-medium truncate">
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 p-1"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Contenido colapsable */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 lg:px-6 pb-4 lg:pb-6 border-t border-slate-700/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
