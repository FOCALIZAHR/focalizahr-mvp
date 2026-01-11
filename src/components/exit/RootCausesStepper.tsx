'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT CAUSES STEPPER - NARRATIVA EN 3 ACTOS
// ═══════════════════════════════════════════════════════════════════════════════
// Archivo: src/components/exit/RootCausesStepper.tsx
// Versión: 1.0
// Fecha: Enero 2025
// Propósito: Contenedor con stepper narrativo que muestra los 3 componentes
//            de análisis de causas raíz en secuencia, aprovechando 100% del
//            espacio disponible para cada acto.
// UX Pattern: Progressive Disclosure + Wizard/Stepper
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  Users, 
  Target,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

import VeredictCard from './VeredictCard';
import ConsensusCard, { type FactorData } from './ConsensusCard';
import PriorityMatrixCard from './PriorityMatrixCard';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

type StepId = 'veredict' | 'consensus' | 'matrix';

interface Step {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: typeof Scale;
  description: string;
}

interface TopFactor {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
}

interface RootCausesStepperProps {
  // Datos
  topFactor: TopFactor | null;
  factors: FactorData[];
  totalExits: number;
  periodLabel?: string;
  avgSalaryCLP?: number;
  
  // Callbacks
  onInvestigate?: () => void;
  onFactorClick?: (factor: string, quadrant: string) => void;
  
  // Estado
  isLoading?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PASOS
// ═══════════════════════════════════════════════════════════════════════════════

const STEPS: Step[] = [
  {
    id: 'veredict',
    label: 'Veredicto',
    shortLabel: 'Veredicto',
    icon: Scale,
    description: ''
  },
  {
    id: 'consensus',
    label: 'Patrón',
    shortLabel: 'Patrón',
    icon: Users,
    description: ''
  },
  {
    id: 'matrix',
    label: 'Matriz',
    shortLabel: 'Matriz',
    icon: Target,
    description: ''
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Indicador de paso individual
 */
const StepIndicatorItem = memo(function StepIndicatorItem({
  step,
  index,
  isActive,
  isCompleted,
  onClick
}: {
  step: Step;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300
        ${isActive 
          ? 'bg-slate-800/60 border border-slate-600/50' 
          : 'hover:bg-slate-800/30 border border-transparent'
        }
      `}
    >
      {/* Círculo con icono */}
      <div 
        className={`
          w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
          ${isActive 
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
            : isCompleted
              ? 'bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/20'
              : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
          }
        `}
      >
        {isCompleted && !isActive ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
      </div>
      
      {/* Label - solo en desktop */}
      <span className={`
        hidden sm:block text-sm transition-colors duration-300
        ${isActive ? 'text-white font-medium' : 'text-slate-400'}
      `}>
        {step.shortLabel}
      </span>
    </button>
  );
});

/**
 * Línea conectora entre pasos
 */
const StepConnector = memo(function StepConnector({
  isCompleted
}: {
  isCompleted: boolean;
}) {
  return (
    <div className="hidden sm:flex items-center w-8 mx-1">
      <div 
        className={`
          h-px w-full transition-all duration-500
          ${isCompleted 
            ? 'bg-cyan-500/50' 
            : 'bg-slate-700/50'
          }
        `}
      />
    </div>
  );
});

/**
 * Barra de indicadores de pasos
 */
const StepIndicator = memo(function StepIndicator({
  steps,
  activeIndex,
  onStepClick
}: {
  steps: Step[];
  activeIndex: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-3 px-4 border-b border-slate-700/30">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <StepIndicatorItem
            step={step}
            index={index}
            isActive={index === activeIndex}
            isCompleted={index < activeIndex}
            onClick={() => onStepClick(index)}
          />
          
          {index < steps.length - 1 && (
            <StepConnector isCompleted={index < activeIndex} />
          )}
        </div>
      ))}
    </div>
  );
});

/**
 * Navegación inferior
 */
const StepNavigation = memo(function StepNavigation({
  currentStep,
  totalSteps,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  canPrev,
  canNext
}: {
  currentStep: number;
  totalSteps: number;
  prevLabel?: string;
  nextLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-slate-700/30">
      {/* Botón Anterior - Ghost minimalista */}
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
          transition-all duration-200
          ${canPrev 
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
            : 'text-slate-600 cursor-not-allowed'
          }
        `}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{prevLabel || 'Anterior'}</span>
      </button>
      
      {/* Indicador de paso - dots minimalistas */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${i === currentStep 
                ? 'bg-cyan-400 w-5' 
                : i < currentStep
                  ? 'bg-cyan-400/40 w-1.5'
                  : 'bg-slate-600 w-1.5'
              }
            `}
          />
        ))}
      </div>
      
      {/* Botón Siguiente - Primary compacto */}
      <button
        onClick={onNext}
        disabled={!canNext}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${canNext 
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30' 
            : 'text-slate-600 cursor-not-allowed'
          }
        `}
      >
        <span className="hidden sm:inline">{nextLabel || 'Siguiente'}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

/**
 * Animación de transición entre pasos
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function RootCausesStepper({
  topFactor,
  factors,
  totalExits,
  periodLabel = 'Q4 2024',
  avgSalaryCLP = 1_600_000,
  onInvestigate,
  onFactorClick,
  isLoading = false,
  className = ''
}: RootCausesStepperProps) {
  
  // Estado del paso activo
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const activeStep = STEPS[activeIndex];
  
  // Navegación
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < STEPS.length) {
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    }
  }, [activeIndex]);
  
  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex(prev => prev - 1);
    }
  }, [activeIndex]);
  
  const goToNext = useCallback(() => {
    if (activeIndex < STEPS.length - 1) {
      setDirection(1);
      setActiveIndex(prev => prev + 1);
    }
  }, [activeIndex]);
  
  // Labels de navegación
  const navLabels = useMemo(() => ({
    prev: activeIndex > 0 ? STEPS[activeIndex - 1].shortLabel : undefined,
    next: activeIndex < STEPS.length - 1 ? STEPS[activeIndex + 1].shortLabel : undefined
  }), [activeIndex]);
  
  // Handler para el CTA del VeredictCard
  const handleInvestigate = useCallback(() => {
    // Ir al paso de consenso para ver más detalle
    goToStep(1);
    onInvestigate?.();
  }, [goToStep, onInvestigate]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  
  return (
    <div 
      className={`
        fhr-card-static relative overflow-hidden flex flex-col
        min-h-[400px] h-full
        ${className}
      `}
    >
      {/* Tesla line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #A78BFA 70%, transparent 100%)'
        }}
      />
      <div 
        className="absolute top-[2px] left-0 right-0 h-12 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.08) 0%, transparent 100%)'
        }}
      />
      
      {/* Step Indicator */}
      <StepIndicator
        steps={STEPS}
        activeIndex={activeIndex}
        onStepClick={goToStep}
      />
      
      {/* Contenido del paso activo - 100% del espacio */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 p-3 sm:p-4 lg:p-6 overflow-y-auto"
          >
            {activeStep.id === 'veredict' && (
              <VeredictCard
                factors={factors}
                totalExits={totalExits}
                periodLabel={periodLabel}
                onInvestigate={handleInvestigate}
                isLoading={isLoading}
              />
            )}
            
            {activeStep.id === 'consensus' && (
              <ConsensusCard
                factors={factors}
                totalExits={totalExits}
                avgSalaryCLP={avgSalaryCLP}
                maxFactorsVisible={6}
                isLoading={isLoading}
              />
            )}
            
            {activeStep.id === 'matrix' && (
              <PriorityMatrixCard
                factors={factors}
                totalExits={totalExits}
                onFactorClick={onFactorClick}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navegación */}
      <StepNavigation
        currentStep={activeIndex}
        totalSteps={STEPS.length}
        prevLabel={navLabels.prev}
        nextLabel={navLabels.next}
        onPrev={goToPrev}
        onNext={goToNext}
        canPrev={activeIndex > 0}
        canNext={activeIndex < STEPS.length - 1}
      />
    </div>
  );
});