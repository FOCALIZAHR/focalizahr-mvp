// src/components/survey/sections/WelcomeScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface WelcomeScreenProps {
  campaignName: string;
  companyName: string;
  companyLogo?: string;
  estimatedTime: number;
  questionCount: number;
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  campaignName,
  companyName,
  companyLogo,
  estimatedTime,
  questionCount,
  onStart
}) => {
  return (
    <div className="h-screen bg-[#0F172A] text-white overflow-hidden relative flex flex-col">
      {/* Patrón neural sutil de fondo */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        
        {/* Header de Confianza - GARANTÍA PRIMERO */}
        <motion.header 
          className="flex justify-between items-center px-8 py-6 md:px-12 md:py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo Cliente */}
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyName}
                className="h-6 md:h-8 w-auto opacity-80"
              />
            ) : (
              <span className="text-sm text-slate-400 font-medium">
                {companyName}
              </span>
            )}
          </div>

          {/* Badge Evaluación - SIN "Externa" */}
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-700/50 bg-slate-800/30">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] md:text-xs text-slate-300 font-medium tracking-wide uppercase">
              Evaluación Independiente y Confidencial
            </span>
          </div>
        </motion.header>

        {/* Contenido Central - Optimizado para no scroll */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-8">
          <div className="max-w-4xl w-full text-center">
            
            {/* Logo FocalizaHR - Sin tagline largo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="mb-8 md:mb-10"
            >
              <Image
                src="/images/focalizahr-logo2.svg"
                alt="FocalizaHR"
                width={180}
                height={60}
                priority
                className="w-auto h-12 md:h-14 lg:h-16 mx-auto"
              />
            </motion.div>

            {/* Headline Principal - Tamaños ajustados */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extralight leading-tight mb-6 md:mb-8"
            >
              Tu voz{' '}
              <span 
                className="font-light"
                style={{
                  background: 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                transforma
              </span>
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>
              tu lugar de trabajo
            </motion.h1>

            {/* Contexto de Campaña */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.45
              }}
              className="text-lg md:text-xl text-slate-400 mb-8 md:mb-10"
            >
              {campaignName}
            </motion.p>

            {/* Métricas */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.6
              }}
              className="flex items-center justify-center gap-3 text-xs md:text-sm text-slate-500 mb-8 md:mb-10"
            >
              <span>{estimatedTime} minutos</span>
              <span className="text-slate-700">·</span>
              <span>{questionCount} preguntas</span>
            </motion.div>

            {/* CTA Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.75,
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <button
                onClick={onStart}
                className="group relative px-12 md:px-16 py-3 md:py-4 bg-[#22D3EE] text-[#0F172A] font-medium text-sm md:text-base rounded-3xl transition-all duration-300 hover:bg-[#A78BFA] hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10">
                  Comenzar Evaluación
                </span>
                
                {/* Efecto Sheen */}
                <div className="absolute inset-0 -left-[100%] group-hover:left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 ease-out" />
              </button>
            </motion.div>
          </div>
        </main>

        {/* Footer de Autoridad - IDENTIDAD SUTIL */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.9
          }}
          className="text-center py-4 md:py-6 px-8"
        >
          <p className="text-[10px] md:text-xs text-slate-500">
            Proceso garantizado por especialistas independientes en confidencialidad organizacional
          </p>
        </motion.footer>
      </div>
    </div>
  );
};