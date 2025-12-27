// src/components/exit/FocalizaIntelligenceAlertModal.tsx
// ============================================================================
// MODAL INTERMEDIO - INTELIGENCIA FOCALIZAHR
// ============================================================================
// FILOSOFÍA: Ultra-minimalista. "El Momento Zen"
// 
// NO repite información que el usuario ya vio en la lista.
// SÍ crea una pausa elegante y posiciona la marca.
// 
// Solo 3 elementos: Título + Mensaje + CTA
//
// ============================================================================
// 📱 MOBILE-FIRST COMPLIANCE
// ============================================================================
// ✅ Base = Mobile (375px)
// ✅ Touch targets = 44px mínimo (botones)
// ✅ Textos legibles sin zoom (16px base)
// ✅ Sin scroll horizontal
// ✅ Breakpoints: base → md (768px)
// ============================================================================

'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import type { ExitAlertType } from '@/types/exit';

// ============================================================================
// INTERFACES
// ============================================================================

interface FocalizaIntelligenceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: string;
  alertType: ExitAlertType;
  departmentName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const FocalizaIntelligenceAlertModal = memo(function FocalizaIntelligenceAlertModal({
  isOpen,
  onClose,
  alertId,
  departmentName
}: FocalizaIntelligenceAlertModalProps) {
  
  const router = useRouter();
  
  const handleNavigate = () => {
    onClose();
    router.push(`/dashboard/exit/alerts/${alertId}`);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />
          
          {/* Efectos de fondo sutiles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
          </div>
          
          {/* Modal Content - Elegante y Contenido */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="
              relative z-10 w-full max-w-sm mx-4
              bg-slate-900/90 
              backdrop-blur-xl
              border border-slate-600/50
              rounded-2xl
              shadow-2xl shadow-black/50
            "
          >
            <div className="text-center py-10 px-5 md:py-12 md:px-8">
              
              {/* ═══════════════════════════════════════════════════════════
                  ELEMENTO 1: Icono + Título Principal
                  ═══════════════════════════════════════════════════════════ */}
              
              {/* Icono Inteligencia */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.5 }}
                className="flex justify-center mb-5"
              >
                <BrainCircuit 
                  className="w-10 h-10 text-purple-400" 
                  strokeWidth={1.5} 
                />
              </motion.div>
              
              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-tight leading-tight">
                  Inteligencia
                </h1>
                <h1 className="text-3xl md:text-4xl font-extralight tracking-tight leading-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  FocalizaHR
                </h1>
              </motion.div>
              
              {/* Línea decorativa */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex items-center justify-center gap-3 my-6 md:my-8"
              >
                <div className="h-px w-10 md:w-12 bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="h-px w-10 md:w-12 bg-white/20" />
              </motion.div>
              
              {/* ═══════════════════════════════════════════════════════════
                  ELEMENTO 2: Mensaje con Departamento
                  ═══════════════════════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="space-y-1 mb-8 md:mb-10"
              >
                <p className="text-base md:text-lg text-slate-400 font-light">
                  detectó un patrón en
                </p>
                <p className="text-base md:text-lg text-white font-medium">
                  {departmentName}
                </p>
                <p className="text-base md:text-lg text-slate-400 font-light">
                  que requiere tu atención
                </p>
              </motion.div>
              
              {/* ═══════════════════════════════════════════════════════════
                  ELEMENTO 3: CTA Principal
                  ═══════════════════════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Botón con glow - min-h-[44px] garantiza touch target */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  
                  <button
                    onClick={handleNavigate}
                    className="
                      relative flex items-center justify-center gap-2 
                      px-6 md:px-8 
                      min-h-[44px] py-3
                      rounded-full 
                      bg-cyan-500 
                      text-white font-medium
                      transition-all duration-300 
                      hover:bg-cyan-400
                      hover:shadow-lg hover:shadow-cyan-500/25 
                      hover:scale-[1.02] 
                      active:scale-100
                    "
                  >
                    Gestionar Alerta
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Cerrar - min-h-[44px] garantiza touch target en móvil */}
                <button
                  onClick={onClose}
                  className="min-h-[44px] px-4 flex items-center justify-center text-slate-600 hover:text-slate-400 text-sm transition-colors duration-300"
                >
                  Cerrar
                </button>
              </motion.div>
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FocalizaIntelligenceAlertModal;