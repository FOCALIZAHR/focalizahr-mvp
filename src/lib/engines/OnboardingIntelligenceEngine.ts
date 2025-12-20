/**
 * ONBOARDING INTELLIGENCE ENGINE
 * 
 * RESPONSABILIDADES:
 * - Calcular EXO Score (Experience Onboarding Score 0-100)
 * - Clasificar riesgo de retención (low/medium/high/critical)
 * - Calcular trayectoria (improving/stable/declining)
 * - Identificar dimensión más débil
 * - Generar recomendaciones accionables
 * 
 * FÓRMULA EXO SCORE:
 * EXO = [(Compliance × 0.20) + (Clarification × 0.30) + 
 *        (Culture × 0.25) + (Connection × 0.25)] / 5.0 × 100
 * 
 * @version 2.0.0 - Fix current_stage calculation
 * @date December 2025
 */

import { prisma } from '@/lib/prisma';

interface StageScores {
  compliance: number | null;
  clarification: number | null;
  culture: number | null;
  connection: number | null;
}

interface EXOScoreResult {
  exoScore: number;
  retentionRisk: 'low' | 'medium' | 'high' | 'critical';
  trajectory: 'improving' | 'stable' | 'declining';
  weakestDimension: string | null;
  recommendations: string[];
}

export class OnboardingIntelligenceEngine {
  
  /**
   * ✅ CALCULAR EXO SCORE
   * Fórmula Bauer ponderada: (C×0.2 + CL×0.3 + CU×0.25 + CO×0.25) / 5.0 × 100
   */
  static calculateEXOScore(scores: StageScores): number | null {
    const { compliance, clarification, culture, connection } = scores;
    
    // Verificar que tengamos al menos 2 scores
    const availableScores = [compliance, clarification, culture, connection].filter(s => s !== null);
    if (availableScores.length < 2) {
      return null;  // No suficiente data
    }
    
    // Ponderar scores disponibles
    let weightedSum = 0;
    let totalWeight = 0;
    
    const weights = {
      compliance: 0.20,      // Día 1
      clarification: 0.30,   // Día 7 (MAYOR PESO)
      culture: 0.25,         // Día 30
      connection: 0.25       // Día 90
    };
    
    if (compliance !== null) {
      weightedSum += compliance * weights.compliance;
      totalWeight += weights.compliance;
    }
    if (clarification !== null) {
      weightedSum += clarification * weights.clarification;
      totalWeight += weights.clarification;
    }
    if (culture !== null) {
      weightedSum += culture * weights.culture;
      totalWeight += weights.culture;
    }
    if (connection !== null) {
      weightedSum += connection * weights.connection;
      totalWeight += weights.connection;
    }
    
    // EXO Score: escala 1-5 → 0-100
    const normalizedScore = (weightedSum / totalWeight) / 5.0;
    return Math.round(normalizedScore * 100);
  }
  
  /**
   * ✅ CLASIFICAR RIESGO DE RETENCIÓN
   */
  static calculateRetentionRisk(exoScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (exoScore >= 80) return 'low';
    if (exoScore >= 70) return 'medium';
    if (exoScore >= 60) return 'high';
    return 'critical';
  }
  
  /**
   * ✅ CALCULAR TRAYECTORIA
   */
  static calculateTrajectory(scores: StageScores): 'improving' | 'stable' | 'declining' {
    const availableScores = [
      scores.compliance,
      scores.clarification,
      scores.culture,
      scores.connection
    ].filter(s => s !== null) as number[];
    
    if (availableScores.length < 2) return 'stable';
    
    // Calcular tendencia lineal simple
    let trend = 0;
    for (let i = 1; i < availableScores.length; i++) {
      trend += availableScores[i] - availableScores[i - 1];
    }
    
    const avgTrend = trend / (availableScores.length - 1);
    
    if (avgTrend > 0.3) return 'improving';
    if (avgTrend < -0.3) return 'declining';
    return 'stable';
  }
  
  /**
   * ✅ IDENTIFICAR DIMENSIÓN MÁS DÉBIL
   */
  static identifyWeakestDimension(scores: StageScores): string | null {
    const dimensions = [
      { name: 'compliance', score: scores.compliance },
      { name: 'clarification', score: scores.clarification },
      { name: 'culture', score: scores.culture },
      { name: 'connection', score: scores.connection }
    ].filter(d => d.score !== null) as { name: string; score: number }[];
    
    if (dimensions.length === 0) return null;
    
    const weakest = dimensions.reduce((min, d) => 
      d.score < min.score ? d : min
    );
    
    return weakest.name;
  }
  
  /**
   * ✅ GENERAR RECOMENDACIONES
   */
  static generateRecommendations(
    exoScore: number,
    scores: StageScores,
    trajectory: 'improving' | 'stable' | 'declining',
    weakestDimension: string | null
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones por nivel de riesgo
    if (exoScore < 60) {
      recommendations.push('🚨 CRÍTICO: Reunión urgente con manager y RRHH');
      recommendations.push('Evaluar si el rol es el adecuado o si hay problemas sistémicos');
    } else if (exoScore < 70) {
      recommendations.push('⚠️ ALTO RIESGO: Check-in inmediato con manager');
      recommendations.push('Identificar barreras específicas y plan de acción');
    } else if (exoScore < 80) {
      recommendations.push('📊 MONITOREAR: Seguimiento cercano próximas 2 semanas');
    }
    
    // Recomendaciones por dimensión débil
    if (weakestDimension) {
      switch (weakestDimension) {
        case 'compliance':
          recommendations.push('🔧 Verificar acceso a herramientas y equipamiento');
          recommendations.push('Resolver bloqueos logísticos inmediatamente');
          break;
        case 'clarification':
          recommendations.push('📋 Sesión 1:1 para clarificar expectativas y objetivos');
          recommendations.push('Documentar rol, responsabilidades y KPIs');
          break;
        case 'culture':
          recommendations.push('🌟 Reforzar conexión con valores organizacionales');
          recommendations.push('Asignar mentor cultural o embajador de valores');
          break;
        case 'connection':
          recommendations.push('🤝 Facilitar integración social al equipo');
          recommendations.push('Organizar actividades team building o almuerzos de equipo');
          break;
      }
    }
    
    // Recomendaciones por trayectoria
    if (trajectory === 'declining') {
      recommendations.push('📉 ATENCIÓN: Scores en declive. Investigar cambios recientes');
      recommendations.push('Considerar si hubo eventos específicos que expliquen la tendencia');
    } else if (trajectory === 'improving') {
      recommendations.push('✅ Positivo: Scores mejorando. Mantener momentum actual');
    }
    
    return recommendations;
  }
  
  /**
   * ✅ ANÁLISIS COMPLETO DE JOURNEY
   */
  static async analyzeJourney(journeyId: string): Promise<EXOScoreResult> {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId }
    });
    
    if (!journey) {
      throw new Error('Journey not found');
    }
    
    const scores: StageScores = {
      compliance: journey.complianceScore,
      clarification: journey.clarificationScore,
      culture: journey.cultureScore,
      connection: journey.connectionScore
    };
    
    const exoScore = this.calculateEXOScore(scores);
    
    if (!exoScore) {
      throw new Error('Insufficient data to calculate EXO Score');
    }
    
    const retentionRisk = this.calculateRetentionRisk(exoScore);
    const trajectory = this.calculateTrajectory(scores);
    const weakestDimension = this.identifyWeakestDimension(scores);
    const recommendations = this.generateRecommendations(
      exoScore,
      scores,
      trajectory,
      weakestDimension
    );
    
    return {
      exoScore,
      retentionRisk,
      trajectory,
      weakestDimension,
      recommendations
    };
  }
  
  /**
   * ✅ CALCULAR SCORE DE UN STAGE (CORREGIDO)
   * Promedio de responses del participant en ese stage
   * Normaliza cualquier escala (1-5, 0-10) a 0-5
   */
  static async calculateStageScore(participantId: string): Promise<number | null> {
    const responses = await prisma.response.findMany({
      where: {
        participantId,
        normalizedScore: { not: null },
      },
      select: {
        id: true,
        normalizedScore: true
      }
    });

    if (responses.length === 0) return null;

    // Ya está normalizado 0-5
    const scores = responses.map(r => r.normalizedScore!);

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average * 10) / 10;
  }

  /**
   * ✅ CALCULAR PRÓXIMO STAGE PENDIENTE EN SECUENCIA
   * Retorna el primer stage que NO ha sido respondido
   * 
   * @version 2.0.0 - NUEVO MÉTODO
   */
  private static async calculateNextPendingStage(journeyId: string): Promise<number> {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      select: {
        stage1ParticipantId: true,
        stage2ParticipantId: true,
        stage3ParticipantId: true,
        stage4ParticipantId: true,
      }
    });

    if (!journey) return 1;

    // Obtener estado de respuesta de cada participant
    const [p1, p2, p3, p4] = await Promise.all([
      journey.stage1ParticipantId 
        ? prisma.participant.findUnique({ 
            where: { id: journey.stage1ParticipantId }, 
            select: { hasResponded: true } 
          })
        : null,
      journey.stage2ParticipantId
        ? prisma.participant.findUnique({ 
            where: { id: journey.stage2ParticipantId }, 
            select: { hasResponded: true } 
          })
        : null,
      journey.stage3ParticipantId
        ? prisma.participant.findUnique({ 
            where: { id: journey.stage3ParticipantId }, 
            select: { hasResponded: true } 
          })
        : null,
      journey.stage4ParticipantId
        ? prisma.participant.findUnique({ 
            where: { id: journey.stage4ParticipantId }, 
            select: { hasResponded: true } 
          })
        : null,
    ]);

    // Retornar el primer stage NO respondido (en secuencia)
    if (!p1?.hasResponded) return 1;
    if (!p2?.hasResponded) return 2;
    if (!p3?.hasResponded) return 3;
    if (!p4?.hasResponded) return 4;
    
    // Si todas respondidas, retornar 4 (se marcará completed)
    return 4;
  }

  /**
   * ✅ VERIFICAR SI TODAS LAS ETAPAS ESTÁN COMPLETAS
   * 
   * @version 2.0.0 - NUEVO MÉTODO
   */
  private static async areAllStagesCompleted(journeyId: string): Promise<boolean> {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      select: {
        stage1ParticipantId: true,
        stage2ParticipantId: true,
        stage3ParticipantId: true,
        stage4ParticipantId: true,
      }
    });

    if (!journey) return false;

    const participantIds = [
      journey.stage1ParticipantId,
      journey.stage2ParticipantId,
      journey.stage3ParticipantId,
      journey.stage4ParticipantId,
    ].filter(Boolean) as string[];

    // Si no tiene los 4 participants, no está completo
    if (participantIds.length !== 4) return false;

    const participants = await prisma.participant.findMany({
      where: { id: { in: participantIds } },
      select: { hasResponded: true }
    });

    // Todas completas si hay 4 y todos respondieron
    return participants.length === 4 && participants.every(p => p.hasResponded);
  }

  /**
   * ✅ ACTUALIZAR SCORES EN JOURNEY DESPUÉS DE RESPONDER STAGE
   * 
   * @version 2.0.0 - FIX: current_stage ahora calcula próximo pendiente en secuencia
   * 
   * CAMBIOS v2.0.0:
   * - currentStage usa calculateNextPendingStage() en lugar del stage respondido
   * - status='completed' solo cuando areAllStagesCompleted() es true
   * - Agregado stageXCompletedAt para tracking de fechas
   */
  static async updateJourneyScores(journeyId: string, stage: number) {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId }
    });
    
    if (!journey) return;
    
    // Obtener participantId del stage
    const participantIds = [
      journey.stage1ParticipantId,
      journey.stage2ParticipantId,
      journey.stage3ParticipantId,
      journey.stage4ParticipantId
    ];
    
    const participantId = participantIds[stage - 1];
    if (!participantId) return;
    
    // Calcular score del stage
    const stageScore = await this.calculateStageScore(participantId);
    
    if (stageScore === null) {
      console.warn(`[updateJourneyScores] No se pudo calcular score para stage ${stage}`);
      return;
    }
    
    // ✅ FIX v2.0.0: Calcular el próximo stage pendiente EN SECUENCIA
    const nextPendingStage = await this.calculateNextPendingStage(journeyId);
    
    // Actualizar score correspondiente
    const updateData: any = {
      currentStage: nextPendingStage  // ✅ FIX: Usar próximo pendiente, no stage respondido
    };
    
    switch (stage) {
      case 1:
        updateData.complianceScore = stageScore;
        updateData.stage1CompletedAt = new Date();
        break;
      case 2:
        updateData.clarificationScore = stageScore;
        updateData.stage2CompletedAt = new Date();
        break;
      case 3:
        updateData.cultureScore = stageScore;
        updateData.stage3CompletedAt = new Date();
        break;
      case 4:
        updateData.connectionScore = stageScore;
        updateData.stage4CompletedAt = new Date();
        // ✅ FIX v2.0.0: NO marcar completed aquí, se verifica abajo
        break;
    }
    
    // ✅ FIX v2.0.0: Verificar si TODAS las etapas están completas
    const allCompleted = await this.areAllStagesCompleted(journeyId);
    if (allCompleted) {
      updateData.status = 'completed';
    }
    
    // Construir scores usando journey ACTUAL + nuevo score
    const scores: StageScores = {
      compliance: updateData.complianceScore ?? journey.complianceScore,
      clarification: updateData.clarificationScore ?? journey.clarificationScore,
      culture: updateData.cultureScore ?? journey.cultureScore,
      connection: updateData.connectionScore ?? journey.connectionScore
    };
    
    // Calcular EXO Score con los scores actualizados
    const exoScore = this.calculateEXOScore(scores);
    
    if (exoScore !== null) {
      updateData.exoScore = exoScore;
      updateData.retentionRisk = this.calculateRetentionRisk(exoScore);
    }
    
    // Aplicar update
    await prisma.journeyOrchestration.update({
      where: { id: journeyId },
      data: updateData
    });
    
    console.log(`[OnboardingEngine] Journey ${journeyId} Stage ${stage} actualizado: score=${stageScore}, nextStage=${nextPendingStage}, exo=${exoScore}, completed=${allCompleted}`);
  }
}