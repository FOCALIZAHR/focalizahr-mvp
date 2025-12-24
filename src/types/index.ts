// src/types/index.ts
// FOCALIZAHR TYPE DEFINITIONS - RESTORED VERSION
// Restauración quirúrgica preservando contratos de datos enriquecidos
// Last Updated: 2025
// ========================================
// TYPE IMPORTS - Tipos auxiliares externos
// ========================================

import type { TopMoverTrend } from '@/lib/utils/monitor-utils';

// Re-exportar para que otros archivos también puedan importarlo desde aquí
export type { TopMoverTrend };
// ========================================
// DOMAIN MODELS - Definidos directamente sin herencia
// ========================================

// Account - Modelo base
export interface Account {
  id: string;
  companyName: string;
  adminEmail: string;
  adminName: string;
  companyLogo?: string | null;
  passwordHash?: string;
  role?: 'CLIENT' | 'FOCALIZAHR_ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Campaign - Con tipo literal correcto para status
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';  // TIPO LITERAL
  startDate: string;
  endDate: string;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  // Propiedades de relación
  campaignType: {
    id: string;
    name: string;
    slug: string;
    isPermanent?: boolean;  // ✅ AGREGAR ESTA LÍNEA
  };
  company?: {
    name: string;
    adminEmail?: string;
  };
  // Propiedades UI
  canActivate?: boolean;
  canViewResults?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
  type?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Participant - Interface directa sin herencia
export interface Participant {
  id: string;
  campaignId: string;
  email?: string;
  uniqueToken: string;
  department?: string | null;
  position?: string | null;
  seniorityLevel?: string | null;
  location?: string | null;
  hasResponded: boolean;
  responseDate?: Date | string | null;
  reminderCount: number;
  lastReminderSent?: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  // Relaciones
  campaign?: Campaign;
  responses?: Array<{
    id: string;
    rating: number;
    createdAt: Date | string;
  }>;
}

// Question - Modelo extendido
export interface Question {
  id: string | number;
  text: string;
  category: QuestionCategory;
  questionOrder: number;
  isActive: boolean;
  responseType?: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale';
  choiceOptions?: string[] | null;
  conditionalLogic?: any | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Response - Modelo extendido
export interface Response {
  id: string;
  participantId: string;
  questionId: string | number;
  rating?: number | null;
  textResponse?: string | null;
  createdAt: Date | string;
  participant?: Participant;
  question?: Question;
}

// CampaignResult - Modelo extendido
export interface CampaignResult {
  id: string;
  campaignId: string;
  participationRate?: number | null;
  overallScore?: number | null;
  highestCategory?: string | null;
  highestScore?: number | null;
  lowestCategory?: string | null;
  lowestScore?: number | null;
  resultsData?: any | null;
  generatedAt: Date | string;
  campaign?: Campaign;
}

// ========================================
// ENUMS Y TIPOS LITERALES
// ========================================

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type QuestionCategory = 'liderazgo' | 'ambiente' | 'desarrollo' | 'bienestar' | 'comunicacion' | 'reconocimiento';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
export type AccountRole = 'CLIENT' | 'FOCALIZAHR_ADMIN';
export type ResponseType = 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale';

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  account?: {
    id: string;
    companyName: string;
    adminEmail: string;
    adminName: string;
    createdAt: Date;
  };
  error?: string;
}

// ========================================
// ANALYTICS & METRICS
// ========================================

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
  // Campo para datos jerárquicos
  hierarchicalData?: AggregatedGerencia[] | null;
  trendDataByDepartment?: Record<string, any>;
}

export interface CampaignStats {
  totalParticipants: number;
  totalResponses: number;
  participationRate: number;
  daysRemaining: number;
  isActive: boolean;
  isCompleted: boolean;
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
  recentResponses?: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
  averageCompletionTime?: number | null;
  topPerformingCampaign?: string | null;
}

// ========================================
// PARTICIPANTS DATA STRUCTURES
// ========================================

export interface ParticipantsData {
  participants: Participant[];
  summary: {
    total: number;
    responded: number;
    pending: number;
    participationRate: number;
    byDepartment: Record<string, { 
      total: number; 
      responded: number;
      rate?: number;
      displayName?: string;
    }>;
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

// ========================================
// CAMPAIGN RESULTS & SURVEY
// ========================================

export interface CampaignResultsData {
  campaign: Campaign;
  analytics: Analytics;
  stats?: any; // Para compatibilidad legacy
}

export interface CategoryScore {
  category: QuestionCategory | string;
  score: number;
  questionCount: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface SurveyResults {
  campaignId: string;
  campaignName: string;
  participationRate: number;
  overallScore: number;
  categoryScores: CategoryScore[];
  insights: SurveyInsight[];
  benchmark: number;
  totalParticipants: number;
  totalResponses: number;
  generatedAt: Date;
}

export interface SurveyInsight {
  type: 'strength' | 'opportunity' | 'neutral';
  category?: QuestionCategory | string;
  message: string;
  score?: number;
}

// ========================================
// FORM DATA TYPES
// ========================================

export interface RegisterFormData {
  companyName: string;
  adminEmail: string;
  adminName: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateCampaignFormData {
  name: string;
  description?: string;
  campaignTypeId?: string;
  startDate: string;
  endDate: string;
  emails: string[];
}

export interface SurveyFormData {
  responses: Array<{
    questionId: number;
    rating?: number;
    textResponse?: string;
  }>;
}

// ========================================
// WIZARD TYPES (NUEVOS POST-26 SEP)
// ========================================

export interface WizardStep {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  isCompleted?: boolean;
  isActive?: boolean;
  isOptional?: boolean;
  component?: string;
  icon?: React.ComponentType<any> | string;
  validation?: (data: any) => boolean;
  estimatedTime?: number;
}

export interface WizardFormData {
  // Paso 1: Info Básica
  campaignName: string;
  campaignType: string;
  name?: string; // Alias compatibilidad
  description?: string;
  campaignTypeId?: string;
  startDate: Date | string;
  endDate: Date | string;
  
  // Paso 2: Participantes
  participants?: Array<{
    email: string;
    fullName: string;
    department?: string;
    position?: string;
    location?: string;
    seniority?: string;
  }>;
  estimatedParticipants?: number;
  participantInstructions?: string;
  uploadMethod?: 'manual' | 'csv' | 'integration';
  csvFile?: File;
  dataQualityRequirements?: {
    requireDepartment: boolean;
    requirePosition: boolean;
    requireSeniority: boolean;
    requireLocation: boolean;
  };
  departmentSettings?: {
    requireDepartment: boolean;
    requirePosition: boolean;
    requireSeniority: boolean;
    requireLocation: boolean;
  };
  segmentationPreferences: string[];
  
  // Paso 3: Configuración Final
  sendReminders: boolean;
  anonymousResults: boolean;
  reminderSettings?: {
    firstReminder: number;
    secondReminder: number;
    enableFinalReminder: boolean;
  };
  privacySettings?: {
    allowDataExport: boolean;
    requireConsent: boolean;
    dataRetentionDays: number;
  };
}

export interface WizardContextType {
  currentStep: number;
  formData: Partial<WizardFormData>;
  steps: WizardStep[];
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  goToStep: (stepId: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<WizardFormData>) => void;
  validateStep: (stepId: number) => boolean;
  submitWizard: () => Promise<boolean>;
  resetWizard: () => void;
}

// ========================================
// UI COMPONENT TYPES
// ========================================

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date | string;
  campaignId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  active?: boolean;
  badge?: string | number;
  children?: NavItem[];
}

export interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<any>;
}

// ========================================
// STATE MANAGEMENT TYPES
// ========================================

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
  canRetry?: boolean;
  retryAction?: () => void;
}

export interface SuccessState {
  isSuccess: boolean;
  successMessage?: string;
  redirectUrl?: string;
  autoRedirect?: boolean;
}

export interface NotificationState {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  actionLabel?: string;
  actionCallback?: () => void;
}

// ========================================
// FILE UPLOAD TYPES
// ========================================

export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadSuccess: boolean;
  previewData?: any[];
  validationErrors?: string[];
}

export interface CsvParseResult {
  data: any[];
  errors: string[];
  meta: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    fields: string[];
  };
}

export interface ParticipantUpload {
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  location?: string;
  seniority?: string;
  customFields?: Record<string, any>;
}

export interface ParticipantBatch {
  id: string;
  campaignId: string;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  processedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors?: string[];
  createdAt: Date | string;
  completedAt?: Date | string;
}

// ========================================
// MONITOR & COCKPIT TYPES (WOW Components)
// ========================================

export interface DepartmentMonitorData {
  invited: number;
  responded: number;
  rate: number;
  displayName?: string;
}

export interface DailyResponse {
  day: string;
  responses: number;
  date: string;
  cumulative?: number;
}

export interface ActivityItem {
  id: string;
  dept: string;
  participant: string;
  timestamp: string;
  status: string;
  action: string;
  type?: 'response' | 'reminder' | 'system';
}

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  department?: string;
  timestamp?: string;
  priority?: string;
  actionRequired?: boolean;
}

export interface EngagementHeatmapData {
  hourlyData: Array<{ hour: number; count: number; intensity: number }>;
  recommendations: Array<{ message: string; confidence: number }>;
  nextOptimalWindow: { hour: number; day: string; confidence: number };
  totalEngagementScore: number;
  maxHour: number;
  maxActivity: number;
  totalActivity: number;
  hourBars: Array<{ hour: number; count: number; percentage: number; isPeak: boolean }>;
}

export interface ParticipationPredictionData {
  finalProjection: number;
  confidence: number;
  velocity: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: Array<{ action: string; impact: number }>;
  projectionPoints?: Array<{
    dayLabel: string;
    rate: number;
  }>;
  methodology?: string;
  slope?: number;
  intercept?: number;
}

export interface DepartmentAnomalyData {
  department: string;
  rate: number;
  zScore: number;
  type: 'positive_outlier' | 'negative_outlier';
  severity: 'high' | 'medium';
}

// Alias para compatibilidad
export type CrossStudyComparisonData = CrossStudyComparison;

export interface CrossStudyComparison {
  currentCampaign?: {
    id: string;
    name: string;
    participationRate: number;
    daysSinceStart: number;
  };
  lastCampaign?: {
    name: string;
    type: string;
    participationRate: number;
    velocityMetrics: {
      averageResponsesPerDay: number;
      completionVelocity: number;
    };
  };
  historicalAverage?: {
    participationRate: number;
    atSamePoint: number;
    finalRate: number;
  };
  bestPerformer?: {
    name: string;
    participationRate: number;
    completedIn: number;
  };
  comparison?: {
    velocityTrend: 'faster' | 'slower' | 'similar';
    velocityDifference: number;
    patternSimilarity: number;
    projectedOutcome: {
      finalRate: number;
      confidence: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
  };
  percentileRank?: number;
  performanceRating?: 'excepcional' | 'sobre promedio' | 'promedio' | 'bajo promedio';
  projection?: {
    expectedFinal: number;
    confidence: number;
    daysToGoal: number;
  };
  insights?: string[];
  recommendations?: string[];
}

export interface DepartmentalIntelligence {
  topPerformers: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
    rank: number;
    medal: string;
    status: string;
  }>;
  
  attentionNeeded: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
    urgency: 'critical' | 'high' | 'medium';
    action: 'llamar' | 'recordar' | 'seguimiento';
    icon: '🚨' | '⚡' | '⚠️';
  }>;
  
  totalDepartments: number;
  averageRate: number;
  excellentCount: number;
  criticalCount: number;
  allDepartments: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
  }>;
  hasRealData: boolean;
  scenarioType: 'NO_DATA' | 'ALL_ZERO' | 'MIXED_DATA';
  displayMessage: string;
}

// ========================================
// COCKPIT INTELLIGENCE TYPES
// ========================================

// src/types/index.ts línea 727
export interface CockpitIntelligence {
  vectorMomentum: string;
  projection: {
    finalProjection: number;
    confidence: number;
    methodology: string;
    confidenceText: string;
  };
  action: {
    primary: string;
    reasoning: string;
    urgency: 'baja' | 'media' | 'alta' | 'crítica';
    nextSteps: string[];
    urgencyColor: string;
    // ❌ ELIMINAR timeline: string; (no existe)
  };
  pattern: {
    dominantPattern: string;
    description: string;
    insights: string[];
    patternColor: string;
  };
  tacticalAction?: TacticalRecommendation;
  departmentMomentum?: DepartmentMomentumData;
}
export interface TacticalRecommendation {
  primary: string;
  reasoning: string;
  urgency: 'baja' | 'media' | 'alta' | 'crítica';
  action: 'tactical' | 'post-campaign' | 'emergency';
  urgencyColor: string;
}

export interface DepartmentMomentumData {
  departments: Array<{
    name: string;
    rate: number;
    trend: string;
    velocity: number;
    status: 'positive' | 'warning' | 'critical';
  }>;
  summary: {
    accelerating: number;
    stable: number;
    critical: number;
    total: number;
  };
  insights: string[];
  sparklineData: Array<{ name: string; value: number; velocity: number }>;
}

export interface CardState {
  title: string;
  department: string;
  content: string;
  severity: string;
  action: string;
  style: 'danger' | 'success' | 'healthy' | 'warning';
  icon: 'alert' | 'trending' | 'check' | 'activity';
}

// ====================================================================
// 🎯 INTERFACE CAMPAIGNMONITORDATA COMPLETA Y DEFINITIVA
// Para reemplazar en src/types/index.ts
// ====================================================================

export interface CampaignMonitorData {
  // ====================================================================
  // PROPIEDADES BÁSICAS
  // ====================================================================
  isLoading: boolean;
  id: string;
  name: string;
  type: string;
  status: string;
  
  // ====================================================================
  // MÉTRICAS PRINCIPALES
  // ====================================================================
  participationRate: number;
  totalInvited: number;
  totalResponded: number;
  daysRemaining: number;
  
  // ====================================================================
  // FECHAS
  // ====================================================================
  startDate: string;
  endDate: string;
  lastRefresh: Date;
  
  // ====================================================================
  // DATOS DEPARTAMENTALES
  // ====================================================================
  byDepartment: Record<string, DepartmentMonitorData & { displayName?: string }>;
  dailyResponses: DailyResponse[];
  recentActivity: ActivityItem[];
  
  // ====================================================================
  // COMPONENTES WOW - DATOS CALCULADOS COMPLETOS
  // ====================================================================
  engagementHeatmap?: EngagementHeatmapData;
  participationPrediction?: ParticipationPredictionData;
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];
  negativeAnomalies: DepartmentAnomalyData[];
  meanRate: number;
  totalDepartments: number;
  crossStudyComparison?: CrossStudyComparisonData;
  
  // ====================================================================
  // INTELIGENCIA AVANZADA
  // ====================================================================
  departmentalIntelligence: DepartmentalIntelligence;
  topMovers: Array<{ 
    name: string; 
    momentum: number; 
    trend: TopMoverTrend; 
    isFallback?: boolean 
  }>;
  cockpitIntelligence?: CockpitIntelligence;
  departmentMomentum?: DepartmentMomentumData;
  leadershipAnalysis?: LeadershipAnalysis;  // ✅ LA PROPIEDAD CRÍTICA
  
  // ====================================================================
  // DATOS VISUALIZACIÓN
  // ====================================================================
  riskTrendData: Array<{date: string, rate: number}>;
  departmentSizes: Record<string, number>;
  momentumGaugeData: Array<{value: number, fill: string}>;
  
  // ====================================================================
  // VISTA JERÁRQUICA
  // ====================================================================
  viewLevel: 'department' | 'gerencia';
  setViewLevel: (level: 'department' | 'gerencia') => void;
  hasHierarchy: boolean;
  gerenciaData: GerenciaData[] | null;
  hierarchicalData?: AggregatedGerencia[] | null;  // ← AGREGAR ESTA LÍNEA
  
  // ====================================================================
  // DATOS OPCIONALES LEGACY (para compatibilidad)
  // ====================================================================
  campaignId?: string;
  campaign?: Campaign;
  analytics?: Analytics;
  participants?: ParticipantsData;
  error?: string | null;
  departmentPulse?: any;
  
  // ====================================================================
  // MÉTODOS
  // ====================================================================
  handleRefresh?: () => void;
}

// ========================================
// NUEVOS TIPOS POST-26 SEP (AGREGADOS)
// ========================================

export interface AggregatedGerencia {
  id: string;
  displayName: string;
  unitType: string;
  level: number;
  scoreNum: number;
  participants: number;
  responded: number;
  rateNum: number;
  employeeCount?: number;
  children: DepartmentChild[];
  momentum?: number;
  trend?: 'acelerando' | 'desacelerando' | 'estable' | 'crítico' | null;  // ✅ CORRECTO
  velocity?: number;  // ✅ AGREGAR (faltaba)
  projection?: number;
  position?: number;  // ✅ AGREGAR (faltaba)
}
// Alias para compatibilidad con hook
export type GerenciaData = AggregatedGerencia;  // ← AGREGAR ESTA LÍNEA

export interface DepartmentChild {
  id: string;
  displayName: string;
  unitType: string;
  level: number;
  scoreNum: number;
  participants: number;
  responded: number;
  rateNum: number;
  velocity?: number;
  lastActivity?: string;
  projection?: number;
  
}

export interface DemographicsStats {
  genderDistribution?: Record<string, number>;
  ageDistribution?: Record<string, number>;
  averageAge?: number;
  averageSeniority?: number;
  totalWithDemographics?: number;
}

// ========================================
// PATTERN DETECTOR TYPES
// ========================================

import type { 
  DemographicPattern, 
  ParticipationAnomaly, 
  LeadershipFingerprint,

} from '@/lib/services/PatternDetector';

export type { 
  DemographicPattern, 
  ParticipationAnomaly, 
  LeadershipFingerprint,
};


export interface LeadershipAnalysis {
  byDepartment: Record<string, {
    pattern: DemographicPattern | null;
    anomaly: ParticipationAnomaly | null;
    insight: string;
    fingerprint: LeadershipFingerprint | null;
    hasData: boolean;
  }>;
  global: {
    pattern: DemographicPattern | null;
    anomaly: ParticipationAnomaly | null;
    insight: string;
    fingerprint: LeadershipFingerprint | null;
    hasData: boolean;
  };
  criticalDepartments: Array<{
    department: string;
    issue: string;
    severity: string;
    insight: string;
  }>;
  exemplaryDepartments: Array<{
    department: string;
    impactScore: number;
    insight: string;
  }>;
}
// ========================================
// CONTEXT & HOOK TYPES
// ========================================

export interface AuthContextType {
  account: Account | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterFormData) => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  cacheTime?: number;
  retryCount?: number;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
}

// ========================================
// FORM & VALIDATION TYPES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isValid: boolean;
  errors: ValidationError[];
  touched: Record<string, boolean>;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'date' | 'textarea' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    customValidator?: (value: any) => string | null;
  };
  helpText?: string;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
}

export interface DynamicFormConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  submitLabel?: string;
  resetLabel?: string;
  enableAutoSave?: boolean;
  showProgress?: boolean;
}

// ========================================
// ADVANCED METRICS & REPORTS
// ========================================

export interface AdvancedMetrics {
  responseRate: {
    overall: number;
    byDepartment: Record<string, number>;
    byPosition: Record<string, number>;
    trend: Array<{ date: string; rate: number }>;
  };
  engagementScore: {
    average: number;
    distribution: Record<string, number>;
    topPerformers: string[];
    improvementAreas: string[];
  };
  completionTimes: {
    average: number;
    median: number;
    distribution: Record<string, number>;
  };
  dropOffPoints: Array<{
    questionId: number;
    questionText: string;
    dropOffRate: number;
  }>;
}

export interface ComparisonReport {
  baseline: {
    campaignId: string;
    campaignName: string;
    date: string;
    metrics: any;
  };
  current: {
    campaignId: string;
    campaignName: string;
    date: string;
    metrics: any;
  };
  differences: {
    improvements: string[];
    declines: string[];
    noChange: string[];
    significantChanges: Array<{
      metric: string;
      change: number;
      significance: 'low' | 'medium' | 'high';
    }>;
  };
}

// ========================================
// SYSTEM CONFIGURATION TYPES
// ========================================

export interface SystemConfig {
  email: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'resend';
    settings: Record<string, any>;
  };
  storage: {
    provider: 'local' | 'aws-s3' | 'gcp-storage' | 'azure-blob';
    settings: Record<string, any>;
  };
  analytics: {
    enabled: boolean;
    provider?: 'google-analytics' | 'mixpanel' | 'amplitude' | 'segment';
    trackingId?: string;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
    };
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}

export interface UserPermissions {
  userId: string;
  accountId: string;
  roles: Role[];
  directPermissions: Permission[];
  effectivePermissions: Permission[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date | string;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: Record<string, any>;
  timestamp: Date | string;
  source: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'sso' | 'storage' | 'analytics';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  lastSync?: Date | string;
  errorMessage?: string;
}

export interface WebhookEvent {
  id: string;
  event: string;
  payload: Record<string, any>;
  url: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date | string;
  nextAttempt?: Date | string;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
}

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

export interface AppConfig {
  maxParticipantsPerCampaign: number;
  minCampaignDuration: number;
  maxCampaignDuration: number;
  minParticipants: number;
  benchmarkScore: number;
  supportEmail: string;
}

export const APP_CONFIG: AppConfig = {
  maxParticipantsPerCampaign: 500,
  minCampaignDuration: 3,
  maxCampaignDuration: 30,
  minParticipants: 5,
  benchmarkScore: 3.2,
  supportEmail: 'soporte@focalizahr.com'
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

export const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  liderazgo: 'Liderazgo',
  ambiente: 'Ambiente Laboral',
  desarrollo: 'Desarrollo',
  bienestar: 'Bienestar',
  comunicacion: 'Comunicación',
  reconocimiento: 'Reconocimiento'
};

// ========================================
// UTILITY TYPES
// ========================================

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DateString = string;
export type UUID = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

// ============================================================================
// BENCHMARK TYPES (Cross-producto)
// ============================================================================
export * from './benchmark';

// END OF FILE