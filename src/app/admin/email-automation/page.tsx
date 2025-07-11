"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, Users, CheckCircle, AlertTriangle, Settings, Calendar, Target, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';

interface EmailTemplate {
  id: string;
  campaign_type: 'retencion' | 'pulso' | 'experiencia';
  subject: string;
  preview_text: string;
  html_content: string;
  variables: string[];
  tone: string;
  estimated_time: string;
}

interface Campaign {
  id: string;
  name: string;
  campaign_type: 'retencion' | 'pulso' | 'experiencia';
  company_name: string;
  participants_count: number;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  deadline: string;
}

interface AutomationRule {
  id: string;
  trigger: 'campaign_activated' | 'reminder_1' | 'reminder_2' | 'campaign_completed';
  delay_hours: number;
  enabled: boolean;
  template_id: string;
}

// Email templates diferenciados por campaign_type
const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'retencion_invitation',
    campaign_type: 'retencion',
    subject: 'Tu experiencia confidencial - {company_name} (5 minutos)',
    preview_text: 'Comparte tu experiencia de crecimiento profesional de forma confidencial',
    html_content: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Tu Experiencia Confidencial</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Análisis Retención Predictiva - {company_name}</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; margin-bottom: 20px; color: #22D3EE;">Hola {participant_name},</p>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">Tu experiencia y perspectiva son fundamentales para construir un ambiente de trabajo donde todos puedan desarrollarse profesionalmente.</p>
          
          <p style="line-height: 1.6; margin-bottom: 25px;"><strong style="color: #A78BFA;">Este análisis es completamente confidencial</strong> y está diseñado para identificar oportunidades de crecimiento mutuo entre tú y {company_name}.</p>
          
          <div style="background: rgba(34, 211, 238, 0.1); border-left: 4px solid #22D3EE; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600; color: #22D3EE;">⏱️ Solo 5 minutos de tu tiempo</p>
            <p style="margin: 5px 0 0; opacity: 0.9;">7 preguntas estratégicas sobre tu experiencia profesional</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="{survey_url}" style="display: inline-block; background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);">
              Compartir Mi Experiencia
            </a>
          </div>
          
          <p style="line-height: 1.6; margin-bottom: 15px; font-size: 14px; opacity: 0.8;">Tu feedback ayudará a {company_name} a crear mejores oportunidades de desarrollo para todo el equipo.</p>
          
          <p style="font-size: 14px; opacity: 0.7; margin-bottom: 5px;">Fecha límite: {deadline}</p>
          <p style="font-size: 14px; opacity: 0.7;">¿Preguntas? Responde este email directamente.</p>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; text-align: center; font-size: 12px; opacity: 0.6;">
          <p style="margin: 0;">Enviado por FocalizaHR - Análisis Organizacional Confidencial</p>
        </div>
      </div>
    `,
    variables: ['{company_name}', '{participant_name}', '{survey_url}', '{deadline}'],
    tone: 'confidencial + impacto positivo desarrollo',
    estimated_time: '5 minutos'
  },
  {
    id: 'pulso_invitation',
    campaign_type: 'pulso',
    subject: 'Diagnóstico clima laboral - {company_name} (5 minutos)',
    preview_text: 'Tu opinión ayuda a mejorar el ambiente de trabajo para todos',
    html_content: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Diagnóstico Clima Laboral</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Pulso Express - {company_name}</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; margin-bottom: 20px; color: #22D3EE;">Hola {participant_name},</p>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">Queremos conocer tu perspectiva sobre el clima laboral actual en {company_name} para identificar fortalezas y oportunidades de mejora.</p>
          
          <p style="line-height: 1.6; margin-bottom: 25px;"><strong style="color: #A78BFA;">Tu feedback es anónimo</strong> y será usado para implementar mejoras concretas que beneficien a todo el equipo.</p>
          
          <div style="background: rgba(167, 139, 250, 0.1); border-left: 4px solid #A78BFA; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600; color: #A78BFA;">⚡ Diagnóstico Rápido</p>
            <p style="margin: 5px 0 0; opacity: 0.9;">12 preguntas clave sobre ambiente laboral y liderazgo</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="{survey_url}" style="display: inline-block; background: linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(167, 139, 250, 0.3);">
              Participar en Diagnóstico
            </a>
          </div>
          
          <p style="line-height: 1.6; margin-bottom: 15px; font-size: 14px; opacity: 0.8;">Juntos construiremos un mejor ambiente laboral en {company_name}.</p>
          
          <p style="font-size: 14px; opacity: 0.7; margin-bottom: 5px;">Fecha límite: {deadline}</p>
          <p style="font-size: 14px; opacity: 0.7;">¿Dudas? Responde este email.</p>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; text-align: center; font-size: 12px; opacity: 0.6;">
          <p style="margin: 0;">Enviado por FocalizaHR - Diagnóstico Organizacional</p>
        </div>
      </div>
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
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Assessment Desarrollo Profesional</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Experiencia Completa - {company_name}</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; margin-bottom: 20px; color: #22D3EE;">Hola {participant_name},</p>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">Tu desarrollo profesional es una prioridad para {company_name}. Este assessment integral nos ayudará a entender tu experiencia completa como colaborador.</p>
          
          <p style="line-height: 1.6; margin-bottom: 25px;"><strong style="color: #A78BFA;">Evaluación 360°</strong> que abarca desde onboarding hasta oportunidades de crecimiento futuro.</p>
          
          <div style="background: rgba(34, 211, 238, 0.1); border-left: 4px solid #22D3EE; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600; color: #22D3EE;">📊 Assessment Completo</p>
            <p style="margin: 5px 0 0; opacity: 0.9;">35 preguntas sobre tu experiencia integral como colaborador</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="{survey_url}" style="display: inline-block; background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);">
              Iniciar Assessment
            </a>
          </div>
          
          <p style="line-height: 1.6; margin-bottom: 15px; font-size: 14px; opacity: 0.8;">Tu feedback detallado permitirá a {company_name} crear planes de desarrollo personalizados.</p>
          
          <p style="font-size: 14px; opacity: 0.7; margin-bottom: 5px;">Tiempo estimado: 15-20 minutos</p>
          <p style="font-size: 14px; opacity: 0.7; margin-bottom: 5px;">Fecha límite: {deadline}</p>
          <p style="font-size: 14px; opacity: 0.7;">¿Consultas? Responde este email.</p>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; text-align: center; font-size: 12px; opacity: 0.6;">
          <p style="margin: 0;">Enviado por FocalizaHR - Assessment Profesional</p>
        </div>
      </div>
    `,
    variables: ['{company_name}', '{participant_name}', '{survey_url}', '{deadline}'],
    tone: 'desarrollo + crecimiento profesional integral',
    estimated_time: '15-20 minutos'
  }
];

// Default automation rules
const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  { id: 'activation_invite', trigger: 'campaign_activated', delay_hours: 0, enabled: true, template_id: 'retencion_invitation' },
  { id: 'reminder_1', trigger: 'reminder_1', delay_hours: 72, enabled: true, template_id: 'retencion_invitation' },
  { id: 'reminder_2', trigger: 'reminder_2', delay_hours: 144, enabled: true, template_id: 'retencion_invitation' },
  { id: 'completion_thanks', trigger: 'campaign_completed', delay_hours: 0, enabled: false, template_id: 'retencion_invitation' }
];

export default function EmailAutomationSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [emailMetrics, setEmailMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVariables, setPreviewVariables] = useState({
    company_name: 'Mi Empresa',
    participant_name: 'María González',
    survey_url: 'https://focalizahr.com/encuesta/abc123',
    deadline: '15 de Agosto, 2025'
  });

  const { success, info, warning, error } = useToast();

  // Sample campaigns data con métricas actualizadas
  const sampleCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Análisis Retención Q3 2025',
      campaign_type: 'retencion',
      company_name: 'TechStart SpA',
      participants_count: 45,
      status: 'active',
      created_at: '2025-07-01',
      deadline: '2025-08-15'
    },
    {
      id: '2', 
      name: 'Pulso Clima Laboral Julio',
      campaign_type: 'pulso',
      company_name: 'Innovación Verde',
      participants_count: 23,
      status: 'draft',
      created_at: '2025-07-05',
      deadline: '2025-08-20'
    },
    {
      id: '3',
      name: 'Experiencia Colaborador 2025',
      campaign_type: 'experiencia', 
      company_name: 'Servicios Pro',
      participants_count: 67,
      status: 'completed',
      created_at: '2025-06-15',
      deadline: '2025-07-30'
    }
  ];

  // Hook personalizado para email automation
  const useEmailAutomation = () => {
    const activateAutomation = async (campaignId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/campaigns/${campaignId}/email-automation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
          success(
            `Se enviaron ${data.metrics.sent} invitaciones a participantes`,
            "¡Automation Activada!"
          );
          await loadEmailMetrics(campaignId);
        } else {
          throw new Error(data.error);
        }

      } catch (err) {
        error(
          'Error al activar automation de emails. Intenta nuevamente.',
          'Error Automation'
        );
      } finally {
        setIsLoading(false);
      }
    };

    const sendTestEmail = async (campaignType: string) => {
      setIsLoading(true);
      try {
        // Simular envío de email de prueba
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        info(
          `Email de prueba enviado con template "${campaignType}" actualizado`,
          "Email Test Enviado"
        );
      } catch (err) {
        error('Error al enviar email de prueba', 'Error Test');
      } finally {
        setIsLoading(false);
      }
    };

    return { activateAutomation, sendTestEmail };
  };

  const { activateAutomation, sendTestEmail } = useEmailAutomation();

  const loadEmailMetrics = async (campaignId: string) => {
    try {
      // Simular carga de métricas
      const mockMetrics = {
        sent: 45,
        delivered: 43,
        opened: 41,
        clicked: 38,
        bounced: 2,
        complained: 0,
        engagement_rate: 89.3
      };
      setEmailMetrics(mockMetrics);
    } catch (err) {
      warning('No se pudieron cargar las métricas de email', 'Métricas');
    }
  };

  const handleSendTestEmail = async () => {
    await sendTestEmail(selectedTemplate.campaign_type);
  };

  const handleActivateAutomation = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const template = EMAIL_TEMPLATES.find(t => t.campaign_type === campaign.campaign_type);
    if (template) {
      setSelectedTemplate(template);
      await activateAutomation(campaign.id);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    setAutomationRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    info("Configuración de automation actualizada", "Reglas Modificadas");
  };

  const populateTemplate = (content: string, variables: any) => {
    let populatedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      populatedContent = populatedContent.replaceAll(placeholder, value as string);
    });
    return populatedContent;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Background Pattern IA */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header con Logo Real */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-26h-26 flex items-center justify-center">
              <img 
                src="/images/focalizahr-logo.svg" 
                alt="FocalizaHR Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  FocalizaHR
                </span>
                <span className="text-white"> Email Automation</span>
              </h1>
              <p className="text-slate-300">Templates diferenciados por tipo de campaña + automation inteligente</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Selection & Automation Rules */}
          <div className="space-y-6">
            {/* Active Campaigns */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campañas Activas
              </h3>
              <div className="space-y-3">
                {sampleCampaigns.map(campaign => (
                  <div key={campaign.id} className="border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{campaign.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-cyan-400/20 text-cyan-300' :
                        campaign.status === 'draft' ? 'bg-yellow-400/20 text-yellow-300' :
                        'bg-green-400/20 text-green-300'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">{campaign.company_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-300 font-medium">
                        {campaign.participants_count} participantes
                      </span>
                      <button 
                        onClick={() => handleActivateAutomation(campaign)}
                        disabled={isLoading || campaign.status === 'completed'}
                        className="text-xs bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-1 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Activando...' : 
                         campaign.status === 'completed' ? 'Completada' : 
                         'Activar Email'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Rules */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Reglas Automation
              </h3>
              <div className="space-y-3">
                {automationRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border border-slate-600 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {rule.trigger === 'campaign_activated' ? 'Invitación Inicial' :
                         rule.trigger === 'reminder_1' ? 'Recordatorio 1' :
                         rule.trigger === 'reminder_2' ? 'Recordatorio 2' :
                         'Email Completado'}
                      </p>
                      <p className="text-xs text-white/60">
                        {rule.delay_hours === 0 ? 'Inmediato' : `${rule.delay_hours}h después`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRuleToggle(rule.id)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        rule.enabled ? 'bg-cyan-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Notifications Demo */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Notificaciones en Tiempo Real
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-green-400/30 bg-green-400/10 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-300">Sistema Toast Activo</p>
                    <p className="text-xs text-white/60">Auto-highlighting + colores corporativos</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                
                <button
                  onClick={() => success(
                    'Se cargaron 45 participantes en "Análisis Retención Q3 2025"',
                    "¡Participantes Cargados!"
                  )}
                  className="w-full text-left p-3 border border-cyan-400/30 bg-cyan-400/10 rounded-lg hover:bg-cyan-400/20 transition-all"
                >
                  <p className="text-sm font-medium text-cyan-300">Simular: Participantes Cargados</p>
                  <p className="text-xs text-white/60">Toast con auto-highlighting números</p>
                </button>
                
                <button
                  onClick={() => info(
                    'Campaña "Pulso Express" activada - Monitoreando progreso',
                    "Campaña Activa"
                  )}
                  className="w-full text-left p-3 border border-purple-400/30 bg-purple-400/10 rounded-lg hover:bg-purple-400/20 transition-all"
                >
                  <p className="text-sm font-medium text-purple-300">Simular: Campaña Activada</p>
                  <p className="text-xs text-white/60">Toast con nombres destacados</p>
                </button>
                
                <button
                  onClick={() => warning(
                    'La campaña "Retención Q3" expira en 2 días',
                    "Atención"
                  )}
                  className="w-full text-left p-3 border border-yellow-400/30 bg-yellow-400/10 rounded-lg hover:bg-yellow-400/20 transition-all"
                >
                  <p className="text-sm font-medium text-yellow-300">Simular: Advertencia Deadline</p>
                  <p className="text-xs text-white/60">Toast de advertencia automática</p>
                </button>
              </div>
            </div>

            {/* Email Performance Metrics */}
            {emailMetrics && (
              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Métricas Tiempo Real</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-300">{emailMetrics.opened}</p>
                    <p className="text-xs text-white/60">Emails Abiertos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-300">{emailMetrics.clicked}</p>
                    <p className="text-xs text-white/60">Enlaces Clickeados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-300">{emailMetrics.engagement_rate}%</p>
                    <p className="text-xs text-white/60">Engagement Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-300">{emailMetrics.delivered}</p>
                    <p className="text-xs text-white/60">Entregados</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Template Selection & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Templates por Tipo
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {EMAIL_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate.id === template.id
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-white mb-1">
                      {template.campaign_type === 'retencion' ? 'Retención' :
                       template.campaign_type === 'pulso' ? 'Pulso' : 'Experiencia'}
                    </div>
                    <div className="text-xs text-white/60">{template.estimated_time}</div>
                    <div className="text-xs text-purple-300 mt-2">{template.tone}</div>
                  </button>
                ))}
              </div>

              {/* Template Details */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Template: {selectedTemplate.campaign_type}</h4>
                <p className="text-sm text-white/80 mb-3">Subject: {selectedTemplate.subject}</p>
                <p className="text-xs text-white/60 mb-3">{selectedTemplate.preview_text}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTemplate.variables.map(variable => (
                    <span key={variable} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      {variable}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleSendTestEmail}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Prueba
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Preview con fondo corporativo */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Preview Email</h3>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-cyan-400/30">
                <div 
                  dangerouslySetInnerHTML={{
                    __html: populateTemplate(selectedTemplate.html_content, previewVariables)
                  }}
                />
              </div>
              <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                <p className="text-xs text-cyan-400 font-medium">
                  ✅ Template con branding FocalizaHR + gradientes corporativos integrados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Emails Enviados</p>
                <p className="text-2xl font-bold text-white">1,247</p>
              </div>
              <Send className="h-8 w-8 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Tasa Apertura</p>
                <p className="text-2xl font-bold text-white">89.3%</p>
              </div>
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Respuestas</p>
                <p className="text-2xl font-bold text-white">67.8%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-white">156</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}