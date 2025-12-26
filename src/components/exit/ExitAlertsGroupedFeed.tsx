// src/components/exit/ExitAlertsGroupedFeed.tsx
// ============================================================================
// GROUPED FEED - EXIT INTELLIGENCE ALERTS
// ============================================================================
// COPIADO DE: src/components/onboarding/AlertsGroupedFeed.tsx
// ADAPTADO PARA: Exit Intelligence con agrupación por alertType
// 
// CAMBIOS VS ONBOARDING:
// - Agrupa por alertType en vez de gerencia
// - Orden: ley_karin primero, toxic_exit_detected segundo, resto después
// - ley_karin usa LeyKarinAlertCard especial
// - Otras alertas usan card estándar con SeverityBadge + StatusBadge
// ============================================================================

'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Siren,
  TrendingDown,
  Users,
  Target,
  Link2,
  Clock,
  Building2,
  User,
  Calendar,
  CheckCircle,
    Loader2,
    FileText
} from 'lucide-react';
import { ExitAlertWithRelations, ExitAlertType } from '@/types/exit';
import { SeverityBadge } from '@/components/shared/intelligence/SeverityBadge';
import { StatusBadge } from '@/components/shared/intelligence/StatusBadge';
import {
    calculateSLARemaining,
    AlertStatus,
    AlertSeverity
} from '@/components/shared/intelligence/types';
import LeyKarinAlertCard from './LeyKarinAlertCard';

// ============================================================================
// INTERFACES
// ============================================================================

interface ExitAlertsGroupedFeedProps {
  alerts: ExitAlertWithRelations[];
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  onAcknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  onResolveAlert: (id: string, notes: string) => Promise<void>;
  loading?: boolean;
}

interface AlertGroup {
  type: ExitAlertType;
  label: string;
  icon: React.ElementType;
  alerts: ExitAlertWithRelations[];
  color: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

// Configuración visual por tipo de alerta
// IMPORTANTE: Las keys deben coincidir EXACTAMENTE con ExitAlertType de src/types/exit.ts
const ALERT_TYPE_CONFIG: Record<ExitAlertType, {
  label: string;
  icon: React.ElementType;
  color: string;
  priority: number;
}> = {
  ley_karin: {
    label: 'Ley Karin - Compliance',
    icon: Siren,
    color: 'red',
    priority: 1
  },
  toxic_exit_detected: {
    label: 'Salida Tóxica Detectada',
    icon: TrendingDown,
    color: 'orange',
    priority: 2
  },
  nps_critico: {
    label: 'NPS Crítico',
    icon: Target,
    color: 'amber',
    priority: 3
  },
  liderazgo_concentracion: {
    label: 'Concentración Liderazgo',
    icon: Users,
    color: 'purple',
    priority: 4
  },
  department_exit_pattern: {
    label: 'Patrón Departamental',
    icon: Building2,
    color: 'blue',
    priority: 5
  },
  onboarding_exit_correlation: {
    label: 'Correlación Onboarding',
    icon: Link2,
    color: 'cyan',
    priority: 6
  }
};

const TAB_CONFIG = {
  active: { label: 'Activas', filter: (a: ExitAlertWithRelations) => a.status === 'pending' },
  managed: { label: 'En Gestión', filter: (a: ExitAlertWithRelations) => a.status === 'acknowledged' },
  all: { label: 'Todas', filter: () => true }
};

// ============================================================================
// SUBCOMPONENTES
// ============================================================================

// Tabs Toggle
const AlertsTabsToggle = memo(function AlertsTabsToggle({
  activeTab,
  onTabChange,
  counts
}: {
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  counts: { active: number; managed: number; all: number };
}) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
      {(Object.keys(TAB_CONFIG) as Array<'active' | 'managed' | 'all'>).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${activeTab === tab 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }
          `}
        >
          {TAB_CONFIG[tab].label}
          <span className={`
            px-1.5 py-0.5 rounded-full text-xs
            ${activeTab === tab ? 'bg-cyan-500/30' : 'bg-slate-700'}
          `}>
            {counts[tab]}
          </span>
        </button>
      ))}
    </div>
  );
});

// Standard Alert Card (para alertas que no son Ley Karin)
const StandardAlertCard = memo(function StandardAlertCard({
  alert,
  onAcknowledge,
  onResolve
}: {
  alert: ExitAlertWithRelations;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Convertir dueDate a string para calculateSLARemaining
  const slaInfo = useMemo(() => {
    if (!alert.dueDate) {
      return { hours: 0, isOverdue: false, label: 'Sin SLA' };
    }
    const dueDateStr = alert.dueDate instanceof Date 
      ? alert.dueDate.toISOString() 
      : String(alert.dueDate);
    return calculateSLARemaining(dueDateStr);
  }, [alert.dueDate]);
  
  // SLA hours: usar del alert o fallback
  const slaHours = alert.slaHours ?? 48; // Default 48h para alertas no-LeyKarin
  
  // Cast status a AlertStatus
  const alertStatus = alert.status as AlertStatus;
  const isResolved = alertStatus === 'resolved';
  const isAcknowledged = alertStatus === 'acknowledged';
  const isPending = alertStatus === 'pending';
  
  const handleAcknowledge = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAcknowledge(alert.id, notes || undefined);
      setNotes('');
      setShowActions(false);
    } catch (error) {
      console.error('[StandardAlertCard] Error:', error);
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
      console.error('[StandardAlertCard] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, notes, onResolve, isSubmitting]);
  
  const config = ALERT_TYPE_CONFIG[alert.alertType as ExitAlertType] || ALERT_TYPE_CONFIG.toxic_exit_detected;
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:border-slate-600/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${config.color}-500/10`}>
            <Icon className={`h-4 w-4 text-${config.color}-400`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{alert.title}</h4>
            <p className="text-xs text-slate-500">{alert.department?.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity as AlertSeverity} size="sm" />
          <StatusBadge status={alertStatus} size="sm" />
        </div>
      </div>
      
      {/* Descripción */}
      <p className="text-sm text-slate-400 mb-3">{alert.description}</p>
      
      {/* SLA */}
      <div className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs
        ${slaInfo.isOverdue 
          ? 'bg-red-500/10 text-red-400' 
          : 'bg-slate-700/50 text-slate-400'
        }
      `}>
        <Clock className="h-3 w-3" />
        {slaInfo.label}
      </div>
      
      {/* Notas de resolución si ya está resuelta */}
      {isResolved && alert.resolutionNotes && (
        <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Resuelta</span>
          </div>
          <p className="text-xs text-slate-400">{alert.resolutionNotes}</p>
        </div>
      )}
      
      {/* Acciones (si no está resuelta) */}
      {!isResolved && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          {!showActions && isPending && (
            <button
              onClick={() => setShowActions(true)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              <FileText className="h-3 w-3" />
              Gestionar alerta
            </button>
          )}
          
          {(showActions || isAcknowledged) && (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAcknowledged ? "Notas de resolución (obligatorias)..." : "Notas..."}
                className="w-full h-16 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              <div className="flex gap-2">
                {isPending && (
                  <>
                    <button
                      onClick={() => setShowActions(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-400"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAcknowledge}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'En Gestión'}
                    </button>
                  </>
                )}
                {isAcknowledged && (
                  <button
                    onClick={handleResolve}
                    disabled={isSubmitting || !notes.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Resolver'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

// Accordion Group
const AlertGroupAccordion = memo(function AlertGroupAccordion({
  group,
  onAcknowledge,
  onResolve,
  defaultOpen = false
}: {
  group: AlertGroup;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = group.icon;
  
  const criticalCount = group.alerts.filter(a => a.severity === 'critical').length;
  
  return (
    <div className="border border-slate-700/30 rounded-xl overflow-hidden">
      {/* Header clickeable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${group.color}-500/10`}>
            <Icon className={`h-5 w-5 text-${group.color}-400`} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white">{group.label}</h3>
            <p className="text-xs text-slate-500">
              {group.alerts.length} alerta{group.alerts.length !== 1 ? 's' : ''}
              {criticalCount > 0 && (
                <span className="text-red-400 ml-2">
                  • {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      
      {/* Contenido expandible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-slate-900/50">
              {group.alerts.map((alert) => (
                group.type === 'ley_karin' ? (
                  <LeyKarinAlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={onAcknowledge}
                    onResolve={onResolve}
                  />
                ) : (
                  <StandardAlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={onAcknowledge}
                    onResolve={onResolve}
                  />
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExitAlertsGroupedFeed = memo(function ExitAlertsGroupedFeed({
  alerts,
  activeTab,
  onTabChange,
  onAcknowledgeAlert,
  onResolveAlert,
  loading = false
}: ExitAlertsGroupedFeedProps) {
  
  // ========================================
  // FILTRAR Y AGRUPAR
  // ========================================
  
  const { filteredAlerts, groups, counts } = useMemo(() => {
    // Filtrar por tab
    const filtered = alerts.filter(TAB_CONFIG[activeTab].filter);
    
    // Agrupar por alertType
    const groupMap = new Map<ExitAlertType, ExitAlertWithRelations[]>();
    
    filtered.forEach((alert) => {
      const type = alert.alertType as ExitAlertType;
      if (!groupMap.has(type)) {
        groupMap.set(type, []);
      }
      groupMap.get(type)!.push(alert);
    });
    
    // Convertir a array y ordenar por prioridad
    const groupsArray: AlertGroup[] = Array.from(groupMap.entries())
      .map(([type, typeAlerts]) => {
        const config = ALERT_TYPE_CONFIG[type] || ALERT_TYPE_CONFIG.toxic_exit_detected;
        return {
          type,
          label: config.label,
          icon: config.icon,
          color: config.color,
          alerts: typeAlerts.sort((a, b) => {
            // Ordenar por severidad dentro del grupo
            const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
          })
        };
      })
      .sort((a, b) => {
        // Ordenar grupos por prioridad (ley_karin primero)
        const configA = ALERT_TYPE_CONFIG[a.type] || { priority: 99 };
        const configB = ALERT_TYPE_CONFIG[b.type] || { priority: 99 };
        return configA.priority - configB.priority;
      });
    
    return {
      filteredAlerts: filtered,
      groups: groupsArray,
      counts: {
        active: alerts.filter(a => a.status === 'pending').length,
        managed: alerts.filter(a => a.status === 'acknowledged').length,
        all: alerts.length
      }
    };
  }, [alerts, activeTab]);
  
  // ========================================
  // LOADING STATE
  // ========================================
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className="space-y-6">
      
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <AlertsTabsToggle
          activeTab={activeTab}
          onTabChange={onTabChange}
          counts={counts}
        />
      </div>
      
      {/* Grupos de alertas */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400/50 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            Sin alertas {activeTab === 'active' ? 'activas' : activeTab === 'managed' ? 'en gestión' : ''}
          </h3>
          <p className="text-sm text-slate-500">
            {activeTab === 'active' 
              ? 'No hay alertas pendientes de atención'
              : activeTab === 'managed'
              ? 'No hay alertas en proceso de gestión'
              : 'No se han generado alertas aún'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <AlertGroupAccordion
              key={group.type}
              group={group}
              onAcknowledge={onAcknowledgeAlert}
              onResolve={onResolveAlert}
              defaultOpen={index === 0} // Primer grupo abierto por defecto
            />
          ))}
        </div>
      )}
      
      {/* Resumen */}
      {groups.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-700/30 text-xs text-slate-600">
          <span>{filteredAlerts.length} alertas en vista</span>
          <span>•</span>
          <span>{groups.length} grupos</span>
        </div>
      )}
    </div>
  );
});

export default ExitAlertsGroupedFeed;