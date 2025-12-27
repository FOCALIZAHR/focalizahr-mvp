// src/app/dashboard/exit/alerts/[id]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// EXIT ALERT DETAIL - VISTA DEDICADA CON ASESORÍA NIVEL CEO
// ═══════════════════════════════════════════════════════════════════════════════
// VERSIÓN CORREGIDA: Alineada con ExitBusinessCase REAL
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  AlertTriangle,
  Siren,
  TrendingDown,
  Users,
  Target,
  Link2,
  Clock,
  Building2,
  Calendar,
  CheckCircle,
  Loader2,
  FileText,
  Shield,
  Lightbulb,
  DollarSign,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Scale,
  ExternalLink
} from 'lucide-react';
import { ExitAlertWithRelations, ExitAlertType } from '@/types/exit';
import { ExitBusinessCase, EmblamaticCase as EmblamaticCaseType } from '@/types/ExitBusinessCase';
import { ExitAlertEngine } from '@/engines/ExitAlertEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$— CLP';
  }
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B CLP`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M CLP`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K CLP`;
  }
  return `$${amount.toLocaleString()} CLP`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('es-CL', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

function formatTimeRemaining(dueDate: Date | string | null): string {
  if (!dueDate) return 'Sin SLA';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 0) {
    return `Vencido hace ${Math.abs(diffHours)}h`;
  }
  if (diffHours < 24) {
    return `${diffHours}h restantes`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d restantes`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR TIPO DE ALERTA
// ═══════════════════════════════════════════════════════════════════════════════

const ALERT_TYPE_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  quickPicks: { id: string; label: string; icon: string }[];
}> = {
  ley_karin: {
    label: 'Indicios Ley Karin',
    icon: '⚖️',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    quickPicks: [
      { id: 'ambiente_sano', label: 'Aplicaré Ambiente Sano al área para validar indicios', icon: '🎯' },
      { id: 'diagnostico', label: 'Inicié protocolo de diagnóstico confidencial con HRBP', icon: '🔍' },
      { id: 'entrevistas', label: 'Realicé entrevistas 1:1 discretas para entender situación', icon: '💬' },
      { id: 'reunion_hr_legal', label: 'Convoqué reunión HR + Legal (sin alertar al área)', icon: '⚖️' },
      { id: 'protocolo_formal', label: 'Activé protocolo formal Ley Karin (hay denuncia)', icon: '📋' },
      { id: 'escalar', label: 'Escalé a Gerencia General por gravedad del caso', icon: '⬆️' }
    ]
  },
  toxic_exit_detected: {
    label: 'Exit Tóxico Detectado',
    icon: '☠️',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    quickPicks: [
      { id: 'pulso', label: 'Aplicaré Pulso Express al equipo restante', icon: '📊' },
      { id: 'stay_interviews', label: 'Realicé stay interviews con top performers', icon: '🎯' },
      { id: 'causa_raiz', label: 'Identifiqué y abordé causa raíz con el líder', icon: '🔍' },
      { id: 'retencion', label: 'Implementé plan de retención para empleados en riesgo', icon: '🛡️' },
      { id: 'assessment', label: 'Inicié assessment de liderazgo del área', icon: '👤' },
      { id: 'monitoreo', label: 'Monitoreo activo de reviews en Glassdoor/LinkedIn', icon: '👁️' }
    ]
  },
  nps_critico: {
    label: 'NPS Crítico',
    icon: '📉',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    quickPicks: [
      { id: 'focus_group', label: 'Convoqué focus group para entender causas', icon: '👥' },
      { id: 'plan_mejora', label: 'Implementé plan de mejora basado en feedback', icon: '📋' },
      { id: 'comunicacion', label: 'Comuniqué acciones concretas al equipo', icon: '📢' },
      { id: 'checkins', label: 'Establecí check-ins mensuales con el área', icon: '📅' },
      { id: 'politicas', label: 'Revisé y ajusté políticas del departamento', icon: '📜' }
    ]
  },
  liderazgo_concentracion: {
    label: 'Patrón de Liderazgo',
    icon: '👥',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    quickPicks: [
      { id: '360', label: 'Realicé assessment 360° del líder mencionado', icon: '🔄' },
      { id: 'coaching', label: 'Inicié coaching ejecutivo para el gerente', icon: '🎯' },
      { id: 'evidencia', label: 'Presenté evidencia a Gerencia General', icon: '📊' },
      { id: 'cambio', label: 'Reasigné o desvinculé al líder problemático', icon: '🔀' },
      { id: 'recuperacion', label: 'Implementé plan de recuperación del equipo', icon: '💪' }
    ]
  },
  department_exit_pattern: {
    label: 'Patrón Departamental',
    icon: '🏢',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    quickPicks: [
      { id: 'ambiente_sano', label: 'Aplicaré Ambiente Sano al área afectada', icon: '🎯' },
      { id: 'causa_raiz', label: 'Inicié investigación de causa raíz', icon: '🔍' },
      { id: 'intervencion', label: 'Implementé plan de intervención estructural', icon: '🔧' },
      { id: 'monitoreo', label: 'Establecí monitoreo mensual del área', icon: '📈' }
    ]
  },
  onboarding_exit_correlation: {
    label: 'Correlación Onboarding',
    icon: '🔗',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    quickPicks: [
      { id: 'auditoria', label: 'Audité proceso de gestión de alertas', icon: '📋' },
      { id: 'capacitacion', label: 'Capacité a gerentes en respuesta a alertas', icon: '🎓' },
      { id: 'sla', label: 'Implementé SLA obligatorio para alertas', icon: '⏱️' },
      { id: 'kpi', label: 'Agregué KPI de alertas gestionadas a evaluación', icon: '📊' },
      { id: 'escalamiento', label: 'Rediseñé flujo de escalamiento automático', icon: '⬆️' }
    ]
  }
};

const DEFAULT_CONFIG = {
  label: 'Alerta Exit',
  icon: '⚠️',
  color: 'text-slate-400',
  bgColor: 'bg-slate-500/10',
  borderColor: 'border-slate-500/30',
  quickPicks: [
    { id: 'investigar', label: 'Inicié investigación de la situación', icon: '🔍' },
    { id: 'reunion', label: 'Convoqué reunión con stakeholders', icon: '👥' },
    { id: 'plan', label: 'Documenté hallazgos y próximos pasos', icon: '📋' }
  ]
};

const SEVERITY_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  critical: { label: 'CRÍTICO', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  high: { label: 'ALTO', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  medium: { label: 'MEDIO', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  low: { label: 'BAJO', color: 'text-green-400', bgColor: 'bg-green-500/20' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES UI
// ═══════════════════════════════════════════════════════════════════════════════

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: 'cyan' | 'purple' | 'red' | 'yellow' | 'green';
}

function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  accentColor = 'cyan'
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorClasses = {
    cyan: 'border-cyan-500/30 hover:border-cyan-500/50',
    purple: 'border-purple-500/30 hover:border-purple-500/50',
    red: 'border-red-500/30 hover:border-red-500/50',
    yellow: 'border-yellow-500/30 hover:border-yellow-500/50',
    green: 'border-green-500/30 hover:border-green-500/50'
  };
  
  const iconColorClasses = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400'
  };
  
  return (
    <div className={`
      bg-slate-800/30 border ${colorClasses[accentColor]} rounded-xl
      transition-all duration-300
    `}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className={iconColorClasses[accentColor]}>{icon}</span>
          <span className="text-white font-medium">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para mostrar casos emblemáticos
interface EmblamaticCaseCardProps {
  caso: EmblamaticCaseType;
}

function EmblamaticCaseCard({ caso }: EmblamaticCaseCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium">{caso.company}</h4>
          <p className="text-slate-400 text-sm mt-1">{caso.incident}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-red-400">{caso.cost}</span>
            <span className="text-slate-500">{caso.year}</span>
          </div>
          <p className="text-yellow-400/80 text-xs mt-2 italic">
            💡 {caso.lesson}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExitAlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;
  
  // State
  const [alert, setAlert] = useState<ExitAlertWithRelations | null>(null);
  const [businessCase, setBusinessCase] = useState<ExitBusinessCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickPick, setSelectedQuickPick] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  
  // Fetch alert data
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/exit/alerts/${alertId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar la alerta');
        }
        
        const data = await response.json();
        setAlert(data.data);
        
        // Generar BusinessCase usando el Engine REAL
        if (data.data) {
          const generatedCase = ExitAlertEngine.generateBusinessCaseFromAlert(
            data.data,
            undefined, // exitRecord - se podría pasar si está disponible
            {
              name: data.data.department?.displayName,
              employeeCount: 15 // TODO: Obtener de DepartmentMetrics
            }
          );
          setBusinessCase(generatedCase);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    if (alertId) {
      fetchAlert();
    }
  }, [alertId]);
  
  // Configuración del tipo de alerta
  const typeConfig = useMemo(() => {
    if (!alert) return DEFAULT_CONFIG;
    return ALERT_TYPE_CONFIG[alert.alertType] || DEFAULT_CONFIG;
  }, [alert]);
  
  // Configuración de severidad
  const severityConfig = useMemo(() => {
    if (!alert) return SEVERITY_CONFIG.medium;
    return SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  }, [alert]);
  
  // Handler de resolución
  const handleResolve = useCallback(async () => {
    if (!alert || !selectedQuickPick) return;
    
    const selectedOption = typeConfig.quickPicks.find(p => p.id === selectedQuickPick);
    const finalNotes = selectedOption 
      ? `${selectedOption.label}${resolutionNotes ? ` — ${resolutionNotes}` : ''}`
      : resolutionNotes;
    
    setIsResolving(true);
    
    try {
      const response = await fetch(`/api/exit/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          notes: finalNotes
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al resolver la alerta');
      }
      
      // Redirect back to alerts list
      router.push('/dashboard/exit?tab=alertas');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver');
    } finally {
      setIsResolving(false);
    }
  }, [alert, selectedQuickPick, resolutionNotes, typeConfig.quickPicks, router]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando alerta...</span>
        </div>
      </div>
    );
  }
  
  if (error || !alert) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Error al cargar la alerta</h2>
          <p className="text-slate-400 mb-4">{error || 'Alerta no encontrada'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* HEADER CON NAVEGACIÓN */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a alertas</span>
          </button>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              {/* Izquierda: Tipo e info */}
              <div className="flex items-start gap-4">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center
                  ${typeConfig.bgColor} border ${typeConfig.borderColor}
                `}>
                  <span className={typeConfig.color}>{typeConfig.icon}</span>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${severityConfig.bgColor} ${severityConfig.color}
                    `}>
                      {severityConfig.label}
                    </span>
                    <span className={`text-sm ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  
                  <h1 className="text-xl md:text-2xl font-light text-white">
                    {alert.department?.displayName || 'Departamento'}
                  </h1>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTimeRemaining(alert.dueDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      Detectado: {formatDate(alert.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Derecha: Riesgo financiero - USA CAMPOS REALES */}
              {businessCase?.header?.riskAmount !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Riesgo Estimado
                  </p>
                  <p className="text-2xl md:text-3xl font-light text-red-400">
                    {businessCase.header.riskFormatted || formatCurrency(businessCase.header.riskAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* CONTENIDO PRINCIPAL: SECCIONES COLAPSABLES */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        
        <div className="space-y-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Sección: Qué Detectamos - USA CAMPOS REALES */}
            <CollapsibleSection
              title="Qué Detectamos"
              icon={<AlertTriangle className="w-5 h-5" />}
              defaultOpen={true}
              accentColor="red"
            >
              {businessCase?.detection ? (
                <div className="space-y-4">
                  {/* Summary del detection */}
                  <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-300 mb-3">
                      {businessCase.detection.summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-red-400 font-medium">
                        {businessCase.detection.scoreLabel}: {businessCase.detection.scoreValue?.toFixed(1)} / {businessCase.detection.scoreMax}
                      </span>
                      <span className="text-slate-500">
                        Umbral crítico: {businessCase.detection.threshold}
                      </span>
                    </div>
                  </div>
                  
                  {/* Opportunity Statement */}
                  {businessCase.detection.opportunityStatement && (
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-cyan-400 font-medium mb-1">
                            ¿Qué significa esto?
                          </p>
                          <p className="text-slate-300 text-sm">
                            {businessCase.detection.opportunityStatement}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Disclaimer */}
                  {businessCase.detection.disclaimer && (
                    <div className="flex items-center gap-2 text-yellow-400/80 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{businessCase.detection.disclaimer}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">{alert.description}</p>
              )}
            </CollapsibleSection>
            
            {/* Sección: La Oportunidad de Oro - USA CAMPOS REALES */}
            <CollapsibleSection
              title="La Oportunidad de Oro"
              icon={<Sparkles className="w-5 h-5" />}
              defaultOpen={true}
              accentColor="cyan"
            >
              {businessCase?.goldenOpportunity ? (
                <div className="space-y-4">
                  {/* Message principal */}
                  <p className="text-slate-300">
                    {businessCase.goldenOpportunity.message}
                  </p>
                  
                  {/* Diagrama de progresión */}
                  {businessCase.goldenOpportunity.diagram && (
                    <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                        {businessCase.goldenOpportunity.diagram.stages.map((stage, index) => (
                          <div 
                            key={index}
                            className={`
                              flex-shrink-0 px-3 py-2 rounded-lg text-center text-sm
                              ${index === businessCase.goldenOpportunity.diagram.currentStage 
                                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' 
                                : 'bg-slate-800/50 text-slate-500'}
                            `}
                          >
                            {stage}
                          </div>
                        ))}
                      </div>
                      <p className="text-center text-cyan-400 text-sm mt-2">
                        ↑ {businessCase.goldenOpportunity.diagram.currentLabel}
                      </p>
                    </div>
                  )}
                  
                  {/* Call to Action */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <p className="text-white font-light text-lg text-center">
                      "{businessCase.goldenOpportunity.callToAction}"
                    </p>
                  </div>
                  
                  {/* Espectro de costos - USA ESTRUCTURA REAL */}
                  {businessCase.costSpectrum && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">
                          {businessCase.costSpectrum.actNow.label}
                        </p>
                        <p className="text-green-400 font-medium">
                          {formatCurrency(businessCase.costSpectrum.actNow.cost)}
                        </p>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">
                          {businessCase.costSpectrum.escalateTutela.label}
                        </p>
                        <p className="text-red-400 font-medium">
                          {formatCurrency(businessCase.costSpectrum.escalateTutela.costMax)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  Tienen la oportunidad única de actuar antes de que este indicio escale.
                </p>
              )}
            </CollapsibleSection>
            
            {/* Sección: Plan de Acción - USA ESTRUCTURA REAL */}
            <CollapsibleSection
              title="Plan de Acción Sugerido"
              icon={<Target className="w-5 h-5" />}
              defaultOpen={true}
              accentColor="purple"
            >
              {businessCase?.actionPlan ? (
                <div className="space-y-4">
                  {/* Philosophy */}
                  {businessCase.actionPlan.philosophy && (
                    <p className="text-slate-400 text-sm italic mb-4">
                      "{businessCase.actionPlan.philosophy}"
                    </p>
                  )}
                  
                  {/* Steps - USA ESTRUCTURA REAL ExitActionStep */}
                  {businessCase.actionPlan.steps?.map((step, index) => (
                    <div 
                      key={index}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-cyan-400 text-sm font-medium">{step.step}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{step.title}</h4>
                          <p className="text-slate-400 text-sm mb-2">{step.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span>👤 {step.responsible}</span>
                            <span>⏱️ {step.deadline}</span>
                          </div>
                          
                          {/* Producto sugerido */}
                          {step.suggestedProduct && (
                            <div className="mt-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-cyan-400 text-sm">
                                <Target className="w-4 h-4" />
                                <span className="font-medium">Producto sugerido: {step.suggestedProduct.name}</span>
                              </div>
                              <p className="text-slate-400 text-xs mt-1">
                                {step.suggestedProduct.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Success Metrics */}
                  {businessCase.actionPlan.successMetrics?.length > 0 && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Métricas de Éxito
                      </h4>
                      <ul className="text-slate-300 text-sm space-y-1">
                        {businessCase.actionPlan.successMetrics.map((metric, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  El plan de acción específico se determinará según el tipo de alerta.
                </p>
              )}
            </CollapsibleSection>
            
            {/* Sección: Casos Emblemáticos - USA ESTRUCTURA REAL .cases */}
            <CollapsibleSection
              title="Casos Emblemáticos"
              icon={<BookOpen className="w-5 h-5" />}
              defaultOpen={false}
              accentColor="yellow"
            >
              {businessCase?.emblamaticCases?.cases?.length ? (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm mb-4">
                    Empresas que ignoraron señales similares:
                  </p>
                  {businessCase.emblamaticCases.cases.map((caso, index) => (
                    <EmblamaticCaseCard key={index} caso={caso} />
                  ))}
                  
                  {/* Estadística principal */}
                  {businessCase.emblamaticCases.statistic && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mt-4">
                      <p className="text-center">
                        <span className="text-yellow-400 text-3xl font-bold">
                          {businessCase.emblamaticCases.statistic.value}
                        </span>
                        <span className="text-slate-300 block mt-1">
                          {businessCase.emblamaticCases.statistic.description}
                        </span>
                        <span className="text-slate-500 text-xs">
                          — {businessCase.emblamaticCases.statistic.source}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  Casos de referencia que ilustran la importancia de actuar temprano.
                </p>
              )}
            </CollapsibleSection>
            
            {/* Sección: Fuentes Metodológicas */}
            <CollapsibleSection
              title="Fuentes Metodológicas"
              icon={<Scale className="w-5 h-5" />}
              defaultOpen={false}
              accentColor="green"
            >
              {businessCase?.methodology?.sources?.length ? (
                <div className="space-y-3">
                  {businessCase.methodology.sources.map((source, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-white font-medium">{source.name}</span>
                        {source.year && (
                          <span className="text-slate-500 ml-1">({source.year})</span>
                        )}
                        <p className="text-slate-400">{source.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {businessCase.methodology.disclaimer && (
                    <p className="text-slate-500 text-xs mt-4 italic">
                      {businessCase.methodology.disclaimer}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  Referencias metodológicas para los cálculos presentados.
                </p>
              )}
            </CollapsibleSection>
          </motion.div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* FOOTER: RESOLUCIÓN SOLEMNE */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            Registrar Acción Tomada
          </h3>
          
          {alert.status === 'resolved' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Esta alerta ya fue resuelta
              </p>
              {alert.resolutionNotes && (
                <p className="text-slate-400 mt-2 text-sm">
                  Acción: {alert.resolutionNotes}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Quick Picks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {typeConfig.quickPicks.map((pick) => (
                  <button
                    key={pick.id}
                    onClick={() => setSelectedQuickPick(
                      selectedQuickPick === pick.id ? null : pick.id
                    )}
                    className={`
                      p-3 rounded-lg text-left text-sm transition-all
                      ${selectedQuickPick === pick.id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                      }
                      border
                    `}
                  >
                    <span className="mr-2">{pick.icon}</span>
                    {pick.label}
                  </button>
                ))}
              </div>
              
              {/* Notas adicionales */}
              <div className="mb-4">
                <label className="text-slate-400 text-sm block mb-2">
                  Notas adicionales (opcional):
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detalles adicionales de la acción tomada..."
                  className="
                    w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3
                    text-white placeholder-slate-500 text-sm
                    focus:outline-none focus:border-cyan-500/50
                    resize-none
                  "
                  rows={3}
                />
              </div>
              
              {/* Botón de resolución */}
              <button
                onClick={handleResolve}
                disabled={!selectedQuickPick || isResolving}
                className={`
                  w-full py-3 rounded-xl font-medium transition-all
                  flex items-center justify-center gap-2
                  ${selectedQuickPick
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Registrar y Cerrar Alerta
                  </>
                )}
              </button>
              
              {/* Mensaje de seguimiento */}
              {businessCase?.resolutionOptions?.followUpDays && (
                <p className="text-slate-500 text-xs text-center mt-3">
                  📊 El sistema medirá automáticamente la efectividad en {businessCase.resolutionOptions.followUpDays} días
                </p>
              )}
            </>
          )}
        </motion.div>
        
      </div>
    </div>
  );
}