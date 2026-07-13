// src/lib/services/clima/engagementDivergenceNarrative.ts
// Bloque A — narrativa de divergencia favorabilidad↔intensidad del gauge org.

import { CLIMA_DIVERGENCE_MEAN_MIN_DELTA } from './climaThresholds';

/**
 * Narrativa de divergencia favorabilidad↔intensidad para el footer del gauge org
 * (Lobby). Devuelve null cuando NO hay divergencia significativa → el footer cae a
 * la línea única de favorabilidad (comportamiento sellado, sin cambios).
 *
 * Divergencia = la media (escala 1-5, más sensible que el %) se mueve de forma
 * significativa en sentido contrario/independiente a la favorabilidad que el CEO ve
 * en la línea 1 del gauge.
 *
 * Gate favorabilidad: Math.round(favMomentum) — EL MISMO redondeo que la línea 1
 * (EngagementGauge getFooterText) — para que la dirección narrada nunca contradiga
 * el entero que el CEO lee arriba. NO introduce umbral nuevo de favorabilidad.
 * Gate media: |meanMomentum| >= CLIMA_DIVERGENCE_MEAN_MIN_DELTA (0.2, escala 1-5).
 */
export function getEngagementDivergenceNarrative(params: {
  favMomentum: number | null; // orgMomentum (delta favorabilidad, pp)
  meanMomentum: number | null; // orgMeanMomentum (delta media, escala 1-5)
}): string | null {
  const { favMomentum, meanMomentum } = params;
  if (favMomentum === null || meanMomentum === null) return null;

  // Espejo de la línea 1 del gauge: la dirección se deriva del entero visible.
  const favRounded = Math.round(favMomentum);

  // CASO A — favorabilidad sube/se mantiene, la intensidad cae.
  if (favRounded >= 0 && meanMomentum <= -CLIMA_DIVERGENCE_MEAN_MIN_DELTA) {
    return 'Sube el porcentaje de aprobación, pero el grupo insatisfecho se volvió más crítico.';
  }
  // CASO B — favorabilidad baja/se mantiene, la insatisfacción crítica disminuye.
  if (favRounded <= 0 && meanMomentum >= CLIMA_DIVERGENCE_MEAN_MIN_DELTA) {
    return 'Baja el porcentaje de aprobación, pero disminuyó el nivel de insatisfacción crítica.';
  }
  // Mismo sentido, o media bajo el piso → sin divergencia.
  return null;
}
