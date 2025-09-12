// ====================================================================
// FOCALIZAHR DEPARTMENTS - ANALYTICS ADAPTER
// src/lib/services/DepartmentAdapter.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// Chat 7: Extensión Jerarquía con Patrón Orquestador - ACTUALIZADO
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
  
  // ✅ NUEVOS CAMPOS PARA JERARQUÍA
  hasHierarchy?: boolean;
  hierarchicalData?: HierarchicalScore[];
  defaultView?: 'gerencia' | 'departamento';
  scoresByLevel?: Record<number, any[]>;
}

export class DepartmentAdapter {
  
  // ✅ SISTEMA MATCHING INTELIGENTE ENTERPRISE
  private static createSmartMatcher(departments: any[]) {
    // Crear mapas de matching múltiples
    const exactMatch: { [key: string]: string } = {};
    const normalizedMatch: { [key: string]: string } = {};
    const aliasMatch: { [key: string]: string } = {};
    
    // Aliases predefinidos para matching inteligente enterprise
    const aliases: { [standardCategory: string]: string[] } = {
      'rrhh': [
        'rrhh', 'RRHH', 'recursos humanos', 'personas', 'people', 'talento', 
        'cultura', 'gestion de personas', 'capital humano', 'desarrollo organizacional', 'Rrhh',
        'bienestar', 'clima', 'gente', 'equipo humano', 'cultura organizacional'
      ],
      'desarrollo': [
        'desarrollo', 'dev', 'ti', 'TI', 'it', 'IT', 'tecnologia', 'sistemas', 
        'ingenieria', 'tech', 'development', 'informatica', 'I+D', 'innovacion',
        'I+D+i', 'tecnologias', 'digitalizacion', 'transformacion digital'
      ],
      'ventas': [
        'ventas', 'Ventas', 'sales', 'comercial', 'equipo comercial', 'business development', 
        'generacion de demanda', 'cuentas clave', 'sucursales', 'retail', 'canal',
        'distribucion', 'territorios', 'fuerza de ventas', 'business'
      ],
      'marketing': [
        'marketing', 'mercadeo', 'comunicaciones', 'publicidad', 'visual', 
        'growth', 'marca', 'branding', 'diseno', 'comunicacion', 'rrpp',
        'contenidos', 'digital', 'marketing digital', 'creatividad'
      ],
      'operaciones': [
        'operaciones', 'ops', 'operations', 'logistica', 'urgencias', 'produccion', 
        'supply chain', 'calidad', 'gerencia operaciones', 'plantas', 'procesos',
        'cadena de suministro', 'mantenimiento', 'operativa'
      ],
      'finanzas': [
        'finanzas', 'finance', 'contabilidad', 'accounting', 'tesoreria', 
        'administracion y finanzas', 'gerencia finanzas', 'fin. y adm.',
        'cobranzas', 'facturacion', 'cuentas por cobrar', 'control de gestion',
        'administracion'
      ],
      'gerencia': [
        'gerencia', 'gerencia general', 'direccion', 'dirección', 'management', 'c-level', 
        'Direccion medica', 'jefatura', 'supervision', 'coordinacion', 'liderazgo',
        'alta direccion', 'equipo directivo'
      ]
    };
    
    departments.forEach(dept => {
      if (dept.standardCategory && dept.displayName) {
        const stdCategory = dept.standardCategory.toLowerCase();
        const displayName = dept.displayName;
        
        // 1. Matching exacto por standardCategory
        exactMatch[stdCategory] = displayName;
        
        // 2. Matching normalizado
        normalizedMatch[stdCategory.replace(/[^a-z0-9]/g, '')] = displayName;
        
        // 3. Matching por aliases
        const aliasArray = aliases[stdCategory] || [];
        aliasArray.forEach(alias => {
          aliasMatch[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = displayName;
        });
      }
    });
    
    return {
      findMatch: (participantDeptName: string): string | null => {
        if (!participantDeptName) return null;
        
        const normalized = participantDeptName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // 1. Intentar matching exacto
        if (exactMatch[participantDeptName.toLowerCase()]) {
          return exactMatch[participantDeptName.toLowerCase()];
        }
        
        // 2. Intentar matching normalizado
        if (normalizedMatch[normalized]) {
          return normalizedMatch[normalized];
        }
        
        // 3. Intentar matching por alias
        if (aliasMatch[normalized]) {
          return aliasMatch[normalized];
        }
        
        // 4. Matching parcial (contiene)
        for (const [alias, displayName] of Object.entries(aliasMatch)) {
          if (normalized.includes(alias) || alias.includes(normalized)) {
            return displayName;
          }
        }
        
        return null;
      },
      
      // Para debugging enterprise
      getMatchingInfo: () => ({
        exactMatches: Object.keys(exactMatch).length,
        normalizedMatches: Object.keys(normalizedMatch).length,
        aliasMatches: Object.keys(aliasMatch).length
      })
    };
  }

  /**
   * MÉTODO ORQUESTADOR ÚNICO Y DEFINITIVO
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
        // --- FLUJO JERÁRQUICO ---
        console.log('🏢 Detected hierarchical structure - using hierarchical flow');
        return this.enrichWithHierarchy(analytics, campaignId, accountId);
      } else {
        // --- FLUJO PLANO (SIN JERARQUÍA) ---
        console.log('📊 No hierarchy detected - using flat structure flow');
        return this.enrichFlatAnalytics(analytics, accountId);
      }
    } catch (error) {
      console.error('❌ Error in enrichAnalytics orchestrator:', error);
      return analytics; // Fallback seguro
    }
  }

  /**
   * MÉTODO ESPECIALISTA PRIVADO para estructuras jerárquicas.
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
   * MÉTODO ESPECIALISTA PRIVADO que preserva la lógica para estructuras planas.
   * Incluye todos los logs de debugging detallados para trazabilidad.
   */
  private static async enrichFlatAnalytics(
    analytics: any, 
    accountId: string
  ): Promise<EnrichedAnalytics> {
    try {
      // Preservar analytics originales
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

      // Crear matcher inteligente
      const smartMatcher = this.createSmartMatcher(departments);
      
      // Crear mapping standard category → display name
      const standardToDisplay: { [key: string]: string } = {};
      departments.forEach(dept => {
        if (dept.standardCategory) {
          standardToDisplay[dept.standardCategory] = dept.displayName;
        }
      });

      // LOGS DE DEBUGGING PRESERVADOS
      console.log('🔍 DEBUGGING: analytics object keys:', Object.keys(analytics));
      console.log('🔍 DEBUGGING: analytics.departmentScores value:', analytics.departmentScores);
      console.log('🔍 DEBUGGING: typeof departmentScores:', typeof analytics.departmentScores);
      
      if (analytics.departmentScores) {
        // Agregación ponderada con logs detallados
        const scoreAccumulator: { [displayName: string]: { totalScore: number; count: number; sources: string[] } } = {};
        
        console.log('🧠 FocalizaHR Enterprise: Starting intelligent matching...');
        console.log('📋 Available departments:', departments.map(d => `${d.displayName} (${d.standardCategory})`));
        console.log('🎯 Participant departments to match:', Object.keys(analytics.departmentScores));
        
        Object.entries(analytics.departmentScores).forEach(([participantDept, score]) => {
          let targetDisplayName: string;
          let matchType: string;
          
          // 1. Intentar matching exacto tradicional
          const exactDisplayName = standardToDisplay[participantDept.toLowerCase()];
          if (exactDisplayName) {
            targetDisplayName = exactDisplayName;
            matchType = 'exact';
          } else {
            // 2. Intentar matching inteligente enterprise
            const smartDisplayName = smartMatcher.findMatch(participantDept);
            if (smartDisplayName) {
              targetDisplayName = smartDisplayName;
              matchType = 'smart';
            } else {
              // 3. Fallback graceful: mantener nombre original
              targetDisplayName = participantDept;
              matchType = 'fallback';
            }
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
          
          console.log(`${matchType === 'exact' ? '✅' : matchType === 'smart' ? '🧠' : '⚠️'} ${matchType === 'exact' ? 'Exact' : matchType === 'smart' ? 'Smart' : 'No'} match: "${participantDept}" → "${targetDisplayName}"`);
        });

        // Calcular promedios ponderados finales
        const displayScores: { [displayName: string]: number } = {};
        Object.entries(scoreAccumulator).forEach(([displayName, accumulator]) => {
          const averageScore = accumulator.totalScore / accumulator.count;
          displayScores[displayName] = Math.round(averageScore * 10) / 10; // Redondear a 1 decimal
          
          // LOG AGREGACIÓN PARA DEBUGGING
          if (accumulator.count > 1) {
            console.log(`🔢 Agregación ponderada: "${displayName}" = (${accumulator.sources.join(' + ')}) / ${accumulator.count} = ${averageScore.toFixed(1)}`);
          }
        });

        enriched.departmentScoresDisplay = displayScores;
        enriched.departmentMapping = standardToDisplay;
        
        console.log('📊 Enterprise matching results:', smartMatcher.getMatchingInfo());
        console.log('🎯 Final departmentScoresDisplay:', displayScores);
      } else {
        console.log('❌ DEBUGGING: analytics.departmentScores is undefined/null/empty');
        console.log('❌ DEBUGGING: Full analytics object:', JSON.stringify(analytics, null, 2));
      }

      // Agregar estadísticas departments
      enriched.departmentStats = {
        totalDepartments: departments.length,
        configuredDepartments: departments.filter(d => d.participantCount > 0).length,
        averageParticipation: departments.length > 0 ? 
          departments.reduce((sum, d) => sum + d.participantCount, 0) / departments.length : 0,
      };

      console.log('✅ FocalizaHR Enterprise: Flat analytics enriched with intelligent matching:', {
        departmentsFound: departments.length,
        displayScoresGenerated: Object.keys(enriched.departmentScoresDisplay || {}).length,
        matchingEngine: 'Intelligent Fuzzy Matching v1.0 + Weighted Aggregation'
      });

      // Agregar flags de jerarquía
      enriched.hasHierarchy = false;
      enriched.defaultView = 'departamento';

      return enriched;
    } catch (error) {
      console.error('❌ Error in enrichFlatAnalytics:', error);
      return analytics;
    }
  }

  /**
   * NUEVO: Agrupa scores por nivel organizacional
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

  // ✅ OBTENER DEPARTMENT MAPPING (FUNCIÓN PARA EXPORTS)
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

      // Si es string normal (legacy department name), retornar tal como está
      return departmentValue;
    } catch (error) {
      console.error('❌ Error getting department display:', error);
      return departmentValue;
    }
  }

  // ✅ CONVERTIR PARTICIPANT DEPARTMENTS A DEPARTMENT IDs
  static async convertParticipantDepartments(
    accountId: string,
    participantDepartments: string[]
  ): Promise<{ [departmentName: string]: string | null }> {
    try {
      const departments = await DepartmentService.getDepartmentsByAccount(accountId);
      const departmentMap: { [name: string]: string | null } = {};

      // Crear SmartMatcher para matching inteligente
      const smartMatcher = this.createSmartMatcher(departments);

      // Crear map de department names únicos
      const uniqueDepartments = [...new Set(participantDepartments.filter(Boolean))];

      for (const deptName of uniqueDepartments) {
        // PRIMERO: Buscar match exacto por displayName
        const exactMatch = departments.find(d => 
          d.displayName.toLowerCase() === deptName.toLowerCase()
        );

        if (exactMatch) {
          departmentMap[deptName] = exactMatch.id;
          console.log(`✅ Exact match found: "${deptName}" → "${exactMatch.displayName}"`);
        } else {
          // SEGUNDO: Usar SmartMatcher para buscar por aliases
          const smartMatchName = smartMatcher.findMatch(deptName);
          if (smartMatchName) {
            const smartMatchDept = departments.find(d => d.displayName === smartMatchName);
            if (smartMatchDept) {
              departmentMap[deptName] = smartMatchDept.id;
              console.log(`🧠 Smart match found: "${deptName}" → "${smartMatchDept.displayName}"`);
            } else {
              departmentMap[deptName] = null;
            }
          } else {
            // No match encontrado, marcar como null (se puede crear después)
            departmentMap[deptName] = null;
            console.log(`⚠️ No match found for: "${deptName}" - will need to create`);
          }
        }
      }

      console.log('✅ Department mapping created:', departmentMap);
      return departmentMap;
    } catch (error) {
      console.error('❌ Error converting participant departments:', error);
      return {};
    }
  }

  // ✅ AUTO-CREAR DEPARTMENTS DESDE PARTICIPANT DATA
  static async autoCreateDepartmentsFromParticipants(
    accountId: string,
    participantDepartments: string[]
  ): Promise<void> {
    try {
      // Obtener departments únicos que no están vacíos
      const uniqueDepartments = [...new Set(
        participantDepartments
          .filter(Boolean)
          .map(dept => dept.trim())
          .filter(dept => dept.length > 0)
      )];

      if (uniqueDepartments.length === 0) {
        console.log('📊 No department names to auto-create');
        return;
      }

      // Obtener departments existentes
      const existingDepartments = await DepartmentService.getDepartmentsByAccount(accountId);
      
      // Crear SmartMatcher para matching inteligente
      const smartMatcher = this.createSmartMatcher(existingDepartments);
      
      // Filtrar departments que realmente son nuevos (no tienen match)
      const newDepartments = uniqueDepartments.filter(dept => {
        // Verificar match exacto
        const exactMatch = existingDepartments.some(d => 
          d.displayName.toLowerCase() === dept.toLowerCase()
        );
        
        if (exactMatch) {
          console.log(`✅ Exact match exists, skipping: "${dept}"`);
          return false;
        }
        
        // Verificar match inteligente
        const smartMatch = smartMatcher.findMatch(dept);
        if (smartMatch) {
          console.log(`🧠 Smart match exists, skipping: "${dept}" → "${smartMatch}"`);
          return false;
        }
        
        console.log(`🆕 New department to create: "${dept}"`);
        return true;
      });

      if (newDepartments.length === 0) {
        console.log('📊 All departments already exist (via exact or smart matching)');
        return;
      }

      // Crear SOLO los departments verdaderamente nuevos
      await DepartmentService.createBulkDepartments(accountId, newDepartments);
      console.log(`✅ Auto-created ${newDepartments.length} truly new departments:`, newDepartments);
    } catch (error) {
      console.error('❌ Error auto-creating departments:', error);
      // No throw - es una función de conveniencia que no debe romper el flujo
    }
  }
}