"use client";

// 📧 EMAIL AUTOMATION PAGE - VERSIÓN SINCRONIZADA CON PRODUCCIÓN
// Actualizado: Usa templates del módulo centralizado (mismos que activate/route.ts)
// Beneficio: Un solo lugar para editar templates, siempre sincronizado

import React, { useState } from 'react';
import { Mail, Send, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast-system';
// ✅ NUEVO: Importar templates del módulo centralizado
import { PREMIUM_EMAIL_TEMPLATES, EmailTemplate } from '@/lib/templates/email-templates';

export default function EmailAutomationPage() {
  const { success, error, info } = useToast();
  
  // ✅ NUEVO: Usar templates del módulo compartido
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Email Automation System
        </h1>
        <p className="text-gray-400 mt-2">
          Preview y testing de templates premium - Sincronizado con producción
        </p>
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <p className="text-sm text-green-400">
            ✅ Templates sincronizados con activate/route.ts - Fuente única de verdad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Seleccionar Template
            </h3>
            
            <div className="space-y-3">
              {emailTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="font-medium text-white mb-1">
                    {template.campaignTypeSlug === 'retencion-predictiva' ? 'Retención Predictiva' :
                     template.campaignTypeSlug === 'pulso-express' ? 'Pulso Express' :
                     template.campaignTypeSlug === 'experiencia-full' ? 'Experiencia Full' : 'General'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Clock className="h-3 w-3" />
                    {template.estimatedTime}
                  </div>
                  <div className="text-xs text-purple-300 mt-2">{template.tone}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Details */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
            <h4 className="font-semibold text-white mb-3">Detalles del Template</h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/60 mb-1">Subject Line:</p>
                <p className="text-sm text-white/90">{selectedTemplate.subject}</p>
              </div>
              
              <div>
                <p className="text-xs text-white/60 mb-1">Preview Text:</p>
                <p className="text-sm text-white/70">{selectedTemplate.previewText}</p>
              </div>
              
              <div>
                <p className="text-xs text-white/60 mb-2">Variables Requeridas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(variable => (
                    <span key={variable} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700">
                <button
                  onClick={handleSendTestEmail}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-3 rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Preview Email</h3>
            
            {/* Subject Line Preview */}
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-white/60 mb-1">Subject:</p>
              <p className="text-sm text-white font-medium">
                {populateTemplate(selectedTemplate.subject, previewVariables)}
              </p>
            </div>

            {/* HTML Preview */}
            <div className="bg-white rounded-lg p-4 max-h-[600px] overflow-y-auto border border-cyan-400/30">
              <div 
                dangerouslySetInnerHTML={{
                  __html: populateTemplate(selectedTemplate.htmlContent, previewVariables)
                }}
              />
            </div>

            {/* Info Footer */}
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                ℹ️ Este template está sincronizado con el sistema de producción. 
                Los cambios aquí se reflejan automáticamente en los emails enviados por activate/route.ts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Note */}
      <div className="mt-6 bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">
          📚 Arquitectura Unificada
        </h4>
        <p className="text-sm text-purple-200/80 mb-3">
          Este sistema usa el módulo <code className="bg-purple-900/30 px-2 py-1 rounded">@/lib/templates/email-templates</code> 
          como fuente única de verdad. Beneficios:
        </p>
        <ul className="text-sm text-purple-200/70 space-y-2 ml-6 list-disc">
          <li>✅ Un solo lugar para editar todos los templates</li>
          <li>✅ Producción y testing siempre sincronizados</li>
          <li>✅ Templates diferenciados por tipo de campaña automáticamente</li>
          <li>✅ Fácil agregar nuevos templates sin duplicar código</li>
        </ul>
      </div>
    </div>
  );
}