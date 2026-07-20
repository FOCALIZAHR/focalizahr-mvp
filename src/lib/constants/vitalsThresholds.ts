// src/lib/constants/vitalsThresholds.ts
// ════════════════════════════════════════════════════════════════════════════
// Constantes de la portada "Signos Vitales" (SPEC_HOME_SIGNOS_VITALES_v1.1).
// Cero números mágicos en VitalSignsService: todo umbral/identificador vive acá.
//
// NO redefine zonas de riesgo ni el umbral de privacidad: los importa de
// climaThresholds.ts, que es la fuente única del dominio clima. Duplicarlos a
// mano es exactamente lo que la Regla Enterprise #3 prohíbe.
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';

/**
 * REGLA SELLADA (Victor, 2026-07-20) — el veredicto de clima sale de UNA sola
 * fuente: la medición COMPLETA (Experiencia Colaborador Full). Es lo único que
 * puede fijar una zona.
 */
export const VITALS_VERDICT_PRODUCT_TYPE = 'experiencia-full' as const;

/**
 * Productos de señal DIRECCIONAL. Nunca producen veredicto ni zona.
 *
 * Pulso Express mide pocos reactivos con cadencia alta: sirve para ver hacia
 * dónde se mueve algo, no para dictaminar el estado de un departamento. En la
 * BD de prueba TODAS las filas de DepartmentClimaInsight son de este tipo, de
 * modo que hoy la portada sale legítimamente "sin veredicto" — eso es la
 * lectura honesta, no una falla.
 *
 * Se declara para dejar la exclusión explícita y auditable. El servicio NO
 * filtra por esta lista: filtra por VITALS_VERDICT_PRODUCT_TYPE en el WHERE,
 * así que estas filas jamás se leen.
 */
export const VITALS_DIRECTIONAL_PRODUCT_TYPES = ['pulso-express'] as const;

/**
 * Severidad de zona para elegir el hallazgo del día. 0 = más sano.
 * Orden idéntico al ZONE_ORDER de climaThresholds (que es privado de ese
 * módulo); acá se necesita como MAPA rankeable, no como secuencia de degradado.
 */
export const ZONE_SEVERITY: Readonly<Record<RiskZone, number>> = {
  verde: 0,
  amarilla: 1,
  naranja: 2,
  roja: 3,
};

/**
 * ISA (Ambiente Sano) — solo filas terminadas y de alcance departamental.
 * En la BD de prueba hay una fila ORG con status FAILED: sin este filtro
 * entraría como señal válida.
 *
 * El isaScore persistido YA trae aplicada la penalización ×0.7 por Teatro de
 * Cumplimiento (ISAService.ts:64-70, persistido en
 * ComplianceAnalysisOrchestrator.ts:347-361). PROHIBIDO re-aplicarla.
 */
export const VITALS_COMPLIANCE_STATUS = 'COMPLETED' as const;
export const VITALS_COMPLIANCE_SCOPE_DEPARTMENT = 'DEPARTMENT' as const;

/** Milisegundos por mes promedio — para monthsAgo del veredicto (dato crudo). */
export const MS_PER_AVERAGE_MONTH = 1000 * 60 * 60 * 24 * 30.44;
