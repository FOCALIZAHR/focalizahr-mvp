// src/lib/narratives/vitalsNarratives.ts
// ════════════════════════════════════════════════════════════════════════════
// Narrativas de la portada Signos Vitales. FUNCIONES PURAS, lectura pura:
// reciben el VitalSignsSummary y devuelven texto. No tocan BD ni el servicio.
//
// Fuente única de los textos: cero strings de narrativa sueltos en JSX.
// Auditadas contra skill focalizahr-narrativas (Regla 0 Minto + 6 Reglas de Oro):
// sin jerga del sistema, sin instrucciones prescriptivas, sin plazos, causas
// siempre con "O", cierre con consecuencia.
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type { VitalSignsSummary } from '@/lib/services/vitals/types';

export type VitalsState =
  | 'sin_departamentos'
  | 'sin_veredicto'
  | 'con_criticos'
  | 'sin_riesgo';

export type VitalsHero =
  | { kind: 'number'; value: number; caption: string; detail: string | null }
  | { kind: 'phrase'; text: string };

export interface VitalsEmptyState {
  type: 'pending' | 'clear' | 'insufficient' | 'requires';
  title: string;
  description: string;
  insight?: string;
}

export interface VitalsNarrative {
  state: VitalsState;
  /** Word-split obligatorio: primera palabra blanca, segunda en gradient. */
  title: { first: string; second: string };
  hero: VitalsHero;
  finding: { headline: string | null; body: string[] };
  emptyState: VitalsEmptyState | null;
  cta: { label: string; href: string } | null;
}

/** Etiquetas canónicas de banda (contrato visual "N · Label"). */
const ZONE_LABEL: Readonly<Record<RiskZone, string>> = {
  verde: 'Sano',
  amarilla: 'Atención',
  naranja: 'Riesgo',
  roja: 'Crítico',
};

export function zoneLabel(zone: RiskZone): string {
  return ZONE_LABEL[zone];
}

/**
 * Variante para prosa: concuerda con "zona" (femenino). Las etiquetas canónicas
 * del contrato "N · Label" son masculinas (Sano, Crítico) y producen
 * "zona crítico" si se usan en una frase. Mapa separado, no derivado.
 */
const ZONE_IN_SENTENCE: Readonly<Record<RiskZone, string>> = {
  verde: 'sana',
  amarilla: 'de atención',
  naranja: 'de riesgo',
  roja: 'crítica',
};

const TITLE = { first: 'Signos', second: 'Vitales' } as const;

export interface NarrativeOptions {
  /** hasPermission(role, 'campaigns:manage') — decide el CTA del degradado. */
  canManageCampaigns: boolean;
}

export function buildVitalsNarrative(
  summary: VitalSignsSummary,
  opts: NarrativeOptions
): VitalsNarrative {
  const { coverage, zoneDistribution, headline } = summary;

  // ── S5: cuenta sin estructura ────────────────────────────────────────────
  if (coverage.totalDepartments === 0) {
    return {
      state: 'sin_departamentos',
      title: TITLE,
      hero: { kind: 'phrase', text: 'Todavía no hay estructura que medir.' },
      finding: {
        headline: null,
        body: [
          'El sistema lee la organización por áreas. Sin esa estructura cargada, no hay unidad de análisis: ni clima, ni ambiente, ni integración.',
          'Nada de lo que ocurre en la empresa es invisible por falta de datos. Es invisible por falta de un mapa donde ubicarlos.',
        ],
      },
      emptyState: {
        type: 'pending',
        title: 'Estructura organizacional pendiente',
        description:
          'La lectura de signos vitales se activa cuando el sistema conoce las áreas de la empresa.',
      },
      cta: opts.canManageCampaigns
        ? { label: 'Cargar estructura', href: '/dashboard/hub-de-carga' }
        : { label: 'Ver la operación', href: '/dashboard' },
    };
  }

  // ── S1: sin veredicto (estado real hoy) ──────────────────────────────────
  if (coverage.withClimaVerdict === 0) {
    return {
      state: 'sin_veredicto',
      title: TITLE,
      // Sin número: poner un 0 de 72px sería la regla null != 0 violada en
      // tipografía. Ausencia de lectura no es una lectura de cero.
      hero: { kind: 'phrase', text: 'Medimos. Todavía no concluimos.' },
      finding: {
        headline: null,
        body: [
          `Ninguna de las ${coverage.totalDepartments} áreas tiene veredicto de clima. No es que el sistema no esté midiendo: medir y dictaminar no son lo mismo.`,
          'Pulso Express mide dirección, hacia dónde se mueve un equipo. El veredicto exige una medición completa de experiencia, y hoy ninguna produjo lectura por área.',
          'O se activa una medición completa, o la organización sigue decidiendo con la percepción de cada gerente. La diferencia entre medir y saber es exactamente esa medición.',
        ],
      },
      emptyState: {
        type: 'pending',
        title: 'Veredicto de clima en espera',
        description:
          'La lectura por área se activa con la primera medición completa de experiencia del colaborador.',
        insight:
          'Las señales de integración, salida y ambiente que ya existen se muestran abajo, con su cobertura real.',
      },
      cta: opts.canManageCampaigns
        ? { label: 'Activar medición completa', href: '/dashboard/campaigns/new' }
        : { label: 'Ver la operación', href: '/dashboard' },
    };
  }

  const enRiesgo = zoneDistribution.roja + zoneDistribution.naranja;

  // ── S3: hay lectura y ninguna área en riesgo ─────────────────────────────
  if (enRiesgo === 0 || headline === null) {
    return {
      state: 'sin_riesgo',
      title: TITLE,
      hero: {
        kind: 'number',
        value: coverage.withClimaVerdict,
        caption: 'áreas con lectura completa',
        detail: 'Ninguna en zona de riesgo',
      },
      finding: {
        headline: 'Ninguna área en zona de riesgo.',
        body: [
          `Las ${coverage.withClimaVerdict} áreas con lectura completa quedaron sobre el umbral. El sistema analizó y no encontró patrones que requieran atención este ciclo.`,
          `La lectura cubre ${coverage.withClimaVerdict} de ${coverage.totalDepartments} áreas. Las restantes no tienen medición completa: su silencio no es una señal buena ni mala, es ausencia de dato.`,
        ],
      },
      emptyState: null,
      cta: { label: 'Ver diagnóstico', href: '/dashboard/clima' },
    };
  }

  // ── S2: hay áreas en riesgo → hallazgo del día ───────────────────────────
  const target = summary.departments.find((d) => d.departmentId === headline.departmentId);
  const followUp = target?.clima.followUp ?? null;
  const zona = ZONE_IN_SENTENCE[headline.riskZone];

  // Variante b2 — contradicción: la intervención mueve la aguja, la zona no.
  if (followUp && followUp.delta !== null && followUp.delta > 0 && followUp.dimension) {
    return {
      state: 'con_criticos',
      title: TITLE,
      hero: {
        kind: 'number',
        value: zoneDistribution.roja,
        caption: zoneDistribution.roja === 1 ? 'área en zona crítica' : 'áreas en zona crítica',
        detail: buildDistributionDetail(summary),
      },
      finding: {
        headline: 'La intervención funciona. La zona no cambió.',
        body: [
          `En ${followUp.dimension}, ${headline.departmentName} subió ${followUp.delta} puntos desde la última medición completa. Pero la lectura oficial sigue siendo la de esa medición, y ahí el área estaba en zona ${zona}.`,
          'O el avance es real y todavía no alcanza a mover el conjunto. O se movió la dimensión que se intervino y ninguna otra.',
          'Confirmar cuál de las dos exige una medición completa nueva. Sin eso, el avance es una hipótesis, no un hecho.',
        ],
      },
      emptyState: null,
      cta: { label: 'Ver diagnóstico', href: '/dashboard/clima' },
    };
  }

  // Variante b1 — base.
  const isLowest = isLowestFavorability(summary, headline.departmentId);
  const favSentence =
    headline.favorability !== null
      ? `Su favorabilidad quedó en ${headline.favorability} sobre 100${isLowest ? ', la más baja de las áreas con lectura' : ''}.`
      : 'La lectura del área quedó bajo el umbral de riesgo.';

  return {
    state: 'con_criticos',
    title: TITLE,
    hero: {
      kind: 'number',
      value: zoneDistribution.roja,
      caption: zoneDistribution.roja === 1 ? 'área en zona crítica' : 'áreas en zona crítica',
      detail: buildDistributionDetail(summary),
    },
    finding: {
      headline: `${headline.departmentName} entró en zona ${zona}.`,
      body: [
        favSentence,
        'O el equipo perdió sentido en lo que hace. O perdió confianza en quien lo dirige. El sistema no distingue cuál: sabe que la señal está donde se decide la operación diaria.',
        'Un área en rojo no avisa dos veces. La siguiente señal suele ser una salida.',
      ],
    },
    emptyState: null,
    cta: { label: 'Ver diagnóstico', href: '/dashboard/clima' },
  };
}

/** "3 en riesgo · 2 en atención · 8 sanas" — solo las bandas con valor. */
function buildDistributionDetail(summary: VitalSignsSummary): string | null {
  const { zoneDistribution } = summary;
  const parts: string[] = [];
  if (zoneDistribution.naranja > 0) parts.push(`${zoneDistribution.naranja} en riesgo`);
  if (zoneDistribution.amarilla > 0) parts.push(`${zoneDistribution.amarilla} en atención`);
  if (zoneDistribution.verde > 0) parts.push(`${zoneDistribution.verde} sanas`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * El hallazgo se elige por severidad de zona, y la zona puede degradarse por
 * momentum: un área con favorabilidad mayor puede quedar en peor zona que otra.
 * Por eso el superlativo "la más baja" se verifica, no se asume.
 */
function isLowestFavorability(summary: VitalSignsSummary, departmentId: string): boolean {
  const favs = summary.departments
    .map((d) => d.clima.verdict?.favorability ?? null)
    .filter((f): f is number => f !== null);
  const own = summary.departments.find((d) => d.departmentId === departmentId)?.clima.verdict
    ?.favorability;
  if (own === null || own === undefined || favs.length === 0) return false;
  return own === Math.min(...favs);
}
