// FOCALIZAHR - Email Automation Service CORE
// Archivo: src/lib/services/email-automation.ts
// CORRIGIDO: Solo service class, sin routes ni hooks

import { Resend } from 'resend';
import { FROM_EMAIL } from '@/lib/constants/email-sender';

// Interfaces básicas
interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

interface CampaignEmailData {
  id: string;
  type: string;
  participantEmail: string;
  participantName?: string;
  companyName: string;
  surveyUrl: string;
}

// Templates email diferenciados por campaign_type
const EMAIL_TEMPLATES = {
  'retencion-predictiva': {
    subject: 'Tu experiencia confidencial - Crecimiento profesional',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Retención Predictiva</h1>
          <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">Tu experiencia importa para el crecimiento</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Hola {{participant_name}},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            En <strong>{{company_name}}</strong> valoramos tu experiencia y perspectiva. Queremos entender mejor los factores que influyen en la retención del talento para crear un ambiente donde todos puedan prosperar.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #6366F1; margin: 0 0 15px 0; font-size: 18px;">¿Por qué participar?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;">Encuesta confidencial de solo 7 preguntas estratégicas</li>
              <li style="margin-bottom: 8px;">Tiempo estimado: 5-7 minutos</li>
              <li style="margin-bottom: 8px;">Lógica adaptativa basada en tus respuestas</li>
              <li style="margin-bottom: 8px;">Resultados contribuyen a mejoras organizacionales</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{survey_url}}" style="background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Completar Encuesta Confidencial
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 14px; color: #6B7280; line-height: 1.5;">
              <strong>Confidencialidad garantizada:</strong> Tus respuestas son completamente anónimas y se utilizarán únicamente para análisis agregado y mejora organizacional.
            </p>
            <p style="font-size: 14px; color: #6B7280; margin-top: 15px;">
              Fecha límite: {{survey_deadline}}
            </p>
          </div>
        </div>
      </div>
    `
  },
  
  'pulso-express': {
    subject: '5 minutos - Diagnóstico clima laboral rápido',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Pulso Express</h1>
          <p style="color: #A7F3D0; margin: 10px 0 0 0; font-size: 16px;">Diagnóstico rápido del clima laboral</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Hola {{participant_name}},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            <strong>{{company_name}}</strong> quiere conocer cómo te sientes en tu trabajo actual. Tu opinión es fundamental para crear un mejor ambiente laboral para todos.
          </p>
          
          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #10B981; margin: 0 0 15px 0; font-size: 18px;">⚡ Diagnóstico Express</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;"><strong>Solo 12 preguntas</strong> - Máximo 5 minutos</li>
              <li style="margin-bottom: 8px;"><strong>100% anónimo</strong> - Sin identificación personal</li>
              <li style="margin-bottom: 8px;"><strong>Resultados inmediatos</strong> - Para mejoras rápidas</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{survey_url}}" style="background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Completar en 5 Minutos
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 20px;">
            Fecha límite: {{survey_deadline}}
          </p>
        </div>
      </div>
    `
  },
  
  'experiencia-full': {
    subject: 'Assessment desarrollo - Tu voz importa',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Experiencia Full</h1>
          <p style="color: #DDD6FE; margin: 10px 0 0 0; font-size: 16px;">Assessment completo de desarrollo organizacional</p>
        </div>
        
        <div style="padding: 0 20px;">
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Hola {{participant_name}},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            <strong>{{company_name}}</strong> ha decidido realizar un assessment completo para entender profundamente la experiencia de nuestro equipo y diseñar estrategias de desarrollo organizacional más efectivas.
          </p>
          
          <div style="background-color: #FAF5FF; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #8B5CF6;">
            <h3 style="color: #8B5CF6; margin: 0 0 15px 0; font-size: 18px;">🎯 Assessment Completo</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;"><strong>35 preguntas estratégicas</strong> - Tiempo estimado: 15-20 minutos</li>
              <li style="margin-bottom: 8px;"><strong>8 dimensiones organizacionales</strong> - Análisis integral</li>
              <li style="margin-bottom: 8px;"><strong>Resultados detallados</strong> - Plan de acción específico</li>
              <li style="margin-bottom: 8px;"><strong>Confidencialidad total</strong> - Datos agregados únicamente</li>
            </ul>
          </div>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="font-size: 14px; color: #4B5563; margin: 0; text-align: center;">
              💡 <strong>Tu participación es clave</strong> para diseñar mejoras que realmente impacten positivamente tu experiencia laboral.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{survey_url}}" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Iniciar Assessment Completo
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 20px;">
            Fecha límite: {{survey_deadline}} | Tiempo estimado: 15-20 minutos
          </p>
        </div>
      </div>
    `
  }
};

// EmailAutomationService Class ÚNICAMENTE
export class EmailAutomationService {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email automation will use mock mode.');
      this.resend = new Resend('demo-key');
    } else {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  // Validar configuración automation
  async validateAutomationConfig(campaignId: string): Promise<boolean> {
    try {
      // Simular validación por ahora
      // TODO: Implementar validación real contra base de datos
      return !!(campaignId && campaignId.length > 0);
    } catch (error) {
      console.error('Error validating automation config:', error);
      return false;
    }
  }

  // Enviar invitaciones campaña
  async sendCampaignInvitations(campaignId: string): Promise<EmailMetrics> {
    try {
      // Mock data por ahora - TODO: Integrar con base de datos real
      const mockParticipants: CampaignEmailData[] = [
        {
          id: '1',
          type: 'retencion-predictiva',
          participantEmail: 'test@example.com',
          participantName: 'Test Usuario',
          companyName: 'Empresa Demo',
          surveyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/encuesta/mock-token-1`
        }
      ];

      let sent = 0;
      for (const participant of mockParticipants) {
        await this.sendInvitationEmail(participant);
        sent++;
      }

      return {
        sent,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
      };

    } catch (error) {
      console.error('Error sending campaign invitations:', error);
      throw error;
    }
  }

  // Enviar email individual
  private async sendInvitationEmail(data: CampaignEmailData): Promise<void> {
    try {
      const template = EMAIL_TEMPLATES[data.type as keyof typeof EMAIL_TEMPLATES] || EMAIL_TEMPLATES['pulso-express'];
      
      // Reemplazar variables
      let htmlContent = template.html
        .replace(/\{\{participant_name\}\}/g, data.participantName || 'Estimado/a colaborador/a')
        .replace(/\{\{company_name\}\}/g, data.companyName)
        .replace(/\{\{survey_url\}\}/g, data.surveyUrl)
        .replace(/\{\{survey_deadline\}\}/g, '15 días desde hoy');

      // En modo desarrollo, solo log
      if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
        console.log('📧 EMAIL SIMULADO:', {
          to: data.participantEmail,
          subject: template.subject,
          campaignType: data.type
        });
        return;
      }

      // Envío real con Resend
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: data.participantEmail,
        subject: template.subject,
        html: htmlContent
      });

    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  }

  // Programar recordatorios
  async scheduleReminders(campaignId: string): Promise<void> {
    try {
      // Mock implementation - TODO: Implementar scheduling real
      console.log(`📅 Recordatorios programados para campaña ${campaignId}`);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  // Obtener métricas email
  async getEmailMetrics(campaignId: string): Promise<EmailMetrics> {
    try {
      // Mock metrics - TODO: Implementar métricas reales
      return {
        sent: 15,
        delivered: 14,
        opened: 8,
        clicked: 3,
        bounced: 1
      };
    } catch (error) {
      console.error('Error getting email metrics:', error);
      throw error;
    }
  }

  // Procesar webhook Resend
  async processWebhook(webhookData: any): Promise<void> {
    try {
      // TODO: Implementar procesamiento webhook
      console.log('📬 Webhook procesado:', webhookData.type);
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
}

// Instancia singleton
export const emailAutomationService = new EmailAutomationService();