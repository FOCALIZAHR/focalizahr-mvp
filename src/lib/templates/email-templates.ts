// 📧 TEMPLATES PREMIUM EMAIL - MÓDULO CENTRALIZADO
// Fuente única de verdad para activate/route.ts y email-automation/page.tsx
// Versión: 1.0 - Unificación Sistema Emails FocalizaHR

export interface EmailTemplate {
  id: string;
  campaignTypeSlug: string; // 'retenc ion-predictiva', 'pulso-express', 'experiencia-full'
  subject: string;
  previewText: string;
  htmlContent: string;
  variables: string[];
  tone: string;
  estimatedTime: string;
}

// 🎨 TEMPLATE RETENCIÓN PREDICTIVA - Exit Intelligence
const TEMPLATE_RETENCION = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8fafc;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .email-header { 
      padding: 28px 32px;
      background: #ffffff;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
    }
    .powered-by {
      font-size: 11px;
      color: #94A3B8;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .email-hero {
      padding: 44px 36px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      text-align: center;
    }
    .email-title {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.2;
      margin: 0 0 16px 0;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .email-subtitle {
      font-size: 16px;
      color: #64748B;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    .email-body {
      padding: 36px 32px;
      background: #ffffff;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(167, 139, 250, 0.08));
      border-left: 4px solid #22D3EE;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .highlight-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      padding: 32px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(34, 211, 238, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 211, 238, 0.5);
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 32px 0;
    }
    .feature-item {
      text-align: center;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .feature-text {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }
    .email-footer {
      padding: 28px 32px;
      background: #F8FAFC;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer-text {
      font-size: 13px;
      color: #94A3B8;
      margin: 0 0 8px 0;
    }
    .footer-link {
      color: #22D3EE;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="company-name">{company_name}</div>
      <div class="powered-by">
        powered by <span class="brand-gradient">FocalizaHR</span>
      </div>
    </div>

    <!-- Hero -->
    <div class="email-hero">
      <h1 class="email-title">Tu Experiencia Confidencial</h1>
      <p class="email-subtitle">
        Hola {participant_name}, tu desarrollo profesional es importante para nosotros
      </p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p class="body-text">
        Queremos conocer tu experiencia de crecimiento y desarrollo en {company_name}. 
        Esta encuesta es completamente <strong>confidencial</strong> y tus respuestas nos 
        ayudarán a crear mejores oportunidades para todos.
      </p>

      <div class="highlight-box">
        <p class="highlight-text">
          <strong>🔒 100% Confidencial:</strong> Tus respuestas son anónimas y solo se analizan 
          en conjunto con otros colaboradores. Nadie podrá identificar tus respuestas individuales.
        </p>
      </div>

      <p class="body-text">
        Nos interesa conocer tu perspectiva sobre:
      </p>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <p class="feature-text">Oportunidades de crecimiento</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <p class="feature-text">Claridad de objetivos</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤝</div>
          <p class="feature-text">Apoyo de liderazgo</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💡</div>
          <p class="feature-text">Desarrollo de habilidades</p>
        </div>
      </div>

      <div class="cta-container">
        <a href="{survey_url}" class="cta-button">
          Compartir Mi Experiencia (5 minutos)
        </a>
      </div>

      <p class="body-text" style="text-align: center; margin-top: 24px; font-size: 14px; color: #64748B;">
        ⏱️ Tiempo estimado: 5 minutos<br>
        📊 Anónimo y confidencial
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="footer-text">
        Este estudio es parte de nuestra iniciativa de <strong>Inteligencia Organizacional</strong>
      </p>
      <p class="footer-text">
        <a href="https://focalizahr.com" class="footer-link">FocalizaHR</a> - 
        Transformando datos en decisiones estratégicas de talento
      </p>
    </div>
  </div>
</body>
</html>`;

// 🎨 TEMPLATE PULSO EXPRESS - Clima Organizacional
const TEMPLATE_PULSO = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8fafc;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .email-header { 
      padding: 28px 32px;
      background: #ffffff;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
    }
    .powered-by {
      font-size: 11px;
      color: #94A3B8;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .email-hero {
      padding: 44px 36px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      text-align: center;
    }
    .email-title {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.2;
      margin: 0 0 16px 0;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .email-subtitle {
      font-size: 16px;
      color: #64748B;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    .email-body {
      padding: 36px 32px;
      background: #ffffff;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(167, 139, 250, 0.08));
      border-left: 4px solid #A78BFA;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .highlight-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      padding: 32px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(167, 139, 250, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(167, 139, 250, 0.5);
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 32px 0;
    }
    .feature-item {
      text-align: center;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .feature-text {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }
    .email-footer {
      padding: 28px 32px;
      background: #F8FAFC;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer-text {
      font-size: 13px;
      color: #94A3B8;
      margin: 0 0 8px 0;
    }
    .footer-link {
      color: #22D3EE;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="company-name">{company_name}</div>
      <div class="powered-by">
        powered by <span class="brand-gradient">FocalizaHR</span>
      </div>
    </div>

    <!-- Hero -->
    <div class="email-hero">
      <h1 class="email-title">Pulso Organizacional</h1>
      <p class="email-subtitle">
        Hola {participant_name}, tu opinión sobre nuestro clima laboral es valiosa
      </p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p class="body-text">
        Queremos medir el pulso de nuestro ambiente de trabajo en {company_name}. 
        Esta encuesta rápida nos ayudará a identificar áreas de mejora y celebrar 
        lo que estamos haciendo bien.
      </p>

      <div class="highlight-box">
        <p class="highlight-text">
          <strong>⚡ Express:</strong> Solo 3 minutos de tu tiempo para ayudarnos a 
          construir un mejor lugar de trabajo para todos.
        </p>
      </div>

      <p class="body-text">
        Temas que abordaremos:
      </p>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">🌟</div>
          <p class="feature-text">Ambiente de trabajo</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💪</div>
          <p class="feature-text">Reconocimiento</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <p class="feature-text">Comunicación</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤝</div>
          <p class="feature-text">Trabajo en equipo</p>
        </div>
      </div>

      <div class="cta-container">
        <a href="{survey_url}" class="cta-button">
          Completar Pulso Express (3 minutos)
        </a>
      </div>

      <p class="body-text" style="text-align: center; margin-top: 24px; font-size: 14px; color: #64748B;">
        ⏱️ Tiempo estimado: 3 minutos<br>
        📊 Tus respuestas son confidenciales
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="footer-text">
        Medimos el pulso para mantener nuestro equipo saludable y motivado
      </p>
      <p class="footer-text">
        <a href="https://focalizahr.com" class="footer-link">FocalizaHR</a> - 
        Inteligencia Organizacional en tiempo real
      </p>
    </div>
  </div>
</body>
</html>`;

// 🎨 TEMPLATE EXPERIENCIA FULL - Assessment 360°
const TEMPLATE_EXPERIENCIA = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8fafc;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .email-header { 
      padding: 28px 32px;
      background: #ffffff;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
    }
    .powered-by {
      font-size: 11px;
      color: #94A3B8;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .email-hero {
      padding: 44px 36px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      text-align: center;
    }
    .email-title {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.2;
      margin: 0 0 16px 0;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .email-subtitle {
      font-size: 16px;
      color: #64748B;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    .email-body {
      padding: 36px 32px;
      background: #ffffff;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(167, 139, 250, 0.08));
      border-left: 4px solid #8B5CF6;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .highlight-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      padding: 32px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 32px 0;
    }
    .feature-item {
      text-align: center;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .feature-text {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }
    .email-footer {
      padding: 28px 32px;
      background: #F8FAFC;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer-text {
      font-size: 13px;
      color: #94A3B8;
      margin: 0 0 8px 0;
    }
    .footer-link {
      color: #22D3EE;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="company-name">{company_name}</div>
      <div class="powered-by">
        powered by <span class="brand-gradient">FocalizaHR</span>
      </div>
    </div>

    <!-- Hero -->
    <div class="email-hero">
      <h1 class="email-title">Assessment 360° de Experiencia</h1>
      <p class="email-subtitle">
        Hola {participant_name}, evalúa tu experiencia completa como colaborador
      </p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <p class="body-text">
        Tu experiencia integral en {company_name} es fundamental para nuestro crecimiento. 
        Este assessment completo nos permitirá comprender todas las dimensiones de tu 
        vivencia profesional y crear planes de acción específicos.
      </p>

      <div class="highlight-box">
        <p class="highlight-text">
          <strong>🎯 Assessment Completo:</strong> Evaluación profunda en 8 dimensiones 
          clave que impactan tu experiencia diaria y desarrollo profesional.
        </p>
      </div>

      <p class="body-text">
        Dimensiones que exploraremos:
      </p>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">🎓</div>
          <p class="feature-text">Desarrollo profesional</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🏆</div>
          <p class="feature-text">Liderazgo y dirección</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <p class="feature-text">Condiciones laborales</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🌈</div>
          <p class="feature-text">Cultura organizacional</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚖️</div>
          <p class="feature-text">Balance vida-trabajo</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤲</div>
          <p class="feature-text">Bienestar integral</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔄</div>
          <p class="feature-text">Procesos y sistemas</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <p class="feature-text">Propósito y valores</p>
        </div>
      </div>

      <div class="cta-container">
        <a href="{survey_url}" class="cta-button">
          Iniciar Assessment (10 minutos)
        </a>
      </div>

      <p class="body-text" style="text-align: center; margin-top: 24px; font-size: 14px; color: #64748B;">
        ⏱️ Tiempo estimado: 10 minutos<br>
        📊 Evaluación confidencial y completa
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="footer-text">
        Este assessment genera insights accionables para tu desarrollo
      </p>
      <p class="footer-text">
        <a href="https://focalizahr.com" class="footer-link">FocalizaHR</a> - 
        Transformando experiencias en estrategias de talento
      </p>
    </div>
  </div>
</body>
</html>`;

// 🎨 TEMPLATE GENERAL (Fallback para otros tipos de campaña)
const TEMPLATE_GENERAL = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8fafc;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .email-header { 
      padding: 28px 32px;
      background: #ffffff;
      border-bottom: 1px solid #F1F5F9;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .powered-by {
      font-size: 11px;
      color: #94A3B8;
    }
    .brand-gradient {
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
    }
    .email-hero {
      padding: 44px 36px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      text-align: center;
    }
    .email-title {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.2;
      margin: 0 0 16px 0;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .email-body {
      padding: 36px 32px;
      background: #ffffff;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .cta-container {
      text-align: center;
      padding: 32px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #22D3EE, #A78BFA);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(34, 211, 238, 0.4);
    }
    .email-footer {
      padding: 28px 32px;
      background: #F8FAFC;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer-text {
      font-size: 13px;
      color: #94A3B8;
      margin: 0 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="company-name">{company_name}</div>
      <div class="powered-by">
        powered by <span class="brand-gradient">FocalizaHR</span>
      </div>
    </div>
    <div class="email-hero">
      <h1 class="email-title">Tu Opinión Importa</h1>
    </div>
    <div class="email-body">
      <p class="body-text">
        Hola {participant_name},
      </p>
      <p class="body-text">
        Valoramos tu perspectiva y queremos conocer tu opinión sobre tu experiencia 
        en {company_name}. Tus respuestas nos ayudarán a mejorar continuamente.
      </p>
      <div class="cta-container">
        <a href="{survey_url}" class="cta-button">
          Completar Encuesta
        </a>
      </div>
    </div>
    <div class="email-footer">
      <p class="footer-text">
        <span class="brand-gradient">FocalizaHR</span> - Inteligencia Organizacional
      </p>
    </div>
  </div>
</body>
</html>`;

// 📦 EXPORT: Catálogo de Templates Premium
export const PREMIUM_EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'retencion-predictiva': {
    id: 'retencion_invitation',
    campaignTypeSlug: 'retencion-predictiva',
    subject: 'Tu experiencia confidencial - {company_name}',
    previewText: 'Comparte tu experiencia de crecimiento profesional de forma confidencial',
    htmlContent: TEMPLATE_RETENCION,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Confidencial, profesional, empático',
    estimatedTime: '5 minutos'
  },
  'pulso-express': {
    id: 'pulso_invitation',
    campaignTypeSlug: 'pulso-express',
    subject: 'Pulso Organizacional - {company_name}',
    previewText: 'Tu opinión sobre nuestro clima laboral en solo 3 minutos',
    htmlContent: TEMPLATE_PULSO,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Ágil, directo, motivador',
    estimatedTime: '3 minutos'
  },
  'experiencia-full': {
    id: 'experiencia_invitation',
    campaignTypeSlug: 'experiencia-full',
    subject: 'Assessment 360° - {company_name}',
    previewText: 'Evaluación completa de tu experiencia como colaborador',
    htmlContent: TEMPLATE_EXPERIENCIA,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Profesional, comprensivo, estratégico',
    estimatedTime: '10 minutos'
  },
  'general': {
    id: 'general_invitation',
    campaignTypeSlug: 'general',
    subject: 'Tu opinión importa - {company_name}',
    previewText: 'Comparte tu perspectiva con nosotros',
    htmlContent: TEMPLATE_GENERAL,
    variables: ['participant_name', 'company_name', 'survey_url'],
    tone: 'Universal, adaptable',
    estimatedTime: '5 minutos'
  }
};

// 🔧 FUNCIÓN HELPER: Renderizar template con variables
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