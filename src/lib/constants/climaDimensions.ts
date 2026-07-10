// src/lib/constants/climaDimensions.ts
// ════════════════════════════════════════════════════════════════════════════
// Las 8 dimensiones de clima (taxonomía real Gate 1A) — fuente única de label +
// ícono + orden para el ClimaToolbar y ClimaDimensionDetail. Íconos Lucide
// outline monocromáticos (sin color propio — el color lo pone la zona).
// El `key` es el questionCategory real (contrato inmutable); solo el label es libre.
// ════════════════════════════════════════════════════════════════════════════

import {
  Compass,
  Award,
  GraduationCap,
  Sprout,
  MessageSquare,
  Star,
  Smile,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface ClimaDimension {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const CLIMA_DIMENSIONS: readonly ClimaDimension[] = [
  { key: 'liderazgo', label: 'Liderazgo', icon: Compass },
  { key: 'autonomia', label: 'Autonomía', icon: Award },
  { key: 'desarrollo', label: 'Desarrollo', icon: GraduationCap },
  { key: 'crecimiento', label: 'Crecimiento', icon: Sprout },
  { key: 'comunicacion', label: 'Comunicación', icon: MessageSquare },
  { key: 'reconocimiento', label: 'Reconocimiento', icon: Star },
  { key: 'satisfaccion', label: 'Satisfacción', icon: Smile },
  { key: 'compensaciones', label: 'Compensaciones', icon: Wallet },
] as const;

const BY_KEY = new Map(CLIMA_DIMENSIONS.map((d) => [d.key, d]));

/** Label ejecutivo de una dimensión (fallback = capitalizar el key). */
export function dimensionLabel(key: string): string {
  return BY_KEY.get(key)?.label ?? key.charAt(0).toUpperCase() + key.slice(1);
}
