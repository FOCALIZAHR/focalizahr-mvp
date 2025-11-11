// src/app/encuesta/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SurveyForm from '@/components/forms/SurveyForm'
import ConditionalSurveyComponent from '@/components/forms/ConditionalSurveyComponent'
import UnifiedSurveyComponent from '@/components/survey/UnifiedSurveyComponent'
import { useSurveyConfiguration } from '@/hooks/useSurveyConfiguration'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  startDate: string
  endDate: string
  account?: {
    id: string
    companyName: string
    companyLogo?: string  // ← AGREGAR ESTA LÍNEA
    adminEmail: string
  }
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
    id: string
    text: string
    category: string
    questionOrder: number
    responseType: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale'
    choiceOptions?: string[] | null
    conditionalLogic?: any | null
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
  // AGREGAR DESPUÉS:
  const [isPermanentSurvey, setIsPermanentSurvey] = useState<boolean>(false)

  // Hook para obtener la configuración de la encuesta
  const { configuration } = useSurveyConfiguration(
    surveyData?.participant.campaign.campaignType.slug || null
  )

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
        // AGREGAR INMEDIATAMENTE DESPUÉS:
        // ✅ Detectar tipo de encuesta
        if (data.participant?.campaign?.campaignType?.isPermanent) {
          setIsPermanentSurvey(true)
          console.log('🎯 Encuesta PERMANENTE detectada (Onboarding/Exit)')
        } else {
          setIsPermanentSurvey(false)
          console.log('📊 Encuesta TEMPORAL detectada (Pulso/Experiencia)')
}
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
  const handleSubmit = async (responses: Array<{questionId: string, rating?: number, textResponse?: string}>) => {
    try {
      setIsSubmitting(true)

      // REEMPLAZAR POR:
      console.log('📤 Enviando respuestas:', responses)

      // ✅ Enrutador inteligente basado en isPermanent
      const submitUrl = isPermanentSurvey
        ? `/api/onboarding/survey/${token}/submit`  // Onboarding (motor inteligencia)
        : `/api/survey/${token}/submit`             // Legacy (temporal)

      console.log(`🎯 Enrutando submit a: ${submitUrl}`)

const response = await fetch(submitUrl, {
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Cargando encuesta...</h2>
          <p className="text-slate-300">Por favor espera un momento</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-400">Error al cargar encuesta</CardTitle>
            <CardDescription className="text-slate-300">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-red-950 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Encuesta no encontrada</h2>
          <p className="text-slate-300">El enlace puede haber expirado o ser inválido</p>
        </div>
      </div>
    )
  }

  // Estado completado
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-400">¡Encuesta completada!</CardTitle>
            <CardDescription className="text-slate-300">
              Gracias por tu participación en "{surveyData.participant.campaign.name}"
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-300 mb-4">
              Tus respuestas han sido registradas exitosamente. Los resultados ayudarán a mejorar el ambiente laboral.
            </p>
            <Alert className="mb-4 bg-green-950 border-green-800">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
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

  // LA PÁGINA SOLO PASA EL COMPONENTE, SIN CONTENIDO ADICIONAL
  return (
    <UnifiedSurveyComponent
      campaignId={campaign.id}
      participantToken={token}
      questions={questions}
      companyLogo={campaign.account?.companyLogo} // CORRECTO// AGREGAR ESTA LÍNEA
      configuration={configuration || undefined}
      campaignName={campaign.name}
      campaignTypeName={campaign.campaignType.name}
      companyName={campaign.account?.companyName || 'La empresa'}
      estimatedDuration={campaign.campaignType.estimatedDuration}
      questionCount={campaign.campaignType.questionCount}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}