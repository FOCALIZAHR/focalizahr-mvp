// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY NARRATIVE ENGINE — Templates canónicos por lente
// src/lib/services/efficiency/EfficiencyNarrativeEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// 9 lentes × 3 familias. Templates verbatim del TASK canónico
// (orientación IA / FTEs / automatización).
//
// Signature canónica: compilarActo(lenteId, datos: Record<string,string>)
// El DataResolver pre-formatea los valores y los pasa como strings.
// ════════════════════════════════════════════════════════════════════════════

export type LenteId =
  | 'l1_inercia'
  | 'l2_zombie'
  | 'l3_adopcion'
  | 'l4_fantasma'
  | 'l5_brecha'
  | 'l6_seniority'
  | 'l7_fuga'
  | 'l8_retencion'
  | 'l9_pasivo'

export type FamiliaId = 'choque_tecnologico' | 'grasa_organizacional' | 'riesgo_financiero'

export interface LenteMeta {
  id: LenteId
  familia: FamiliaId
  titulo: string
  subtitulo: string
}

export const LENTES_META: Record<LenteId, LenteMeta> = {
  // ── FAMILIA 1 — CHOQUE TECNOLÓGICO ──────────────────────────────────
  l1_inercia: {
    id: 'l1_inercia',
    familia: 'choque_tecnologico',
    titulo: 'Costo de Inercia',
    subtitulo: 'FTEs atrapados en tareas automatizables',
  },
  l2_zombie: {
    id: 'l2_zombie',
    familia: 'choque_tecnologico',
    titulo: 'Paradoja del Talento Zombie',
    subtitulo: 'Rinden hoy, no pueden adaptarse mañana',
  },
  l3_adopcion: {
    id: 'l3_adopcion',
    familia: 'choque_tecnologico',
    titulo: 'Riesgo de Adopción',
    subtitulo: 'Invertir donde el clima no cooperará',
  },
  // ── FAMILIA 2 — GRASA ORGANIZACIONAL ────────────────────────────────
  l4_fantasma: {
    id: 'l4_fantasma',
    familia: 'grasa_organizacional',
    titulo: 'Cargos Fantasma',
    subtitulo: 'Títulos distintos, mismo trabajo',
  },
  l5_brecha: {
    id: 'l5_brecha',
    familia: 'grasa_organizacional',
    titulo: 'Brecha de Productividad',
    subtitulo: 'Salario pagado sin rendimiento equivalente',
  },
  l6_seniority: {
    id: 'l6_seniority',
    familia: 'grasa_organizacional',
    titulo: 'Compresión de Seniority',
    subtitulo: 'Junior con IA = output de Senior',
  },
  // ── FAMILIA 3 — RIESGO FINANCIERO ───────────────────────────────────
  l7_fuga: {
    id: 'l7_fuga',
    familia: 'riesgo_financiero',
    titulo: 'Fuga de Talento Aumentado',
    subtitulo: 'Quien se volverá 3x productivo con IA',
  },
  l8_retencion: {
    id: 'l8_retencion',
    familia: 'riesgo_financiero',
    titulo: 'Prioridad de Retención',
    subtitulo: 'Intocables, valiosos, neutros, prescindibles',
  },
  l9_pasivo: {
    id: 'l9_pasivo',
    familia: 'riesgo_financiero',
    titulo: 'Pasivo Laboral',
    subtitulo: 'Shock de finiquitos y payback',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES — canónicos verbatim del TASK
// ════════════════════════════════════════════════════════════════════════════

export const NARRATIVE_TEMPLATES: Record<LenteId, string> = {
  l1_inercia: `Su empresa tiene {N_FTES} FTEs equivalentes atrapados en tareas que la IA ya puede ejecutar. Eso es {CLP_MES} por mes que no está capturando — {CLP_ANIO} al año. No invertir en tecnología es, en la práctica, la decisión financiera más cara que puede tomar hoy.`,

  l2_zombie: `Tiene {N_PERSONAS} personas que rinden excelente hoy en cargos con {EXPOSICION_PROMEDIO}% de probabilidad de automatización. La evidencia de sus competencias dice que no podrán re-entrenarse. Sus mejores ejecutores de hoy son su mayor pasivo mañana.`,

  l3_adopcion: `{AREA} concentra el {PCT_POTENCIAL}% del potencial de ahorro vía automatización de su empresa. Pero su clima organizacional es {CLIMA}/5 — el más bajo. La tecnología no resuelve la falta de liderazgo. La amplifica.`,

  l4_fantasma: `Tiene {N_PARES} pares de cargos con títulos distintos que comparten más del {OVERLAP}% de sus tareas operativas. El {PCT_AUTOMATIZABLE}% de esas tareas compartidas serán automatizadas. Está pagando doble por trabajo que ya es redundante y pronto será irrelevante.`,

  l5_brecha: `{N_PERSONAS} personas tienen un salario estimado sobre el percentil {PERCENTIL} de su nivel con un dominio del cargo bajo el {UMBRAL}%. El costo mensual excedente acumulado es {CLP_MES}. No es un error de RRHH — es el resultado de postergar decisiones que tienen costo calculado.`,

  l6_seniority: `En {N_FAMILIAS} familias de cargo, un talento Junior con alta adaptabilidad equipado con las herramientas correctas generaría el mismo output operativo que el perfil Senior actual. Ahorro estructural proyectado: {CLP_AHORRO}/mes — {PCT_AHORRO}% de esa línea de nómina.`,

  l7_fuga: `Tiene {N_PERSONAS} personas en el cuadrante de mayor valor cuya productividad se va a multiplicar con IA. Si la compensación no refleja ese nuevo valor antes de que el mercado lo haga, los perderá. Costo de reemplazo estimado: {CLP_REEMPLAZO}.`,

  l8_retencion: `El sistema cruzó metas, rendimiento y adaptabilidad futura e identificó {N_PRESCINDIBLES} personas prescindibles por valor relativo. No por política ni antigüedad — por evidencia de tres fuentes independientes. La lista roja está lista.`,

  l9_pasivo: `Tu pasivo laboral acumulado es {CLP_FINIQUITOS} si hoy se desvincula a toda la dotación con derecho a indemnización ({N_ELEGIBLES} personas con más de un año). En 12 meses, ese pasivo crece a {CLP_Q4} — un incremento de {CLP_COSTO_ESPERA} solo por antigüedad adicional. Cada mes que postergas una decisión de reestructura, ese número sube.`,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPILAR ACTO — signature canónica del TASK (Record<string,string>)
// ════════════════════════════════════════════════════════════════════════════

export function compilarActo(
  lenteId: LenteId,
  datos: Record<string, string>
): string {
  const template = NARRATIVE_TEMPLATES[lenteId]
  if (!template) return ''
  return template.replace(
    /\{([^}]+)\}/g,
    (match, key) => datos[key.trim()] ?? match
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE FORMATO — usados por el DataResolver para prep Record<string,string>
// ════════════════════════════════════════════════════════════════════════════

/** Formato CLP ejecutivo: $1.2MM, $380M, $24k, $0 */
export function formatCLP(value: number): string {
  if (!isFinite(value) || value <= 0) return '$0'
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}MM`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`
  }
  return `$${Math.round(value)}`
}

/** Porcentaje redondeado sin símbolo: "72", "8", "100" */
export function formatPct(value: number): string {
  if (!isFinite(value)) return '0'
  return String(Math.round(value))
}

/** Entero legible: "12", "128", "1.200" */
export function formatInt(value: number): string {
  if (!isFinite(value)) return '0'
  return Math.round(value).toLocaleString('es-CL')
}

/** Decimal 1 dígito: "4.2" — para FTEs */
export function formatDec(value: number): string {
  if (!isFinite(value)) return '0'
  return (Math.round(value * 10) / 10).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}
