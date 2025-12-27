// src/components/shared/intelligence/AlertsGroupedFeed.tsx
// ============================================================================
// COMPONENTE BIMODAL: Feed de Alertas Agrupado
// ============================================================================
// ARQUITECTURA: Discriminated Union Types para type-safety
// SOPORTA: Onboarding Journey Intelligence + Exit Intelligence
// 
// Props clave:
//   productType: 'onboarding' | 'exit'
//   groupBy: 'department' (onboarding) | 'alertType' (exit)
//   onResolveAlert: opcional, Exit lo usa
// ============================================================================

'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Building2,
  AlertTriangle,
  Siren,
  TrendingDown,
  Users,
  Link2,
  Clock,
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';

// Componentes compartidos
import { SeverityBadge } from '@/components/shared/intelligence/SeverityBadge';
import { StatusBadge } from '@/components/shared/intelligence/StatusBadge';
import { calculateSLARemaining, AlertStatus, AlertSeverity } from '@/components/shared/intelligence/types';

// Componentes específicos de Onboarding
import AlertsTabsToggle from '@/components/onboarding/AlertsTabsToggle';

// Componente específico de Exit (Ley Karin)
import LeyKarinAlertCard from '@/components/exit/LeyKarinAlertCard';

// ============================================================================
// DISCRIMINATED UNION TYPES
// ============================================================================

/**
 * Props base compartidas
 */
interface BaseProps {
  alerts: any[];
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  onAcknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  loading: boolean;
}

/**
 * Props específicas para Onboarding
 * Discriminante: productType = 'onboarding'
 */
interface OnboardingFeedProps extends BaseProps {
  productType: 'onboarding';
  groupBy?: 'department';
  onResolveAlert?: never;  // No disponible en Onboarding
}

/**
 * Props específicas para Exit
 * Discriminante: productType = 'exit'
 */
interface ExitFeedProps extends BaseProps {
  productType: 'exit';
  groupBy?: 'alertType';
  onResolveAlert: (id: string, notes: string) => Promise<void>;  // Requerido en Exit
}

/**
 * Union discriminada de Props
 */
type AlertsGroupedFeedProps = OnboardingFeedProps | ExitFeedProps;

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

type ExitAlertType = 
  | 'ley_karin'
  | 'toxic_exit_detected'
  | 'nps_critico'
  | 'liderazgo_concentracion'
  | 'department_pattern'
  | 'onboarding_correlation';

interface AlertGroup {
  type: ExitAlertType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  alerts: any[];
  priority: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const PRODUCT_CONFIG = {
  onboarding: {
    title: 'Alertas Prioritarias',
    subtitle: 'Intervenciones recomendadas para retener talento clave',
    emptyMessage: 'No hay alertas activas en este momento',
    emptySubtext: '¡Excelente! El onboarding está funcionando correctamente'
  },
  exit: {
    title: 'Alertas Exit Intelligence',
    subtitle: 'Detección de riesgos y compliance Ley Karin',
    emptyMessage: 'No hay alertas de salida activas',
    emptySubtext: 'Sin incidencias detectadas en el período'
  }
} as const;

const ALERT_TYPE_CONFIG: Record<ExitAlertType, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  priority: number 
}> = {
  ley_karin: {
    label: 'Ley Karin - Acción Inmediata',
    icon: Siren,
    color: 'red',
    priority: 0
  },
  toxic_exit_detected: {
    label: 'Salida Tóxica Detectada',
    icon: AlertTriangle,
    color: 'orange',
    priority: 1
  },
  nps_critico: {
    label: 'NPS Crítico',
    icon: TrendingDown,
    color: 'amber',
    priority: 2
  },
  liderazgo_concentracion: {
    label: 'Concentración Liderazgo',
    icon: Users,
    color: 'purple',
    priority: 3
  },
  department_pattern: {
    label: 'Patrón Departamental',
    icon: Building2,
    color: 'blue',
    priority: 4
  },
  onboarding_correlation: {
    label: 'Correlación Onboarding',
    icon: Link2,
    color: 'cyan',
    priority: 5
  }
};

const TAB_FILTERS = {
  active: (a: any) => a.status === 'pending',
  managed: (a: any) => a.status !== 'pending',
  all: () => true
};

// ============================================================================
// HELPER: Formato moneda
// ============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// ============================================================================
// SUB-COMPONENTE: Card de Alerta Estándar (Exit, no Ley Karin)
// ============================================================================

interface StandardAlertCardProps {
  alert: any;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
}

const StandardExitAlertCard = memo(function StandardExitAlertCard({
  alert,
  onAcknowledge,
  onResolve
}: StandardAlertCardProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const slaInfo = useMemo(() => {
    if (!alert.dueDate) return { hours: 0, isOverdue: false, label: 'Sin SLA' };
    const dueDateStr = alert.dueDate instanceof Date 
      ? alert.dueDate.toISOString() 
      : String(alert.dueDate);
    return calculateSLARemaining(dueDateStr);
  }, [alert.dueDate]);

  const handleAcknowledge = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAcknowledge(alert.id, notes || undefined);
      setNotes('');
      setShowActions(false);
    } catch (error) {
      console.error('Error acknowledging:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, notes, onAcknowledge, isSubmitting]);

  const handleResolve = useCallback(async () => {
    if (isSubmitting || !notes.trim()) return;
    setIsSubmitting(true);
    try {
      await onResolve(alert.id, notes.trim());
      setNotes('');
      setShowActions(false);
    } catch (error) {
      console.error('Error resolving:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, notes, onResolve, isSubmitting]);

  const isPending = alert.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-4 rounded-xl border transition-all duration-200
        ${isPending 
          ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50' 
          : 'bg-slate-800/20 border-slate-700/30'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={alert.severity as AlertSeverity} />
            <StatusBadge status={alert.status as AlertStatus} />
            {slaInfo.isOverdue && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                SLA Vencido
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-medium text-white mb-1 truncate">
            {alert.title}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-2">
            {alert.description}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            {alert.department && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {alert.department.displayName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {slaInfo.label}
            </span>
          </div>
        </div>

        {isPending && (
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Panel de acciones */}
      <AnimatePresence>
        {showActions && isPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de gestión (opcional para reconocer, requerido para resolver)..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAcknowledge}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-sm text-amber-300 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Reconocer
              </button>
              <button
                onClick={handleResolve}
                disabled={isSubmitting || !notes.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-sm text-cyan-300 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Resolver
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// SUB-COMPONENTE: Grupo de Alertas Exit (colapsable)
// ============================================================================

interface ExitAlertGroupProps {
  group: AlertGroup;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
}

const ExitAlertGroup = memo(function ExitAlertGroup({
  group,
  onAcknowledge,
  onResolve
}: ExitAlertGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = group.icon;

  const colorClasses: Record<string, string> = {
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
  };

  const colorClass = colorClasses[group.color] || colorClasses.cyan;

  return (
    <div className="mb-6">
      {/* Header del grupo */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white">{group.label}</h3>
            <p className="text-xs text-slate-500">{group.alerts.length} alerta{group.alerts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Lista de alertas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 pl-4 border-l-2 border-slate-700/30 ml-5"
          >
            {group.alerts.map((alert) => (
              group.type === 'ley_karin' ? (
                <LeyKarinAlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={onAcknowledge}
                  onResolve={onResolve}
                />
              ) : (
                <StandardExitAlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={onAcknowledge}
                  onResolve={onResolve}
                />
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// SUB-COMPONENTE: Card de Alerta Onboarding
// ============================================================================

interface OnboardingAlertCardProps {
  alert: any;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
}

const OnboardingAlertCard = memo(function OnboardingAlertCard({
  alert,
  onAcknowledge
}: OnboardingAlertCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessCase = useMemo(() => {
    return OnboardingAlertEngine.generateBusinessCaseFromAlert(alert, alert.journey);
  }, [alert]);

  const impacto = businessCase?.financials?.potentialAnnualLoss || 0;

  const handleAcknowledge = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAcknowledge(alert.id);
    } catch (error) {
      console.error('Error acknowledging:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, onAcknowledge, isSubmitting]);

  const isPending = alert.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={alert.severity as AlertSeverity} />
            <StatusBadge status={alert.status as AlertStatus} />
          </div>
          <h4 className="text-sm font-medium text-white mb-1">
            {alert.journey?.fullName || 'Sin nombre'}
          </h4>
          <p className="text-xs text-slate-400">
            {businessCase?.title || alert.alertType?.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {alert.journey?.department?.displayName || 'Sin departamento'}
            </span>
            <span className="font-medium text-white">
              {formatCurrency(impacto)}
            </span>
          </div>
        </div>
        
        {isPending && (
          <button
            onClick={handleAcknowledge}
            disabled={isSubmitting}
            className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 text-cyan-400" />
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AlertsGroupedFeed = memo(function AlertsGroupedFeed(props: AlertsGroupedFeedProps) {
  const {
    alerts,
    activeTab,
    onTabChange,
    onAcknowledgeAlert,
    loading,
    productType
  } = props;

  const { success, error: showError } = useToast();
  
  const config = PRODUCT_CONFIG[productType];
  
  // Conteos
  const activeCount = alerts.filter(a => a.status === 'pending').length;
  const managedCount = alerts.filter(a => a.status !== 'pending').length;

  // ========================================
  // FILTRADO
  // ========================================
  
  const filteredAlerts = useMemo(() => {
    return alerts.filter(TAB_FILTERS[activeTab]);
  }, [alerts, activeTab]);

  // ========================================
  // AGRUPACIÓN EXIT (por alertType)
  // ========================================
  
  const exitGroups = useMemo((): AlertGroup[] => {
    if (productType !== 'exit') return [];

    const groupMap = new Map<ExitAlertType, any[]>();
    
    filteredAlerts.forEach((alert) => {
      const type = (alert.alertType || 'toxic_exit_detected') as ExitAlertType;
      if (!groupMap.has(type)) {
        groupMap.set(type, []);
      }
      groupMap.get(type)!.push(alert);
    });

    return Array.from(groupMap.entries())
      .map(([type, typeAlerts]) => {
        const typeConfig = ALERT_TYPE_CONFIG[type] || ALERT_TYPE_CONFIG.toxic_exit_detected;
        return {
          type,
          label: typeConfig.label,
          icon: typeConfig.icon,
          color: typeConfig.color,
          alerts: typeAlerts.sort((a, b) => {
            const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
          }),
          priority: typeConfig.priority
        };
      })
      .sort((a, b) => a.priority - b.priority);
  }, [filteredAlerts, productType]);

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleAcknowledge = useCallback(async (id: string, notes?: string) => {
    try {
      await onAcknowledgeAlert(id, notes);
      success('Alerta marcada como reconocida');
    } catch (error) {
      showError('Error al reconocer alerta');
    }
  }, [onAcknowledgeAlert, success, showError]);

  const handleResolve = useCallback(async (id: string, notes: string) => {
    // Type guard: solo Exit tiene onResolveAlert
    if (props.productType !== 'exit') return;
    
    try {
      await props.onResolveAlert(id, notes);
      success('Alerta resuelta exitosamente');
    } catch (error) {
      showError('Error al resolver alerta');
    }
  }, [props, success, showError]);

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{config.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{config.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <AlertsTabsToggle
        activeTab={activeTab}
        onTabChange={onTabChange}
        counts={{ active: activeCount, managed: managedCount, all: alerts.length }}
      />

      {/* Contenido */}
      {filteredAlerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ShieldCheck className="h-16 w-16 text-cyan-400/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {config.emptyMessage}
          </h3>
          <p className="text-sm text-slate-500">
            {config.emptySubtext}
          </p>
        </motion.div>
      ) : productType === 'exit' ? (
        // ════════════════════════════════════════
        // EXIT: Render por grupos de alertType
        // TypeScript SABE que props.onResolveAlert existe
        // ════════════════════════════════════════
        <div className="space-y-4">
          {exitGroups.map((group) => (
            <ExitAlertGroup
              key={group.type}
              group={group}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </div>
      ) : (
        // ════════════════════════════════════════
        // ONBOARDING: Lista simple de alertas
        // ════════════════════════════════════════
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <OnboardingAlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default AlertsGroupedFeed;