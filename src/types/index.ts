// src/types/index.ts
// FOCALIZAHR UNIFIED TYPE DEFINITIONS - v2.0
// Single Source of Truth - Aligned with Prisma Schema
// Last Updated: 2025

// ====================================================================
// DOMAIN MODELS - Direct reflection of Prisma Schema
// ====================================================================

// Account Model - Core entity
export interface Account {
  id: string;
  companyName: string;
  companyLogo?: string | null;
  adminEmail: string;
  adminName: string;
  passwordHash: string;
  role: 'CLIENT' | 'FOCALIZAHR_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  campaigns?: Campaign[];
}

// Campaign Model - Core campaign entity
export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  campaignTypeId: string;
  startDate: Date | string;
  endDate: Date | string;
  accountId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  campaignType?: CampaignType;
  account?: Account;
  participants?: Participant[];
  results?: CampaignResult[];
}

// Participant Model - Core participant entity
export interface Participant {
  id: string;
  campaignId: string;
  fullName: string;
  email: string;
  position?: string | null;
  department?: string | null;
  departmentId?: string | null;
  seniority?: string | null;
  location?: string | null;
  uniqueToken: string;
  hasResponded: boolean;
  responseDate?: Date | string | null;
  reminderCount: number;
  lastReminderSent?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  campaign?: Campaign;
  departmentRelation?: Department;  // Renamed to avoid conflict with department field
  responses?: Response[];
}

// Department Model
export interface Department {
  id: string;
  accountId: string;
  displayName: string;
  standardCategory: string;
  parentId?: string | null;
  unitType?: string | null;
  level?: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  account?: Account;
  participants?: Participant[];
  parent?: Department;
  children?: Department[];
}

// CampaignType Model
export interface CampaignType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  baseQuestions: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  campaigns?: Campaign[];
}

// Question Model
export interface Question {
  id: number;
  text: string;
  category: 'liderazgo' | 'ambiente' | 'desarrollo' | 'bienestar' | 'comunicacion' | 'reconocimiento';
  questionOrder: number;
  isActive: boolean;
  responseType?: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale' | null;
  choiceOptions?: any | null;
  conditionalLogic?: any | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  responses?: Response[];
}

// Response Model
export interface Response {
  id: string;
  participantId: string;
  questionId: number;
  rating?: number | null;
  textResponse?: string | null;
  createdAt: Date | string;
  // Relations
  participant?: Participant;
  question?: Question;
}

// CampaignResult Model
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
  // Relations
  campaign?: Campaign;
}

// ====================================================================
// VIEW MODELS - UI Extensions of Domain Models
// ====================================================================

// Extended Campaign for UI/Dashboard views
export interface CampaignViewModel extends Campaign {
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  canActivate?: boolean;
  canViewResults?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastActivity?: string;
  completionTrend?: 'up' | 'down' | 'stable';
  type?: string; // Alias for campaignType.name
  company?: {
    name: string;
    adminEmail?: string;
  };
}

// Extended Participant for UI views
export interface ParticipantViewModel extends Participant {
  seniorityLevel?: string; // UI alias for seniority
  needsReminder?: boolean; // Calculated field
  engagementLevel?: 'high' | 'medium' | 'low'; // Calculated field
}

// ====================================================================
// API RESPONSE TYPES
// ====================================================================

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
    createdAt: Date | string;
  };
  error?: string;
}

// Participants aggregated data
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
      rate: number;
      displayName?: string;
    }>;
    byPosition: Record<string, { total: number; responded: number; }>;
    bySeniority: Record<string, { total: number; responded: number; }>;
    byLocation: Record<string, { total: number; responded: number; }>;
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

// Analytics data structure
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
  trendDataByDepartment?: Record<string, any>;
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

// Campaign results with analytics
export interface CampaignResultsData {
  campaign: Campaign;
  analytics: Analytics;
}

// ====================================================================
// FORM & INPUT TYPES
// ====================================================================

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
  campaignTypeId: string;
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

// Wizard Types
export interface WizardStep {
  id: number;
  title: string;
  subtitle?: string;
  component: string;
  icon?: string;
  validation?: (data: any) => boolean;
  isCompleted?: boolean;
  isActive?: boolean;
  isOptional?: boolean;
}

export interface WizardFormData {
  // Paso 1: Info Básica
  campaignName: string;
  campaignType: string;
  startDate: Date | string;
  endDate: Date | string;
  description?: string;
  
  // Paso 2: Participantes
  participants: Array<{
    email: string;
    fullName: string;
    department?: string;
    position?: string;
    location?: string;
    seniority?: string;
  }>;
  uploadMethod: 'manual' | 'csv' | 'integration';
  csvFile?: File;
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
  
  // Actions
  goToStep: (stepId: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<WizardFormData>) => void;
  validateStep: (stepId: number) => boolean;
  submitWizard: () => Promise<boolean>;
  resetWizard: () => void;
}

// File Upload Types
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
  fullName: string;
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

// ====================================================================
// UI COMPONENT TYPES
// ====================================================================

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

// State Management Types
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

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date | string;
  campaignId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// ====================================================================
// ANALYTICS & INSIGHTS TYPES
// ====================================================================

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

export interface CampaignStats {
  totalParticipants: number;
  totalResponses: number;
  participationRate: number;
  daysRemaining: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface CategoryScore {
  category: string;
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
  generatedAt: Date | string;
}

export interface SurveyInsight {
  type: 'strength' | 'opportunity' | 'neutral';
  category?: string;
  message: string;
  score?: number;
  confidence?: number;
}

// ====================================================================
// INTELLIGENCE & MONITORING TYPES (WOW Components)
// ====================================================================

// Cockpit Intelligence System
export interface CockpitIntelligence {
  currentRate: number;
  projectedFinal: number;
  confidence: number;
  velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  criticalDepartments: string[];
  topPerformers: string[];
  nextOptimalAction: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedCompletion: Date | string;
  recommendedActions: Array<{
    action: string;
    impact: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high' | 'immediate';
  }>;
  historicalComparison?: {
    betterThanAverage: boolean;
    percentile: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  tacticalAction: TacticalRecommendation;
  departmentMomentum?: DepartmentMomentumData;
}

// Tactical Recommendations
export interface TacticalRecommendation {
  primary: string;
  reasoning: string;
  urgency: 'baja' | 'media' | 'alta' | 'crítica';
  action: 'tactical';
  urgencyColor: string;
}

// Department Momentum Analysis
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
  sparklineData: Array<{ 
    name: string; 
    value: number; 
    velocity: number; 
  }>;
}

// Cross Study Comparison
export interface CrossStudyComparison {
  currentCampaign: {
    id: string;
    name: string;
    participationRate: number;
    daysSinceStart: number;
  };
  historicalAverage: {
    participationRate: number;
    atSamePoint: number;
    finalRate: number;
  };
  bestPerformer: {
    name: string;
    participationRate: number;
    completedIn: number;
  };
  percentileRank: number;
  performanceRating: 'excepcional' | 'sobre promedio' | 'promedio' | 'bajo promedio';
  projection: {
    expectedFinal: number;
    confidence: number;
    daysToGoal: number;
  };
}

// Engagement Heatmap
export interface EngagementHeatmapData {
  hourlyData: Array<{ 
    hour: number; 
    count: number; 
    intensity: number; 
  }>;
  recommendations: Array<{ 
    message: string; 
    confidence: number; 
  }>;
  nextOptimalWindow: { 
    hour: number; 
    day: string; 
    confidence: number; 
  };
  totalEngagementScore: number;
  maxHour: number;
  maxActivity: number;
  totalActivity: number;
  hourBars: Array<{ 
    hour: number; 
    count: number; 
    percentage: number; 
    isPeak: boolean; 
  }>;
}

// Participation Prediction
export interface ParticipationPredictionData {
  finalProjection: number;
  confidence: number;
  velocity: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: Array<{ 
    action: string; 
    impact: number; 
  }>;
  projectionPoints?: Array<{
    dayLabel: string;
    rate: number;
  }>;
  methodology?: string;
  slope?: number;
  intercept?: number;
}

// Monitor Data Types
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

// ====================================================================
// SYSTEM & CONFIGURATION TYPES
// ====================================================================

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

// Permissions & Roles
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

// Audit & Logging
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

// Integrations
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

// Advanced Form Configuration
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

// Advanced Metrics
export interface AdvancedMetrics {
  responseRate: {
    overall: number;
    byDepartment: Record<string, number>;
    byPosition: Record<string, number>;
    trend: Array<{ date: string; rate: number; }>;
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

// Comparison Reports
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

// ====================================================================
// CONTEXT TYPES
// ====================================================================

export interface AuthContextType {
  account: Account | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterFormData) => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

// ====================================================================
// HOOK TYPES
// ====================================================================

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  cacheTime?: number;
  retryCount?: number;
}

// ====================================================================
// ENUMS AND TYPE LITERALS
// ====================================================================

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type QuestionCategory = 'liderazgo' | 'ambiente' | 'desarrollo' | 'bienestar' | 'comunicacion' | 'reconocimiento';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
export type AccountRole = 'CLIENT' | 'FOCALIZAHR_ADMIN';
export type ResponseType = 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale';

// ====================================================================
// UTILITY TYPES
// ====================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DateString = string;
export type UUID = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

// END OF FILE