// src/types/index.ts - EXTENSIÓN PARA CHAT 3B
// PRESERVANDO 100% EL CONTENIDO EXISTENTE + AGREGANDO TIPOS WIZARD + ESTADOS

// ========================================
// TIPOS BASE EXISTENTES (PRESERVADOS)
// ========================================

// Tipos base del dominio
export interface Account {
  id: string
  companyName: string
  adminEmail: string
  adminName: string
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  accountId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  status: CampaignStatus
  createdAt: Date
  updatedAt: Date
  // Relaciones opcionales
  account?: Account
  participants?: Participant[]
  results?: CampaignResult
  // Estadísticas calculadas
  totalParticipants?: number
  totalResponses?: number
  participationRate?: number
  daysRemaining?: number
}

export interface Participant {
  id: string
  campaignId: string
  email: string
  uniqueToken: string
  hasResponded: boolean
  responseDate?: Date
  createdAt: Date
  // Relaciones
  campaign?: Campaign
  responses?: Response[]
}

export interface Question {
  id: number
  text: string
  category: QuestionCategory
  questionOrder: number
  isActive: boolean
}

export interface Response {
  id: string
  participantId: string
  questionId: number
  rating: number
  createdAt: Date
  // Relaciones
  participant?: Participant
  question?: Question
}

export interface CampaignResult {
  id: string
  campaignId: string
  participationRate?: number
  overallScore?: number
  highestCategory?: string
  highestScore?: number
  lowestCategory?: string
  lowestScore?: number
  resultsData?: any
  generatedAt: Date
  // Relación
  campaign?: Campaign
}

// Enums y tipos literales
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type QuestionCategory = 'liderazgo' | 'ambiente' | 'desarrollo' | 'bienestar'

// Tipos para APIs
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  account?: {
    id: string
    companyName: string
    adminEmail: string
    adminName: string
    createdAt: Date
  }
  error?: string
}

export interface CampaignStats {
  totalParticipants: number
  totalResponses: number
  participationRate: number
  daysRemaining: number
  isActive: boolean
  isCompleted: boolean
}

export interface DashboardMetrics {
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  totalResponses: number
  averageParticipation: number
}

// Tipos para formularios
export interface RegisterFormData {
  companyName: string
  adminEmail: string
  adminName: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface CreateCampaignFormData {
  name: string
  description?: string
  startDate: string
  endDate: string
  emails: string[]
}

export interface SurveyFormData {
  responses: Array<{
    questionId: number
    rating: number
  }>
}

// Tipos para resultados y analytics
export interface CategoryScore {
  category: QuestionCategory
  score: number
  questionCount: number
}

export interface SurveyResults {
  campaignId: string
  campaignName: string
  participationRate: number
  overallScore: number
  categoryScores: CategoryScore[]
  insights: string[]
  benchmark: number
  totalParticipants: number
  totalResponses: number
  generatedAt: Date
}

export interface SurveyInsight {
  type: 'strength' | 'opportunity' | 'neutral'
  category?: QuestionCategory
  message: string
  score?: number
}

// Tipos para UI components
export interface SelectOption {
  value: string
  label: string
}

export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<any>
  active?: boolean
}

export interface ActionButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

// Tipos para contextos
export interface AuthContextType {
  account: Account | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (data: RegisterFormData) => Promise<boolean>
  loading: boolean
  isAuthenticated: boolean
}

// Tipos para hooks
export interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  autoFetch?: boolean
}

export interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  refetch: () => Promise<void>
}

// Tipos para validaciones
export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  isValid: boolean
  errors: ValidationError[]
  touched: Record<string, boolean>
}

// Tipos para configuración
export interface AppConfig {
  maxParticipantsPerCampaign: number
  minCampaignDuration: number
  maxCampaignDuration: number
  minParticipants: number
  benchmarkScore: number
  supportEmail: string
}

// Constantes de configuración
export const APP_CONFIG: AppConfig = {
  maxParticipantsPerCampaign: 500,
  minCampaignDuration: 3,
  maxCampaignDuration: 30,
  minParticipants: 5,
  benchmarkScore: 3.2,
  supportEmail: 'soporte@focalizahr.com'
}

// Mapas de traducción
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

export const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, string> = {
  liderazgo: 'Liderazgo',
  ambiente: 'Ambiente Laboral',
  desarrollo: 'Desarrollo',
  bienestar: 'Bienestar'
}

// Utilidades de tipos
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// ========================================
// NUEVOS TIPOS WIZARD CHAT 3B
// ========================================

// Tipos para el Wizard de Crear Campaña
export interface WizardStep {
  id: number
  title: string
  description: string
  completed: boolean
  active: boolean
  icon?: React.ComponentType<any>
  estimatedTime?: number // minutos
}

export interface WizardFormData {
  // Paso 1: Información Básica
  name: string
  description: string
  campaignTypeId: string
  startDate: string
  endDate: string
  
  // Paso 2: Participantes (Enfoque Concierge)
  estimatedParticipants: number
  participantInstructions: string
  dataQualityRequirements?: {
    requireDepartment: boolean
    requirePosition: boolean
    requireSeniority: boolean
    requireLocation: boolean
  }
  segmentationPreferences: string[]
  
  // Paso 3: Configuración Final
  sendReminders: boolean
  anonymousResults: boolean
  reminderSettings?: {
    firstReminder: number
    secondReminder: number
    enableFinalReminder: boolean
  }
  privacySettings?: {
    anonymousResults: boolean
    allowDataExport: boolean
    retentionPeriodMonths: number
  }
  confirmations?: {
    dataProcessingAgreement: boolean
    participantNotification: boolean
    resultSharing: boolean
  }
}

export interface CampaignType {
  id: string
  name: string
  slug: string
  description: string
  estimatedDuration: number // minutos
  questionCount: number
  methodology: string
  category: string
  sortOrder?: number
  isActive?: boolean
  isRecommended?: boolean
  
  // Características del tipo
  features: {
    quickSetup: boolean
    deepInsights: boolean
    scientificBasis: boolean
    timeEfficient: boolean
  }
  
  // Estadísticas de uso
  usageCount?: number
  popularityScore?: number
  recommendationLevel?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeText?: string
  isPopular?: boolean
}

// ========================================
// TIPOS GESTIÓN DE ESTADOS
// ========================================

export interface StateTransition {
  from: CampaignStatus
  to: CampaignStatus
  action: StateAction
  requiresConfirmation: boolean
  validationRules: string[]
  buttonText: string
  buttonIcon: React.ReactNode
  buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary'
  description: string
  allowedRoles?: string[]
  confirmationMessage?: string
}

export type StateAction = 'activate' | 'complete' | 'cancel' | 'reopen' | 'archive'

export interface StateTransitionRequest {
  campaignId: string
  fromStatus: CampaignStatus
  toStatus: CampaignStatus
  action: StateAction
  reason?: string
  forceTransition?: boolean
  userId?: string
}

export interface StateTransitionResult {
  success: boolean
  campaignId: string
  previousStatus: CampaignStatus
  newStatus: CampaignStatus
  action: StateAction
  timestamp: Date
  message?: string
  error?: string
  sideEffects?: string[]
}

// ========================================
// TIPOS PARTICIPANTES CONCIERGE
// ========================================

export interface ParticipantExtended {
  id: string
  email: string
  department?: string
  position?: string
  seniorityLevel?: 'junior' | 'mid' | 'senior' | 'executive'
  location?: string
  status: 'pending' | 'validated' | 'error'
  errorMessage?: string
  processedAt?: Date
  processedBy?: string
  
  // Metadatos adicionales
  originalRowNumber?: number
  validationNotes?: string[]
  dataSource?: 'csv' | 'excel' | 'manual' | 'api'
}

export interface ParticipantSummary {
  total: number
  byDepartment: Record<string, number>
  byPosition: Record<string, number>
  bySeniority: Record<string, number>
  byLocation: Record<string, number>
  validEmails: number
  duplicates: number
  errors: number
  
  // Métricas de calidad
  qualityScore: number // 0-100
  completenessScore: number // 0-100
  diversityIndex: number // 0-100
  
  // Recomendaciones
  recommendations: string[]
  warnings: string[]
}

export interface ConciergeProcessingResult {
  campaignId: string
  originalFile?: {
    name: string
    size: number
    uploadedAt: Date
  }
  participants: ParticipantExtended[]
  summary: ParticipantSummary
  processingLog: ProcessingLogEntry[]
  
  // Estado del procesamiento
  status: 'processing' | 'completed' | 'error' | 'review_required'
  processedBy: string
  processedAt: Date
  reviewRequired: boolean
  
  // Acciones recomendadas
  recommendedActions: {
    type: 'fix_errors' | 'review_duplicates' | 'add_participants' | 'confirm_data'
    description: string
    priority: 'low' | 'medium' | 'high'
    automated: boolean
  }[]
}

export interface ProcessingLogEntry {
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  details?: any
  rowNumber?: number
  fieldName?: string
}

// ========================================
// TIPOS EXTENDIDOS DE CAMPAÑA
// ========================================

export interface CampaignExtended extends Campaign {
  // Información adicional del estado
  canActivate?: boolean
  canViewResults?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCancel?: boolean
  
  // Métricas de riesgo
  isOverdue?: boolean
  riskLevel?: 'low' | 'medium' | 'high'
  riskFactors?: string[]
  lastActivity?: string
  completionTrend?: 'up' | 'down' | 'stable'
  
  // Información del tipo de campaña
  campaignType: CampaignType
  
  // Estadísticas avanzadas
  advancedStats?: {
    averageCompletionTime?: number // minutos
    responseRate24h?: number
    peakResponseHours?: number[]
    deviceBreakdown?: {
      mobile: number
      desktop: number
      tablet: number
    }
    completionBySegment?: Record<string, number>
  }
  
  // Configuraciones específicas
  wizardConfig?: WizardFormData
  conciergeData?: ConciergeProcessingResult
  
  // Metadatos de auditoría
  auditTrail?: AuditEntry[]
}

export interface AuditEntry {
  id: string
  timestamp: Date
  action: string
  userId: string
  userType: 'admin' | 'client' | 'system'
  details: any
  ipAddress?: string
  userAgent?: string
}

// ========================================
// TIPOS PARA VALIDACIONES Y ERRORES
// ========================================

export interface WizardValidationError {
  step: number
  field: string
  message: string
  code?: string
  severity: 'error' | 'warning' | 'info'
}

export interface WizardValidationResult {
  valid: boolean
  errors: WizardValidationError[]
  warnings: WizardValidationError[]
  suggestions: WizardValidationError[]
}

export interface FormFieldError {
  field: string
  message: string
  type: 'required' | 'format' | 'length' | 'custom'
}

export interface StepValidationConfig {
  step: number
  requiredFields: string[]
  customValidators: Record<string, (value: any) => string | null>
  dependencies: Record<string, string[]> // field -> dependent fields
}

// ========================================
// TIPOS PARA UI COMPONENTS AVANZADOS
// ========================================

export interface WizardProps {
  steps: WizardStep[]
  currentStep: number
  formData: WizardFormData
  onStepChange: (step: number) => void
  onDataChange: (data: Partial<WizardFormData>) => void
  onComplete: (data: WizardFormData) => Promise<void>
  isSubmitting?: boolean
  validationErrors?: Record<string, string>
}

export interface StateManagerProps {
  campaign: CampaignExtended
  onStateChange: (campaignId: string, newStatus: CampaignStatus, action: StateAction) => Promise<void>
  availableTransitions?: StateTransition[]
  isLoading?: boolean
  showAdvancedOptions?: boolean
}

export interface ParticipantPreviewProps {
  campaignId: string
  participants: ParticipantExtended[]
  summary: ParticipantSummary
  onParticipantUpdate: (participant: ParticipantExtended) => void
  onParticipantRemove: (participantId: string) => void
  onBulkAction: (action: string, participantIds: string[]) => void
  isEditable: boolean
  isLoading?: boolean
  viewMode?: 'list' | 'summary' | 'analytics'
}

export interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  requiresInput?: boolean
  inputPlaceholder?: string  // ← CORREGIDO: Completar la propiedad
}
