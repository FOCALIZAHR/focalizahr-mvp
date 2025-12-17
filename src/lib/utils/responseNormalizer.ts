// src/lib/utils/responseNormalizer.ts
// ✅ ARQUITECTURA CORRECTA: Lee metadata de BD o calcula automático

import { Question } from '@prisma/client';

/**
 * Calcula valor normalizado 0-5 para cualquier tipo de respuesta
 * Prioriza metadata de BD sobre lógica automática
 * 
 * @param response - Respuesta raw del participante
 * @param question - Metadata de la pregunta (incluye responseValueMapping)
 * @returns Valor normalizado 0-5 o null si no aplica
 */
export function calculateNormalizedScore(
  response: { 
    rating?: number | null; 
    choiceResponse?: string | null;
    textResponse?: string | null;
  },
  question: Pick<Question, 'responseType' | 'minValue' | 'maxValue' | 'choiceOptions' | 'responseValueMapping'>
): number | null {
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORIDAD 1: Metadata explícita (responseValueMapping)
  // ═══════════════════════════════════════════════════════════════════
  
  if (question.responseValueMapping && response.choiceResponse) {
    const mapping = question.responseValueMapping as Record<string, number>;
    
    // Parsear choiceResponse
    let choiceText = "";
    try {
      const parsed = JSON.parse(response.choiceResponse);
      choiceText = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      choiceText = response.choiceResponse;
    }
    
    // Buscar en mapeo (case-sensitive primero)
    if (mapping[choiceText] !== undefined) {
      return mapping[choiceText];
    }
    
    // Fallback: buscar case-insensitive
    const textLower = choiceText.toLowerCase().trim();
    const mappingLower = Object.entries(mapping).reduce((acc, [key, value]) => {
      acc[key.toLowerCase().trim()] = value;
      return acc;
    }, {} as Record<string, number>);
    
    if (mappingLower[textLower] !== undefined) {
      return mappingLower[textLower];
    }
    
    console.warn(`[ResponseNormalizer] Choice not found in mapping: "${choiceText}"`, {
      availableKeys: Object.keys(mapping),
      questionId: question
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRIORIDAD 2: Lógica automática por tipo
  // ═══════════════════════════════════════════════════════════════════
  
  // TIPO 1: NPS Scale (0-10 → 0-5)
  if (question.responseType === 'nps_scale' && response.rating !== null && response.rating !== undefined) {
    return (response.rating / 10) * 5;
  }
  
  // TIPO 2: Rating Scale (1-5 o normalizar)
  if (question.responseType === 'rating_scale' && response.rating !== null && response.rating !== undefined) {
    const min = question.minValue;
    const max = question.maxValue;
    
    // Si ya está en escala 1-5, devolver directo
    if (min === 1 && max === 5) {
      return response.rating;
    }
    
    // Normalizar otra escala a 0-5
    const normalized = ((response.rating - min) / (max - min)) * 5;
    return Math.round(normalized * 10) / 10;
  }
  
  // TIPO 3: Single Choice sin metadata (mapeo lineal fallback)
  if (question.responseType === 'single_choice' && response.choiceResponse) {
    let choiceText = "";
    try {
      const parsed = JSON.parse(response.choiceResponse);
      choiceText = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      choiceText = response.choiceResponse;
    }
    
    const options = Array.isArray(question.choiceOptions) 
      ? question.choiceOptions 
      : [];
    
    const index = options.indexOf(choiceText);
    
    if (index === -1) {
      console.warn(
        `[ResponseNormalizer] Choice not in options (no metadata): "${choiceText}"`,
        { availableOptions: options }
      );
      return null;
    }
    
    // Mapeo lineal: primera opción = 5.0, última = 1.0
    const step = options.length > 1 ? 4 / (options.length - 1) : 0;
    return Math.round((5 - (index * step)) * 10) / 10;
  }
  
  // Otros tipos no tienen valor numérico
  return null;
}

/**
 * Helper para validar si una pregunta requiere normalización
 */
export function requiresNormalization(responseType: string): boolean {
  return ['rating_scale', 'nps_scale', 'single_choice'].includes(responseType);
}

/**
 * Helper para obtener threshold de alerta basado en severidad
 */
export function getAlertThreshold(severity: 'critical' | 'high' | 'medium' | 'low'): number {
  const thresholds = {
    critical: 1.5,  // Captura 1.0 y 1.5
    high: 2.0,      // Captura hasta 2.0
    medium: 2.5,    // Captura hasta 2.5
    low: 3.0        // Captura hasta 3.0
  };
  return thresholds[severity];
}