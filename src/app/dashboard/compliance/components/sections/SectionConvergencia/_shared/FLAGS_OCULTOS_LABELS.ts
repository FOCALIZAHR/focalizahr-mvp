// Etiquetas de los "Sellos Forenses" — flags ocultos del backend que el brief
// pide hacer visibles en <ConvergenciaConfirmada /> (Condición 3).
//
// Origen de los flags:
//   - silencioDetected (ConvergenciaEngine): patrón silencio_organizacional del LLM con intensidad >= 0.5
//   - deterioroPulso (ConvergenciaEngine): 3+ períodos consecutivos de Pulso Express a la baja
//   - senalIgnorada (ConvergenciaEngine): salida reciente con Onboarding Journey bajo previo
//   - teatroCumplimiento (detectTeatroCumplimiento): safetyScore >= 4.0 Y patrón LLM intensidad >= 0.6
//
// Visual: rectángulo bordes afilados, font-mono uppercase, fondo casi negro
// (#070d1a), texto slate o ámbar tenue según severidad.

import type { FlagOcultoKey } from './helpers';

export interface FlagOcultoCopy {
  /** Texto del rectángulo monospace, uppercase. */
  sello: string;
  /** 1 línea ejecutiva debajo del sello. */
  descripcion: string;
  /** 'media' = slate-400 / 'alta' = amber-400 (color del sello). */
  severidad: 'media' | 'alta';
}

export const FLAGS_OCULTOS_LABELS: Record<FlagOcultoKey, FlagOcultoCopy> = {
  silencio: {
    sello: 'SILENCIO_ORGANIZACIONAL',
    descripcion:
      'El análisis del texto libre detectó patrón de retracción en las respuestas.',
    severidad: 'alta',
  },
  deterioro: {
    sello: 'DETERIORO_SOSTENIDO',
    descripcion:
      'Pulso Express descendió 3+ períodos consecutivos. La caída no es ruido.',
    severidad: 'alta',
  },
  ignorada: {
    sello: 'SEÑAL_IGNORADA',
    descripcion:
      'Salidas recientes con Onboarding Journey bajo previo. Hubo aviso temprano que no se gestionó.',
    severidad: 'alta',
  },
  teatro: {
    sello: 'TEATRO_DE_CUMPLIMIENTO',
    descripcion:
      'Las métricas numéricas dicen una cosa. Las respuestas proyectivas dicen otra. La distancia es la señal.',
    severidad: 'alta',
  },
};
