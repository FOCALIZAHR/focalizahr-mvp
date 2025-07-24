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
  
  // ✅ ENRIQUECER ANALYTICS CON DISPLAY NAMES
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

      // Crear mapping standard category → display name
      const standardToDisplay: { [key: string]: string } = {};
      const displayToStandard: { [key: string]: string } = {};
      
      departments.forEach(dept => {
        if (dept.standardCategory) {
          standardToDisplay[dept.standardCategory] = dept.displayName;
          displayToStandard[dept.displayName] = dept.standardCategory;
        }
      });

      // ✅ ENRIQUECER department_scores CON DISPLAY NAMES
      if (analytics.department_scores) {
        const displayScores: { [displayName: string]: number } = {};
        
        Object.entries(analytics.department_scores).forEach(([key, score]) => {
          // Si key es standard category, usar display name
          const displayName = standardToDisplay[key];
          if (displayName) {
            displayScores[displayName] = score as number;
          } else {
            // Si key ya es display name o department string, mantener
            displayScores[key] = score as number;
          }
        });

        enriched.departmentScoresDisplay = displayScores;
        enriched.departmentMapping = standardToDisplay;
      }

      // ✅ AGREGAR ESTADÍSTICAS DEPARTMENTS
      enriched.departmentStats = {
        totalDepartments: departments.length,
        configuredDepartments: departments.filter(d => d.participantCount > 0).length,
        averageParticipation: departments.length > 0 ? 
          departments.reduce((sum, d) => sum + d.participantCount, 0) / departments.length : 0,
      };

      console.log('✅ Analytics enriched with department data:', {
        departmentsFound: departments.length,
        displayScoresGenerated: Object.keys(enriched.departmentScoresDisplay || {}).length,
      });

      return enriched;
    } catch (error) {
      console.error('❌ Error enriching analytics with departments:', error);
      // En caso de error, retornar analytics originales sin modificar
      return analytics;
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