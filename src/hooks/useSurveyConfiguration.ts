// src/hooks/useSurveyConfiguration.ts
import { useState, useEffect } from 'react';

// Configuración de categoría (metadata UI para categorías existentes)
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
  id?: string;
  campaignType?: any;
  categoryConfigs: { [key: string]: CategoryConfig };
  conditionalRules: ConditionalRule[];
  uiSettings: UISettings;
  validationRules: ValidationRule[];
  isDefault?: boolean;
}

/**
 * Hook para cargar la configuración de encuesta desde la API
 * NO duplica categorías, solo agrega metadata UI
 */
export function useSurveyConfiguration(campaignTypeSlug: string | null) {
  const [configuration, setConfiguration] = useState<SurveyConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignTypeSlug) {
      console.log('⚠️ No campaign type slug provided, using default configuration');
      setConfiguration(getDefaultConfiguration());
      return;
    }

    const loadConfiguration = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`📋 Loading survey configuration for: ${campaignTypeSlug}`);
        
        const response = await fetch(`/api/survey-config/${campaignTypeSlug}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load configuration: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log(`✅ Configuration loaded for ${campaignTypeSlug}:`, data);
        
        // Si la API devuelve una configuración por defecto, usar nuestra versión mejorada
        if (data.isDefault) {
          console.log('📝 Using enhanced default configuration');
          const defaultConfig = getDefaultConfigurationForType(campaignTypeSlug);
          setConfiguration(defaultConfig);
        } else {
          setConfiguration(data);
        }
      } catch (err) {
        console.error('❌ Error loading survey configuration:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // En caso de error, usar configuración por defecto
        console.log('⚠️ Falling back to default configuration');
        const defaultConfig = getDefaultConfigurationForType(campaignTypeSlug);
        setConfiguration(defaultConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, [campaignTypeSlug]);

  return {
    configuration,
    isLoading,
    error,
    reload: () => {
      if (campaignTypeSlug) {
        setConfiguration(null);
        // Trigger reload
        const event = new Event('reload-config');
        window.dispatchEvent(event);
      }
    }
  };
}

/**
 * Obtiene una configuración por defecto básica
 */
export function getDefaultConfiguration(): SurveyConfiguration {
  return {
    categoryConfigs: {},
    conditionalRules: [],
    uiSettings: {
      showCategoryIntros: false,
      questionTransitions: 'none',
      progressDisplay: 'linear',
      breakAfterQuestions: [],
      completionCelebration: true,
      theme: {
        primaryColor: 'cyan',
        secondaryColor: 'purple',
        showGradients: true
      },
      antiFatigueSettings: {
        enableMicroBreaks: false,
        showMotivationalMessages: true,
        questionsPerPage: 1
      }
    },
    validationRules: [],
    isDefault: true
  };
}

/**
 * Obtiene configuración por defecto específica por tipo
 */
export function getDefaultConfigurationForType(slug: string): SurveyConfiguration {
  const configs: { [key: string]: SurveyConfiguration } = {
    'pulso-express': {
      categoryConfigs: {
        'liderazgo': {
          displayName: 'Liderazgo y Apoyo',
          icon: 'Users',
          color: 'cyan',
          description: 'Evalúa cómo percibes el liderazgo en tu equipo',
          motivationalText: 'Tu opinión es clave para mejorar el liderazgo',
          order: 1
        },
        'comunicacion': {
          displayName: 'Comunicación Efectiva',
          icon: 'MessageSquare',
          color: 'purple',
          description: 'La comunicación clara construye equipos fuertes',
          motivationalText: 'Ayúdanos a mejorar cómo nos comunicamos',
          order: 2
        },
        'desarrollo': {
          displayName: 'Desarrollo Profesional',
          icon: 'TrendingUp',
          color: 'gradient',
          description: 'Oportunidades de crecimiento y aprendizaje',
          motivationalText: 'Tu desarrollo es nuestra prioridad',
          order: 3
        },
        'reconocimiento': {
          displayName: 'Reconocimiento y Valoración',
          icon: 'Award',
          color: 'cyan',
          description: 'Cómo se valora tu contribución',
          motivationalText: 'Tu esfuerzo merece ser reconocido',
          order: 4
        }
      },
      conditionalRules: [],
      uiSettings: {
        showCategoryIntros: true,
        questionTransitions: 'slide',
        progressDisplay: 'categorical',
        breakAfterQuestions: [],
        completionCelebration: true,
        theme: {
          primaryColor: 'cyan',
          secondaryColor: 'purple',
          showGradients: true
        },
        antiFatigueSettings: {
          enableMicroBreaks: false,
          showMotivationalMessages: true,
          questionsPerPage: 1
        }
      },
      validationRules: []
    },
    'retencion-predictiva': {
      categoryConfigs: {
        'satisfaccion': {
          displayName: 'Satisfacción General',
          icon: 'Smile',
          color: 'purple',
          description: 'Tu nivel de satisfacción actual',
          motivationalText: 'Tu bienestar es importante para nosotros',
          order: 1
        },
        'autonomia': {
          displayName: 'Autonomía y Confianza',
          icon: 'Shield',
          color: 'cyan',
          description: 'Libertad para tomar decisiones',
          motivationalText: 'La confianza construye grandes equipos',
          order: 2
        },
        'crecimiento': {
          displayName: 'Oportunidades de Crecimiento',
          icon: 'Rocket',
          color: 'gradient',
          description: 'Tu proyección profesional',
          motivationalText: 'Tu futuro comienza aquí',
          order: 3
        }
      },
      conditionalRules: [
        {
          id: 'matrix_rule',
          triggerQuestionOrder: 2,
          targetQuestionOrder: 3,
          type: 'matrix_from_selection',
          condition: {
            operator: 'exists',
            field: 'choiceResponse'
          },
          action: {
            type: 'populate_matrix',
            mapping: 'selectedChoices'
          }
        }
      ],
      uiSettings: {
        showCategoryIntros: true,
        questionTransitions: 'fade',
        progressDisplay: 'categorical',
        breakAfterQuestions: [],
        completionCelebration: true,
        theme: {
          primaryColor: 'purple',
          secondaryColor: 'cyan',
          showGradients: true
        },
        antiFatigueSettings: {
          enableMicroBreaks: false,
          showMotivationalMessages: true,
          questionsPerPage: 1
        }
      },
      validationRules: [
        {
          questionOrder: 2,
          type: 'exact_count',
          params: {
            count: 3,
            errorMessage: 'Por favor selecciona exactamente 3 aspectos'
          }
        }
      ]
    },
    'experiencia-full': {
      categoryConfigs: {
        'liderazgo': {
          displayName: 'Liderazgo y Gestión',
          icon: 'Users',
          color: 'cyan',
          description: 'Evalúa el liderazgo en tu organización',
          motivationalText: 'El liderazgo efectivo comienza con tu feedback',
          order: 1
        },
        'comunicacion': {
          displayName: 'Comunicación Organizacional',
          icon: 'MessageCircle',
          color: 'purple',
          description: 'Cómo fluye la información',
          motivationalText: 'La comunicación clara nos fortalece',
          order: 2
        },
        'desarrollo': {
          displayName: 'Desarrollo y Carrera',
          icon: 'TrendingUp',
          color: 'gradient',
          description: 'Oportunidades de crecimiento',
          motivationalText: 'Tu crecimiento es nuestro éxito',
          order: 3
        },
        'reconocimiento': {
          displayName: 'Reconocimiento',
          icon: 'Award',
          color: 'cyan',
          description: 'Cómo se valora tu trabajo',
          motivationalText: 'Tu esfuerzo merece reconocimiento',
          order: 4
        },
        'compensaciones': {
          displayName: 'Compensación y Beneficios',
          icon: 'DollarSign',
          color: 'purple',
          description: 'Satisfacción con recompensas',
          motivationalText: 'Valoramos tu contribución',
          order: 5
        }
      },
      conditionalRules: [],
      uiSettings: {
        showCategoryIntros: true,
        questionTransitions: 'slide',
        progressDisplay: 'categorical',
        breakAfterQuestions: [10, 20, 30],
        completionCelebration: true,
        theme: {
          primaryColor: 'cyan',
          secondaryColor: 'purple',
          showGradients: true
        },
        antiFatigueSettings: {
          enableMicroBreaks: true,
          showMotivationalMessages: true,
          questionsPerPage: 1,
          breakDuration: 30
        }
      },
      validationRules: []
    }
  };

  return configs[slug] || getDefaultConfiguration();
}