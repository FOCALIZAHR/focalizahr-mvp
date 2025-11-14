'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BarChart3, Rocket, ArrowRight } from 'lucide-react';

/**
 * HUB DE CARGA - Puerta de entrada FocalizaHR
 * 
 * PROPÓSITO:
 * Página bimodal que permite elegir entre:
 * 1. Estudios Temporales (Pulso, Clima, Experiencia, Karin)
 * 2. Procesos Continuos (Onboarding Journey Intelligence)
 * 
 * DISEÑO:
 * - Inspirado en WelcomeScreen.tsx Panel 1 (minimalista)
 * - Paleta: cyan (#22D3EE) + purple (#A78BFA)
 * - Tipografía: font-extralight h1, font-light h2
 * - Animaciones Framer Motion suaves (0.4-0.5s)
 * - Glassmorphism: bg-slate-900/30 + backdrop-blur
 * 
 * NAVEGACIÓN:
 * - Opción 1 → /dashboard (estudios temporales existentes)
 * - Opción 2 → /dashboard/onboarding/enroll (formulario inscripción)
 */

export default function HubDeCargaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER MINIMALISTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extralight text-white mb-2">
            Hub de Carga FocalizaHR
          </h1>
          <p className="text-slate-400 text-sm">
            Selecciona el tipo de proceso que deseas gestionar
          </p>
        </motion.div>

        {/* GRID 2 OPCIONES BIMODAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* OPCIÓN 1: ESTUDIOS TEMPORALES */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push('/dashboard')}
            className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-8 text-left group hover:border-cyan-500/50 transition-all backdrop-blur-sm"
          >
            <div className="space-y-6">
              {/* Icono con gradient background */}
              <div className="inline-flex p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10">
                <BarChart3 className="h-12 w-12 text-cyan-400" />
              </div>

              {/* Título */}
              <div>
                <h2 className="text-2xl font-light text-white mb-2">
                  Estudios Temporales
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Pulso Express · Clima Organizacional · Experiencia 360° · Ambiente Sano
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <span>Ir a Estudios</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* OPCIÓN 2: PROCESOS CONTINUOS */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push('/dashboard/onboarding/enroll')}
            className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-8 text-left group hover:border-purple-500/50 transition-all backdrop-blur-sm"
          >
            <div className="space-y-6">
              {/* Icono con gradient background */}
              <div className="inline-flex p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                <Rocket className="h-12 w-12 text-purple-400" />
              </div>

              {/* Título */}
              <div>
                <h2 className="text-2xl font-light text-white mb-2">
                  Procesos Continuos
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Onboarding Journey Intelligence · Sistema predictivo 4C Bauer
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                <span>Inscribir Colaborador</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

        </div>

        {/* FOOTER INFORMATIVO (opcional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-xs">
            ¿Necesitas ayuda para decidir? Contacta a tu Customer Success Manager
          </p>
        </motion.div>
      </div>
    </div>
  );
}