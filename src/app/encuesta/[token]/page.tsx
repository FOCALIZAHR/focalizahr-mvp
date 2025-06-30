// src/app/encuesta/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SurveyForm from '@/components/survey/SurveyForm'
import ConditionalSurveyComponent from '@/components/survey/ConditionalSurveyComponent';

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  startDate: string
  endDate: string
  campaignType: {
    id: string
    name: string
    slug: string
    description: string
    questionCount: number
    estimatedDuration: number
    methodology: string
    category: string
  }
}

interface Participant {
  id: string
  email: string
  invitedAt: string
  reminderSentAt?: string
  respondedAt?: string
  status: 'pending' | 'in_progress' | 'completed'
  campaign: Campaign
}

interface SurveyData {
  participant: Participant
  questions: Array<{
    id: number
    text: string
    category: string
    order: number
    responseType: 'rating_scale' | 'text_open'
  }>
}

export default function SurveyPage() {
  const params = useParams()
  const token = params.token as string

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Cargar datos de la encuesta
  useEffect(() => {
    async function loadSurveyData() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('🔍 Cargando datos survey para token:', token)

        const response = await fetch(`/api/survey/${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error cargando encuesta')
        }

        console.log('✅ Datos survey cargados:', data)

        // Verificar si ya está completada
        if (data.participant.status === 'completed') {
          setIsCompleted(true)
        }

        setSurveyData(data)

      } catch (err) {
        console.error('❌ Error cargando survey:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSurveyData()
    }
  }, [token])

  // Manejar envío del formulario
  const handleSubmit = async (responses: Array<{questionId: number, rating?: number, textResponse?: string}>) => {
    try {
      setIsSubmitting(true)

      console.log('📤 Enviando respuestas:', responses)

      const response = await fetch(`/api/survey/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error enviando respuestas')
      }

      console.log('✅ Respuestas enviadas exitosamente')
      setIsCompleted(true)

    } catch (err) {
      console.error('❌ Error enviando respuestas:', err)
      setError(err instanceof Error ? err.message : 'Error enviando respuestas')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cargando encuesta...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-900">Error al cargar encuesta</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Si este problema persiste, contacta con tu departamento de RRHH.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!surveyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Encuesta no encontrada</h2>
          <p className="text-gray-600">El enlace puede haber expirado o ser inválido</p>
        </div>
      </div>
    )
  }

  // Estado completado
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-900">¡Encuesta completada!</CardTitle>
            <CardDescription>
              Gracias por tu participación en "{surveyData.participant.campaign.name}"
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Tus respuestas han sido registradas exitosamente. Los resultados ayudarán a mejorar el ambiente laboral.
            </p>
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Tu participación es completamente anónima y confidencial.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { participant, questions } = surveyData
  const { campaign } = participant

  // LÓGICA CONDICIONAL CRÍTICA: Determinar qué componente usar
  const isRetentionPredictive = campaign.campaignType.slug === 'retencion-predictiva'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información de la campaña */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                {campaign.campaignType.name}
              </Badge>
              <div className="text-sm text-gray-500 text-right">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>~{campaign.campaignType.estimatedDuration} min</span>
                </div>
                <div className="mt-1">
                  {campaign.campaignType.questionCount} preguntas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Información metodológica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la encuesta</CardTitle>
              <CardDescription>
                Metodología: {campaign.campaignType.methodology}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Confidencialidad garantizada:</strong> Tus respuestas son completamente anónimas. 
                  Los resultados se analizan en conjunto para proteger tu privacidad.
                </AlertDescription>
              </Alert>

              {isRetentionPredictive && (
                <Alert className="border-cyan-200 bg-cyan-50">
                  <AlertCircle className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-cyan-800">
                    <strong>Encuesta estratégica:</strong> Este instrumento está diseñado para identificar 
                    y predecir las causas de rotación de talento, ayudando a crear un mejor ambiente laboral.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Componente de encuesta - LÓGICA CONDICIONAL IMPLEMENTADA */}
          <Card>
            <CardContent className="pt-6">
              {isRetentionPredictive ? (
                <ConditionalSurveyComponent
                  token={token}
                  questions={questions}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <SurveyForm
                  token={token}
                  questions={questions}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </CardContent>
          </Card>

          {/* Footer con información adicional */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>
              Si tienes dudas sobre esta encuesta, contacta con tu departamento de RRHH.
            </p>
            <p className="mt-2">
              Encuesta válida hasta: {new Date(campaign.endDate).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}