// src/components/exit/ActionPlanCard.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 FOCALIZAHR - ACTION PLAN CARD
// Diseño: Tesla/Apple Premium + Glassmorphism
// Flujo: 3 estados (Collapsed → Plan Visible → Resolution)
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  ChevronRight, 
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionStep {
  step: number;
  title: string;
  description: string;
  responsible: string;
  deadline: string;
  validationMetric?: string;
}

interface ActionPlanCardProps {
  /** Filosofía/contexto del plan */
  philosophy?: string;
  /** Pasos del plan de acción */
  steps: ActionStep[];
  /** Criterios de escalación */
  escalationCriteria?: string[];
  /** Si la alerta ya está resuelta */
  isResolved?: boolean;
  /** Callback cuando usuario quiere registrar acción */
  onRegisterAction: () => void;
  /** Días de seguimiento */
  followUpDays?: number;
}

type CardState = 'collapsed' | 'expanded' | 'ready';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ActionPlanCard({
  philosophy,
  steps,
  escalationCriteria = [],
  isResolved = false,
  onRegisterAction,
  followUpDays = 30
}: ActionPlanCardProps) {
  
  const [state, setState] = useState<CardState>(isResolved ? 'expanded' : 'collapsed');
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cuando se expande
  useEffect(() => {
    if (state === 'expanded' && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO 1: COLLAPSED - Solo botón de entrada
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (state === 'collapsed' && !isResolved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        {/* Línea de luz Tesla superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-px z-10"
          style={{ 
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' 
          }} 
        />
        
        <button
          onClick={() => setState('expanded')}
          className="
            w-full p-6 rounded-2xl
            bg-slate-900/60 backdrop-blur-xl
            border border-slate-700/50
            hover:border-cyan-500/30
            transition-all duration-300
            group
          "
        >
          <div className="flex items-center justify-between">
            {/* Icono + Texto */}
            <div className="flex items-center gap-4">
              <div className="
                w-12 h-12 rounded-xl
                bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                border border-cyan-500/30
                flex items-center justify-center
                group-hover:scale-105 transition-transform duration-300
              ">
                <ClipboardList className="w-6 h-6 text-cyan-400" />
              </div>
              
              <div className="text-left">
                <h3 className="text-lg font-medium text-white mb-1">
                  Plan de Acción Sugerido
                </h3>
                <p className="text-sm text-slate-400">
                  {steps.length} pasos para gestionar este indicio
                </p>
              </div>
            </div>
            
            {/* Flecha animada */}
            <div className="
              w-10 h-10 rounded-full
              bg-cyan-500/10 border border-cyan-500/30
              flex items-center justify-center
              group-hover:bg-cyan-500/20
              transition-all duration-300
            ">
              <ChevronRight className="
                w-5 h-5 text-cyan-400
                group-hover:translate-x-0.5
                transition-transform duration-300
              " />
            </div>
          </div>
          
          {/* Hint inferior */}
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-cyan-500/50" />
              Click para ver el plan de acción recomendado
            </p>
          </div>
        </button>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO 2/3: EXPANDED - Plan visible + CTA
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <motion.div
      ref={contentRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      {/* Línea de luz Tesla superior */}
      <div 
        className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ 
          background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' 
        }} 
      />
      
      {/* Card principal */}
      <div className="
        rounded-2xl overflow-hidden
        bg-slate-900/60 backdrop-blur-xl
        border border-slate-700/50
      ">
        
        {/* ─────────────────────────────────────────────────────────────────
            HEADER
            ───────────────────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="
              w-12 h-12 rounded-xl
              bg-gradient-to-br from-cyan-500/20 to-purple-500/20
              border border-cyan-500/30
              flex items-center justify-center
            ">
              <ClipboardList className="w-6 h-6 text-cyan-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white">
                Plan de Acción Sugerido
              </h3>
              <p className="text-sm text-slate-400">
                Seguimiento: {followUpDays} días
              </p>
            </div>
          </div>
        </div>
        
        {/* ─────────────────────────────────────────────────────────────────
            CONTENIDO
            ───────────────────────────────────────────────────────────────── */}
        <div className="p-6 space-y-6">
          
          {/* Filosofía/Contexto */}
          {philosophy && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="
                p-4 rounded-xl
                bg-cyan-500/5 border border-cyan-500/20
              "
            >
              <p className="text-sm text-cyan-400/90 italic leading-relaxed">
                "{philosophy}"
              </p>
            </motion.div>
          )}
          
          {/* Steps del Plan */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                className="
                  flex gap-4 p-4 rounded-xl
                  bg-slate-800/30 border border-slate-700/30
                  hover:border-slate-600/50
                  transition-colors duration-200
                "
              >
                {/* Número del paso */}
                <div className="flex-shrink-0">
                  <div className="
                    w-10 h-10 rounded-full
                    bg-gradient-to-br from-cyan-500/20 to-cyan-500/5
                    border border-cyan-500/30
                    flex items-center justify-center
                  ">
                    <span className="text-sm font-bold text-cyan-400">
                      {step.step}
                    </span>
                  </div>
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  
                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="
                      inline-flex items-center gap-1.5
                      text-xs text-slate-500
                    ">
                      <span className="text-slate-600">👤</span>
                      {step.responsible}
                    </span>
                    <span className="
                      inline-flex items-center gap-1.5
                      text-xs text-slate-500
                    ">
                      <span className="text-slate-600">⏱️</span>
                      {step.deadline}
                    </span>
                  </div>
                  
                  {/* Validación */}
                  {step.validationMetric && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30">
                      <span className="
                        inline-flex items-center gap-1.5
                        text-xs text-emerald-500/70
                      ">
                        <CheckCircle2 className="w-3 h-3" />
                        {step.validationMetric}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Criterios de Escalación */}
          {escalationCriteria.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + steps.length * 0.08 }}
              className="
                p-4 rounded-xl
                bg-amber-500/5 border border-amber-500/20
              "
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-2">
                    Escalar a Gerencia de Personas si:
                  </p>
                  <ul className="space-y-1">
                    {escalationCriteria.map((criteria, idx) => (
                      <li key={idx} className="text-xs text-slate-400">
                        • {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
          
        </div>
        
        {/* ─────────────────────────────────────────────────────────────────
            FOOTER: CTA o Estado Resuelto
            ───────────────────────────────────────────────────────────────── */}
        <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
          {isResolved ? (
            // Estado: Ya gestionada
            <div className="
              p-4 rounded-xl text-center
              bg-emerald-500/5 border border-emerald-500/20
            ">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">
                  Esta alerta ya fue gestionada
                </p>
              </div>
            </div>
          ) : (
            // CTA: Registrar acción
            <motion.button
              onClick={onRegisterAction}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="
                relative w-full py-4 px-6 rounded-xl
                bg-gradient-to-r from-cyan-500 to-cyan-400
                text-slate-900 font-semibold text-sm
                flex items-center justify-center gap-3
                shadow-lg shadow-cyan-500/25
                hover:shadow-cyan-500/40
                transition-shadow duration-300
                overflow-hidden
              "
            >
              {/* Línea de luz superior */}
              <div 
                className="absolute top-0 left-0 right-0 h-px"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' 
                }} 
              />
              
              <ClipboardList className="w-4 h-4" />
              <span>¿Qué acción tomaste? Registrar</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        
      </div>
    </motion.div>
  );
}