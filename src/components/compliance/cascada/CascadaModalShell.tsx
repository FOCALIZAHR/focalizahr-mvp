'use client';

// src/components/compliance/cascada/CascadaModalShell.tsx
// Shell común de los modales "ver más" de la cascada Ambiente Sano.
// Extraído de TriageDetailModal (Gate 3c) — UN solo lugar para el chrome:
// portal a document.body, backdrop, panel, Tesla line (color por param),
// header (título arbitrario + ✕) y contenido scrollable. Escape cierra.
//
// Consumidores: TriageDetailModal (2b) · AnatomiaDetailModal (3c).

import { memo, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface CascadaModalShellProps {
  /** Hex de la Tesla line (color por familia / cyan). */
  teslaColor: string;
  /** Bloque de título (izquierda del header) — cada modal arma el suyo. */
  header: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export default memo(function CascadaModalShell({
  teslaColor,
  header,
  onClose,
  children,
}: CascadaModalShellProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[82vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Tesla line — color por param */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
            boxShadow: `0 0 20px ${teslaColor}`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="min-w-0">{header}</div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="p-6 pt-4 overflow-y-auto max-h-[calc(82vh-92px)]">
          {children}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
});
