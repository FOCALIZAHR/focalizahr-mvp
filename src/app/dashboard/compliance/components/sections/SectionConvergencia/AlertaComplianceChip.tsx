'use client';

// Chip de alerta compliance con SLA. Si SLA está vencido, render line-through
// "SLA INCUMPLIDO · REGISTRO PERMANENTE" — accountability sin alarmar.
// Spec sec "Alertas de Compliance activas" + "Caso SLA vencido".

import { Shield } from 'lucide-react';
import { resolveAlertLabel } from './_shared/ALERT_LABELS';
import type { ComplianceReportAlert } from '@/types/compliance';

interface Props {
  alert: ComplianceReportAlert;
}

function isOverdue(alert: ComplianceReportAlert): boolean {
  if (alert.slaStatus === 'overdue') return true;
  if (!alert.dueDate) return false;
  return new Date(alert.dueDate).getTime() < Date.now();
}

function slaHoursRemaining(alert: ComplianceReportAlert): number | null {
  if (!alert.dueDate) return null;
  const ms = new Date(alert.dueDate).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 3600_000));
}

export default function AlertaComplianceChip({ alert }: Props) {
  const overdue = isOverdue(alert);

  if (overdue) {
    // Spec: line-through en slate, sin rojo. Texto de accountability.
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/50">
        <Shield className="w-3 h-3 text-slate-600" strokeWidth={1.5} />
        <span className="text-[11px] font-mono text-slate-600 line-through tracking-wide">
          SLA INCUMPLIDO · REGISTRO PERMANENTE
        </span>
      </div>
    );
  }

  const horas = slaHoursRemaining(alert);
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/50">
      <Shield className="w-3 h-3 text-slate-500" strokeWidth={1.5} />
      <span className="text-[11px] font-mono text-slate-300">
        {resolveAlertLabel(alert.alertType)}
      </span>
      {horas !== null ? (
        <>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-500">SLA {horas}h</span>
        </>
      ) : null}
    </div>
  );
}
