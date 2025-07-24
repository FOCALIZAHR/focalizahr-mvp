// ====================================================================
// FOCALIZAHR DEPARTMENTS - TYPESCRIPT TYPES
// src/types/departments.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// ====================================================================

// ✅ DEPARTMENT BASE INTERFACE
export interface Department {
  id: string;
  accountId: string;
  displayName: string;
  standardCategory: string | null;
  isActive: boolean;
  createdAt: Date;
}

// ✅ DEPARTMENT WITH STATISTICS
export interface DepartmentWithStats extends Department {
  participantCount: number;
}

// ✅ CREATE DEPARTMENT DATA
export interface CreateDepartmentData {
  displayName: string;
  standardCategory?: string;
}

// ✅ UPDATE DEPARTMENT DATA
export interface UpdateDepartmentData {
  displayName?: string;
  standardCategory?: string;
}

// ✅ DEPARTMENT STANDARD CATEGORIES
export const DEPARTMENT_CATEGORIES = {
  VENTAS: 'ventas',
  MARKETING: 'marketing', 
  DESARROLLO: 'desarrollo',
  RRHH: 'rrhh',
  OPERACIONES: 'operaciones',
  FINANZAS: 'finanzas',
  OTROS: 'otros',
} as const;

export type DepartmentCategory = typeof DEPARTMENT_CATEGORIES[keyof typeof DEPARTMENT_CATEGORIES];

// ✅ DEPARTMENT CATEGORY LABELS (SPANISH)
export const DEPARTMENT_CATEGORY_LABELS: Record<DepartmentCategory, string> = {
  ventas: 'Ventas y Comercial',
  marketing: 'Marketing y Comunicaciones',
  desarrollo: 'Desarrollo y TI',
  rrhh: 'Recursos Humanos',
  operaciones: 'Operaciones y Logística',
  finanzas: 'Finanzas y Contabilidad',
  otros: 'Otros',
};

// ✅ API RESPONSE INTERFACES
export interface DepartmentApiResponse {
  success: boolean;
  department?: DepartmentWithStats;
  error?: string;
  message?: string;
}

export interface DepartmentsListApiResponse {
  success: boolean;
  departments: DepartmentWithStats[];
  total: number;
  error?: string;
}

export interface BulkCreateDepartmentsRequest {
  departmentNames: string[];
}

export interface BulkCreateDepartmentsResponse {
  success: boolean;
  created: number;
  departments: DepartmentWithStats[];
  total: number;
  message?: string;
  error?: string;
}

// ✅ DEPARTMENT ANALYTICS INTERFACES
export interface DepartmentAnalytics {
  departmentId: string;
  displayName: string;
  standardCategory: string | null;
  participantCount: number;
  responseCount: number;
  participationRate: number;
  averageScore?: number;
  categoryScores?: { [category: string]: number };
}

export interface EnrichedCampaignAnalytics {
  // Original analytics (snake_case preserved)
  overall_score: number;
  participation_rate: number;
  category_scores: { [category: string]: number };
  department_scores?: { [dept: string]: number };
  
  // Enhanced department analytics (camelCase)
  departmentScoresDisplay?: { [displayName: string]: number };
  departmentMapping?: { [standardCategory: string]: string };
  departmentStats?: {
    totalDepartments: number;
    configuredDepartments: number;
    averageParticipation: number;
  };
  departmentAnalytics?: DepartmentAnalytics[];
}

// ✅ DEPARTMENT FILTER OPTIONS
export interface DepartmentFilter {
  category?: DepartmentCategory;
  isActive?: boolean;
  hasParticipants?: boolean;
  minParticipants?: number;
}

// ✅ DEPARTMENT SORT OPTIONS
export type DepartmentSortField = 'displayName' | 'standardCategory' | 'participantCount' | 'createdAt';
export type DepartmentSortOrder = 'asc' | 'desc';

export interface DepartmentSort {
  field: DepartmentSortField;
  order: DepartmentSortOrder;
}

// ✅ DEPARTMENT VALIDATION ERRORS
export interface DepartmentValidationError {
  field: string;
  message: string;
  code: string;
}

// ✅ DEPARTMENT FORM STATES
export interface DepartmentFormState {
  displayName: string;
  standardCategory: DepartmentCategory | '';
  isLoading: boolean;
  errors: DepartmentValidationError[];
}

// ✅ UTILITY TYPES
export type DepartmentId = string;
export type DepartmentName = string;
export type DepartmentMapping = Record<DepartmentName, DepartmentId | null>;

// ✅ HOOKS RETURN TYPES
export interface UseDepartmentsReturn {
  departments: DepartmentWithStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createDepartment: (data: CreateDepartmentData) => Promise<DepartmentWithStats>;
  updateDepartment: (id: string, data: UpdateDepartmentData) => Promise<DepartmentWithStats>;
  deleteDepartment: (id: string) => Promise<void>;
  bulkCreateDepartments: (names: string[]) => Promise<BulkCreateDepartmentsResponse>;
}