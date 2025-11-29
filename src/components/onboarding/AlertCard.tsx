// src/components/onboarding/AlertCard.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, User, Calendar } from 'lucide-react';
import { SuccessButton, NeutralButton } from '@/components/ui/MinimalistButton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlertCardProps {
  alert: {
    id: string;
    title: string;
    description: string;
    severity: string;
    slaStatus: string;
    status: string;
    alertType: string;
    stage: number | null;
    score: number | null;
    dimension: string | null;
    dueDate: Date;
    createdAt: Date;
    journey: {
      fullName: string;
      department: {
        displayName: string;
      } | null;
    };
  };
  onAcknowledge: (id: string) => Promise<void>;
}

/**
 * SEVERITY BADGE STYLES
 */
const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Crítico'
  },
  high: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Alto'
  },
  medium: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Medio'
  },
  low: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    label: 'Bajo'
  }
};

/**
 * SLA STATUS BADGE STYLES
 */
const SLA_STYLES = {
  violated: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'SLA Violado'
  },
  at_risk: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'En Riesgo'
  },
  on_time: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'A Tiempo'
  }
};

/**
 * ALERT TYPE LABELS
 */
const ALERT_TYPE_LABELS: Record<string, string> = {
  low_score: 'Score Bajo',
  stage_incomplete: 'Etapa Incompleta',
  risk_escalation: 'Escalación de Riesgo',
  abandono_dia_1: 'Abandono Día 1',
  bienvenida_fallida: 'Bienvenida Fallida',
  confusion_rol: 'Confusión de Rol',
  desajuste_rol: 'Desajuste de Rol',
  riesgo_fuga: 'Riesgo de Fuga',
  detractor_cultural: 'Detractor Cultural'
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  
  const severityConfig = SEVERITY_STYLES[alert.severity as keyof typeof SEVERITY_STYLES] || SEVERITY_STYLES.low;
  const slaConfig = SLA_STYLES[alert.slaStatus as keyof typeof SLA_STYLES] || SLA_STYLES.on_time;
  
  const handleAcknowledge = async () => {
    try {
      setIsAcknowledging(true);
      await onAcknowledge(alert.id);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fhr-card hover:border-cyan-500/30 transition-all"
    >
      {/* HEADER - Badges y Meta */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity Badge */}
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${severityConfig.bg} ${severityConfig.text} border ${severityConfig.border}
          `}>
            {severityConfig.label}
          </span>
          
          {/* SLA Badge */}
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${slaConfig.bg} ${slaConfig.text}
          `}>
            {slaConfig.label}
          </span>
          
          {/* Alert Type */}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400">
            {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
          </span>
        </div>
        
        {/* Status Badge */}
        {alert.status === 'acknowledged' && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
            Accionada
          </span>
        )}
      </div>
      
      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {alert.title}
      </h3>
      
      {/* DESCRIPTION */}
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        {alert.description}
      </p>
      
      {/* METADATA GRID */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-700/50">
        {/* Colaborador */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">Colaborador</p>
            <p className="text-sm text-slate-300 font-medium">{alert.journey.fullName}</p>
          </div>
        </div>
        
        {/* Departamento */}
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs text-slate-500">Departamento</p>
            <p className="text-sm text-slate-300">
              {alert.journey.department?.displayName || 'Sin asignar'}
            </p>
          </div>
        </div>
        
        {/* Etapa */}
        {alert.stage && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Etapa</p>
              <p className="text-sm text-slate-300">Día {alert.stage}</p>
            </div>
          </div>
        )}
        
        {/* Score */}
        {alert.score !== null && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-xs text-slate-400">S</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Score</p>
              <p className="text-sm text-slate-300">{alert.score.toFixed(1)}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* FOOTER - Due Date + Action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>
            Vence {formatDistanceToNow(new Date(alert.dueDate), { 
              addSuffix: true,
              locale: es 
            })}
          </span>
        </div>
        
        {alert.status === 'pending' && (
          <SuccessButton
            size="sm"
            isLoading={isAcknowledging}
            onClick={handleAcknowledge}
          >
            {isAcknowledging ? 'Marcando...' : 'Marcar como Accionada'}
          </SuccessButton>
        )}
        
        {alert.status === 'acknowledged' && (
          <NeutralButton size="sm" disabled>
            Accionada ✓
          </NeutralButton>
        )}
      </div>
    </motion.div>
  );
};