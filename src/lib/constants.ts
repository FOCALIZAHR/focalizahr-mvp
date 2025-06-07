// src/lib/constants.ts
// Business constants and configuration
export const BUSINESS_RULES = {
  CAMPAIGN: {
    MIN_PARTICIPANTS: 5,
    MAX_PARTICIPANTS_FREE: 100,
    MAX_PARTICIPANTS_PRO: 500,
    MAX_PARTICIPANTS_ENTERPRISE: 2000,
    MIN_DURATION_DAYS: 1,
    MAX_DURATION_DAYS: 60,
    AUTO_EXTEND_THRESHOLD: 30, // % participation
    AUTO_EXTEND_DAYS: 7
  },
  PARTICIPATION: {
    LOW_THRESHOLD: 30,
    MEDIUM_THRESHOLD: 50,
    HIGH_THRESHOLD: 75,
    CONFIDENCE_HIGH_MIN_RESPONSES: 50,
    CONFIDENCE_MEDIUM_MIN_RESPONSES: 15,
    CONFIDENCE_LOW_MIN_RESPONSES: 3
  },
  SUBSCRIPTION_LIMITS: {
    free: {
      maxActiveCampaigns: 1,
      maxParticipants: 100,
      maxDuration: 14
    },
    pro: {
      maxActiveCampaigns: 3,
      maxParticipants: 500,
      maxDuration: 30
    },
    enterprise: {
      maxActiveCampaigns: 10,
      maxParticipants: 2000,
      maxDuration: 60
    }
  },
  BENCHMARKS: {
    tecnologia: 3.4,
    retail: 3.1,
    servicios: 3.3,
    manufactura: 2.9,
    salud: 3.6,
    educacion: 3.5,
    construccion: 3.0,
    otro: 3.2,
    default: 3.2
  }
} as const

export const EMAIL_TEMPLATES = {
  SURVEY_INVITATION: {
    subject: 'Tu opinión importa: Participa en nuestro pulso organizacional',
    preheader: 'Ayúdanos a mejorar nuestro ambiente laboral'
  },
  SURVEY_REMINDER: {
    subject: 'Recordatorio: Tu participación es valiosa',
    preheader: 'Solo te tomará unos minutos completar'
  },
  CAMPAIGN_ACTIVATED: {
    subject: 'Campaña activada: {{campaignName}}',
    preheader: 'Tu campaña está en marcha'
  }
} as const

export const API_RATE_LIMITS = {
  DEFAULT: { requests: 60, window: 60 }, // 60 requests per minute
  AUTH: { requests: 10, window: 60 },    // 10 auth attempts per minute
  SURVEY: { requests: 5, window: 60 },    // 5 survey submissions per minute
  METRICS: { requests: 30, window: 60 }   // 30 metrics requests per minute
} as const
