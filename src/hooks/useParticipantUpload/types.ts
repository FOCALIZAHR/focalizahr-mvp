// src/hooks/useParticipantUpload/types.ts

// Enum para género (debe coincidir con el de Prisma)
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

// Datos de participante extendidos con campos demográficos
export interface ParticipantData {
  email: string;
  name?: string;
  department?: string;
  position?: string;
  location?: string;
  dateOfBirth?: string;  // ISO string o formato DD/MM/YYYY
  gender?: Gender | string;
}

// Departamento de la empresa
export interface Department {
  id: string;
  displayName: string;
  standardCategory: string | null;
  isActive: boolean;
}

// Resultado del upload
export interface UploadResult {
  success: boolean;
  totalProcessed: number;
  validRecords: number;
  duplicates: number;
  errors: string[];
  participants: ParticipantData[];
}

// Estadísticas demográficas
export interface DemographicsStats {
  totalParticipants: number;
  withDemographics: number;
  genderDistribution: {
    male: number;
    female: number;
    nonBinary: number;
    notSpecified: number;
  };
  ageDistribution: {
    '18-25': number;
    '26-35': number;
    '36-45': number;
    '46-55': number;
    '56+': number;
  };
  averageAge: number;
}

// Estado del upload
export type UploadStep = 'idle' | 'uploading' | 'previewing' | 'preview' | 'confirming' | 'complete' | 'error';

// Estado completo del componente
export interface ParticipantUploadState {
  uploadFile: File | null;
  uploading: boolean;
  processing: boolean;
  uploadResult: UploadResult | null;
  previewData: ParticipantData[];
  uploadError: string | null;
  uploadProgress: number;
  departments: Department[];
  selectedDepartmentId: string;
  loadingDepartments: boolean;
  demographicsStats: DemographicsStats | null;
  currentStep: UploadStep;
}

// Acciones del reducer
export type ParticipantUploadAction =
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULT'; payload: { 
      result: UploadResult; 
      participants: ParticipantData[]; 
      demographics: DemographicsStats | null 
    }}
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_SELECTED_DEPARTMENT'; payload: string }
  | { type: 'SET_LOADING_DEPARTMENTS'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: UploadStep }
  | { type: 'RESET' };

// Props para el componente principal
export interface ParticipantUploaderProps {
  campaignId: string;
  campaignName: string;
  onUploadComplete?: (result: { totalLoaded: number; participants: ParticipantData[] }) => void;
  onError?: (error: string) => void;
  maxParticipants?: number;
  allowedFormats?: string[];
  showPreview?: boolean;
  mode?: 'admin' | 'client';
}