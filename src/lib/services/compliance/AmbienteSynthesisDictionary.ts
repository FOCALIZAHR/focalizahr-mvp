// src/lib/services/compliance/AmbienteSynthesisDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// AmbienteSynthesisDictionary — copy verbatim por tipo (Gate 2.5 COMPLETO)
//
// Fuente de copy: `.claude/tasks/COPY_GATE_2_5_PENDIENTE.md` (copy final aprobada
// por Victor). NO se cabló desde INVENTARIO_COPY_GATE_2_5.md (desactualizado en
// FUEGO/SILENCIO/TEATRO). Los 9 slots REUSE + 2 cláusulas núcleo del parche
// mecánico previo (f932d6f) se conservan verbatim.
//
// INTERPOLACIÓN (decisión sellada — opción A):
//   `implicationBase` queda string con placeholders `{...}` que el Engine
//   resuelve vía `interpolate(template, context)`. Context de 6 claves:
//     {deptos}       — lista de gerencias en fuego (FUEGO_LEGAL)
//     {nombres}      — lista de gerencias bajo el mando crítico (CONCENTRACION_MANDO)
//     {origen}       — label ejecutivo del origen organizacional (CONCENTRACION_MANDO)
//     {riesgoDeptos} — conteo de gerencias en riesgo (SISTEMICO / BIEN_CON_FOCOS)
//     {totalDeptos}  — conteo total de gerencias (BIEN_CON_FOCOS)
//     {orgISA}       — ISA org-level 0-100 (BIEN_CON_FOCOS)
//   NO functions: la pluralización se resuelve fijando la forma que el gatillo
//   garantiza (SISTEMICO ≥ 3 → plural; TEATRO count-free por decisión).
//
// EXCEPCIÓN de copy:
//   FUEGO_LEGAL es type-agnóstico: reconoce el HECHO registrado (denuncia formal)
//   sin nombrar la ley, sin plazos, sin estado/tipo del proceso. NO usa legalNote
//   (queda ''). El badge FUEGO está DIFERIDO (Beat 6 oculto) — no se construye acá.
//
// El consumidor (`AmbienteSynthesisEngine.buildSynthesis`) lee este dictionary
// vía lookup por tipo de diagnóstico + tipo de amplificador, interpola la base y
// emite `risks` cuando existen.
// ════════════════════════════════════════════════════════════════════════════

import type { DiagnosticType, Amplificador } from '@/types/ambiente-cascada';
import type { OrigenOrganizacional } from '@/lib/services/compliance/complianceTypes';

type AmplificadorTipo = Amplificador['tipo'];

export interface SynthesisCopyEntry {
  classification: string;
  /** Base sin interpolar amplificadores. Puede contener placeholders `{...}`
   *  que el Engine resuelve con `interpolate()`. El Engine concatena las
   *  cláusulas de amplificadores después. */
  implicationBase: string;
  path: string;
  accountability: string;
  /** Solo FUEGO_LEGAL — DIFERIDO: queda '' (no se nombra la ley). */
  legalNote?: string;
  /** Solo FUEGO_LEGAL + CONCENTRACION_MANDO. Narrativas genéricas, sin
   *  interpolación. */
  risks?: Array<{ label: string; narrative: string }>;
}

// ════════════════════════════════════════════════════════════════════════════
// ORIGEN_LABELS — traducción del origen organizacional a lenguaje ejecutivo.
// REUSE del map borrado con buildCierreFrancotirador (Gate 8). Resuelve {origen}
// en la base de CONCENTRACION_MANDO.
// ════════════════════════════════════════════════════════════════════════════

export const ORIGEN_LABELS: Record<OrigenOrganizacional, string> = {
  vertical_descendente: 'viene de quien tiene autoridad',
  horizontal_pares: 'está entre equipos, no en el liderazgo',
  sistemico_procesos: 'es de diseño, no de personas',
  mixto: 'no tiene una sola fuente',
  indeterminado: 'aún no tiene dirección clara',
};

// ════════════════════════════════════════════════════════════════════════════
// SYNTHESIS_DICTIONARY — entradas por tipo de diagnóstico
// ════════════════════════════════════════════════════════════════════════════

export const SYNTHESIS_DICTIONARY: Record<DiagnosticType, SynthesisCopyEntry> = {
  // ─── TIPO 1 — FUEGO_LEGAL ───────────────────────────────────────────────
  // Dispara por DENUNCIA FORMAL registrada (issueCount → piso_denuncia > 0).
  // Reconoce el hecho, humilde sobre el desenlace, sin plazos, sin nombrar la
  // ley. legalNote queda '' por decisión. Badge FUEGO diferido.
  FUEGO_LEGAL: {
    classification: 'Esto no es una lectura de clima. Es un hecho registrado.',
    implicationBase:
      'En {deptos}, en los últimos 12 meses, hubo al menos una denuncia formal. ' +
      'No sabemos cómo terminó —puede haberse acreditado, puede que no, incluso podría no sostenerse—. ' +
      'Pero que exista ya cambia el peso de todo lo demás. No es percepción. Es un registro. ' +
      'Y un registro pide mirar ese punto aparte, antes de saber cómo termina.',
    path:
      'El foco está donde hay un hecho, no donde hay un promedio. ' +
      'Un registro así no se lee con la vara del clima.',
    accountability:
      'El próximo ciclo dirá si se miró, o si se esperó a saber cómo terminaba.',
    legalNote: '',
    risks: [
      {
        label: 'Rara vez se queda en uno',
        narrative: 'Lo que existe sin mirarse rara vez se queda en un solo caso.',
      },
      {
        label: 'Lo de adentro termina afuera',
        narrative:
          'Lo que el ambiente no atiende adentro suele terminar atendiéndose afuera.',
      },
      {
        label: 'Quedó el registro',
        narrative: 'Lo que se filtra no es el caso. Es que existía y nadie lo miró.',
      },
    ],
  },

  // ─── TIPO 2 — SILENCIO_SIN_VOZ ──────────────────────────────────────────
  SILENCIO_SIN_VOZ: {
    classification:
      'Esto no es un problema de participación. Es silencio que ya dejó señal por fuera.',
    implicationBase:
      'La mayoría no respondió. Parece desinterés, hasta que se mira quién sí habló: ' +
      'los que hablaron dicen que hablar no es seguro. Ahí el silencio del resto cambia de sentido. ' +
      'No es que no tengan nada que decir. Es que el lugar para decirlo no les parece seguro.',
    path:
      'El número no sube persiguiendo respuestas. ' +
      'Sube entendiendo por qué, para los que callan, hablar todavía no se siente seguro.',
    accountability:
      'El próximo ciclo confirmará si estas decisiones fueron al fondo o a la superficie.',
  },

  // ─── TIPO 3 — CONTRADICCION_TEATRO ──────────────────────────────────────
  // implicationBase count-free (decisión sellada: el contrato de placeholders
  // no incluye teatroCount; el cuánto/cuáles lo cargan classification y la
  // cláusula TEATRO_EN_DEPTO). Robusto a teatroCount=0 (convergencia-contradice).
  CONTRADICCION_TEATRO: {
    classification:
      'Esto no es un problema de métricas. Es lo que dicen las palabras cuando los números se ven bien.',
    implicationBase:
      'Hay gerencias que operan con números saludables. Las respuestas abiertas de su gente dicen otra cosa. ' +
      'Cuando las métricas y las palabras se contradicen, las palabras tienen razón.',
    path:
      'El número tranquiliza, lo que escriben no. Donde se separan es donde está el tema.',
    accountability:
      'El próximo ciclo dirá si los números y las palabras se siguen separando, o si alguien miró la diferencia.',
  },

  // ─── TIPO 4 — CONCENTRACION_MANDO ───────────────────────────────────────
  // classification + accountability REUSE verbatim de
  // buildCierreFrancotirador.localizado. implicationBase REUSE con placeholders
  // {nombres} / {origen}.
  CONCENTRACION_MANDO: {
    classification:
      'Este no es un problema cultural. Es un problema con dirección identificada.',
    implicationBase:
      '{nombres} concentran el riesgo bajo una misma línea de mando. ' +
      'El origen {origen}. El problema tiene nombre. La decisión también.',
    path:
      'El origen está identificado. No es un programa para toda la empresa, ' +
      'es la conversación donde el déficit empieza.',
    accountability:
      'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
    risks: [
      {
        label: 'Sesgo del liderazgo',
        narrative: 'Puede haber un sesgo en cómo se gestionan los equipos bajo ese mando.',
      },
      {
        label: 'Decisión estructural',
        narrative: 'Puede haber una decisión estructural que nadie cuestionó.',
      },
      {
        label: 'Voz sofocada',
        narrative: 'Algo puede estar apagando las preocupaciones antes de que se reporten.',
      },
    ],
  },

  // ─── TIPO 5 — SISTEMICO_SIN_MANDO ───────────────────────────────────────
  // classification + accountability REUSE verbatim de
  // buildCierreFrancotirador.sistemico. implicationBase REUSE con {riesgoDeptos}.
  // Plural fijo: el gatillo garantiza riesgoDeptos ≥ 3 (SISTEMICO_MIN_RIESGO).
  SISTEMICO_SIN_MANDO: {
    classification: 'Este no es un problema de liderazgo. Es un problema de diseño.',
    implicationBase:
      '{riesgoDeptos} gerencias en zona de revisión este ciclo sin línea de mando común. ' +
      'O el problema es sistémico. O todavía no tiene masa suficiente para identificar el patrón.',
    path:
      'No hay un solo responsable que explique esto. ' +
      'Está repartido, y por eso ningún foco aislado lo cierra.',
    accountability: 'El próximo ciclo dirá cuál de las dos.',
  },

  // ─── TIPO 6 — OBSERVACION_SIN_FOCO ──────────────────────────────────────
  OBSERVACION_SIN_FOCO: {
    classification:
      'Esto no es un foco que apagar. Es un ambiente que avisa antes de tener uno.',
    implicationBase:
      'El número no está en rojo, pero tampoco tranquiliza. ' +
      'Ninguna área ni causa concentra el problema, y esa ausencia es la señal. ' +
      'O el ambiente se erosiona parejo, sin un punto que lo delate. ' +
      'O todavía hay margen antes de que uno aparezca. ' +
      'Leer la falta de alarma como falta de riesgo deja pasar el momento en que actuar todavía sale barato.',
    path:
      'Acá no hay un foco que perseguir. La dirección es atender el conjunto antes de que tenga uno.',
    accountability: 'El próximo ciclo dirá si este ambiente medio se sostiene o se mueve.',
  },

  // ─── TIPO 7 — BIEN_CON_FOCOS ────────────────────────────────────────────
  // implicationBase con placeholders {riesgoDeptos} / {totalDeptos} / {orgISA}.
  BIEN_CON_FOCOS: {
    classification:
      'Esto no es un problema general. Es un foco puntual dentro de un ambiente sano.',
    implicationBase:
      '{riesgoDeptos} de {totalDeptos} gerencias concentran el riesgo del ciclo. ' +
      'El número global cierra en {orgISA}, pero un promedio oculta dónde vive el problema. ' +
      'O el deterioro está localizado y la cifra global lo disfraza. ' +
      'O hay gerencias que sostienen lo que otras no pueden.',
    path: 'Un problema concentrado tiene dirección. Es una ventaja, si se usa.',
    accountability: 'El próximo ciclo dirá si el foco se contuvo o arrastró al resto.',
  },

  // ─── TIPO 8 — TODO_BIEN ─────────────────────────────────────────────────
  // classification + implicationBase + accountability REUSE verbatim de
  // buildCierreFrancotirador.positivo. path ADAPT de buildCierre.sin_riesgo.
  TODO_BIEN: {
    classification: 'Este ciclo no registra gerencias en zona crítica.',
    implicationBase:
      'El mandato no es celebrar. Es sostener las condiciones que produjeron este resultado.',
    path: 'Sostener no es no hacer nada. Es seguir escuchando cuando nada lo exige.',
    accountability: 'El próximo ciclo confirmará si fue una tendencia.',
  },

  // ─── GENERIC — caso patológico (sin orgISA / datos corruptos) ──────────
  // classification + accountability vacíos: el caso patológico NO narra. El path
  // estándar §3.5.8 emite el cierre — NUNCA inventa "sin dirección clara".
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
// nada (Engine las filtra). Cada cláusula resuelve su propia lista {deptos} vía
// formatDeptList — leíble tras CUALQUIER base.

export const AMPLIFIER_CLAUSES: Partial<
  Record<AmplificadorTipo, (deptos: string[]) => string>
> = {
  // CONVERGENCIA_AMBOS — núcleo REUSE de buildConvergenciaCruce.converge_limpia.
  // Frase generalizable: no necesita interpolar la lista de deptos.
  CONVERGENCIA_AMBOS: () =>
    'Cuando dos lentes independientes coinciden, el hallazgo deja de ser percepción: pasa a ser hecho.',

  // CONVERGENCIA_EXIT — los que se fueron ya lo dijeron en Exit.
  CONVERGENCIA_EXIT: (deptos) => {
    if (deptos.length === 0) return '';
    return `En ${formatDeptList(deptos)}, los que se fueron ya lo dijeron en la encuesta de salida (Exit).`;
  },

  // CONVERGENCIA_ONBOARDING — los que recién entraron ya lo señalaron.
  CONVERGENCIA_ONBOARDING: (deptos) => {
    if (deptos.length === 0) return '';
    return `En ${formatDeptList(deptos)}, los que recién entraron ya lo señalaron en Onboarding.`;
  },

  // TEATRO_EN_DEPTO — métricas dicen sano, las palabras no.
  TEATRO_EN_DEPTO: (deptos) => {
    if (deptos.length === 0) return '';
    return `En ${formatDeptList(deptos)} las métricas dicen sano y las palabras no.`;
  },

  // SEXTA_ALERTA — condensación REUSE de buildAlertas.silencio_con_voz_externa.contexto.
  SEXTA_ALERTA: (deptos) => {
    if (deptos.length === 0) return '';
    const list = formatDeptList(deptos);
    return `En ${list}, otras fuentes documentaron señales activas en el mismo período.`;
  },

  // OTRO_MUNDO — deptos que ni entraron a la medición, ya dejaron rastro afuera.
  OTRO_MUNDO: (deptos) => {
    if (deptos.length === 0) return '';
    return `En ${formatDeptList(deptos)}, que ni siquiera entraron a la medición, ya quedó rastro por fuera.`;
  },
};

// ────────────────────────────────────────────────────────────────────────────

/** Une una lista de gerencias en prosa española ("A, B y C"). Exportado para
 *  que el Engine resuelva {deptos} / {nombres} con el mismo formato que las
 *  cláusulas amplificadoras. */
export function formatDeptList(deptos: string[]): string {
  if (deptos.length === 0) return '';
  if (deptos.length === 1) return deptos[0];
  if (deptos.length === 2) return `${deptos[0]} y ${deptos[1]}`;
  return `${deptos.slice(0, -1).join(', ')} y ${deptos[deptos.length - 1]}`;
}
