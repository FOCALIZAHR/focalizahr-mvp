'use client';

// src/app/dashboard/clima/components/planes/ClimaCheckout.tsx
// ════════════════════════════════════════════════════════════════════════════
// Acto 4 · Checkout Ejecutivo (5D-i) — modal de cierre tras aprobar el plan.
// Molde: CloseCycleModal (goals Gate D.5) — fhr-card-static + línea Tesla, SIN
// wizard multi-acto. Tono: compromiso de gestión serio (no celebración: sin
// confetti ni Trophy). Contenido: resumen de lo decidido + hito de 30 días (el
// recordatorio real que ClimaActionLogService ya agenda) + un solo CTA de salida
// al carrusel. Filosofía de cierre = CheckoutPanel LEY 4 (el sistema mide, el
// humano no reporta).
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CalendarClock, Info } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import type { ClimaDecisionItem } from '@/types/clima-planes';

// Copy aprobado (Victor). Hover sobre "Seguimiento Focalizado" en el hito de 30 días.
const SEGUIMIENTO_FOCALIZADO_COPY =
  'Re-medición opcional con foco exclusivo por área. En lugar de repetir la encuesta ' +
  'completa a toda la organización, cada equipo responde únicamente sobre su brecha ' +
  'crítica y su fortaleza clave para validar el impacto de las decisiones.';

interface ClimaCheckoutProps {
  open: boolean;
  /** Decisiones del plan (ya decididas al aprobar) — de acá sale el resumen. */
  decisiones: ClimaDecisionItem[];
  /** Cierra el checkout y navega al Lobby (gauge + Zona Crítica). El plan quedó
   *  100% aprobado, así que volver al carrusel (todo read-only) sería un callejón. */
  onExit: () => void;
}

export default function ClimaCheckout({ open, decisiones, onExit }: ClimaCheckoutProps) {
  const [tipOpen, setTipOpen] = useState(false);

  // Breakdown de lo decidido (sin jerga en pantalla: nunca "ClimaActionLog").
  const enCurso = decisiones.filter(
    (d) => d.ceoDecision === 'aceptar' || d.ceoDecision === 'modificar'
  ).length;
  const pospuestas = decisiones.filter((d) => d.ceoDecision === 'pospuesto').length;
  const descartadas = decisiones.filter((d) => d.ceoDecision === 'rechazar').length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop — sin cerrar al click afuera: el cierre es una acción explícita. */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            className="fhr-card-static relative overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col p-0"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          >
            {/* Línea Tesla */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                opacity: 0.7,
              }}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 md:px-8 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
                    Plan <span className="fhr-title-gradient">aprobado</span>
                  </h2>
                  <p className="text-sm font-light text-slate-400 mt-1">
                    Compromiso de gestión registrado.
                  </p>
                </div>
              </div>
              <button
                onClick={onExit}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-2 md:px-8">
              {/* Resumen de lo decidido */}
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-2">
                Lo que quedó decidido
              </p>
              <ul className="space-y-1.5 text-sm font-light text-slate-400">
                <li>
                  <span className="text-white tabular-nums text-base">{enCurso}</span>{' '}
                  {enCurso === 1 ? 'acción en curso' : 'acciones en curso'}
                </li>
                {pospuestas > 0 && (
                  <li>
                    <span className="text-white tabular-nums text-base">{pospuestas}</span>{' '}
                    {pospuestas === 1
                      ? 'pospuesta para el próximo ciclo'
                      : 'pospuestas para el próximo ciclo'}
                  </li>
                )}
                {descartadas > 0 && (
                  <li>
                    <span className="text-white tabular-nums text-base">{descartadas}</span>{' '}
                    {descartadas === 1 ? 'descartada' : 'descartadas'}
                  </li>
                )}
              </ul>

              {/* Hito de 30 días */}
              <div className="mt-6 rounded-xl border border-slate-800/40 bg-slate-900/40 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-4 h-4 text-cyan-400/70 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-light text-slate-300 leading-relaxed">
                    En 30 días, un recordatorio para validar el impacto en un{' '}
                    <span
                      onMouseEnter={() => setTipOpen(true)}
                      onMouseLeave={() => setTipOpen(false)}
                      className="whitespace-nowrap"
                    >
                      <span className="text-cyan-300/90 underline decoration-dotted decoration-cyan-500/40 underline-offset-2 cursor-help">
                        Seguimiento Focalizado
                      </span>
                      <Info className="inline w-3 h-3 ml-0.5 text-slate-500 align-text-top" />
                    </span>
                  </p>
                </div>
                {/* Nota explicativa: se despliega DEBAJO del párrafo, dentro de la card —
                    nunca tapa el texto que explica ni se corta contra el borde del modal. */}
                <AnimatePresence>
                  {tipOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden text-[11px] font-light text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/40"
                    >
                      {SEGUIMIENTO_FOCALIZADO_COPY}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Cierre — filosofía CheckoutPanel LEY 4: el sistema mide, el humano no reporta. */}
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-6">
                De acá en más, el sistema mide el impacto. No hay nada que reportar.
              </p>
            </div>

            {/* CTA único de salida */}
            <div className="px-6 py-5 md:px-8 shrink-0">
              <PrimaryButton fullWidth onClick={onExit}>
                Volver al Lobby
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
