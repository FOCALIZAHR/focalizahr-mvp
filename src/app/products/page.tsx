'use client'

import { PublicLayout } from '@/components/public/PublicLayout'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import Link from 'next/link'
import {
  Target, Users, TrendingUp, Shield, Sparkles, BarChart3,
  CheckCircle, ArrowRight, AlertTriangle
} from 'lucide-react'

export default function ProductsPage() {
  const products = [
    {
      icon: Sparkles, name: 'Onboarding Journey Intelligence',
      tagline: 'Detén la rotación temprana antes de que sea tarde',
      description: 'El 75% de quienes se van antes de 18 meses decidieron irse en los primeros 3 meses. Detectamos problemas día 7, día 30, día 90 y actuamos ANTES de la renuncia.',
      badge: 'Premium',
      features: [
        '4 mediciones automáticas (día 1, 7, 30, 90) basadas en 4C Bauer',
        'EXO Score predictivo 0-100 con 85% precisión',
        'Alertas tempranas automatizadas con SLA',
        'Pipeline visual por departamento/gerencia',
        'Planes de acción específicos según diagnóstico',
        'ROI: $125K ahorrados por empleado retenido'
      ]
    },
    {
      icon: TrendingUp, name: 'Retención Predictiva',
      tagline: 'Exit intelligence con 85% de precisión',
      description: 'Identifica empleados en riesgo de fuga 60-90 días antes de que renuncien. Cuantifica el ROI exacto de retener a cada colaborador.',
      badge: 'Premium',
      features: [
        'Predicción fuga con 85% accuracy',
        'Early warning 60-90 días anticipados',
        'ROI cuantificado por persona ($5-10M por renuncia evitada)',
        'Patrones de riesgo automáticos',
        'Planes retención personalizados',
        'Dashboard ejecutivo predictivo'
      ]
    },
    {
      icon: Target, name: 'Pulso Express',
      tagline: 'Clima organizacional en tiempo real',
      description: 'Medición continua del pulso organizacional con análisis dimensional. De autopsias anuales a vital signs mensuales.',
      badge: 'Core',
      features: [
        'Encuestas inteligentes 5-15 minutos',
        'Análisis por 8 dimensiones organizacionales',
        'Alertas tempranas por departamento',
        'Benchmarking vs industria',
        'Dashboard en tiempo real',
        'ROI cuantificado por acción'
      ]
    },
    {
      icon: Users, name: 'Experiencia Full',
      tagline: 'Assessment 360° del colaborador',
      description: 'Mapeo completo del employee journey. De mediciones aisladas a visión integral del ciclo de vida.',
      badge: 'Core',
      features: [
        'Journey mapping automatizado',
        'Correlación experiencia × KPIs negocio',
        'Análisis predictivo engagement',
        'Segmentación por cohortes',
        'Identificación pain points críticos',
        'Planes acción personalizados'
      ]
    },
    {
      icon: Shield, name: 'Ambiente Sano',
      tagline: 'Compliance Ley Karin automatizado',
      description: 'Cumplimiento normativo Ley Karin con protocolos integrados. De riesgo legal a prevención proactiva.',
      badge: 'Compliance',
      features: [
        'Protocolos Ley Karin pre-configurados',
        'Gestión confidencial de denuncias',
        'Audit trail completo e inmutable',
        'Reportería automática INSPTRA',
        'Monitoreo continuo de riesgos',
        'Panel cumplimiento ejecutivo'
      ]
    },
    {
      icon: BarChart3, name: 'Torre de Control',
      tagline: 'Dashboard ejecutivo IA',
      description: 'Centro de comando organizacional con inteligencia predictiva 4 capas. De datos dispersos a insights accionables.',
      badge: 'Platform',
      features: [
        'Dashboard ejecutivo tiempo real',
        'Inteligencia predictiva 4 capas (Layer 0→A→B→C)',
        '110+ templates comunicación inteligente',
        'Correlaciones multidimensionales',
        'Alertas automáticas personalizables',
        'Reportería ejecutiva avanzada'
      ]
    }
  ]

  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-full">
              <AlertTriangle className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-cyan-400">5 Productos que Atacan Momentos Críticos</span>
            </div>

            {/* h1 - font-extralight según sistema real */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-tight">
              De <span className="text-purple-400">Apagar Incendios</span>{' '}
              <br />a <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Prevenir Crisis</span>
            </h1>

            {/* Subtítulo - font-light según guía */}
            <p className="text-xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
              Cada producto cubre un momento crítico del ciclo de vida del colaborador. Juntos, te dan visión completa.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {products.map((product, index) => (
              <div key={index} className="group bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:border-cyan-500/30 hover:bg-slate-800/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <product.icon className="h-7 w-7 text-cyan-400" />
                    </div>
                    <div>
                      {/* h3 - font-light según sistema real */}
                      <h3 className="text-xl font-light text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-cyan-400 font-light">{product.tagline}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">{product.badge}</span>
                </div>

                {/* Descripción - font-light según guía */}
                <p className="text-slate-300 font-light mb-8 leading-relaxed">{product.description}</p>

                <div className="space-y-4 mb-8">
                  {product.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300 font-light leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <PrimaryButton fullWidth icon={ArrowRight} iconPosition="right">Más Información</PrimaryButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-purple-400">Próximamente</span>
            </div>

            {/* h2 - font-light según sistema real */}
            <h2 className="text-4xl md:text-5xl font-light">Evolución Continua</h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">Estamos trabajando en nuevas capacidades avanzadas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { icon: Sparkles, name: 'Kit Comunicación v4.0', description: '200+ templates con generación asistida por IA' },
              { icon: BarChart3, name: 'Intelligence Layer C+', description: 'Predicciones avanzadas con deep learning' }
            ].map((item, index) => (
              <div key={index} className="p-8 bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <item.icon className="h-10 w-10 text-purple-400 mb-5 mx-auto" />
                <h3 className="text-lg font-light text-white mb-3">{item.name}</h3>
                <p className="text-sm text-slate-400 font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-light">
              ¿Listo para dejar de <span className="text-purple-400">reaccionar</span>?
            </h2>
            <p className="text-lg text-slate-400 font-light">Cada día sin inteligencia predictiva = talento en riesgo</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <PrimaryButton size="md" icon={ArrowRight} iconPosition="right">Comenzar Ahora</PrimaryButton>
              </Link>
              <Link href="/platform">
                <SecondaryButton size="md">Ver Plataforma</SecondaryButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}