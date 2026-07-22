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
    tagline: 'Varias señales del área caen juntas. Es un patrón de gestión, no un incidente suelto.',
    lines: ['Varias señales del área, bajas a la vez.', 'Es un patrón de gestión: se deriva, no se parcha.'],
    mission:
      'Acá no falló una pregunta suelta: fallaron varias del mismo tema a la vez. Eso ya no es un incidente, es un patrón de gestión del área. Por su alcance no se parcha con una acción rápida ni se aprueba de un clic. La plataforma propone un plan estructural basado en evidencia, para revisar y coordinar directo con tu equipo de Personas. A diferencia de Foco urgente, un caso puntual y grave, acá el problema es ancho.',
    highlights: ['un patrón de gestión', 'el problema es ancho'],
    color: '#A78BFA',
    icon: Network,
  },
  critico: {
    label: 'Foco urgente',
    tagline: 'Una señal grave y aislada. Un incidente puntual que no puede esperar.',
    lines: ['Una señal grave y aislada.', 'Incidente puntual: se resuelve de a uno.'],
    mission:
      'Acá cada caso es una pregunta puntual, no un tema completo como en Problemas de Fondo, pero grave y de alto riesgo para la compañía. Tienes todo el contexto, el costo de no actuar y un plan basado en evidencia para cada una. Se resuelven de a una, con tu revisión y aprobación urgente: no es un problema ancho, es hondo.',
    highlights: ['aprobación urgente', 'es hondo'],
    color: '#22D3EE',
    icon: Crosshair,
  },
  generico: {
    label: 'A tu criterio',
    tagline: 'Señales leves donde tu juicio pesa más que una regla.',
    lines: ['Señales leves, sin urgencia.', 'Acá tu criterio decide.'],
    mission:
      'Son señales puntuales y de baja gravedad. No hay una única acción que sirva siempre para estas. Dependen del contexto que solo tú conoces. Te dejamos una sugerencia general como punto de partida; la decisión final es tuya.',
    highlights: ['la decisión final es tuya'],
    color: '#64748B',
    icon: HelpCircle,
  },
  gestion_corriente: {
    label: 'Victorias rápidas',
    tagline: 'Bajo esfuerzo, alto impacto. Se aprueban de una vez.',
    lines: ['Bajo esfuerzo, alto impacto.', 'Se aprueban de una vez, por foco.'],
    mission:
      'Son señales leves con acciones que ya demostraron funcionar en casos así. El sistema cruzó la evidencia y agrupó por foco los equipos que comparten cada una. Sigue habiendo algo que hacer: una conversación, un gesto. Pero es liviano y está probado. Entra, mira a cuántos equipos alcanza y apruébalo todo con un solo clic.',
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
