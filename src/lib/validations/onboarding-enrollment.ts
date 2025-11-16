import { z } from 'zod';

export const enrollmentRequestSchema = z.object({
  accountId: z.string().cuid(),
  
  nationalId: z.string()
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT chileno inválido (ejemplo: 12345678-9)'),
  
  fullName: z.string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  
  participantEmail: z.string()
    .email('Formato de email inválido')
    .optional(),
  
  phoneNumber: z.string().optional(),
  
  departmentId: z.string().cuid(),
  
  position: z.string().optional(),
  
  location: z.string().optional(),
  
  hireDate: z.string().transform(val => new Date(val)),
  
  dateOfBirth: z.coerce.date().optional(),
  
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']).optional()
  
}).refine(data => data.participantEmail || data.phoneNumber, {
  message: "Debe proporcionar email o teléfono para contacto"
});

export type EnrollmentRequest = z.infer<typeof enrollmentRequestSchema>;