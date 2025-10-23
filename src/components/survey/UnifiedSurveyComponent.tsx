'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

import { 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react';

// Import refactored components
import { SurveyHeader } from './sections/SurveyHeader';
import { CategoryIntroCard } from './sections/CategoryIntroCard';
import  WelcomeScreen  from './sections/WelcomeScreen'; // IMPORTAMOS TU COMPONENTE SEPARADO
import { fadeIn } from './constants/animations';

// Import all renderers from index barrel
import { 
  RatingScaleRenderer,
  TextOpenRenderer,
  MultipleChoiceRenderer,
  SingleChoiceRenderer,
  RatingMatrixRenderer
} from './renderers';

// Import hook and types
import { useSurveyEngine } from '@/hooks/useSurveyEngine';
import type { 
  Question, 
  SurveyResponse, 
  SurveyConfiguration 
} from '@/hooks/useSurveyEngine';

// ========================================
// PROPS E INTERFACES
// ========================================
interface UnifiedSurveyProps {
  campaignId: string;
  participantToken: string;
  questions: Question[];
  configuration?: SurveyConfiguration;
  companyName?: string;
  campaignName?: string; // Nombre personalizado de la campaña
  companyLogo?: string;
  campaignTypeName?: string; // Tipo de campaña
  questionCount?: number;
  estimatedDuration?: number;
  onSubmit: (responses: SurveyResponse[]) => void;
  onSave?: (responses: SurveyResponse[]) => void;
  isSubmitting?: boolean;
}

// ========================================
// COMPONENTE PRINCIPAL ORQUESTADOR
// ========================================
const UnifiedSurveyComponent: React.FC<UnifiedSurveyProps> = ({
  campaignId,
  participantToken,
  questions,
  configuration,
  companyName = "Empresa Demo",
  companyLogo,
  campaignName = "Encuesta",
  campaignTypeName = "Evaluación de Clima",
  questionCount = questions.length,
  estimatedDuration = 10,
  onSubmit,
  onSave,
  isSubmitting = false
}) => {
  // Estado para controlar la pantalla de bienvenida
  const [showWelcome, setShowWelcome] = useState(true);

  // Hook principal con toda la lógica
  const {
    currentStep,
    currentQuestionIndex,
    currentQuestion,
    selectedAspects,
    isLoading,
    config,
    goToNext,
    goToPrevious,
    getCurrentResponse,
    updateResponse,
    isCurrentResponseValid,
    getCurrentValidationRule,
    handleSubmit,
    handleSave,
    getProgress,
    getCurrentCategory  // ← LÍNEA NUEVA
  } = useSurveyEngine(questions, configuration, onSubmit, onSave);

  const progress = getProgress();
  const currentCategory = getCurrentCategory();  // ← LÍNEA NUEVA
  
  // Estado local para categorías vistas
  const [viewedCategories, setViewedCategories] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  
  // Calcular categorías únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories);
  }, [questions]);
  
  // Determinar si mostrar intro de categoría
  const shouldShowCategoryIntro = useMemo(() => {
    if (!currentQuestion) return false;
    if (!config.uiSettings.showCategoryIntros) return false;
    
    const category = currentQuestion.category;
    
    if (!viewedCategories.has(category)) {
      const categoryQuestions = questions.filter(q => q.category === category);
      const isFirstOfCategory = categoryQuestions[0]?.id === currentQuestion.id;
      return isFirstOfCategory && config.categoryConfigs[category];
    }
    
    return false;
  }, [currentQuestion, viewedCategories, config, questions]);

  // Actualizar índice de categoría actual
  useEffect(() => {
    if (currentQuestion) {
      const index = uniqueCategories.indexOf(currentQuestion.category);
      if (index !== -1) {
        setCurrentCategoryIndex(index);
      }
    }
  }, [currentQuestion, uniqueCategories]);

  // Handler para continuar desde intro de categoría
  const handleCategoryIntroContinue = () => {
    if (currentQuestion) {
      setViewedCategories(prev => new Set(prev).add(currentQuestion.category));
    }
  };

  // ========================================
  // FACTORY PATTERN PARA RENDERERS
  // ========================================
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const response = getCurrentResponse();
    const validationRule = getCurrentValidationRule();

    switch (currentQuestion.responseType) {
      case 'text_open':
        return <TextOpenRenderer response={response} updateResponse={updateResponse} />;
      
      case 'rating_scale':
        return <RatingScaleRenderer response={response} updateResponse={updateResponse} />;
      
      case 'single_choice':
        return <SingleChoiceRenderer 
          question={currentQuestion} 
          response={response} 
          updateResponse={updateResponse}
        />;
      
      case 'multiple_choice':
        return <MultipleChoiceRenderer 
          question={currentQuestion} 
          response={response} 
          updateResponse={updateResponse}
          validationRule={validationRule}
        />;
      
      case 'rating_matrix_conditional':
        return <RatingMatrixRenderer 
          question={currentQuestion}
          response={response} 
          updateResponse={updateResponse}
          selectedAspects={selectedAspects}
        />;
      
      default:
        return <div className="text-slate-500">
          Tipo de pregunta no soportado: {currentQuestion.responseType}
        </div>;
    }
  };

  // Calcular tiempo restante
  const timeRemaining = useMemo(() => {
    const remainingQuestions = questions.length - currentQuestionIndex;
    const avgTimePerQuestion = 0.5; // minutos
    return Math.ceil(remainingQuestions * avgTimePerQuestion);
  }, [currentQuestionIndex, questions.length]);

  // Determinar milestone para celebración
  const progressMilestone = useMemo(() => {
    if (progress.percentage === 100) return "¡Completado!";
    if (progress.percentage >= 75) return "¡Casi terminas!";
    if (progress.percentage >= 50) return "¡Vas a la mitad!";
    if (progress.percentage >= 25) return "¡Buen comienzo!";
    return null;
  }, [progress.percentage]);

  // Render condicional para la pantalla de bienvenida
  if (showWelcome) {
    return (
      <WelcomeScreen
        campaignName={campaignName}
        companyName={companyName}  // ← USAR LA PROP DIRECTA
        companyLogo={companyLogo}   // ← NECESITAS AGREGAR ESTA PROP
        estimatedTime={estimatedDuration}
        questionCount={questionCount}
        onStart={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <div className="survey-container">
      {/* Header fijo con progress bar */}
      <SurveyHeader 
        companyName={companyName}
        campaignName={campaignName}
        campaignTypeName={campaignTypeName}
        progress={progress}
        estimatedDuration={estimatedDuration}
      />

      {/* Contenido principal con padding para header */}
      <div className="survey-content">
        <AnimatePresence mode="wait">
          {/* Portada de categoría */}

          {shouldShowCategoryIntro && currentCategory && (
            <CategoryIntroCard
              category={currentCategory}
              onContinue={handleCategoryIntroContinue}
              currentSection={currentCategoryIndex + 1}
              totalSections={uniqueCategories.length}
/>
          )}
          
          {/* Pregunta actual */}
          {!shouldShowCategoryIntro && currentQuestion && (
            <motion.div
              key={currentQuestionIndex}
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="px-4 py-4"
            >
              <div className="max-w-2xl mx-auto">
                {/* Card de pregunta mejorado */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
                  {/* Header de pregunta simplificado */}
                  <div className="px-6 pt-6 pb-4 border-b border-slate-800/50">
                    {/* Texto de la pregunta */}
                    <h2 className="text-xl md:text-2xl font-light text-white leading-relaxed">
                      {currentQuestion.text}
                    </h2>
                  </div>

                  {/* Cuerpo con renderer específico */}
                  <div className="px-6 pt-6 pb-6">
                    {renderQuestion()}
                  </div>
                  
                  {/* Navegación mejorada */}
                  <div className="px-6 pb-6">
                    <div className="flex justify-between items-center">
                      {/* Botón Anterior */}
                      <button
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        className="px-8 py-2.5 text-sm font-medium text-slate-400 
                                 border border-slate-700 rounded-full
                                 hover:border-slate-600 hover:text-slate-300
                                 disabled:opacity-30 disabled:cursor-not-allowed
                                 transition-all duration-200"
                      >
                        Anterior
                      </button>

                      {/* Botón Siguiente/Finalizar */}
                      {currentQuestionIndex < questions.length - 1 ? (
                        <button
                          onClick={goToNext}
                          disabled={!isCurrentResponseValid()}
                          className="px-8 py-2.5 text-sm font-medium
                                   bg-transparent border border-[#22D3EE]/50
                                   text-[#22D3EE] rounded-full
                                   hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-all duration-200"
                        >
                          Siguiente
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={!isCurrentResponseValid() || isSubmitting}
                          className="px-8 py-2.5 text-sm font-medium
                                   bg-[#22D3EE] text-[#0F172A] rounded-full
                                   hover:bg-[#A78BFA] hover:shadow-lg
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-all duration-200 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              Finalizar
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedSurveyComponent;