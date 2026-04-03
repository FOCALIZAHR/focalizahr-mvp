// 📧 EMAIL TEMPLATES PREMIUM - FOCALIZAHR ENTERPRISE
// Diseño minimalista Apple/Stripe - Fondo blanco + identidad cyan FocalizaHR
// Total: 5 productos + 2 recordatorios + 1 general = 8 templates

import {
  EmailHeader,
  EmailHero,
  EmailContentSection,
  EmailFeatureList,
  EmailCTASection,
  EmailFooter,
  EmailHighlightBox,
  EMAIL_FOUNDATION
} from './email-components';

const { colors } = EMAIL_FOUNDATION;

// ========================================
// INTERFACES
// ========================================

export interface EmailTemplate {
  id: string;
  campaignTypeSlug: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  variables: string[];
  tone: string;
  estimatedTime: string;
  ccManager?: boolean;
}

// ========================================
// HELPER: Generar estructura base HTML
// ========================================

function createEmailHTML(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fhr-button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.slate50}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${colors.slate50};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: ${colors.white}; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ========================================
// 1. RETENCIÓN PREDICTIVA - Exit Intelligence
// ========================================

const TEMPLATE_RETENCION_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Tu Experiencia Confidencial',
    subtitle: 'Hola {participant_name}, tu desarrollo profesional es importante para nosotros',
    badge: '100% Confidencial'
  })}
  
  ${EmailContentSection({
    greeting: 'Queremos conocer tu experiencia de crecimiento y desarrollo en {company_name}.',
    paragraphs: [
      'Esta encuesta es completamente confidencial y tus respuestas nos ayudarán a crear mejores oportunidades para todos.',
      'Nos interesa conocer tu perspectiva sobre aspectos clave de tu desarrollo profesional:'
    ],
    highlight: {
      icon: 'shield',
      title: '100% Confidencial',
      text: 'Tus respuestas son anónimas y solo se analizan en conjunto. Nadie podrá identificar tus respuestas individuales.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'trending', title: 'Oportunidades de crecimiento', description: 'Evalúa las posibilidades de desarrollo en tu área' },
      { icon: 'target', title: 'Claridad de objetivos', description: 'Analiza cómo se comunican las metas y expectativas' },
      { icon: 'users', title: 'Apoyo de liderazgo', description: 'Mide el soporte que recibes de tu jefatura directa' },
      { icon: 'star', title: 'Desarrollo de habilidades', description: 'Identifica espacios de mejora y capacitación' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Compartir Mi Experiencia',
    buttonUrl: '{survey_url}',
    metadata: { time: '5 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 2. PULSO EXPRESS - Clima Organizacional
// ========================================

const TEMPLATE_PULSO_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Pulso Organizacional',
    subtitle: 'Hola {participant_name}, tu opinión sobre nuestro clima laboral es valiosa',
    badge: 'Express'
  })}
  
  ${EmailContentSection({
    greeting: 'Queremos medir el pulso de nuestro ambiente de trabajo en {company_name}.',
    paragraphs: [
      'Esta encuesta rápida nos ayudará a identificar áreas de mejora y celebrar lo que estamos haciendo bien.',
      'Abordaremos temas fundamentales del día a día:'
    ],
    highlight: {
      icon: 'clock',
      title: 'Rápido y Efectivo',
      text: 'Solo 3 minutos de tu tiempo para ayudarnos a construir un mejor lugar de trabajo para todos.',
      variant: 'success'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'heart', title: 'Ambiente de trabajo', description: 'Evalúa las condiciones y clima laboral actual' },
      { icon: 'star', title: 'Reconocimiento', description: 'Mide cómo se valora tu contribución al equipo' },
      { icon: 'users', title: 'Comunicación', description: 'Analiza la efectividad de los canales internos' },
      { icon: 'target', title: 'Trabajo en equipo', description: 'Identifica fortalezas y desafíos colaborativos' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Completar Pulso Express',
    buttonUrl: '{survey_url}',
    metadata: { time: '3 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 3. EXPERIENCIA FULL - Assessment 360°
// ========================================

const TEMPLATE_EXPERIENCIA_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Assessment 360° de Experiencia',
    subtitle: 'Hola {participant_name}, evalúa tu experiencia completa como colaborador',
    badge: 'Evaluación Completa'
  })}
  
  ${EmailContentSection({
    greeting: 'Tu experiencia integral en {company_name} es fundamental para nuestro crecimiento.',
    paragraphs: [
      'Este assessment completo nos permitirá comprender todas las dimensiones de tu vivencia profesional y crear planes de acción específicos.',
      'Exploraremos 8 dimensiones estratégicas que impactan tu experiencia diaria:'
    ],
    highlight: {
      icon: 'target',
      title: 'Evaluación Profunda',
      text: 'Assessment en dimensiones clave que impactan tu experiencia diaria y desarrollo profesional.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'trending', title: 'Desarrollo profesional', description: 'Oportunidades de crecimiento y capacitación' },
      { icon: 'users', title: 'Liderazgo y dirección', description: 'Efectividad del management y comunicación' },
      { icon: 'target', title: 'Condiciones laborales', description: 'Recursos, herramientas y entorno físico' },
      { icon: 'heart', title: 'Cultura organizacional', description: 'Valores, misión y propósito compartido' },
      { icon: 'star', title: 'Balance vida-trabajo', description: 'Flexibilidad y bienestar integral' },
      { icon: 'check', title: 'Procesos y sistemas', description: 'Eficiencia operacional y claridad' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Iniciar Assessment',
    buttonUrl: '{survey_url}',
    metadata: { time: '10 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 4. AMBIENTE SANO - Ley Karin
// ========================================

const TEMPLATE_AMBIENTE_SANO_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Ambiente de Trabajo Saludable',
    subtitle: 'Hola {participant_name}, tu bienestar es nuestra prioridad',
    badge: 'Ley Karin'
  })}
  
  ${EmailContentSection({
    greeting: 'Como parte de nuestro compromiso con un ambiente laboral saludable y en cumplimiento de la Ley Karin, queremos conocer tu percepción sobre nuestro entorno de trabajo.',
    paragraphs: [
      'Esta encuesta es completamente confidencial y nos ayudará a identificar áreas de mejora para garantizar un espacio laboral seguro y respetuoso para todos.',
      'Evaluaremos aspectos fundamentales del ambiente laboral:'
    ],
    highlight: {
      icon: 'shield',
      title: 'Protección Garantizada',
      text: 'Tus respuestas son confidenciales y se analizan solo en conjunto. Nadie podrá identificar tus respuestas individuales.',
      variant: 'success'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'check', title: 'Respeto y trato digno', description: 'Evalúa el nivel de respeto en las interacciones diarias' },
      { icon: 'shield', title: 'Ambiente libre de acoso', description: 'Mide la seguridad psicológica en el entorno laboral' },
      { icon: 'users', title: 'Comunicación saludable', description: 'Analiza la calidad de las relaciones interpersonales' },
      { icon: 'heart', title: 'Seguridad psicológica', description: 'Identifica espacios de mejora en bienestar emocional' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Participar en Evaluación',
    buttonUrl: '{survey_url}',
    metadata: { time: '5-7 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 5. ONBOARDING DAY 1 - Bienvenida
// ========================================

const TEMPLATE_ONBOARDING_D1_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: '¡Bienvenido al Equipo!',
    subtitle: 'Hola {participant_name}, queremos conocer tus primeras impresiones',
    badge: 'Día 1'
  })}
  
  ${EmailContentSection({
    greeting: '¡Felicitaciones por tu primer día en {company_name}!',
    paragraphs: [
      'Tu experiencia desde el día uno es importante para nosotros. Este breve cuestionario nos ayudará a entender cómo fue tu proceso de bienvenida e integración inicial.',
      'Nos interesa conocer tu perspectiva sobre:'
    ],
    highlight: {
      icon: 'star',
      title: 'Tu Voz Importa',
      text: 'Tus respuestas nos ayudarán a mejorar la experiencia de bienvenida para futuros colaboradores.',
      variant: 'success'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'check', title: 'Proceso de onboarding', description: 'Calidad de la inducción y materiales recibidos' },
      { icon: 'users', title: 'Primera impresión', description: 'Recepción del equipo y ambiente inicial' },
      { icon: 'target', title: 'Claridad de rol', description: 'Comprensión de responsabilidades y expectativas' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Compartir Primera Impresión',
    buttonUrl: '{survey_url}',
    metadata: { time: '3 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 6. ONBOARDING DAY 7 - Primera Semana
// ========================================

const TEMPLATE_ONBOARDING_D7_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Primera Semana Completa',
    subtitle: 'Hola {participant_name}, ¿cómo ha sido tu integración?',
    badge: 'Día 7'
  })}
  
  ${EmailContentSection({
    greeting: 'Ya completaste tu primera semana en {company_name}. ¡Felicitaciones!',
    paragraphs: [
      'Queremos conocer cómo ha sido tu experiencia de integración durante estos primeros días y si necesitas apoyo adicional en algún aspecto.',
      'Evaluaremos tu experiencia en:'
    ],
    highlight: {
      icon: 'trending',
      title: 'Mejora Continua',
      text: 'Tu feedback nos permite identificar oportunidades de mejora en tiempo real para apoyarte mejor.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'users', title: 'Integración al equipo', description: 'Calidad de las relaciones con compañeros' },
      { icon: 'check', title: 'Herramientas y recursos', description: 'Acceso a sistemas y materiales necesarios' },
      { icon: 'target', title: 'Claridad de procesos', description: 'Comprensión de workflows y procedimientos' },
      { icon: 'heart', title: 'Apoyo recibido', description: 'Soporte de jefatura directa y equipo' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Evaluar Primera Semana',
    buttonUrl: '{survey_url}',
    metadata: { time: '5 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 7. REMINDER 1 - Recordatorio Amable (3 días)
// ========================================

const TEMPLATE_REMINDER_1_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Recordatorio Amable',
    subtitle: 'Hola {participant_name}, aún estamos esperando tu participación'
  })}
  
  ${EmailContentSection({
    greeting: 'Te enviamos este recordatorio amigable porque tu opinión es muy valiosa para nosotros.',
    paragraphs: [
      'Hace unos días te invitamos a participar en nuestro estudio y queremos asegurarnos de que tuviste oportunidad de compartir tu perspectiva.',
      'Si no has podido completar la encuesta, te recordamos que:'
    ],
    highlight: {
      icon: 'star',
      title: 'Tus Respuestas Importan',
      text: 'Cada participación nos ayuda a tomar mejores decisiones para todo el equipo.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'clock', title: 'Tiempo estimado', description: 'Solo toma unos minutos completarla' },
      { icon: 'lock', title: 'Confidencialidad', description: 'Tus respuestas son completamente anónimas' },
      { icon: 'trending', title: 'Impacto directo', description: 'Tu feedback genera cambios reales' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Completar Encuesta Ahora',
    buttonUrl: '{survey_url}',
    metadata: { time: 'Unos minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 📧 TEMPLATES ONBOARDING FALTANTES
// Para agregar a: src/lib/templates/email-templates.ts
// ========================================

// Copiar estas constantes ANTES de la línea "// ========================================// 7. REMINDER 1"

// ========================================
// 3. ONBOARDING DAY 30 - Primer Mes (Culture)
// ========================================

const TEMPLATE_ONBOARDING_D30_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Primer Mes Cumplido',
    subtitle: 'Hola {participant_name}, ¿cómo te sientes con la cultura de equipo?',
    badge: 'Día 30'
  })}
  
  ${EmailContentSection({
    greeting: '¡Felicitaciones por completar tu primer mes en {company_name}!',
    paragraphs: [
      'Después de 30 días trabajando con nosotros, queremos conocer tu percepción sobre la cultura organizacional, los valores que vivimos día a día, y qué tan alineado te sientes con el equipo.',
      'Evaluaremos tu experiencia en:'
    ],
    highlight: {
      icon: 'heart',
      title: 'Alineación Cultural',
      text: 'Tu feedback nos ayuda a fortalecer nuestra cultura y asegurar que todos nos sentimos parte del mismo propósito.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'heart', title: 'Valores compartidos', description: 'Alineación con principios y cultura organizacional' },
      { icon: 'users', title: 'Sentido de pertenencia', description: 'Conexión emocional con el equipo y la empresa' },
      { icon: 'star', title: 'Ambiente de trabajo', description: 'Clima laboral y relaciones interpersonales' },
      { icon: 'target', title: 'Propósito y misión', description: 'Comprensión del impacto de tu trabajo' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Evaluar Experiencia Cultural',
    buttonUrl: '{survey_url}',
    metadata: { time: '6 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 4. ONBOARDING DAY 90 - Tercer Mes (Connection)
// ========================================

const TEMPLATE_ONBOARDING_D90_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: '90 Días de Crecimiento',
    subtitle: 'Hola {participant_name}, completaste tu onboarding - ¿te proyectas con nosotros?',
    badge: 'Día 90'
  })}
  
  ${EmailContentSection({
    greeting: '¡Hemos llegado a un hito importante! Ya completaste 90 días en {company_name}.',
    paragraphs: [
      'Este es el momento perfecto para reflexionar sobre tu experiencia completa, tu visión de futuro en la organización, y el nivel de compromiso que sientes con tu desarrollo profesional aquí.',
      'En esta última evaluación exploraremos:'
    ],
    highlight: {
      icon: 'trending',
      title: 'Proyección de Futuro',
      text: 'Tu visión a largo plazo nos permite diseñar planes de carrera alineados con tus expectativas y nuestras oportunidades.',
      variant: 'success'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'trending', title: 'Proyección de carrera', description: 'Visión de tu desarrollo profesional a largo plazo' },
      { icon: 'target', title: 'Compromiso organizacional', description: 'Nivel de engagement con la empresa y tu rol' },
      { icon: 'star', title: 'Satisfacción general', description: 'Evaluación integral de tu experiencia onboarding' },
      { icon: 'heart', title: 'Sentido de permanencia', description: 'Te visualizas construyendo tu carrera aquí' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Completar Evaluación Final',
    buttonUrl: '{survey_url}',
    metadata: { time: '7 minutos', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 8. REMINDER 2 - Último Recordatorio (7 días)
// ========================================

const TEMPLATE_REMINDER_2_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Última Oportunidad',
    subtitle: 'Hola {participant_name}, el estudio cierra pronto'
  })}
  
  ${EmailContentSection({
    greeting: 'Este es nuestro último recordatorio antes de cerrar el estudio.',
    paragraphs: [
      'Tu participación es fundamental para tener una visión completa y representativa. Aún estás a tiempo de compartir tu perspectiva y contribuir a las decisiones que afectarán a todo el equipo.',
      'Te recordamos que:'
    ],
    highlight: {
      icon: 'alert',
      title: 'Cierre Próximo',
      text: 'El estudio cerrará en los próximos días. No pierdas esta oportunidad de hacer escuchar tu voz.',
      variant: 'warning'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'clock', title: 'Rapidez', description: 'Proceso simple y rápido de completar' },
      { icon: 'lock', title: 'Confidencialidad total', description: 'Respuestas anónimas garantizadas' },
      { icon: 'trending', title: 'Impacto real', description: 'Tu opinión genera cambios concretos' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Participar Antes del Cierre',
    buttonUrl: '{survey_url}',
    metadata: { time: 'Última oportunidad', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// 9. GENERAL - Fallback Universal
// ========================================

const TEMPLATE_GENERAL_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Tu Opinión Importa',
    subtitle: 'Hola {participant_name}, queremos conocer tu perspectiva'
  })}
  
  ${EmailContentSection({
    greeting: 'Valoramos tu perspectiva y queremos conocer tu opinión sobre tu experiencia en {company_name}.',
    paragraphs: [
      'Esta encuesta nos ayudará a mejorar continuamente y crear un mejor ambiente para todos.',
      'Tu participación es voluntaria y todas tus respuestas serán tratadas con confidencialidad.'
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Completar Encuesta',
    buttonUrl: '{survey_url}',
    metadata: { confidential: true }
  })}
  
  ${EmailFooter()}
`);

// ========================================
// CATÁLOGO COMPLETO DE TEMPLATES
// ========================================

export const PREMIUM_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'retencion-predictiva': {
    id: 'retencion_invitation',
    campaignTypeSlug: 'retencion-predictiva',
    subject: 'Tu experiencia confidencial - {company_name}',
    previewText: 'Comparte tu experiencia de crecimiento profesional de forma confidencial',
    htmlContent: TEMPLATE_RETENCION_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Confidencial, profesional, empático',
    estimatedTime: '5 minutos'
  },
  
  'pulso-express': {
    id: 'pulso_invitation',
    campaignTypeSlug: 'pulso-express',
    subject: 'Pulso Organizacional - {company_name}',
    previewText: 'Tu opinión sobre nuestro clima laboral en solo 3 minutos',
    htmlContent: TEMPLATE_PULSO_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Ágil, directo, motivador',
    estimatedTime: '3 minutos'
  },
  
  'experiencia-full': {
    id: 'experiencia_invitation',
    campaignTypeSlug: 'experiencia-full',
    subject: 'Assessment 360° - {company_name}',
    previewText: 'Evaluación completa de tu experiencia como colaborador',
    htmlContent: TEMPLATE_EXPERIENCIA_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Profesional, comprensivo, estratégico',
    estimatedTime: '10 minutos'
  },
  
  'pulso-ambientes-sanos': {
    id: 'ambiente_sano_invitation',
    campaignTypeSlug: 'pulso-ambientes-sanos',
    subject: 'Ambiente de Trabajo Saludable - {company_name}',
    previewText: 'Tu bienestar es nuestra prioridad - Evaluación Ley Karin',
    htmlContent: TEMPLATE_AMBIENTE_SANO_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Serio, respetuoso, protector',
    estimatedTime: '5-7 minutos'
  },
  
  'onboarding-day-1': {
    id: 'onboarding_d1',
    campaignTypeSlug: 'onboarding-day-1',
    subject: '¡Bienvenido al equipo! - {company_name}',
    previewText: 'Comparte tu primera impresión con nosotros',
    htmlContent: TEMPLATE_ONBOARDING_D1_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Cálido, acogedor, entusiasta',
    estimatedTime: '3 minutos'
  },
  
  'onboarding-day-7': {
    id: 'onboarding_d7',
    campaignTypeSlug: 'onboarding-day-7',
    subject: 'Primera semana completa - {company_name}',
    previewText: '¿Cómo ha sido tu integración hasta ahora?',
    htmlContent: TEMPLATE_ONBOARDING_D7_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Supportivo, interesado, constructivo',
    estimatedTime: '5 minutos'
  },
  
  
  
'onboarding-day-30': {
    id: 'onboarding_d30',
    campaignTypeSlug: 'onboarding-day-30',
    subject: 'Primer mes cumplido - {company_name}',
    previewText: '¿Cómo te sientes con la cultura de equipo?',
    htmlContent: TEMPLATE_ONBOARDING_D30_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Reflexivo, cultural, alineación de valores',
    estimatedTime: '6 minutos'
  },
  
  'onboarding-day-90': {
    id: 'onboarding_d90',
    campaignTypeSlug: 'onboarding-day-90',
    subject: '90 días de crecimiento - {company_name}',
    previewText: '¿Te proyectas construyendo tu carrera con nosotros?',
    htmlContent: TEMPLATE_ONBOARDING_D90_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Evaluativo, proyección futura, compromiso',
    estimatedTime: '7 minutos'
  },

  'reminder-1': {
    id: 'reminder_1',
    campaignTypeSlug: 'reminder-1',
    subject: 'Recordatorio: Tu participación es importante - {company_name}',
    previewText: 'Aún estamos esperando tu opinión',
    htmlContent: TEMPLATE_REMINDER_1_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Amable, respetuoso, no insistente',
    estimatedTime: 'Unos minutos'
  },
  
  'reminder-2': {
    id: 'reminder_2',
    campaignTypeSlug: 'reminder-2',
    subject: 'Última oportunidad: Estudio cierra pronto - {company_name}',
    previewText: 'No pierdas la oportunidad de hacer escuchar tu voz',
    htmlContent: TEMPLATE_REMINDER_2_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Urgente pero respetuoso, última llamada',
    estimatedTime: 'Última oportunidad'
  },

  // ════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE EVALUATION - RECORDATORIOS ESCALAMIENTO 3 NIVELES
  // ════════════════════════════════════════════════════════════════════════════

  'performance-reminder-level-1': {
    id: 'perf_reminder_1',
    campaignTypeSlug: 'performance-reminder-level-1',
    subject: '🔔 Recordatorio Amigable - Evaluación {evaluatee_name}',
    previewText: 'Tu feedback es valioso para el desarrollo del equipo',
    variables: ['evaluator_name', 'evaluatee_name', 'evaluatee_position', 'days_remaining', 'evaluation_url', 'company_name'],
    tone: 'Amigable, respetuoso, sin presión',
    estimatedTime: '10 minutos',
    htmlContent: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22D3EE;">Hola {evaluator_name},</h2>

        <p style="color: #64748B; line-height: 1.6;">
          Te recordamos que tienes pendiente completar la evaluación de desempeño de:
        </p>

        <div style="background: linear-gradient(135deg, #22D3EE20, #A78BFA20); padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #1E293B;">
            <strong style="color: #22D3EE;">{evaluatee_name}</strong><br>
            <span style="color: #64748B; font-size: 14px;">{evaluatee_position}</span>
          </p>
        </div>

        <p style="color: #64748B;">
          El ciclo cierra en <strong style="color: #F59E0B;">{days_remaining} días</strong>.
          Tu feedback es muy valioso para el desarrollo del equipo.
        </p>

        <a href="{evaluation_url}" style="display: inline-block; background: linear-gradient(90deg, #22D3EE, #06B6D4); color: #FFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          Completar Evaluación
        </a>

        <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
          ¿Necesitas ayuda? Responde a este email o contacta a RRHH.
        </p>
      </div>
    `
  },

  'performance-reminder-level-2': {
    id: 'perf_reminder_2',
    campaignTypeSlug: 'performance-reminder-level-2',
    subject: '⏰ Urgente - Evaluación {evaluatee_name} por Vencer',
    previewText: 'El plazo está por cumplirse',
    variables: ['evaluator_name', 'evaluatee_name', 'days_remaining', 'evaluation_url'],
    tone: 'Urgente pero profesional',
    estimatedTime: '10 minutos',
    htmlContent: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F59E0B20; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400E;">
            <strong>⏰ RECORDATORIO URGENTE</strong>
          </p>
        </div>

        <h2 style="color: #1E293B;">{evaluator_name},</h2>

        <p style="color: #64748B; line-height: 1.6;">
          El plazo para completar la evaluación de <strong>{evaluatee_name}</strong>
          está por vencer en <strong style="color: #F59E0B;">{days_remaining} días</strong>.
        </p>

        <p style="color: #64748B;">
          Tu evaluación es fundamental para:
        </p>
        <ul style="color: #64748B;">
          <li>Decisiones de desarrollo profesional</li>
          <li>Planificación de capacitaciones</li>
          <li>Feedback constructivo al colaborador</li>
        </ul>

        <a href="{evaluation_url}" style="display: inline-block; background: #F59E0B; color: #FFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600;">
          Completar Ahora
        </a>

        <p style="color: #94A3B8; font-size: 12px;">
          Si tienes algún impedimento, por favor contacta a RRHH cuanto antes.
        </p>
      </div>
    `
  },

  'performance-reminder-level-3': {
    id: 'perf_reminder_3',
    campaignTypeSlug: 'performance-reminder-level-3',
    subject: '🚨 CRÍTICO - Última Oportunidad Evaluación {evaluatee_name}',
    previewText: 'Acción requerida inmediata',
    variables: ['evaluator_name', 'evaluatee_name', 'days_remaining', 'evaluation_url'],
    tone: 'Crítico, escalado a gerencia',
    estimatedTime: '10 minutos',
    ccManager: true,
    htmlContent: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #EF444420; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #991B1B;">
            <strong>🚨 ACCIÓN REQUERIDA INMEDIATA</strong>
          </p>
        </div>

        <h2 style="color: #1E293B;">{evaluator_name},</h2>

        <p style="color: #EF4444; font-weight: 600; font-size: 16px;">
          El ciclo de evaluación cierra en {days_remaining} días y tu evaluación de
          <strong>{evaluatee_name}</strong> aún está pendiente.
        </p>

        <p style="color: #64748B; line-height: 1.6;">
          <strong>Impacto de no completar a tiempo:</strong>
        </p>
        <ul style="color: #64748B;">
          <li>{evaluatee_name} no recibirá feedback constructivo</li>
          <li>Proceso de calibración se verá afectado</li>
          <li>Decisiones de talento podrían retrasarse</li>
        </ul>

        <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E; font-size: 14px;">
            <strong>⚠️ Nota:</strong> Este mensaje ha sido copiado a tu gerente.
            Si no completas antes del cierre, se escalará a HR Leadership.
          </p>
        </div>

        <a href="{evaluation_url}" style="display: inline-block; background: #EF4444; color: #FFF; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 700; font-size: 16px;">
          COMPLETAR AHORA
        </a>

        <p style="color: #94A3B8; font-size: 12px;">
          Para cualquier consulta urgente, contacta a RRHH inmediatamente.
        </p>
      </div>
    `
  },

  // ════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE EVALUATION - REPORTE INDIVIDUAL DISPONIBLE
  // ════════════════════════════════════════════════════════════════════════════

  'performance-report-ready': {
    id: 'performance_report_ready',
    campaignTypeSlug: 'performance-report-ready',
    subject: '📊 Tu Reporte de Desempeño está Disponible - {cycle_name}',
    previewText: 'Accede a tu feedback 360° personalizado',
    variables: ['employee_name', 'cycle_name', 'report_url', 'expiration_days', 'company_name'],
    tone: 'Profesional, motivador',
    estimatedTime: '5 minutos',
    htmlContent: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22D3EE, #A78BFA); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Tu Reporte de Desempeño</h1>
          <p style="color: #E0E7FF; margin: 10px 0 0 0;">Feedback 360° Personalizado</p>
        </div>

        <h2 style="color: #1E293B;">Hola {employee_name},</h2>

        <p style="color: #64748B; line-height: 1.6;">
          Nos complace informarte que tu reporte de desempeño del ciclo
          <strong>{cycle_name}</strong> ya está disponible.
        </p>

        <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #065F46;">
            <strong>✨ Tu reporte incluye:</strong>
          </p>
          <ul style="color: #047857; margin: 10px 0 0 20px;">
            <li>Resultados consolidados 360°</li>
            <li>Fortalezas destacadas</li>
            <li>Áreas de desarrollo priorizadas</li>
            <li>Plan de acción sugerido</li>
          </ul>
        </div>

        <a href="{report_url}" style="display: inline-block; background: linear-gradient(90deg, #22D3EE, #06B6D4); color: #FFF; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600; font-size: 16px;">
          Acceder a Mi Reporte
        </a>

        <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E; font-size: 14px;">
            <strong>⏰ Importante:</strong> Este link estará disponible por {expiration_days} días.
            Te recomendamos revisarlo pronto y guardar una copia si lo necesitas.
          </p>
        </div>

        <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
          Este reporte es <strong>confidencial</strong> y solo para tu uso personal.
          Úsalo como guía para tu desarrollo profesional y conversaciones con tu manager.
        </p>

        <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
          ¿Preguntas sobre tu reporte? Contacta a RRHH o tu manager directo.
        </p>
      </div>
    `
  },

  'general': {
    id: 'general_invitation',
    campaignTypeSlug: 'general',
    subject: 'Tu opinión importa - {company_name}',
    previewText: 'Comparte tu perspectiva con nosotros',
    htmlContent: TEMPLATE_GENERAL_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Universal, adaptable',
    estimatedTime: '5 minutos'
  },
  // ========================================
  // CEO → RRHH: Caso de compensación
  // ========================================
  'ceo-compensation-case': {
    id: 'ceo_compensation_case',
    campaignTypeSlug: 'ceo-compensation-case',
    subject: 'Caso compensación — {employee_name}',
    previewText: 'Caso de revisión pre-compensación enviado por {ceo_name}',
    htmlContent: createEmailHTML(`
      <div style="text-align:center; margin-bottom:28px;">
        <h1 style="color:#f8fafc; font-size:22px; font-weight:300; margin:0 0 6px;">
          Caso de Compensación
        </h1>
        <p style="color:#64748b; font-size:13px; font-weight:300; margin:0;">
          Enviado por <span style="color:#22D3EE;">{ceo_name}</span> desde FocalizaHR
        </p>
      </div>
      <div style="background:rgba(30,41,59,0.5); border:1px solid rgba(51,65,85,0.3); border-radius:12px; padding:20px; margin-bottom:20px;">
        <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 8px;">Colaborador</p>
        <p style="color:#e2e8f0; font-size:16px; font-weight:400; margin:0 0 4px;">{employee_name}</p>
        <p style="color:#64748b; font-size:12px; margin:0;">{department}</p>
      </div>
      <div style="background:rgba(30,41,59,0.5); border:1px solid rgba(51,65,85,0.3); border-radius:12px; padding:20px; margin-bottom:20px;">
        <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 8px;">Hallazgo</p>
        <p style="color:#f59e0b; font-size:13px; font-weight:400; margin:0 0 8px;">{category}</p>
        <p style="color:#94a3b8; font-size:13px; font-weight:300; line-height:1.6; margin:0;">{observation}</p>
      </div>
      <div style="background:rgba(30,41,59,0.5); border:1px solid rgba(51,65,85,0.3); border-radius:12px; padding:20px; margin-bottom:20px;">
        <p style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 8px;">Comentario del CEO</p>
        <p style="color:#e2e8f0; font-size:13px; font-weight:300; line-height:1.6; font-style:italic; margin:0;">"{ceo_comment}"</p>
      </div>
      <p style="color:#475569; font-size:11px; text-align:center; margin-top:24px;">
        Este caso fue generado por el sistema de inteligencia pre-compensación de FocalizaHR.
      </p>
    `),
    variables: ['ceo_name', 'employee_name', 'department', 'category', 'observation', 'ceo_comment'],
    tone: 'Ejecutivo, directo',
    estimatedTime: '1 minuto'
  }
};

// ========================================
// FUNCIÓN HELPER: Renderizar Template
// ========================================

export function renderEmailTemplate(
  campaignTypeSlug: string,
  variables: Record<string, string>
): { subject: string; html: string } {
  // Buscar template específico o usar general como fallback
  const template = PREMIUM_EMAIL_TEMPLATES[campaignTypeSlug] || PREMIUM_EMAIL_TEMPLATES['general'];
  
  let subject = template.subject;
  let html = template.htmlContent;
  
  // Reemplazar variables en subject y HTML
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    subject = subject.replaceAll(placeholder, value);
    html = html.replaceAll(placeholder, value);
  });
  
  return { subject, html };
}