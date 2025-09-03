// src/components/survey/UnifiedSurveyComponent.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Star,
  Target,
  Users,
  Building,
  TrendingUp,
  Heart,
  Eye,
  UserPlus,
  Globe,
  DollarSign,
  Scale,
  Lightbulb,
  Loader2,
  ChevronRight,
  Zap,
  Shield,
  Rocket,
  MessageSquare,
  Award,
  Brain,
  HeartHandshake,
  Trophy,
  Sparkles,
  Activity,
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle,
  Gauge,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

// Importar el hook con toda la lógica
import { useSurveyEngine } from '@/hooks/useSurveyEngine';
import type { 
  Question, 
  SurveyResponse, 
  SurveyConfiguration,
  CategoryConfig 
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
// MAPA DE ICONOS PROFESIONAL EXTENDIDO
// ========================================
const iconMap: { [key: string]: React.ElementType } = {
  Users, Building, TrendingUp, Heart, Eye, Star, Target,
  UserPlus, Globe, DollarSign, Scale, Lightbulb, Zap,
  Shield, Rocket, MessageSquare, Award, Brain, 
  HeartHandshake, Trophy, Sparkles, Activity, 
  BarChart3, Briefcase, Gauge, TrendingDown
};

// ========================================
// ANIMACIONES PREMIUM SUTILES
// ========================================
const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -10 }
};

const scaleIn = {
  initial: { scale: 0.98, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  exit: { scale: 0.98, opacity: 0 }
};

// ========================================
// HEADER ULTRA COMPACTO (60px MAX)
// ========================================
const SurveyHeader: React.FC<{
  progress: { percentage: number; current: number; total: number };
  timeRemaining: number;
}> = ({ progress, timeRemaining }) => (
  <div className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
    <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
      {/* Logo pequeño */}
      <Image
        src="/images/focalizahr-logo2.svg"
        alt="FocalizaHR"
        width={80}
        height={20}
        className="opacity-70"
      />
      
      {/* Progress bar prominente */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-500">
          <span>{progress.current}/{progress.total}</span>
          <span>{timeRemaining} min</span>
        </div>
      </div>
      
      {/* Porcentaje */}
      <span className="text-sm font-medium text-cyan-400 min-w-[3rem] text-right">
        {progress.percentage}%
      </span>
    </div>
  </div>
);

// ========================================
// PORTADA ULTRA MINIMALISTA
// ========================================
const CategoryIntroCard: React.FC<{
  category: CategoryConfig & { id: string };
  onContinue: () => void;
  questionCount: number;
  currentSection: number;
  totalSections: number;
}> = ({ category, onContinue, questionCount, currentSection, totalSections }) => {
  const Icon = iconMap[category.icon] || Sparkles;
  
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-[calc(100vh-45px)] flex items-center justify-center p-4"
    >
      <div className="text-center max-w-md">
        {/* Sección número */}
        <p className="text-xs text-slate-600 mb-8">
          Sección {currentSection} de {totalSections}
        </p>
        
        {/* Icono minimalista */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl 
                      bg-slate-900 border border-slate-800 mb-6">
          <Icon className="w-6 h-6 text-cyan-500/70" />
        </div>
        
        {/* Título correcto */}
        <h2 className="text-xl font-light text-white mb-2">
          {category.displayName || 'Evaluación'}
        </h2>
        
        {/* Descripción breve */}
        <p className="text-sm text-slate-500 mb-4">
          {category.description || 'Tu opinión es importante'}
        </p>
        
        {/* Info mínima */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-600 mb-6">
          <span>{questionCount} preguntas</span>
          <span>•</span>
          <span>~{Math.ceil(questionCount * 0.5)} min</span>
        </div>
        
        {/* Motivacional sutil */}
        <p className="text-xs text-cyan-500/50 italic mb-8">
          "{category.motivationalText || 'Tu voz marca la diferencia'}"
        </p>
        
        {/* Botón minimalista */}
        <button
          onClick={onContinue}
          className="px-5 py-2 bg-slate-900 border border-cyan-600/30 
                   text-cyan-500 text-sm rounded-lg
                   hover:bg-slate-800 hover:border-cyan-600/50
                   transition-all duration-200 
                   inline-flex items-center gap-2"
        >
          Comenzar sección
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

// ========================================
// RATING SCALE ESTILO COMPONENTE ANTIGUO
// ========================================
const RatingScaleRenderer: React.FC<{
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}> = ({ response, updateResponse }) => {
  const ratings = [1, 2, 3, 4, 5];

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" className="space-y-4">
      <div className="flex justify-between gap-3">
        {ratings.map((value) => (
          <button
            key={value}
            onClick={() => updateResponse({ rating: value })}
            className={`
              flex-1 py-4 px-2 rounded-xl border-2 
              transition-all duration-200 transform hover:scale-105
              ${response.rating === value
                ? 'bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/50 border-slate-700 hover:border-cyan-600/50 hover:bg-slate-800/70'
              }
            `}
          >
            <span className={`text-2xl font-bold block
              ${response.rating === value ? 'text-cyan-400' : 'text-slate-400'}
            `}>
              {value}
            </span>
          </button>
        ))}
      </div>
      
      {/* Labels sutiles */}
      <div className="flex justify-between px-2">
        <span className="text-[10px] text-slate-500">Muy en desacuerdo</span>
        <span className="text-[10px] text-slate-500">Muy de acuerdo</span>
      </div>
    </motion.div>
  );
};

// ========================================
// MULTIPLE CHOICE MEJORADO
// ========================================
const MultipleChoiceRenderer: React.FC<{
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  validationRule?: any;
}> = ({ question, response, updateResponse, validationRule }) => {
  const selectedChoices = response.choiceResponse || [];
  const options = question.choiceOptions || [];
  const maxSelections = validationRule?.type === 'exact_count' 
    ? validationRule.params.count 
    : options.length;

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" className="space-y-4">
      {validationRule?.type === 'exact_count' && (
        <Alert className="border-cyan-500/30 bg-cyan-500/5">
          <AlertCircle className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-300 text-sm">
            Selecciona exactamente {validationRule.params.count} opciones
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedChoices.includes(option);
          const canSelect = selectedChoices.length < maxSelections || isSelected;
          
          return (
            <button
              key={option}
              disabled={!canSelect && !isSelected}
              className={`
                w-full p-4 rounded-xl border text-left
                transition-all duration-200
                ${isSelected
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-100'
                  : canSelect
                  ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-600/50 hover:bg-slate-800/70 text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }
              `}
              onClick={() => {
                if (isSelected) {
                  updateResponse({
                    choiceResponse: selectedChoices.filter(c => c !== option)
                  });
                } else if (canSelect) {
                  updateResponse({
                    choiceResponse: [...selectedChoices, option]
                  });
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{option}</span>
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${isSelected
                    ? 'border-cyan-500 bg-cyan-500'
                    : 'border-slate-600'
                  }
                `}>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {maxSelections > 1 && (
        <p className="text-center text-xs text-slate-500">
          {selectedChoices.length}/{maxSelections} seleccionadas
        </p>
      )}
    </motion.div>
  );
};

// ========================================
// SINGLE CHOICE RENDERER (NUEVO - SOLUCIÓN ARQUITECTÓNICA)
// ========================================
const SingleChoiceRenderer: React.FC<{
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}> = ({ question, response, updateResponse }) => {
  const selectedChoice = response.choiceResponse?.[0] || null;
  const options = question.choiceOptions || [];

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" className="space-y-3">
      <Alert className="border-purple-500/30 bg-purple-500/5">
        <Target className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-purple-300 text-sm">
          Selecciona una opción
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedChoice === option;
          
          return (
            <button
              key={option}
              className={`
                w-full p-4 rounded-xl border text-left
                transition-all duration-200
                ${isSelected
                  ? 'bg-purple-600/20 border-purple-500 text-purple-100'
                  : 'bg-slate-800/50 border-slate-700 hover:border-purple-600/50 hover:bg-slate-800/70 text-white'
                }
              `}
              onClick={() => {
                // Single choice: solo una opción seleccionada
                updateResponse({
                  choiceResponse: [option]
                });
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{option}</span>
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${isSelected
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-slate-600'
                  }
                `}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-slate-500">
        {selectedChoice ? '✓ Opción seleccionada' : 'Elige una opción'}
      </p>
    </motion.div>
  );
};

// ========================================
// TEXT OPEN SIMPLIFICADO
// ========================================
const TextOpenRenderer: React.FC<{
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}> = ({ response, updateResponse }) => (
  <motion.div variants={scaleIn} initial="initial" animate="animate" className="space-y-2">
    <Textarea
      value={response.textResponse || ''}
      onChange={(e) => updateResponse({ textResponse: e.target.value })}
      placeholder="Comparte tu experiencia..."
      className="min-h-[120px] w-full rounded-xl
               bg-slate-800/50 border border-slate-700 
               text-white placeholder:text-slate-500 
               focus:border-cyan-500/50 focus:bg-slate-800/70 
               focus:outline-none focus:ring-1 focus:ring-cyan-500/20
               transition-all duration-200 
               resize-none px-4 py-3 text-sm"
      maxLength={500}
    />
    <div className="flex justify-between text-xs px-1">
      <span className={`${(response.textResponse?.length || 0) >= 10 ? 'text-cyan-400' : 'text-slate-500'}`}>
        {(response.textResponse?.length || 0) >= 10 ? '✓ Válido' : 'Mín. 10 caracteres'}
      </span>
      <span className="text-slate-500">
        {response.textResponse?.length || 0}/500
      </span>
    </div>
  </motion.div>
);

// ========================================
// RATING MATRIX SIMPLIFICADO
// ========================================
const RatingMatrixRenderer: React.FC<{
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  selectedAspects: string[];
}> = ({ question, response, updateResponse, selectedAspects }) => {
  const matrixResponses = response.matrixResponses || {};
  const aspectsToRate = selectedAspects.length > 0 ? selectedAspects : (question.choiceOptions || []);

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" className="space-y-4">
      <Alert className="border-purple-500/30 bg-purple-500/5">
        <Trophy className="w-4 h-4 text-purple-400" />
        <AlertDescription className="text-purple-300 text-sm">
          Evalúa cada aspecto según tu experiencia personal
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {aspectsToRate.map((aspect) => (
          <div key={aspect} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-sm text-white mb-3">{aspect}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => {
                    updateResponse({
                      matrixResponses: {
                        ...matrixResponses,
                        [aspect]: rating
                      }
                    });
                  }}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${matrixResponses[aspect] === rating
                      ? 'bg-purple-600/30 border border-purple-500 text-purple-300'
                      : 'bg-slate-800/50 border border-slate-700 hover:border-purple-600/50 text-slate-400'
                    }
                  `}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <span className={`text-xs ${
          Object.keys(matrixResponses).length === aspectsToRate.length 
            ? 'text-green-400' : 'text-slate-500'
        }`}>
          {Object.keys(matrixResponses).length}/{aspectsToRate.length} evaluados
        </span>
      </div>
    </motion.div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL OPTIMIZADO
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
    getCurrentCategory,
    getCurrentValidationRule,
    handleSubmit,
    handleSave,
    getProgress
  } = useSurveyEngine(questions, configuration, onSubmit, onSave);

  const progress = getProgress();
  
  const [viewedCategories, setViewedCategories] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  
  const uniqueCategories = useMemo(() => {
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories);
  }, [questions]);
  
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

  useEffect(() => {
    if (currentQuestion) {
      const index = uniqueCategories.indexOf(currentQuestion.category);
      if (index !== -1) {
        setCurrentCategoryIndex(index);
      }
    }
  }, [currentQuestion, uniqueCategories]);

  const handleCategoryIntroContinue = () => {
    if (currentQuestion) {
      setViewedCategories(prev => new Set(prev).add(currentQuestion.category));
    }
  };

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
        return <div className="text-slate-500">Tipo de pregunta no soportado</div>;
    }
  };

  const timeRemaining = Math.ceil((questions.length - currentQuestionIndex) * 0.5);

  // Celebración sutil al alcanzar milestones
  const progressMilestone = useMemo(() => {
    if (progress.percentage >= 100) return "¡Completado!";
    if (progress.percentage >= 75) return "¡Casi terminas!";
    if (progress.percentage >= 50) return "¡Vas a la mitad!";
    if (progress.percentage >= 25) return "¡Buen comienzo!";
    return null;
  }, [progress.percentage]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header ultra compacto */}
      <SurveyHeader progress={progress} timeRemaining={timeRemaining} />

      {/* Contenido principal con padding para header */}
      <div className="pt-[60px]">
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
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                      {progressMilestone}
                    </Badge>
                  </motion.div>
                )}

                {/* Card de pregunta */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50 overflow-hidden">
                  {/* Header de pregunta minimalista */}
                  <div className="px-6 pt-6 pb-4 border-b border-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-cyan-400">
                        Pregunta {currentQuestionIndex + 1} de {questions.length}
                      </span>
                      <span className="text-xs text-slate-500">
                        {currentQuestion.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-light text-white leading-relaxed">
                      {currentQuestion.text}
                    </h3>
                  </div>

                  {/* Área de respuesta */}
                  <div className="p-6">
                    {renderQuestion()}
                  </div>
                </div>

                {/* Navegación */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={goToPrevious}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-700 
                             text-slate-400 rounded-xl hover:bg-slate-800 
                             hover:text-white disabled:opacity-30 
                             disabled:cursor-not-allowed transition-all duration-200
                             flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  {/* Dots indicator */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, questions.length) }, (_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === Math.min(currentQuestionIndex, 4)
                            ? 'w-6 bg-cyan-500' 
                            : i < currentQuestionIndex
                            ? 'w-1.5 bg-cyan-400/50'
                            : 'w-1.5 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    {onSave && (
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-slate-800/50 border border-purple-500/30 
                                 text-purple-400 rounded-xl hover:bg-slate-800 
                                 transition-all duration-200"
                      >
                        Guardar
                      </button>
                    )}

                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={goToNext}
                        disabled={!isCurrentResponseValid()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 
                                 text-white rounded-xl disabled:opacity-30 
                                 disabled:cursor-not-allowed transition-all duration-200
                                 flex items-center gap-2"
                      >
                        Siguiente
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={!isCurrentResponseValid() || isLoading || isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 
                                 hover:from-cyan-700 hover:to-purple-700 
                                 text-white rounded-xl disabled:opacity-30 
                                 disabled:cursor-not-allowed transition-all duration-200
                                 flex items-center gap-2"
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