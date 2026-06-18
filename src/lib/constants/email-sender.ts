// src/lib/constants/email-sender.ts
// SSOT del remitente de correo de marca. Dominio .cl (verificado en Resend).
// Lee RESEND_FROM_EMAIL del entorno; el fallback cubre entornos sin la env var.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FocalizaHR <noreply@focalizahr.cl>';
