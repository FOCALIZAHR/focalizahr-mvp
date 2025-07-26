// ====================================================================
// FOCALIZAHR DEPARTMENTS - ANALYTICS ADAPTER
// src/lib/services/DepartmentAdapter.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// ====================================================================

import { DepartmentService } from './DepartmentService';
import { prisma } from '@/lib/prisma';

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
      'rrhh': ['rrhh', 'recursos humanos', 'hr', 'people', 'personas', 'talento'],
      'desarrollo': ['desarrollo', 'dev', 'ti', 'it', 'tech', 'tecnologia', 'sistemas', 'personas'],
      'ventas': ['ventas', 'sales', 'comercial', 'business'],
      'marketing': ['marketing', 'mercadeo', 'comunicaciones', 'publicidad'],
      'operaciones': ['operaciones', 'ops', 'operations', 'logistica'],
      'finanzas': ['finanzas', 'finance', 'contabilidad', 'accounting']
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
  
  // ✅ ENRIQUECER ANALYTICS CON DISPLAY NAMES (ENTERPRISE INTELLIGENT MATCHING)
  static async enrichAnalytics(
    analytics: any,
    accountId: string
  ): Promise<EnrichedAnalytics> {
    try {
      // Preservar analytics originales EXACTOS
      const enriched = { ...analytics };

      // Obtener departments configurados
      const departments = await DepartmentService.getDepartmentsByAccount(accountId);
      
      if (departments.length === 0) {
        console.log('📊 No departments configured - returning original analytics');
        return enriched;
      }

      // ✅ CREAR MATCHER INTELIGENTE ENTERPRISE
      const smartMatcher = this.createSmartMatcher(departments);
      
      // Crear mapping standard category → display name (para exports)
      const standardToDisplay: { [key: string]: string } = {};
      departments.forEach(dept => {
        if (dept.standardCategory) {
          standardToDisplay[dept.standardCategory] = dept.displayName;
        }
      });

      // ✅ ENRIQUECER departmentScores CON MATCHING INTELIGENTE ENTERPRISE (FIX APLICADO)
      console.log('🔍 DEBUGGING: analytics object keys:', Object.keys(analytics));
      console.log('🔍 DEBUGGING: analytics.departmentScores value:', analytics.departmentScores);
      console.log('🔍 DEBUGGING: typeof departmentScores:', typeof analytics.departmentScores);
      
      if (analytics.departmentScores) {
        // ✅ FIX CRÍTICO: AGREGACIÓN PONDERADA CORRECTA
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
          
          // ✅ AGREGACIÓN PONDERADA: Acumular scores en lugar de sobrescribir
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

        // ✅ CALCULAR PROMEDIOS PONDERADOS FINALES
        const displayScores: { [displayName: string]: number } = {};
        Object.entries(scoreAccumulator).forEach(([displayName, accumulator]) => {
          const averageScore = accumulator.totalScore / accumulator.count;
          displayScores[displayName] = Math.round(averageScore * 10) / 10; // Redondear a 1 decimal
          
          // 📊 LOG AGREGACIÓN PARA DEBUGGING
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

      // ✅ AGREGAR ESTADÍSTICAS DEPARTMENTS
      enriched.departmentStats = {
        totalDepartments: departments.length,
        configuredDepartments: departments.filter(d => d.participantCount > 0).length,
        averageParticipation: departments.length > 0 ? 
          departments.reduce((sum, d) => sum + d.participantCount, 0) / departments.length : 0,
      };

      console.log('✅ FocalizaHR Enterprise: Analytics enriched with intelligent matching:', {
        departmentsFound: departments.length,
        displayScoresGenerated: Object.keys(enriched.departmentScoresDisplay || {}).length,
        matchingEngine: 'Intelligent Fuzzy Matching v1.0 + Weighted Aggregation'
      });

      return enriched;
    } catch (error) {
      console.error('❌ Error enriching analytics with departments:', error);
      // En caso de error, retornar analytics originales sin modificar
      return analytics;
    }
  }

  // ✅ OBTENER DEPARTMENT MAPPING (FUNCIÓN FALTANTE PARA EXPORTS)
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
      return {}; // Retornar objeto vacío en caso de error
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

      // Crear map de department names únicos
      const uniqueDepartments = [...new Set(participantDepartments.filter(Boolean))];

      for (const deptName of uniqueDepartments) {
        // Buscar department existente
        const existingDept = departments.find(d => 
          d.displayName.toLowerCase() === deptName.toLowerCase()
        );

        if (existingDept) {
          departmentMap[deptName] = existingDept.id;
        } else {
          // Department no existe, marcar como null (se puede crear después)
          departmentMap[deptName] = null;
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
      const existingNames = existingDepartments.map(d => d.displayName.toLowerCase());

      // Filtrar departments nuevos
      const newDepartments = uniqueDepartments.filter(
        dept => !existingNames.includes(dept.toLowerCase())
      );

      if (newDepartments.length === 0) {
        console.log('📊 All departments already exist');
        return;
      }

      // Crear departments nuevos
      await DepartmentService.createBulkDepartments(accountId, newDepartments);
      console.log(`✅ Auto-created ${newDepartments.length} departments:`, newDepartments);
    } catch (error) {
      console.error('❌ Error auto-creating departments:', error);
      // No throw - es una función de conveniencia que no debe romper el flujo
    }
  }
}