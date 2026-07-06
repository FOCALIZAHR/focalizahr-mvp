// src/lib/services/clima/FavorabilityCalculator.ts
// EX Clima Gate 2A — Cálculo puro de favorability + mean (SIN I/O).
//
// Favorability = % de respuestas top-2 (rating >= 4 en escala 1-5), 0-100, 1 decimal.
// Mean = promedio del rating (1.0-5.0), 2 decimales.
// n = respondentes ÚNICOS (unidad de privacidad), NO cantidad de respuestas.
//
// GUARDIA NPS/TEXTO (MAESTRO §2A): TODA función filtra primero
// responseType === 'rating_scale'. El top-2 en escala 1-5 se rompe si entra
// un rating 0-10 (nps_scale); text_open no tiene rating pero se excluye igual.
// La pregunta NPS (EI-2) se procesa aparte en NPSAggregationService.
//
// PRIVACY: importa PRIVACY_THRESHOLD canónico de SafetyScoreService (NO duplicar el 5).
// - Score de depto / driver / EI con n < threshold → fav/mean null (n se conserva).
// - Celda depto × acotadoGroup con n < threshold → se OMITE del resultado.

import { PRIVACY_THRESHOLD } from '@/lib/services/SafetyScoreService';

/** Fila plana de respuesta ya joineada (la arma ClimaAggregationService). */
export interface ClimaResponseRow {
  rating: number;
  participantId: string;
  questionCategory: string;
  questionTier: string | null; // 'ENGAGEMENT_INDEX' | 'CORE' | 'CUSTOM'
  responseType: string; // 'rating_scale' | 'nps_scale' | 'text_open'
  isBenchmarkable: boolean;
  departmentId: string | null;
  acotadoGroup: string | null;
}

export interface FavorabilityScore {
  fav: number | null; // % rating>=4 (0-100, 1 decimal) — null si n < threshold
  mean: number | null; // promedio 1-5 (2 decimales) — null si n < threshold
  n: number; // respondentes únicos
}

/** Shape por driver dentro de DepartmentClimaInsight.driverScores (MAESTRO §2B). */
export interface DriverScore extends FavorabilityScore {
  carried: boolean;
  sourceDate?: string; // period del insight completo de origen (solo carried=true)
}

export interface DriverScoresByTrack {
  /** Todas las preguntas de driver (CORE + CUSTOM) — track completo. */
  full: Record<string, DriverScore>;
  /** Solo questionTier='CORE' — track benchmarkeable. Hoy idéntico a full (sin CUSTOM). */
  core: Record<string, DriverScore>;
  /** Solo questionTier='CUSTOM' — se persiste en customDriverScores (vacío hoy). */
  custom: Record<string, DriverScore>;
}

const FAVORABLE_MIN_RATING = 4; // top-2 de escala 1-5
const ENGAGEMENT_CATEGORY = 'engagement_index';

const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

/** GUARDIA: solo respuestas de escala 1-5. Primera línea de todo cálculo. */
export function filterRatingRows(rows: ClimaResponseRow[]): ClimaResponseRow[] {
  return rows.filter((r) => r.responseType === 'rating_scale');
}

/**
 * Favorability + mean + n de un conjunto de filas (aplica guardia internamente).
 * Con n < threshold retorna fav/mean null y conserva n (para trazabilidad).
 */
export function calcFavorability(
  rows: ClimaResponseRow[],
  threshold: number = PRIVACY_THRESHOLD
): FavorabilityScore {
  const rated = filterRatingRows(rows);
  const n = new Set(rated.map((r) => r.participantId)).size;
  if (n === 0 || n < threshold) {
    return { fav: null, mean: null, n };
  }
  const favorable = rated.filter((r) => r.rating >= FAVORABLE_MIN_RATING).length;
  const sum = rated.reduce((acc, r) => acc + r.rating, 0);
  return {
    fav: round1((favorable / rated.length) * 100),
    mean: round2(sum / rated.length),
    n,
  };
}

function groupBy<K extends string>(
  rows: ClimaResponseRow[],
  keyFn: (r: ClimaResponseRow) => K | null
): Map<K, ClimaResponseRow[]> {
  const map = new Map<K, ClimaResponseRow[]>();
  for (const row of rows) {
    const key = keyFn(row);
    if (key === null) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }
  return map;
}

/**
 * Scores por driver (questionCategory), excluyendo engagement_index.
 * Dual track fullScore/coreScore (MAESTRO §2A) + custom aparte para persistencia.
 * Todos salen con carried:false — el carry-forward lo aplica el service.
 */
export function calcDriverScores(
  rows: ClimaResponseRow[],
  threshold: number = PRIVACY_THRESHOLD
): DriverScoresByTrack {
  const driverRows = filterRatingRows(rows).filter(
    (r) => r.questionCategory !== ENGAGEMENT_CATEGORY
  );

  const buildTrack = (trackRows: ClimaResponseRow[]): Record<string, DriverScore> => {
    const byCategory = groupBy(trackRows, (r) => r.questionCategory);
    const track: Record<string, DriverScore> = {};
    for (const [category, categoryRows] of byCategory) {
      track[category] = { ...calcFavorability(categoryRows, threshold), carried: false };
    }
    return track;
  };

  return {
    full: buildTrack(driverRows),
    core: buildTrack(driverRows.filter((r) => r.questionTier === 'CORE')),
    custom: buildTrack(driverRows.filter((r) => r.questionTier === 'CUSTOM')),
  };
}

/**
 * Engagement Index: solo category='engagement_index' en escala 1-5.
 * EI-2 (nps_scale 0-10) queda fuera por la guardia — se procesa como eNPS.
 */
export function calcEngagementIndex(
  rows: ClimaResponseRow[],
  threshold: number = PRIVACY_THRESHOLD
): FavorabilityScore {
  return calcFavorability(
    rows.filter((r) => r.questionCategory === ENGAGEMENT_CATEGORY),
    threshold
  );
}

/**
 * Scores por acotadoGroup (alta_gerencia / mandos_medios / profesionales /
 * base_operativa) sobre TODAS las preguntas de escala (drivers + EI): es el
 * clima general del corte, no un driver puntual.
 * PRIVACY POR CELDA (MAESTRO §2B.5): celda con n < threshold se OMITE
 * (su gente sigue contando en el agregado del depto). Filas con
 * acotadoGroup null se excluyen del corte.
 */
export function calcAcotadoGroupScores(
  rows: ClimaResponseRow[],
  threshold: number = PRIVACY_THRESHOLD
): Record<string, FavorabilityScore> {
  const byGroup = groupBy(filterRatingRows(rows), (r) => r.acotadoGroup);
  const scores: Record<string, FavorabilityScore> = {};
  for (const [group, groupRows] of byGroup) {
    const score = calcFavorability(groupRows, threshold);
    if (score.fav === null) continue; // celda bajo threshold → omitida
    scores[group] = score;
  }
  return scores;
}
