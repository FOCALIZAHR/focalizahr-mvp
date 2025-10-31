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
  
  'general': {
    id: 'general_invitation',
    campaignTypeSlug: 'general',
    subject: 'Tu opinión importa - {company_name}',
    previewText: 'Comparte tu perspectiva con nosotros',
    htmlContent: TEMPLATE_GENERAL_HTML,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Universal, adaptable',
    estimatedTime: '5 minutos'
  }
};

// ========================================
// FUNCIÓN HELPER: Renderizar Template
// ========================================

export function renderEmailTemplate(
  campaignTypeSlug: string,
  variables: {
    participant_name: string;
    company_name: string;
    survey_url: string;
  }
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