// Copy de las 3 variantes de empty state (ConvergenciaEmptyState).
// Plan sec "Componente 4 — ConvergenciaEmptyState".
//
// Variante C ("Los detectores internos están activos") NO dice "no hay datos".
// Es proactiva: el sistema está listo, faltan productos para amplificar.

import {
  ScanSearch,
  CheckCircle2,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { EmptyStateVariant } from './helpers';

export interface EmptyStateCopy {
  icon: LucideIcon;
  /** Título principal. Una sola frase. */
  titulo: string;
  /** Subtexto en slate-400 font-light, opcional. */
  subtitulo?: string;
}

export const EMPTY_STATE_COPY: Record<EmptyStateVariant, EmptyStateCopy> = {
  // Variante A — sin ciclo completado
  sin_ciclo: {
    icon: ScanSearch,
    titulo:
      'Cuando el primer ciclo cierre, aquí aparecerá dónde convergen las señales.',
  },

  // Variante B — ciclo completo, ninguna convergencia detectada
  sin_convergencia: {
    icon: CheckCircle2,
    titulo:
      'Ningún departamento muestra convergencia de señales en este ciclo.',
    subtitulo:
      'El ISA y el texto libre no confirman patrones coincidentes en ningún área.',
  },

  // Variante C — ciclo completo, solo Motor A activo, sin otros productos
  solo_motor_a: {
    icon: Layers,
    titulo: 'Los detectores internos están activos.',
    subtitulo:
      'Cuando se agreguen Exit Intelligence u Onboarding Journey, las señales externas amplificarán lo que el instrumento ya detecta por sí solo.',
  },
};
