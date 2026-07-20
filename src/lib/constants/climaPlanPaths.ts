// src/lib/constants/climaPlanPaths.ts
// ════════════════════════════════════════════════════════════════════════════
// Los 4 caminos del carrusel de Planes de Acción (Tab 1, Gate 5D-i). Config visual
// (label humano/tagline/2 líneas/mission/color/ícono) por bloque de climaPlanRouting.
//
// COPY = pasado por focalizahr-narrativas (labels humanos que se entienden en la
// primera lectura — "sistémico" falló ese test con gerentes reales). COLORES =
// IDENTIDAD DE CAMINO, no semáforo de severidad (la severidad de cada caso sigue
// en el badge de zona de su ClimaDecisionCard). Copy final PROVISIONAL (Studio IA).
// ════════════════════════════════════════════════════════════════════════════

import { Network, Crosshair, HelpCircle, Zap, type LucideIcon } from 'lucide-react';
import type { ClimaPlanBlock } from '@/lib/services/clima/climaPlanRouting';

export interface ClimaPlanPathDef {
  /** Nombre humano (primera lectura, sin jerga). */
  label: string;
  /** Descripción de 1 línea en la card del carrusel. */
  tagline: string;
  /** 2 líneas de identidad en el 35% del workspace. */
  lines: [string, string];
  /** Intro guiada del workspace. */
  mission: string;
  /**
   * Fragmentos EXACTOS de `mission` que se resaltan (negrita + color del camino).
   * Deben aparecer verbatim en `mission`. El color es `def.color` — el mismo del
   * ícono/label/Tesla line de esa categoría: identidad de camino, NO un semáforo
   * ni un significado nuevo por color.
   */
  highlights: readonly string[];
  color: string;
  icon: LucideIcon;
}

export const CLIMA_PLAN_PATHS: Record<ClimaPlanBlock, ClimaPlanPathDef> = {
  sistemico: {
    label: 'Problemas de Fondo',
    tagline: 'Varias señales de una misma área cayeron juntas — no es un punto aislado.',
    lines: ['Varias señales de una misma área, bajas a la vez.', 'Cada caso se revisa solo; el patrón pesa más.'],
    mission:
      'Aquí falló un tema completo, no una pregunta aislada. La plataforma te propone un plan de acción estructural basado en evidencia, pero no se aprueba con un solo clic. Entra a revisar el diagnóstico y el programa sugerido; a diferencia de los casos puntuales, ejecutar esta iniciativa requiere mayor compromiso y coordinación directa con tu equipo de Personas.',
    highlights: ['no se aprueba con un solo clic', 'mayor compromiso'],
    color: '#A78BFA',
    icon: Network,
  },
  critico: {
    label: 'Foco urgente',
    tagline: 'Un punto en zona de riesgo que no puede esperar.',
    lines: ['Un punto en zona de riesgo.', 'Decisión individual, no puede esperar.'],
    mission:
      'Acá cada caso es una pregunta puntual — no un tema completo como en Problemas de Fondo — pero de alto riesgo para la compañía. Tienes todo el contexto, el costo de inacción y un plan de acción basado en evidencia para cada uno. Requieren tu revisión manual y aprobación individual urgente.',
    highlights: ['aprobación individual urgente'],
    color: '#22D3EE',
    icon: Crosshair,
  },
  generico: {
    label: 'Señal sin receta',
    tagline: 'Detectada, pero todavía sin una acción específica escrita.',
    lines: ['Detectada, sin acción específica aún.', 'El criterio lo ponés vos.'],
    mission:
      'Son preguntas puntuales y de baja gravedad, para las cuales el sistema todavía no tiene una receta específica probada — te muestra una sugerencia general, la decisión final es tuya.',
    highlights: ['la decisión final es tuya'],
    color: '#64748B',
    icon: HelpCircle,
  },
  gestion_corriente: {
    label: 'Victorias rápidas',
    tagline: 'Bajo esfuerzo, alto impacto — se aprueban en lote.',
    lines: ['Bajo esfuerzo, alto impacto.', 'Se aprueban en lote, por reactivo.'],
    mission:
      'Son preguntas leves con intervenciones que han demostrado ser efectivas en estas situaciones. El sistema ya cruzó la evidencia y agrupó las acciones por área. Entra aquí para ver cuántos equipos se benefician y aprueba todo el bloque con un solo clic. Alto impacto, cero esfuerzo.',
    highlights: ['un solo clic'],
    color: '#10B981',
    icon: Zap,
  },
};

/** Orden de aparición en el carrusel (sistémico primero, semilla §5bis). */
export const CLIMA_PLAN_PATH_ORDER: ClimaPlanBlock[] = [
  'sistemico',
  'critico',
  'gestion_corriente',
  'generico',
];
