// src/services/TemplateService.ts
import { prisma } from '@/lib/prisma';
import { VariableReplacementService } from './VariableReplacementService';

// ✅ INTERFACES PARA BD TEMPLATES
export interface DBTemplate {
  id: string;
  templateType: string;
  category: string | null;
  conditionRule: string;
  templateText: string;
  variablesRequired: any;
  priority: number;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface CommunicationTemplate {
  id: string;
  type: string;
  category: string;
  text: string;
  priority: number;
  variables?: { [key: string]: any };
}

export interface TemplateUsageData {
  templateId: string;
  campaignId: string;
  finalText: string;
  timestamp: Date;
  action: 'copied' | 'edited' | 'viewed';
}

export interface CampaignAnalytics {
  // ✅ MÉTRICAS BÁSICAS
  overallScore: number;
  participationRate: number;
  benchmarkDifference: number;
  
  // ✅ CATEGORÍAS ANALYSIS
  strongestCategory: { category: string; score: number; level: string };
  weakestCategory: { category: string; score: number; level: string };
  
  // ✅ DEPARTAMENTOS ANALYSIS (NUEVO)
  departmentScores: { [dept: string]: number };
  strongestDepartment: { name: string; score: number };
  weakestDepartment: { name: string; score: number };
  departmentVariability: number;
  
  // ✅ BENCHMARK ANALYSIS
  aboveBenchmarkCategories: Array<{ category: string; difference: number }>;
  belowBenchmarkCategories: Array<{ category: string; difference: number }>;
  
  // ✅ PARTICIPACIÓN ANALYSIS
  participationLevel: 'exceptional' | 'excellent' | 'good' | 'moderate' | 'low';
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // ✅ CAMPAIGN TYPE ANALYSIS
  campaignType?: string;
  industry?: string;
  
  // ✅ VARIABLES DINÁMICAS ADICIONALES
  totalResponses: number;
  totalInvited: number;
  companyName: string;
  industryBenchmark: number;
}

export class TemplateService {
  // 🗄️ CONSULTAR TEMPLATES ACTIVOS BD
  static async getActiveTemplates(): Promise<DBTemplate[]> {
    try {
      const templates = await prisma.communicationTemplate.findMany({
        where: { 
          isActive: true 
        },
        orderBy: { 
          priority: 'desc' 
        }
      });

      return templates.map(template => ({
        id: template.id,
        templateType: template.templateType,
        category: template.category,
        conditionRule: template.conditionRule,
        templateText: template.templateText,
        variablesRequired: template.variablesRequired,
        priority: template.priority,
        isActive: template.isActive,
        usageCount: template.usageCount,
        createdAt: template.createdAt
      }));
    } catch (error) {
      console.error('Error fetching templates from BD:', error);
      return [];
    }
  }

  // 🧠 SELECCIONAR TEMPLATES BASADO EN REGLAS BD
  static selectTemplatesByRules(
    templates: DBTemplate[], 
    analytics: CampaignAnalytics
  ): DBTemplate[] {
    return templates
      .filter(template => {
        try {
          return this.evaluateConditionRule(template.conditionRule, analytics);
        } catch (error) {
          console.error(`Error evaluating rule: ${template.conditionRule}`, error);
          return false;
        }
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6); // Top 6 templates por prioridad
  }

  // 🔄 PROCESAR VARIABLES EN TEMPLATES
  static processVariables(
    template: DBTemplate, 
    campaignResults: any,
    analytics: CampaignAnalytics
  ): CommunicationTemplate {
    // Construir contexto completo para replacement
    const context = {
      ...campaignResults,
      ...analytics,
      // ✅ VARIABLES DEPARTAMENTOS (NUEVO)
      strongest_dept: analytics.strongestDepartment?.name || '',
      strongest_dept_score: analytics.strongestDepartment?.score || 0,
      weakest_dept: analytics.weakestDepartment?.name || '',
      weakest_dept_score: analytics.weakestDepartment?.score || 0,
      dept_variability: analytics.departmentVariability || 0,
      // Variables calculadas dinámicamente
      benchmark_diff: analytics.benchmarkDifference,
      participation_level: analytics.participationLevel,
      confidence_level: analytics.confidenceLevel
    };

    const processedText = VariableReplacementService.replaceAll(
      template.templateText, 
      context
    );

    return {
      id: template.id,
      type: template.templateType,
      category: template.category || 'general',
      text: processedText,
      priority: template.priority,
      variables: template.variablesRequired
    };
  }

  // 📊 TRACKING USAGE TEMPLATES
  static async trackTemplateUsage(data: TemplateUsageData): Promise<void> {
    try {
      // Incrementar usage_count en template
      await prisma.communicationTemplate.update({
        where: { id: data.templateId },
        data: { 
          usageCount: { increment: 1 }
        }
      });

      // Crear audit log
      await prisma.auditLog.create({
        data: {
          action: 'template_used',
          entityType: 'communication_template',
          entityId: data.templateId,
          campaignId: data.campaignId,
          newValues: { 
            finalText: data.finalText,
            action: data.action,
            timestamp: data.timestamp.toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
      // No throw - tracking no debe interrumpir UX
    }
  }

  // ⚖️ EVALUAR CONDITION RULE DINÁMICAMENTE
  private static evaluateConditionRule(rule: string, data: any): boolean {
    try {
      // ✅ SANITIZACIÓN BÁSICA
      const sanitizedRule = rule
        .replace(/[^a-zA-Z0-9_\s\.\+\-\*\/\(\)>=<!=&|]/g, '') // Solo caracteres seguros
        .replace(/\band\b/gi, '&&')
        .replace(/\bor\b/gi, '||');

      // ✅ EVALUACIÓN SEGURA CON CONTEXT
      const evaluator = new Function('data', `
        "use strict";
        try {
          const {
            overallScore, participationRate, benchmarkDifference,
            strongestCategory, weakestCategory, 
            departmentScores, strongestDepartment, weakestDepartment, departmentVariability,
            participationLevel, confidenceLevel, campaignType, industry,
            totalResponses, totalInvited, companyName, industryBenchmark
          } = data;
          
          // ✅ MAPEO VARIABLES PARA BACKWARD COMPATIBILITY
          const overall_score = overallScore;
          const participation_rate = participationRate;
          const benchmark_difference = benchmarkDifference;
          const strongest_dept_score = strongestDepartment?.score || 0;
          const weakest_dept_score = weakestDepartment?.score || 0;
          const dept_variability = departmentVariability;
          const total_responses = totalResponses;
          const participation_level = participationLevel;
          const confidence_level = confidenceLevel;
          const campaign_type = campaignType;
          
          return ${sanitizedRule};
        } catch (e) {
          console.warn('Rule evaluation error:', e);
          return false;
        }
      `);

      return evaluator(data);
    } catch (error) {
      console.warn(`Failed to evaluate rule: ${rule}`, error);
      return false;
    }
  }

  // 🎯 SEEDER TEMPLATES BÁSICOS (PARA TESTING)
  static async seedBasicTemplates(): Promise<void> {
    const basicTemplates = [
      {
        templateType: 'fortaleza_general',
        category: 'general',
        conditionRule: 'overall_score >= 4.0',
        templateText: '💪 Fortaleza organizacional: {companyName} logra {overall_score}/5.0 puntos - Excelente desempeño general',
        variablesRequired: ['overall_score', 'companyName'],
        priority: 8
      },
      {
        templateType: 'oportunidad_general',
        category: 'general', 
        conditionRule: 'overall_score < 3.0',
        templateText: '🎯 Oportunidad de mejora: Score general {overall_score}/5.0 requiere plan de acción prioritario',
        variablesRequired: ['overall_score'],
        priority: 9
      },
      {
        templateType: 'participacion_alta',
        category: 'participacion',
        conditionRule: 'participation_rate >= 75',
        templateText: '📊 Excelente participación: {participation_rate}% de respuesta garantiza alta confiabilidad estadística',
        variablesRequired: ['participation_rate'],
        priority: 6
      },
      // ✅ TEMPLATES DEPARTAMENTOS (NUEVO)
      {
        templateType: 'departamento_campeón',
        category: 'departamentos',
        conditionRule: 'strongest_dept_score >= 4.0 && dept_variability > 0.5',
        templateText: '🏆 Departamento campeón: {strongest_dept} lidera con {strongest_dept_score}/5.0 - Modelo a replicar',
        variablesRequired: ['strongest_dept', 'strongest_dept_score'],
        priority: 7
      },
      {
        templateType: 'departamento_oportunidad',
        category: 'departamentos',
        conditionRule: 'weakest_dept_score < 3.5 && dept_variability > 0.8',
        templateText: '🎯 Oportunidad departamental: {weakest_dept} requiere atención ({weakest_dept_score}/5.0) - Priorizar intervención',
        variablesRequired: ['weakest_dept', 'weakest_dept_score'],
        priority: 8
      },
      {
        templateType: 'variabilidad_departamental',
        category: 'departamentos',
        conditionRule: 'dept_variability > 1.0',
        templateText: '📊 Variabilidad entre departamentos significativa ({dept_variability} puntos) - Oportunidad estandarización',
        variablesRequired: ['dept_variability'],
        priority: 6
      }
    ];

    try {
      for (const template of basicTemplates) {
        await prisma.communicationTemplate.upsert({
          where: {
            templateType: template.templateType
          },
          update: {
            ...template,
            variablesRequired: template.variablesRequired,
            isActive: true
          },
          create: {
            ...template,
            variablesRequired: template.variablesRequired,
            isActive: true
          }
        });
      }
      
      console.log('✅ Basic templates seeded successfully');
    } catch (error) {
      console.error('Error seeding templates:', error);
    }
  }

  // 📈 ANALYTICS TEMPLATES USAGE
  static async getTemplateAnalytics(campaignId?: string): Promise<any> {
    try {
      const whereClause = campaignId ? { campaignId } : {};
      
      const usageStats = await prisma.auditLog.groupBy({
        by: ['entityId'],
        where: {
          action: 'template_used',
          entityType: 'communication_template',
          ...whereClause
        },
        _count: {
          entityId: true
        },
        orderBy: {
          _count: {
            entityId: 'desc'
          }
        }
      });

      return usageStats.map(stat => ({
        templateId: stat.entityId,
        usageCount: stat._count.entityId
      }));
    } catch (error) {
      console.error('Error getting template analytics:', error);
      return [];
    }
  }
}