// Labels + iconos Lucide para los Sellos Forenses A1-A5.
// Los sellos son chips pequeños neutros (sin color por severidad — la
// urgencia se comunica por orden de banda + peso de borde + Tesla line).
// Spec sec "Sellos Forenses (A1–A5)".
//
// Los strings de label viven en `@/lib/services/compliance/casoLabels`
// (single source of truth compartido con el backend narrative engine).
// Acá solo combinamos esos labels con los íconos lucide-react.

import {
  GitMerge,
  Layers,
  AlertTriangle,
  GitBranch,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { CASO_LABELS } from '@/lib/services/compliance/casoLabels';
import type { CasoMotorA } from './helpers';

export interface SelloForenseEntry {
  /** Label ejecutivo visible al CEO. NUNCA "Caso A1" o nombres técnicos. */
  label: string;
  /** Ícono Lucide. Add semántica sin usar color. */
  icon: LucideIcon;
}

export const SELLOS_FORENSES_LABELS: Record<CasoMotorA, SelloForenseEntry> = {
  A1: { label: CASO_LABELS.A1, icon: GitMerge },
  A2: { label: CASO_LABELS.A2, icon: Layers },
  A3: { label: CASO_LABELS.A3, icon: AlertTriangle },
  A4: { label: CASO_LABELS.A4, icon: GitBranch },
  A5: { label: CASO_LABELS.A5, icon: EyeOff },
};
