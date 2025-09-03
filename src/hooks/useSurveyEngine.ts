// src/hooks/useSurveyEngine.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

// ========================================
// TIPOS E INTERFACES
// ========================================
export interface Question {
  id: string;
  text: string;
  category: string;
  questionOrder: number;
  responseType: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale' | 'single_choice';
  choiceOptions?: string[] | null;
  conditionalLogic?: any;
}

export interface SurveyResponse {
  questionId: string;
  rating?: number;
  textResponse?: string;
  choiceResponse?: string[];
  matrixResponses?: { [key: string]: number };
}

export interface CategoryConfig {
  displayName: string;
  icon: string;
  color: 'cyan' | 'purple' | 'gradient';
  description: string;
  motivationalText: string;
  order: number;
}

export interface ConditionalRule {
  id: string;
  triggerQuestionOrder: number;
  targetQuestionOrder: number;
  type: string;
  condition?: any;
  action?: any;
}

export interface UISettings {
  showCategoryIntros: boolean;
  questionTransitions: 'slide' | 'fade' | 'none';
  progressDisplay: 'linear' | 'categorical' | 'minimal';
  breakAfterQuestions: number[];
  completionCelebration: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    showGradients?: boolean;
  };
  antiFatigueSettings?: {
    enableMicroBreaks?: boolean;
    showMotivationalMessages?: boolean;
    questionsPerPage?: number;
    breakDuration?: number;
  };
}

export interface ValidationRule {
  questionOrder: number;
  type: string;
  params: any;
}

export interface SurveyConfiguration {
  categoryConfigs: { [key: string]: CategoryConfig };
  conditionalRules: ConditionalRule[];
  uiSettings: UISettings;
  validationRules: ValidationRule[];
}

// ========================================
// HOOK PRINCIPAL - LÓGICA DE NEGOCIO
// ========================================
export function useSurveyEngine(
  questions: Question[],
  configuration?: SurveyConfiguration,
  onSubmit?: (responses: SurveyResponse[]) => void,
  onSave?: (responses: SurveyResponse[]) => void
) {
  // Estado principal
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [showCategoryIntro, setShowCategoryIntro] = useState(false);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Configuración por defecto
  const defaultConfig: SurveyConfiguration = {
    categoryConfigs: {},
    conditionalRules: [],
    uiSettings: {
      showCategoryIntros: false,
      questionTransitions: 'slide',
      progressDisplay: 'categorical',
      breakAfterQuestions: [],
      completionCelebration: true
    },
    validationRules: []
  };

  const config = configuration || defaultConfig;

  // Inicializar respuestas
  useEffect(() => {
    const initialResponses = questions.map(q => ({
      questionId: q.id,
      rating: undefined,
      textResponse: '',
      choiceResponse: [],
      matrixResponses: {}
    }));
    setResponses(initialResponses);
  }, [questions]);

  // Determinar pregunta actual con memoización
  const currentQuestionIndex = useMemo(() => currentStep, [currentStep]);
  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  // Verificar si debemos mostrar intro de categoría (memoizado)
  const isCategoryIntroStep = useCallback((step: number) => {
    // Por ahora desactivado hasta implementar lógica completa
    return false;
  }, []);

  // Aplicar reglas condicionales
  useEffect(() => {
    if (!currentQuestion) return;
    
    const rule = config.conditionalRules.find(
      r => r.targetQuestionOrder === currentQuestion.questionOrder
    );

    if (rule && rule.type === 'matrix_from_selection') {
      const triggerResponse = responses.find(
        r => questions.find(q => q.id === r.questionId)?.questionOrder === rule.triggerQuestionOrder
      );

      if (triggerResponse?.choiceResponse && triggerResponse.choiceResponse.length > 0) {
        if (JSON.stringify(selectedAspects) !== JSON.stringify(triggerResponse.choiceResponse)) {
          setSelectedAspects(triggerResponse.choiceResponse);
        }
      }
    }
  }, [currentQuestion, config.conditionalRules, responses, questions]);

  // Obtener categoría actual (memoizado)
  const getCurrentCategory = useCallback(() => {
    if (!currentQuestion) return null;
    const category = currentQuestion.category;
    if (config.categoryConfigs && config.categoryConfigs[category]) {
      return {
        ...config.categoryConfigs[category],
        id: category
      };
    }
    return null;
  }, [currentQuestion, config.categoryConfigs]);

  // Obtener respuesta actual (memoizado)
  const getCurrentResponse = useCallback(() => {
    return responses[currentQuestionIndex] || {
      questionId: currentQuestion?.id,
      rating: undefined,
      textResponse: '',
      choiceResponse: [],
      matrixResponses: {}
    };
  }, [responses, currentQuestionIndex, currentQuestion]);

  // Actualizar respuesta (memoizado con setResponses funcional)
  const updateResponse = useCallback((update: Partial<SurveyResponse>) => {
    setResponses(prevResponses => {
      const newResponses = [...prevResponses];
      newResponses[currentQuestionIndex] = {
        ...newResponses[currentQuestionIndex],
        ...update
      };
      return newResponses;
    });
  }, [currentQuestionIndex]);

  // Validar respuesta actual (memoizado)
  const isCurrentResponseValid = useCallback(() => {
    if (!currentQuestion) return false;
    
    const response = getCurrentResponse();
    const validationRule = config.validationRules.find(
      r => r.questionOrder === currentQuestion.questionOrder
    );

    if (validationRule) {
      if (validationRule.type === 'exact_count' && response.choiceResponse) {
        return response.choiceResponse.length === validationRule.params.count;
      }
    }

    switch (currentQuestion.responseType) {
      case 'text_open':
        return response.textResponse && response.textResponse.trim().length >= 10;
      case 'multiple_choice':
        return response.choiceResponse && response.choiceResponse.length > 0;
      case 'rating_matrix_conditional':
        const requiredAspects = selectedAspects.length;
        const completedAspects = Object.keys(response.matrixResponses || {}).length;
        return completedAspects === requiredAspects && requiredAspects > 0;
      case 'rating_scale':
        return response.rating && response.rating >= 1 && response.rating <= 5;
      case 'single_choice':
        return response.choiceResponse && response.choiceResponse.length === 1;
      default:
        return false;
    }
  }, [currentQuestion, getCurrentResponse, config.validationRules, selectedAspects]);

  // Navegación (memoizado)
  const getTotalSteps = useCallback(() => {
    return questions.length;
  }, [questions.length]);

  const goToNext = useCallback(() => {
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, getTotalSteps]);

  const goToPrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Manejar envío (memoizado)
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(responses);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit, responses]);

  // Manejar guardado parcial (memoizado)
  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(responses);
    }
  }, [onSave, responses]);

  // Funciones de mensaje motivacional (memoizado)
  const getMotivationalMessage = useCallback((percentage: number) => {
    if (percentage < 25) return "¡Excelente comienzo! 🚀";
    if (percentage < 50) return "¡Vas muy bien! 💪";
    if (percentage < 75) return "¡Ya pasaste la mitad! 🎯";
    if (percentage < 100) return "¡Casi terminas! 🏁";
    return "¡Completado! 🎉";
  }, []);

  // Calcular progreso (memoizado)
  const getProgress = useCallback(() => {
    const current = currentQuestionIndex + 1;
    const total = questions.length;
    const percentage = Math.round((current / total) * 100);
    
    return {
      current,
      total,
      percentage,
      message: getMotivationalMessage(percentage)
    };
  }, [currentQuestionIndex, questions.length, getMotivationalMessage]);

  // Obtener validación para pregunta actual (memoizado)
  const getCurrentValidationRule = useCallback(() => {
    if (!currentQuestion) return null;
    return config.validationRules.find(
      r => r.questionOrder === currentQuestion.questionOrder
    );
  }, [currentQuestion, config.validationRules]);

  // Retornar todo lo necesario para la UI
  return {
    // Estado
    currentStep,
    currentQuestionIndex,
    currentQuestion,
    responses,
    selectedAspects,
    isLoading,
    showCategoryIntro,
    
    // Configuración
    config,
    
    // Funciones de navegación
    goToNext,
    goToPrevious,
    getTotalSteps,
    
    // Funciones de respuesta
    getCurrentResponse,
    updateResponse,
    isCurrentResponseValid,
    
    // Funciones de categoría
    getCurrentCategory,
    isCategoryIntroStep,
    
    // Funciones de validación
    getCurrentValidationRule,
    
    // Funciones de envío
    handleSubmit,
    handleSave,
    
    // Funciones de progreso
    getProgress,
    
    // Funciones auxiliares
    setShowCategoryIntro
  };
}