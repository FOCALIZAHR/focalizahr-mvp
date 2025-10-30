// 📍 UBICACIÓN: src/app/admin/email-automation/page.tsx
// 🎯 REEMPLAZAR: La constante EMAIL_TEMPLATES (líneas ~40-150)

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'retencion_invitation',
    campaign_type: 'retencion',
    subject: 'Tu experiencia confidencial - {company_name}',
    preview_text: 'Comparte tu experiencia de crecimiento profesional de forma confidencial',
    html_content: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .email-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; background: #ffffff; border-bottom: 1px solid #F1F5F9; }
          .logo-empresa-text { font-size: 20px; font-weight: 700; color: #0F172A; }
          .powered-by { font-size: 11px; color: #94A3B8; }
          .brand-gradient { background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
          .email-hero { padding: 44px 36px 40px; background: #ffffff; text-align: center; }
          .campaign-badge { display: inline-block; padding: 4px 12px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6366F1; margin-bottom: 20px; }
          .email-title { font-size: 32px; font-weight: 600; background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 12px 0; line-height: 1.2; }
          .email-subtitle { font-size: 16px; color: #64748B; font-weight: 400; margin: 0; }
          .email-content { padding: 36px; background: #ffffff; }
          .email-greeting { font-size: 18px; color: #22D3EE; font-weight: 600; margin: 0 0 24px 0; }
          .email-text { font-size: 16px; line-height: 1.75; color: #475569; margin-bottom: 20px; }
          .email-text strong { color: #0F172A; font-weight: 600; }
          .guarantees-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 32px 0; }
          .guarantee-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px 20px; text-align: center; }
          .guarantee-icon { width: 40px; height: 40px; margin: 0 auto 14px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(34,211,238,0.1), rgba(167,139,250,0.1)); }
          .guarantee-title { font-size: 15px; font-weight: 600; color: #0F172A; margin: 0 0 8px 0; }
          .guarantee-desc { font-size: 13px; color: #64748B; line-height: 1.5; margin: 0; }
          .email-cta-section { text-align: center; margin: 36px 0 28px; }
          .email-cta { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22D3EE, #A78BFA); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          .deadline-text { font-size: 14px; color: #94A3B8; margin-top: 20px; }
          .email-footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 28px 32px; text-align: center; }
          .footer-powered { font-size: 11px; color: #94A3B8; margin-bottom: 16px; }
          @media only screen and (max-width: 600px) {
            .email-header { padding: 20px; flex-direction: column; gap: 16px; }
            .email-hero { padding: 32px 24px; }
            .email-content { padding: 28px 24px; }
            .guarantees-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="logo-empresa-text">{company_name}</div>
            <div class="powered-by">powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
          
          <div class="email-hero">
            <div class="campaign-badge">Retención Predictiva</div>
            <h1 class="email-title">Tu experiencia confidencial</h1>
            <p class="email-subtitle">Crecimiento profesional sostenible</p>
          </div>
          
          <div class="email-content">
            <p class="email-greeting">Hola {participant_name},</p>
            
            <p class="email-text">
              En <strong>{company_name}</strong> valoramos tu experiencia. Esta encuesta confidencial (7 preguntas, 5 min) nos ayudará a crear un ambiente donde todos puedan prosperar.
            </p>
            
            <div class="guarantees-grid">
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div class="guarantee-title">100% Confidencial</div>
                <div class="guarantee-desc">Tu identidad protegida. Análisis agregado solamente.</div>
              </div>
              
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="guarantee-title">Solo 5 minutos</div>
                <div class="guarantee-desc">7 preguntas diseñadas científicamente.</div>
              </div>
            </div>
            
            <div class="email-cta-section">
              <a href="{survey_url}" class="email-cta">Completar Encuesta Confidencial</a>
              <div class="deadline-text">Fecha límite: <strong>{deadline}</strong></div>
            </div>
          </div>
          
          <div class="email-footer">
            <div class="footer-powered">Powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['{company_name}', '{participant_name}', '{survey_url}', '{deadline}'],
    tone: 'confidencial + impacto positivo desarrollo',
    estimated_time: '5 minutos'
  },
  {
    id: 'pulso_invitation',
    campaign_type: 'pulso',
    subject: 'Pulso clima laboral - {company_name} (5 min)',
    preview_text: 'Tu opinión ayuda a mejorar el ambiente de trabajo para todos',
    html_content: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .email-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; background: #ffffff; border-bottom: 1px solid #F1F5F9; }
          .logo-empresa-text { font-size: 20px; font-weight: 700; color: #0F172A; }
          .powered-by { font-size: 11px; color: #94A3B8; }
          .brand-gradient { background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
          .email-hero { padding: 44px 36px 40px; background: #ffffff; text-align: center; }
          .campaign-badge { display: inline-block; padding: 4px 12px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #059669; margin-bottom: 20px; }
          .email-title { font-size: 32px; font-weight: 600; background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 12px 0; line-height: 1.2; }
          .email-subtitle { font-size: 16px; color: #64748B; font-weight: 400; margin: 0; }
          .email-content { padding: 36px; background: #ffffff; }
          .email-greeting { font-size: 18px; color: #22D3EE; font-weight: 600; margin: 0 0 24px 0; }
          .email-text { font-size: 16px; line-height: 1.75; color: #475569; margin-bottom: 20px; }
          .email-text strong { color: #0F172A; font-weight: 600; }
          .guarantees-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 32px 0; }
          .guarantee-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px 20px; text-align: center; }
          .guarantee-icon { width: 40px; height: 40px; margin: 0 auto 14px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1)); }
          .guarantee-title { font-size: 15px; font-weight: 600; color: #0F172A; margin: 0 0 8px 0; }
          .guarantee-desc { font-size: 13px; color: #64748B; line-height: 1.5; margin: 0; }
          .email-cta-section { text-align: center; margin: 36px 0 28px; }
          .email-cta { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22D3EE, #A78BFA); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          .deadline-text { font-size: 14px; color: #94A3B8; margin-top: 20px; }
          .email-footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 28px 32px; text-align: center; }
          .footer-powered { font-size: 11px; color: #94A3B8; margin-bottom: 16px; }
          @media only screen and (max-width: 600px) {
            .email-header { padding: 20px; flex-direction: column; gap: 16px; }
            .email-hero { padding: 32px 24px; }
            .email-content { padding: 28px 24px; }
            .guarantees-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="logo-empresa-text">{company_name}</div>
            <div class="powered-by">powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
          
          <div class="email-hero">
            <div class="campaign-badge">Pulso Express</div>
            <h1 class="email-title">5 minutos para un mejor ambiente</h1>
            <p class="email-subtitle">Diagnóstico organizacional rápido</p>
          </div>
          
          <div class="email-content">
            <p class="email-greeting">Hola {participant_name},</p>
            
            <p class="email-text">
              <strong>{company_name}</strong> quiere conocer cómo te sientes en tu trabajo actual. Tu opinión es fundamental para crear un mejor ambiente laboral.
            </p>
            
            <div class="guarantees-grid">
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div class="guarantee-title">100% Anónimo</div>
                <div class="guarantee-desc">Sin identificación personal. Resultados agregados.</div>
              </div>
              
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div class="guarantee-title">Express</div>
                <div class="guarantee-desc">12 preguntas. Máximo 5 minutos.</div>
              </div>
            </div>
            
            <div class="email-cta-section">
              <a href="{survey_url}" class="email-cta">Completar en 5 Minutos</a>
              <div class="deadline-text">Fecha límite: <strong>{deadline}</strong></div>
            </div>
          </div>
          
          <div class="email-footer">
            <div class="footer-powered">Powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['{company_name}', '{participant_name}', '{survey_url}', '{deadline}'],
    tone: 'diagnóstico + mejora continua empresarial',
    estimated_time: '5 minutos'
  },
  {
    id: 'experiencia_invitation',
    campaign_type: 'experiencia',
    subject: 'Assessment desarrollo profesional - {company_name}',
    preview_text: 'Evalúa tu experiencia completa como colaborador',
    html_content: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .email-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; background: #ffffff; border-bottom: 1px solid #F1F5F9; }
          .logo-empresa-text { font-size: 20px; font-weight: 700; color: #0F172A; }
          .powered-by { font-size: 11px; color: #94A3B8; }
          .brand-gradient { background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
          .email-hero { padding: 44px 36px 40px; background: #ffffff; text-align: center; }
          .campaign-badge { display: inline-block; padding: 4px 12px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8B5CF6; margin-bottom: 20px; }
          .email-title { font-size: 32px; font-weight: 600; background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 12px 0; line-height: 1.2; }
          .email-subtitle { font-size: 16px; color: #64748B; font-weight: 400; margin: 0; }
          .email-content { padding: 36px; background: #ffffff; }
          .email-greeting { font-size: 18px; color: #22D3EE; font-weight: 600; margin: 0 0 24px 0; }
          .email-text { font-size: 16px; line-height: 1.75; color: #475569; margin-bottom: 20px; }
          .email-text strong { color: #0F172A; font-weight: 600; }
          .guarantees-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 32px 0; }
          .guarantee-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px 20px; text-align: center; }
          .guarantee-icon { width: 40px; height: 40px; margin: 0 auto 14px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1)); }
          .guarantee-title { font-size: 15px; font-weight: 600; color: #0F172A; margin: 0 0 8px 0; }
          .guarantee-desc { font-size: 13px; color: #64748B; line-height: 1.5; margin: 0; }
          .email-cta-section { text-align: center; margin: 36px 0 28px; }
          .email-cta { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22D3EE, #A78BFA); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          .deadline-text { font-size: 14px; color: #94A3B8; margin-top: 20px; }
          .email-footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 28px 32px; text-align: center; }
          .footer-powered { font-size: 11px; color: #94A3B8; margin-bottom: 16px; }
          @media only screen and (max-width: 600px) {
            .email-header { padding: 20px; flex-direction: column; gap: 16px; }
            .email-hero { padding: 32px 24px; }
            .email-content { padding: 28px 24px; }
            .guarantees-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="logo-empresa-text">{company_name}</div>
            <div class="powered-by">powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
          
          <div class="email-hero">
            <div class="campaign-badge">Experiencia Full</div>
            <h1 class="email-title">Tu voz importa</h1>
            <p class="email-subtitle">Assessment desarrollo profesional</p>
          </div>
          
          <div class="email-content">
            <p class="email-greeting">Hola {participant_name},</p>
            
            <p class="email-text">
              <strong>{company_name}</strong> realizará un assessment completo para entender la experiencia de nuestro equipo y diseñar estrategias de desarrollo organizacional más efectivas.
            </p>
            
            <div class="guarantees-grid">
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div class="guarantee-title">Confidencial</div>
                <div class="guarantee-desc">Respuestas anónimas. Privacidad garantizada.</div>
              </div>
              
              <div class="guarantee-card">
                <div class="guarantee-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div class="guarantee-title">Assessment 360°</div>
                <div class="guarantee-desc">Evaluación completa de experiencia organizacional.</div>
              </div>
            </div>
            
            <div class="email-cta-section">
              <a href="{survey_url}" class="email-cta">Comenzar Assessment</a>
              <div class="deadline-text">Fecha límite: <strong>{deadline}</strong></div>
            </div>
          </div>
          
          <div class="email-footer">
            <div class="footer-powered">Powered by <span class="brand-gradient">FocalizaHR</span></div>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['{company_name}', '{participant_name}', '{survey_url}', '{deadline}'],
    tone: 'confidencial + impacto positivo desarrollo',
    estimated_time: '5 minutos'
  }
];