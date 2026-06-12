// src/lib/services/compliance/DepartmentRiskNarrativeDictionary.ts
// La VOZ del score de riesgo por departamento (Gate 1 del Paso 3).
//
// El motor `DepartmentRiskScoreService` produce el número y la descomposición.
// Este dictionary lo traduce a una de 4 lecturas ejecutivas, según el bucket
// del dept y de qué está hecho el riesgo (denuncia · alertas externas · ISA).
//
// Determinista, sin LLM. Pura sobre `DepartmentRiskScore` — espejo de
// `CascadaNarrativeDictionary` y `CoverageNarrativeDictionary` en el módulo.
//
// ────────────────────────────────────────────────────────────────────────────
// EXCEPCIÓN DE VOCABULARIO — autorizada explícitamente por el dueño del producto
// ────────────────────────────────────────────────────────────────────────────
// El header de `ComplianceNarrativeEngine.ts` prohíbe "denuncia", "Ley Karin"
// y "acoso" en los artefactos del reporte. Esa regla NO aplica en los estados
// FUEGO y HUMO-A-legal de este dictionary: nombrar la denuncia formal y la
// Ley Karin es el punto entero de esos estados — la señal externa ya nombra
// el riesgo jurídico por su nombre, y suavizarlo lo invisibilizaría. Cualquier
// auditoría futura debe respetar esta excepción y NO sustituir esos términos
// por eufemismos.
// ────────────────────────────────────────────────────────────────────────────
//
// REGLAS DE SELECCIÓN (primera que matchea gana — orden estricto por peligro):
//
//   1. FUEGO         ← inputs.denuncias_12m !== null && inputs.denuncias_12m >= 1
//   2. HUMO          ← bucket ∈ {sub_threshold, no_invitado} && pesoAlertas > 0
//      2a. A-legal   ← alguna alerta con alertType === 'ley_karin' && pesoEfectivo > 0
//                      (priority absoluto dentro de HUMO — gana antes del split por producto)
//      2b. A         ← sin Karin qualificante && Σpeso(exit) >= Σpeso(onboarding)
//      2c. B         ← sin Karin qualificante && Σpeso(onboarding) > Σpeso(exit)
//   3. PUNTO_CIEGO   ← bucket ∈ {sub_threshold, no_invitado} && pesoAlertas === 0
//   4. CONFIABLE     ← bucket === 'con_isa' && pesoAlertas === 0
//                      (denuncia ya excluida por la regla 1)
//   5. null          ← bucket === 'con_isa' && pesoAlertas > 0
//                      La voz interna habló (ISA confiable) pero la voz externa
//                      contradice. No forzamos un string "confiable" donde hay
//                      señales activas — la narrativa de este caso vive aguas
//                      arriba (convergencia / contradicción protagonista).
//
// inputs.denuncias_12m === null no dispara FUEGO (null ≠ 0 ≠ ≥1).
// Ningún string afirma "sin denuncias" — preserva la honestidad del null.

import type {
  DepartmentRiskScore,
  DepartmentRiskAlertItem,
} from '@/types/compliance';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ════════════════════════════════════════════════════════════════════════════

export type DepartmentRiskNarrativeState =
  | 'FUEGO'
  | 'HUMO'
  | 'PUNTO_CIEGO'
  | 'CONFIABLE';

/** Sub-rama de HUMO. `A-legal` es priority absoluto cuando hay Ley Karin
 *  qualificante; `A` cuando exit domina; `B` cuando onboarding domina. */
export type DepartmentRiskNarrativeRama = 'A' | 'B' | 'A-legal';

export interface DepartmentRiskNarrative {
  state: DepartmentRiskNarrativeState;
  /** Solo presente cuando state === 'HUMO'. */
  rama?: DepartmentRiskNarrativeRama;
  /** Texto literal del estado, con `[Área]` ya sustituido por el nombre real
   *  en FUEGO. Los otros estados son strings constantes (sin placeholders). */
  narrativa: string;
  /** HUD bimodal — números crudos del payload para el chip técnico. */
  chip: {
    score: number;
    confiabilidad: number;    // = drivers.confiabilidad
    alertasExternas: number;  // = drivers.voz_externa
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STRINGS LITERALES — AUDITADOS, NO MODIFICAR SIN APROBACIÓN DEL DUEÑO
// ════════════════════════════════════════════════════════════════════════════

const FUEGO_TEMPLATE =
  'El riesgo en esta área ya no es algo por anticipar: una denuncia formal por Ley Karin fijó el nivel al máximo e invalidó la lectura oficial. El sistema entero existe para evitar llegar acá: en [Área] el límite ya se cruzó.';

const HUMO_A_LEGAL =
  'El equipo guarda silencio masivo en los canales oficiales, pero quien se fue dejó una señal de Ley Karin. Esto no es rotación: es un riesgo jurídico en formación, del tipo que suele preceder a una denuncia formal. Actuar sobre la señal ahora es lo que separa la prevención de un pasivo legal activo.';

const HUMO_A =
  'El equipo actual guarda silencio masivo en los canales oficiales, pero los que se fueron dejaron un patrón claro. Aún no es un conflicto formal; es el indicador predictivo de una fuga de talento en gestación. Mientras sea una alerta temprana, existe una ventana operativa para intervenir.';

const HUMO_B =
  'El núcleo del equipo no reporta, pero el talento nuevo detecta fricción en sus primeros 90 días. Cuando el rechazo cultural ocurre en la fase de entrada, no es un problema de adaptación individual; es una falla estructural en el ciclo de vida del área.';

const PUNTO_CIEGO =
  'Ceguera operativa. El equipo no participó en la medición interna y no registra señales de alerta externas. No asumas que existe una crisis oculta, pero ten en cuenta que en esta área estás gestionando sin radar.';

const CONFIABLE =
  'Métrica validada. El nivel de participación interna es sólido y el comportamiento externo no muestra contradicciones. La foto que entrega la medición oficial es el reflejo real del equipo.';

// ════════════════════════════════════════════════════════════════════════════
// HELPER — split de pesoAlertas por producto (para rama A vs B en HUMO)
// ════════════════════════════════════════════════════════════════════════════

function splitPesoPorProducto(
  alertas: DepartmentRiskAlertItem[],
): { exit: number; onboarding: number } {
  let exit = 0;
  let onboarding = 0;
  for (const a of alertas) {
    if (a.producto === 'exit') exit += a.pesoEfectivo;
    else onboarding += a.pesoEfectivo;
  }
  return { exit, onboarding };
}

// ════════════════════════════════════════════════════════════════════════════
// RESOLVER PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Traduce un `DepartmentRiskScore` a su narrativa ejecutiva.
 * Retorna `null` cuando el dept es `con_isa` pero hay alertas externas activas
 * sin denuncia formal — caso que la voz convergencia/contradicción cubre.
 *
 * Ver header del archivo para la tabla de reglas completa.
 */
export function resolveDepartmentRiskNarrative(
  riskScore: DepartmentRiskScore,
): DepartmentRiskNarrative | null {
  const chip = {
    score: riskScore.score,
    confiabilidad: riskScore.drivers.confiabilidad,
    alertasExternas: riskScore.drivers.voz_externa,
  };

  const { bucket, alertas } = riskScore;
  const { denuncias_12m, pesoAlertas } = riskScore.inputs;

  // 1. FUEGO — denuncia formal en ventana 12m. null no dispara.
  if (denuncias_12m !== null && denuncias_12m >= 1) {
    return {
      state: 'FUEGO',
      narrativa: FUEGO_TEMPLATE.replace('[Área]', riskScore.departmentName),
      chip,
    };
  }

  const silencioInterno = bucket === 'sub_threshold' || bucket === 'no_invitado';

  // 2. HUMO — silencio interno + alertas externas activas.
  if (silencioInterno && pesoAlertas > 0) {
    // 2a. Priority absoluto: si alguna alerta es Ley Karin con peso > 0, esa
    //     señal nombra el riesgo jurídico por su nombre y gana antes del
    //     split por producto (incluso si onboarding domina numéricamente).
    const hasKarin = alertas.some(
      (a) => a.alertType === 'ley_karin' && a.pesoEfectivo > 0,
    );
    if (hasKarin) {
      return {
        state: 'HUMO',
        rama: 'A-legal',
        narrativa: HUMO_A_LEGAL,
        chip,
      };
    }
    // 2b / 2c — split estándar por producto.
    const { exit, onboarding } = splitPesoPorProducto(alertas);
    const rama: DepartmentRiskNarrativeRama = exit >= onboarding ? 'A' : 'B';
    return {
      state: 'HUMO',
      rama,
      narrativa: rama === 'A' ? HUMO_A : HUMO_B,
      chip,
    };
  }

  // 3. PUNTO CIEGO — silencio interno sin señal externa.
  if (silencioInterno && pesoAlertas === 0) {
    return {
      state: 'PUNTO_CIEGO',
      narrativa: PUNTO_CIEGO,
      chip,
    };
  }

  // 4. CONFIABLE — ISA confiable Y sin contradicción externa.
  if (bucket === 'con_isa' && pesoAlertas === 0) {
    return {
      state: 'CONFIABLE',
      narrativa: CONFIABLE,
      chip,
    };
  }

  // 5. con_isa + pesoAlertas > 0 sin denuncia → no hay string en este motor.
  //    La voz adecuada vive en convergencia/contradicción protagonista.
  return null;
}
