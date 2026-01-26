// ════════════════════════════════════════════════════════════════════════════
// POSITION ADAPTER - Motor de Mapeo de Cargos a Niveles Jerárquicos
// src/lib/services/PositionAdapter.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapea cargos libres del cliente a 7 niveles jerárquicos estandarizados
// con agregación a 4 grupos "acotados" para dashboards CEO
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface PositionMapping {
  standardJobLevel: string | null;
  acotadoGroup: string | null;
  mappingMethod: 'exact' | 'fuzzy' | 'historic' | 'manual' | 'failed';
  confidence: number;
  matchedAlias?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE TRACK - 3 Audiencias para Evaluación de Desempeño
// ════════════════════════════════════════════════════════════════════════════

export type PerformanceTrack = 'COLABORADOR' | 'MANAGER' | 'EJECUTIVO';

export interface PositionClassification {
  standardJobLevel: string | null;
  acotadoGroup: string | null;
  performanceTrack: PerformanceTrack;
}

interface JobLevelConfig {
  label_es: string;
  label_en: string;
  order: number;
  acotadoGroup: string;
}

interface AcotadoConfig {
  label_es: string;
  label_en: string;
  order: number;
  levels: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class PositionAdapter {

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE 7 NIVELES JERÁRQUICOS
  // ══════════════════════════════════════════════════════════════════════════

  static readonly JOB_LEVEL_CONFIG: Record<string, JobLevelConfig> = {
    'gerente_director': {
      label_es: 'Gerentes/Directores',
      label_en: 'Managers/Directors',
      order: 1,
      acotadoGroup: 'alta_gerencia'
    },
    'subgerente_subdirector': {
      label_es: 'Subgerentes/Subdirectores',
      label_en: 'Deputy Managers/Directors',
      order: 2,
      acotadoGroup: 'alta_gerencia'
    },
    'jefe': {
      label_es: 'Jefes',
      label_en: 'Heads/Chiefs',
      order: 3,
      acotadoGroup: 'mandos_medios'
    },
    'supervisor_coordinador': {
      label_es: 'Supervisores/Coordinadores',
      label_en: 'Supervisors/Coordinators',
      order: 4,
      acotadoGroup: 'mandos_medios'
    },
    'profesional_analista': {
      label_es: 'Profesionales/Analistas',
      label_en: 'Professionals/Analysts',
      order: 5,
      acotadoGroup: 'profesionales'
    },
    'asistente_otros': {
      label_es: 'Asistentes/Administrativos',
      label_en: 'Assistants/Administrative',
      order: 6,
      acotadoGroup: 'base_operativa'
    },
    'operativo_auxiliar': {
      label_es: 'Operativos/Auxiliares',
      label_en: 'Operatives/Entry Level',
      order: 7,
      acotadoGroup: 'base_operativa'
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE 4 GRUPOS ACOTADOS (Agregación 7→4)
  // ══════════════════════════════════════════════════════════════════════════

  static readonly ACOTADO_CONFIG: Record<string, AcotadoConfig> = {
    'alta_gerencia': {
      label_es: 'Alta Gerencia',
      label_en: 'Senior Management',
      order: 1,
      levels: ['gerente_director', 'subgerente_subdirector']
    },
    'mandos_medios': {
      label_es: 'Mandos Medios',
      label_en: 'Middle Management',
      order: 2,
      levels: ['jefe', 'supervisor_coordinador']
    },
    'profesionales': {
      label_es: 'Profesionales',
      label_en: 'Professionals',
      order: 3,
      levels: ['profesional_analista']
    },
    'base_operativa': {
      label_es: 'Base Operativa',
      label_en: 'Operational Base',
      order: 4,
      levels: ['asistente_otros', 'operativo_auxiliar']
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE ALIASES - 350+ TÉRMINOS
  // ══════════════════════════════════════════════════════════════════════════

  private static jobLevelAliases: Record<string, string[]> = {

    'gerente_director': [
      // C-Suite
      'ceo', 'chief executive officer', 'presidente ejecutivo',
      'cfo', 'chief financial officer',
      'cto', 'chief technology officer',
      'cmo', 'chief marketing officer',
      'coo', 'chief operating officer',
      'cio', 'chief information officer',
      'chro', 'chief human resources officer',
      // Gerencia General
      'gerente general', 'gerenta general',
      'director general', 'directora general',
      'director ejecutivo', 'directora ejecutiva',
      'gerente de división', 'director de división',
      // Gerencias Funcionales
      'gerente', 'gerenta',
      'director', 'directora',
      'gerente de área', 'gerenta de área',
      'director de área', 'directora de área',
      // Inglés
      'general manager', 'managing director',
      'executive director', 'senior director',
      'division manager', 'division director',
      'head of division', 'department head',
      'country manager', 'regional director',
      // Salud
      'director médico', 'directora médica',
      'director clínico', 'directora clínica',
      'gerente médico', 'director de enfermería',
      // Retail
      'gerente de tienda', 'director de tienda',
      'gerente retail', 'gerente de sucursal',
      'director de sucursal', 'gerente regional'
    ],

    'subgerente_subdirector': [
      'subgerente', 'subgerenta',
      'subdirector', 'subdirectora',
      'subgerente general', 'subdirector general',
      'gerente adjunto', 'gerenta adjunta',
      'director adjunto', 'directora adjunta',
      'vicepresidente', 'vicepresidenta',
      'vp', 'vice president',
      'vicepresidente ejecutivo', 'svp',
      'senior vice president',
      'deputy director', 'deputy manager',
      'assistant director', 'assistant general manager',
      'associate director', 'second in command',
      // Abreviaciones comunes Chile
      'subgte', 'subgte.', 'sub gerente', 'sub gte',
      'subdir', 'sub director'
    ],

    'jefe': [
      'jefe', 'jefa',
      'jefe de', 'jefa de',
      'jefe de área', 'jefa de área',
      'jefe de departamento', 'jefa de departamento',
      'jefe de sección', 'jefa de sección',
      'jefe de unidad', 'jefa de unidad',
      'encargado', 'encargada',
      'responsable', 'responsable de',
      'líder de área', 'lider de area',
      'head of', 'area head',
      'department head', 'section head',
      'unit head', 'team head',
      'lead', 'area lead',
      // Salud
      'jefe de servicio', 'jefa de servicio',
      'jefe de pabellón', 'jefe de turno médico',
      'enfermera jefe', 'enfermero jefe',
      // Retail
      'jefe de local', 'jefa de local',
      'jefe de piso', 'jefa de piso',
      'jefe de bodega', 'jefa de bodega'
    ],

    'supervisor_coordinador': [
      'supervisor', 'supervisora',
      'supervisor de', 'supervisora de',
      'supervisor de turno', 'supervisora de turno',
      'supervisor de área', 'supervisora de área',
      'supervisor de operaciones', 'supervisora de operaciones',
      'coordinador', 'coordinadora',
      'coordinador de', 'coordinadora de',
      'coordinador de proyectos', 'coordinadora de proyectos',
      'coordinador de área', 'coordinadora de área',
      'team lead', 'team leader',
      'shift lead', 'shift leader',
      'shift supervisor', 'floor supervisor',
      'coordinator', 'project coordinator',
      'capataz', 'capataza',
      'mayordomo', 'mayordoma',
      'encargado de turno', 'líder de equipo'
    ],

    'profesional_analista': [
      // Analistas
      'analista', 'analista de', 'analista senior',
      'analista de datos', 'analista de negocios',
      'analista de sistemas', 'analista financiero',
      'analista contable', 'analista de rrhh',
      // Profesionales Técnicos
      'ingeniero', 'ingeniera',
      'arquitecto', 'arquitecta',
      'desarrollador', 'desarrolladora',
      'programador', 'programadora',
      'diseñador', 'diseñadora',
      // Profesionales Funcionales
      'contador', 'contadora',
      'abogado', 'abogada',
      'economista', 'consultor', 'consultora',
      // Especialistas
      'especialista', 'especialista en',
      'especialista senior', 'experto', 'experta',
      // Ejecutivos (no senior)
      'ejecutivo', 'ejecutiva',
      'ejecutivo de cuentas', 'ejecutiva de cuentas',
      'ejecutivo de ventas', 'ejecutiva de ventas',
      'ejecutivo comercial', 'ejecutiva comercial',
      // Salud Profesional
      'médico', 'médica', 'doctor', 'doctora',
      'enfermero', 'enfermera',
      'kinesiólogo', 'kinesióloga',
      'nutricionista', 'psicólogo', 'psicóloga',
      'tecnólogo médico', 'terapeuta',
      // Inglés
      'analyst', 'senior analyst',
      'engineer', 'senior engineer',
      'developer', 'senior developer',
      'specialist', 'consultant',
      'account executive', 'sales executive',
      // Agregados por refinamiento v2
      'evaluador', 'evaluadora',
      'dibujante', 'dibujante técnico',
      'inspector', 'inspectora',
      'inspector de calidad', 'inspector técnico',
      'revisor', 'revisora',
      'auditor', 'auditora',
      'prevencionista', 'prevencionista de riesgos'
    ],

    'asistente_otros': [
      'asistente', 'asistente de',
      'asistente administrativo', 'asistente administrativa',
      'asistente ejecutivo', 'asistente ejecutiva',
      'asistente de gerencia', 'asistente contable',
      'secretaria', 'secretario',
      'secretaria ejecutiva', 'secretario ejecutivo',
      'secretaria de gerencia', 'recepcionista',
      'administrativo', 'administrativa',
      'administrativo contable', 'administrativa de personal',
      'auxiliar administrativo', 'auxiliar administrativa',
      'técnico', 'técnica',
      'técnico de', 'técnica de',
      'técnico en', 'técnica en',
      'paramédico', 'tens',
      'auxiliar de enfermería', 'técnico paramédico',
      'assistant', 'administrative assistant',
      'executive assistant', 'secretary',
      'receptionist', 'clerk',
      // Agregados por refinamiento v2
      'tesorero', 'tesorera',
      'estafeta', 'mensajero interno',
      'archivista', 'archivero'
    ],

    'operativo_auxiliar': [
      // Operarios
      'operario', 'operaria',
      'operador', 'operadora',
      'operador de máquinas', 'operador de producción',
      // Auxiliares
      'auxiliar', 'auxiliar de',
      'auxiliar de bodega', 'auxiliar de aseo',
      'auxiliar de servicios', 'auxiliar de cocina',
      // Retail Piso
      'vendedor', 'vendedora',
      'cajero', 'cajera',
      'repositor', 'repositora',
      'promotor', 'promotora',
      'reponedor', 'reponedora',
      // Logística
      'bodeguero', 'bodeguera',
      'despachador', 'despachadora',
      'picker', 'packer',
      'estibador', 'cargador',
      // Servicios
      'guardia', 'vigilante',
      'conserje', 'portero', 'portera',
      'aseador', 'aseadora',
      'chofer', 'conductor', 'conductora',
      'mensajero', 'mensajera',
      // Nivel Entrada
      'junior', 'trainee',
      'practicante', 'becario', 'becaria',
      'aprendiz', 'interno', 'interna',
      // Inglés
      'operator', 'warehouse worker',
      'cashier', 'sales associate',
      'driver', 'cleaner', 'janitor',
      'security guard', 'intern'
    ]
  };

  // ══════════════════════════════════════════════════════════════════════════
  // KEYWORDS FUERTES (Mayor peso en scoring)
  // ══════════════════════════════════════════════════════════════════════════

  private static strongKeywords: Record<string, string[]> = {
    // Nivel 1 (100 pts) - Palabras KILL de Alta Dirección
    'gerente_director': ['gerente', 'gerenta', 'director', 'directora', 'ceo', 'cfo', 'cto', 'cmo', 'coo', 'cio', 'chro'],
    // Nivel 2 (80 pts) - Subgerencia
    'subgerente_subdirector': ['subgerente', 'subgerenta', 'subdirector', 'subdirectora', 'vicepresidente', 'vp', 'adjunto', 'adjunta', 'subgte', 'subdir'],
    // Nivel 3 (60 pts) - Jefatura
    'jefe': ['jefe', 'jefa', 'encargado', 'encargada', 'responsable', 'head', 'lead'],
    // Nivel 4 (40 pts) - Supervisión
    'supervisor_coordinador': ['supervisor', 'supervisora', 'coordinador', 'coordinadora', 'capataz'],
    // Nivel 5-7 (10 pts) - Operativo/Individual
    'profesional_analista': ['analista', 'ingeniero', 'ingeniera', 'especialista', 'ejecutivo', 'ejecutiva', 'profesional', 'evaluador', 'inspector', 'auditor', 'diseñador', 'diseñadora', 'dibujante', 'contador', 'contadora'],
    'asistente_otros': ['asistente', 'secretaria', 'secretario', 'administrativo', 'administrativa', 'técnico', 'técnica', 'recepcionista', 'tesorero', 'estafeta'],
    'operativo_auxiliar': ['operario', 'operaria', 'auxiliar', 'vendedor', 'vendedora', 'cajero', 'cajera', 'junior', 'bodeguero', 'bodeguera', 'guardia']
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PONDERACIÓN JERÁRQUICA - Pesos por Nivel (Sistema "Kill")
  // ══════════════════════════════════════════════════════════════════════════
  // Nivel 1 (100 pts): Alta Dirección - MATA cualquier otra palabra
  // Nivel 2 (80 pts): Subgerencia
  // Nivel 3 (60 pts): Jefatura
  // Nivel 4 (40 pts): Supervisión
  // Nivel 5-7 (10 pts): Operativo/Individual
  // ══════════════════════════════════════════════════════════════════════════

  private static readonly HIERARCHICAL_WEIGHTS: Record<string, number> = {
    'gerente_director': 100,      // Nivel 1 - Kill
    'subgerente_subdirector': 80, // Nivel 2
    'jefe': 60,                   // Nivel 3
    'supervisor_coordinador': 40, // Nivel 4
    'profesional_analista': 10,   // Nivel 5
    'asistente_otros': 10,        // Nivel 6
    'operativo_auxiliar': 10      // Nivel 7
  };

  private static keywordWeights = {
    EXACT_PHRASE: 1000,   // Match exacto siempre gana
    ALIAS_MATCH: 3,
    PARTIAL_MATCH: 1,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL - ÚNICA FUENTE DE VERDAD
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mapea un cargo libre a un nivel jerárquico estandarizado
   * @param positionTitle - Cargo tal como viene del cliente
   * @returns standardJobLevel o null si no hay match
   */
  static getJobLevel(positionTitle: string): string | null {
    if (!positionTitle) return null;

    // Normalización
    const normalized = positionTitle
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos

    const levelScores: Record<string, number> = {};

    // ═══ NIVEL 1: Match exacto de frase completa ═══
    for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
      if (aliases.includes(normalized)) {
        console.log(`✅ [PositionAdapter] Match exacto: "${positionTitle}" → ${level}`);
        return level;
      }
    }

    // ═══ NIVEL 2: Scoring por palabras clave ═══
    const words = normalized.split(/[\s\-_\/]+/).filter(w => w.length > 1);

    for (const word of words) {
      for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
        // ═══ PONDERACIÓN JERÁRQUICA ═══
        // Keywords fuertes usan peso jerárquico (100/80/60/40/10)
        // Esto hace que "gerente" (100 pts) MATE a "administrativo" (10 pts)
        if (this.strongKeywords[level]?.includes(word)) {
          const hierarchicalWeight = this.HIERARCHICAL_WEIGHTS[level] || 10;
          levelScores[level] = (levelScores[level] || 0) + hierarchicalWeight;
        }
        // Alias general: +3 puntos (sin cambio)
        else if (aliases.includes(word)) {
          levelScores[level] = (levelScores[level] || 0) + this.keywordWeights.ALIAS_MATCH;
        }
        // Contiene alias (match parcial): +1 punto (sin cambio)
        else if (aliases.some(alias => alias.includes(word) || word.includes(alias))) {
          levelScores[level] = (levelScores[level] || 0) + this.keywordWeights.PARTIAL_MATCH;
        }
      }
    }

    // ═══ NIVEL 3: Determinar ganador ═══
    if (Object.keys(levelScores).length === 0) {
      console.warn(`⚠️ [PositionAdapter] Sin mapeo: "${positionTitle}"`);
      return null;
    }

    const sortedScores = Object.entries(levelScores).sort((a, b) => b[1] - a[1]);
    const [bestLevel, bestScore] = sortedScores[0];
    const secondMatch = sortedScores[1];

    // Regla de ambigüedad: si el mejor no es al menos el doble que el segundo, es ambiguo
    if (secondMatch && bestScore < secondMatch[1] * 2) {
      console.warn(`⚠️ [PositionAdapter] Mapeo ambiguo: "${positionTitle}" - Scores:`, levelScores);
      return null;
    }

    console.log(`🧠 [PositionAdapter] Match por scoring: "${positionTitle}" → ${bestLevel} (Score: ${bestScore})`);
    return bestLevel;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODO COMPLETO CON HISTÓRICO (Feedback Loop)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mapea posición con prioridad: histórico > algoritmo
   * @param positionTitle - Cargo original del cliente
   * @param accountId - ID de la cuenta para buscar histórico
   */
  static async mapPosition(
    positionTitle: string,
    accountId: string
  ): Promise<PositionMapping> {

    if (!positionTitle) {
      return {
        standardJobLevel: null,
        acotadoGroup: null,
        confidence: 0,
        mappingMethod: 'failed'
      };
    }

    const normalizedTitle = positionTitle.toLowerCase().trim();

    // ═══ PRIORIDAD 1: Buscar en histórico (feedback loop) ═══
    try {
      const historicMapping = await prisma.jobMappingHistory.findUnique({
        where: {
          accountId_clientPositionTitle: {
            accountId,
            clientPositionTitle: normalizedTitle
          }
        }
      });

      if (historicMapping) {
        console.log(`📚 [PositionAdapter] Match histórico: "${positionTitle}" → ${historicMapping.standardJobLevel}`);
        return {
          standardJobLevel: historicMapping.standardJobLevel,
          acotadoGroup: historicMapping.acotadoGroup,
          confidence: 1.0,
          mappingMethod: 'historic'
        };
      }
    } catch (error) {
      // Modelo puede no existir aún
      console.warn('[PositionAdapter] JobMappingHistory not available yet');
    }

    // ═══ PRIORIDAD 2: Algoritmo de aliases ═══
    const algorithmResult = this.getJobLevel(positionTitle);

    if (algorithmResult) {
      const acotadoGroup = this.getAcotadoGroup(algorithmResult);
      return {
        standardJobLevel: algorithmResult,
        acotadoGroup,
        confidence: 0.85,
        mappingMethod: 'exact'
      };
    }

    // ═══ FALLBACK: Sin mapeo ═══
    return {
      standardJobLevel: null,
      acotadoGroup: null,
      confidence: 0,
      mappingMethod: 'failed'
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE TRACK MAPPING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Mapeo de standardJobLevel a performanceTrack
   * EJECUTIVO: Alta dirección (gerentes/directores)
   * MANAGER: Mandos medios con equipo (subgerentes, jefes, supervisores)
   * COLABORADOR: Contribuidores individuales (resto)
   */
  private static readonly TRACK_MAPPING: Record<string, PerformanceTrack> = {
    'gerente_director': 'EJECUTIVO',
    'subgerente_subdirector': 'MANAGER',
    'jefe': 'MANAGER',
    'supervisor_coordinador': 'MANAGER',
    'profesional_analista': 'COLABORADOR',
    'asistente_otros': 'COLABORADOR',
    'operativo_auxiliar': 'COLABORADOR'
  };

  /**
   * Deriva el performanceTrack desde el standardJobLevel
   * @param standardJobLevel - Nivel jerárquico (7 niveles)
   * @returns Track de audiencia (COLABORADOR | MANAGER | EJECUTIVO)
   */
  static mapToTrack(standardJobLevel: string | null): PerformanceTrack {
    if (!standardJobLevel) return 'COLABORADOR';
    return this.TRACK_MAPPING[standardJobLevel] || 'COLABORADOR';
  }

  /**
   * Método combinado: calcula las 3 clasificaciones de una vez
   * position → standardJobLevel → acotadoGroup + performanceTrack
   * @param position - Cargo tal como viene del cliente
   */
  static classifyPosition(position: string): PositionClassification {
    const standardJobLevel = this.getJobLevel(position);
    const acotadoGroup = this.getAcotadoGroup(standardJobLevel || '');
    const performanceTrack = this.mapToTrack(standardJobLevel);

    return { standardJobLevel, acotadoGroup, performanceTrack };
  }

  /**
   * Método combinado async: incluye lookup histórico
   * @param position - Cargo tal como viene del cliente
   * @param accountId - ID de la cuenta para buscar histórico
   */
  static async classifyPositionWithHistory(
    position: string,
    accountId: string
  ): Promise<PositionClassification & { mappingMethod: string }> {
    const mapping = await this.mapPosition(position, accountId);

    return {
      standardJobLevel: mapping.standardJobLevel,
      acotadoGroup: mapping.acotadoGroup,
      performanceTrack: this.mapToTrack(mapping.standardJobLevel),
      mappingMethod: mapping.mappingMethod
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el grupo acotado (4 niveles) para un nivel jerárquico (7 niveles)
   */
  static getAcotadoGroup(standardJobLevel: string): string | null {
    const config = this.JOB_LEVEL_CONFIG[standardJobLevel];
    return config?.acotadoGroup || null;
  }

  /**
   * Obtiene el label en español para un nivel jerárquico
   */
  static getLevelLabel(standardJobLevel: string, lang: 'es' | 'en' = 'es'): string {
    const config = this.JOB_LEVEL_CONFIG[standardJobLevel];
    if (!config) return 'Sin Clasificar';
    return lang === 'es' ? config.label_es : config.label_en;
  }

  /**
   * Obtiene el label en español para un grupo acotado
   */
  static getAcotadoLabel(acotadoGroup: string, lang: 'es' | 'en' = 'es'): string {
    const config = this.ACOTADO_CONFIG[acotadoGroup];
    if (!config) return 'Sin Clasificar';
    return lang === 'es' ? config.label_es : config.label_en;
  }

  /**
   * Obtiene todos los niveles ordenados para UI
   */
  static getAllLevelsOrdered(): Array<{ value: string; label: string; order: number; acotadoGroup: string }> {
    return Object.entries(this.JOB_LEVEL_CONFIG)
      .map(([value, config]) => ({
        value,
        label: config.label_es,
        order: config.order,
        acotadoGroup: config.acotadoGroup
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Obtiene todos los grupos acotados ordenados para UI
   */
  static getAllAcotadoGroupsOrdered(): Array<{ value: string; label: string; order: number }> {
    return Object.entries(this.ACOTADO_CONFIG)
      .map(([value, config]) => ({
        value,
        label: config.label_es,
        order: config.order
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Agrega mapeo al histórico (feedback loop)
   */
  static async saveToHistory(
    accountId: string,
    clientPositionTitle: string,
    standardJobLevel: string,
    correctedBy?: string
  ): Promise<void> {
    const acotadoGroup = this.getAcotadoGroup(standardJobLevel);

    await prisma.jobMappingHistory.upsert({
      where: {
        accountId_clientPositionTitle: {
          accountId,
          clientPositionTitle: clientPositionTitle.toLowerCase().trim()
        }
      },
      create: {
        accountId,
        clientPositionTitle: clientPositionTitle.toLowerCase().trim(),
        standardJobLevel,
        acotadoGroup: acotadoGroup || 'sin_clasificar',
        mappingMethod: correctedBy ? 'manual' : 'algorithm',
        confidence: correctedBy ? 1.0 : 0.85,
        correctedBy
      },
      update: {
        standardJobLevel,
        acotadoGroup: acotadoGroup || 'sin_clasificar',
        mappingMethod: 'manual',
        confidence: 1.0,
        correctedBy
      }
    });
  }

  /**
   * Debug: Muestra estadísticas del sistema de aliases
   */
  static debugAliases(): void {
    console.log('📋 SISTEMA DE ALIASES PARA 7 NIVELES JERÁRQUICOS:');
    console.log('═══════════════════════════════════════════════════');

    let totalAliases = 0;

    for (const [level, aliases] of Object.entries(this.jobLevelAliases)) {
      console.log(`\n👔 NIVEL: ${level.toUpperCase()}`);
      console.log(`   Label: ${this.JOB_LEVEL_CONFIG[level].label_es}`);
      console.log(`   Acotado: ${this.JOB_LEVEL_CONFIG[level].acotadoGroup}`);
      console.log(`   Total aliases: ${aliases.length}`);
      console.log(`   Muestra: ${aliases.slice(0, 8).join(', ')}...`);
      totalAliases += aliases.length;
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`📊 TOTAL ALIASES EN SISTEMA: ${totalAliases}`);

    console.log('\n📊 GRUPOS ACOTADOS (7→4):');
    for (const [group, config] of Object.entries(this.ACOTADO_CONFIG)) {
      console.log(`   ${group}: ${config.levels.join(' + ')}`);
    }
    console.log('═══════════════════════════════════════════════════');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (Export individual para conveniencia)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Función helper para obtener el grupo acotado de un nivel
 */
export function getAcotadoFromLevel(standardJobLevel: string): string {
  return PositionAdapter.getAcotadoGroup(standardJobLevel) || 'sin_clasificar';
}

/**
 * Labels para grupos acotados
 */
export const ACOTADO_LABELS: Record<string, string> = {
  'alta_gerencia': 'Alta Gerencia',
  'mandos_medios': 'Mandos Medios',
  'profesionales': 'Profesionales',
  'base_operativa': 'Base Operativa',
  'sin_clasificar': 'Sin Clasificar'
};

/**
 * Labels para niveles jerárquicos
 */
export const JOB_LEVEL_LABELS: Record<string, string> = {
  'gerente_director': 'Gerentes/Directores',
  'subgerente_subdirector': 'Subgerentes/Subdirectores',
  'jefe': 'Jefes',
  'supervisor_coordinador': 'Supervisores/Coordinadores',
  'profesional_analista': 'Profesionales/Analistas',
  'asistente_otros': 'Asistentes/Administrativos',
  'operativo_auxiliar': 'Operativos/Auxiliares',
  'sin_clasificar': 'Sin Clasificar'
};

/**
 * Labels para performance tracks
 */
export const TRACK_LABELS: Record<PerformanceTrack, string> = {
  'EJECUTIVO': 'Ejecutivos',
  'MANAGER': 'Managers',
  'COLABORADOR': 'Colaboradores'
};

/**
 * Descripción de audiencias por track
 */
export const TRACK_DESCRIPTIONS: Record<PerformanceTrack, string> = {
  'EJECUTIVO': 'Alta dirección - Encuesta: Core + Liderazgo + Estrategia',
  'MANAGER': 'Mandos medios con equipo - Encuesta: Core + Liderazgo',
  'COLABORADOR': 'Contribuidores individuales - Encuesta: Solo Competencias Core'
};
