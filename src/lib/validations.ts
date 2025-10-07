// src/lib/validations.ts - FIX CRÍTICO WIZARD SCHEMA
// PRESERVANDO 100% EL CONTENIDO EXISTENTE + CORRIGIENDO SCHEMA WIZARD
// ✅ AGREGADO: Validaciones RUT + phoneNumber

import { z } from 'zod'
import type { CampaignStatus } from '@/types';
// ========================================
// VALIDACIONES EXISTENTES (PRESERVADAS)
// ========================================

// Auth validations
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password requerido')
})

export const registerSchema = z.object({
  companyName: z.string()
    .min(1, 'Nombre de empresa requerido')
    .max(255, 'Nombre muy largo')
    .regex(/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números, espacios y guiones'),
  adminEmail: z.string()
    .email('Email inválido')
    .toLowerCase(),
  adminName: z.string()
    .min(1, 'Nombre requerido')
    .max(255, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'Solo letras y espacios'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos 1 minúscula, 1 mayúscula y 1 número')
})

// Campaign validations
export const createCampaignSchema = z.object({
  name: z.string()
    .min(1, 'Nombre es requerido')
    .max(255, 'Nombre muy largo')
    .regex(/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ]+$/, 'Solo letras, números, espacios y guiones'),
  description: z.string()
    .max(1000, 'Descripción muy larga')
    .optional(),
  campaignTypeId: z.string()
    .cuid('ID de tipo campaña inválido'),
  startDate: z.string()
    .transform((str) => new Date(str))
    .refine((date) => date >= new Date(), 'Fecha de inicio no puede ser en el pasado'),
  endDate: z.string()
    .transform((str) => new Date(str)),
  sendReminders: z.boolean().default(true),
  anonymousResults: z.boolean().default(true)
}).refine((data) => {
  const diffTime = data.endDate.getTime() - data.startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 1 && diffDays <= 60 // Entre 1 y 60 días
}, {
  message: 'La campaña debe durar entre 1 y 60 días',
  path: ['endDate']
})

// Participant validation
export const participantSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  department: z.string()
    .max(100, 'Departamento muy largo')
    .optional(),
  position: z.string()
    .max(100, 'Posición muy larga')
    .optional(),
  seniorityLevel: z.enum(['junior', 'mid', 'senior', 'executive'])
    .optional(),
  location: z.string()
    .max(100, 'Ubicación muy larga')
    .optional()
})

export const bulkParticipantsSchema = z.object({
  campaignId: z.string().cuid(),
  participants: z.array(participantSchema)
    .min(5, 'Mínimo 5 participantes requeridos')
    .max(500, 'Máximo 500 participantes permitidos')
    .refine((participants) => {
      const emails = participants.map(p => p.email)
      return new Set(emails).size === emails.length
    }, 'Emails duplicados encontrados')
})

// Response validation
export const surveyResponseSchema = z.object({
  token: z.string()
    .min(32, 'Token inválido'),
  responses: z.array(z.object({
    questionId: z.string().cuid(),
    rating: z.number()
      .int()
      .min(1, 'Rating mínimo: 1')
      .max(5, 'Rating máximo: 5'),
    responseTimeSeconds: z.number()
      .int()
      .min(1, 'Tiempo mínimo: 1 segundo')
      .max(3600, 'Tiempo máximo: 1 hora')
      .optional()
  }))
  .min(1, 'Al menos una respuesta requerida')
})

// Account validation
export const updateAccountSchema = z.object({
  companyName: z.string()
    .min(1, 'Nombre de empresa requerido')
    .max(255, 'Nombre muy largo')
    .optional(),
  industry: z.enum([
    'tecnologia',
    'retail', 
    'servicios',
    'manufactura',
    'salud',
    'educacion',
    'construccion',
    'otro'
  ]).optional(),
  companySize: z.enum([
    'micro',     // 1-10
    'pequeña',   // 11-50
    'mediana',   // 51-250
    'grande'     // 251+
  ]).optional()
})

// ========================================
// 🔧 FIX CRÍTICO: WIZARD SCHEMAS CORREGIDOS
// ========================================

// Wizard Step 1 - Información Básica
export const wizardStep1Schema = z.object({
  name: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre muy largo (máximo 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ().,]+$/, 'Caracteres no válidos en el nombre')
    .refine((name) => name.trim().length > 0, 'Nombre no puede estar vacío'),
  
  description: z.string()
    .max(500, 'Descripción muy larga (máximo 500 caracteres)')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  campaignTypeId: z.string()
    .min(1, 'Selecciona un tipo de estudio')
    .cuid('ID de tipo de campaña inválido'),
  
  startDate: z.string()
    .min(1, 'Fecha de inicio es requerida')
    .transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha de inicio inválida');
      }
      return date;
    })
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Fecha de inicio no puede ser en el pasado'),
  
  endDate: z.string()
    .min(1, 'Fecha de fin es requerida')
    .transform((str) => {
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha de fin inválida');
      }
      return date;
    })
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const diffTime = data.endDate.getTime() - data.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 1 && diffDays <= 60;
  }
  return true;
}, {
  message: 'La campaña debe durar entre 1 y 60 días',
  path: ['endDate']
}).refine((data) => {
  return data.endDate > data.startDate;
}, {
  message: 'Fecha de fin debe ser posterior a fecha de inicio',
  path: ['endDate']
});

// Wizard Step 2 - Participantes (Enfoque Concierge)
export const wizardStep2Schema = z.object({
  estimatedParticipants: z.number()
    .int('Debe ser un número entero')
    .min(5, 'Mínimo 5 participantes requeridos para validez estadística')
    .max(500, 'Máximo 500 participantes permitidos en esta versión')
    .refine((num) => num > 0, 'Número de participantes debe ser positivo'),
  
  participantInstructions: z.string()
    .max(1000, 'Instrucciones muy largas (máximo 1000 caracteres)')
    .optional()
    .transform(val => val?.trim() || ''),
  
  // Validaciones para el enfoque concierge
  dataQualityRequirements: z.object({
    requireDepartment: z.boolean().default(false),
    requirePosition: z.boolean().default(false),
    requireSeniority: z.boolean().default(false),
    requireLocation: z.boolean().default(false)
  }).optional(),
  
  segmentationPreferences: z.array(z.enum([
    'department',
    'position', 
    'seniority',
    'location',
    'none'
  ])).default(['department'])
});

// Wizard Step 3 - Configuración Final
export const wizardStep3Schema = z.object({
  sendReminders: z.boolean().default(true),
  anonymousResults: z.boolean().default(true),
  
  // Configuraciones adicionales
  reminderSettings: z.object({
    firstReminder: z.number().int().min(1).max(7).default(3), // días antes del cierre
    secondReminder: z.number().int().min(1).max(5).default(1), // días antes del cierre
    enableFinalReminder: z.boolean().default(true)
  }).optional(),
  
  privacySettings: z.object({
    anonymousResults: z.boolean().default(true),
    allowDataExport: z.boolean().default(true),
    retentionPeriodMonths: z.number().int().min(6).max(24).default(12)
  }).optional(),
  
  // Confirmaciones requeridas
  confirmations: z.object({
    dataProcessingAgreement: z.boolean()
      .refine(val => val === true, 'Debe aceptar el procesamiento de datos'),
    participantNotification: z.boolean()
      .refine(val => val === true, 'Debe confirmar que notificará a los participantes'),
    resultSharing: z.boolean()
      .refine(val => val === true, 'Debe confirmar cómo compartirá los resultados')
  })
});

// 🚨 SOLUCIÓN DEFINITIVA: Schema completo reconstruido manualmente
export const completeWizardSchema = z.object({
  // Paso 1: Información Básica
  name: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre muy largo (máximo 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ().,]+$/, 'Caracteres no válidos en el nombre')
    .refine((name) => name.trim().length > 0, 'Nombre no puede estar vacío'),
  
  description: z.string()
    .max(500, 'Descripción muy larga (máximo 500 caracteres)')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  campaignTypeId: z.string()
    .min(1, 'Selecciona un tipo de estudio')
    .cuid('ID de tipo de campaña inválido'),
  
  startDate: z.string()
    .min(1, 'Fecha de inicio es requerida'),
  
  endDate: z.string()
    .min(1, 'Fecha de fin es requerida'),

  // Paso 2: Participantes (Enfoque Concierge)
  estimatedParticipants: z.number()
    .int('Debe ser un número entero')
    .min(5, 'Mínimo 5 participantes requeridos para validez estadística')
    .max(500, 'Máximo 500 participantes permitidos en esta versión')
    .refine((num) => num > 0, 'Número de participantes debe ser positivo'),
  
  participantInstructions: z.string()
    .max(1000, 'Instrucciones muy largas (máximo 1000 caracteres)')
    .optional()
    .transform(val => val?.trim() || ''),
  
  dataQualityRequirements: z.object({
    requireDepartment: z.boolean().default(false),
    requirePosition: z.boolean().default(false),
    requireSeniority: z.boolean().default(false),
    requireLocation: z.boolean().default(false)
  }).optional(),
  
  segmentationPreferences: z.array(z.enum([
    'department',
    'position', 
    'seniority',
    'location',
    'none'
  ])).default(['department']),

  // Paso 3: Configuración Final
  sendReminders: z.boolean().default(true),
  anonymousResults: z.boolean().default(true),
  
  reminderSettings: z.object({
    firstReminder: z.number().int().min(1).max(7).default(3),
    secondReminder: z.number().int().min(1).max(5).default(1),
    enableFinalReminder: z.boolean().default(true)
  }).optional(),
  
  privacySettings: z.object({
    anonymousResults: z.boolean().default(true),
    allowDataExport: z.boolean().default(true),
    retentionPeriodMonths: z.number().int().min(6).max(24).default(12)
  }).optional(),
  
  confirmations: z.object({
    dataProcessingAgreement: z.boolean()
      .refine(val => val === true, 'Debe aceptar el procesamiento de datos'),
    participantNotification: z.boolean()
      .refine(val => val === true, 'Debe confirmar que notificará a los participantes'),
    resultSharing: z.boolean()
      .refine(val => val === true, 'Debe confirmar cómo compartirá los resultados')
  }).optional()
}).refine((data) => {
  // Validación de fechas
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return startDate >= today && endDate > startDate;
}, {
  message: 'Fechas inválidas: inicio debe ser hoy o futuro, fin debe ser posterior a inicio',
  path: ['endDate']
}).refine((data) => {
  // Validación de duración
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 1 && diffDays <= 60;
}, {
  message: 'La campaña debe durar entre 1 y 60 días',
  path: ['endDate']
});

// ========================================
// VALIDACIONES GESTIÓN DE ESTADOS
// ========================================

// Transición de estados de campaña
export const campaignStateTransitionSchema = z.object({
  campaignId: z.string().cuid('ID de campaña inválido'),
  fromStatus: z.enum(['draft', 'active', 'completed', 'cancelled']),
  toStatus: z.enum(['draft', 'active', 'completed', 'cancelled']),
  action: z.enum(['activate', 'complete', 'cancel', 'reopen']),
  reason: z.string()
    .max(500, 'Razón muy larga')
    .optional(),
  forceTransition: z.boolean().default(false)
}).refine((data) => {
  // Validar transiciones válidas
  const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['active'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};
  
  const allowedTargets = validTransitions[data.fromStatus as keyof typeof validTransitions];
  return data.forceTransition || allowedTargets.includes(data.toStatus);
}, {
  message: 'Transición de estado no válida',
  path: ['toStatus']
});

// Validación para activación de campaña
export const campaignActivationSchema = z.object({
  campaignId: z.string().cuid(),
  minimumParticipants: z.number().int().min(5).default(5),
  validateDates: z.boolean().default(true),
  sendNotifications: z.boolean().default(true),
  
  // Pre-validaciones requeridas
  preValidations: z.object({
    hasParticipants: z.boolean(),
    validDateRange: z.boolean(), 
    configurationComplete: z.boolean(),
    noConflictingCampaigns: z.boolean()
  }).refine((data) => {
    return Object.values(data).every(val => val === true);
  }, 'No se cumplen todos los requisitos para activar la campaña')
});

// ========================================
// ✅ VALIDACIONES PARTICIPANTES CON RUT + PHONENUMBER
// ========================================

// Validación de participante individual (extendida CON RUT + PHONE)
export const participantExtendedSchema = z.object({
  // ✅ RUT OBLIGATORIO
  nationalId: z.string()
    .regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido (formato: 12345678-9)'),
  
  // ✅ EMAIL OPCIONAL
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .refine((email) => {
      if (!email) return true; // Si es undefined/null, es válido (opcional)
      // Validaciones adicionales solo si hay email
      const domain = email.split('@')[1];
      const blockedDomains = ['example.com', 'test.com', 'invalid.com'];
      return !blockedDomains.includes(domain);
    }, 'Dominio de email no válido'),
  
  // ✅ PHONE OPCIONAL (acepta múltiples formatos)
  phoneNumber: z.string()
    .optional()
    .transform(val => {
      if (!val) return undefined;
      // Limpiar espacios, guiones, paréntesis
      const cleaned = val.replace(/[\s\-\(\)]/g, '');
      // Si no tiene +56, agregarlo
      if (cleaned.startsWith('9') && cleaned.length === 9) {
        return `+56${cleaned}`;
      }
      if (cleaned.startsWith('56') && cleaned.length === 11) {
        return `+${cleaned}`;
      }
      if (cleaned.startsWith('+56') && cleaned.length === 12) {
        return cleaned;
      }
      return val; // Devolver original si no coincide
    })
    .refine(
      val => !val || /^\+56[0-9]{9}$/.test(val),
      'Formato celular chileno inválido'
    ),
  
  department: z.string()
    .max(100, 'Departamento muy largo')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  position: z.string()
    .max(100, 'Posición muy larga')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  seniorityLevel: z.enum(['junior', 'mid', 'senior', 'executive'])
    .optional(),
  
  location: z.string()
    .max(100, 'Ubicación muy larga')
    .optional()
    .transform(val => val?.trim() || undefined),
  
  // Campos adicionales para enfoque concierge
  status: z.enum(['pending', 'validated', 'error']).default('pending'),
  errorMessage: z.string().optional(),
  processedAt: z.date().optional(),
  processedBy: z.string().optional(),
  
  // Campos demográficos opcionales
  gender: z.string().optional(),
  dateOfBirth: z.any().optional(),
  hireDate: z.any().optional()
}).refine(
  (data) => data.email || data.phoneNumber,
  { 
    message: 'Debe proporcionar email O phoneNumber (al menos uno)',
    path: ['email'] 
  }
);

// ✅ Validación de carga masiva CON DETECCIÓN DUPLICADOS POR RUT
export const conciergeParticipantsSchema = z.object({
  campaignId: z.string().cuid(),
  participants: z.array(participantExtendedSchema)
    .min(5, 'Mínimo 5 participantes requeridos')
    .max(500, 'Máximo 500 participantes permitidos')
    .refine((participants) => {
      // ✅ CAMBIO CRÍTICO: Validar RUTs únicos (no emails)
      const ruts = participants.map(p => p.nationalId);
      return new Set(ruts).size === ruts.length;
    }, 'RUTs duplicados encontrados')
    .refine((participants) => {
      // Validar calidad mínima de datos
      const validParticipants = participants.filter(p => p.status !== 'error').length;
      return validParticipants >= 5;
    }, 'Debe haber al menos 5 participantes válidos'),
  
  // Metadatos del procesamiento concierge
  processingMetadata: z.object({
    originalFileName: z.string().optional(),
    uploadedAt: z.date().default(() => new Date()),
    processedBy: z.string(), // ID del admin de FocalizaHR que procesó
    dataQuality: z.object({
      totalRows: z.number().int(),
      validRows: z.number().int(),
      duplicatesRemoved: z.number().int(),
      errorsFound: z.number().int()
    }),
    segmentationApplied: z.array(z.string()).default([])
  }),
  
  // Configuraciones de validación
  validationSettings: z.object({
    strictEmailValidation: z.boolean().default(true),
    allowPartialData: z.boolean().default(true),
    autoCorrectCommonErrors: z.boolean().default(true),
    preserveOriginalData: z.boolean().default(true)
  }).optional()
});

// ========================================
// VALIDACIONES DE PREVIEW Y ESTADÍSTICAS
// ========================================

// Schema para estadísticas de participantes
export const participantSummarySchema = z.object({
  total: z.number().int().min(0),
  byDepartment: z.record(z.string(), z.number().int().min(0)),
  byPosition: z.record(z.string(), z.number().int().min(0)),
  bySeniority: z.record(z.string(), z.number().int().min(0)),
  byLocation: z.record(z.string(), z.number().int().min(0)),
  validEmails: z.number().int().min(0),
  duplicates: z.number().int().min(0),
  errors: z.number().int().min(0)
}).refine((data) => {
  // Validar consistencia de datos
  return data.validEmails + data.errors <= data.total;
}, 'Inconsistencia en estadísticas de participantes');

// ========================================
// HELPERS Y UTILIDADES DE VALIDACIÓN
// ========================================

// Función helper para validar pasos del wizard
export const validateWizardStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return wizardStep1Schema.safeParse(data);
    case 2:
      return wizardStep2Schema.safeParse(data);
    case 3:
      return wizardStep3Schema.safeParse(data);
    default:
      return { success: false, error: { errors: [{ message: 'Paso de wizard inválido' }] } };
  }
};

// Función helper para validar transiciones de estado
export const validateStateTransition = (
  fromStatus: string, 
  toStatus: string, 
  campaignData?: any
) => {
  const transitionData = {
    campaignId: campaignData?.id || 'temp',
    fromStatus,
    toStatus,
    action: getActionFromTransition(fromStatus, toStatus),
    forceTransition: false
  };
  
  return campaignStateTransitionSchema.safeParse(transitionData);
};

// Helper para obtener acción desde transición
const getActionFromTransition = (from: string, to: string): string => {
  const actionMap: Record<string, string> = {
    'draft->active': 'activate',
    'active->completed': 'complete',
    'active->cancelled': 'cancel'
  };
  
  return actionMap[`${from}->${to}`] || 'unknown';
};

// ========================================
// VALIDACIONES DE CONFIGURACIÓN AVANZADA
// ========================================

// Schema para configuraciones avanzadas del wizard
export const advancedCampaignConfigSchema = z.object({
  // Configuraciones de email
  emailSettings: z.object({
    customInvitationTemplate: z.string().optional(),
    customReminderTemplate: z.string().optional(),
    fromName: z.string().max(50).default('FocalizaHR'),
    replyToEmail: z.string().email().optional(),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true)
  }).optional(),
  
  // Configuraciones de seguridad
  securitySettings: z.object({
    requireStrongPasswords: z.boolean().default(false),
    enableTwoFactor: z.boolean().default(false),
    sessionTimeout: z.number().int().min(15).max(480).default(60), // minutos
    allowedIpRanges: z.array(z.string()).optional()
  }).optional(),
  
  // Configuraciones de análisis
  analyticsSettings: z.object({
    enableAdvancedAnalytics: z.boolean().default(true),
    includeOpenTextAnalysis: z.boolean().default(false),
    generatePredictiveInsights: z.boolean().default(false),
    compareWithBenchmarks: z.boolean().default(true)
  }).optional(),
  
  // Configuraciones de integración
  integrationSettings: z.object({
    webhookUrl: z.string().url().optional(),
    apiNotifications: z.boolean().default(false),
    exportFormats: z.array(z.enum(['csv', 'excel', 'json', 'pdf'])).default(['csv', 'pdf']),
    autoExportOnCompletion: z.boolean().default(false)
  }).optional()
});

// ========================================
// VALIDACIONES DE ERRORES Y FEEDBACK
// ========================================

// Schema para manejo de errores del wizard
export const wizardErrorSchema = z.object({
  step: z.number().int().min(1).max(3),
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).default('error')
});

// Schema para feedback y sugerencias
export const wizardFeedbackSchema = z.object({
  type: z.enum(['suggestion', 'warning', 'tip', 'requirement']),
  message: z.string(),
  actionRequired: z.boolean().default(false),
  dismissible: z.boolean().default(true)
});

// ========================================
// CONSTANTES DE VALIDACIÓN
// ========================================

export const VALIDATION_CONSTANTS = {
  // Límites de participantes
  MIN_PARTICIPANTS: 5,
  MAX_PARTICIPANTS_FREE: 100,
  MAX_PARTICIPANTS_PRO: 500,
  MAX_PARTICIPANTS_ENTERPRISE: 2000,
  
  // Límites de duración
  MIN_CAMPAIGN_DAYS: 1,
  MAX_CAMPAIGN_DAYS: 60,
  RECOMMENDED_MIN_DAYS: 3,
  RECOMMENDED_MAX_DAYS: 30,
  
  // Límites de texto
  MAX_CAMPAIGN_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_INSTRUCTIONS_LENGTH: 1000,
  
  // Configuraciones de validación
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DOMAIN_BLACKLIST: ['example.com', 'test.com', 'invalid.com'],
  
  // ✅ NUEVAS VALIDACIONES RUT/PHONE
  RUT_REGEX: /^\d{7,8}-[\dkK]$/,
  PHONE_REGEX: /^\+56[0-9]{9}$/,
  
  // Códigos de error
  ERROR_CODES: {
    INVALID_EMAIL: 'INVALID_EMAIL',
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    INSUFFICIENT_PARTICIPANTS: 'INSUFFICIENT_PARTICIPANTS',
    INVALID_TRANSITION: 'INVALID_TRANSITION',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_RUT: 'INVALID_RUT',
    DUPLICATE_RUT: 'DUPLICATE_RUT',
    INVALID_PHONE: 'INVALID_PHONE'
  }
} as const;

// ========================================
// TIPOS TYPESCRIPT DERIVADOS
// ========================================

// Tipos derivados de los schemas para TypeScript
export type WizardStep1Data = z.infer<typeof wizardStep1Schema>;
export type WizardStep2Data = z.infer<typeof wizardStep2Schema>;
export type WizardStep3Data = z.infer<typeof wizardStep3Schema>;
export type CompleteWizardData = z.infer<typeof completeWizardSchema>;

export type ParticipantExtended = z.infer<typeof participantExtendedSchema>;
export type ConciergeParticipantsData = z.infer<typeof conciergeParticipantsSchema>;
export type ParticipantSummary = z.infer<typeof participantSummarySchema>;

export type CampaignStateTransition = z.infer<typeof campaignStateTransitionSchema>;
export type CampaignActivation = z.infer<typeof campaignActivationSchema>;

export type WizardError = z.infer<typeof wizardErrorSchema>;
export type WizardFeedback = z.infer<typeof wizardFeedbackSchema>;

// ========================================
// FUNCIONES DE VALIDACIÓN PERSONALIZADAS
// ========================================

// Validador personalizado para fechas de campaña
export const validateCampaignDates = (startDate: Date, endDate: Date) => {
  const errors: string[] = [];
  
  if (startDate >= endDate) {
    errors.push('Fecha de fin debe ser posterior a fecha de inicio');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate < today) {
    errors.push('Fecha de inicio no puede ser en el pasado');
  }
  
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < VALIDATION_CONSTANTS.MIN_CAMPAIGN_DAYS) {
    errors.push(`Duración mínima: ${VALIDATION_CONSTANTS.MIN_CAMPAIGN_DAYS} día(s)`);
  }
  if (diffDays > VALIDATION_CONSTANTS.MAX_CAMPAIGN_DAYS) {
    errors.push(`Duración máxima: ${VALIDATION_CONSTANTS.MAX_CAMPAIGN_DAYS} días`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    duration: diffDays
  };
};

// Validador personalizado para calidad de participantes
export const validateParticipantQuality = (participants: ParticipantExtended[]) => {
  const summary = {
    total: participants.length,
    valid: 0,
    errors: 0,
    duplicates: 0,
    issues: [] as string[]
  };
  
  const ruts = new Set<string>();
  
  participants.forEach((participant, index) => {
    // ✅ Verificar duplicados por RUT
    if (ruts.has(participant.nationalId)) {
      summary.duplicates++;
      summary.issues.push(`RUT duplicado en línea ${index + 1}: ${participant.nationalId}`);
    } else {
      ruts.add(participant.nationalId);
    }
    
    // Verificar validez
    if (participant.status === 'error') {
      summary.errors++;
      if (participant.errorMessage) {
        summary.issues.push(`Error en línea ${index + 1}: ${participant.errorMessage}`);
      }
    } else {
      summary.valid++;
    }
  });
  
  return {
    ...summary,
    qualityScore: summary.total > 0 ? Math.round((summary.valid / summary.total) * 100) : 0,
    meetsMinimum: summary.valid >= VALIDATION_CONSTANTS.MIN_PARTICIPANTS
  };
};