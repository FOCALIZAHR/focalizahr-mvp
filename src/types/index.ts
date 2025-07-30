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
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignType: {
    name: string;
    slug: string;
  };
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  startDate: string;
  endDate: string;
  canActivate?: boolean;
  canViewResults?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
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
  id: string
  text: string
  category: QuestionCategory
  questionOrder: number
  isActive: boolean
  responseType?: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale'
  choiceOptions?: string[] | null
  conditionalLogic?: any | null
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
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  recentResponses?: number; // Puede no haber respuestas recientes
  
  // Estos campos pueden ser nulos o no existir, por eso llevan '?'
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number | null;
  topPerformingCampaign?: string | null;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
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
    allowDataExport: boolean
    requireConsent: boolean
    dataRetentionDays: number
  }
}

export interface WizardContextType {
  currentStep: number
  formData: Partial<WizardFormData>
  steps: WizardStep[]
  isValid: boolean
  isLoading: boolean
  error: string | null
  
  // Acciones
  goToStep: (stepId: number) => void
  nextStep: () => void
  previousStep: () => void
  updateFormData: (data: Partial<WizardFormData>) => void
  validateStep: (stepId: number) => boolean
  submitWizard: () => Promise<boolean>
  resetWizard: () => void
}

// Estados para manejo de UI avanzada
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  progress?: number
}

export interface ErrorState {
  hasError: boolean
  errorMessage?: string
  errorCode?: string
  canRetry?: boolean
  retryAction?: () => void
}

export interface SuccessState {
  isSuccess: boolean
  successMessage?: string
  redirectUrl?: string
  autoRedirect?: boolean
}

export interface NotificationState {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  autoClose?: boolean
  duration?: number
  actionLabel?: string
  actionCallback?: () => void
}

// Tipos para manejo de archivos (CSV/Excel upload)
export interface FileUploadState {
  file: File | null
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
  uploadSuccess: boolean
  previewData?: any[]
  validationErrors?: string[]
}

export interface CsvParseResult {
  data: any[]
  errors: string[]
  meta: {
    totalRows: number
    validRows: number
    invalidRows: number
    duplicates: number
    fields: string[]
  }
}

// Tipos para participantes y gestión de datos
export interface ParticipantUpload {
  email: string
  firstName?: string
  lastName?: string
  department?: string
  position?: string
  location?: string
  customFields?: Record<string, any>
}

export interface ParticipantBatch {
  id: string
  campaignId: string
  totalCount: number
  validCount: number
  invalidCount: number
  processedCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errors?: string[]
  createdAt: Date
  completedAt?: Date
}

// Tipos para configuración de formularios avanzados
export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'date' | 'textarea'
  required: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
    customValidator?: (value: any) => string | null
  }
  helpText?: string
  conditional?: {
    field: string
    value: any
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  }
}

export interface DynamicFormConfig {
  id: string
  title: string
  description?: string
  fields: FormFieldConfig[]
  submitLabel?: string
  resetLabel?: string
  enableAutoSave?: boolean
  showProgress?: boolean
}

// Tipos para analytics y reportes avanzados
export interface AdvancedMetrics {
  responseRate: {
    overall: number
    byDepartment: Record<string, number>
    byPosition: Record<string, number>
    trend: Array<{ date: string; rate: number }>
  }
  engagementScore: {
    average: number
    distribution: Record<string, number>
    topPerformers: string[]
    improvementAreas: string[]
  }
  completionTimes: {
    average: number
    median: number
    distribution: Record<string, number>
  }
  dropOffPoints: Array<{
    questionId: number
    questionText: string
    dropOffRate: number
  }>
}

export interface ComparisonReport {
  baseline: {
    campaignId: string
    campaignName: string
    date: string
    metrics: any
  }
  current: {
    campaignId: string
    campaignName: string
    date: string
    metrics: any
  }
  differences: {
    improvements: string[]
    declines: string[]
    noChange: string[]
    significantChanges: Array<{
      metric: string
      change: number
      significance: 'low' | 'medium' | 'high'
    }>
  }
}

// Tipos para configuración de sistema
export interface SystemConfig {
  email: {
    enabled: boolean
    provider: 'smtp' | 'sendgrid' | 'mailgun'
    settings: Record<string, any>
  }
  storage: {
    provider: 'local' | 'aws-s3' | 'gcp-storage'
    settings: Record<string, any>
  }
  analytics: {
    enabled: boolean
    provider?: 'google-analytics' | 'mixpanel' | 'amplitude'
    trackingId?: string
  }
  security: {
    requireTwoFactor: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordPolicy: {
      minLength: number
      requireNumbers: boolean
      requireSymbols: boolean
      requireUppercase: boolean
    }
  }
}

// Tipos para permisos y roles
export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isDefault: boolean
}

export interface UserPermissions {
  userId: string
  accountId: string
  roles: Role[]
  directPermissions: Permission[]
  effectivePermissions: Permission[]
}

// Tipos para auditoría y logs
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

export interface SystemLog {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  context: Record<string, any>
  timestamp: Date
  source: string
}

// Tipos para integraciones
export interface Integration {
  id: string
  name: string
  type: 'webhook' | 'api' | 'sso' | 'storage' | 'analytics'
  status: 'active' | 'inactive' | 'error'
  config: Record<string, any>
  lastSync?: Date
  errorMessage?: string
}

export interface WebhookEvent {
  id: string
  event: string
  payload: Record<string, any>
  url: string
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  attempts: number
  lastAttempt?: Date
  nextAttempt?: Date
  response?: {
    status: number
    body: string
    headers: Record<string, string>
  }
}
// ====================================================================
// FOCALIZAHR TYPES - CENTRAL TYPE DEFINITIONS  
// src/types/index.ts
// Chat 2: Foundation Schema + Services - TIPOS CENTRALIZADOS
// ====================================================================

// ✅ PARTICIPANT INTERFACE - FUENTE DE VERDAD
export interface Participant {
  id: string;
  email?: string; // Opcional por seguridad
  department: string | null;
  position: string | null;
  seniorityLevel: string | null;
  location: string | null;
  hasResponded: boolean;
  responseDate: Date | string | null;
  reminderCount: number;
  lastReminderSent: Date | string | null;
  createdAt: Date | string;
  responses?: Array<{
    id: string;
    rating: number;
    createdAt: Date | string;
  }>;
}

// ✅ PARTICIPANTS DATA INTERFACE - HOOK RESPONSE
export interface ParticipantsData {
  participants: Participant[];
  summary: {
    total: number;
    responded: number;
    pending: number;
    participationRate: number;
    byDepartment: Record<string, { total: number; responded: number }>;
    byPosition: Record<string, { total: number; responded: number }>;
    bySeniority: Record<string, { total: number; responded: number }>;
    byLocation: Record<string, { total: number; responded: number }>;
    reminders: {
      noReminders: number;
      oneReminder: number;
      multipleReminders: number;
    };
  };
  analysis: {
    dataCompleteness: {
      department: number;
      position: number;
      seniority: number;
      location: number;
    };
    trends: {
      needsReminders: number;
      highEngagement: boolean;
      readyForAnalysis: boolean;
    };
  };
}

// ✅ CAMPAIGN INTERFACE - EXISTING EXTENDED
export interface Campaign {
  id: string;
  name: string;
  status: string;
  type?: string;
  startDate: Date | string;
  endDate: Date | string;
  totalInvited: number;
  totalResponded: number;
  campaignType?: {
    id: string;
    name: string;
    slug: string;
  };
  company?: {
    name: string;
    adminEmail?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ✅ ANALYTICS INTERFACE - EXISTING EXTENDED  
export interface Analytics {
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  categoryScores: Record<string, number>;
  departmentScores: Record<string, number>;
  departmentScoresDisplay?: Record<string, number>;
  departmentMapping?: Record<string, string>;
  trendData: Array<{
    date: string;
    responses: number;
    score?: number;
    cumulativeParticipation?: number;
  }>;
  responsesByDay: Record<string, number>;
  segmentationData: Array<{
    segment: string;
    count: number;
    avgScore: number;
    percentage: number;
  }>;
  demographicBreakdown?: any[];
  lastUpdated: string;
}

// ✅ MONITOR DATA INTERFACES - TOWER CONTROL
export interface DepartmentMonitorData {
  invited: number;
  responded: number;
  rate: number;
}

export interface DailyResponse {
  day: string;
  responses: number;
  date: string;
}

export interface ActivityItem {
  id: string;
  dept: string;
  participant: string;
  timestamp: string;
  status: string;
  action: string;
}

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  department?: string;
  timestamp?: string;
  priority?: string;
}

// ✅ CAMPAIGN RESULTS DATA - FUSION INTERFACE
export interface CampaignResultsData {
  campaign: Campaign;
  analytics: Analytics;
}

// ====================================================================
// 🔥 COMPONENTES WOW - TIPOS PARA DATOS CALCULADOS
// ====================================================================

export interface EngagementHeatmapData {
  hourlyData: Array<{ hour: number; count: number; intensity: number; }>;
  recommendations: Array<{ message: string; confidence: number; }>;
  nextOptimalWindow: { hour: number; day: string; confidence: number; };
  totalEngagementScore: number;
   maxHour: number;           // ← NUEVO
  maxActivity: number;       // ← NUEVO  
  totalActivity: number;     // ← NUEVO
  hourBars: Array<{ hour: number; count: number; percentage: number; isPeak: boolean; }>; // ← NUEVO
}

export interface ParticipationPredictionData {
  finalProjection: number;
  confidence: number;
  velocity: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: Array<{ action: string; impact: number; }>;
}
// ❌ ESTAS 2 INTERFACES NO EXISTEN EN TU ARCHIVO:
export interface DepartmentAnomalyData {
  department: string;
  currentRate: number;
  zScore: number;
  type: 'positive_outlier' | 'negative_outlier';
  severity: 'high' | 'medium';
}

export interface CrossStudyComparisonData {
  lastCampaign: {
    name: string;
    type: string;
    participationRate: number;
    velocityMetrics: {
      averageResponsesPerDay: number;
      completionVelocity: number;
    };
  };
  comparison: {
    velocityTrend: 'faster' | 'slower' | 'similar';
    velocityDifference: number;
    patternSimilarity: number;
    projectedOutcome: {
      finalRate: number;
      confidence: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
  };
  insights: string[];
  recommendations: string[];
}