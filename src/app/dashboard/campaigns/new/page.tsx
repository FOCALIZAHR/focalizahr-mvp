'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  ArrowRight,
  Clock,
  BarChart3,
  Zap,
  AlertTriangle,
  Info,
  Upload,
  Mail
} from 'lucide-react';

// Tipos para el wizard (extendiendo los existentes)
interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface CampaignFormData {
  // Paso 1: Información Básica
  name: string;
  description: string;
  campaignTypeId: string;
  startDate: string;
  endDate: string;
  
  // Paso 2: Participantes (Enfoque Concierge)
  estimatedParticipants: number;
  participantInstructions: string;
  
  // Paso 3: Configuración Final
  sendReminders: boolean;
  anonymousResults: boolean;
}

interface CampaignType {
  id: string;
  name: string;
  slug: string;
  description: string;
  estimatedDuration: number;
  questionCount: number;
  methodology: string;
  category: string;
  isRecommended?: boolean;
  features: {
    quickSetup: boolean;
    deepInsights: boolean;
    scientificBasis: boolean;
    timeEfficient: boolean;
  };
}

// Mock data para desarrollo (será reemplazado por API)
const mockCampaignTypes: CampaignType[] = [
  {
    id: 'ct1',
    name: 'Pulso Express',
    slug: 'pulso-express',
    description: 'Diagnóstico rápido de clima organizacional con metodología científica validada',
    estimatedDuration: 5,
    questionCount: 12,
    methodology: 'Litwin & Stringer adaptada',
    category: 'clima',
    isRecommended: true,
    features: {
      quickSetup: true,
      deepInsights: false,
      scientificBasis: true,
      timeEfficient: true
    }
  },
  {
    id: 'ct2',
    name: 'Experiencia Colaborador Full',
    slug: 'experiencia-full',
    description: 'Análisis integral de experiencia empleado con insights profundos',
    estimatedDuration: 15,
    questionCount: 35,
    methodology: 'Employee Experience Framework',
    category: 'experiencia',
    features: {
      quickSetup: false,
      deepInsights: true,
      scientificBasis: true,
      timeEfficient: false
    }
  }
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    campaignTypeId: '',
    startDate: '',
    endDate: '',
    estimatedParticipants: 0,
    participantInstructions: '',
    sendReminders: true,
    anonymousResults: true
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Información Básica',
      description: 'Tipo de estudio, nombre y fechas',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 2,
      title: 'Participantes',
      description: 'Configuración enfoque concierge',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 3,
      title: 'Confirmación',
      description: 'Revisar y crear campaña',
      completed: false,
      active: currentStep === 3
    }
  ];

  // Validaciones por paso
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'Nombre es requerido';
      if (!formData.campaignTypeId) errors.campaignTypeId = 'Selecciona un tipo de estudio';
      if (!formData.startDate) errors.startDate = 'Fecha de inicio requerida';
      if (!formData.endDate) errors.endDate = 'Fecha de fin requerida';
      
      // Validar fechas lógicas
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (start >= end) {
          errors.endDate = 'Fecha de fin debe ser posterior a inicio';
        }
        if (start < new Date()) {
          errors.startDate = 'Fecha de inicio no puede ser en el pasado';
        }
      }
    }

    if (step === 2) {
      if (formData.estimatedParticipants < 5) {
        errors.estimatedParticipants = 'Mínimo 5 participantes requeridos';
      }
      if (formData.estimatedParticipants > 500) {
        errors.estimatedParticipants = 'Máximo 500 participantes permitidos';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calcular duración automática
  const calculateDuration = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Navegación del wizard
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Obtener tipo de campaña seleccionado
  const selectedCampaignType = mockCampaignTypes.find(type => type.id === formData.campaignTypeId);

  // Envío del formulario (mock - será conectado a API)
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí se conectará con la API real
      console.log('Campaign data to submit:', formData);
      
      // Redirect al dashboard con mensaje de éxito
      router.push('/dashboard?created=true');
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsSubmitting(false);
      }
  };
  return (
    <div className="main-layout">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="focus-ring"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold focalizahr-gradient-text mb-2">
            Nueva Campaña de Medición
          </h1>
          <p className="text-muted-foreground">
            Crea una nueva medición de clima organizacional en 3 pasos simples
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="professional-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                      ${step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : step.active 
                          ? 'focalizahr-gradient text-white' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <Separator orientation="horizontal" className="flex-1 mx-4 mt-[-2rem]" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paso 1: Información Básica */}
        {currentStep === 1 && (
          <div className="space-y-6">
            
            {/* Selección Tipo de Campaña */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tipo de Estudio
                </CardTitle>
                <CardDescription>
                  Selecciona el tipo de medición que mejor se adapte a tus necesidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCampaignTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.campaignTypeId === type.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, campaignTypeId: type.id }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{type.name}</h3>
                          {type.isRecommended && (
                            <Badge className="bg-primary/20 text-primary">
                              <Zap className="h-3 w-3 mr-1" />
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {type.estimatedDuration} min
                          </div>
                          <div>{type.questionCount} preguntas</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {type.description}
                      </p>
                      
                      <div className="flex gap-2 flex-wrap">
                        {type.features.quickSetup && (
                          <Badge variant="outline">Setup Rápido</Badge>
                        )}
                        {type.features.timeEfficient && (
                          <Badge variant="outline">Tiempo Eficiente</Badge>
                        )}
                        {type.features.scientificBasis && (
                          <Badge variant="outline">Base Científica</Badge>
                        )}
                        {type.features.deepInsights && (
                          <Badge variant="outline">Insights Profundos</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {validationErrors.campaignTypeId && (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationErrors.campaignTypeId}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Información de Campaña */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información de la Campaña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Campaña *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Medición Clima Q2 2025"
                    className={validationErrors.name ? 'border-destructive' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el objetivo de esta medición..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fechas */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas de la Campaña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Fecha de Inicio *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className={validationErrors.startDate ? 'border-destructive' : ''}
                    />
                    {validationErrors.startDate && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endDate">Fecha de Fin *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className={validationErrors.endDate ? 'border-destructive' : ''}
                    />
                    {validationErrors.endDate && (
                      <p className="text-sm text-destructive mt-1">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Duración calculada */}
                {calculateDuration() > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Duración de la campaña: <strong>{calculateDuration()} días</strong>
                      {selectedCampaignType && (
                        <span className="ml-2">
                          • Tiempo estimado por participante: <strong>{selectedCampaignType.estimatedDuration} minutos</strong>
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 2: Participantes (Enfoque Concierge) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Enfoque Concierge Explicación */}
            <Alert className="border-primary bg-primary/5">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Enfoque Concierge FocalizaHR:</strong> Nuestro equipo se encargará de cargar y validar 
                los participantes por ti. Solo necesitas enviarnos la información básica.
              </AlertDescription>
            </Alert>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configuración de Participantes
                </CardTitle>
                <CardDescription>
                  Proporciona la información para que nuestro equipo configure tu campaña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Estimación de Participantes */}
                <div>
                  <Label htmlFor="estimatedParticipants">Número Estimado de Participantes *</Label>
                  <Input
                    id="estimatedParticipants"
                    type="number"
                    min="5"
                    max="500"
                    value={formData.estimatedParticipants || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimatedParticipants: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Ej: 25"
                    className={validationErrors.estimatedParticipants ? 'border-destructive' : ''}
                  />
                  {validationErrors.estimatedParticipants && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.estimatedParticipants}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Mínimo 5 participantes, máximo 500
                  </p>
                </div>

                {/* Proceso Concierge */}
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Proceso de Carga de Participantes
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</div>
                        <div>
                          <strong>Envía tu lista:</strong> Te enviaremos un email con instrucciones para enviar 
                          la lista de participantes (Excel/CSV con emails y datos opcionales)
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</div>
                        <div>
                          <strong>Procesamos y validamos:</strong> Nuestro equipo limpia los datos, 
                          elimina duplicados y configura la campaña
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</div>
                        <div>
                          <strong>Confirmas y activamos:</strong> Revisas la configuración final 
                          y activas la campaña cuando estés listo
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instrucciones Adicionales */}
                <div>
                  <Label htmlFor="participantInstructions">Instrucciones Adicionales (Opcional)</Label>
                  <textarea
                    id="participantInstructions"
                    value={formData.participantInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, participantInstructions: e.target.value }))}
                    placeholder="Ej: Incluir empleados de todas las sucursales, excluir practicantes, segmentar por departamento..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-called disabled:opacity-50 min-h-[100px]"
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Cualquier información adicional que ayude a nuestro equipo a configurar tu campaña
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {currentStep === 3 && (
          <div className="space-y-6">
            
            {/* Resumen de la Campaña */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Resumen de la Campaña</CardTitle>
                <CardDescription>
                  Revisa todos los detalles antes de crear tu campaña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Información Básica */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Información Básica</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Nombre:</dt>
                        <dd className="font-medium">{formData.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Tipo de Estudio:</dt>
                        <dd className="font-medium">{selectedCampaignType?.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Duración:</dt>
                        <dd className="font-medium">{calculateDuration()} días</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Fechas:</dt>
                        <dd className="font-medium">
                          {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Participantes</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Participantes Estimados:</dt>
                        <dd className="font-medium">{formData.estimatedParticipants}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Tiempo por Participante:</dt>
                        <dd className="font-medium">{selectedCampaignType?.estimatedDuration} minutos</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Total Preguntas:</dt>
                        <dd className="font-medium">{selectedCampaignType?.questionCount}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {formData.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {formData.description}
                    </p>
                  </div>
                )}

                {formData.participantInstructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Instrucciones Adicionales</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {formData.participantInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuraciones Finales */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle>Configuraciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sendReminders">Enviar Recordatorios</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar emails de recordatorio automáticos a participantes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="sendReminders"
                    checked={formData.sendReminders}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendReminders: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="anonymousResults">Resultados Anónimos</Label>
                    <p className="text-sm text-muted-foreground">
                      Los resultados no mostrarán información que permita identificar participantes individuales
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="anonymousResults"
                    checked={formData.anonymousResults}
                    onChange={(e) => setFormData(prev => ({ ...prev, anonymousResults: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Próximos Pasos */}
            <Alert className="border-primary bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Próximos Pasos:</strong> Al crear la campaña, te enviaremos un email con las 
                instrucciones para enviar la lista de participantes. Nuestro equipo la procesará 
                y te notificará cuando esté lista para activar.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="focus-ring"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                className="btn-gradient focus-ring"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`btn-gradient focus-ring ${isSubmitting ? 'btn-loading' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="btn-text">Creando Campaña...</span>
                  </>
                ) : (
                  <>
                    Crear Campaña
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}