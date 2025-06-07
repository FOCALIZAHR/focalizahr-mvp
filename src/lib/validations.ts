// src/lib/validations.ts
import { z } from 'zod'
// AGREGAR ESTAS LÍNEAS AL INICIO DE src/lib/validations.ts (después del import de zod)

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