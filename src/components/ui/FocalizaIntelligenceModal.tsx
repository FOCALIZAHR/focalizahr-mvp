// src/components/ui/FocalizaIntelligenceModal.tsx
// ============================================================================
// MODAL BASE REUTILIZABLE - INTELIGENCIA FOCALIZAHR
// ============================================================================
// FILOSOFÍA: "El Momento Zen" - Ultra-minimalista pero completo
// 
// Este componente es el ESTÁNDAR para todos los modales de inteligencia.
// Cualquier modal que muestre "FocalizaHR detectó algo" debe usar este base.
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

import { memo, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  ChevronRight, 
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

// ============================================================================
// INTERFACES
// ============================================================================

interface DetectionInfo {
  /** Título del problema detectado (ej: "Primera Impresión") */
  title: string;
  /** Subtítulo opcional (ej: "Día 1") */
  subtitle?: string;
  /** Descripción del problema */
  description: string;
  /** Score actual */
  score?: number;
  /** Score máximo para contexto */
  maxScore?: number;
  /** Posición/ranking (ej: "#4 de 4 departamentos") */
  position?: string;
  /** Ícono personalizado para el título */
  icon?: LucideIcon;
}

interface CTAConfig {
  /** Texto del botón */
  label: string;
  /** Ícono del botón */
  icon?: LucideIcon;
  /** Acción al hacer clic */
  onClick: () => void;
}

interface CollapsibleSection {
  /** Título de la sección */
  title: string;
  /** Contenido (puede ser string o JSX) */
  content: ReactNode;
  /** ID único para control de estado */
  id: string;
}

interface FocalizaIntelligenceModalProps {
  /** Controla visibilidad */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  
  /** Nombre de la entidad afectada (departamento, gerencia, persona) */
  entityName: string;
  /** Tipo de entidad para el mensaje */
  entityType?: 'departamento' | 'gerencia' | 'área' | 'equipo' | 'persona';
  /** Mensaje personalizado (reemplaza el default "detectó un área de mejora en") */
  customMessage?: {
    before: string;  // "detectó un patrón en"
    after: string;   // "que requiere tu atención"
  };
  
  /** Información del problema detectado */
  detection?: DetectionInfo;
  
  /** Configuración del CTA principal */
  cta: CTAConfig;
  
  /** Secciones colapsables (Progressive Disclosure) */
  sections?: CollapsibleSection[];
  
  /** Fuente/metodología para el footer */
  source?: string;
  
  /** Mostrar el card de detección (default: true si detection existe) */
  showDetectionCard?: boolean;
}

// ============================================================================
// COMPONENTE COLAPSABLE INTERNO
// ============================================================================

interface CollapsibleProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const Collapsible = memo(function Collapsible({ 
  title, 
  isExpanded, 
  onToggle, 
  children 
}: CollapsibleProps) {
  return (
    <div className="border-b border-slate-700/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors min-h-[44px]"
      >
        <span className="text-slate-300 text-sm font-medium">{title}</span>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
          isExpanded ? 'rotate-90' : ''
        }`} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const FocalizaIntelligenceModal = memo(function FocalizaIntelligenceModal({
  isOpen,
  onClose,
  entityName,
  entityType = 'área',
  customMessage,
  detection,
  cta,
  sections = [],
  source,
  showDetectionCard = true
}: FocalizaIntelligenceModalProps) {
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };
  
  // Mensajes por defecto
  const messageBefore = customMessage?.before ?? 'detectó un área de mejora en';
  const messageAfter = customMessage?.after ?? 'que requiere tu atención';
  
  // Determinar si mostrar detection card
  const shouldShowDetection = showDetectionCard && detection;
  
  // Ícono del CTA
  const CTAIcon = cta.icon;
  
  // Ícono del detection
  const DetectionIcon = detection?.icon;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* ═══════════════════════════════════════════════════════════
              BACKDROP
          ═══════════════════════════════════════════════════════════ */}
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
          
          {/* ═══════════════════════════════════════════════════════════
              MODAL CONTENT
          ═══════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative z-10 w-full max-w-md mx-4
              bg-slate-900/95 
              backdrop-blur-xl
              border border-slate-700/50
              rounded-2xl
              shadow-2xl shadow-black/50
              max-h-[85vh] overflow-y-auto
            "
          >
            {/* ═══════════════════════════════════════════════════════════
                ABOVE THE FOLD - Header FocalizaHR
            ═══════════════════════════════════════════════════════════ */}
            <div className="text-center pt-8 pb-4 px-6 flex-shrink-0">
              
              {/* Icono Inteligencia */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <BrainCircuit 
                  className="w-10 h-10 text-purple-400" 
                  strokeWidth={1.5} 
                />
              </motion.div>
              
              {/* Título FocalizaHR */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
                  Inteligencia
                </h1>
                <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  FocalizaHR
                </h1>
              </motion.div>
              
              {/* Línea decorativa Tesla */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="flex items-center justify-center gap-3 my-5"
              >
                <div className="h-px w-12 bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="h-px w-12 bg-white/20" />
              </motion.div>
              
              {/* Mensaje contextual */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="space-y-1 mb-4"
              >
                <p className="text-base text-slate-400 font-light">
                  {messageBefore}
                </p>
                <p className="text-base md:text-lg text-white font-medium">
                  {entityName}
                </p>
                <p className="text-base text-slate-400 font-light">
                  {messageAfter}
                </p>
              </motion.div>
            </div>
            
            {/* ═══════════════════════════════════════════════════════════
                DETECTION CARD (opcional)
            ═══════════════════════════════════════════════════════════ */}
            {shouldShowDetection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mx-6 mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 flex-shrink-0"
              >
                <div className="flex items-center gap-3 mb-2">
                  {DetectionIcon && (
                    <DetectionIcon className="w-5 h-5 text-cyan-400" />
                  )}
                  <span className="text-white font-medium">{detection.title}</span>
                  {detection.subtitle && (
                    <span className="text-slate-500 text-sm">{detection.subtitle}</span>
                  )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {detection.description}
                </p>
                {(detection.score !== undefined || detection.position) && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    {detection.score !== undefined && (
                      <span>Score: {detection.score}{detection.maxScore ? `/${detection.maxScore}` : ''}</span>
                    )}
                    {detection.score !== undefined && detection.position && (
                      <span>·</span>
                    )}
                    {detection.position && (
                      <span>{detection.position}</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                CTA PRINCIPAL - PremiumButton FocalizaHR
            ═══════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldShowDetection ? 0.5 : 0.4, duration: 0.5 }}
              className="px-6 mb-4 flex-shrink-0"
            >
              <PrimaryButton
                icon={CTAIcon}
                iconPosition="left"
                fullWidth
                size="lg"
                glow={true}
                onClick={() => {
                  cta.onClick();
                  onClose();
                }}
              >
                {cta.label}
              </PrimaryButton>
            </motion.div>
            
            {/* ═══════════════════════════════════════════════════════════
                PROGRESSIVE DISCLOSURE (secciones colapsables)
            ═══════════════════════════════════════════════════════════ */}
            {sections.length > 0 && (
              <div className="border-t border-slate-700/50 overflow-y-auto flex-1">
                {sections.map((section) => (
                  <Collapsible
                    key={section.id}
                    title={section.title}
                    isExpanded={expandedSection === section.id}
                    onToggle={() => toggleSection(section.id)}
                  >
                    {typeof section.content === 'string' ? (
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {section.content}
                      </p>
                    ) : (
                      section.content
                    )}
                  </Collapsible>
                ))}
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════ */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full text-center text-slate-500 hover:text-slate-300 text-sm transition-colors min-h-[44px]"
              >
                Cerrar
              </button>
              {source && (
                <div className="mt-2 text-center text-xs text-slate-600 flex items-center justify-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Fuente: {source}
                </div>
              )}
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FocalizaIntelligenceModal;

// ============================================================================
// COMPONENTES AUXILIARES EXPORTADOS
// ============================================================================

/**
 * Contenedor para NPS dentro de sección colapsable
 */
interface NPSAmplifierProps {
  score: number;
  label: string;
}

export const NPSAmplifier = memo(function NPSAmplifier({ score, label }: NPSAmplifierProps) {
  const isPositive = score >= 30;
  const isNegative = score < 0;
  
  return (
    <div className={`p-3 rounded-lg border ${
      isPositive 
        ? 'bg-cyan-500/10 border-cyan-500/20' 
        : isNegative
        ? 'bg-red-500/10 border-red-500/20'
        : 'bg-slate-700/30 border-slate-600/30'
    }`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded-full flex items-center justify-center ${
          isPositive ? 'bg-cyan-400/20' : 
          isNegative ? 'bg-red-400/20' : 'bg-slate-400/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isPositive ? 'bg-cyan-400' : 
            isNegative ? 'bg-red-400' : 'bg-slate-400'
          }`} />
        </div>
        <div className="text-sm">
          <p className="text-white font-medium mb-1">
            {isPositive ? 'Y aún tienes tiempo' : 
             isNegative ? 'Ya se está notando afuera' : 
             'Momento de actuar'}
          </p>
          <p className="text-slate-400">
            NPS: {score > 0 ? '+' : ''}{score} ({label})
          </p>
        </div>
      </div>
    </div>
  );
});

/**
 * Grid de dimensiones para sección colapsable
 */
interface Dimension {
  day: number;
  name: string;
  score: number | null;
  description: string;
  isWeakest?: boolean;
}

interface DimensionsGridProps {
  dimensions: Dimension[];
}

export const DimensionsGrid = memo(function DimensionsGrid({ dimensions }: DimensionsGridProps) {
  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <div 
          key={dim.day}
          className={`flex items-start gap-3 ${dim.isWeakest ? '' : 'opacity-60'}`}
        >
          <div className="w-12 text-slate-500 text-xs pt-0.5">
            Día {dim.day}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{dim.name}</span>
              <span className={`font-semibold ${
                dim.score === null ? 'text-slate-600' :
                dim.score < 40 ? 'text-red-400' :
                dim.score < 60 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {dim.score ?? '—'}
              </span>
              {dim.isWeakest && (
                <span className="text-[10px] text-cyan-400">← Foco</span>
              )}
            </div>
            <p className="text-slate-500 text-xs">{dim.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
});