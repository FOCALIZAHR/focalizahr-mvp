// ═══════════════════════════════════════════════════════════════════
// buildLaVoz — Beat 4 (La Voz) · GATE 4
// src/lib/services/compliance/buildLaVoz.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — el acto del material crudo: las citas tal como llegaron.
// NO interpreta; presenta y lee el alcance. La síntesis la hace La Decisión.
//
// Selector de narrativa (0c, decisión Victor 2026-06-12): NO inventa
// clasificador — usa el `patron_dominante.nombre` que el análisis IA ya
// persiste. Si TODOS los deptos con patrón dominante caen en la FAMILIA
// silencio/evasión (lista EXPLÍCITA abajo, auditable) → narrativa de silencio
// homogéneo; si varían (o no hay clasificación) → variante neutra.
//
// Citas VERBATIM del dato — jamás editadas ni resumidas (con n≤6). Solo se
// sanitizan comillas envolventes duplicadas (bug del render actual: ""…"").
// Sin em-dashes (regla global). Purple exclusivo del kicker IA (en el render).
// ═══════════════════════════════════════════════════════════════════

import { stripWrappingQuotes } from '@/lib/utils/formatName';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { GenderAlertDetail } from '@/lib/services/compliance/ComplianceNarrativeEngine';

const MAX_CITAS = 6;

/** FAMILIA silencio/evasión — los subtipos cuyo contenido explica POR QUÉ no se
 *  habla (no describen un problema). Lista EXPLÍCITA y auditable (decisión
 *  Victor): el corte estricto se rompería con el primer subtipo nuevo del
 *  clasificador; la familia es robusta. Los otros dos del enum
 *  (`hostilidad_normalizada`, `favoritismo_implicito`) SÍ describen un problema
 *  → contenido → variante neutra. */
export const SILENCIO_FAMILY: ReadonlySet<string> = new Set([
  'silencio_organizacional',
  'resignacion_aprendida',
  'miedo_represalias',
]);

// ── Copy §5/§6 (verbatim handoff) ──
const LECTURA_ALCANCE =
  'Una voz no hace un patrón, y este informe no la trata como uno. La trata como una dirección: si el próximo ciclo trae otra en el mismo tono, deja de ser anécdota. Por ahora, es el lugar donde mirar.';
const CIERRE =
  'Lo que el equipo no dice en la encuesta, lo termina diciendo de otra forma.';
const NEUTRA =
  'Esto escribió el equipo en el espacio abierto. Sin filtro, tal como llegó.';

const NUM_ES = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis'] as const;
function numEs(n: number): string {
  return NUM_ES[n] ?? String(n);
}
function cap(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ════════════════════════════════════════════════════════════════════════════

export type VozForma = 'silencio' | 'neutra';

/** Narrativa con el tramo a destacar (peso 400 blanco) aislado. `destacado`
 *  vacío en la variante neutra. */
export interface VozNarrativa {
  pre: string;
  destacado: string;
  post: string;
}

export interface VozGenero {
  /** Gerencia (nivel correcto de señalamiento — anonimato en áreas chicas).
   *  Crudo; el render aplica formatDepartmentName. */
  gerencia: string;
  /** Cita sanitizada (sin comillas envolventes duplicadas). */
  cita: string;
}

export interface LaVozActo {
  /** Hero — cantidad de voces recogidas. */
  n: number;
  forma: VozForma;
  narrativa: VozNarrativa;
  /** Citas verbatim sanitizadas (≤ MAX_CITAS). */
  citas: string[];
  /** Hallazgos de género (con cita). Vacío si no hay. */
  generos: VozGenero[];
  /** §5 lectura de alcance — solo relevante si generos.length > 0. */
  lecturaAlcance: string;
  /** §6 cierre cursiva. */
  cierre: string;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Narrativa de silencio homogéneo (número gramatical adaptable). El destacado
 *  "que acá no se habla" va aislado para el peso 400 blanco. */
export function buildSilencioNarrativa(n: number): VozNarrativa {
  if (n === 1) {
    return {
      pre: 'Una persona escribió en el espacio abierto. Escribió esto: ',
      destacado: 'que acá no se habla',
      post: '. No describe un problema. Describe por qué no lo va a describir.',
    };
  }
  const N = cap(numEs(n));
  const nl = numEs(n);
  return {
    pre: `${N} personas escribieron en el espacio abierto. Las ${nl} escribieron lo mismo: `,
    destacado: 'que acá no se habla',
    post: `. Ninguna describe un problema. Las ${nl} describen por qué no lo van a describir.`,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export function buildLaVoz(data: ComplianceReportResponse): LaVozActo | null {
  const departments = data.data.departments ?? [];

  // ── Citas — fragmentos del patrón dominante, sanitizadas, dedup, tope. ──
  const seen = new Set<string>();
  const citas: string[] = [];
  for (const dept of departments) {
    const frags = dept.patrones?.patron_dominante?.fragmentos ?? [];
    for (const f of frags) {
      const clean = stripWrappingQuotes(String(f).trim());
      if (clean.length === 0) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      citas.push(clean);
      if (citas.length >= MAX_CITAS) break;
    }
    if (citas.length >= MAX_CITAS) break;
  }

  // ── Género — alertas con cita literal no vacía. Gerencia = parentDepartmentName
  //    (anonimato en áreas chicas + consistencia con la Apertura). ──
  const generos: VozGenero[] = [];
  for (const g of (data.narratives.alertasGenero ?? []) as GenderAlertDetail[]) {
    const cita = stripWrappingQuotes((g.evidenciaGenero ?? '').trim());
    if (cita.length === 0) continue;
    generos.push({
      gerencia: g.parentDepartmentName ?? g.departmentName,
      cita,
    });
  }

  // Guard: nada que mostrar → acto omitido (anti-default-as-meaning).
  if (citas.length === 0 && generos.length === 0) return null;

  // ── Selector (0c) — familia silencio/evasión usando el nombre persistido. ──
  const doms: string[] = [];
  for (const d of departments) {
    const nombre = d.patrones?.patron_dominante?.nombre;
    if (typeof nombre === 'string' && nombre.length > 0) doms.push(nombre);
  }
  const forma: VozForma =
    doms.length > 0 && doms.every((nombre) => SILENCIO_FAMILY.has(nombre))
      ? 'silencio'
      : 'neutra';

  const narrativa: VozNarrativa =
    forma === 'silencio'
      ? buildSilencioNarrativa(citas.length)
      : { pre: NEUTRA, destacado: '', post: '' };

  return {
    n: citas.length,
    forma,
    narrativa,
    citas,
    generos,
    lecturaAlcance: LECTURA_ALCANCE,
    cierre: CIERRE,
  };
}
