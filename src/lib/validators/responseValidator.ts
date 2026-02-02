// ════════════════════════════════════════════════════════════════════════════
// RESPONSE VALIDATOR - Single source of truth for survey response validation
// src/lib/validators/responseValidator.ts
// ════════════════════════════════════════════════════════════════════════════

import type { Question, SurveyResponse } from '@/hooks/useSurveyEngine';

/**
 * Determines if a survey response is considered "answered" for a given question type.
 * Used by both useSurveyEngine (navigation validation) and EvaluationReviewModal (review count).
 */
export function isResponseAnswered(
  question: Pick<Question, 'responseType'>,
  response: SurveyResponse | undefined
): boolean {
  if (!response) return false;

  switch (question.responseType) {
    case 'rating_scale':
      return response.rating != null && response.rating >= 1;
    case 'nps_scale':
      return response.rating != null && response.rating >= 0;
    case 'text_open':
      return !!response.textResponse && response.textResponse.trim().length >= 10;
    case 'single_choice':
    case 'multiple_choice':
      return !!response.choiceResponse && response.choiceResponse.length > 0;
    case 'rating_matrix_conditional':
      return !!response.matrixResponses && Object.keys(response.matrixResponses).length > 0;
    case 'competency_behavior':
      return response.rating != null && response.rating >= 1 && response.rating <= 5;
    default:
      return false;
  }
}
