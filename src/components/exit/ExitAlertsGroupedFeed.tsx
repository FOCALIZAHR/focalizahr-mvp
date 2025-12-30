// src/components/exit/ExitAlertsGroupedFeed.tsx
// ============================================================================
// FEED DE ALERTAS EXIT - AGRUPADO POR TIPO
// ============================================================================
// DISEÑO: FocalizaHR Philosophy v2.0
// - Reutiliza AlertsTabsToggle (Tesla/Apple slider)
// - Opción C: Solo CRÍTICO destacado (un solo color de acento)
// - SLA mejorado: "Vencido 3d" en lugar de solo "Vencido"
// - Ordenamiento comunica urgencia (crítico → alto → medio → bajo)
// - Sin iconos infantiles, sin arcoíris de colores
// - Mobile-first, touch targets 44px
// - NUEVO: Modal para alertas gestionadas
// ============================================================================

'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Scale,
  TrendingDown,
  BarChart3,
  Building2,
  Link2,
  Eye
} from 'lucide-react';

// Reutilizamos el TabsToggle de Onboarding (diseño Tesla/Apple)
import AlertsTabsToggle from '@/components/onboarding/AlertsTabsToggle';
import FocalizaIntelligenceAlertModal from './FocalizaIntelligenceAlertModal';
import ResolvedAlertDetailModal from './ResolvedAlertDetailModal';
import type { ExitAlertWithRelations } from '@/types/exit';

// ============================================================================
// INTERFACES
// ============================================================================

interface ExitAlertsGroupedFeedProps {
  alerts: ExitAlertWithRelations[];
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  onAcknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  onResolveAlert: (id: string, notes: string) => Promise<void>;
  loading: boolean;
}

// ============================================================================
// CONFIGURACIÓN - TIPOS DE ALERTA
// ============================================================================

// Iconos por tipo (outline, monocromáticos - sin color)
const ALERT_TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<any>;
  label: string;
  priority: number;
}> = {
  ley_karin: {
    icon: Scale,
    label: 'Ley Karin',
    priority: 1
  },
  toxic_exit_detected: {
    icon: TrendingDown,
    label: 'Salida Tóxica',
    priority: 2
  },
  nps_critico: {
    icon: BarChart3,
    label: 'NPS Crítico',
    priority: 3
  },
  liderazgo_concentracion: {
    icon: BarChart3,
    label: 'Concentración Liderazgo',
    priority: 4
  },
  department_exit_pattern: {
    icon: Building2,
    label: 'Patrón Departamental',
    priority: 5
  },
  onboarding_exit_correlation: {
    icon: Link2,
    label: 'Correlación Onboarding',
    priority: 6
  }
};

const DEFAULT_CONFIG = {
  icon: AlertTriangle,
  label: 'Alerta',
  priority: 99
};

// Orden de severidad para sorting
const SEVERITY_ORDER: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula estado del SLA con días vencidos
 * MEJORA: "Vencido 3d" en lugar de solo "Vencido"
 */
const getSLAStatus = (alert: ExitAlertWithRelations): { 
  label: string; 
  isOverdue: boolean;
  color: string;
} => {
  if (!alert.dueDate) {
    return { label: 'Sin SLA', isOverdue: false, color: 'text-slate-500' };
  }
  
  const now = new Date();
  const due = new Date(alert.dueDate);
  const hoursRemaining = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // VENCIDO - mostrar cuántos días
  if (hoursRemaining < 0) {
    const hoursOverdue = Math.abs(hoursRemaining);
    if (hoursOverdue < 24) {
      return { label: `Vencido ${Math.ceil(hoursOverdue)}h`, isOverdue: true, color: 'text-red-400' };
    }
    const daysOverdue = Math.ceil(hoursOverdue / 24);
    return { label: `Vencido ${daysOverdue}d`, isOverdue: true, color: 'text-red-400' };
  }
  
  // Menos de 8 horas - urgente
  if (hoursRemaining < 8) {
    return { label: `${Math.ceil(hoursRemaining)}h`, isOverdue: false, color: 'text-amber-400' };
  }
  
  // Menos de 24 horas
  if (hoursRemaining < 24) {
    return { label: `${Math.ceil(hoursRemaining)}h`, isOverdue: false, color: 'text-slate-400' };
  }
  
  // Días restantes
  const daysRemaining = Math.ceil(hoursRemaining / 24);
  return { label: `${daysRemaining}d`, isOverdue: false, color: 'text-slate-500' };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExitAlertsGroupedFeed = memo(function ExitAlertsGroupedFeed({
  alerts,
  activeTab,
  onTabChange,
  onAcknowledgeAlert,
  onResolveAlert,
  loading
}: ExitAlertsGroupedFeedProps) {
  
  const [processingAlert, setProcessingAlert] = useState<string | null>(null);
  const [alertForModal, setAlertForModal] = useState<ExitAlertWithRelations | null>(null);
  const [resolvedAlertForModal, setResolvedAlertForModal] = useState<ExitAlertWithRelations | null>(null);
  
  // ========================================
  // CONTADORES PARA TABS
  // ========================================
  
  const counts = useMemo(() => ({
    active: alerts.filter(a => a.status === 'pending').length,
    managed: alerts.filter(a => a.status !== 'pending').length,
    all: alerts.length
  }), [alerts]);
  
  // ========================================
  // FILTRADO Y AGRUPACIÓN
  // ========================================
  
  const groupedAlerts = useMemo(() => {
    // 1. Filtrar por tab activo
    let filtered: ExitAlertWithRelations[];
    switch(activeTab) {
      case 'active': 
        filtered = alerts.filter(a => a.status === 'pending');
        break;
      case 'managed': 
        filtered = alerts.filter(a => a.status !== 'pending');
        break;
      default: 
        filtered = [...alerts];
    }
    
    // 2. Agrupar por tipo de alerta
    const groups: Record<string, ExitAlertWithRelations[]> = {};
    
    filtered.forEach(alert => {
      const type = alert.alertType || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(alert);
    });
    
    // 3. Ordenar alertas dentro de cada grupo por severidad
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => {
        const orderA = SEVERITY_ORDER[a.severity] || 99;
        const orderB = SEVERITY_ORDER[b.severity] || 99;
        return orderA - orderB;
      });
    });
    
    // 4. Convertir a array y ordenar grupos por prioridad
    return Object.entries(groups)
      .map(([type, typeAlerts]) => ({
        type,
        config: ALERT_TYPE_CONFIG[type] || DEFAULT_CONFIG,
        alerts: typeAlerts
      }))
      .sort((a, b) => a.config.priority - b.config.priority);
  }, [alerts, activeTab]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleAlertClick = useCallback((alert: ExitAlertWithRelations) => {
    if (alert.status === 'pending') {
      // Alerta pendiente → modal de acción
      setAlertForModal(alert);
    } else {
      // Alerta gestionada → modal de detalle de resolución
      setResolvedAlertForModal(alert);
    }
  }, []);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-8">
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER DE SECCIÓN
          ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-1">
        <h3 className="text-xl md:text-2xl font-light text-white">
          Alertas{' '}
          <span className="text-slate-500">Prioritarias</span>
        </h3>
        <p className="text-sm text-slate-500">
          Detección automática · Compliance Ley Karin
        </p>
      </div>
      
      {/* ════════════════════════════════════════════════════════════════════
          TABS - Reutilizando AlertsTabsToggle de Onboarding
          ════════════════════════════════════════════════════════════════════ */}
      <AlertsTabsToggle 
        activeTab={activeTab}
        onTabChange={onTabChange}
        counts={counts}
        isTransitioning={loading}
      />
      
      {/* ════════════════════════════════════════════════════════════════════
          LISTA AGRUPADA POR TIPO
          ════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        
        {/* Estado vacío */}
        {groupedAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 md:py-20 text-center"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-green-400" strokeWidth={1.5} />
            </div>
            <p className="text-base md:text-lg text-slate-300 font-light mb-1">
              {activeTab === 'active' && 'Sin alertas pendientes'}
              {activeTab === 'managed' && 'Sin alertas gestionadas'}
              {activeTab === 'all' && 'No hay alertas en el sistema'}
            </p>
            <p className="text-sm text-slate-500">
              {activeTab === 'active' && 'El ecosistema está funcionando bien'}
              {activeTab === 'managed' && 'Las alertas gestionadas aparecerán aquí'}
              {activeTab === 'all' && 'Las alertas se generan automáticamente'}
            </p>
          </motion.div>
        ) : (
          groupedAlerts.map(({ type, config, alerts: typeAlerts }) => {
            const Icon = config.icon;
            
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden"
              >
                {/* Línea Tesla sutil */}
                <div className="fhr-top-line" />
                
                {/* ════════════════════════════════════════════════════════
                    Header del grupo - Minimalista
                    ════════════════════════════════════════════════════════ */}
                <div className="px-5 md:px-6 py-4 border-b border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="fhr-icon-sm fhr-icon-muted" strokeWidth={1.5} />
                      <span className="font-medium text-white">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {typeAlerts.length} alerta{typeAlerts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {/* ════════════════════════════════════════════════════════
                    Lista de alertas
                    ════════════════════════════════════════════════════════ */}
                <div className="divide-y divide-slate-700/20">
                  {typeAlerts.map(alert => {
                    const isProcessing = processingAlert === alert.id;
                    const slaStatus = getSLAStatus(alert);
                    const isManaged = alert.status !== 'pending';
                    const isCritical = alert.severity === 'critical';
                    
                    return (
                      <div 
                        key={alert.id} 
                        className={`
                          group
                          ${isManaged ? 'opacity-60' : ''}
                        `}
                      >
                        <div 
                          className={`
                            px-5 md:px-6 py-4 md:py-5
                            flex items-center gap-3 md:gap-4 
                            min-h-[72px]
                            transition-all duration-200
                            cursor-pointer hover:bg-slate-700/20
                            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
                          `}
                          onClick={() => !isProcessing && handleAlertClick(alert)}
                        >
                          {/* Contenido principal */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-medium text-white mb-0.5 md:mb-1">
                              {alert.department?.displayName || 'Sin departamento'}
                            </p>
                            <p className="text-xs md:text-sm text-slate-400 truncate">
                              {alert.title || alert.description}
                            </p>
                          </div>
                          
                          {/* ══════════════════════════════════════════════
                              OPCIÓN C: Solo CRÍTICO tiene badge destacado
                              ══════════════════════════════════════════════ */}
                          {isCritical && !isManaged && (
                            <span className="
                              fhr-badge fhr-badge-danger
                              flex items-center gap-1.5
                            ">
                              <AlertTriangle className="fhr-icon-xs" strokeWidth={2} />
                              <span className="hidden sm:inline">Crítico</span>
                            </span>
                          )}
                          
                          {/* SLA - Mejorado con días vencidos */}
                          <div className={`
                            flex items-center gap-1.5 
                            min-w-[70px] md:min-w-[90px]
                            text-xs md:text-sm
                            ${slaStatus.color}
                          `}>
                            <Clock className="fhr-icon-xs" strokeWidth={1.5} />
                            <span>{slaStatus.label}</span>
                          </div>
                          
                          {/* Indicador de estado / Acción */}
                          {isManaged ? (
                            <div className="
                              w-9 h-9 md:w-10 md:h-10 
                              rounded-full 
                              flex items-center justify-center 
                              bg-green-500/10
                              border border-transparent
                              group-hover:bg-slate-700/30
                              group-hover:border-slate-600/30
                              transition-all duration-200
                            ">
                              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-400 group-hover:hidden" strokeWidth={1.5} />
                              <Eye className="h-4 w-4 md:h-5 md:w-5 text-slate-400 hidden group-hover:block" strokeWidth={1.5} />
                            </div>
                          ) : (
                            <div className="
                              w-9 h-9 md:w-10 md:h-10 
                              rounded-full 
                              flex items-center justify-center 
                              bg-slate-700/50 
                              border border-slate-600/50
                              group-hover:bg-cyan-500/20 
                              group-hover:border-cyan-500/30 
                              transition-all duration-200
                            ">
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      
      {/* ════════════════════════════════════════════════════════════════════
          FOOTER INFO - Solo si hay alertas
          ════════════════════════════════════════════════════════════════════ */}
      {groupedAlerts.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-xs text-slate-600">
          <span>{counts.active} pendiente{counts.active !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{groupedAlerts.length} tipo{groupedAlerts.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* ════════════════════════════════════════════════════════════════════
          Modal Intermedio - FocalizaHR Intelligence (para alertas pendientes)
          ════════════════════════════════════════════════════════════════════ */}
      <FocalizaIntelligenceAlertModal
        isOpen={!!alertForModal}
        onClose={() => setAlertForModal(null)}
        alertId={alertForModal?.id || ''}
        alertType={(alertForModal?.alertType as any) || 'toxic_exit_detected'}
        departmentName={alertForModal?.department?.displayName || 'Departamento'}
        severity={(alertForModal?.severity as any) || 'medium'}
      />
      
      {/* ════════════════════════════════════════════════════════════════════
          Modal de Alerta Resuelta (para alertas gestionadas)
          ════════════════════════════════════════════════════════════════════ */}
      <ResolvedAlertDetailModal
        isOpen={!!resolvedAlertForModal}
        onClose={() => setResolvedAlertForModal(null)}
        alert={resolvedAlertForModal}
      />
    </div>
  );
});

export default ExitAlertsGroupedFeed;