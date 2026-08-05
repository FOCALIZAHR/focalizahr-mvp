// src/lib/constants/climaBitacoraContent.ts
// ════════════════════════════════════════════════════════════════════════════
// Copy de la Bitácora de Acciones de Clima. CERO literal en el componente.
//
// Reglas aplicadas (skill focalizahr-narrativas):
//  - Español neutro con TUTEO. Nunca voseo ("Registra", no "Registrá").
//  - Sin em dash, sin emojis.
//  - Verbos vetados fuera: "Guardar", "Confirmar", "Enviar". El CTA nombra el
//    resultado, no la operación.
//  - Regla 3 (consecuencia, no instrucción): el aviso de duplicado dice el HECHO
//    y nada más. "Revisa antes de escribir" sería una instrucción.
//
// DECISIÓN DE PRODUCTO (Victor, 2026-08-03) — la intro NO explica cómo se evalúa
// el registro. Un jefe que entiende que no escribir cuenta en su contra escribe
// cualquier cosa para no quedar mal, y el registro deja de ser honesto. La
// pantalla dice qué es y nada más.
//
// Copy PROVISIONAL en el mismo régimen que el resto de clima: lo confirma
// Victor/Studio IA antes del lanzamiento.
// ════════════════════════════════════════════════════════════════════════════

/** Límite de la columna `ClimaActionLogEntry.text` (VarChar(200)). No inventar otro. */
export const BITACORA_TEXT_MAX = 200;

/** Entradas visibles antes de "Ver anteriores". Espeja ENTRIES_PREVIEW del endpoint. */
export const BITACORA_ENTRIES_PREVIEW = 3;

/** Ventana del aviso de registro reciente, en horas. */
export const BITACORA_RECENT_HOURS = 24;

export const BITACORA_SCREEN = {
  /** Salida al lobby de Clima. Nombra el destino, no la operación. */
  back: 'Volver a Clima',

  /**
   * Nombre de la pantalla. UNA línea discreta, no el título grande con bajada que se
   * sacó: sin él la pantalla no decía en ninguna parte qué era, y quien entra por un
   * correo cada varios meses necesita reconocer dónde está.
   *
   * Dice EXACTO lo mismo que la card del Rail por la que se entra. Un nombre distinto
   * para la misma superficie obliga a reaprender la navegación.
   *
   * Sin bajada: qué hacer acá lo dice el campo, no un párrafo explicativo.
   */
  screenName: 'Bitácora de acciones',

  loading: 'Cargando tus focos',

  error: {
    title: 'No se pudieron cargar tus focos',
    description: 'Vuelve a intentarlo en un momento.',
    retry: 'Reintentar',
  },

  /**
   * Estado vacío ÚNICO. Hoy cubre dos causas que el usuario no distingue ni le
   * importan: el vínculo con la nómina sin poblar, o simplemente no tener focos.
   *
   * Dice UNA cosa. El header de arriba ya explicó qué es la pantalla (`intro`), así
   * que repetirlo acá lo hacía decir lo mismo dos veces. Este bloque solo aporta el
   * dato que el header no tiene: por qué está vacío.
   *
   * Sin jerga: nada de "employeeId", nada de nombres de proyectos internos. Y sin
   * lenguaje de roadmap: no dice "en construcción", dice qué falta.
   */
  empty: {
    title: 'Todavía no está disponible',
    description: 'Falta conectar los usuarios con la nómina para identificar de qué focos respondes.',
  },
} as const;

/**
 * Portada. Primer estado de la pantalla, antes del carrusel.
 *
 * Existe porque entrar directo al primer foco no le dice al jefe cuántos tiene ni
 * que la empresa considera esto importante: el "1 de 8" es navegación, no mensaje.
 *
 * Patrón: PORTADA UNIVERSAL (`focalizahr-design` → SKILL.md, Gate 1: "mensaje corto
 * más 1 CTA, sin identidad de persona, sin split"), con el molde visual de
 * CompensationPortada. NO es el PATRÓN 5 de page-patterns.md:211-270, que trae caja
 * de misión, gauge y grilla de exploración, y es una ruta propia.
 *
 * Sin contadores en cero: decirle "0 bitácoras iniciadas" es reprocharle algo antes
 * de que lea nada.
 */
export const BITACORA_PORTADA = {
  /**
   * Título word-split del molde canónico: primera parte en blanco, segunda en
   * gradiente. Va ARRIBA del número, que funciona como respaldo del título y no al
   * revés.
   *
   * Texto idéntico al de la card del Rail por la que se entra. Un nombre distinto
   * para la misma superficie obliga a reaprender la navegación.
   */
  titleWhite: 'Bitácora de',
  titleGradient: 'Acciones',

  /** Verbo que nombra el resultado, no la operación. Sin promesas de tiempo. */
  cta: 'Iniciar Bitácora de Acción',
  /** Vuelta a la portada desde el carrusel. */
  back: 'Ver el resumen',

  narrative: 'Tus compromisos de Clima están activos. Registra lo que hiciste con cada uno.',
  /** Consecuencia, no instrucción (Regla 3 de focalizahr-narrativas). */
  consequence: 'Un plan sin registro es una declaración de intenciones sin evidencia.',
} as const;

/**
 * Bajada del número hero. Dice los DOS datos reales: cuántos focos y en cuántos
 * equipos. "8 compromisos" a secas miente por omisión, porque son 8 hallazgos
 * repartidos en 2 departamentos, y si el número miente el resto pierde credibilidad.
 */
export function bitacoraPortadaSuffix(focos: number, equipos: number): string {
  return `${focos === 1 ? 'foco' : 'focos'} en ${equipos} ${equipos === 1 ? 'equipo' : 'equipos'}`;
}

export const BITACORA_PLAN = {
  stepsLabel: 'Pasos acordados:',
  notesLabel: 'Nota de RRHH',
} as const;

export const BITACORA_FORM = {
  placeholder: '¿Qué hiciste con esto?',
  submit: 'Registrar intervención',
  submitting: 'Registrando',
} as const;

export const BITACORA_HISTORY = {
  /** Título del overlay. Acota a ESTE foco: la bitácora es por hallazgo, no global. */
  label: 'Bitácora de este foco',
  close: 'Cerrar',

  /**
   * Se muestra DENTRO del overlay cuando el foco no tiene registros. Fuera del
   * overlay no hay nada: si no hay registros, el acceso ni siquiera existe.
   *
   * Dice para qué sirve y nada más. No culpabiliza, no explica cómo se evalúa
   * después, no pone plazo ni instrucción (Regla 3).
   */
  invite: 'Aquí queda lo que registres sobre este foco.',

  loadingMore: 'Cargando',
} as const;

export const BITACORA_TOAST = {
  success: 'Registro agregado a la bitácora.',
  error: 'No se pudo registrar. El texto sigue en el campo.',
} as const;

// ── Helpers de texto con datos ──────────────────────────────────────────────

/** Contador fijo de la barra de píldoras. Visible en 320px sin recorrer la barra. */
export function bitacoraCounter(index: number, total: number): string {
  return `${index + 1} de ${total}`;
}

// ── Abreviatura de departamento para las píldoras ───────────────────────────
//
// La píldora es MONOLÍNEA (`DEPTO · Dimensión`), así que el nombre completo no
// entra. El truncado por CSS no sirve: con dos focos de "Atención a Clientes" las
// dos decían "ATENCIÓN A CLIENT…" y no distinguían nada, que era justo lo que
// estas píldoras vinieron a resolver.

const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'a', 'al', 'y', 'e', 'o', 'u']);

/** Prefijos que no identifican: "Gerencia Comercial" se reconoce por COMERCIAL. */
const PREFIJOS_GENERICOS = new Set([
  'gerencia', 'subgerencia', 'departamento', 'area', 'division', 'unidad', 'sub',
]);

const sinTildes = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

function primeraPalabraSignificativa(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((w) => {
    const l = sinTildes(w);
    return l.length > 0 && !PALABRAS_VACIAS.has(l);
  });
  if (palabras.length === 0) return nombre.toUpperCase();
  let i = 0;
  // Salta prefijos genéricos mientras quede algo más específico detrás.
  while (i < palabras.length - 1 && PREFIJOS_GENERICOS.has(sinTildes(palabras[i]))) i += 1;
  return palabras[i].toUpperCase();
}

/**
 * Abreviatura por departamento, GARANTIZANDO que dos departamentos distintos nunca
 * queden con la misma etiqueta.
 *
 * Se calcula sobre los departamentos presentes en la vista, no sobre la cuenta
 * entera: "Comercial" y "Gerencia Comercial" abrevian las dos a COMERCIAL, y si
 * ambas están en pantalla, las dos caen al nombre completo. Dos píldoras idénticas
 * apuntando a departamentos distintos es exactamente el error que hay que evitar en
 * una pantalla que firma lo que se escribe.
 */
export function bitacoraAbreviarDepartamentos(nombres: string[]): Map<string, string> {
  const unicos = [...new Set(nombres)];
  const porAbreviatura = new Map<string, number>();
  for (const n of unicos) {
    const a = primeraPalabraSignificativa(n);
    porAbreviatura.set(a, (porAbreviatura.get(a) ?? 0) + 1);
  }
  const out = new Map<string, string>();
  for (const n of unicos) {
    const a = primeraPalabraSignificativa(n);
    out.set(n, (porAbreviatura.get(a) ?? 0) > 1 ? n.toUpperCase() : a);
  }
  return out;
}

/**
 * Etiqueta de la píldora: `COMERCIAL · Liderazgo`.
 *
 * `departamentoAbreviado === null` cuando TODOS los focos de la vista son del mismo
 * departamento: ahí la abreviatura no distingue nada y se come media píldora. Con
 * seis focos de Atención a Clientes se leía `ATENCIÓN · Autonomía`,
 * `ATENCIÓN · Crecimiento`, `ATENCIÓN · Desarrollo`: la palabra que se repite ocupa
 * el lugar de la única que separa una píldora de la otra. El nombre del departamento
 * ya aparece una vez, dentro de la caja, que es donde corresponde.
 *
 * Con dos departamentos o más la abreviatura vuelve, porque ahí sí distingue.
 */
export function bitacoraPill(departamentoAbreviado: string | null, dimension: string): string {
  return departamentoAbreviado ? `${departamentoAbreviado} · ${dimension}` : dimension;
}

/** "Ver anteriores (5)" cuando hay más de las visibles. */
export function bitacoraSeeAll(total: number): string {
  return `Ver anteriores (${total})`;
}

/** Cola del renglón de la bitácora: `Bitácora de este foco · sin registros`. */
export function bitacoraDisclosure(total: number): string {
  if (total === 0) return 'sin registros';
  return total === 1 ? '1 registro' : `${total} registros`;
}

/**
 * Aviso de registro reciente. Dice el HECHO, sin instrucción (Regla 3).
 * `hace` ya viene formateado ("3 horas", "40 minutos").
 */
export function bitacoraRecentNotice(nombre: string, hace: string): string {
  return `${nombre} registró hace ${hace}.`;
}
