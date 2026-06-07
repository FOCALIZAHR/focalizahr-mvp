// src/lib/services/compliance/AmbienteSynthesisDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// AmbienteSynthesisDictionary — copy verbatim por tipo (Gate 2.5)
//
// PARCHE MECÁNICO (2026-06-07): este archivo aterriza SOLO los 9 slots REUSE
// + 2 cláusulas amplificadoras núcleo del inventario INVENTARIO_COPY_GATE_2_5.md.
// Los slots ADAPT y NUEVA quedan como `''` esperando entrega de Victor. El
// Engine los emite vacíos y la UI los oculta (anti-rec #3 del plan).
//
// CONTENIDO REUSE incluido (9 slots fijos + 2 cláusulas):
//   - TIPO 4 CONCENTRACION_MANDO: classification, accountability (2)
//   - TIPO 5 SISTEMICO_SIN_MANDO: classification, accountability (2)
//   - TIPO 8 TODO_BIEN: classification, implicationBase, accountability (3)
//   - GENERIC: path patológico fijo (§3.5.8) (1)
//   - Cláusula CONVERGENCIA_AMBOS (núcleo converge_limpia)
//   - Cláusula SEXTA_ALERTA (condensación de buildAlertas.silencio_con_voz_externa.contexto)
//
// PENDIENTE (Victor escribe aparte):
//   - 4 TIPOS enteros: FUEGO_LEGAL, SILENCIO_SIN_VOZ, CONTRADICCION_TEATRO,
//     OBSERVACION_SIN_FOCO, BIEN_CON_FOCOS (classifications + paths + accountabilities)
//   - implicationBase de TIPO 4 + TIPO 5 (requieren interpolación dinámica
//     ${nombres}/${origen}/${riesgoDeptos} — decisión de shape pendiente)
//   - 4 cláusulas amplificadoras: TEATRO_EN_DEPTO, CONVERGENCIA_EXIT,
//     CONVERGENCIA_ONBOARDING, OTRO_MUNDO
//   - paths para los 7 tipos no-patológicos (legacy nunca tuvo este slot)
//   - legalNote + risks[] de FUEGO_LEGAL
//   - risks[] de CONCENTRACION_MANDO
//
// El consumidor (`AmbienteSynthesisEngine.buildSynthesis`) lee este dictionary
// vía lookup por tipo de diagnóstico + tipo de amplificador. Donde el dictionary
// emite `''`, el Engine sigue emitiendo `''` (mismo comportamiento que Gate 2,
// solo lift mecánico para los slots REUSE).
// ════════════════════════════════════════════════════════════════════════════

import type { DiagnosticType, Amplificador } from '@/types/ambiente-cascada';

type AmplificadorTipo = Amplificador['tipo'];

export interface SynthesisCopyEntry {
  classification: string;
  /** Base sin interpolar amplificadores. El Engine concatena las cláusulas
   *  después. */
  implicationBase: string;
  path: string;
  accountability: string;
  /** Solo FUEGO_LEGAL. */
  legalNote?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// SYNTHESIS_DICTIONARY — entradas por tipo de diagnóstico
// ════════════════════════════════════════════════════════════════════════════

export const SYNTHESIS_DICTIONARY: Record<DiagnosticType, SynthesisCopyEntry> = {
  // ─── TIPO 1 — FUEGO_LEGAL (Victor escribe) ─────────────────────────────
  FUEGO_LEGAL: {
    classification: '',
    implicationBase: '',
    path: '',
    accountability: '',
    legalNote: '',
  },

  // ─── TIPO 2 — SILENCIO_SIN_VOZ (Victor escribe) ────────────────────────
  SILENCIO_SIN_VOZ: {
    classification: '',
    implicationBase: '',
    path: '',
    accountability: '',
  },

  // ─── TIPO 3 — CONTRADICCION_TEATRO (Victor escribe / ADAPT) ────────────
  CONTRADICCION_TEATRO: {
    classification: '',
    implicationBase: '',
    path: '',
    accountability: '',
  },

  // ─── TIPO 4 — CONCENTRACION_MANDO ──────────────────────────────────────
  // REUSE verbatim de buildCierreFrancotirador.estado.localizado.
  // implicationBase: vacío hasta resolver shape de interpolación
  // (${formatDeptList(nombres)} concentran el riesgo... El origen ${origen}.
  // El problema tiene nombre. La decisión también.)
  CONCENTRACION_MANDO: {
    classification:
      'Este no es un problema cultural. Es un problema con dirección identificada.',
    implicationBase: '',
    path: '',
    accountability:
      'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
  },

  // ─── TIPO 5 — SISTEMICO_SIN_MANDO ──────────────────────────────────────
  // REUSE verbatim de buildCierreFrancotirador.estado.sistemico.
  // implicationBase: vacío hasta resolver shape de interpolación
  // (${riesgoDeptos} ${plural} en zona de revisión... O el problema es sistémico.
  // O todavía no tiene masa suficiente para identificar el patrón.)
  SISTEMICO_SIN_MANDO: {
    classification: 'Este no es un problema de liderazgo. Es un problema de diseño.',
    implicationBase: '',
    path: '',
    accountability: 'El próximo ciclo dirá cuál de las dos.',
  },

  // ─── TIPO 6 — OBSERVACION_SIN_FOCO (Victor escribe) ────────────────────
  OBSERVACION_SIN_FOCO: {
    classification: '',
    implicationBase: '',
    path: '',
    accountability: '',
  },

  // ─── TIPO 7 — BIEN_CON_FOCOS (Victor adapta) ───────────────────────────
  BIEN_CON_FOCOS: {
    classification: '',
    implicationBase: '',
    path: '',
    accountability: '',
  },

  // ─── TIPO 8 — TODO_BIEN ────────────────────────────────────────────────
  // REUSE verbatim de buildCierreFrancotirador.estado.positivo.
  // Los 3 slots son strings fijos sin interpolación.
  TODO_BIEN: {
    classification: 'Este ciclo no registra gerencias en zona crítica.',
    implicationBase:
      'El mandato no es celebrar. Es sostener las condiciones que produjeron este resultado.',
    path: '',
    accountability: 'El próximo ciclo confirmará si fue una tendencia.',
  },

  // ─── GENERIC — caso patológico (sin orgISA / datos corruptos) ──────────
  // Path fijo §3.5.8: NUNCA inventa "sin dirección clara" (la frase del bug
  // del Francotirador legacy). Acota explícitamente al próximo ciclo.
  GENERIC: {
    classification: '',
    implicationBase: '',
    path: 'El próximo ciclo confirmará si hay una dirección clara.',
    accountability: '',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// AMPLIFIER_CLAUSES — composicionales (§3.5.7)
// ════════════════════════════════════════════════════════════════════════════
// El Engine las invoca con la lista de deptos del amplificador y concatena el
// resultado al `implicationBase` del dominante. Las claves NO presentes emiten
// nada (Engine las filtra).

export const AMPLIFIER_CLAUSES: Partial<
  Record<AmplificadorTipo, (deptos: string[]) => string>
> = {
  // CONVERGENCIA_AMBOS — núcleo REUSE de buildConvergenciaCruce.converge_limpia.
  // Frase generalizable: no necesita interpolar la lista de deptos.
  CONVERGENCIA_AMBOS: () =>
    'Cuando dos lentes independientes coinciden, el hallazgo deja de ser percepción: pasa a ser hecho.',

  // SEXTA_ALERTA — condensación REUSE de buildAlertas.silencio_con_voz_externa.contexto.
  // Cláusula composicional con lista de deptos formateada.
  SEXTA_ALERTA: (deptos) => {
    if (deptos.length === 0) return '';
    const list = formatDeptList(deptos);
    return `En ${list}, otras fuentes documentaron señales activas en el mismo período.`;
  },

  // PENDIENTE Victor escribe:
  // - TEATRO_EN_DEPTO (adapt buildPortada.teatro.subtitular)
  // - CONVERGENCIA_EXIT (adapt HUMO_A + buildConvergenciaCruce.unica)
  // - CONVERGENCIA_ONBOARDING (adapt HUMO_B)
  // - OTRO_MUNDO (NUEVA — sin precedente)
};

// ────────────────────────────────────────────────────────────────────────────

function formatDeptList(deptos: string[]): string {
  if (deptos.length === 0) return '';
  if (deptos.length === 1) return deptos[0];
  if (deptos.length === 2) return `${deptos[0]} y ${deptos[1]}`;
  return `${deptos.slice(0, -1).join(', ')} y ${deptos[deptos.length - 1]}`;
}
