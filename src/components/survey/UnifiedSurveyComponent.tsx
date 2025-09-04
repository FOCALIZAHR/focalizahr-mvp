// src/components/survey/UnifiedSurveyComponent.tsx
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
  onSubmit,
  onSave,
  isSubmitting = false
}) => {
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
    getProgress
  } = useSurveyEngine(questions, configuration, onSubmit, onSave);

  const progress = getProgress();
  
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
      
      case 'multiple_choice':
        return <MultipleChoiceRenderer 
          question={currentQuestion} 
          response={response} 
          updateResponse={updateResponse}
          validationRule={validationRule}
        />;
      
      case 'single_choice':
        return <SingleChoiceRenderer 
          question={currentQuestion} 
          response={response} 
          updateResponse={updateResponse}
        />;
      
      case 'rating_scale':
        return <RatingScaleRenderer response={response} updateResponse={updateResponse} />;
      
      case 'rating_matrix_conditional':
        return <RatingMatrixRenderer 
          question={currentQuestion}
          response={response} 
          updateResponse={updateResponse}
          selectedAspects={selectedAspects}
        />;
      
      default:
        return <div className="text-slate-500">Tipo de pregunta no soportado: {currentQuestion.responseType}</div>;
    }
  };

  // Calcular tiempo restante estimado
  const timeRemaining = Math.ceil((questions.length - currentQuestionIndex) * 0.5);

  // Determinar milestone de progreso
  const progressMilestone = useMemo(() => {
    if (progress.percentage >= 100) return "¡Completado!";
    if (progress.percentage >= 75) return "¡Casi terminas!";
    if (progress.percentage >= 50) return "¡Vas a la mitad!";
    if (progress.percentage >= 25) return "¡Buen comienzo!";
    return null;
  }, [progress.percentage]);

  return (
    <div className="survey-container">
      {/* Header fijo con progress bar */}
      <SurveyHeader 
        companyName={companyName}  // Ahora usa el prop con valor por defecto
        campaignName={configuration?.displayName || "Encuesta de Bienestar"}
        progress={progress}
        tagline="Evaluación independiente y confidencial"
      />

      {/* Contenido principal con padding para header */}
      <div className="pt-20">
        <AnimatePresence mode="wait">
          {/* Portada de categoría */}
          {shouldShowCategoryIntro && currentQuestion && (
            <CategoryIntroCard
              category={{
                ...config.categoryConfigs[currentQuestion.category],
                id: currentQuestion.category
              }}
              onContinue={handleCategoryIntroContinue}
              questionCount={questions.filter(q => q.category === currentQuestion.category).length}
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
              className="px-4 py-6 md:py-8"
            >
              <div className="max-w-2xl mx-auto">
                {/* Milestone notification */}
                {progressMilestone && progress.percentage % 25 === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4"
                  >
                    <Badge className="bg-survey-cyan-light text-survey-cyan border-survey-cyan/50">
                      {progressMilestone}
                    </Badge>
                  </motion.div>
                )}

                {/* Card de pregunta */}
                <div className="survey-question-card">
                  {/* Header de pregunta */}
                  <div className="px-6 pt-6 pb-4 border-b border-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="survey-question-category">
                        Pregunta {currentQuestionIndex + 1} de {questions.length}
                      </span>
                      <span className="text-xs text-slate-500">
                        {currentQuestion.category}
                      </span>
                    </div>
                    <h3 className="survey-question-text">
                      {currentQuestion.text}
                    </h3>
                  </div>

                  {/* Área de respuesta */}
                  <div className="p-6">
                    {renderQuestion()}
                  </div>
                </div>

                {/* Controles de navegación */}
                <div className="flex items-center justify-between mt-6">
                  {/* Botón anterior */}
                  <button
                    onClick={goToPrevious}
                    disabled={currentStep === 0}
                    className="survey-nav-prev"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {/* Progress dots indicator */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, questions.length) }, (_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === Math.min(currentQuestionIndex, 4)
                            ? 'w-6 bg-survey-cyan' 
                            : i < currentQuestionIndex
                            ? 'w-1.5 bg-survey-cyan/50'
                            : 'w-1.5 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-3">
                    {/* Botón guardar (opcional) */}
                    {onSave && (
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-slate-800/50 border border-survey-purple/30 
                                 text-survey-purple rounded-xl hover:bg-slate-800 
                                 transition-all duration-200"
                      >
                        Guardar
                      </button>
                    )}

                    {/* Botón siguiente o finalizar */}
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={goToNext}
                        disabled={!isCurrentResponseValid()}
                        className="survey-nav-next"
                      >
                        Siguiente
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={!isCurrentResponseValid() || isLoading || isSubmitting}
                        className="survey-nav-next"
                      >
                        {isLoading || isSubmitting ? (
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedSurveyComponent;