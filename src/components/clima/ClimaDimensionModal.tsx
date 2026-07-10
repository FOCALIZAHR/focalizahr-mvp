'use client';

// src/components/clima/ClimaDimensionModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Modal que hospeda ClimaDimensionDetail (mismo componente rico que las Cards).
// Clon del shell de CompensacionModal (createPortal + backdrop + glow ambiental +
// spring + Esc-close). El "card" es el propio ClimaDimensionDetail (ya trae shell
// + Tesla line canónicos) → sin doble-chrome; el modal solo aporta el overlay y
// el botón de cierre. Lo abre el ClimaToolbar al clickear una dimensión (§8.2).
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ClimaDimensionDetail from '@/components/clima/ClimaDimensionDetail';
import type { ClimaDimensionAgg } from '@/lib/utils/aggregateClimaDimension';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface ClimaDimensionModalProps {
  dimension: ClimaDimensionAgg | null; // null = cerrado
  departments: ClimaDepartmentInsight[];
  onClose: () => void;
}

export default function ClimaDimensionModal({
  dimension,
  departments,
  onClose,
}: ClimaDimensionModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = (
    <AnimatePresence>
      {dimension && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
          </div>

          {/* Card = ClimaDimensionDetail */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white bg-black/20 backdrop-blur border border-white/5 hover:border-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <ClimaDimensionDetail dimension={dimension} departments={departments} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
