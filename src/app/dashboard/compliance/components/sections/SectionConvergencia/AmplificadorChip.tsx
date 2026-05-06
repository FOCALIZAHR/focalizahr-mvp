'use client';

// Chip Motor B — onboarding/salidas/alertas externas.
// Paleta neutra (sin colores por severidad). Spec sec "Amplificadores Motor B".

import { Users, LogOut, Bell, type LucideIcon } from 'lucide-react';

interface Props {
  variant: 'onboarding' | 'salidas' | 'alerta_externa';
  label: string;
}

const ICONS: Record<Props['variant'], LucideIcon> = {
  onboarding: Users,
  salidas: LogOut,
  alerta_externa: Bell,
};

export default function AmplificadorChip({ variant, label }: Props) {
  const Icon = ICONS[variant];
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-800/60 border border-slate-700/50">
      <Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
      <span className="text-[11px] font-mono text-slate-300">{label}</span>
    </div>
  );
}
