'use client';

// Chip de alerta compliance.
// El CEO no gestiona timers — eliminamos "SLA Nh" del chip activo.
// Si SLA está vencido, render line-through "SLA INCUMPLIDO · REGISTRO PERMANENTE"
// se mantiene — accountability sin alarmar (Plan v2 sec "SLA vencido").
//
// Cuando existe `consecuencia` (narrativa ejecutiva del engine —
// `narratives.artefacto4_alertas[i].consecuencia`), se renderiza debajo del
// label como texto explicativo. Sin esa narrativa, solo el label.

import { Shield } from 'lucide-react';
import { resolveAlertLabel } from './_shared/ALERT_LABELS';
import { ALERTA_GLOSARIO } from '@/app/dashboard/compliance/lib/glosario';
import { TooltipContext } from '@/components/ui/TooltipContext';
import type { ComplianceReportAlert } from '@/types/compliance';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

interface Props {
  alert: ComplianceReportAlert;
  /**
   * Texto ejecutivo de la consecuencia para este tipo de alerta.
   * Viene de `narratives.artefacto4_alertas` lookup'd por alertType en el padre.
   * Optional: si no existe (campañas legacy o tipo sin narrativa), solo se
   * muestra el label.
   */
  consecuencia?: string;
}

function isOverdue(alert: ComplianceReportAlert): boolean {
  if (alert.slaStatus === 'overdue') return true;
  if (!alert.dueDate) return false;
  return new Date(alert.dueDate).getTime() < Date.now();
}

export default function AlertaComplianceChip({ alert, consecuencia }: Props) {
  const overdue = isOverdue(alert);
  // Glosario contextual — defensive: alertType desconocido → sin tooltip.
  // El title del tooltip espeja el label real del chip (resolveAlertLabel).
  const glosario = ALERTA_GLOSARIO[alert.alertType as ComplianceAlertType];
  const glosarioTitle = resolveAlertLabel(alert.alertType);

  if (overdue) {
    // SLA vencido — texto tachado en slate, sin rojo. Accountability sin alarmar.
    const chip = (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/50">
        <Shield className="w-3 h-3 text-slate-600" strokeWidth={1.5} />
        <span className="text-[11px] font-mono text-slate-600 line-through tracking-wide">
          SLA INCUMPLIDO · REGISTRO PERMANENTE
        </span>
      </div>
    );
    return glosario ? (
      <TooltipContext
        title={glosarioTitle}
        explanation={glosario}
        variant="pattern"
        position="bottom"
        usePortal
      >
        {chip}
      </TooltipContext>
    ) : (
      chip
    );
  }

  // Activa: label + consecuencia ejecutiva. Cero "SLA Nh" — el CEO no gestiona timers.
  const chip = (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/50">
      <Shield className="w-3 h-3 text-slate-500" strokeWidth={1.5} />
      <span className="text-[11px] font-mono text-slate-300">
        {resolveAlertLabel(alert.alertType)}
      </span>
    </div>
  );

  return (
    <div className="inline-flex flex-col items-start gap-1 max-w-full">
      {glosario ? (
        <TooltipContext
          title={glosarioTitle}
          explanation={glosario}
          variant="pattern"
          position="bottom"
          usePortal
        >
          {chip}
        </TooltipContext>
      ) : (
        chip
      )}
      {consecuencia ? (
        <p className="text-[11px] font-light leading-[1.5] text-slate-500 pl-1">
          {consecuencia}
        </p>
      ) : null}
    </div>
  );
}
