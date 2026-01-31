// src/lib/survey/getScaleLabels.ts
// Helper para obtener labels dinámicos con cascade de fallbacks

import type { Question, SurveyConfiguration } from '@/hooks/useSurveyEngine';

/**
 * Labels por defecto (fallback final - comportamiento legacy)
 */
const DEFAULT_LABELS: Record<string, { min: string; max: string; scale?: string[] }> = {
  rating_scale: {
    min: 'Muy en desacuerdo',
    max: 'Muy de acuerdo',
    scale: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
  },
  nps_scale: {
    min: 'Nada probable',
    max: 'Muy probable'
  }
};

export interface ScaleLabels {
  min: string;
  max: string;
  scale: string[];
}

/**
 * Obtiene labels para una pregunta con cascade de fallbacks:
 * 1. Override por pregunta (question.scaleLabels completo)
 * 2. Override parcial por pregunta (question.minLabel/maxLabel)
 * 3. Default por campaign_type (config.uiSettings.defaultLabels)
 * 4. Fallback hardcoded (comportamiento legacy)
 */
export function getScaleLabels(
  question: Pick<Question, 'responseType' | 'minLabel' | 'maxLabel' | 'scaleLabels' | 'minValue' | 'maxValue'>,
  config?: SurveyConfiguration | null
): ScaleLabels {
  const responseType = question.responseType;
  const scaleSize = (question.maxValue || 5) - (question.minValue || 1) + 1;

  // Prioridad 1: Override completo por pregunta (scaleLabels)
  if (question.scaleLabels && Array.isArray(question.scaleLabels) && question.scaleLabels.length > 0) {
    return {
      min: question.scaleLabels[0],
      max: question.scaleLabels[question.scaleLabels.length - 1],
      scale: question.scaleLabels
    };
  }

  // Prioridad 2: Override parcial por pregunta (min/max)
  if (question.minLabel || question.maxLabel) {
    const min = question.minLabel || DEFAULT_LABELS[responseType]?.min || 'Muy en desacuerdo';
    const max = question.maxLabel || DEFAULT_LABELS[responseType]?.max || 'Muy de acuerdo';
    return {
      min,
      max,
      scale: interpolateScale(min, max, scaleSize)
    };
  }

  // Prioridad 3: Default por campaign_type (uiSettings)
  const configLabels = config?.uiSettings?.defaultLabels?.[responseType];
  if (configLabels) {
    if (configLabels.scale && Array.isArray(configLabels.scale)) {
      return {
        min: configLabels.min || configLabels.scale[0],
        max: configLabels.max || configLabels.scale[configLabels.scale.length - 1],
        scale: configLabels.scale
      };
    }
    if (configLabels.min || configLabels.max) {
      const min = configLabels.min || DEFAULT_LABELS[responseType]?.min || 'Muy en desacuerdo';
      const max = configLabels.max || DEFAULT_LABELS[responseType]?.max || 'Muy de acuerdo';
      return {
        min,
        max,
        scale: interpolateScale(min, max, scaleSize)
      };
    }
  }

  // Prioridad 4: Fallback hardcoded (legacy)
  const fallback = DEFAULT_LABELS[responseType] || DEFAULT_LABELS.rating_scale;
  return {
    min: fallback.min,
    max: fallback.max,
    scale: fallback.scale || interpolateScale(fallback.min, fallback.max, scaleSize)
  };
}

/**
 * Interpola labels intermedios entre min y max
 */
function interpolateScale(min: string, max: string, size: number): string[] {
  if (size <= 2) return [min, max];

  const middleLabels: Record<number, string[]> = {
    3: ['Neutral'],
    5: ['En desacuerdo', 'Neutral', 'De acuerdo'],
    7: ['Bastante en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Bastante de acuerdo'],
  };

  const middle = middleLabels[size] || middleLabels[5];
  return [min, ...middle!.slice(0, size - 2), max];
}

export default getScaleLabels;
