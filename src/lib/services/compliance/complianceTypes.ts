// src/lib/services/compliance/complianceTypes.ts
// Tipos compartidos del pilar Compliance (Ambiente Sano).

export type PatronNombre =
  | 'silencio_organizacional'
  | 'hostilidad_normalizada'
  | 'favoritismo_implicito'
  | 'resignacion_aprendida'
  | 'miedo_represalias';

export type OrigenPercibido =
  | 'vertical_descendente'
  | 'horizontal_pares'
  | 'sistemico_procesos'
  | 'indeterminado';

export type ConfianzaAnalisis = 'alta' | 'media' | 'baja' | 'insuficiente_data';

export interface PatronDetectado {
  nombre: PatronNombre;
  intensidad: number;
  origen_percibido: OrigenPercibido;
  fragmentos: string[];
  descripcion: string;
}

/** Output bruto del LLM para el análisis por departamento. */
export interface PatronAnalysisOutput {
  analisis_cot: string;
  patrones: PatronDetectado[];
  alerta_sesgo_genero: boolean;
  contexto_genero?: string;
  senal_dominante: string;
  confianza_analisis: ConfianzaAnalisis;
}

/** Entrada al meta-análisis: un resumen por departamento ya procesado. */
export interface MetaAnalysisDepartmentInput {
  departmentName: string;
  respondentCount: number;
  safetyScore: number;
  senalDominante: string;
  confianza: ConfianzaAnalisis;
  patrones: PatronDetectado[];
  teatroCumplimiento: boolean;
}

export type OrigenOrganizacional =
  | 'vertical_descendente'
  | 'horizontal_pares'
  | 'sistemico_procesos'
  | 'mixto'
  | 'indeterminado';

/** Output del LLM para el meta-análisis organizacional. */
export interface MetaAnalysisOutput {
  analisis_cot: string;
  patron_cultural_dominante: string;
  origen_organizacional: OrigenOrganizacional;
  focos_rojos_count: number;
  teatro_detectado_count: number;
  hallazgo_narrativo_portada: string;
  es_problema_cultural: boolean;
}
