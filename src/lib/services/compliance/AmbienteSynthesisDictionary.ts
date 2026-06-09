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

import type {
  DiagnosticType,
  Amplificador,
  AmplificadorSenal,
} from '@/types/ambiente-cascada';
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
// SIGNAL_FRAGMENTS — fragmento de señal por alertType canónico (copy v2 Victor)
// ════════════════════════════════════════════════════════════════════════════
// Se inserta detrás de "Exit ya dejó …" / "Onboarding ya marcó …" — leen como
// objeto directo (regla de concordancia §COPY v2). Keyear por canónico, NO alias.
// Tipos muertos (department_exit_pattern, DESENGANCHE_CULTURAL) sin entrada: no
// se emiten nunca. Los de peso 1 (nps_critico, onboarding_correlation,
// CONFUSION_ROL) solo llegan a CONVERGENCIA — escritos igual, no estorban.

export const SIGNAL_FRAGMENTS: Record<string, string> = {
  // EXIT (5 vivos)
  ley_karin: 'un indicio de ambiente no seguro',
  toxic_exit_detected: 'un patrón de salidas conflictivas',
  liderazgo_concentracion: 'un patrón de salidas concentradas bajo una misma línea de mando',
  nps_critico: 'detractores de la empresa',
  onboarding_correlation: 'un patrón de salidas que arrancan desde una mala entrada',
  // ONBOARDING (4 vivos)
  ABANDONO_DIA_1: 'abandonos en los primeros días',
  RIESGO_FUGA: 'riesgo de fuga en los que recién entraron',
  CONFUSION_ROL: 'confusión de rol en los que recién entraron',
  BIENVENIDA_FALLIDA: 'una bienvenida que no funcionó',
};

/** Señal del amplificador (los miembros con `senal?`; TEATRO no la tiene). */
function senalOf(amp: Amplificador): AmplificadorSenal | undefined {
  return 'senal' in amp ? amp.senal : undefined;
}

/** Fragmento mapeado del alertType, o undefined → la cláusula usa su fallback. */
function fragmentOf(senal: AmplificadorSenal | undefined): string | undefined {
  return senal ? SIGNAL_FRAGMENTS[senal.alertType] : undefined;
}

// ════════════════════════════════════════════════════════════════════════════
// AMPLIFIER_CLAUSES — composicionales (§3.5.7) · copy v2 verbatim
// ════════════════════════════════════════════════════════════════════════════
// Cada cláusula recibe el `Amplificador` completo. Lee `amp.senal` (producto +
// alertType) para nombrar la señal específica vía SIGNAL_FRAGMENTS; si falta el
// dato (o alertType no mapeado) cae al fallback genérico validado — el piso de
// claridad nunca se rompe. El Engine concatena el resultado al implicationBase.

export const AMPLIFIER_CLAUSES: Partial<
  Record<AmplificadorTipo, (amp: Amplificador) => string>
> = {
  // CONVERGENCIA_AMBOS — fallback neutro: el Engine entrega el dominante GLOBAL
  // (por peso podría ser onboarding), no el exit-dominante del grupo que la
  // versión específica requiere → se usa el neutro (§COPY v2 nota técnica).
  CONVERGENCIA_AMBOS: (amp) => {
    if (amp.deptos.length === 0) return '';
    return `En ${formatDeptList(amp.deptos)}, Exit y Onboarding confirman el mismo riesgo. Cuando dos fuentes independientes coinciden, deja de ser percepción.`;
  },

  // CONVERGENCIA_EXIT — "Exit ya dejó {señal}." / fallback "lo confirma Exit."
  CONVERGENCIA_EXIT: (amp) => {
    if (amp.deptos.length === 0) return '';
    const deptos = formatDeptList(amp.deptos);
    const frag = fragmentOf(senalOf(amp));
    return frag
      ? `En ${deptos}, Exit ya dejó ${frag}.`
      : `En ${deptos}, lo confirma Exit.`;
  },

  // CONVERGENCIA_ONBOARDING — "Onboarding ya marcó {señal}." / fallback.
  CONVERGENCIA_ONBOARDING: (amp) => {
    if (amp.deptos.length === 0) return '';
    const deptos = formatDeptList(amp.deptos);
    const frag = fragmentOf(senalOf(amp));
    return frag
      ? `En ${deptos}, Onboarding ya marcó ${frag}.`
      : `En ${deptos}, lo confirma Onboarding.`;
  },

  // TEATRO_EN_DEPTO — frase fija (no consume señal externa).
  TEATRO_EN_DEPTO: (amp) => {
    if (amp.deptos.length === 0) return '';
    return `En ${formatDeptList(amp.deptos)}, el estudio midió un ambiente sano. Las respuestas abiertas apuntan a lo contrario.`;
  },

  // SEXTA_ALERTA — exit-dominante nombra señal; onboarding-dominante solo
  // producto (límite coverage); sin dato → fallback.
  SEXTA_ALERTA: (amp) => {
    if (amp.deptos.length === 0) return '';
    const senal = senalOf(amp);
    if (senal?.producto === 'exit') {
      const frag = fragmentOf(senal);
      if (frag) {
        return `Este departamento no contestó la encuesta, pero Exit ya dejó ${frag}.`;
      }
    }
    if (senal?.producto === 'onboarding') {
      return 'Este departamento no contestó la encuesta, pero Onboarding ya muestra señales.';
    }
    return 'Este departamento no contestó la encuesta, pero otras fuentes ya muestran señales.';
  },

  // OTRO_MUNDO — exit y onboarding nombran señal (el detector trae el alertType
  // de ambos); sin dato → fallback.
  OTRO_MUNDO: (amp) => {
    if (amp.deptos.length === 0) return '';
    const senal = senalOf(amp);
    const frag = fragmentOf(senal);
    if (senal?.producto === 'exit' && frag) {
      return `Estos departamentos no entraron en este estudio de ambiente, pero Exit ya dejó ${frag}.`;
    }
    if (senal?.producto === 'onboarding' && frag) {
      return `Estos departamentos no entraron en este estudio de ambiente, pero Onboarding ya marcó ${frag}.`;
    }
    return 'Estos departamentos no entraron en este estudio de ambiente, pero otras fuentes ya muestran señales que podrían indicar un riesgo.';
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
