// Labels + iconos Lucide para los Sellos Forenses A1-A5.
// Los sellos son chips pequeños neutros (sin color por severidad — la
// urgencia se comunica por orden de banda + peso de borde + Tesla line).
// Spec sec "Sellos Forenses (A1–A5)".

import {
  GitMerge,
  Layers,
  AlertTriangle,
  GitBranch,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import type { CasoMotorA } from './helpers';

export interface SelloForenseEntry {
  /** Label ejecutivo visible al CEO. NUNCA "Caso A1" o nombres técnicos. */
  label: string;
  /** Ícono Lucide. Add semántica sin usar color. */
  icon: LucideIcon;
}

export const SELLOS_FORENSES_LABELS: Record<CasoMotorA, SelloForenseEntry> = {
  A1: {
    label: 'Doble confirmación',
    icon: GitMerge,
  },
  A2: {
    label: 'Teatro detectado',
    icon: Layers,
  },
  A3: {
    label: 'Sesgo de género',
    icon: AlertTriangle,
  },
  A4: {
    label: 'Variable de liderazgo',
    icon: GitBranch,
  },
  A5: {
    label: 'Silencio bajo ISA alto',
    icon: EyeOff,
  },
};
