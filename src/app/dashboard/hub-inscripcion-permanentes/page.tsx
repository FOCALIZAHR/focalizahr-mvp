'use client';

/**
 * HUB INSCRIPCIÓN PERMANENTES - FocalizaHR Premium v2.0
 * 
 * MEJORAS v2.0:
 * - Glow effect en hover de cards (cyan/purple según tema)
 * - Micro-interacciones en iconos y flechas
 * - Touch targets 48px para móvil
 * - Espaciado refinado y consistente
 * - Animaciones de entrada escalonadas mejoradas
 * - Shimmer effect en botones hover
 * 
 * DISEÑO:
 * - Filosofía FocalizaHR v1.2 (minimalismo premium Apple/Tesla)
 * - Paleta: Cyan #22D3EE + Purple #A78BFA
 * - Tipografía: Inter font-light (300) títulos
 * - NO bold (700), máximo font-semibold (600)
 */

import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Rocket, 
  User, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  LogOut,
  Clock,
  Sparkles,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';

export default function HubInscripcionPermanentesPage() {
  const router = useRouter();

  // Animaciones escalonadas optimizadas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] as const // Custom easing premium
      }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Patrón de fondo premium con múltiples capas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradientes radiales */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
            `
          }}
        />
        {/* Grid sutil */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* BOTÓN VOLVER - Touch target 48px */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-slate-400 hover:text-white mb-10 sm:mb-14 
                     transition-colors duration-300 min-h-[48px] min-w-[48px] -ml-2 pl-2"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
          <span className="text-sm font-medium">Volver</span>
        </motion.button>

        {/* PORTADA */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12 sm:mb-16"
        >
          {/* Badge contextual con shimmer */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium
                           bg-gradient-to-r from-cyan-500/10 to-purple-500/10 
                           border border-cyan-500/20 text-cyan-400 overflow-hidden">
              {/* Shimmer effect */}
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] 
                             bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <Sparkles className="h-3.5 w-3.5" />
              <span className="relative">Sistema Predictivo de Retención</span>
            </span>
          </motion.div>

          {/* Título con gradiente */}
          <motion.h1 
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-tight"
          >
            Inscribir{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Colaboradores
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Activa el seguimiento inteligente para nuevos ingresos o registra salidas 
            para análisis predictivo de retención
          </motion.p>
        </motion.div>

        {/* GRID DE PRODUCTOS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          {/* === ONBOARDING JOURNEY INTELLIGENCE === */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl group/card"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-px rounded-2xl sm:rounded-3xl opacity-0 group-hover/card:opacity-100 
                          transition-opacity duration-500 pointer-events-none"
                 style={{
                   background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(167, 139, 250, 0.15))',
                   filter: 'blur(1px)'
                 }} 
            />
            
            {/* Gradiente decorativo */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 
                          bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl 
                          group-hover/card:from-cyan-500/15 transition-all duration-500" />
            
            <div className="relative p-6 sm:p-8">
              {/* Header del producto */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6 sm:mb-8">
                <motion.div 
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 
                           border border-cyan-500/20 w-fit"
                  whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
                >
                  <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-white">
                      Onboarding Journey Intelligence
                    </h2>
                    <span className="px-2 py-1 rounded-full text-xs font-medium 
                                   bg-green-500/20 text-green-400 border border-green-500/30
                                   flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Activo
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Seguimiento predictivo de nuevos colaboradores durante los primeros 90 días. 
                    4 encuestas automáticas basadas en metodología 4C Bauer.
                  </p>
                </div>
              </div>

              {/* Características - Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {[
                  { icon: Clock, text: 'Día 1, 7, 30, 90' },
                  { icon: TrendingUp, text: 'EXO Score Predictivo' },
                  { icon: Shield, text: 'Alertas Automáticas' }
                ].map((feature, idx) => (
                  <div key={idx} 
                       className="flex items-center gap-2 px-3 py-1.5 rounded-full
                                bg-slate-800/50 border border-slate-700/50 text-xs sm:text-sm text-slate-300">
                    <feature.icon className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Opciones de carga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Individual */}
                <motion.button
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => router.push('/dashboard/onboarding/enroll')}
                  className="group relative overflow-hidden p-5 sm:p-6 rounded-xl text-left 
                           transition-shadow duration-300 min-h-[48px]"
                  style={{
                    background: 'rgba(34, 211, 238, 0.05)',
                    border: '1px solid rgba(34, 211, 238, 0.2)'
                  }}
                >
                  {/* Glow border on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{ boxShadow: 'inset 0 0 20px rgba(34, 211, 238, 0.1), 0 0 30px rgba(34, 211, 238, 0.1)' }} />
                  
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700
                                bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                      <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500/10 border border-cyan-500/20
                                    group-hover:bg-cyan-500/20 transition-colors duration-300">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Individual</h3>
                        <p className="text-xs text-slate-500">1 colaborador por vez</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      Formulario completo con validación en tiempo real. Ideal para ingresos puntuales.
                    </p>
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                      <span>Inscribir ahora</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.button>

                {/* Masivo */}
                <motion.button
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => router.push('/dashboard/onboarding/enroll-batch')}
                  className="group relative overflow-hidden p-5 sm:p-6 rounded-xl text-left 
                           transition-shadow duration-300 min-h-[48px]"
                  style={{
                    background: 'rgba(167, 139, 250, 0.05)',
                    border: '1px solid rgba(167, 139, 250, 0.2)'
                  }}
                >
                  {/* Glow border on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{ boxShadow: 'inset 0 0 20px rgba(167, 139, 250, 0.1), 0 0 30px rgba(167, 139, 250, 0.1)' }} />
                  
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700
                                bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                      <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20
                                    group-hover:bg-purple-500/20 transition-colors duration-300">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Carga Masiva</h3>
                        <p className="text-xs text-slate-500">Hasta 100 colaboradores</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      Sube un archivo Excel/CSV con múltiples colaboradores. Preview antes de confirmar.
                    </p>
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                      <span>Cargar archivo</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* === EXIT INTELLIGENCE === */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.015)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}
          >
            <div className="relative p-6 sm:p-8 opacity-60">
              {/* Header del producto */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 
                              border border-amber-500/15 w-fit">
                  <LogOut className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400/70" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-white/80">
                      Exit Intelligence
                    </h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium 
                                   bg-slate-700/50 text-slate-400 border border-slate-600/50">
                      Próximamente
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    Análisis predictivo de rotación y entrevistas de salida inteligentes. 
                    Detecta patrones, correlaciona con onboarding y genera insights accionables.
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <p className="text-xs sm:text-sm text-slate-500 text-center">
                  Se integrará con Onboarding para correlacionar datos y predecir rotación con mayor precisión.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* FOOTER INFO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-10 sm:mt-14 text-center"
        >
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Los colaboradores inscritos recibirán encuestas automáticas en las fechas programadas. 
            Monitorea el progreso desde el <span className="text-cyan-500/70">Dashboard de Onboarding</span>.
          </p>
        </motion.div>
      </div>

      {/* CSS para animación shimmer */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}