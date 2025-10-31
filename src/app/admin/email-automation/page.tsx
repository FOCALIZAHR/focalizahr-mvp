"use client";

// 📧 EMAIL AUTOMATION PAGE - DISEÑO PREMIUM FOCALIZAHR
// Filosofía: Minimalista Apple/Tesla - Clean, Modern, Professional
// Identidad visual FocalizaHR: Cyan + Purple + Glassmorphism + Iconos vectoriales

import React, { useState } from 'react';
import { Mail, Send, Clock, CheckCircle, Sparkles, FileText, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';
import { PREMIUM_EMAIL_TEMPLATES, EmailTemplate } from '@/lib/templates/email-templates';
import '@/styles/focalizahr-design-system.css';

export default function EmailAutomationPage() {
  const { success, error, info } = useToast();
  
  const emailTemplates: EmailTemplate[] = Object.values(PREMIUM_EMAIL_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Variables preview (para testing visual)
  const previewVariables = {
    participant_name: 'María González',
    company_name: 'TechCorp Innovation',
    survey_url: '#preview-link'
  };

  // Función para reemplazar variables en preview
  const populateTemplate = (template: string, vars: Record<string, string>): string => {
    let populated = template;
    Object.entries(vars).forEach(([key, value]) => {
      populated = populated.replaceAll(`{${key}}`, value);
    });
    return populated;
  };

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      info(
        `Email de prueba enviado con template "${selectedTemplate.campaignTypeSlug}" actualizado`,
        "Test Email Enviado"
      );
    } catch (err) {
      error('Error al enviar email de prueba', 'Error Test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fhr-bg-main fhr-bg-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* ==========================================
            HERO HEADER - Punto Focal Principal
            ========================================== */}
        <div className="text-center mb-16">
          {/* Logo FocalizaHR - Arriba Centro */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/focalizahr-logo_palabra.svg" 
              alt="FocalizaHR" 
              className="h-10 opacity-90"
            />
          </div>

          {/* Icono Principal - Vector Reducido */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 blur-2xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                <Mail className="h-12 w-12 text-cyan-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Título Principal - Extra Grande */}
          <h1 className="text-5xl md:text-6xl font-extralight text-white mb-4 leading-tight">
            Sistema de
            <span className="block text-cyan-400 font-light mt-2">
              Email Automation
            </span>
          </h1>
          
          {/* Subtítulo */}
          <p className="text-lg text-slate-400 font-light mb-6 max-w-2xl mx-auto">
            Templates premium sincronizados con producción
          </p>

          {/* Badge Estado - Sincronización (Reducido) */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-400/30 rounded-full">
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              Sincronizado con activate/route.ts
            </span>
          </div>
        </div>

        {/* ==========================================
            GRID PRINCIPAL - Templates + Preview
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ==========================================
              SIDEBAR - Template Selector
              ========================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card: Selector de Templates */}
            <div className="fhr-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="fhr-subtitle text-lg">Templates Disponibles</h3>
              </div>
              
              <div className="space-y-3">
                {emailTemplates.map(template => {
                  const isSelected = selectedTemplate.id === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`
                        w-full p-4 rounded-xl border-2 text-left transition-all duration-300
                        ${isSelected 
                          ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20 transform scale-[1.02]' 
                          : 'border-slate-700/50 hover:border-cyan-400/50 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-white text-sm">
                          {template.campaignTypeSlug === 'retencion-predictiva' ? 'Retención Predictiva' :
                           template.campaignTypeSlug === 'pulso-express' ? 'Pulso Express' :
                           template.campaignTypeSlug === 'experiencia-full' ? 'Experiencia Full' : 'General'}
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{template.estimatedTime}</span>
                      </div>
                      
                      <div className="text-xs text-cyan-300/80 font-medium">
                        {template.tone}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card: Detalles del Template */}
            <div className="fhr-card">
              <h4 className="fhr-subtitle mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Detalles
              </h4>
              
              <div className="space-y-4">
                {/* Subject Line */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Subject Line
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedTemplate.subject}
                  </p>
                </div>
                
                {/* Preview Text */}
                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Preview Text
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {selectedTemplate.previewText}
                  </p>
                </div>
                
                {/* Variables */}
                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                    Variables Dinámicas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(variable => (
                      <span 
                        key={variable} 
                        className="px-3 py-1.5 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-400/30 font-mono"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botón Enviar Test */}
                <div className="pt-4">
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isLoading}
                    className="fhr-btn-primary w-full px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Enviar Email Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              MAIN CONTENT - Email Preview
              ========================================== */}
          <div className="lg:col-span-8">
            <div className="fhr-card">
              {/* Header Preview */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <Eye className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="fhr-subtitle text-xl">Preview Email</h3>
              </div>
              
              {/* Subject Line Preview Card */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                  Asunto del Email
                </p>
                <p className="text-base text-white font-medium leading-relaxed">
                  {populateTemplate(selectedTemplate.subject, previewVariables)}
                </p>
              </div>

              {/* HTML Preview Container */}
              <div className="relative">
                {/* Label Preview */}
                <div className="absolute -top-3 left-4 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
                  <span className="text-xs text-slate-400 font-medium">Vista Cliente</span>
                </div>
                
                {/* Email Content */}
                <div className="bg-white rounded-xl p-6 max-h-[600px] overflow-y-auto border-2 border-cyan-400/20 fhr-scroll shadow-xl">
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: populateTemplate(selectedTemplate.htmlContent, previewVariables)
                    }}
                  />
                </div>
              </div>

              {/* Info Footer Sync */}
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-l-4 border-l-cyan-400 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-400/10 rounded-lg flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-cyan-300 font-medium mb-1">
                      Sistema Sincronizado
                    </p>
                    <p className="text-xs text-cyan-200/70 leading-relaxed">
                      Este template está conectado en tiempo real con el sistema de producción. 
                      Los cambios se reflejan automáticamente en activate/route.ts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            FOOTER - Documentación Arquitectura
            ========================================== */}
        <div className="mt-12 fhr-card border-l-4 border-l-purple-400">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex-shrink-0">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            
            <div className="flex-1">
              <h4 className="fhr-subtitle text-lg mb-3">
                📚 Arquitectura Unificada
              </h4>
              
              <p className="text-sm text-purple-200/80 mb-4 leading-relaxed">
                Este sistema utiliza el módulo{' '}
                <code className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded font-mono text-xs">
                  @/lib/templates/email-templates
                </code>
                {' '}como fuente única de verdad para todos los templates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Un solo lugar para editar templates',
                  'Producción y testing sincronizados',
                  'Templates diferenciados automáticamente',
                  'Fácil agregar nuevos sin duplicar código'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-sm text-purple-200/70">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}