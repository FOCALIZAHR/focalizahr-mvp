// ====================================================================
// FOCALIZAHR DEPARTMENTS - ANALYTICS ADAPTER
// VERSIÓN REFACTORIZADA FINAL - Sistema de 8 Gerencias Estratégicas
// ====================================================================

import { DepartmentService } from './DepartmentService';
import { prisma } from '@/lib/prisma';
import { AggregationService, type HierarchicalScore } from './AggregationService';

export interface EnrichedAnalytics {
  // ✅ ANALYTICS ORIGINALES PRESERVADAS (snake_case)
  overall_score: number;
  participation_rate: number;
  category_scores: { [category: string]: number };
  department_scores?: { [dept: string]: number };
  
  // ✅ ANALYTICS ENRIQUECIDAS AGREGADAS (camelCase)
  departmentScoresDisplay?: { [displayName: string]: number };
  departmentMapping?: { [standardCategory: string]: string };
  departmentStats?: {
    totalDepartments: number;
    configuredDepartments: number;
    averageParticipation: number;
  };
  
  // ✅ CAMPOS PARA JERARQUÍA
  hasHierarchy?: boolean;
  hierarchicalData?: HierarchicalScore[];
  defaultView?: 'gerencia' | 'departamento';
  scoresByLevel?: Record<number, any[]>;
}

export class DepartmentAdapter {
  
  // 🚀 SISTEMA DE 8 CATEGORÍAS DE GERENCIA - DEFINITIVO
  private static gerenciaAliases: { [gerenciaCategory: string]: string[] } = {
    'personas': [
      'rrhh','rr.hh.','rr.hh', 'recursos humanos', 'personas', 'people', 'talento', 
      'hr', 'human resources', 'personal', 'empleados', 'colaboradores',
      'capital humano', 'gerencia de personas', 'gerencia rrhh',
      'gerencia de la felicidad', 'chief happiness officer',
      'people & culture', 'people and culture', 'employee experience',
      'people operations', 'people ops', 'cultura y felicidad',
      'gestión del talento', 'talento humano', 'gestion humana',
      'seleccion', 'reclutamiento', 'recruitment', 'hiring',
      'compensaciones', 'beneficios', 'nomina', 'payroll',
      'capacitacion', 'formacion', 'entrenamiento', 'desarrollo',
      'bienestar', 'clima', 'cultura organizacional',
      'relaciones laborales', 'sindicatos'
    ],
    'comercial': [
      'ventas','venta', 'sales', 'comercial', 'business', 'negocios',
      'revenue', 'ingresos', 'comercializacion',
      'gerencia comercial', 'gerencia de ventas', 'gerencia ventas',
      'business development', 'desarrollo de negocios',
      'chief revenue officer', 'gerencia revenue',
      'cuentas clave', 'key accounts', 'account management',
      'inside sales', 'field sales', 'fuerza de ventas',
      'retail', 'b2b', 'b2c', 'enterprise', 'pyme',
      'canales', 'distribución', 'partners', 'alianzas'
    ],
    'marketing': [
      'marketing', 'mercadeo', 'marca', 'branding', 'brand',
      'gerencia de marketing', 'gerencia marketing', 'cmo',
      'chief marketing officer', 'gerencia de marca',
      'publicidad', 'comunicaciones', 'comunicacion', 'pr',
      'relaciones publicas', 'public relations', 'rrpp',
      'digital', 'marketing digital', 'growth', 'growth marketing',
      'contenidos', 'content', 'social media', 'redes sociales',
      'diseño', 'creatividad', 'creativo', 'ux', 'ui',
      'seo', 'sem', 'performance', 'demand generation',
      'eventos', 'trade marketing', 'btl', 'atl'
    ],
    'tecnologia': [
      'tecnologia', 'technology', 'tech', 'ti', 'it',
      'sistemas', 'informatica', 'digital',
      'gerencia de tecnologia','gerencia de tecnología', 'gerencia it', 'gerencia sistemas',
      'cto', 'chief technology officer', 'gerencia ti',
      'transformacion digital', 'innovacion', 'innovation',
      'gerencia digital', 'chief digital officer',
      'desarrollo', 'development', 'dev', 'software',
      'ingenieria', 'engineering', 'programacion', 'coding',
      'infraestructura', 'redes', 'hardware', 'cloud',
      'data', 'datos', 'analytics', 'bi', 'business intelligence',
      'ciberseguridad', 'seguridad informatica', 'security',
      'devops', 'qa', 'testing', 'arquitectura',
      'inteligencia artificial', 'ai', 'machine learning', 'ml'
    ],
    'operaciones': [
      'operaciones', 'operations', 'ops', 'operativa',
      'gerencia de operaciones', 'gerencia operaciones',
      'coo', 'chief operating officer', 'gerencia operacional',
      'supply chain', 'cadena de suministro',
      'produccion', 'manufactura', 'fabricacion', 'planta',
      'logistica', 'distribucion', 'transporte', 'despacho',
      'almacen', 'bodega', 'warehouse', 'inventario', 'stock',
      'calidad', 'quality', 'control calidad', 'mejora continua',
      'compras', 'procurement', 'sourcing', 'abastecimiento',
      'mantenimiento', 'facilities','logística', 'logistica','instalaciones'
    ],
    'finanzas': [
      'finanzas', 'finance', 'financiero', 'financial',
      'gerencia de finanzas', 'gerencia finanzas', 'cfo',
      'chief financial officer', 'gerencia financiera',
      'administracion y finanzas', 'administracion',
      'contabilidad', 'accounting', 'contable',
      'tesoreria', 'treasury', 'cash', 'flujo de caja',
      'control de gestion', 'controlling', 'control financiero',
      'presupuesto', 'budget', 'costos', 'costs',
      'impuestos', 'tributaria', 'taxes', 'fiscal',
      'auditoria', 'audit', 'fp&a', 'analisis financiero',
      'credito', 'cobranzas', 'cuentas por cobrar',
      'cuentas por pagar', 'facturacion', 'billing'
    ],
    'servicio': [
      'servicio', 'service', 'servicio al cliente',
      'atencion al cliente',         // <-- sin tilde
      'atención al cliente',        // <-- con tilde
      'atencion a clientes',          // <-- en plural sin tilde
      'atención a clientes',        // <-- en plural con tilde
      'customer service', 'atencion al cliente','atención al cliente','Atención a Clientes',
      'gerencia de servicio', 'gerencia servicio al cliente',
      'experiencia cliente', 'customer experience', 'cx',
      'gerencia cx', 'chief experience officer',
      'soporte', 'support', 'help desk', 'helpdesk',
      'call center', 'contact center', 'telefonia',
      'postventa', 'posventa', 'post venta',
      'satisfaccion cliente', 'customer satisfaction',
      'reclamos', 'consultas', 'mesa de ayuda',
      'chat', 'omnichannel', 'multicanal'
    ],
    'legal': [
      'legal', 'juridico', 'juridica', 'leyes',
      'gerencia legal', 'gerencia juridica',
      'general counsel', 'secretaria general',
      'gerencia legal y compliance', 'compliance',
      'cumplimiento', 'regulatorio', 'regulatory',
      'normativo', 'gobierno corporativo', 'governance',
      'contratos', 'contracts', 'litigios', 'litigation',
      'propiedad intelectual', 'intellectual property', 'ip',
      'riesgo', 'risk', 'risk management', 'gestion riesgo',
      'auditoria interna', 'internal audit',
      'etica', 'ethics', 'anticorrupcion'
    ]
  };

  // AÑADIR ESTAS CONSTANTES (justo después de gerenciaAliases)
  private static keywordWeights = {
    EXACT_PHRASE: 100,
    STRONG_KEYWORD: 10,
    AMBIGUOUS_KEYWORD: 2,
  };

  private static strongKeywords: { [key: string]: string[] } = {
    tecnologia: ['software', 'sistemas', 'ti', 'infraestructura', 'tech', 'cto', 'it', 'informatica'],
    personas: ['rrhh', 'talento', 'clima', 'cultura', 'people', 'felicidad', 'bienestar', 'hr', 'desarrollo organizacional'],
    comercial: ['ventas', 'revenue', 'b2b', 'b2c', 'cuentas', 'sales'],
    marketing: ['marca', 'branding', 'publicidad', 'comunicaciones', 'seo', 'sem', 'growth'],
    operaciones: ['produccion', 'logistica', 'logística', 'calidad', 'supply', 'chain', 'bodega'],
    finanzas: ['contabilidad', 'tesoreria', 'auditoria', 'costos', 'presupuesto', 'cfo'],
    servicio: ['soporte', 'support', 'experiencia', 'cliente', 'cx', 'call', 'center'],
    legal: ['juridico', 'leyes', 'contratos', 'litigios', 'compliance', 'riesgo']
  };

  // ✅ MOTOR DE MAPEO INTELIGENTE - MÉTODO PRINCIPAL
  static getGerenciaCategory(term: string): string | null {
    if (!term) return null;
    
    const normalizedTerm = term.toLowerCase().trim();
    const categoryScores: { [key: string]: number } = {};
    
    // Nivel 1: Búsqueda de frase exacta (Máxima Prioridad)
    for (const [gerencia, aliases] of Object.entries(this.gerenciaAliases)) {
      if (aliases.includes(normalizedTerm)) {
        console.log(`✅ Match por frase exacta: "${term}" -> ${gerencia}`);
        return gerencia;
      }
    }
    
    // Nivel 2: Scoring por palabras clave
    const words = normalizedTerm.split(/[\s\-_\/]+/).filter(w => w.length > 1);
    
    for (const word of words) {
      for (const gerencia in this.gerenciaAliases) {
        // Sumar 10 puntos si es una palabra clave fuerte
        if (this.strongKeywords[gerencia]?.includes(word)) {
          categoryScores[gerencia] = (categoryScores[gerencia] || 0) + this.keywordWeights.STRONG_KEYWORD;
        }
        // Sumar 2 puntos si es una palabra ambigua (presente en la lista general de alias)
        else if (this.gerenciaAliases[gerencia].includes(word)) {
          categoryScores[gerencia] = (categoryScores[gerencia] || 0) + this.keywordWeights.AMBIGUOUS_KEYWORD;
        }
      }
    }
    
    // Nivel 3: Determinar el ganador
    if (Object.keys(categoryScores).length === 0) {
      console.warn(`⚠️ No se encontró mapeo para: "${term}"`);
      return null;
    }
    
    const sortedScores = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
    const [bestGerencia, bestScore] = sortedScores[0];
    const secondMatch = sortedScores[1];
    
    // Regla de ambigüedad: si el mejor no es al menos el doble de bueno que el segundo, es ambiguo
    if (secondMatch && bestScore < secondMatch[1] * 2) {
      console.warn(`⚠️ Mapeo ambiguo para: "${term}" - Scores:`, categoryScores);
      return null; // Se tratará como "sin_asignar"
    }
    
    console.log(`🧠 Mejor match por scoring: "${term}" -> ${bestGerencia} (Score: ${bestScore})`);
    return bestGerencia;
  }

  /**
   * MÉTODO ORQUESTADOR PRINCIPAL
   * La API solo llama a este método.
   */
  static async enrichAnalytics(
    analytics: any,
    campaignId: string,
    accountId: string
  ): Promise<EnrichedAnalytics> {
    try {
      const hasHierarchy = await AggregationService.hasHierarchy(accountId);

      if (hasHierarchy) {
        // FLUJO JERÁRQUICO
        console.log('🏢 Detected hierarchical structure - using hierarchical flow');
        return this.enrichWithHierarchy(analytics, campaignId, accountId);
      } else {
        // FLUJO PLANO (SIN JERARQUÍA)
        console.log('📊 No hierarchy detected - using flat structure flow');
        return this.enrichFlatAnalytics(analytics, accountId);
      }
    } catch (error) {
      console.error('❌ Error in enrichAnalytics orchestrator:', error);
      return analytics; // Fallback seguro
    }
  }

  /**
   * Enriquecimiento para estructuras jerárquicas
   */
  private static async enrichWithHierarchy(
    analytics: any, 
    campaignId: string, 
    accountId: string
  ): Promise<EnrichedAnalytics> {
    try {
      console.log('🏗️ Enriching with hierarchical structure...');
      
      const hierarchicalScores = await AggregationService.getHierarchicalScores(campaignId, accountId);
      
      // Extraer scores de departamentos (nivel 3) para display
      const departmentScoresDisplay: { [key: string]: number } = {};
      const flattenTree = (nodes: HierarchicalScore[]) => {
        nodes.forEach(node => {
          if (node.level === 3) { // Nivel 3 son departamentos
            departmentScoresDisplay[node.displayName] = node.score;
          }
          if (node.children) {
            flattenTree(node.children);
          }
        });
      };
      flattenTree(hierarchicalScores);

      console.log('✅ Hierarchical enrichment complete:', {
        levelsFound: [...new Set(hierarchicalScores.map(h => h.level))],
        departmentsExtracted: Object.keys(departmentScoresDisplay).length
      });

      return {
        ...analytics,
        hasHierarchy: true,
        hierarchicalData: hierarchicalScores,
        defaultView: 'gerencia',
        departmentScoresDisplay,
        scoresByLevel: this.groupScoresByLevel(hierarchicalScores),
        departmentMapping: await this.getDepartmentMapping(accountId)
      };
    } catch (error) {
      console.error('❌ Error in enrichWithHierarchy:', error);
      return analytics;
    }
  }

  /**
   * Enriquecimiento para estructuras planas - USA EL NUEVO MOTOR
   */
  private static async enrichFlatAnalytics(
    analytics: any, 
    accountId: string
  ): Promise<EnrichedAnalytics> {
    try {
      const enriched = { ...analytics };
      
      // Obtener departments configurados
      const departments = await DepartmentService.getDepartmentsByAccount(accountId);
      
      if (departments.length === 0) {
        console.log('📊 No departments configured - returning original analytics');
        return { 
          ...enriched, 
          hasHierarchy: false, 
          defaultView: 'departamento' 
        };
      }

      // Crear mapping standard category → display name
      const standardToDisplay: { [key: string]: string } = {};
      departments.forEach(dept => {
        if (dept.standardCategory) {
          standardToDisplay[dept.standardCategory] = dept.displayName;
        }
      });

      if (analytics.departmentScores) {
        const scoreAccumulator: { [displayName: string]: { totalScore: number; count: number; sources: string[] } } = {};
        
        console.log('🧠 Starting intelligent mapping with 8 gerencias system...');
        
        Object.entries(analytics.departmentScores).forEach(([participantDept, score]) => {
          let targetDisplayName: string;
          let matchType: string;
          
          // USAR EL NUEVO MOTOR getGerenciaCategory
          const gerenciaCategory = this.getGerenciaCategory(participantDept);
          
          if (gerenciaCategory && standardToDisplay[gerenciaCategory]) {
            targetDisplayName = standardToDisplay[gerenciaCategory];
            matchType = 'gerencia-mapped';
          } else if (standardToDisplay[participantDept.toLowerCase()]) {
            targetDisplayName = standardToDisplay[participantDept.toLowerCase()];
            matchType = 'exact';
          } else {
            // Si no hay match, asignar a "Sin Asignar"
            targetDisplayName = 'Sin Asignar';
            matchType = 'quarantine';
            console.warn(`⚠️ Término no mapeado: "${participantDept}" para cuenta ${accountId} - asignado a "Sin Asignar"`);
          }
          
          // Acumular scores
          if (!scoreAccumulator[targetDisplayName]) {
            scoreAccumulator[targetDisplayName] = {
              totalScore: 0,
              count: 0,
              sources: []
            };
          }
          
          scoreAccumulator[targetDisplayName].totalScore += score as number;
          scoreAccumulator[targetDisplayName].count += 1;
          scoreAccumulator[targetDisplayName].sources.push(participantDept);
          
          console.log(`${matchType === 'gerencia-mapped' ? '🧠' : matchType === 'exact' ? '✅' : '⚠️'} ${matchType}: "${participantDept}" → "${targetDisplayName}"`);
        });

        // Calcular promedios ponderados finales
        const displayScores: { [displayName: string]: number } = {};
        Object.entries(scoreAccumulator).forEach(([displayName, accumulator]) => {
          const averageScore = accumulator.totalScore / accumulator.count;
          displayScores[displayName] = Math.round(averageScore * 10) / 10;
          
          if (accumulator.count > 1) {
            console.log(`🔢 Agregación ponderada: "${displayName}" = ${averageScore.toFixed(1)} (${accumulator.count} fuentes)`);
          }
        });

        enriched.departmentScoresDisplay = displayScores;
        enriched.departmentMapping = standardToDisplay;
        
        console.log('🎯 Final departmentScoresDisplay:', displayScores);
      }

      // Agregar estadísticas departments
      enriched.departmentStats = {
        totalDepartments: departments.length,
        configuredDepartments: departments.filter(d => d.participantCount > 0).length,
        averageParticipation: departments.length > 0 ? 
          departments.reduce((sum, d) => sum + d.participantCount, 0) / departments.length : 0,
      };

      enriched.hasHierarchy = false;
      enriched.defaultView = 'departamento';

      return enriched;
    } catch (error) {
      console.error('❌ Error in enrichFlatAnalytics:', error);
      return analytics;
    }
  }

  /**
   * Agrupa scores por nivel organizacional
   */
  private static groupScoresByLevel(hierarchicalData: HierarchicalScore[]): Record<number, any[]> {
    const byLevel: Record<number, any[]> = {};
    
    const traverse = (nodes: HierarchicalScore[]) => {
      nodes.forEach(node => {
        if (!byLevel[node.level]) {
          byLevel[node.level] = [];
        }
        byLevel[node.level].push({
          id: node.id,
          name: node.displayName,
          score: node.score,
          participants: node.participants
        });
        
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(hierarchicalData);
    return byLevel;
  }

  // ✅ OBTENER DEPARTMENT MAPPING
  static async getDepartmentMapping(accountId: string): Promise<{ [key: string]: string }> {
    try {
      const departments = await DepartmentService.getDepartmentsByAccount(accountId);
      const mapping: { [key: string]: string } = {};
      departments.forEach(dept => {
        if (dept.standardCategory) {
          mapping[dept.standardCategory] = dept.displayName;
        }
      });
      return mapping;
    } catch (error) {
      console.error('❌ Error getting department mapping:', error);
      return {};
    }
  }

  // ✅ OBTENER DISPLAY NAME PARA DEPARTMENT VALUE
  static async getDepartmentDisplay(
    departmentValue: string | null,
    accountId: string
  ): Promise<string> {
    if (!departmentValue) return 'Sin departamento';

    try {
      // Si parece un UUID (departmentId), buscar display name
      if (departmentValue.length > 20 && departmentValue.includes('-')) {
        const dept = await prisma.department.findFirst({
          where: { 
            id: departmentValue, 
            accountId,
            isActive: true,
          },
          select: { displayName: true },
        });
        return dept?.displayName || departmentValue;
      }

      // Si es string normal, intentar mapear a gerencia
      const gerenciaCategory = this.getGerenciaCategory(departmentValue);
      if (gerenciaCategory) {
        const departments = await DepartmentService.getDepartmentsByAccount(accountId);
        const matchedDept = departments.find(d => d.standardCategory === gerenciaCategory);
        if (matchedDept) {
          return matchedDept.displayName;
        }
      }

      return departmentValue;
    } catch (error) {
      console.error('❌ Error getting department display:', error);
      return departmentValue;
    }
  }

  // ✅ CONVERTIR PARTICIPANT DEPARTMENTS A IDs - USA NUEVO MOTOR
  static async convertParticipantDepartments(
    accountId: string,
    participantDepartments: string[]
  ): Promise<{ [departmentName: string]: string | null }> {
    try {
      const departments = await DepartmentService.getDepartmentsByAccount(accountId);
      const departmentMap: { [name: string]: string | null } = {};
      const uniqueDepartments = [...new Set(participantDepartments.filter(Boolean))];

      for (const deptName of uniqueDepartments) {
        // PRIMERO: Intentar mapear a gerencia estándar
        const gerenciaCategory = this.getGerenciaCategory(deptName);
        
        if (gerenciaCategory) {
          const matchedDept = departments.find(d => d.standardCategory === gerenciaCategory);
          if (matchedDept) {
            departmentMap[deptName] = matchedDept.id;
            console.log(`✅ Mapped to gerencia: "${deptName}" → "${gerenciaCategory}" → "${matchedDept.displayName}"`);
            continue;
          }
        }
        
        // SEGUNDO: Buscar match exacto por displayName
        const exactMatch = departments.find(d => 
          d.displayName.toLowerCase() === deptName.toLowerCase()
        );

        if (exactMatch) {
          departmentMap[deptName] = exactMatch.id;
          console.log(`✅ Exact match found: "${deptName}" → "${exactMatch.displayName}"`);
        } else {
          // No match - asignar a null (flujo de cuarentena)
          departmentMap[deptName] = null;
          console.warn(`⚠️ Término no mapeado: "${deptName}" para cuenta ${accountId} - asignado a "Sin Asignar"`);
        }
      }

      console.log('✅ Department mapping created:', departmentMap);
      return departmentMap;
    } catch (error) {
      console.error('❌ Error converting participant departments:', error);
      return {};
    }
  }

  // ✅ NO AUTO-CREAR DEPARTMENTS - SOLO REPORTAR
  static async processParticipantDepartments(
    accountId: string,
    participantDepartments: string[]
  ): Promise<{
    mapped: string[];
    unmapped: string[];
  }> {
    try {
      const uniqueDepartments = [...new Set(
        participantDepartments
          .filter(Boolean)
          .map(dept => dept.trim())
          .filter(dept => dept.length > 0)
      )];

      if (uniqueDepartments.length === 0) {
        console.log('📊 No department names to process');
        return { mapped: [], unmapped: [] };
      }

      const existingDepartments = await DepartmentService.getDepartmentsByAccount(accountId);
      const mapped: string[] = [];
      const unmapped: string[] = [];
      
      uniqueDepartments.forEach(dept => {
        // Verificar si mapea a una gerencia estándar
        const gerenciaCategory = this.getGerenciaCategory(dept);
        if (gerenciaCategory) {
          mapped.push(`"${dept}" → ${gerenciaCategory}`);
          console.log(`✅ Mapped to gerencia: "${dept}" → "${gerenciaCategory}"`);
          return;
        }
        
        // Verificar match exacto
        const exactMatch = existingDepartments.some(d => 
          d.displayName.toLowerCase() === dept.toLowerCase()
        );
        
        if (exactMatch) {
          mapped.push(`"${dept}" (exact match)`);
          console.log(`✅ Exact match exists: "${dept}"`);
          return;
        }
        
        // No match - marcar para cuarentena
        unmapped.push(dept);
        console.warn(`⚠️ Término no mapeado: "${dept}" para cuenta ${accountId} - requiere revisión manual`);
      });

      // Resumen
      if (mapped.length > 0) {
        console.log(`✅ ${mapped.length} términos mapeados exitosamente`);
      }
      
      if (unmapped.length > 0) {
        console.warn(`⚠️ ${unmapped.length} términos en cuarentena (Sin Asignar):`, unmapped);
        console.warn(`📝 Acción requerida: Revisión manual por equipo Concierge para cuenta ${accountId}`);
      }

      return { mapped, unmapped };
    } catch (error) {
      console.error('❌ Error processing departments:', error);
      return { mapped: [], unmapped: [] };
    }
  }

  // ✅ MÉTODO HELPER PARA OBTENER LA GERENCIA EFECTIVA
  static async getEffectiveGerencia(deptId: string): Promise<string | null> {
    const dept = await prisma.department.findUnique({
      where: { id: deptId },
      include: { parent: true }
    });
    
    if (!dept) return null;
    
    // Si es una gerencia (nivel 2), usar su categoría
    if (dept.unitType === 'gerencia' && dept.standardCategory) {
      return dept.standardCategory;
    }
    
    // Si es departamento con categoría (empresa plana), usar su categoría
    if (dept.standardCategory) {
      return dept.standardCategory;
    }
    
    // Si es departamento hijo, usar categoría del padre
    if (dept.parent?.standardCategory) {
      return dept.parent.standardCategory;
    }
    
    return null;
  }

  // ✅ MÉTODO DE DEBUGGING
  static debugAliases(): void {
    console.log('📋 SISTEMA DE ALIASES PARA 8 GERENCIAS:');
    console.log('=========================================');
    
    for (const [gerencia, aliases] of Object.entries(this.gerenciaAliases)) {
      console.log(`\n🏢 GERENCIA: ${gerencia.toUpperCase()}`);
      console.log(`   Total aliases: ${aliases.length}`);
      console.log(`   Muestra: ${aliases.slice(0, 10).join(', ')}...`);
    }
    
    const totalAliases = Object.values(this.gerenciaAliases)
      .reduce((sum, aliases) => sum + aliases.length, 0);
    
    console.log('\n=========================================');
    console.log(`📊 TOTAL ALIASES EN SISTEMA: ${totalAliases}`);
    console.log('=========================================');
  }
}