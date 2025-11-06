import { z } from 'zod';

export const enrollmentRequestSchema = z.object({
  accountId: z.string().cuid(),
  nationalId: z.string().regex(/^\d{7,8}-[\dkK]$/),
  fullName: z.string().min(3),
  participantEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().cuid(),
  position: z.string().optional(),
  location: z.string().optional(),
  hireDate: z.date()
}).refine(data => data.participantEmail || data.phoneNumber, {
  message: "Se requiere email O teléfono"
});

export type EnrollmentRequest = z.infer<typeof enrollmentRequestSchema>;