// src/components/exit/ExitAlertDetailModal.tsx
// ============================================================================
// EXIT ALERT DETAIL MODAL - v1.0
// ============================================================================
// Modal de asesoría ejecutiva para alertas Exit Intelligence
// 8 secciones: Header + 6 colapsables + Resolución
// Filosofía: ANÓNIMO - Solo departamento, nunca persona individual
// ============================================================================

'use client';

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from '@/components/ui/dialog';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  Search,
  Gem,
  DollarSign,
  ClipboardList,
  BookOpen,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  ArrowRight,
  Flame,
  FileText,
  Scale,
  TrendingDown,
  Building2,
  Shield,
  Clock,
  Check,
  X,
  Rocket
} from 'lucide-react';

// Types
import type { ExitBusinessCase } from '@/types/ExitBusinessCase';
import type { ExitAlertWithRelations } from '@/types/exit';

// ============================================================================
// TYPES
// ============================================================================

interface ExitAlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (notes: string) => Promise<void>;
  businessCase: ExitBusinessCase;
  alert: ExitAlertWithRelations;
}

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColorClass?: string;
  bgColorClass?: string;
  isExpanded: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// SEVERITY CONFIG
// ============================================================================

const SEVERITY_CONFIG = {
  critical: {
    color: 'red',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    glowClass: 'shadow-red-500/20'
  },
  high: {
    color: 'orange',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    glowClass: 'shadow-orange-500/20'
  },
  medium: {
    color: 'amber',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    glowClass: 'shadow-amber-500/20'
  },
  low: {
    color: 'blue',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    glowClass: 'shadow-blue-500/20'
  }
};

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================

const CollapsibleSection = memo(function CollapsibleSection({
  id,
  title,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-cyan-400',
  bgColorClass = 'bg-cyan-500/10',
  isExpanded,
  onToggle,
  highlight = false,
  children
}: CollapsibleSectionProps) {
  return (
    <div className={`
      bg-slate-800/30 backdrop-blur-sm 
      border rounded-xl overflow-hidden
      transition-all duration-300
      ${highlight 
        ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
        : 'border-slate-700/50 hover:border-slate-600/50'
      }
    `}>
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${bgColorClass} rounded-lg`}>
            <Icon className={`h-5 w-5 ${iconColorClass}`} />
          </div>
          <div className="text-left">
            <h4 className="text-base font-semibold text-white">{title}</h4>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Contenido animado */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-700/30 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// PROGRESSION STAGES (Diagrama Oportunidad de Oro)
// ============================================================================

const ProgressionStages = memo(function ProgressionStages({
  currentStage = 0,
  currentLabel = 'Ustedes están AQUÍ'
}: {
  currentStage?: number;
  currentLabel?: string;
}) {
  const stages = [
    { label: 'INDICIOS', icon: Search, color: 'cyan' },
    { label: 'Denuncia', icon: FileText, color: 'amber' },
    { label: 'Tutela', icon: Scale, color: 'orange' },
    { label: 'ESCÁNDALO', icon: Flame, color: 'red' }
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Línea conectora de fondo */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-700/50 -translate-y-1/2 z-0" />
        
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isCurrentStage = index === currentStage;
          const isPast = index < currentStage;
          const isFuture = index > currentStage;
          
          return (
            <div 
              key={stage.label}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Círculo con icono */}
              <motion.div
                animate={isCurrentStage ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${isCurrentStage 
                    ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/30' 
                    : isPast
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-slate-800/50 border-slate-600/50'
                  }
                `}
              >
                <Icon className={`
                  w-5 h-5
                  ${isCurrentStage 
                    ? 'text-cyan-400' 
                    : isPast 
                      ? 'text-green-400'
                      : stage.color === 'red' 
                        ? 'text-red-500/60' 
                        : 'text-slate-500'
                  }
                `} />
              </motion.div>
              
              {/* Label */}
              <span className={`
                text-xs mt-2 font-medium text-center max-w-[70px]
                ${isCurrentStage 
                  ? 'text-cyan-400' 
                  : isPast 
                    ? 'text-green-400'
                    : 'text-slate-500'
                }
              `}>
                {stage.label}
              </span>
              
              {/* Indicador "AQUÍ" */}
              {isCurrentStage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-8 bg-cyan-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  {currentLabel}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// COST SPECTRUM VISUAL
// ============================================================================

const CostSpectrumVisual = memo(function CostSpectrumVisual({
  spectrum
}: {
  spectrum: ExitBusinessCase['costSpectrum'];
}) {
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString('es-CL')}`;
  };

  return (
    <div className="space-y-3">
      {/* Nivel Verde - Actuar Ahora */}
      <div className="flex items-stretch gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="w-1.5 bg-green-500 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-green-400 font-medium text-sm">
              {spectrum.actNow.label}
            </span>
            <span className="text-green-400 font-bold text-lg">
              {formatCurrency(spectrum.actNow.cost)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {spectrum.actNow.description}
          </p>
        </div>
      </div>
      
      {/* Nivel Amarillo - Tutela */}
      <div className="flex items-stretch gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <div className="w-1.5 bg-amber-500 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-amber-400 font-medium text-sm">
              {spectrum.escalateTutela.label}
            </span>
            <span className="text-amber-400 font-bold text-lg">
              {formatCurrency(spectrum.escalateTutela.costMin)} - {formatCurrency(spectrum.escalateTutela.costMax)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {spectrum.escalateTutela.description}
          </p>
        </div>
      </div>
      
      {/* Nivel Rojo - Escándalo */}
      <div className="flex items-stretch gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-1.5 bg-red-500 rounded-full" 
        />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-red-400 font-medium text-sm">
              {spectrum.escalateScandal.label}
            </span>
            <span className="text-red-500 font-bold text-xl">
              INCALCULABLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {spectrum.escalateScandal.description}
          </p>
          {spectrum.escalateScandal.reference && (
            <p className="text-xs text-red-400/60 italic mt-2">
              "{spectrum.escalateScandal.reference}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// PRODUCT SUGGESTION (Info only, no button)
// ============================================================================

const ProductSuggestion = memo(function ProductSuggestion({
  product
}: {
  product: {
    name: string;
    description: string;
    cta: string;
  };
}) {
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-cyan-500/20 rounded-lg">
          <Rocket className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
          Producto Sugerido
        </span>
      </div>
      <h5 className="text-sm font-semibold text-white mb-1">
        {product.name}
      </h5>
      <p className="text-xs text-slate-400 leading-relaxed">
        {product.description}
      </p>
    </div>
  );
});

// ============================================================================
// EMBLEMATIC CASE CARD
// ============================================================================

const EmblamaticCaseCard = memo(function EmblamaticCaseCard({
  caso
}: {
  caso: ExitBusinessCase['emblamaticCases']['cases'][0];
}) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-white">{caso.company}</span>
        <span className="text-xs text-slate-500">({caso.year})</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{caso.incident}</p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-400 font-bold">{caso.cost}</span>
        <span className="text-xs text-slate-500">•</span>
        <span className="text-xs text-slate-400">{caso.consequence}</span>
      </div>
      <p className="text-xs text-amber-400/80 italic">"{caso.lesson}"</p>
    </div>
  );
});

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export function ExitAlertDetailModal({
  isOpen,
  onClose,
  onResolve,
  businessCase,
  alert
}: ExitAlertDetailModalProps) {
  
  // ========================================
  // STATE
  // ========================================
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    detection: true,
    goldenOpportunity: true,
    emblamaticCases: false,
    costSpectrum: false,
    actionPlan: true,
    methodology: false
  });
  
  const [selectedQuickPick, setSelectedQuickPick] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resolutionSectionRef = useRef<HTMLDivElement>(null);
  
  // ========================================
  // DERIVED STATE
  // ========================================
  
  const severityConfig = SEVERITY_CONFIG[businessCase.header.severity as keyof typeof SEVERITY_CONFIG] 
    || SEVERITY_CONFIG.medium;
  
  const canSubmit = useMemo(() => {
    if (selectedQuickPick) return true;
    if (showCustomInput && customNotes.trim().length >= 10) return true;
    return false;
  }, [selectedQuickPick, showCustomInput, customNotes]);
  
  const finalNotes = useMemo(() => {
    if (selectedQuickPick) {
      return showCustomInput && customNotes.trim() 
        ? `${selectedQuickPick}\n\nNotas adicionales: ${customNotes.trim()}`
        : selectedQuickPick;
    }
    return customNotes.trim();
  }, [selectedQuickPick, showCustomInput, customNotes]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  const handleQuickPickSelect = useCallback((pick: string) => {
    if (selectedQuickPick === pick) {
      setSelectedQuickPick(null);
    } else {
      setSelectedQuickPick(pick);
    }
  }, [selectedQuickPick]);
  
  const handleResolve = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onResolve(finalNotes);
      // onClose se ejecuta automáticamente en el parent
    } catch (error) {
      console.error('[ExitAlertDetailModal] Error resolviendo:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, finalNotes, onResolve]);
  
  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);
  
  // ========================================
  // FORMATTERS
  // ========================================
  
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString('es-CL')}`;
  };
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`
          w-[95vw] max-w-3xl 
          bg-slate-900/95 backdrop-blur-xl
          border-2 ${severityConfig.borderClass}
          shadow-2xl ${severityConfig.glowClass}
          max-h-[90vh] overflow-hidden
          p-0 gap-0
        `}
        showCloseButton={false}
      >
        {/* DialogTitle para accesibilidad */}
        <DialogTitle className="sr-only">
          Alerta Exit Intelligence - {alert.department?.displayName || 'Departamento'}
        </DialogTitle>
        
        {/* ════════════════════════════════════════════════════════════════
            HEADER FIJO - Severidad + Riesgo
            ════════════════════════════════════════════════════════════════ */}
        <div className={`
          px-6 py-5
          bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900
          border-b ${severityConfig.borderClass}
        `}>
          <div className="flex items-start justify-between">
            {/* Izquierda: Severidad + Título */}
            <div className="flex items-start gap-4">
              <div className={`
                p-3 rounded-xl ${severityConfig.bgClass} ${severityConfig.borderClass} border
              `}>
                <AlertTriangle className={`h-6 w-6 ${severityConfig.textClass}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={severityConfig.badgeClass}>
                    {businessCase.header.severity.toUpperCase()}
                  </Badge>
                  <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                    {businessCase.header.badge}
                  </Badge>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {businessCase.header.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Área: <span className="text-white">{alert.department?.displayName}</span>
                </p>
              </div>
            </div>
            
            {/* Derecha: Riesgo Financiero */}
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Riesgo Estimado
              </p>
              <p className={`text-2xl font-bold ${severityConfig.textClass}`}>
                {businessCase.header.riskFormatted}
              </p>
              <p className="text-xs text-slate-500">CLP en riesgo</p>
            </div>
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        {/* ════════════════════════════════════════════════════════════════
            CONTENIDO SCROLLEABLE - Secciones colapsables
            ════════════════════════════════════════════════════════════════ */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)] px-6 py-4 space-y-4">
          
          {/* SECCIÓN 2: QUÉ DETECTAMOS */}
          <CollapsibleSection
            id="detection"
            title="Qué Detectamos"
            subtitle="Análisis del área"
            icon={Search}
            iconColorClass="text-cyan-400"
            bgColorClass="bg-cyan-500/10"
            isExpanded={expandedSections.detection}
            onToggle={() => toggleSection('detection')}
          >
            <div className="space-y-4">
              {/* Score del área */}
              <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">
                    {businessCase.detection.scoreLabel}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${severityConfig.textClass}`}>
                      {businessCase.detection.scoreValue}
                    </span>
                    <span className="text-slate-500">
                      / {businessCase.detection.scoreMax}
                    </span>
                    <span className="text-xs text-slate-500">
                      (Umbral: {businessCase.detection.threshold})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-300/90">
                    {businessCase.detection.disclaimer}
                  </p>
                </div>
              </div>
              
              {/* Opportunity Statement */}
              <p className="text-sm text-slate-300 leading-relaxed">
                {businessCase.detection.opportunityStatement}
              </p>
            </div>
          </CollapsibleSection>
          
          {/* SECCIÓN 3: LA OPORTUNIDAD DE ORO */}
          <CollapsibleSection
            id="goldenOpportunity"
            title="La Oportunidad de Oro"
            subtitle="Ventana de anticipación"
            icon={Gem}
            iconColorClass="text-amber-400"
            bgColorClass="bg-amber-500/10"
            isExpanded={expandedSections.goldenOpportunity}
            onToggle={() => toggleSection('goldenOpportunity')}
            highlight={true}
          >
            <div className="space-y-4">
              {/* Diagrama de progresión */}
              <ProgressionStages 
                currentStage={businessCase.goldenOpportunity.diagram.currentStage}
                currentLabel={businessCase.goldenOpportunity.diagram.currentLabel}
              />
              
              {/* Mensaje principal */}
              <p className="text-sm text-slate-300 leading-relaxed mt-8">
                {businessCase.goldenOpportunity.message}
              </p>
              
              {/* Call to Action */}
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-400 font-medium">
                  💡 {businessCase.goldenOpportunity.callToAction}
                </p>
              </div>
            </div>
          </CollapsibleSection>
          
          {/* SECCIÓN 4: POR QUÉ ACTUAR (Casos Emblemáticos) */}
          <CollapsibleSection
            id="emblamaticCases"
            title="Por Qué Actuar"
            subtitle="Casos emblemáticos"
            icon={AlertTriangle}
            iconColorClass="text-red-400"
            bgColorClass="bg-red-500/10"
            isExpanded={expandedSections.emblamaticCases}
            onToggle={() => toggleSection('emblamaticCases')}
          >
            <div className="space-y-4">
              {/* Casos */}
              <div className="grid gap-3">
                {businessCase.emblamaticCases.cases.slice(0, 2).map((caso, idx) => (
                  <EmblamaticCaseCard key={idx} caso={caso} />
                ))}
              </div>
              
              {/* Estadística principal */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                <p className={`text-4xl font-bold ${severityConfig.textClass} mb-2`}>
                  {businessCase.emblamaticCases.statistic.value}
                </p>
                <p className="text-sm text-slate-300">
                  {businessCase.emblamaticCases.statistic.description}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  — {businessCase.emblamaticCases.statistic.source}
                </p>
              </div>
            </div>
          </CollapsibleSection>
          
          {/* SECCIÓN 5: ESPECTRO DE COSTOS */}
          <CollapsibleSection
            id="costSpectrum"
            title="Espectro de Costos"
            subtitle="Escenarios financieros"
            icon={DollarSign}
            iconColorClass="text-purple-400"
            bgColorClass="bg-purple-500/10"
            isExpanded={expandedSections.costSpectrum}
            onToggle={() => toggleSection('costSpectrum')}
          >
            <CostSpectrumVisual spectrum={businessCase.costSpectrum} />
          </CollapsibleSection>
          
          {/* SECCIÓN 6: PLAN DE ACCIÓN */}
          <CollapsibleSection
            id="actionPlan"
            title="Plan de Acción Recomendado"
            subtitle="Intervención sugerida"
            icon={ClipboardList}
            iconColorClass="text-cyan-400"
            bgColorClass="bg-cyan-500/10"
            isExpanded={expandedSections.actionPlan}
            onToggle={() => toggleSection('actionPlan')}
          >
            <div className="space-y-4">
              {/* Filosofía del plan */}
              <p className="text-sm text-cyan-400 italic">
                "{businessCase.actionPlan.philosophy}"
              </p>
              
              {/* Pasos */}
              <div className="space-y-3">
                {businessCase.actionPlan.steps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-cyan-400">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-white mb-1">
                        {step.title}
                      </h5>
                      <p className="text-xs text-slate-400 mb-2">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>👤 {step.responsible}</span>
                        <span>⏱️ {step.deadline}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ✓ {step.validationMetric}
                      </p>
                      
                      {/* Producto sugerido (si existe) */}
                      {step.suggestedProduct && (
                        <ProductSuggestion product={step.suggestedProduct} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Criterios de escalación */}
              {businessCase.actionPlan.escalationCriteria.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-400 font-medium mb-2">
                    ⚠️ Escalar si:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {businessCase.actionPlan.escalationCriteria.map((criteria, idx) => (
                      <li key={idx}>• {criteria}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>
          
          {/* SECCIÓN 7: METODOLOGÍA */}
          <CollapsibleSection
            id="methodology"
            title="Fuentes Metodológicas"
            subtitle="Base científica y legal"
            icon={BookOpen}
            iconColorClass="text-blue-400"
            bgColorClass="bg-blue-500/10"
            isExpanded={expandedSections.methodology}
            onToggle={() => toggleSection('methodology')}
          >
            <div className="space-y-3">
              {businessCase.methodology.sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-slate-900/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{source.name}</p>
                    <p className="text-xs text-slate-400">{source.description}</p>
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-slate-500 italic mt-3">
                {businessCase.methodology.disclaimer}
              </p>
            </div>
          </CollapsibleSection>
          
        </div>
        
        {/* ════════════════════════════════════════════════════════════════
            FOOTER FIJO - Resolución
            ════════════════════════════════════════════════════════════════ */}
        <div 
          ref={resolutionSectionRef}
          className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-6 py-5"
        >
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            ¿Qué acción tomaste?
          </h4>
          
          {/* Quick Picks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {businessCase.resolutionOptions.quickPicks.map((pick, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPickSelect(pick)}
                className={`
                  flex items-start gap-2 p-3 rounded-lg text-left text-xs
                  border transition-all duration-200
                  ${selectedQuickPick === pick
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-300'
                  }
                `}
              >
                <div className={`
                  w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5
                  flex items-center justify-center
                  ${selectedQuickPick === pick
                    ? 'border-cyan-400 bg-cyan-500'
                    : 'border-slate-600'
                  }
                `}>
                  {selectedQuickPick === pick && (
                    <Check className="w-2.5 h-2.5 text-slate-900" />
                  )}
                </div>
                <span>{pick}</span>
              </button>
            ))}
          </div>
          
          {/* Toggle para notas adicionales */}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-xs text-slate-500 hover:text-slate-400 mb-3 flex items-center gap-1"
          >
            {showCustomInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {businessCase.resolutionOptions.customPrompt}
          </button>
          
          {/* Input custom */}
          <AnimatePresence>
            {showCustomInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <Textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Describe la acción tomada..."
                  className="w-full h-20 bg-slate-800/50 border-slate-700/50 text-sm resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500">
                    {selectedQuickPick 
                      ? 'Notas adicionales (opcional)'
                      : `Mínimo ${businessCase.resolutionOptions.minCharacters} caracteres`
                    }
                  </p>
                  <span className={`text-xs ${
                    customNotes.length >= (businessCase.resolutionOptions.minCharacters || 10)
                      ? 'text-green-400'
                      : 'text-slate-500'
                  }`}>
                    {customNotes.length}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Botones */}
          <div className="flex items-center justify-between gap-3">
            <GhostButton onClick={() => onClose()}>
              Cerrar
            </GhostButton>
            
            <PrimaryButton
              onClick={handleResolve}
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
              icon={Check}
            >
              {isSubmitting ? 'Guardando...' : 'Marcar como Gestionada'}
            </PrimaryButton>
          </div>
          
          {/* Success message preview */}
          <p className="text-xs text-slate-500 mt-3 text-center">
            {businessCase.resolutionOptions.successMessage}
          </p>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}

export default ExitAlertDetailModal;