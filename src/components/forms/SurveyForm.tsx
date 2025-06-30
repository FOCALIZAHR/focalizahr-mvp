// src/components/forms/SurveyForm.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Star,
  AlertCircle
} from 'lucide-react'

interface Question {
  id: number
  text: string
  category: string
  order: number
  responseType: 'rating_scale' | 'text_open'
}

interface SurveyResponse {
  questionId: number
  rating?: number
  textResponse?: string
}

interface SurveyFormProps {
  token: string
  questions: Question[]
  onSubmit: (responses: SurveyResponse[]) => void
  isSubmitting: boolean
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  token,
  questions,
  onSubmit,
  isSubmitting
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<SurveyResponse[]>([])

  // Inicializar responses
  useEffect(() => {
    const initialResponses = questions.map(q => ({
      questionId: q.id,
      rating: undefined,
      textResponse: ''
    }))
    setResponses(initialResponses)
  }, [questions])

  // Obtener respuesta actual
  const getCurrentResponse = () => {
    return responses[currentQuestion] || {
      questionId: questions[currentQuestion]?.id,
      rating: undefined,
      textResponse: ''
    }
  }

  // Actualizar respuesta
  const updateResponse = (updates: Partial<SurveyResponse>) => {
    setResponses(prev => prev.map((response, index) => 
      index === currentQuestion 
        ? { ...response, ...updates }
        : response
    ))
  }

  // Validar respuesta actual
  const isCurrentResponseValid = () => {
    const response = getCurrentResponse()
    const question = questions[currentQuestion]
    
    if (!question) return false

    if (question.responseType === 'rating_scale') {
      return response.rating !== undefined && response.rating >= 1 && response.rating <= 5
    }
    
    if (question.responseType === 'text_open') {
      return response.textResponse && response.textResponse.trim().length > 0
    }
    
    return false
  }

  // Renderizar pregunta de rating
  const renderRatingQuestion = () => {
    const response = getCurrentResponse()
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => updateResponse({ rating })}
              className={`
                w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center font-semibold
                ${response.rating === rating 
                  ? 'border-cyan-500 bg-cyan-500 text-white scale-110' 
                  : 'border-slate-300 text-slate-600 hover:border-cyan-400 hover:scale-105'
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
            <span className="text-sm text-gray-600">
              {response.rating ? `Calificación: ${response.rating}/5` : 'Selecciona una calificación'}
            </span>
          </div>
        </div>
        
        {/* Escala descriptiva */}
        <div className="flex justify-between text-xs text-gray-500 max-w-md mx-auto px-2">
          <span>Muy en desacuerdo</span>
          <span>Muy de acuerdo</span>
        </div>
      </div>
    )
  }

  // Renderizar pregunta abierta
  const renderTextQuestion = () => {
    const response = getCurrentResponse()
    
    return (
      <div className="space-y-4">
        <Textarea
          value={response.textResponse || ''}
          onChange={(e) => updateResponse({ textResponse: e.target.value })}
          placeholder="Escribe tu respuesta aquí..."
          className="min-h-[120px] resize-none"
          maxLength={500}
        />
        
        <div className="text-right text-sm text-gray-500">
          {(response.textResponse || '').length}/500 caracteres
        </div>
      </div>
    )
  }

  // Navegación
  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    const validResponses = responses.filter(r => 
      (r.rating !== undefined && r.rating >= 1 && r.rating <= 5) || 
      (r.textResponse && r.textResponse.trim().length > 0)
    )
    onSubmit(validResponses)
  }

  if (!questions || questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay preguntas disponibles para esta encuesta.
        </AlertDescription>
      </Alert>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Pregunta actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {question.text}
          </CardTitle>
          {question.category && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                {question.category}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Renderizar según tipo de pregunta */}
          {question.responseType === 'rating_scale' && renderRatingQuestion()}
          {question.responseType === 'text_open' && renderTextQuestion()}

          {/* Navegación */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={goToNext}
                disabled={!isCurrentResponseValid()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentResponseValid() || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Encuesta'}
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug info - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded border text-xs text-gray-600">
          Debug: Q{currentQuestion + 1} | Type: {question?.responseType} | Valid: {isCurrentResponseValid() ? '✅' : '❌'}
        </div>
      )}
    </div>
  )
}

export default SurveyForm