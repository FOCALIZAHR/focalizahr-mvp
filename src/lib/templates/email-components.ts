// 📧 EMAIL COMPONENTS PREMIUM - FOCALIZAHR ENTERPRISE
// Diseño minimalista Apple/Stripe - Identidad visual FocalizaHR
// Fondo blanco + cyan brand + iconos profesionales enterprise

// ========================================
// 1. FOUNDATION - Variables Design System
// ========================================

export const EMAIL_FOUNDATION = {
  colors: {
    // Marca FocalizaHR
    cyan: '#22D3EE',
    cyanDark: '#0891B2',
    purple: '#A78BFA',
    blue: '#3B82F6',
    
    // Grises profesionales
    slate900: '#0F172A',
    slate800: '#1E293B',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748B',
    slate400: '#94A3B8',
    slate300: '#CBD5E1',
    slate200: '#E2E8F0',
    slate100: '#F1F5F9',
    slate50: '#F8FAFC',
    
    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Backgrounds
    white: '#FFFFFF',
    bgHighlight: 'rgba(34, 211, 238, 0.03)', // Celeste ultra-sutil
    bgHighlightBorder: 'rgba(34, 211, 238, 0.12)'
  },
  
  fonts: {
    primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    fallback: "Arial, Helvetica, sans-serif"
  },
  
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '32px',
    xl: '44px',
    xxl: '56px'
  },
  
  radius: {
    sm: '6px',
    md: '10px',
    lg: '12px',
    full: '9999px'
  }
};

const { colors, fonts, spacing, radius } = EMAIL_FOUNDATION;

// ========================================
// 2. ICONS - SVG Enterprise Profesionales (18px optimizado)
// ========================================

const ICONS = {
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${colors.slate400}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  
  star: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  
  trending: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  
  heart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  
  alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.warning}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

// ========================================
// 3. ATOMS - Elementos Básicos
// ========================================

/**
 * Botón CTA Premium - Estilo Apple minimalista
 */
export function EmailButton({
  text,
  url,
  variant = 'primary'
}: {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  
  const buttonStyles = isPrimary
    ? `background: ${colors.cyan}; 
       color: ${colors.white}; 
       border: none;
       box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);`
    : `background: ${colors.white}; 
       color: ${colors.cyan}; 
       border: 2px solid ${colors.cyan};`;
  
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: ${radius.md}; ${buttonStyles}">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; font-family: ${fonts.primary}; font-size: 15px; font-weight: 600; text-decoration: none; color: inherit; letter-spacing: -0.01em;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Badge minimalista outline - Sutil, no dominante (REDISEÑO)
 */
export function EmailBadge({
  text,
  icon,
  color = 'cyan'
}: {
  text: string;
  icon?: keyof typeof ICONS;
  color?: 'cyan' | 'purple' | 'success';
}) {
  const badgeColors = {
    cyan: { border: colors.cyan, text: colors.cyanDark },
    purple: { border: colors.purple, text: '#7C3AED' },
    success: { border: colors.success, text: '#059669' }
  };
  
  const { border, text: textColor } = badgeColors[color];
  const iconSvg = icon ? ICONS[icon] : '';
  
  return `
    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: ${colors.white}; color: ${textColor}; font-size: 11px; font-weight: 600; border: 1px solid ${border}; border-radius: ${radius.full}; font-family: ${fonts.primary}; letter-spacing: 0.02em; text-transform: uppercase;">
      ${iconSvg ? `<span style="display: inline-flex; width: 14px; height: 14px;">${iconSvg.replace('width="20" height="20"', 'width="14" height="14"')}</span>` : ''}
      ${text}
    </span>
  `;
}

/**
 * Divider sutil - Separador Apple style
 */
export function EmailDivider() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: ${spacing.lg} 0;">
      <tr>
        <td style="height: 1px; background: ${colors.slate100};"></td>
      </tr>
    </table>
  `;
}

/**
 * Highlight Box Premium - Celeste ultra-sutil
 */
export function EmailHighlightBox({
  icon,
  title,
  text,
  variant = 'info'
}: {
  icon?: keyof typeof ICONS;
  title: string;
  text: string;
  variant?: 'info' | 'warning' | 'success';
}) {
  const variants = {
    info: { 
      bg: colors.bgHighlight, 
      border: colors.bgHighlightBorder,
      icon: icon || 'shield'
    },
    warning: { 
      bg: 'rgba(245, 158, 11, 0.03)', 
      border: 'rgba(245, 158, 11, 0.12)',
      icon: icon || 'alert'
    },
    success: { 
      bg: 'rgba(16, 185, 129, 0.03)', 
      border: 'rgba(16, 185, 129, 0.12)',
      icon: icon || 'check'
    }
  };
  
  const { bg, border, icon: defaultIcon } = variants[variant];
  const displayIcon = ICONS[icon || defaultIcon];
  
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: ${spacing.md} 0;">
      <tr>
        <td style="background: ${bg}; border: 1px solid ${border}; border-radius: ${radius.md}; padding: ${spacing.md};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align: top; padding-right: ${spacing.sm}; padding-top: 2px;">
                ${displayIcon}
              </td>
              <td>
                <p style="margin: 0; font-family: ${fonts.primary}; font-size: 14px; line-height: 1.6; color: ${colors.slate700}; letter-spacing: -0.01em;">
                  <strong style="color: ${colors.slate900}; font-weight: 600;">${title}</strong><br>
                  ${text}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// ========================================
// 4. MOLECULES - Componentes Compuestos
// ========================================

/**
 * Header Enterprise - Ultra minimalista
 */
export function EmailHeader({ companyName }: { companyName: string }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.md} ${spacing.lg}; border-bottom: 1px solid ${colors.slate100};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-family: ${fonts.primary}; font-size: 16px; font-weight: 600; color: ${colors.slate900}; letter-spacing: -0.02em;">
                ${companyName}
              </td>
              <td align="right" style="font-family: ${fonts.primary}; font-size: 11px; color: ${colors.slate400}; letter-spacing: 0;">
                powered by <span style="color: ${colors.cyan}; font-weight: 600;">FocalizaHR</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Hero Section Premium - Título gradiente cyan + jerarquía corregida
 */
export function EmailHero({
  title,
  subtitle,
  badge
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.xl} ${spacing.lg} ${spacing.lg} ${spacing.lg}; text-align: center;">
          ${badge ? `<div style="margin-bottom: ${spacing.sm};">${EmailBadge({ text: badge, icon: 'lock', color: 'cyan' })}</div>` : ''}
          <h1 style="margin: 0 0 ${spacing.md} 0; font-family: ${fonts.primary}; font-size: 32px; font-weight: 700; line-height: 1.2; background: linear-gradient(135deg, ${colors.cyan}, ${colors.purple}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: ${colors.slate900}; letter-spacing: -0.03em;">
            ${title}
          </h1>
          <p style="margin: 0; font-family: ${fonts.primary}; font-size: 16px; line-height: 1.5; color: ${colors.slate600}; max-width: 500px; margin-left: auto; margin-right: auto; letter-spacing: -0.01em;">
            ${subtitle}
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Footer Professional - Minimalista
 */
export function EmailFooter() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid ${colors.slate100};">
      <tr>
        <td style="padding: ${spacing.lg}; text-align: center;">
          <p style="margin: 0 0 ${spacing.xs} 0; font-family: ${fonts.primary}; font-size: 13px; line-height: 1.5; color: ${colors.slate500}; letter-spacing: -0.005em;">
            Este estudio es parte de nuestra iniciativa de Inteligencia Organizacional
          </p>
          <p style="margin: 0; font-family: ${fonts.primary}; font-size: 13px; color: ${colors.slate500}; letter-spacing: -0.005em;">
            <a href="https://focalizahr.com" style="color: ${colors.cyan}; text-decoration: none; font-weight: 500;">FocalizaHR</a> · Transformando datos en decisiones estratégicas de talento
          </p>
        </td>
      </tr>
    </table>
  `;
}

// ========================================
// 5. ORGANISMS - Secciones Completas
// ========================================

/**
 * Content Section Premium
 */
export function EmailContentSection({
  greeting,
  paragraphs,
  highlight
}: {
  greeting: string;
  paragraphs: string[];
  highlight?: { icon?: keyof typeof ICONS; title: string; text: string; variant?: 'info' | 'warning' | 'success' };
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.xl} ${spacing.lg} ${spacing.lg} ${spacing.lg};">
          <p style="margin: 0 0 ${spacing.md} 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.7; color: ${colors.slate700}; letter-spacing: -0.01em;">
            ${greeting}
          </p>
          ${paragraphs.map(p => `
            <p style="margin: 0 0 ${spacing.md} 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.7; color: ${colors.slate700}; letter-spacing: -0.01em;">
              ${p}
            </p>
          `).join('')}
          ${highlight ? EmailHighlightBox({
            icon: highlight.icon,
            title: highlight.title,
            text: highlight.text,
            variant: highlight.variant || 'info'
          }) : ''}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Feature List Premium - Iconos outline sin círculo (más pro)
 */
export function EmailFeatureList({ 
  features 
}: { 
  features: { 
    icon?: keyof typeof ICONS;
    title: string; 
    description: string;
  }[] 
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 0 ${spacing.lg};">
      ${features.map((feature, index) => {
        const displayIcon = feature.icon ? ICONS[feature.icon] : '';
        
        return `
        <tr>
          <td style="padding: 6px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 20px; vertical-align: top; padding-top: 1px;">
                  ${displayIcon || `<span style="font-family: ${fonts.primary}; font-size: 18px; font-weight: 600; color: ${colors.cyan};">•</span>`}
                </td>
                <td style="padding-left: 10px; vertical-align: top;">
                  <p style="margin: 0; font-family: ${fonts.primary}; font-size: 14px; line-height: 1.5; color: ${colors.slate600}; letter-spacing: -0.005em;">
                    <strong style="color: ${colors.slate800}; font-weight: 600;">${feature.title}:</strong> ${feature.description}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `}).join('')}
    </table>
  `;
}

/**
 * CTA Section Premium
 */
export function EmailCTASection({
  buttonText,
  buttonUrl,
  metadata
}: {
  buttonText: string;
  buttonUrl: string;
  metadata?: { time?: string; confidential?: boolean };
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.xl} ${spacing.lg};" align="center">
          ${EmailButton({ text: buttonText, url: buttonUrl, variant: 'primary' })}
          ${metadata ? `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: ${spacing.md};">
              <tr>
                ${metadata.time ? `
                  <td style="padding: 0 ${spacing.xs}; text-align: center;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-family: ${fonts.primary}; font-size: 13px; color: ${colors.slate500}; letter-spacing: -0.005em;">
                      ${ICONS.clock}
                      <span>${metadata.time}</span>
                    </span>
                  </td>
                ` : ''}
                ${metadata.confidential ? `
                  <td style="padding: 0 ${spacing.xs}; text-align: center;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-family: ${fonts.primary}; font-size: 13px; color: ${colors.slate500}; letter-spacing: -0.005em;">
                      ${ICONS.lock}
                      <span>Confidencial</span>
                    </span>
                  </td>
                ` : ''}
              </tr>
            </table>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}