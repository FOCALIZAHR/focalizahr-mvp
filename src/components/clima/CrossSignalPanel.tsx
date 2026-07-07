'use client';

// src/components/clima/CrossSignalPanel.tsx
// Señales convergentes del diagnóstico (correlationFlags v1: teatro de
// cumplimiento, hotspot de rotación, correlación clima×rotación). Genérico
// cross-producto. Gate 6 agrega las señales Fase 2A. Devuelve null si el
// departamento no dispara ninguna señal (panel de detalle, no pantalla).

import { Drama, Flame, TrendingDown } from 'lucide-react';
import type { ClimaCorrelationFlags } from '@/lib/services/clima/PulseEngine';

interface CrossSignalPanelProps {
  flags: ClimaCorrelationFlags | null;
}

export default function CrossSignalPanel({ flags }: CrossSignalPanelProps) {
  if (!flags) return null;

  const signals: { icon: typeof Flame; label: string; detail: string }[] = [];

  if (flags.theatreDetected === true) {
    signals.push({
      icon: Drama,
      label: 'Teatro de cumplimiento',
      detail: 'Cumplimiento formal sano pero engagement bajo — la forma no refleja el clima.',
    });
  }
  if (flags.hotspot?.isHotspot === true) {
    signals.push({
      icon: Flame,
      label: 'Hotspot de rotación',
      detail: 'Engagement bajo el percentil 25 de la compañía, con presión de rotación.',
    });
  }
  if (flags.climaTurnover?.evaluable && flags.climaTurnover.pearsonR !== null) {
    signals.push({
      icon: TrendingDown,
      label: 'Clima × rotación',
      detail: `Correlación r=${flags.climaTurnover.pearsonR.toFixed(2)} entre engagement y rotación (${flags.climaTurnover.nDepts} deptos).`,
    });
  }

  if (signals.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
        Señales convergentes
      </p>
      <div className="space-y-3">
        {signals.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">{s.label}</p>
                <p className="text-[11px] font-light text-slate-500 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
