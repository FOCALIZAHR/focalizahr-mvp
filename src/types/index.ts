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