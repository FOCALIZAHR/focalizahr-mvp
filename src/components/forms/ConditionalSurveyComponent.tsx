// SURVEY COMPONENT - Lógica Condicional Q2→Q3
// Adaptación para FocalizaHR Retención Predictiva
// Archivo: src/components/survey/ConditionalSurveyComponent.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Star,
  AlertCircle,
  Target,
  Users
} from 'lucide-react';

// Interfaces para las preguntas
interface Question {
  id: string;
  text: string;
  category: string;
  questionOrder: number;
  responseType: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale';
  choiceOptions?: string[];
  conditionalLogic?: {
    dependsOnQuestion: number;
    matrixType: string;
  };
}

interface SurveyResponse {
  questionId: string;
  rating?: number;
  textResponse?: string;
  choiceResponse?: string[];
  matrixResponses?: { [key: string]: number };
}

// Props del componente
interface ConditionalSurveyProps {
  campaignId: string;
  participantToken: string;
  questions: Question[];
  onSubmit: (responses: SurveyResponse[]) => void;
  onSave?: (responses: SurveyResponse[]) => void;
}

const ConditionalSurveyComponent: React.FC<ConditionalSurveyProps> = ({
  campaignId,
  participantToken,
  questions,
  onSubmit,
  onSave
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Opciones para Q2 (Valoración Aspectos)
  const aspectOptions = [
    'Oportunidades de Crecimiento',
    'Flexibilidad y Equilibrio', 
    'Autonomía y Confianza',
    'Reconocimiento y Valoración',
    'Liderazgo de Apoyo',
    'Compensación y Beneficios'
  ];

  // Inicializar responses array
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

  // Obtener respuesta actual
  const getCurrentResponse = () => {
    return responses[currentQuestion] || {
      questionId: questions[currentQuestion]?.id,
      rating: undefined,
      textResponse: '',
      choiceResponse: [],
      matrixResponses: {}
    };
  };

  // Actualizar respuesta
  const updateResponse = (update: Partial<SurveyResponse>) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = {
      ...newResponses[currentQuestion],
      ...update
    };
    setResponses(newResponses);

    // Si es Q2, actualizar aspectos seleccionados para Q3
    if (questions[currentQuestion]?.questionOrder === 2 && update.choiceResponse) {
      setSelectedAspects(update.choiceResponse);
    }
  };

  // Validar respuesta actual
  const isCurrentResponseValid = () => {
    const question = questions[currentQuestion];
    const response = getCurrentResponse();

    switch (question.responseType) {
      case 'text_open':
        return response.textResponse && response.textResponse.trim().length > 0;
      case 'multiple_choice':
        return response.choiceResponse && response.choiceResponse.length === 3; // Exactamente 3
      case 'rating_matrix_conditional':
        const requiredAspects = selectedAspects.length;
        const completedAspects = Object.keys(response.matrixResponses || {}).length;
        return completedAspects === requiredAspects && requiredAspects > 0;
      case 'rating_scale':
      case 'rating':  // ← AGREGAR ESTA LÍNEA
        return response.rating && response.rating >= 1 && response.rating <= 5;
      default:
        return false;
    }
  };

  // Renderizar pregunta text_open (Q1)
  const renderTextOpenQuestion = () => {
    const response = getCurrentResponse();
    return (
      <div className="space-y-4">
        <Textarea
          value={response.textResponse || ''}
          onChange={(e) => updateResponse({ textResponse: e.target.value })}
          placeholder="Escribe tu respuesta aquí... (mínimo 10 caracteres)"
          className="min-h-[120px] bg-slate-800 border-slate-600 text-white resize-none"
          maxLength={500}
        />
        <div className="text-sm text-gray-400 text-right">
          {response.textResponse?.length || 0}/500 caracteres
        </div>
      </div>
    );
  };

  // Renderizar pregunta multiple_choice (Q2)
  const renderMultipleChoiceQuestion = () => {
    const response = getCurrentResponse();
    const selectedChoices = response.choiceResponse || [];

    return (
      <div className="space-y-4">
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Target className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            <strong>Instrucción:</strong> Selecciona exactamente 3 aspectos que más valores. 
            Seleccionados: {selectedChoices.length}/3
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aspectOptions.map((option) => {
            const isSelected = selectedChoices.includes(option);
            const canSelect = selectedChoices.length < 3 || isSelected;

            return (
              <div
                key={option}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-100' 
                    : canSelect 
                      ? 'border-slate-600 bg-slate-800 hover:border-slate-500 text-white'
                      : 'border-slate-700 bg-slate-900 text-gray-500 cursor-not-allowed'
                  }
                `}
                onClick={() => {
                  if (!canSelect && !isSelected) return;
                  
                  let newChoices: string[];
                  if (isSelected) {
                    newChoices = selectedChoices.filter(c => c !== option);
                  } else {
                    newChoices = [...selectedChoices, option];
                  }
                  updateResponse({ choiceResponse: newChoices });
                }}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={isSelected}
                    disabled={!canSelect && !isSelected}
                    readOnly
                  />
                  <span className="font-medium">{option}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar pregunta rating_matrix_conditional (Q3)
  const renderRatingMatrixQuestion = () => {
    const response = getCurrentResponse();
    const matrixResponses = response.matrixResponses || {};

    if (selectedAspects.length === 0) {
      return (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            Primero debes completar la pregunta anterior para continuar.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            <strong>Evaluando los aspectos que seleccionaste:</strong> {selectedAspects.join(', ')}
          </AlertDescription>
        </Alert>

        {selectedAspects.map((aspect) => (
          <div key={aspect} className="p-4 rounded-lg border border-slate-600 bg-slate-800">
            <div className="mb-3">
              <h4 className="font-medium text-white">{aspect}</h4>
              <p className="text-sm text-gray-400">
                ¿Cómo calificarías la calidad con la que la empresa entregó este aspecto?
              </p>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-400">Muy malo</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      const newMatrix = { ...matrixResponses, [aspect]: rating };
                      updateResponse({ matrixResponses: newMatrix });
                    }}
                    className={`
                      w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                      ${matrixResponses[aspect] === rating
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : 'border-slate-500 text-slate-400 hover:border-cyan-400'
                      }
                    `}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">Excelente</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar pregunta rating_scale (Q4-Q7)
  const renderRatingScaleQuestion = () => {
    const response = getCurrentResponse();
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Totalmente en desacuerdo</span>
          <span className="text-sm text-gray-400">Totalmente de acuerdo</span>
        </div>
        
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => updateResponse({ rating })}
              className={`
                w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center text-lg font-semibold
                ${response.rating === rating
                  ? 'border-cyan-500 bg-cyan-500 text-white scale-110'
                  : 'border-slate-500 text-slate-400 hover:border-cyan-400 hover:scale-105'
                }
              `}
            >
              {rating}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-300">
              {response.rating ? `Calificación: ${response.rating}/5` : 'Selecciona una calificación'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar pregunta según tipo
  const renderCurrentQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    switch (question.responseType) {
      case 'text_open':
        return renderTextOpenQuestion();
      case 'multiple_choice':
        return renderMultipleChoiceQuestion();
      case 'rating_matrix_conditional':
        return renderRatingMatrixQuestion();
      case 'rating_scale':
        return renderRatingScaleQuestion();
      default:
        return <div>Tipo de pregunta no soportado</div>;
    }
  };

  // Navegación
  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(responses.filter(r => 
        r.rating || r.textResponse || (r.choiceResponse && r.choiceResponse.length > 0) || 
        (r.matrixResponses && Object.keys(r.matrixResponses).length > 0)
      ));
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">
              FocalizaHR Retención Predictiva
            </h1>
          </div>
          <p className="text-gray-400">
            Instrumento estratégico para identificar causas de rotación de talento
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Pregunta {currentQuestion + 1} de {questions.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                Q{question?.questionOrder}
              </Badge>
              <CardTitle className="text-white text-lg leading-relaxed">
                {question?.text}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {renderCurrentQuestion()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-slate-600 text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {onSave && (
              <Button
                onClick={() => onSave(responses)}
                variant="outline"
                className="border-slate-600 text-gray-300"
              >
                Guardar progreso
              </Button>
            )}

            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={goToNext}
                disabled={!isCurrentResponseValid()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentResponseValid() || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Enviando...' : 'Finalizar Encuesta'}
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Debug info - Remover en producción */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700">
            <div className="text-xs text-gray-400">
              Debug: Q{currentQuestion + 1} | Type: {question?.responseType} | Valid: {isCurrentResponseValid() ? '✅' : '❌'}
              {currentQuestion === 1 && (
                <div>Selected: {selectedAspects.join(', ')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionalSurveyComponent;