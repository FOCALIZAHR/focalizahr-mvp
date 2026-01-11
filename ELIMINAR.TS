/**
 * ============================================
 * NPSAggregationService - Sistema NPS Transversal
 * ============================================
 * 
 * @version 1.1
 * @date Enero 2026
 * @description Servicio centralizado para cálculo y persistencia de NPS
 *              de todos los productos FocalizaHR.
 * 
 * PATRÓN: DepartmentOnboardingInsight (Aggregation Pattern)
 * 
 * PRODUCTOS SOPORTADOS:
 * - onboarding: NPS del día 90 (Onboarding Journey Intelligence)
 * - exit: NPS de encuesta de salida (Exit Intelligence)
 * - pulso: eNPS de Pulso Express
 * - experiencia: eNPS de Experiencia Full
 * 
 * UBICACIÓN: src/lib/services/NPSAggregationService.ts
 * 
 * @changelog v1.1: Agregado aggregateExitNPS para Exit Intelligence
 * ============================================
 */

import { prisma } from '@/lib/prisma';
import { 
  NPSCalculation, 
  NPSProductType, 
  NPSPeriodType 
} from '@/types/nps';

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export class NPSAggregationService {
  
  // ============================================
  // CÁLCULO NPS (Core)
  // ============================================
  
  /**
   * Calcula NPS desde un array de ratings (0-10)
   * 
   * Clasificación estándar industria:
   * - Promotores: 9-10
   * - Pasivos: 7-8
   * - Detractores: 0-6
   * 
   * Fórmula: NPS = %Promotores - %Detractores
   * Rango: -100 a +100
   * 
   * @param ratings Array de valores 0-10
   * @returns NPSCalculation con todas las métricas
   */
  static calculateNPS(ratings: number[]): NPSCalculation {
    if (ratings.length === 0) {
      return {
        npsScore: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        totalResponses: 0,
        promotersPct: 0,
        passivesPct: 0,
        detractorsPct: 0
      };
    }
    
    // Clasificar respuestas
    const promoters = ratings.filter(r => r >= 9).length;
    const passives = ratings.filter(r => r >= 7 && r <= 8).length;
    const detractors = ratings.filter(r => r <= 6).length;
    const total = ratings.length;
    
    // Calcular porcentajes
    const promotersPct = (promoters / total) * 100;
    const passivesPct = (passives / total) * 100;
    const detractorsPct = (detractors / total) * 100;
    
    // Calcular NPS (-100 a +100)
    const npsScore = Math.round(promotersPct - detractorsPct);
    
    return {
      npsScore,
      promoters,
      passives,
      detractors,
      totalResponses: total,
      promotersPct: Math.round(promotersPct * 10) / 10,
      passivesPct: Math.round(passivesPct * 10) / 10,
      detractorsPct: Math.round(detractorsPct * 10) / 10
    };
  }
  
  // ============================================
  // TREND (vs período anterior)
  // ============================================
  
  /**
   * Obtiene el score del período anterior para calcular trend
   * 
   * @param accountId ID de la cuenta
   * @param departmentId ID del departamento (null = empresa completa)
   * @param productType Tipo de producto
   * @param currentPeriod Período actual (ej: "2025-12")
   * @returns Score anterior o null si no existe
   */
  static async getPreviousScore(
    accountId: string,
    departmentId: string | null,
    productType: NPSProductType,
    currentPeriod: string
  ): Promise<number | null> {
    // Calcular período anterior
    const [year, month] = currentPeriod.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // -1 por 0-index, -1 por anterior
    const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    const previous = await prisma.nPSInsight.findFirst({
      where: {
        accountId,
        departmentId: departmentId || null,
        productType,
        period: prevPeriod,
        periodType: 'monthly'
      },
      select: { npsScore: true }
    });
    
    return previous?.npsScore ?? null;
  }
  
  // ============================================
  // PERSISTENCIA (UPSERT)
  // ============================================
  
  /**
   * Guarda insight de NPS para un departamento/producto/período
   * 
   * Usa UPSERT para actualizar si ya existe o crear si no.
   * Calcula automáticamente el trend vs período anterior.
   * 
   * @param accountId ID de la cuenta
   * @param departmentId ID del departamento (null = empresa completa)
   * @param productType Tipo de producto
   * @param period Período (ej: "2025-12")
   * @param periodStart Inicio del período
   * @param periodEnd Fin del período
   * @param calculation Métricas NPS calculadas
   */
  static async upsertNPSInsight(
    accountId: string,
    departmentId: string | null,
    productType: NPSProductType,
    period: string,
    periodStart: Date,
    periodEnd: Date,
    calculation: NPSCalculation
  ): Promise<void> {
    // Obtener score anterior para trend
    const previousScore = await this.getPreviousScore(
      accountId, 
      departmentId, 
      productType, 
      period
    );
    
    const scoreDelta = previousScore !== null 
      ? calculation.npsScore - previousScore 
      : null;
    
    // Data común para create/update
    const data = {
      periodStart,
      periodEnd,
      npsScore: calculation.npsScore,
      promoters: calculation.promoters,
      passives: calculation.passives,
      detractors: calculation.detractors,
      totalResponses: calculation.totalResponses,
      promotersPct: calculation.promotersPct,
      passivesPct: calculation.passivesPct,
      detractorsPct: calculation.detractorsPct,
      previousScore,
      scoreDelta,
      calculatedAt: new Date()
    };
    
    // Buscar registro existente (maneja null en departmentId correctamente)
    const existing = await prisma.nPSInsight.findFirst({
      where: {
        accountId,
        departmentId: departmentId, // null es válido aquí
        productType,
        period,
        periodType: 'monthly'
      }
    });
    
    if (existing) {
      // Actualizar registro existente
      await prisma.nPSInsight.update({
        where: { id: existing.id },
        data
      });
    } else {
      // Crear nuevo registro
      await prisma.nPSInsight.create({
        data: {
          accountId,
          departmentId,
          productType,
          period,
          periodType: 'monthly',
          ...data
        }
      });
    }
    
    console.log(
      `[NPSAggregation] Upserted: ${productType} | ` +
      `${departmentId ? `Dept: ${departmentId}` : 'Global'} | ` +
      `Period: ${period} | NPS: ${calculation.npsScore} ` +
      `(${scoreDelta !== null ? (scoreDelta >= 0 ? '+' : '') + scoreDelta : 'new'})`
    );
  }
  
  // ============================================
  // AGREGACIÓN POR PRODUCTO (Genérico)
  // ============================================
  
  /**
   * Agrega NPS para un producto completo (empresa + gerencias + departamentos)
   * 
   * Este método es llamado desde el CRON de cada producto.
   * Busca todas las respuestas NPS del período y las agrupa.
   * 
   * @param accountId ID de la cuenta
   * @param productType Tipo de producto
   * @param campaignTypeSlug Slug del tipo de campaña
   * @param period Período (ej: "2025-12")
   * @param periodStart Inicio del período
   * @param periodEnd Fin del período
   */
  static async aggregateForProduct(
    accountId: string,
    productType: NPSProductType,
    campaignTypeSlug: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    console.log(`[NPSAggregation] Iniciando para ${productType}, período ${period}`);
    
    // 1. Obtener todas las respuestas NPS del período
    const npsResponses = await prisma.response.findMany({
      where: {
        question: {
          responseType: 'nps_scale',
          campaignType: { slug: campaignTypeSlug }
        },
        participant: {
          campaign: { accountId },
          hasResponded: true
        },
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        rating: { not: null }
      },
      select: {
        rating: true,
        participantId: true
      }
    });
    
    if (npsResponses.length === 0) {
      console.log(`[NPSAggregation] Sin respuestas NPS para ${productType}`);
      return;
    }
    
    // 2. Calcular NPS global (empresa)
    const allRatings = npsResponses.map(r => r.rating!);
    const globalCalc = this.calculateNPS(allRatings);
    
    await this.upsertNPSInsight(
      accountId,
      null, // departmentId = null = empresa completa
      productType,
      period,
      periodStart,
      periodEnd,
      globalCalc
    );
    
    console.log(
      `[NPSAggregation] ${productType} global: ` +
      `NPS ${globalCalc.npsScore} (${globalCalc.totalResponses} respuestas)`
    );
    
    console.log(`[NPSAggregation] ✅ Completado para ${productType}`);
  }
  
  // ============================================
  // AGREGACIÓN ONBOARDING (Específico)
  // ============================================
  
  /**
   * Agrega NPS de Onboarding usando JourneyOrchestration
   * 
   * Especializado para Onboarding porque el departmentId viene
   * de JourneyOrchestration, no de Participant directo.
   * 
   * @param accountId ID de la cuenta
   * @param period Período (ej: "2025-12")
   * @param periodStart Inicio del período
   * @param periodEnd Fin del período
   */
  static async aggregateOnboardingNPS(
    accountId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    console.log(`[NPSAggregation] Iniciando Onboarding NPS para período ${period}`);
    
    // 1. Buscar pregunta NPS del día 90
    const npsQuestion = await prisma.question.findFirst({
      where: {
        campaignType: { slug: 'onboarding-day-90' },
        responseType: 'nps_scale'
      }
    });
    
    if (!npsQuestion) {
      console.log('[NPSAggregation] ⚠️ No se encontró pregunta NPS en onboarding-day-90');
      return;
    }
    
    // 2. Obtener respuestas NPS del período
    const npsResponses = await prisma.response.findMany({
      where: {
        questionId: npsQuestion.id,
        createdAt: { gte: periodStart, lte: periodEnd },
        rating: { not: null },
        participant: {
          campaign: { accountId }
        }
      },
      select: {
        rating: true,
        participantId: true
      }
    });
    
    if (npsResponses.length === 0) {
      console.log('[NPSAggregation] Sin respuestas NPS de Onboarding en el período');
      return;
    }
    
    // 3. Obtener departamento de cada respuesta via JourneyOrchestration
    const ratingsByDepartment = new Map<string, number[]>();
    const ratingsByGerencia = new Map<string, number[]>();
    
    for (const response of npsResponses) {
      // Buscar Journey asociado al participante
      const journey = await prisma.journeyOrchestration.findFirst({
        where: {
          OR: [
            { stage1ParticipantId: response.participantId },
            { stage2ParticipantId: response.participantId },
            { stage3ParticipantId: response.participantId },
            { stage4ParticipantId: response.participantId }
          ]
        },
        include: {
          department: {
            include: { parent: true }
          }
        }
      });
      
      if (journey && response.rating !== null) {
        const departmentId = journey.departmentId;
        const gerenciaId = journey.department.parentId || journey.departmentId;
        
        // Agrupar por departamento
        if (!ratingsByDepartment.has(departmentId)) {
          ratingsByDepartment.set(departmentId, []);
        }
        ratingsByDepartment.get(departmentId)!.push(response.rating);
        
        // Agrupar por gerencia
        if (!ratingsByGerencia.has(gerenciaId)) {
          ratingsByGerencia.set(gerenciaId, []);
        }
        ratingsByGerencia.get(gerenciaId)!.push(response.rating);
      }
    }
    
    // 4. Guardar NPS por gerencia (nivel 2)
    for (const [gerenciaId, ratings] of ratingsByGerencia) {
      const calc = this.calculateNPS(ratings);
      await this.upsertNPSInsight(
        accountId,
        gerenciaId,
        'onboarding',
        period,
        periodStart,
        periodEnd,
        calc
      );
    }
    
    // 4.5 Guardar NPS por departamento (nivel 3+)
    for (const [departmentId, ratings] of ratingsByDepartment) {
      // Evitar duplicar si el departamento YA es una gerencia (level 2)
      if (!ratingsByGerencia.has(departmentId)) {
        const calc = this.calculateNPS(ratings);
        await this.upsertNPSInsight(
          accountId,
          departmentId,
          'onboarding',
          period,
          periodStart,
          periodEnd,
          calc
        );
      }
    }
  
    
    // 5. Guardar NPS global
    const allRatings = npsResponses.map(r => r.rating!);
    const globalCalc = this.calculateNPS(allRatings);
    
    await this.upsertNPSInsight(
      accountId,
      null,
      'onboarding',
      period,
      periodStart,
      periodEnd,
      globalCalc
    );
    
    console.log(
      `[NPSAggregation] ✅ Onboarding completado: ` +
      `${ratingsByGerencia.size} gerencias, ` +
      `NPS global: ${globalCalc.npsScore}`
    );
  }
  
  // ============================================
  // AGREGACIÓN EXIT (Específico)
  // ============================================
  
  /**
   * Agrega NPS de Exit Intelligence usando ExitRecord
   * 
   * Especializado para Exit porque el departmentId viene
   * directamente de ExitRecord, y las respuestas se vinculan
   * via ExitRecord.participantId → Response.
   * 
   * @param accountId ID de la cuenta
   * @param period Período (ej: "2025-12")
   * @param periodStart Inicio del período
   * @param periodEnd Fin del período
   */
  static async aggregateExitNPS(
    accountId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    console.log(`[NPSAggregation] Iniciando Exit NPS para período ${period}`);
    
    // 1. Buscar pregunta NPS de Exit (retencion-predictiva, question_order 8)
    const npsQuestion = await prisma.question.findFirst({
      where: {
        campaignType: { slug: 'retencion-predictiva' },
        responseType: 'nps_scale'
      }
    });
    
    if (!npsQuestion) {
      console.log('[NPSAggregation] ⚠️ No se encontró pregunta NPS en retencion-predictiva');
      return;
    }
    
    // 2. Obtener ExitRecords del período con sus respuestas NPS
    const exitRecords = await prisma.exitRecord.findMany({
      where: {
        accountId,
        exitDate: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: {
        id: true,
        departmentId: true,
        participantId: true,
        department: {
          select: {
            id: true,
            parentId: true,
            level: true
          }
        }
      }
    });
    
    if (exitRecords.length === 0) {
      console.log('[NPSAggregation] Sin ExitRecords en el período');
      return;
    }
    
    // 3. Obtener respuestas NPS para estos participantes
    const participantIds = exitRecords.map(er => er.participantId);
    
    const npsResponses = await prisma.response.findMany({
      where: {
        questionId: npsQuestion.id,
        participantId: { in: participantIds },
        rating: { not: null }
      },
      select: {
        rating: true,
        participantId: true
      }
    });
    
    if (npsResponses.length === 0) {
      console.log('[NPSAggregation] Sin respuestas NPS de Exit en el período');
      return;
    }
    
    // 4. Crear mapa participantId → rating para lookup rápido
    const ratingByParticipant = new Map<string, number>();
    for (const response of npsResponses) {
      if (response.rating !== null) {
        ratingByParticipant.set(response.participantId, response.rating);
      }
    }
    
    // 5. Agrupar ratings por departamento y gerencia
    const ratingsByDepartment = new Map<string, number[]>();
    const ratingsByGerencia = new Map<string, number[]>();
    
    for (const exitRecord of exitRecords) {
      const rating = ratingByParticipant.get(exitRecord.participantId);
      
      if (rating !== undefined && exitRecord.department) {
        const departmentId = exitRecord.departmentId;
        const gerenciaId = exitRecord.department.parentId || exitRecord.departmentId;
        
        // Agrupar por departamento
        if (!ratingsByDepartment.has(departmentId)) {
          ratingsByDepartment.set(departmentId, []);
        }
        ratingsByDepartment.get(departmentId)!.push(rating);
        
        // Agrupar por gerencia
        if (!ratingsByGerencia.has(gerenciaId)) {
          ratingsByGerencia.set(gerenciaId, []);
        }
        ratingsByGerencia.get(gerenciaId)!.push(rating);
      }
    }
    
    // 6. Guardar NPS por gerencia (nivel 2)
    for (const [gerenciaId, ratings] of ratingsByGerencia) {
      const calc = this.calculateNPS(ratings);
      await this.upsertNPSInsight(
        accountId,
        gerenciaId,
        'exit',
        period,
        periodStart,
        periodEnd,
        calc
      );
    }
    
    // 7. Guardar NPS por departamento (nivel 3+)
    for (const [departmentId, ratings] of ratingsByDepartment) {
      // Evitar duplicar si el departamento YA es una gerencia
      if (!ratingsByGerencia.has(departmentId)) {
        const calc = this.calculateNPS(ratings);
        await this.upsertNPSInsight(
          accountId,
          departmentId,
          'exit',
          period,
          periodStart,
          periodEnd,
          calc
        );
      }
    }
    
    // 8. Guardar NPS global (empresa)
    const allRatings = Array.from(ratingByParticipant.values());
    const globalCalc = this.calculateNPS(allRatings);
    
    await this.upsertNPSInsight(
      accountId,
      null,
      'exit',
      period,
      periodStart,
      periodEnd,
      globalCalc
    );
    
    console.log(
      `[NPSAggregation] ✅ Exit completado: ` +
      `${ratingsByGerencia.size} gerencias, ` +
      `${ratingsByDepartment.size} departamentos, ` +
      `NPS global: ${globalCalc.npsScore} (${allRatings.length} respuestas)`
    );
  }
  
  // ============================================
  // QUERIES DE CONSULTA
  // ============================================
  
  /**
   * Obtiene ranking de NPS por gerencia para un producto
   */
  static async getRankingByGerencia(
    accountId: string,
    productType: NPSProductType,
    period: string
  ) {
    return prisma.nPSInsight.findMany({
      where: {
        accountId,
        productType,
        period,
        periodType: 'monthly',
        department: { level: 2 } // Solo gerencias
      },
      include: {
        department: { select: { displayName: true } }
      },
      orderBy: { npsScore: 'desc' }
    });
  }
  
  /**
   * Obtiene NPS comparativo cross-producto (Journey NPS)
   */
  static async getJourneyNPS(
    accountId: string,
    period: string
  ) {
    return prisma.nPSInsight.findMany({
      where: {
        accountId,
        departmentId: null, // Empresa completa
        period,
        productType: { in: ['onboarding', 'pulso', 'exit'] }
      }
    });
  }
  
  /**
   * Obtiene trend temporal de NPS (últimos N meses)
   */
  static async getTrend(
    accountId: string,
    productType: NPSProductType,
    departmentId: string | null,
    months: number = 12
  ) {
    // Generar array de períodos
    const periods: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    
    return prisma.nPSInsight.findMany({
      where: {
        accountId,
        departmentId,
        productType,
        periodType: 'monthly',
        period: { in: periods }
      },
      orderBy: { period: 'asc' }
    });
  }
}