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
  // --- Campos de la versión Antigua (Preservados) ---
  id: string;
  campaignId: string;
  generatedAt: Date;
  
  // --- Campos Consolidados y Estandarizados a camelCase ---
  overallScore: number;
  participationRate: number;
  totalResponses: number;
  totalInvited: number;
  companyName: string;
  industryBenchmark: number;
  
  // --- Campos de Análisis (Estandarizados y Opcionales) ---
  categoryScores?: { [key: string]: number };
  departmentScores?: { [dept: string]: number };
  campaignType?: string;
  industry?: string;
  
  // --- Campos que pueden ser eliminados si ya no se usan, pero se mantienen por seguridad ---
  highestCategory?: string;
  highestScore?: number;
  lowestCategory?: string;
  lowestScore?: number;
  resultsData?: any;
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
  dependencies?: any[]
}

export interface UseApiState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Tipos para filtros y búsqueda
export interface CampaignFilters {
  status?: CampaignStatus
  startDate?: string
  endDate?: string
  searchTerm?: string
  sortBy?: 'name' | 'startDate' | 'participationRate' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationOptions {
  page: number
  limit: number
  total?: number
  hasMore?: boolean
}

export interface SearchOptions {
  query: string
  filters: Record<string, any>
  sorting: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination: PaginationOptions
}

// Tipos para validación
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationErrors {
  [field: string]: string[]
}

export interface FormState<T = any> {
  values: T
  errors: ValidationErrors
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// Tipos para notificaciones
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: Array<{
    label: string
    onClick: () => void
  }>
  createdAt: Date
}

// Tipos para configuración de aplicación
export interface AppConfig {
  name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  apiUrl: string
  features: {
    [key: string]: boolean
  }
  limits: {
    maxCampaigns: number
    maxParticipants: number
    maxQuestions: number
  }
}

// Tipos para eventos del sistema
export interface SystemEvent {
  id: string
  type: string
  source: string
  data: Record<string, any>
  timestamp: Date
  userId?: string
  accountId?: string
}

// Tipos para métricas de rendimiento
export interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  renderTime: number
  memoryUsage: number
  errorRate: number
  userEngagement: {
    sessionDuration: number
    pageViews: number
    bounceRate: number
  }
}

// Tipos para exportación de datos
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json'
  includeHeaders: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: Record<string, any>
  columns?: string[]
}

export interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  error?: string
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

// =======================================================
// NUEVAS DEFINICIONES PARA EL "KIT DE COMUNICACIÓN v2.0"
// =======================================================

// =======================================================
// NUEVAS DEFINICIONES PARA EL "KIT DE COMUNICACIÓN v2.0"
// =======================================================

/**
 * Define la estructura de un template de comunicación ya procesado, listo para la UI.
 */
export interface CommunicationTemplate {
  id: string;
  type: string;
  category: string;
  text: string;
  priority: number;
}

/**
 * Define la estructura completa del objeto de análisis que produce AnalyticsService.
 */
export interface CampaignAnalytics {
  overallScore: number;
  participationRate: number;
  benchmarkDifference: number;
  strongestCategory: { category: string; score: number };
  weakestCategory: { category: string; score: number };
  departmentScores: { [dept: string]: number };
  strongestDepartment: { name: string; score: number };
  weakestDepartment: { name: string; score: number };
  departmentVariability: number;
  participationLevel: 'exceptional' | 'excellent' | 'good' | 'moderate' | 'low';
  confidenceLevel: 'high' | 'medium' | 'low';
  campaignType?: string;
  totalResponses: number;
  totalInvited: number;
  companyName: string;
  industryBenchmark: number;
}

/**
 * Define el objeto que retorna el hook `useTemplateSelection`.
 */
export interface UseTemplateSelectionResult {
  templates: CommunicationTemplate[];
  isLoading: boolean;
  error: string | null;
  analytics: CampaignAnalytics | null;
}