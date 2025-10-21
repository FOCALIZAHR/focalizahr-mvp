// src/components/survey/sections/WelcomeScreen.tsx
'use client';

import React, { useState } from 'react';
import { ChevronRight, Shield, Clock, Check, ArrowRight, Lock } from 'lucide-react';
import { SurveyButton } from '@/components/survey/ui/SurveyButton';
import { 
  buttonStyles, 
  cardStyles, 
  textStyles, 
  containerStyles 
} from '@/lib/survey/styles';
import { cn } from '@/lib/utils';

// Props con datos reales de la BD
interface WelcomeScreenProps {
  campaignName: string;      // "AHORA SI" - viene de campaign.name
  companyName: string;       // "Empresa Demo FocalizaHR" - viene de campaign.account.companyName
  companyLogo?: string;      // URL del logo si existe
  estimatedTime: number;     // 12 - viene de campaignType.estimatedDuration
  questionCount: number;     // 7 - viene de campaignType.questionCount
  campaignTypeName?: string; // Nombre del tipo de campaña para el nuevo panel
  campaignDescription?: string; // Descripción de la campaña para el nuevo panel
  onStart: () => void;       // Función para iniciar la encuesta
}

export default function WelcomeScreen({
  campaignName,
  companyName,
  companyLogo,
  estimatedTime,
  questionCount,
  campaignTypeName = "Evaluación Estratégica",
  campaignDescription = "Tu perspectiva honesta es la clave para construir un mejor equipo y transformar la cultura organizacional.",
  onStart
}: WelcomeScreenProps) {
  const [currentPanel, setCurrentPanel] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredGuarantee, setHoveredGuarantee] = useState<number | null>(null);

  const handleTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPanel(1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleStartSurvey = () => {
    onStart();
  };

  return (
    <div className={cn(containerStyles.page, "relative overflow-hidden")}>
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#22D3EE]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#A78BFA]/5 rounded-full blur-[100px]" />
      </div>

      <div className={cn(containerStyles.contentWide, "relative z-10 min-h-screen flex flex-col px-6")}>
        
        {/* Panel 1: Impacto Emocional */}
        {currentPanel === 0 && (
          <div className={cn(
            "w-full flex flex-col justify-center flex-1 transition-all duration-700",
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}>
            {/* Header con branding dual */}
            <div className="absolute top-6 left-0 right-0 flex justify-between items-center px-8">
              <div className={textStyles.bodySmall}>
                {companyName}
              </div>
              {/* Badge de confidencialidad - diseño mejorado */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20">
                <Shield className="w-3 h-3 text-[#22D3EE]" />
                <span className={cn(textStyles.caption, "text-[#22D3EE] font-medium")}>
                  100% Confidencial
                </span>
              </div>
            </div>

            {/* Logo FocalizaHR desde public */}
            <div className="flex justify-center mb-12">
              <img 
                src="/images/focalizahr-logo.svg" 
                alt="FocalizaHR" 
                className="h-16 w-auto opacity-60"
              />
            </div>

            {/* Mensaje central */}
            <div className="text-center space-y-8">
              <h1 className={cn(textStyles.h1, "text-white leading-tight")}>
                Hay cosas que
                <span className={cn("block", textStyles.gradient, "mt-2")}>
                  solo tú puedes ver
                </span>
              </h1>
              
              <p className={cn(textStyles.bodyLarge, "max-w-2xl mx-auto opacity-90")}>
                Tu perspectiva honesta es la clave para construir un mejor equipo
              </p>

              {/* Indicadores de tiempo */}
              <div className="flex justify-center gap-8">
                <span className={cn(textStyles.caption, "flex items-center gap-2")}>
                  <Clock className="w-4 h-4 opacity-50" />
                  {estimatedTime} minutos
                </span>
                <span className={textStyles.caption}>•</span>
                <span className={textStyles.caption}>
                  {questionCount} preguntas estratégicas
                </span>
              </div>
            </div>

            {/* Call to action */}
            <div className="flex flex-col items-center mt-12 space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                
                <SurveyButton
                  variant="primary"
                  size="md"
                  onClick={handleTransition}
                  className="relative"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </SurveyButton>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Portal de Confianza */}
        {currentPanel === 1 && (
          <div className="w-full flex flex-col justify-center min-h-screen animate-in fade-in duration-700 px-8">
            
            {/* Contenido centrado */}
            <div className="max-w-4xl mx-auto w-full text-center">
              
              {/* Logo del cliente */}
              {companyLogo ? (
                <div className="flex justify-center mb-6">
                  <img 
                    src={companyLogo} 
                    alt={companyName}
                    className="h-12 w-auto opacity-80"
                  />
                </div>
              ) : companyName ? (
                <div className="mb-6">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">
                    {companyName}
                  </p>
                </div>
              ) : null}
              
              {/* Nombre de la campaña */}
              <h1 className="text-5xl md:text-6xl font-extralight text-white mb-6 tracking-tight">
                {campaignName}
              </h1>
              
              {/* Línea decorativa */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="h-px w-16 bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                <div className="h-px w-16 bg-white/20" />
              </div>
              
              {/* Propósito */}
              <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto mb-20 font-light leading-relaxed">
                {campaignDescription || "Tu perspectiva honesta es la clave para construir un mejor equipo y transformar la cultura organizacional."}
              </p>
              
              {/* Triple garantía */}
              <div className="mb-1">
                <div className="flex justify-center items-start mb-8 w-full">
                  <div className="flex justify-between items-start w-full max-w-2xl">
                    {[
                      { icon: Shield, label: "Tu identidad está protegida", text: "Sistema anónimo garantizado. Solo resultados grupales (mín. 5 personas)." },
                      { icon: Lock, label: "Respetamos tu tiempo", text: "Diseño eficiente. Solo preguntas esenciales para insights valiosos." },
                      { icon: Check, label: "Análisis profesional", text: "Metodología científica validada. Insights accionables garantizados." }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="group cursor-pointer flex-1 text-center"
                        onMouseEnter={() => setHoveredGuarantee(index)}
                        onMouseLeave={() => setHoveredGuarantee(null)}
                      >
                        <div className={cn(
                          "flex flex-col items-center gap-3 transition-all duration-300",
                          hoveredGuarantee !== null && hoveredGuarantee !== index ? "opacity-50" : "opacity-100"
                        )}>
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#22D3EE]/10 transition-colors">
                            <item.icon className="w-5 h-5 text-white/40 group-hover:text-[#22D3EE] transition-colors" />
                          </div>
                          <span className="text-sm text-white/80 group-hover:text-white transition-colors font-medium">
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Texto hover */}
                <div className="h-10 flex items-center justify-center">
                  {hoveredGuarantee !== null && (
                    <p className="text-xs text-slate-500 max-w-md animate-in fade-in duration-300">
                      {[
                        `${companyName} solo recibe resultados grupales. Mínimo 5 personas por grupo.`,
                        `${questionCount} preguntas diseñadas para completar en ${estimatedTime} minutos.`,
                        "Metodología científica validada. Insights accionables garantizados."
                      ][hoveredGuarantee]}
                    </p>
                  )}
                </div>
              </div>
              
              {/* CTA Principal */}
              <div className="flex flex-col items-center space-y-6">
                <button
                  onClick={handleStartSurvey}
                  className={cn(
                    "px-12 py-3 rounded-full",
                    "bg-[#22D3EE] text-white font-medium",
                    "transition-all duration-300",
                    "hover:bg-[#A78BFA] hover:shadow-lg hover:shadow-[#A78BFA]/25",
                    "hover:scale-[1.02] active:scale-100"
                  )}
                >
                  Comenzar Evaluación
                </button>
                
                {/* Volver */}
                <button
                  onClick={() => setCurrentPanel(0)}
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  ← Volver
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-1">
              <p className="text-center text-[10px] text-slate-700 uppercase tracking-wider mb-2">
                Metodología FocalizaHR: {campaignTypeName || "Evaluación Estratégica"}
              </p>
              
              <p className="text-center text-xs text-slate-600">
                Proceso confidencial garantizado por FocalizaHR
              </p>
            </div>
          </div>
        )}

        {/* ✅ CAMBIO QUIRÚRGICO: Indicadores FUERA de bloques condicionales */}
        <div className="flex justify-center gap-2 my-8">
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            currentPanel === 0 ? "bg-[#22D3EE] w-8" : "bg-slate-600"
          )} />
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            currentPanel === 1 ? "bg-[#22D3EE] w-8" : "bg-slate-600"
          )} />
        </div>

      </div>
    </div>
  );
}

// Exportación compatible
export { WelcomeScreen };