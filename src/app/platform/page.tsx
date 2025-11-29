'use client'

import { PublicLayout } from '@/components/public/PublicLayout'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, Bell, FileText, Brain,
  ArrowRight, CheckCircle, Sparkles, Target, Zap
} from 'lucide-react'

export default function PlatformPage() {
  const layers = [
    {
      level: 'Layer 0', name: 'Autonomous Products',
      description: '5 productos autónomos que capturan datos en tiempo real',
      icon: Target,
      features: [
        'Pulso Express - Clima organizacional',
        'Experiencia Full - Assessment 360°',
        'Retención Predictiva - Exit intelligence',
        'Ambiente Sano - Compliance Ley Karin',
        'Onboarding Intelligence - 4C Bauer'
      ]
    },
    {
      level: 'Layer A', name: 'Post-Closure Analysis',
      description: 'Análisis automático al cierre de cada campaña',
      icon: BarChart3,
      features: [
        'Correlaciones departamentales automáticas',
        'Patrones de riesgo identificados',
        'Segmentación por cohortes',
        'Benchmarking vs industria',
        'ROI cuantificado por acción'
      ]
    },
    {
      level: 'Layer B', name: 'Cross-Dimensional Analysis',
      description: 'Correlaciones multidimensionales entre productos',
      icon: Brain,
      features: [
        'Clima × Retención × Onboarding fusionados',
        'Experiencia × Performance × KPIs',
        'Patrones ocultos multi-producto',
        'Causalidad vs correlación',
        'Insights estratégicos profundos'
      ]
    },
    {
      level: 'Layer C', name: 'Predictive Intelligence',
      description: 'Predicciones avanzadas con machine learning',
      icon: Sparkles,
      features: [
        'Predicción fuga 60-90 días anticipación (85% accuracy)',
        'EXO Score predictivo onboarding',
        'Alertas tempranas automatizadas',
        'Planes de acción automáticos',
        'Cuantificación ROI por intervención'
      ]
    }
  ]

  const capabilities = [
    {
      icon: FileText, title: 'Kit de Comunicación v3.0',
      description: '110+ templates inteligentes con variables dinámicas. Genera emails, reportes y comunicaciones en segundos.',
      why: 'Ahorra 15+ horas/mes en creación manual de reportes'
    },
    {
      icon: Bell, title: 'Alertas Tempranas Accionables',
      description: 'No solo "algo anda mal". Te dice QUÉ está mal, POR QUÉ, y QUÉ HACER con plan de acción específico.',
      why: 'De alertas genéricas a planes de acción ejecutables'
    },
    {
      icon: Zap, title: 'ROI Cuantificado Automático',
      description: 'Cada insight viene con cálculo de impacto financiero. Sabes exactamente cuánto te cuesta no actuar.',
      why: 'Justifica inversión RRHH con números reales'
    },
    {
      icon: Brain, title: 'Inteligencia Cross-Producto',
      description: 'Fusiona datos de clima + retención + onboarding. Ve patrones que productos aislados no detectan.',
      why: 'La rotación rara vez tiene 1 sola causa'
    },
    {
      icon: TrendingUp, title: 'Predicción 60-90 Días',
      description: 'No espera la renuncia. Predice problemas 2-3 meses antes con 85% precisión.',
      why: 'Tiempo suficiente para intervenir efectivamente'
    },
    {
      icon: Target, title: 'Vista Jerárquica Enterprise',
      description: 'De CEO a Gerente: cada nivel ve lo que necesita. Drill-down hasta colaborador individual.',
      why: 'Información contextualizada por rol'
    }
  ]

  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-full">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-cyan-400">Torre de Control v6.0</span>
            </div>

            {/* h1 - font-extralight según sistema real */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-tight">
              Tu Centro de{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Comando Organizacional
              </span>
            </h1>

            {/* Subtítulo - font-light según guía */}
            <p className="text-xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
              Dashboard ejecutivo con 4 capas de inteligencia: desde captura de datos hasta predicciones avanzadas
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/login">
                <PrimaryButton size="md" icon={ArrowRight} iconPosition="right">Acceder a Plataforma</PrimaryButton>
              </Link>
              <Link href="/products">
                <SecondaryButton size="md">Ver Productos</SecondaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            {/* h2 - font-light según sistema real (NO bold) */}
            <h2 className="text-4xl md:text-5xl font-light mb-6">Arquitectura de Inteligencia 4 Capas</h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">De captura de datos a inteligencia predictiva avanzada</p>
          </div>

          <div className="space-y-8">
            {layers.map((layer, index) => (
              <div key={index} className="group relative bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300">
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <layer.icon className="h-8 w-8 text-cyan-400" />
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20">{layer.level}</span>
                        {/* h3 - font-light según sistema real */}
                        <h3 className="text-2xl font-light text-white">{layer.name}</h3>
                      </div>
                      <p className="text-slate-400 font-light">{layer.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {layer.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300 font-light">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Capacidades que Realmente Importan</h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">Sin relleno. Solo funcionalidades que generan valor medible.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="group p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300">
                <div className="mb-6">
                  <div className="h-12 w-12 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-6">
                    <capability.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-light text-white mb-3">{capability.title}</h3>
                  <p className="text-sm text-slate-300 font-light mb-4 leading-relaxed">{capability.description}</p>
                  <div className="flex items-start gap-2 pt-3 border-t border-slate-700/50">
                    <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-cyan-400 font-light">{capability.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-purple-400">Roadmap 2025</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-light">Próximas Capacidades</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 max-w-3xl mx-auto">
              <div className="p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <FileText className="h-10 w-10 text-purple-400 mb-5 mx-auto" />
                <h3 className="text-lg font-light text-white mb-3">Kit Comunicación v4.0</h3>
                <p className="text-sm text-slate-400 font-light">200+ templates con generación asistida por IA</p>
              </div>

              <div className="p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <Brain className="h-10 w-10 text-purple-400 mb-5 mx-auto" />
                <h3 className="text-lg font-light text-white mb-3">Intelligence Layer C+</h3>
                <p className="text-sm text-slate-400 font-light">Predicciones avanzadas con deep learning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-light">
              Experimenta el poder de la{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                inteligencia organizacional
              </span>
            </h2>
            <p className="text-lg text-slate-400 font-light">De datos dispersos a decisiones informadas en tiempo real</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <PrimaryButton size="md" icon={ArrowRight} iconPosition="right">Comenzar Ahora</PrimaryButton>
              </Link>
              <Link href="/products">
                <SecondaryButton size="md">Explorar Productos</SecondaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}