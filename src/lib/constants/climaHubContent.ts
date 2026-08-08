// src/lib/constants/climaHubContent.ts
// ════════════════════════════════════════════════════════════════════════════
// Copy del Hub de Planes de Acción (H1.2). Archivo propio — NO se agrega a
// `climaBitacoraContent.ts`: ese archivo es de la Cápsula 2 y el hub está una
// capa por encima de las tres.
//
// Auditado contra la skill `focalizahr-narrativas`:
//   · Regla 0 (Minto): la barra de progreso va arriba de todo y responde sola.
//     Las tres tarjetas son navegación, no argumento — no llevan conclusión.
//   · Regla 3 (consecuencia, no instrucción): ninguna tarjeta dice qué hacer.
//     Dicen qué hay adentro. El hub no empuja a ningún lado.
//   · Regla 4 (sin jerga): cero "LLM", "motor", "cuadrante", "NLP", "cadencia".
//   · Tuteo neutro, nunca voseo.
//
// ⚠️ "FOCOS", no "planes". El plan maestro §1.3 ejemplifica con "34 de 42 planes",
// pero en el modelo real hay UN ActionPlan por campaña y N filas ClimaActionLog
// (una por departamento × dimensión). Decir "2 de 17 planes" sería un número
// falso. `foco` es la palabra que ya usa la Bitácora para esa misma fila
// (`climaBitacoraContent.ts:110`), así que el hub y la cápsula hablan igual.
// ════════════════════════════════════════════════════════════════════════════

import { ClipboardCheck, NotebookPen, Gauge, type LucideIcon } from 'lucide-react';
import type { ClimaPlanesCapsula } from '@/types/clima-hub';

/** Título de la portada del hub, en word-split (primera línea blanca, segunda en gradiente). */
export const HUB_TITLE = {
  first: 'Planes de',
  second: 'Acción',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Progreso de registro — dato puro, sin interpretación.
//
// ⛔ NO VIVE EN EL HUB (corrección de Victor, 2026-08-05). Estuvo arriba del
// enrutador y competía con él: en el hub las tres cápsulas pesan igual, y una
// barra arriba le daba protagonismo a una métrica que es de UNA de ellas. Ahora
// es el dato protagonista de la portada de la Cápsula 3, que es de quien era.
//
// No lleva adjetivos: un 12% no se anuncia como "bajo" ni un 81% como "sólido".
// El número habla solo.
// ─────────────────────────────────────────────────────────────────────────────

// Sin etiqueta arriba del número: el ritmo canónico de las portadas de Clima es
// título → dato hero → consecuencia (`ClimaPortada.tsx:50-78`), y la bajada de
// acá ya dice qué se está contando. Un rótulo extra rompía ese ritmo por nada.

/**
 * Bajada del número hero. Ejemplo real de hoy: "2 de 17 focos con al menos una
 * acción registrada".
 *
 * "al menos una" y no "una": un foco puede tener varias entradas de bitácora, y
 * la métrica mide cobertura, no volumen. Decir "con una acción" sugeriría que
 * quien registró tres veces está contado tres veces.
 */
export function efectividadProgressCaption(withAction: number, total: number): string {
  return `${withAction} de ${total} ${total === 1 ? 'foco' : 'focos'} con al menos una acción registrada`;
}

/**
 * Sin focos aprobados todavía. Neutro y sin leer nada en la ausencia: que no
 * haya focos no significa que nadie haya hecho nada, significa que el plan
 * todavía no se aprobó.
 */
export const EFECTIVIDAD_PROGRESS_EMPTY = 'Todavía no hay focos aprobados en esta medición.';

// ─────────────────────────────────────────────────────────────────────────────
// Las tres tarjetas.
//
// Los badges son POR MISIÓN, no por rol (plan maestro §1.3): no dicen "RRHH" ni
// "C-LEVEL" porque no limitan quién entra. Cualquiera con acceso a Clima puede
// abrir las tres; el filtrado real lo hace cada vista adentro.
//
// Peso idéntico entre las tres — es un enrutador, no un embudo. Ninguna es "la
// principal", y por eso NINGUNA lleva botón: la tarjeta entera es el destino.
// ─────────────────────────────────────────────────────────────────────────────

// COLORES = IDENTIDAD DE CÁPSULA, no semáforo de severidad. Es la misma nota que
// lleva `climaPlanPaths.ts:6-8` para los 4 caminos de Tab 1, y por la misma razón:
// el color dice QUÉ MUNDO es, nunca qué tan grave está. Se reusa la tríada exacta
// de `SummaryHub.tsx:35-46` (cyan · violeta · esmeralda), que es el molde que
// Victor señaló y del que Tab 1 ya declara ser clon.
export interface ClimaCapsulaCopy {
  id: ClimaPlanesCapsula;
  /** Nombre de misión. Va como badge de color, no como rol. */
  badge: string;
  title: string;
  /** Una frase. Qué mundo hay adentro, legible en tres segundos. */
  description: string;
  color: string;
  icon: LucideIcon;
}

export const HUB_CAPSULAS: ClimaCapsulaCopy[] = [
  {
    id: 'planes',
    badge: 'Aprobación & Cobertura',
    title: 'Planes',
    description: 'Aprobación de planes y control de cobertura por departamento.',
    color: '#22D3EE',
    icon: ClipboardCheck, // el mismo ícono que la card `planes` del Rail: continuidad
  },
  {
    id: 'bitacora',
    badge: 'Registro & Bitácora',
    title: 'Bitácora',
    description: 'Registro táctico de acciones por cada líder de equipo.',
    color: '#A78BFA',
    icon: NotebookPen, // el que tenía la Bitácora cuando era card del Rail
  },
  {
    id: 'efectividad',
    badge: 'Inteligencia & Efectividad',
    title: 'Seguimiento de Efectividad',
    description: 'Impacto real de las intervenciones y hallazgos basados en evidencia.',
    color: '#10B981',
    icon: Gauge, // medición, no flecha ascendente: TrendingUp prometería mejora
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dato protagonista de cada tarjeta (el `metric` del molde SummaryHub: número en
// blanco + etiqueta chica al lado).
//
// Cada cápsula muestra el dato de SU mundo, no una métrica global repetida tres
// veces. Todos salen del mismo endpoint, así que nunca se contradicen entre sí.
// ─────────────────────────────────────────────────────────────────────────────

/** Planes: cuántas decisiones tiene el plan y que ya está aprobado. */
export function capsulaPlanesMetric(total: number): { value: string; label: string } {
  return {
    value: `${total}`,
    label: `${total === 1 ? 'decisión' : 'decisiones'} · Plan aprobado`,
  };
}

/** Bitácora: cobertura de registro. Mismo criterio que la Cápsula 3, mismo origen. */
export function capsulaBitacoraMetric(
  withAction: number,
  total: number
): { value: string; label: string } {
  return {
    value: `${withAction} de ${total}`,
    label: `${total === 1 ? 'foco' : 'focos'} con registro`,
  };
}

/**
 * Efectividad: cuántos focos tienen veredicto. Sin ninguno, la tarjeta no muestra
 * número — muestra el estado. "Pendiente de medición" es un hecho del negocio (no
 * cerró todavía un Seguimiento Focalizado), no un aviso de pantalla sin construir.
 */
export const CAPSULA_EFECTIVIDAD_SIN_MEDICION = 'Pendiente de medición';

/**
 * CTA de la portada de Efectividad. Nombra el DESTINO, no la operación: es la
 * regla del diccionario de verbos ("Ver Plan", no "Ver"). Las otras dos portadas
 * de Clima llevan el suyo en el mismo lugar (`ClimaPlanPortada.tsx:106`
 * "Comenzar", `ClimaPortada.tsx:82`).
 */
/**
 * CTA de la PORTADA → lleva a la pantalla de cobertura.
 * Cada CTA nombra su destino (diccionario de verbos de la skill de diseño): la
 * portada no lleva a los hallazgos, lleva a la cobertura, y decir "Ver hallazgos"
 * ahí prometería una pantalla que todavía no es la siguiente.
 */
export const EFECTIVIDAD_CTA = 'Ver cobertura';

/** CTA de la pantalla de COBERTURA → lleva a los hallazgos del motor. */
export const COBERTURA_CTA = 'Ver hallazgos';

export function capsulaEfectividadMetric(
  measured: number,
  total: number
): { value: string; label: string } {
  return {
    value: `${measured} de ${total}`,
    label: `${measured === 1 ? 'foco medido' : 'focos medidos'}`,
  };
}

// Sin `HUB_CTA`. Las tarjetas del hub NO llevan botón "Entrar" (corrección de
// Victor, 2026-08-05): tres botones convertían un enrutador en tres llamados a
// la acción. La afordancia es la tarjeta misma, igual que en el Rail — se eleva
// al pasar el mouse y enciende su acento. Ver `ClimaSubproductoRailCard.tsx`.
export const HUB_BACK = 'Volver';

// ─────────────────────────────────────────────────────────────────────────────
// Cápsula 3 — estado previo a su gate propio (H2).
//
// Sin lenguaje de roadmap (regla del proyecto: cero "en construcción", cero
// "próximamente"). Se dice qué condición del NEGOCIO falta, no qué falta
// construir: la efectividad no se puede mostrar antes de que exista una segunda
// medición, y eso sería verdad aunque la pantalla estuviera terminada.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Cobertura de registro por gerencia (H2a) — contenido de la Cápsula 3.
//
// Vive acá y no en un archivo propio para que TODA la copy de la cápsula tenga un
// solo lugar: partirla dejaría la portada en un archivo y su contenido en otro.
//
// ⚠️ REGLA DEL PLAN MAESTRO §6, literal: "Si el jefe no escribe, eso es un dato,
// no un error". Por eso acá no aparece "pendiente", "faltante", "incumplido" ni
// "sin ejecutar". Una unidad sin registro se describe como lo que es —sin
// registro— y nada más. El sistema califica la táctica, nunca a la persona (§2.6).
// ─────────────────────────────────────────────────────────────────────────────

export const COBERTURA_TITLE = 'Cobertura de registro';

/**
 * Bajada de la sección. Dice qué se está mirando y, sobre todo, qué NO: el
 * registro no mide si el plan funcionó — eso lo dirá la próxima medición. Sin esa
 * aclaración, un 25% se lee como "el 75% falló", que es una conclusión que este
 * dato no sostiene.
 */
export const COBERTURA_SUB =
  'Qué unidades dejaron registro de lo que hicieron con sus focos. Es actividad, no resultado.';

/** Segunda línea de cada fila: el conteo crudo. */
export function coberturaRowCount(withAction: number, total: number): string {
  return `${withAction} de ${total} ${total === 1 ? 'foco' : 'focos'}`;
}

/** Distintivo de la unidad que todavía no registró nada. Descriptivo, no acusatorio. */
export const COBERTURA_TAG_SIN_REGISTRO = 'Sin registro';

/** Detalle al expandir una fila. */
export function coberturaDetalle(withAction: number, total: number): string {
  const sin = total - withAction;
  return `${withAction} con registro · ${sin} sin registro`;
}

/** Encabezado del drill-down. Misma palabra que usa Dimensiones. */
export function coberturaDesglose(n: number): string {
  return `Desglose (${n})`;
}

/** Micro-rótulo del panel de filas. Molde: `ClimaDimensionesView.tsx:282-285`. */
export function coberturaUnidadesLabel(n: number): string {
  return `${n} unidad${n !== 1 ? 'es' : ''} con focos`;
}

/**
 * Las dos etapas del flujo. No son dos bloques sueltos: la segunda DEPENDE de la
 * primera — sin registro no hay nada que cruzar contra la próxima medición, y por
 * eso se muestran encadenadas y no una al lado de la otra.
 */
// 🕐 RETIRADAS. `COBERTURA_ETAPA_1` y `COBERTURA_ETAPA_2` rotulaban las dos etapas
// encadenadas por un riel vertical, cuando cobertura y hallazgos vivían en la misma
// pantalla. Al separarse en dos pantallas (v3, corrección 1) el riel desapareció y
// con él sus rótulos: cada pantalla se presenta sola, con su propio panel de
// identidad. Se borran en vez de dejarse "por si acaso" — una constante sin
// consumidor es una pista falsa para el que lea esto en tres meses.

// ─────────────────────────────────────────────────────────────────────────────
// Pulso de actividad — el panel del 30%.
//
// El dato hero de esta columna es el TIEMPO, no el porcentaje. Razón: el
// porcentaje global ya lo dio la portada un clic antes, y las cards de la derecha
// dan el de cada gerencia. Los días transcurridos son lo único que no está en
// ninguna de las dos superficies y que nadie puede inferir mirándolas — y son los
// que le dan peso al conteo: "0 de 17" no dice lo mismo a los dos días que a los
// noventa.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bajada del número hero. El número va aparte, en grande.
 *
 * 🕐 Decía "días desde la aprobación" hasta el 2026-08-08. Se cambió a la última
 * entrada porque la antigüedad del plan NO SE MUEVE: a los 17 días dice 17 y
 * mañana 18, pase lo que pase. "Último registro hace 2 días" mide si el equipo
 * sigue vivo, que es la pregunta de esta pantalla.
 */
export function pulsoDiasLabel(dias: number): string {
  if (dias === 0) return 'último registro, hoy';
  return `${dias === 1 ? 'día' : 'días'} desde el último registro`;
}

/** Sin ninguna entrada escrita. Sin número: no hay nada que contar. */
export const PULSO_SIN_FECHA = 'Sin registros';

// ── Título de la pantalla de cobertura (word-split canónico) ─────────────────
export const COBERTURA_TITULO = { first: 'Cobertura de', second: 'Registro' } as const;

/** Narrativa bajo el título. Qué se está mirando, en una frase. */
export const COBERTURA_NARRATIVA =
  'Qué unidades dejaron registro de lo que hicieron con sus focos.';

/**
 * Estado de actividad, en una línea. Describe lo que hay; no reclama lo que
 * falta. La regla del plan §6 vale igual acá: si nadie escribió, eso es un dato.
 *
 * `conActividad` / `totalUnidades` son GERENCIAS (unidades de primer nivel), no
 * focos: esta línea habla de quiénes se movieron, y el conteo de focos ya vive en
 * cada card.
 */
export function pulsoActividad(conActividad: number, totalUnidades: number): string {
  if (totalUnidades === 0) return 'Todavía no hay gerencias con focos asignados.';
  if (conActividad === 0) return 'Sin actividad registrada en ninguna gerencia.';
  if (conActividad === totalUnidades) {
    return `Las ${totalUnidades} gerencias registraron actividad.`;
  }
  return `${conActividad} de ${totalUnidades} gerencias registraron actividad.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RADAR DE EJECUCIÓN — Estado 1 de la cascada de hallazgos (H3b).
// Diseño: `DISENO_CASCADA_HALLAZGOS_CAPSULA3.md` §1.
//
// Cadenas VERBATIM del diseño de Gemini ("no se desvía de esto"), auditadas
// contra la skill de narrativas antes de fijarlas: tuteo neutro, cero jerga
// técnica visible (no dice "clasificador", "LLM" ni "score"), y ninguna
// instrucción — describe lo que pasa, no pide que se haga algo.
//
// ⛔ ACÁ NO SE NOMBRA NADA INDIVIDUAL. Bajo el umbral no hay nombres de jefes, ni
// densidades, ni señales, ni verbos. Y no es solo que la UI no los pinte: el
// endpoint tampoco los manda (ver `api/clima/action-log/findings/route.ts`).
// ─────────────────────────────────────────────────────────────────────────────

export const RADAR_TITLE = { first: 'Radar de', second: 'Ejecución' } as const;

export const RADAR_SUBTITLE =
  'El motor analiza cada registro. Cuando haya suficiente volumen, los hallazgos aparecen acá.';

/** Bajada del ring. El número va en el anillo; esto lo nombra. */
export function radarCaptured(analyzed: number, threshold: number): string {
  return `${analyzed}/${threshold} registros capturados`;
}

export const RADAR_CLOSING = 'El análisis se acumula con cada entrada en la bitácora.';

/**
 * Avance por gerencia, en una línea.
 *
 * No está en el diseño §1, que muestra un único "8/30". Se agrega porque el
 * umbral es POR UNIDAD: con 8 registros globales repartidos en dos gerencias
 * (6 y 2), un anillo global al 27% sugiere que falta poco para TODO, cuando en
 * realidad ninguna unidad está cerca. Sin esta línea la pantalla no miente por
 * mala fe, pero induce a una lectura falsa.
 */
export function radarPorUnidad(units: Array<{ departmentName: string; entriesAnalyzed: number }>): string {
  return units.map((u) => `${u.departmentName} ${u.entriesAnalyzed}`).join(' · ');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO TÁCTICO — feed de auditoría caso por caso (diseño v2 §3).
//
// ⛔ EL CEO NO LEE EL VOCABULARIO DEL MOTOR. Acá no hay "verbos", "densidad",
// "score" ni "NLP". Las etiquetas de cada tarjeta llegan YA TRADUCIDAS desde el
// servidor (`types/clima-text-analysis.ts` → `ETIQUETA_EJECUTIVA`), así que este
// archivo solo aporta el chrome de la sección.
//
// ⛔ SIN PORCENTAJES BAJO EL UMBRAL (v2 §3.5). Con 8 registros, "13% ejecuta"
// suena a estadística y no lo es: un caso más lo mueve 12 puntos. Conteos
// absolutos, que no prometen una precisión que la muestra no tiene.
// ─────────────────────────────────────────────────────────────────────────────

// ── Acto 1 · El gancho de la portada (v3 §2) ─────────────────────────────────
//
// Headline por TEMPLATE, no por LLM (v3 §13, Opción A): con tres tramos fijos el
// resultado es predecible, gratis e idéntico entre corridas. Si algún día se
// siente mecánico, se migra a Sonnet sin tocar a quien lo consume.
//
// Los tres tramos no son cosmética: cambian la FRASE PROTAGONISTA según dónde
// está la empresa. Con ejecución baja, el dato que importa es cuántos NO
// ejecutaron; con ejecución alta, cuántos SÍ. Decir siempre lo mismo obligaría al
// lector a hacer la resta.

const EJECUCION_BAJA = 0.25;
const EJECUCION_ALTA = 0.75;

/** El gancho. `total` = registros analizados; `ejecutados` = con ejecución comprobable. */
export function portadaHallazgoHeadline(total: number, ejecutados: number): string {
  if (total === 0) return '';
  const ratio = ejecutados / total;
  const sin = total - ejecutados;

  if (ratio < EJECUCION_BAJA) {
    return `${sin} de ${total} ${total === 1 ? 'registro no presenta' : 'registros no presentan'} evidencia de ejecución.`;
  }
  if (ratio <= EJECUCION_ALTA) {
    return `${ejecutados} de ${total} ${ejecutados === 1 ? 'registro presenta' : 'registros presentan'} ejecución comprobable. El resto permanece en intención declarativa.`;
  }
  return `${ejecutados} de ${total} ${ejecutados === 1 ? 'registro presenta' : 'registros presentan'} ejecución comprobable.`;
}

/** Subtexto fijo de la portada (v3 §2). Explica qué hace el sistema, sin jerga. */
export const PORTADA_HALLAZGO_SUBTEXT =
  'FocalizaHR analiza cada registro para distinguir lo ejecutado de lo prometido.';

// ── Acto 3 · Nivel 1, el hallazgo protagonista (v3 §2) ───────────────────────

/**
 * La conclusión, arriba de todo (Minto). Habla del PATRÓN, nunca de una persona:
 * "6 de 8 líderes registran lo que van a hacer" — no "6 líderes no cumplieron".
 *
 * `promesas` sale de las tarjetas ya clasificadas por el servidor, no de un
 * cálculo nuevo: es cuántas quedaron en el grupo de intención.
 */
export function hallazgoHeadline(total: number, promesas: number): string {
  if (total === 0) return '';
  if (promesas === 0) {
    return `Los ${total} registros describen acciones ya ejecutadas.`;
  }
  return `${promesas} de ${total} ${promesas === 1 ? 'líder registra' : 'líderes registran'} lo que van a hacer, no lo que ya hicieron.`;
}

/** El argumento que sostiene el headline. */
export function hallazgoSoporte(ejecutados: number): string {
  if (ejecutados === 0) return 'Ningún registro presenta evidencia comprobable de ejecución.';
  if (ejecutados === 1) return 'Solo 1 registro presenta evidencia comprobable de ejecución.';
  return `${ejecutados} registros presentan evidencia comprobable de ejecución.`;
}

/** Pie del hallazgo, junto al chevron. Conteo absoluto: bajo 15 no hay porcentajes. */
export function hallazgoConteo(total: number): string {
  return `${total} ${total === 1 ? 'registro analizado' : 'registros analizados'}`;
}

/** Rótulo del acordeón de evidencia. */
export const HALLAZGO_VER_EVIDENCIA = 'Ver evidencia';
export const HALLAZGO_OCULTAR_EVIDENCIA = 'Ocultar evidencia';

// ── Título de la sección de hallazgos ────────────────────────────────────────
// "IA" va suelto para poder pintarlo en púrpura: es el color con que TODO el
// sistema marca lo que sale de un motor (v3 §7). Decir "IA" en el título es
// declarar de dónde viene lo que se lee abajo — el CEO tiene derecho a saber que
// está leyendo una lectura de máquina, no una observación directa.
// 🕐 RETIRADA. `IA_CONTEXTO = 'Planes de Acción'` era el rótulo de contexto de un
// header arriba del split, cuando el título se trató como título de PANTALLA. El
// mockup lo define como rótulo de PANEL, adentro de la columna derecha, y ahí no
// hay línea de contexto separada.

/**
 * Título en word-split, como pide el Patrón G: primera parte en blanco, segunda
 * en `fhr-title-gradient`. `badge` va aparte para pintarlo en púrpura — declara
 * que lo que se lee abajo salió de un motor, no de una observación directa.
 */
export const IA_TITULO = {
  badge: 'IA',
  first: 'Análisis de',
  second: 'Acciones de Clima',
} as const;

/**
 * Qué hay detrás del título. Va en tooltip y no en pantalla: es la explicación
 * para quien pregunta, no algo que el CEO deba leer para entender el hallazgo.
 */
export const IA_TOOLTIP =
  'Análisis de bitácoras asistido por IA con validación estructural y cruce de impacto causal con control de alucinaciones.';

/** Encabezado del bloque de evidencia, al desplegar. */
export const EVIDENCIA_HEADER = 'Registros analizados';

/** Botón para ver el resto de las tarjetas cuando pasan de 10. */
export function evidenciaVerRestantes(restantes: number): string {
  return `Ver ${restantes === 1 ? 'el restante' : `los ${restantes} restantes`}`;
}

/** Máximo de tarjetas visibles antes de pedir el resto. */
export const EVIDENCIA_VISIBLE_MAX = 10;

// 🕐 RETIRADA. `TACTICO_HEADER = 'Orientación a la Acción'` titulaba la sección
// hasta que el título pasó a ser "IA · Análisis de Acciones de Clima" (decisión de
// Victor, 2026-08-07) y subió arriba del 30/70. Quedó sin un solo consumidor: se
// borra en vez de dejarse "por si acaso", que es como se juntan las constantes
// fantasma que después nadie sabe si están vivas.
export const TACTICO_SUB = 'Auditoría táctica de los registros de bitácora.';

/** "8 registros analizados · 1 con ejecución comprobable". Sin porcentajes. */
export function tacticoConteo(total: number, conEjecucion: number): string {
  const reg = `${total} ${total === 1 ? 'registro analizado' : 'registros analizados'}`;
  const eje = `${conEjecucion} con ejecución comprobable`;
  return `${reg} · ${eje}`;
}

/** Pie de tarjeta: "Liderazgo · Atención a Clientes". */
export function tacticoContexto(dimension: string | null, departamento: string): string {
  return dimension ? `${dimension} · ${departamento}` : departamento;
}

/**
 * Fecha de la entrada, formato corto ("6 ago 2026" — v2 §3.2).
 * `Intl` en vez de date-fns: es una sola fecha corta y no justifica arrastrar el
 * locale de la librería a este árbol.
 */
export function tacticoFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export const HUB_EFECTIVIDAD_PENDIENTE = {
  title: 'Sin resultados de efectividad todavía',
  description:
    'El impacto de las intervenciones se puede leer cuando cierre la siguiente medición de clima sobre estos mismos departamentos.',
} as const;
