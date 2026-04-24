'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Mail,
  UserCheck
} from 'lucide-react';

// Wizard Paso 3B Components
import {
  ParticipantCriteriaSelector,
  ParticipantEligibilityPreview,
  ParticipantManualAdjustment,
  calculateEligibility,
  DEFAULT_CRITERIA,
  type InclusionCriteria,
  type EligibleEmployee,
  type Department,
  type ManualOverrides,
  type ManualOverride
} from '@/components/campaigns/wizard';
import { JobClassificationCinema } from '@/components/job-classification';
import EmployeeSyncWizard from '@/components/admin/employees/EmployeeSyncWizard';

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

// Slugs de productos employee-based que requieren selector 360° (Jefe→Colaborador, etc.).
// El resto de productos employee-based (pulso-ambientes-sanos, y futuros Pulso Express,
// Experiencia Full, Retención cuando migren) van directo: crear → generar participants.
const SLUGS_CON_TIPOS_EVALUACION = ['performance-evaluation'];

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
  flowType?: 'standard' | 'employee-based';  // Paso 3B support
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ════════════════════════════════════════════════════════════════════════════
  // PASO 3B: Employee-Based Flow State
  // ════════════════════════════════════════════════════════════════════════════
  const [employees, setEmployees] = useState<EligibleEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [criteria, setCriteria] = useState<InclusionCriteria>(DEFAULT_CRITERIA);
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({});
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showEmployeeSyncWizard, setShowEmployeeSyncWizard] = useState(false);

  // ════════════════════════════════════════════════════════════════════════════
  // TIPOS DE EVALUACIÓN 360°
  // ════════════════════════════════════════════════════════════════════════════
  const [evaluationTypes, setEvaluationTypes] = useState({
    includesManager: true,
    includesSelf: false,
    includesUpward: false,
    includesPeer: false
  });

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS STATE: Pantalla de éxito después de crear Campaign + Cycle
  // ════════════════════════════════════════════════════════════════════════════
  const [creationSuccess, setCreationSuccess] = useState<{
    campaign: { id: string; name: string };
    cycle?: { id: string; name: string; hasSnapshot: boolean };
    eligibleCount: number;
  } | null>(null);

  // Nombre del usuario actual para auditoría (en producción vendría del contexto de auth)
  const currentUserName = 'Admin'; // TODO: Obtener del contexto de autenticación

  // Cargar tipos de campaña desde API
  useEffect(() => {
    const fetchCampaignTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const token = localStorage.getItem('focalizahr_token');
        
        if (!token) {
          console.error('No authentication token found');
          setCampaignTypes(mockCampaignTypes);
          return;
        }

        const response = await fetch('/api/campaign-types', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.campaignTypes) {
          setCampaignTypes(data.campaignTypes);
          console.log('✅ Campaign types loaded:', data.campaignTypes.length);
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        console.error('❌ Error loading campaign types:', error);
        // Fallback a mock data si API falla
        setCampaignTypes(mockCampaignTypes);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchCampaignTypes();
  }, []);

  // ════════════════════════════════════════════════════════════════════════════
  // PASO 3B: Cargar empleados cuando flowType es 'employee-based'
  // ════════════════════════════════════════════════════════════════════════════
  const isEmployeeBasedFlow = useMemo(() => {
    const selected = (campaignTypes.length > 0 ? campaignTypes : mockCampaignTypes)
      .find(type => type.id === formData.campaignTypeId);
    return selected?.flowType === 'employee-based';
  }, [formData.campaignTypeId, campaignTypes]);

  // Solo algunos flows employee-based usan selector 360°. Ej: Performance sí,
  // Ambiente Sano no (todos participan anónimamente).
  const hasEvaluationTypes = useMemo(() => {
    const selected = (campaignTypes.length > 0 ? campaignTypes : mockCampaignTypes)
      .find(type => type.id === formData.campaignTypeId);
    return !!selected && SLUGS_CON_TIPOS_EVALUACION.includes(selected.slug);
  }, [formData.campaignTypeId, campaignTypes]);

  useEffect(() => {
    if (!isEmployeeBasedFlow || employees.length > 0) return;

    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        const token = localStorage.getItem('focalizahr_token');

        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch('/api/admin/employees?limit=1000&status=ACTIVE', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Mapear empleados al formato EligibleEmployee
          const mappedEmployees: EligibleEmployee[] = data.data.map((emp: any) => ({
            id: emp.id,
            fullName: emp.fullName,
            email: emp.email,
            nationalId: emp.nationalId,
            position: emp.position,
            hireDate: emp.hireDate,
            status: emp.status,
            managerId: emp.managerId,
            department: emp.department ? {
              id: emp.department.id,
              displayName: emp.department.displayName
            } : null
          }));
          setEmployees(mappedEmployees);

          // Extraer departamentos únicos
          const deptMap = new Map<string, Department>();
          mappedEmployees.forEach(emp => {
            if (emp.department) {
              deptMap.set(emp.department.id, emp.department);
            }
          });
          setDepartments(Array.from(deptMap.values()));

          console.log('✅ Employees loaded for wizard:', mappedEmployees.length);
        }
      } catch (error) {
        console.error('❌ Error loading employees:', error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [isEmployeeBasedFlow, employees.length]);

  // Handler para cambios en criterios
  const handleCriteriaChange = useCallback((newCriteria: InclusionCriteria) => {
    setCriteria(newCriteria);
  }, []);

  // Handler para exclusiones manuales con auditoría
  const handleManualExclusionChange = useCallback((
    employeeId: string,
    excluded: boolean,
    originalStatus: 'eligible' | 'excluded_by_criteria' = 'eligible'
  ) => {
    setManualOverrides(prev => {
      const newOverrides = { ...prev };

      if (excluded || originalStatus === 'excluded_by_criteria') {
        // Agregar o actualizar override
        newOverrides[employeeId] = {
          excluded,
          updatedBy: currentUserName,
          updatedAt: new Date(),
          originalStatus
        };
      } else {
        // Si vuelve a su estado original, eliminar el override
        delete newOverrides[employeeId];
      }

      return newOverrides;
    });
  }, [currentUserName]);

  // Convertir manualOverrides a array de IDs excluidos para compatibilidad con calculateEligibility
  const manualExclusionIds = useMemo(() => {
    return Object.entries(manualOverrides)
      .filter(([, override]) => override.excluded)
      .map(([id]) => id);
  }, [manualOverrides]);

  // Calcular elegibles para employee-based flow
  const eligibilitySummary = useMemo(() => {
    if (!isEmployeeBasedFlow || employees.length === 0) {
      return { eligible: 0, excluded: 0, total: 0 };
    }

    let eligible = 0;
    let excluded = 0;

    for (const emp of employees) {
      const result = calculateEligibility(emp, criteria, manualExclusionIds);
      if (result.eligible) {
        eligible++;
      } else {
        excluded++;
      }
    }

    return { eligible, excluded, total: employees.length };
  }, [employees, criteria, manualExclusionIds, isEmployeeBasedFlow]);

  // Total de pasos depende del flow type
  const totalSteps = isEmployeeBasedFlow ? 4 : 3;
  const confirmStep = totalSteps; // Último paso siempre es confirmación

  const steps: WizardStep[] = isEmployeeBasedFlow
    ? [
        { id: 1, title: 'Información Básica', description: 'Tipo de estudio, nombre y fechas', completed: currentStep > 1, active: currentStep === 1 },
        { id: 2, title: 'Participantes', description: 'Criterios de elegibilidad', completed: currentStep > 2, active: currentStep === 2 },
        { id: 3, title: 'Cargos', description: 'Clasificación de cargos', completed: currentStep > 3, active: currentStep === 3 },
        { id: 4, title: 'Confirmación', description: 'Revisar y crear campaña', completed: false, active: currentStep === 4 }
      ]
    : [
        { id: 1, title: 'Información Básica', description: 'Tipo de estudio, nombre y fechas', completed: currentStep > 1, active: currentStep === 1 },
        { id: 2, title: 'Participantes', description: 'Configuración enfoque concierge', completed: currentStep > 2, active: currentStep === 2 },
        { id: 3, title: 'Confirmación', description: 'Revisar y crear campaña', completed: false, active: currentStep === 3 }
      ];

  // Validaciones por paso
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    setSubmitError(null); // Limpiar error de submit

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
      if (isEmployeeBasedFlow) {
        // Validación para employee-based flow
        if (eligibilitySummary.eligible < 5) {
          errors.participants = 'Se requieren al menos 5 participantes elegibles';
        }
        // Solo aplica a productos con selector 360° (ej. performance-evaluation).
        if (hasEvaluationTypes) {
          if (!evaluationTypes.includesManager && !evaluationTypes.includesSelf &&
              !evaluationTypes.includesUpward && !evaluationTypes.includesPeer) {
            errors.evaluationTypes = 'Selecciona al menos un tipo de evaluación';
          }
        }
      } else {
        // Validación para concierge flow
        if (formData.estimatedParticipants < 5) {
          errors.estimatedParticipants = 'Mínimo 5 participantes requeridos';
        }
        if (formData.estimatedParticipants > 500) {
          errors.estimatedParticipants = 'Máximo 500 participantes permitidos';
        }
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
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Obtener tipo de campaña seleccionado
  const selectedCampaignType = (campaignTypes.length > 0 ? campaignTypes : mockCampaignTypes).find(type => type.id === formData.campaignTypeId);

  // Envío del formulario - CONECTADO CON API REAL
  const handleSubmit = async () => {
    if (!validateStep(confirmStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 🔥 INTEGRACIÓN REAL CON BACKEND API
      const token = localStorage.getItem('focalizahr_token');
      
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      // Preparar datos para la API según schema existente
      const campaignData: Record<string, any> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        campaignTypeId: formData.campaignTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        sendReminders: formData.sendReminders,
        anonymousResults: formData.anonymousResults
      };

      // Si es employee-based flow, incluir los IDs de empleados elegibles y auditoría
      if (isEmployeeBasedFlow) {
        const eligibleEmployeeIds: string[] = [];
        for (const emp of employees) {
          const result = calculateEligibility(emp, criteria, manualExclusionIds);
          if (result.eligible) {
            eligibleEmployeeIds.push(emp.id);
          }
        }
        campaignData.eligibleEmployeeIds = eligibleEmployeeIds;
        campaignData.inclusionCriteria = criteria;
        // Incluir auditoría de overrides manuales
        if (Object.keys(manualOverrides).length > 0) {
          campaignData.manualOverrides = manualOverrides;
        }
      }

      console.log('🚀 Enviando datos a API:', campaignData);

      // LLAMADA REAL A LA API
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Campaña creada exitosamente:', responseData);

      // ✨ ÉXITO: Procesar respuesta del backend
      const createdCampaign = responseData.campaign;

      // Guardar ID de campaña para próximos pasos del enfoque concierge
      if (createdCampaign?.id) {
        localStorage.setItem('lastCreatedCampaignId', createdCampaign.id);
      }

      // ════════════════════════════════════════════════════════════════
      // EMPLOYEE-BASED CON SELECTOR 360° (performance-evaluation):
      // Crear PerformanceCycle asociado. El API genera competencySnapshot.
      // ════════════════════════════════════════════════════════════════
      if (hasEvaluationTypes) {
        console.log('🎯 Creando PerformanceCycle para evaluación de desempeño...');

        const cycleResponse = await fetch('/api/admin/performance-cycles', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            campaignId: createdCampaign.id,
            name: formData.name.trim(),
            description: formData.description?.trim() || `Ciclo de evaluación: ${formData.name}`,
            startDate: formData.startDate,
            endDate: formData.endDate,
            cycleType: 'QUARTERLY',
            ...evaluationTypes,
            anonymousResults: formData.anonymousResults,
            minSubordinates: 3
          })
        });

        const cycleData = await cycleResponse.json();

        if (!cycleResponse.ok) {
          // Campaign ya fue creada, pero cycle falló - mostrar warning
          console.error('⚠️ Error creando PerformanceCycle:', cycleData);
          setCreationSuccess({
            campaign: { id: createdCampaign.id, name: createdCampaign.name },
            cycle: undefined,
            eligibleCount: eligibilitySummary.eligible
          });
          return;
        }

        console.log('✅ PerformanceCycle creado:', cycleData);

        const createdCycle = cycleData.data;
        const hasSnapshot = createdCycle?.competencySnapshot &&
          Array.isArray(createdCycle.competencySnapshot) &&
          createdCycle.competencySnapshot.length > 0;

        // Mostrar pantalla de éxito con ambos recursos
        setCreationSuccess({
          campaign: { id: createdCampaign.id, name: createdCampaign.name },
          cycle: {
            id: createdCycle.id,
            name: createdCycle.name,
            hasSnapshot
          },
          eligibleCount: eligibilitySummary.eligible
        });

        console.log(`🎉 Creación completa: Campaign ${createdCampaign.id} + Cycle ${createdCycle.id}`);
        console.log(`📊 CompetencySnapshot: ${hasSnapshot ? 'SÍ' : 'NO'}`);
        return;
      }

      // ════════════════════════════════════════════════════════════════
      // EMPLOYEE-BASED SIN SELECTOR 360° (ej. pulso-ambientes-sanos):
      // Generar Participants directo desde Employee ACTIVE y redirigir.
      // ════════════════════════════════════════════════════════════════
      if (isEmployeeBasedFlow) {
        console.log('🌿 Generando participants desde nómina (Ambiente Sano)...');

        const genResponse = await fetch('/api/compliance/generate-participants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ campaignId: createdCampaign.id })
        });

        const genData = await genResponse.json();
        if (!genResponse.ok) {
          console.error('⚠️ Error generando participants:', genData);
          setSubmitError(
            genData?.error ??
              'Campaña creada, pero falló la generación de participantes. Revisa la nómina.'
          );
          return;
        }

        console.log('✅ Participants generados:', genData);

        const redirectUrl = `/dashboard?` + new URLSearchParams({
          created: 'true',
          campaign: createdCampaign.id,
          name: createdCampaign.name
        }).toString();
        router.push(redirectUrl);
        return;
      }

      // STANDARD FLOW: Redirect al dashboard
      const redirectUrl = `/dashboard?` + new URLSearchParams({
        created: 'true',
        campaign: createdCampaign.id,
        name: createdCampaign.name,
        step: 'concierge-instructions'
      }).toString();

      router.push(redirectUrl);

    } catch (error) {
      console.error('❌ Error creating campaign:', error);
      
      // Manejo específico de errores
      let errorMessage = 'Error desconocido al crear la campaña';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          router.push('/');
          return;
        } else if (error.message.includes('409')) {
          errorMessage = 'Ya existe una campaña con este nombre o se alcanzó el límite de campañas activas.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Datos de campaña inválidos. Revisa la información ingresada.';
        } else {
          errorMessage = error.message;
        }
      }

      // Mostrar error en la UI
      setSubmitError(errorMessage);

      // Scroll to top para mostrar error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PANTALLA DE ÉXITO: Employee-Based Flow completado
  // ════════════════════════════════════════════════════════════════════════════
  if (creationSuccess) {
    return (
      <div className="main-layout">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="professional-card">
            <CardContent className="p-8 text-center">
              {/* Icono de éxito */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold mb-2">
                ¡Evaluación de Desempeño Creada!
              </h1>
              <p className="text-muted-foreground mb-6">
                Se han creado los recursos necesarios para tu ciclo de evaluación.
              </p>

              {/* Resumen de lo creado */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Campaña:</span>{' '}
                    <span className="text-muted-foreground">{creationSuccess.campaign.name}</span>
                  </div>
                </div>

                {creationSuccess.cycle ? (
                  <>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Ciclo de Performance:</span>{' '}
                        <span className="text-muted-foreground">{creationSuccess.cycle.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {creationSuccess.cycle.hasSnapshot ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">Competency Snapshot:</span>{' '}
                        <span className={creationSuccess.cycle.hasSnapshot ? 'text-green-500' : 'text-amber-500'}>
                          {creationSuccess.cycle.hasSnapshot ? 'Generado ✓' : 'No disponible (inicializa competencias primero)'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Ciclo de Performance:</span>{' '}
                      <span className="text-amber-500">Error al crear (puedes crearlo manualmente)</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Participantes elegibles:</span>{' '}
                    <span className="text-cyan-500 font-semibold">{creationSuccess.eligibleCount}</span>
                  </div>
                </div>
              </div>

              {/* Próximos pasos */}
              <Alert className="mb-6 text-left">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Próximos pasos:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Configura las asignaciones de evaluadores</li>
                    <li>Activa el ciclo cuando estés listo</li>
                    <li>Los evaluadores recibirán sus notificaciones</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Ir al Dashboard
                </Button>
                <Button
                  className="btn-gradient"
                  onClick={() => router.push(`/dashboard/campaigns/${creationSuccess.campaign.id}/monitor`)}
                >
                  Ver Campaña
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Crea una nueva medición de clima organizacional en {totalSteps} pasos simples
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
                {isLoadingTypes ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-48 mb-3"></div>
                          <div className="flex gap-2">
                            <div className="h-6 bg-muted rounded w-16"></div>
                            <div className="h-6 bg-muted rounded w-20"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  (campaignTypes.length > 0 ? campaignTypes : mockCampaignTypes).map((type) => (
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
                  ))
                )}
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
                 <Calendar className="h-5 w-5 text-primary" />
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

        {/* Paso 2: Participantes */}
        {currentStep === 2 && (
          <div className="space-y-6">

            {/* ═══════════════════════════════════════════════════════════════════
                PASO 3B: EMPLOYEE-BASED FLOW (Criterios + Preview)
            ═══════════════════════════════════════════════════════════════════ */}
            {isEmployeeBasedFlow ? (
              <>
                {/* Header explicativo */}
                <Alert className="border-cyan-500/50 bg-cyan-500/5">
                  <UserCheck className="h-4 w-4 text-cyan-400" />
                  <AlertDescription>
                    <strong>Selección por Criterios:</strong> Define criterios de inclusión y el sistema
                    seleccionará automáticamente a los empleados elegibles de tu base de datos.
                  </AlertDescription>
                </Alert>

                {isLoadingEmployees ? (
                  <Card className="professional-card">
                    <CardContent className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando empleados...</p>
                    </CardContent>
                  </Card>
                ) : employees.length === 0 ? (
                  <>
                    <Card className="professional-card">
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Sin Empleados</h3>
                        <p className="text-muted-foreground mb-4">
                          No hay empleados registrados en tu empresa. Carga tu nómina
                          para continuar con la creación de la campaña.
                        </p>
                        <Button
                          className="btn-gradient"
                          onClick={() => setShowEmployeeSyncWizard(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Cargar Colaboradores
                        </Button>
                      </CardContent>
                    </Card>

                    {showEmployeeSyncWizard && (
                      <EmployeeSyncWizard
                        onComplete={async () => {
                          setShowEmployeeSyncWizard(false);
                          setIsLoadingEmployees(true);
                          try {
                            const token = localStorage.getItem('focalizahr_token');
                            const response = await fetch('/api/admin/employees?limit=1000&status=ACTIVE', {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            const data = await response.json();
                            if (data.success && data.data) {
                              const mappedEmployees = data.data.map((emp: any) => ({
                                id: emp.id,
                                fullName: emp.fullName,
                                email: emp.email,
                                nationalId: emp.nationalId,
                                position: emp.position,
                                hireDate: emp.hireDate,
                                status: emp.status,
                                managerId: emp.managerId,
                                department: emp.department ? {
                                  id: emp.department.id,
                                  displayName: emp.department.displayName
                                } : null
                              }));
                              setEmployees(mappedEmployees);
                              const deptMap = new Map();
                              mappedEmployees.forEach((emp: any) => {
                                if (emp.department) {
                                  deptMap.set(emp.department.id, emp.department);
                                }
                              });
                              setDepartments(Array.from(deptMap.values()));
                            }
                          } catch (error) {
                            console.error('Error reloading employees:', error);
                          } finally {
                            setIsLoadingEmployees(false);
                          }
                        }}
                        onCancel={() => setShowEmployeeSyncWizard(false)}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Criteria Selector */}
                    <Card className="professional-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Criterios de Inclusión
                        </CardTitle>
                        <CardDescription>
                          Define qué empleados participarán según sus características
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ParticipantCriteriaSelector
                          departments={departments}
                          onCriteriaChange={handleCriteriaChange}
                          initialCriteria={criteria}
                          eligibleCount={eligibilitySummary.eligible}
                          excludedCount={eligibilitySummary.excluded}
                        />
                      </CardContent>
                    </Card>

                    {/* Eligibility Preview */}
                    <Card className="professional-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Vista Previa de Participantes
                        </CardTitle>
                        <CardDescription>
                          Resumen de elegibilidad según los criterios definidos
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ParticipantEligibilityPreview
                          employees={employees}
                          criteria={criteria}
                          manualExclusions={manualExclusionIds}
                          onManualExclusionChange={(empId, excluded) => handleManualExclusionChange(empId, excluded)}
                          onOpenAdjustment={() => setShowAdjustmentModal(true)}
                        />
                      </CardContent>
                    </Card>

                    {/* Tipos de Evaluación 360° - solo slugs en SLUGS_CON_TIPOS_EVALUACION */}
                    {hasEvaluationTypes && (
                    <Card className="professional-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Tipos de Evaluación a Incluir
                        </CardTitle>
                        <CardDescription>
                          Selecciona las perspectivas que deseas incluir en este ciclo de evaluación
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={evaluationTypes.includesManager}
                              onChange={(e) => setEvaluationTypes(prev => ({ ...prev, includesManager: e.target.checked }))}
                              className="mt-1 h-4 w-4 rounded border-input"
                            />
                            <div>
                              <span className="text-sm font-medium">Jefe → Colaborador</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                El supervisor evalúa a sus reportes directos
                              </p>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={evaluationTypes.includesSelf}
                              onChange={(e) => setEvaluationTypes(prev => ({ ...prev, includesSelf: e.target.checked }))}
                              className="mt-1 h-4 w-4 rounded border-input"
                            />
                            <div>
                              <span className="text-sm font-medium">Autoevaluación</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Cada persona evalúa su propio desempeño
                              </p>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={evaluationTypes.includesUpward}
                              onChange={(e) => setEvaluationTypes(prev => ({ ...prev, includesUpward: e.target.checked }))}
                              className="mt-1 h-4 w-4 rounded border-input"
                            />
                            <div>
                              <span className="text-sm font-medium">Colaborador → Jefe</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Feedback ascendente anónimo (mín. 3 subordinados)
                              </p>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={evaluationTypes.includesPeer}
                              onChange={(e) => setEvaluationTypes(prev => ({ ...prev, includesPeer: e.target.checked }))}
                              className="mt-1 h-4 w-4 rounded border-input"
                            />
                            <div>
                              <span className="text-sm font-medium">Entre Pares</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Colegas del mismo departamento se evalúan mutuamente
                              </p>
                            </div>
                          </label>
                        </div>

                        {!evaluationTypes.includesManager && !evaluationTypes.includesSelf &&
                         !evaluationTypes.includesUpward && !evaluationTypes.includesPeer && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-3">
                            <AlertTriangle className="w-3 h-3" />
                            Selecciona al menos un tipo de evaluación
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    )}

                    {/* Validation Errors */}
                    {validationErrors.participants && (
                      <Alert className="border-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{validationErrors.participants}</AlertDescription>
                      </Alert>
                    )}
                    {validationErrors.evaluationTypes && (
                      <Alert className="border-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{validationErrors.evaluationTypes}</AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {/* Modal de Ajuste Manual */}
                {showAdjustmentModal && (
                  <ParticipantManualAdjustment
                    employees={employees}
                    criteria={criteria}
                    manualOverrides={manualOverrides}
                    onManualOverrideChange={handleManualExclusionChange}
                    onClose={() => setShowAdjustmentModal(false)}
                    currentUserName={currentUserName}
                  />
                )}
              </>
            ) : (
              /* ═══════════════════════════════════════════════════════════════════
                  PASO 3A: CONCIERGE FLOW (Original)
              ═══════════════════════════════════════════════════════════════════ */
              <>
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
                      <CardContent className="p-6">
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
              </>
            )}
          </div>
        )}

        {/* Paso 3: Clasificación de Cargos (solo employee-based flow) */}
        {currentStep === 3 && isEmployeeBasedFlow && (
          <div className="space-y-6">
            <JobClassificationCinema
              mode="client"
              onComplete={() => setCurrentStep(confirmStep)}
              onCancel={() => setCurrentStep(2)}
            />
          </div>
        )}

        {/* Paso Confirmación */}
        {currentStep === confirmStep && (
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
                        <dt className="text-muted-foreground">
                          {isEmployeeBasedFlow ? 'Participantes Elegibles:' : 'Participantes Estimados:'}
                        </dt>
                        <dd className="font-medium">
                          {isEmployeeBasedFlow ? (
                            <span className="text-cyan-500">{eligibilitySummary.eligible}</span>
                          ) : (
                            formData.estimatedParticipants
                          )}
                        </dd>
                      </div>
                      {isEmployeeBasedFlow && (
                        <div>
                          <dt className="text-muted-foreground">Excluidos:</dt>
                          <dd className="font-medium text-amber-500">{eligibilitySummary.excluded}</dd>
                        </div>
                      )}
                      {hasEvaluationTypes && (
                        <div>
                          <dt className="text-muted-foreground">Tipos de Evaluación:</dt>
                          <dd className="font-medium">
                            <div className="flex flex-wrap gap-1 mt-1">
                              {evaluationTypes.includesManager && <Badge variant="outline">Jefe → Colaborador</Badge>}
                              {evaluationTypes.includesSelf && <Badge variant="outline">Autoevaluación</Badge>}
                              {evaluationTypes.includesUpward && <Badge variant="outline">Colaborador → Jefe</Badge>}
                              {evaluationTypes.includesPeer && <Badge variant="outline">Entre Pares</Badge>}
                            </div>
                          </dd>
                        </div>
                      )}
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
                {isEmployeeBasedFlow ? (
                  <>
                    <strong>Próximos Pasos:</strong> Al crear la campaña, se generarán automáticamente
                    los tokens de participación para los {eligibilitySummary.eligible} empleados elegibles.
                    Podrás activar la campaña desde el panel de control cuando estés listo.
                  </>
                ) : (
                  <>
                    <strong>Próximos Pasos:</strong> Al crear la campaña, te enviaremos un email con las
                    instrucciones para enviar la lista de participantes. Nuestro equipo la procesará
                    y te notificará cuando esté lista para activar.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error de Submit */}
        {submitError && (
          <Alert className="border-destructive mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error al crear campaña:</strong> {submitError}
            </AlertDescription>
          </Alert>
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
            {currentStep < confirmStep ? (
              <Button
                onClick={nextStep}
                className="btn-gradient focus-ring"
                disabled={currentStep === 3 && isEmployeeBasedFlow}
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