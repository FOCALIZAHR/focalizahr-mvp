'use client'

import { PublicLayout } from '@/components/public/PublicLayout'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import Link from 'next/link'
import { 
  ArrowRight, 
  AlertTriangle,
  TrendingUp, 
  Shield, 
  Users, 
  Target,
  Sparkles,
  BarChart3,
  Clock
} from 'lucide-react'

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-12">
            {/* Badge sutil */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-full">
              <AlertTriangle className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-cyan-400">
                El 75% de quienes se van antes de 18 meses decidieron irse en los primeros 3 meses
              </span>
            </div>

            {/* Main Headline - font-extralight según sistema real */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-tight tracking-tight">
              La Rotación Temprana{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                te Cuesta Millones
              </span>
            </h1>

            {/* Subheadline - font-light según guía */}
            <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
              Mientras haces <span className="text-cyan-400 font-normal">"autopsias organizacionales"</span> post-renuncia,{' '}
              <span className="text-purple-400 font-normal">FocalizaHR predice y previene</span> la fuga{' '}
              <span className="text-cyan-400 font-normal">60-90 días antes</span>
            </p>

            {/* El Problema */}
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-2xl p-10 max-w-3xl mx-auto text-left">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                El Ciclo Silencioso de la Rotación
              </h3>
              <div className="space-y-4 text-slate-300">
                <div className="flex items-start gap-4">
                  <span className="text-cyan-400 font-mono text-sm font-semibold">Día 1:</span>
                  <span className="font-light">Empleado ingresa motivado (pero nadie valida si tiene lo necesario)</span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-cyan-400 font-mono text-sm font-semibold">Días 1-30:</span>
                  <span className="font-light">Algo no funciona. Confusión, desconexión. <span className="text-purple-400 font-normal">Nadie lo detecta.</span></span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-purple-400 font-mono text-sm font-semibold">Día 90:</span>
                  <span className="font-light">La decisión mental ya está tomada. <span className="text-purple-400 font-normal">75% probabilidad de fuga en 6 meses.</span></span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-purple-400 font-mono text-sm font-semibold">Día 180:</span>
                  <span className="text-purple-400 font-normal">Renuncia. $5-10M perdidos + recomenzar.</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/products">
                <PrimaryButton 
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Ver Cómo lo Resolvemos
                </PrimaryButton>
              </Link>
              <Link href="/platform">
                <SecondaryButton size="md">
                  Conocer Plataforma
                </SecondaryButton>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-20 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  85%
                </div>
                <div className="text-sm text-slate-400 font-light leading-relaxed">
                  Precisión predicción fuga (basado en 4C Bauer + datos reales)
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  60-90
                </div>
                <div className="text-sm text-slate-400 font-light leading-relaxed">
                  Días de early warning antes de la renuncia
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  $125K
                </div>
                <div className="text-sm text-slate-400 font-light leading-relaxed">
                  Ahorro promedio por empleado retenido (18 meses)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why FocalizaHR */}
      <section className="py-24 px-4 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            {/* h2 - font-light según sistema real */}
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              De <span className="text-purple-400">Reactivo</span> a{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Predictivo</span>
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
              Inteligencia que predice problemas antes de que exploten
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: 'Predictivo', description: 'Identifica riesgos 60-90 días antes con 85% precisión' },
              { icon: Shield, title: 'ROI Cuantificado', description: 'Calcula el valor exacto de retener cada colaborador' },
              { icon: Sparkles, title: 'Automatizado', description: 'Alertas tempranas + planes de acción sin esfuerzo manual' },
              { icon: Users, title: 'Multi-Dimensional', description: 'Correlaciona clima, experiencia, onboarding y KPIs' }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300"
              >
                <div className="mb-6 h-12 w-12 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-light text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">5 Productos, 1 Objetivo</h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
              Cada producto ataca un momento crítico del ciclo de vida del colaborador
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Target, name: 'Pulso Express', description: 'Clima organizacional en tiempo real con análisis dimensional', badge: 'Core' },
              { icon: Users, name: 'Experiencia Full', description: 'Assessment 360° del journey completo del colaborador', badge: 'Core' },
              { icon: TrendingUp, name: 'Retención Predictiva', description: 'Exit intelligence con 85% de precisión + ROI cuantificado', badge: 'Premium' },
              { icon: Shield, name: 'Ambiente Sano', description: 'Compliance Ley Karin automatizado con audit trail', badge: 'Compliance' },
              { icon: Sparkles, name: 'Onboarding Intelligence', description: '75% decide en 3 meses, nosotros intervenimos día 7', badge: 'Premium' },
              { icon: BarChart3, name: 'Torre de Control', description: 'Dashboard ejecutivo con inteligencia predictiva 4 capas', badge: 'Platform' }
            ].map((product, index) => (
              <div
                key={index}
                className="group p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <product.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">{product.badge}</span>
                </div>
                <h3 className="text-lg font-light text-white mb-3">{product.name}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">{product.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/products">
              <SecondaryButton 
                size="md"
                icon={ArrowRight}
                iconPosition="right"
              >
                Ver Todos los Productos
              </SecondaryButton>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-br from-cyan-500/5 via-slate-900/50 to-purple-500/5 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-light">
              Deja de hacer <span className="text-purple-400">autopsias</span><br />
              Empieza a <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">prevenir</span>
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
              Cada renuncia evitada = $125K ahorrados. ¿Cuánto estás perdiendo?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/login">
                <PrimaryButton 
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Comenzar Ahora
                </PrimaryButton>
              </Link>
              <Link href="/platform">
                <SecondaryButton size="md">Ver Demo Plataforma</SecondaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}