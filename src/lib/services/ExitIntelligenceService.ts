/**
 * EXIT INTELLIGENCE SERVICE
 * 
 * PROPÓSITO:
 * - Calcular EIS (Exit Intelligence Score) desde Response.normalizedScore
 * - Extraer P2+P3 (causas raíz) sin duplicar datos
 * - Detectar alertas Ley Karin (P6 < 2.5)
 * - Detectar alertas Exit Tóxico (EIS < 25)
 * - Post-proceso automático al completar encuesta exit-survey
 * 
 * PRINCIPIO ARQUITECTÓNICO:
 * Las respuestas YA se guardan en Response con normalizedScore calculado.
 * Este servicio LEE desde Response, NO duplica datos.
 * 
 * FÓRMULA EIS (validada en /types/exit.ts):
 * EIS = P1(20%) + P4(25%) + P5(20%) + P6(25%) + P7(10%)
 * 
 * @version 1.1
 * @date December 2025
 * @author FocalizaHR Team
 * 
 * CHANGELOG v1.1:
 * - Agregado checkAndCreateToxicExitAlert() para EIS < 25
 * - Agregado TOXIC_EIS_THRESHOLD constante
 * - Modificado processCompletedSurvey() para crear alerta toxic_exit
 */

import { prisma } from '@/lib/prisma';
import { 
  ExitScores, 
  EISCalculationResult,
  ExitFactorsResult,
  EIS_CLASSIFICATIONS,
  EIS_WEIGHTS,
  EIS_THRESHOLDS,
  getEISClassification
} from '@/types/exit';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES LOCALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapeo de questionOrder a dimensión EIS
 * Basado en la estructura de la encuesta exit-survey
 */
const QUESTION_ORDER_MAP = {
  SATISFACTION: 1,    // P1: Satisfacción general
  FACTORS_SELECT: 2,  // P2: Factores seleccionados (multi-select)
  FACTORS_RATING: 3,  // P3: Rating por factor (matrix)
  LEADERSHIP: 4,      // P4: Liderazgo
  DEVELOPMENT: 5,     // P5: Desarrollo
  SAFETY: 6,          // P6: Ambiente seguro (Ley Karin)
  AUTONOMY: 7,        // P7: Autonomía
  NPS: 8              // P8: eNPS (0-10)
} as const;

/**
 * Threshold para alerta Ley Karin
 * Si P6 (safety) < 2.5 en escala 1-5, se genera alerta crítica
 */
const LEY_KARIN_THRESHOLD = 2.5;

/**
 * Threshold para alerta Exit Tóxico
 * Si EIS < 25, se genera alerta high severity
 * @since v1.1
 */
const TOXIC_EIS_THRESHOLD = 25;

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export class ExitIntelligenceService {
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * MÉTODO PRINCIPAL: Calcular EIS completo para un participante
   * ════════════════════════════════════════════════════════════════════════
   * 
   * @param participantId - ID del participante que completó la encuesta
   * @returns Objeto con score EIS, clasificación, y métricas relacionadas
   */
  static async calculateEIS(participantId: string): Promise<EISCalculationResult> {
    try {
      console.log('[ExitIntelligence] Calculating EIS for participant:', participantId);
      
      // 1. Obtener scores desde Response.normalizedScore
      const scores = await this.getExitScores(participantId);
      
      console.log('[ExitIntelligence] Raw scores:', {
        satisfaction: scores.satisfaction,
        leadership: scores.leadership,
        development: scores.development,
        safety: scores.safety,
        autonomy: scores.autonomy,
        nps: scores.nps
      });
      
      // 2. Extraer factores P2+P3
      const factors = await this.extractExitFactors(participantId);
      
      // 3. Validar que tenemos suficientes datos para calcular
      const requiredScores = [
        scores.satisfaction,
        scores.leadership,
        scores.development,
        scores.safety,
        scores.autonomy
      ];
      
      const validScores = requiredScores.filter(s => s !== null && s !== undefined);
      
      // Necesitamos al menos 3 de 5 dimensiones para un cálculo válido
      if (validScores.length < 3) {
        console.warn('[ExitIntelligence] Insufficient scores for EIS calculation:', {
          validCount: validScores.length,
          required: 3
        });
        
        return {
          score: null,
          classification: null,
          factorsAvg: factors.exitFactorsAvg,
          safetyScore: scores.safety,
          npsScore: scores.nps,
          breakdown: this.createEmptyBreakdown(scores)
        };
      }
      
      // 4. Calcular EIS con pesos oficiales de /types/exit.ts
      // Normalizar scores 1-5 a 0-100 antes de aplicar pesos
      const normSatisfaction = this.normalizeToHundred(scores.satisfaction);
      const normLeadership = this.normalizeToHundred(scores.leadership);
      const normDevelopment = this.normalizeToHundred(scores.development);
      const normSafety = this.normalizeToHundred(scores.safety);
      const normAutonomy = this.normalizeToHundred(scores.autonomy);
      
      // Calcular weighted score
      const weightedSatisfaction = (normSatisfaction ?? 0) * EIS_WEIGHTS.SATISFACTION;
      const weightedLeadership = (normLeadership ?? 0) * EIS_WEIGHTS.LEADERSHIP;
      const weightedDevelopment = (normDevelopment ?? 0) * EIS_WEIGHTS.DEVELOPMENT;
      const weightedSafety = (normSafety ?? 0) * EIS_WEIGHTS.SAFETY;
      const weightedAutonomy = (normAutonomy ?? 0) * EIS_WEIGHTS.AUTONOMY;
      
      const eis = weightedSatisfaction + weightedLeadership + weightedDevelopment + 
                  weightedSafety + weightedAutonomy;
      
      // 5. Clasificar según umbrales
      const classification = getEISClassification(eis);
      
      console.log('[ExitIntelligence] EIS calculated:', {
        eis: Math.round(eis * 10) / 10,
        classification,
        breakdown: {
          satisfaction: weightedSatisfaction,
          leadership: weightedLeadership,
          development: weightedDevelopment,
          safety: weightedSafety,
          autonomy: weightedAutonomy
        }
      });
      
      return {
        score: Math.round(eis * 10) / 10, // 1 decimal
        classification,
        factorsAvg: factors.exitFactorsAvg,
        safetyScore: scores.safety,
        npsScore: scores.nps,
        breakdown: {
          satisfaction: { raw: scores.satisfaction, weighted: weightedSatisfaction },
          leadership: { raw: scores.leadership, weighted: weightedLeadership },
          development: { raw: scores.development, weighted: weightedDevelopment },
          safety: { raw: scores.safety, weighted: weightedSafety },
          autonomy: { raw: scores.autonomy, weighted: weightedAutonomy }
        }
      };
      
    } catch (error) {
      console.error('[ExitIntelligence] Error calculating EIS:', error);
      return {
        score: null,
        classification: null,
        factorsAvg: null,
        safetyScore: null,
        npsScore: null,
        breakdown: this.createEmptyBreakdown({
          satisfaction: null,
          leadership: null,
          development: null,
          safety: null,
          autonomy: null,
          factorsDetail: null,
          nps: null
        })
      };
    }
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Obtener scores desde Response.normalizedScore
   * ════════════════════════════════════════════════════════════════════════
   * 
   * LEE directamente desde la tabla Response, aprovechando que
   * normalizedScore ya fue calculado al momento del submit.
   */
  static async getExitScores(participantId: string): Promise<ExitScores> {
    const responses = await prisma.response.findMany({
      where: { participantId },
      include: {
        question: {
          select: {
            questionOrder: true,
            responseType: true,
            category: true
          }
        }
      }
    });
    
    // Mapear por orden de pregunta para acceso O(1)
    const byOrder = new Map(
      responses.map(r => [r.question.questionOrder, r])
    );
    
    // Extraer scores usando normalizedScore (ya calculado)
    // Para rating_scale (1-5), normalizedScore ya está en escala 1-5
    const satisfaction = byOrder.get(QUESTION_ORDER_MAP.SATISFACTION)?.normalizedScore ?? null;
    const leadership = byOrder.get(QUESTION_ORDER_MAP.LEADERSHIP)?.normalizedScore ?? null;
    const development = byOrder.get(QUESTION_ORDER_MAP.DEVELOPMENT)?.normalizedScore ?? null;
    const safety = byOrder.get(QUESTION_ORDER_MAP.SAFETY)?.normalizedScore ?? null;
    const autonomy = byOrder.get(QUESTION_ORDER_MAP.AUTONOMY)?.normalizedScore ?? null;
    
    // NPS usa rating directo (escala 0-10)
    const nps = byOrder.get(QUESTION_ORDER_MAP.NPS)?.rating ?? null;
    
    // P3: Factores detail (matrix de ratings)
    // Normalizar undefined → null para compatibilidad de tipos
    const factorsDetail = this.parseFactorsDetail(
      byOrder.get(QUESTION_ORDER_MAP.FACTORS_RATING)?.choiceResponse ?? null
    );
    
    return {
      satisfaction,
      factorsDetail,
      leadership,
      development,
      safety,
      autonomy,
      nps
    };
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Extraer P2+P3 (Causas Raíz)
   * ════════════════════════════════════════════════════════════════════════
   * 
   * P2: Multi-select de factores (array de strings)
   * P3: Matrix de ratings por factor seleccionado (object {factor: score})
   */
  static async extractExitFactors(participantId: string): Promise<ExitFactorsResult> {
    const responses = await prisma.response.findMany({
      where: { participantId },
      include: {
        question: {
          select: { questionOrder: true }
        }
      }
    });
    
    const byOrder = new Map(
      responses.map(r => [r.question.questionOrder, r])
    );
    
    // P2: Factores seleccionados (array)
    // Normalizar undefined → null para compatibilidad de tipos
    const p2Response = byOrder.get(QUESTION_ORDER_MAP.FACTORS_SELECT);
    const exitFactors = this.parseP2Response(p2Response?.choiceResponse ?? null);
    
    // P3: Ratings por factor (matrix)
    // Normalizar undefined → null para compatibilidad de tipos
    const p3Response = byOrder.get(QUESTION_ORDER_MAP.FACTORS_RATING);
    const exitFactorsDetail = this.parseFactorsDetail(p3Response?.choiceResponse ?? null) || {};
    
    // Calcular promedio de severidad
    const ratings = Object.values(exitFactorsDetail);
    const exitFactorsAvg = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    
    console.log('[ExitIntelligence] Extracted factors:', {
      factorsCount: exitFactors.length,
      detailKeys: Object.keys(exitFactorsDetail),
      avgSeverity: exitFactorsAvg
    });
    
    return {
      exitFactors,
      exitFactorsDetail,
      exitFactorsAvg
    };
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Verificar y crear alerta Ley Karin
   * ════════════════════════════════════════════════════════════════════════
   * 
   * Condición: P6 (safety) < 2.5 en escala 1-5
   * Acción: Crear ExitAlert tipo 'ley_karin' con severidad 'critical'
   * SLA: 24 horas (requiere investigación inmediata)
   */
  static async checkAndCreateLeyKarinAlert(
    exitRecord: {
      id: string;
      accountId: string;
      departmentId: string;
    },
    safetyScore: number | null
  ): Promise<boolean> {
    // No crear alerta si no hay score o está por encima del threshold
    if (safetyScore === null || safetyScore >= LEY_KARIN_THRESHOLD) {
      console.log('[ExitIntelligence] No Ley Karin alert needed:', {
        safetyScore,
        threshold: LEY_KARIN_THRESHOLD
      });
      return false;
    }
    
    // Verificar si ya existe alerta Ley Karin para este ExitRecord
    const existingAlert = await prisma.exitAlert.findFirst({
      where: {
        exitRecordId: exitRecord.id,
        alertType: 'ley_karin',
        status: { in: ['pending', 'acknowledged'] }
      }
    });
    
    if (existingAlert) {
      console.log('[ExitIntelligence] Ley Karin alert already exists:', existingAlert.id);
      return false;
    }
    
    // Obtener nombre departamento para el título
    const department = await prisma.department.findUnique({
      where: { id: exitRecord.departmentId },
      select: { displayName: true }
    });
    
    // Calcular fecha límite SLA (24 horas)
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24);
    
    // Crear alerta
    const alert = await prisma.exitAlert.create({
      data: {
        exitRecordId: exitRecord.id,
        accountId: exitRecord.accountId,
        departmentId: exitRecord.departmentId,
        alertType: 'ley_karin',
        severity: 'critical',
        title: `⚠️ Alerta Ley Karin en ${department?.displayName || 'Departamento'}`,
        description: `Se ha detectado una respuesta crítica en la dimensión de ambiente seguro y respetuoso (${safetyScore?.toFixed(1)}/5.0). Requiere investigación inmediata del clima laboral del departamento según normativa Ley Karin.`,
        triggerScore: safetyScore,
        slaHours: 24,
        dueDate,
        slaStatus: 'on_track',
        status: 'pending'
      }
    });
    
    console.log('[ExitIntelligence] Ley Karin alert created:', {
      alertId: alert.id,
      departmentId: exitRecord.departmentId,
      safetyScore,
      dueDate: dueDate.toISOString()
    });
    
    return true;
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Verificar y crear alerta Exit Tóxico
   * ════════════════════════════════════════════════════════════════════════
   * 
   * Condición: EIS < 25 (salida tóxica)
   * Acción: Crear ExitAlert tipo 'toxic_exit_detected' con severidad 'high'
   * SLA: 48 horas
   * 
   * @since v1.1
   */
  static async checkAndCreateToxicExitAlert(
    exitRecord: {
      id: string;
      accountId: string;
      departmentId: string;
    },
    eis: number
  ): Promise<boolean> {
    // Verificar si ya existe alerta para este ExitRecord
    const existingAlert = await prisma.exitAlert.findFirst({
      where: {
        exitRecordId: exitRecord.id,
        alertType: 'toxic_exit_detected'
      }
    });
    
    if (existingAlert) {
      console.log('[ExitIntelligence] Toxic Exit alert already exists:', existingAlert.id);
      return false;
    }
    
    // Obtener nombre departamento para el título
    const department = await prisma.department.findUnique({
      where: { id: exitRecord.departmentId },
      select: { displayName: true }
    });
    
    // Calcular fecha límite SLA (48 horas)
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 48);
    
    // Crear alerta
    const alert = await prisma.exitAlert.create({
      data: {
        exitRecordId: exitRecord.id,
        accountId: exitRecord.accountId,
        departmentId: exitRecord.departmentId,
        alertType: 'toxic_exit_detected',
        severity: 'high',
        title: `☠️ Exit Tóxico Detectado en ${department?.displayName || 'Departamento'}`,
        description: `Se detectó una salida con EIS extremadamente bajo (${eis.toFixed(1)}/100 - Clasificación TÓXICA). Esto indica una experiencia laboral muy negativa con alto riesgo de contagio al equipo actual.`,
        triggerScore: eis,
        slaHours: 48,
        dueDate,
        slaStatus: 'on_track',
        status: 'pending'
      }
    });
    
    console.log('[ExitIntelligence] Toxic Exit alert created:', {
      alertId: alert.id,
      departmentId: exitRecord.departmentId,
      eis,
      dueDate: dueDate.toISOString()
    });
    
    return true;
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * MÉTODO CRÍTICO: Procesar encuesta completada (post-proceso)
   * ════════════════════════════════════════════════════════════════════════
   * 
   * Este método se llama desde /api/survey/[token]/submit después de guardar
   * las respuestas cuando se detecta que es una encuesta exit-survey.
   * 
   * Flujo:
   * 1. Buscar ExitRecord vinculado al participantId
   * 2. Calcular EIS
   * 3. Extraer factores P2+P3
   * 4. Actualizar ExitRecord con resultados
   * 5. Crear alerta Ley Karin si aplica
   * 6. Crear alerta Toxic Exit si aplica (y no hay Ley Karin)
   * 
   * @modified v1.1 - Agregado paso 6 para alertas toxic_exit
   */
  static async processCompletedSurvey(participantId: string): Promise<{
    success: boolean;
    exitRecordId?: string;
    eis?: number | null;
    classification?: string | null;
    alertCreated?: boolean;
    alertType?: string;
    error?: string;
  }> {
    try {
      console.log('[ExitIntelligence] Processing completed survey for participant:', participantId);
      
      // 1. Buscar ExitRecord vinculado
      const exitRecord = await prisma.exitRecord.findUnique({
        where: { participantId },
        select: {
          id: true,
          accountId: true,
          departmentId: true,
          eis: true // Verificar si ya fue procesado
        }
      });
      
      if (!exitRecord) {
        console.log('[ExitIntelligence] No ExitRecord found for participant:', participantId);
        return {
          success: false,
          error: 'No se encontró registro de salida vinculado'
        };
      }
      
      // Verificar si ya fue procesado
      if (exitRecord.eis !== null) {
        console.log('[ExitIntelligence] ExitRecord already processed:', exitRecord.id);
        return {
          success: true,
          exitRecordId: exitRecord.id,
          eis: exitRecord.eis,
          alertCreated: false
        };
      }
      
      // 2. Calcular EIS
      const eisResult = await this.calculateEIS(participantId);
      
      // 3. Extraer factores
      const factors = await this.extractExitFactors(participantId);
      
      // 4. Actualizar ExitRecord
      await prisma.exitRecord.update({
        where: { id: exitRecord.id },
        data: {
          eis: eisResult.score,
          eisClassification: eisResult.classification,
          exitFactors: factors.exitFactors,
          exitFactorsDetail: factors.exitFactorsDetail,
          exitFactorsAvg: factors.exitFactorsAvg,
          hasLeyKarinAlert: eisResult.safetyScore !== null && 
                           eisResult.safetyScore < LEY_KARIN_THRESHOLD
        }
      });
      
      // 5. Crear alerta Ley Karin si aplica
      let alertCreated = false;
      let alertType: string | undefined;
      
      if (eisResult.safetyScore !== null && eisResult.safetyScore < LEY_KARIN_THRESHOLD) {
        alertCreated = await this.checkAndCreateLeyKarinAlert(
          exitRecord, 
          eisResult.safetyScore
        );
        if (alertCreated) alertType = 'ley_karin';
      }
      
      // 6. Crear alerta Toxic Exit si EIS < 25 (y no se creó ya Ley Karin)
      // Nota: Si hay Ley Karin, tiene prioridad (es compliance legal)
      if (eisResult.score !== null && eisResult.score < TOXIC_EIS_THRESHOLD && !alertCreated) {
        alertCreated = await this.checkAndCreateToxicExitAlert(
          exitRecord,
          eisResult.score
        );
        if (alertCreated) alertType = 'toxic_exit_detected';
      }
      
      // 7. Actualizar Participant como respondido
      await prisma.participant.update({
        where: { id: participantId },
        data: {
          hasResponded: true,
          responseDate: new Date()
        }
      });
      
      console.log('[ExitIntelligence] Survey processed successfully:', {
        exitRecordId: exitRecord.id,
        eis: eisResult.score,
        classification: eisResult.classification,
        alertCreated,
        alertType
      });
      
      return {
        success: true,
        exitRecordId: exitRecord.id,
        eis: eisResult.score,
        classification: eisResult.classification,
        alertCreated,
        alertType
      };
      
    } catch (error: any) {
      console.error('[ExitIntelligence] Error processing survey:', error);
      return {
        success: false,
        error: error.message || 'Error procesando encuesta'
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Normalizar rating 1-5 a escala 0-100
   */
  private static normalizeToHundred(rating: number | null): number | null {
    if (rating === null) return null;
    // Escala 1-5 → 0-100
    // 1 → 0, 2 → 25, 3 → 50, 4 → 75, 5 → 100
    return ((rating - 1) / 4) * 100;
  }
  
  /**
   * Parsear respuesta P2 (array de factores seleccionados)
   */
  private static parseP2Response(choiceResponse: string | null): string[] {
    if (!choiceResponse) return [];
    
    try {
      const parsed = JSON.parse(choiceResponse);
      
      // Puede venir como array directo o como string JSON de array
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      
      // Si es string, podría ser un solo factor
      if (typeof parsed === 'string') {
        return [parsed];
      }
      
      return [];
    } catch {
      // Si falla el parse, intentar split por coma
      return choiceResponse.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  
  /**
   * Parsear respuesta P3 (matriz de ratings por factor)
   */
  private static parseFactorsDetail(
    choiceResponse: string | null
  ): Record<string, number> | null {
    if (!choiceResponse) return null;
    
    try {
      const parsed = JSON.parse(choiceResponse);
      
      // Debe ser un objeto plano {factor: score}
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Validar que los valores son números
        const result: Record<string, number> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'number') {
            result[key] = value;
          } else if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              result[key] = numValue;
            }
          }
        }
        return Object.keys(result).length > 0 ? result : null;
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * Crear breakdown vacío para casos de error
   */
  private static createEmptyBreakdown(scores: Partial<ExitScores>) {
    return {
      satisfaction: { raw: scores.satisfaction ?? null, weighted: 0 },
      leadership: { raw: scores.leadership ?? null, weighted: 0 },
      development: { raw: scores.development ?? null, weighted: 0 },
      safety: { raw: scores.safety ?? null, weighted: 0 },
      autonomy: { raw: scores.autonomy ?? null, weighted: 0 }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { QUESTION_ORDER_MAP, LEY_KARIN_THRESHOLD, TOXIC_EIS_THRESHOLD };