'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Star,
  AlertCircle
} from 'lucide-react';

// Interfaces
interface Question {
  id: string;
  text: string;
  category: string;
  questionOrder: number;
  responseType: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale';
  choiceOptions?: string[] | null;
  conditionalLogic?: any | null;
}

interface SurveyResponse {
  questionId: string;
  rating?: number;
  textResponse?: string;
  choiceResponse?: string[];
  matrixResponses?: { [key: string]: number };
}

// Props del componente SurveyForm
interface SurveyFormProps {
  questions: Question[];
  onSubmit: (responses: SurveyResponse[]) => Promise<void>;
  isSubmitting?: boolean;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  questions,
  onSubmit,
  isSubmitting = false
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar responses
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
  const updateResponse = (questionId: string, update: Partial<SurveyResponse>) => {
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.questionId === questionId);
      const newResponses = [...prev];
      
      if (existingIndex >= 0) {
        newResponses[existingIndex] = { ...newResponses[existingIndex], ...update };
      } else {
        newResponses.push({ questionId, ...update });
      }
      
      return newResponses;
    });
  };

  // Validar si la respuesta actual es válida
  const isCurrentResponseValid = () => {
    const question = questions[currentQuestion];
    const response = getCurrentResponse();
    
    if (!question) return false;

    switch (question.responseType) {
      case 'rating_scale':
        return response.rating !== undefined && response.rating > 0;
      case 'text_open':
        return response.textResponse !== undefined && response.textResponse.trim().length > 0;
      case 'multiple_choice':
        return response.choiceResponse !== undefined && response.choiceResponse.length > 0;
      default:
        return true;
    }
  };

  // Renderizar pregunta de rating
  const renderRatingQuestion = (question: Question) => {
    const response = getCurrentResponse();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">
            {question.text}
          </h3>
        </div>
        
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => updateResponse(question.id, { rating })}
              className={`
                w-12 h-12 rounded-full border-2 font-semibold transition-all duration-200
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

  // Renderizar pregunta de texto
  const renderTextQuestion = (question: Question) => {
    const response = getCurrentResponse();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">
            {question.text}
          </h3>
        </div>
        
        <Textarea
          value={response.textResponse || ''}
          onChange={(e) => updateResponse(question.id, { textResponse: e.target.value })}
          placeholder="Escribe tu respuesta aquí..."
          className="min-h-[120px] bg-slate-800 border-slate-600 text-gray-100"
        />
      </div>
    );
  };

  // Renderizar pregunta según tipo
  const renderCurrentQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    switch (question.responseType) {
      case 'rating_scale':
        return renderRatingQuestion(question);
      case 'text_open':
        return renderTextQuestion(question);
      default:
        return (
          <div className="text-center text-gray-400">
            Tipo de pregunta no soportado: {question.responseType}
          </div>
        );
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

  // Enviar encuesta
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Filtrar solo respuestas válidas
      const validResponses = responses.filter(r => 
        r.rating || 
        (r.textResponse && r.textResponse.trim().length > 0) || 
        (r.choiceResponse && r.choiceResponse.length > 0)
      );
      
      await onSubmit(validResponses);
    } catch (error) {
      console.error('Error enviando encuesta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!questions.length) {
    return (
      <div className="text-center text-gray-400">
        No hay preguntas disponibles
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="text-center border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-cyan-400 border-cyan-400">
              {currentQuestionData?.category || 'General'}
            </Badge>
            <span className="text-sm text-gray-400">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2 bg-slate-800"
          />
        </CardHeader>

        <CardContent className="pt-8">
          {renderCurrentQuestion()}
          
          {/* Botones de navegación */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            <Button
              onClick={goToPrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

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
                disabled={!isCurrentResponseValid() || isLoading || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading || isSubmitting ? 'Enviando...' : 'Finalizar Encuesta'}
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug info - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="text-xs text-gray-400">
            Debug: Q{currentQuestion + 1} | Type: {currentQuestionData?.responseType} | Valid: {isCurrentResponseValid() ? '✅' : '❌'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyForm;