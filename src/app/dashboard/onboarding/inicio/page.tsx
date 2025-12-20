'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  Activity,
  Bell,
  Users,
  Building2
} from 'lucide-react';

/**
 * HUB ONBOARDING INTELLIGENCE v4
 * 
 * AJUSTES v4:
 * - Badge: sin uppercase, sin tracking wide, color slate-600
 * - Alert box: mb-8 (botón sube)
 * - Grid: max-w-xl (cards más anchas, texto no trunca)
 * - Descripciones: sin truncate
 * 
 * Ruta: /dashboard/onboarding/inicio
 */

export default function OnboardingHubPage() {
  const router = useRouter();
  const [currentPanel, setCurrentPanel] = useState<0 | 1>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPanel(1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPanel(0);
      setIsTransitioning(false);
    }, 300);
  };

  const links = [
    {
      href: '/dashboard/onboarding',
      icon: Activity,
      title: 'Pulso de integración',
      description: 'Estado en tiempo real y costo en riesgo',
      color: 'cyan'
    },
    {
      href: '/dashboard/onboarding/alerts',
      icon: Bell,
      title: 'Alertas activas',
      description: 'Señales detectadas con plan de acción',
      color: 'amber'
    },
    {
      href: '/dashboard/onboarding/pipeline',
      icon: Users,
      title: 'Mis colaboradores',
      description: 'Seguimiento individual 90 días',
      color: 'emerald'
    },
    {
      href: '/dashboard/onboarding/executive',
      icon: Building2,
      title: 'Salud por área',
      description: 'Comparar gerencias y patrones',
      color: 'violet'
    }
  ];

  const colorClasses: Record<string, { icon: string; border: string; bg: string }> = {
    cyan: {
      icon: 'text-cyan-400',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      bg: 'bg-cyan-500/10'
    },
    amber: {
      icon: 'text-amber-400',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      bg: 'bg-amber-500/10'
    },
    emerald: {
      icon: 'text-emerald-400',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      bg: 'bg-emerald-500/10'
    },
    violet: {
      icon: 'text-violet-400',
      border: 'border-violet-500/30 hover:border-violet-500/50',
      bg: 'bg-violet-500/10'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      
      {/* FONDOS SUTILES */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-screen flex flex-col px-6">

        {/* ═══════════════════════════════════════════════════════════
            PANEL 1: CONTEXTO
           ═══════════════════════════════════════════════════════════ */}
        {currentPanel === 0 && (
          <div 
            className={`
              flex-1 flex flex-col justify-center items-center text-center
              transition-all duration-500
              ${isTransitioning ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'}
            `}
          >
            {/* Badge - SIN MAYÚSCULAS, más sutil */}
            <p className="text-[10px] text-slate-600 mb-6">
              Metodología 4C Bauer · 90 días críticos
            </p>

            {/* Título */}
            <h1 className="text-5xl md:text-6xl font-light text-white tracking-tight mb-6">
              Onboarding
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Intelligence
              </span>
            </h1>

            {/* Línea decorativa */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>

            {/* Propósito */}
            <p className="text-lg md:text-xl text-slate-400 font-light max-w-lg mb-8 leading-relaxed">
              El centro de comando donde conviertes los primeros 90 días en retención de largo plazo
            </p>

            {/* DATO DURO - texto sutil, sin box */}
            <p className="text-xs text-slate-500 mb-8">
              40% se va en 12 meses · Cada salida cuesta 6 sueldos
            </p>

            {/* Botón Explorar */}
            <button
              onClick={handleNext}
              className="
                group flex items-center gap-2 px-8 py-3 rounded-full
                bg-cyan-500/10 border border-cyan-500/30
                text-cyan-400 font-normal
                hover:bg-cyan-500/20 hover:border-cyan-500/50
                hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]
                transition-all duration-300
              "
            >
              Explorar
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PANEL 2: NAVEGACIÓN
           ═══════════════════════════════════════════════════════════ */}
        {currentPanel === 1 && (
          <div 
            className={`
              flex-1 flex flex-col justify-center items-center
              transition-all duration-500
              ${isTransitioning ? 'opacity-0 translate-x-[20px]' : 'opacity-100 translate-x-0'}
            `}
          >
            {/* Título */}
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-4">
              Onboarding
            </h2>

            {/* Línea decorativa */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>

            {/* Pregunta */}
            <p className="text-lg text-slate-500 mb-8">
              ¿Qué necesitas hacer hoy?
            </p>

            {/* Links - Grid más ancho para que no trunque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              {links.map((link, index) => {
                const Icon = link.icon;
                const colors = colorClasses[link.color];
                
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    onMouseEnter={() => setHoveredLink(index)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className={`
                      group flex items-center gap-4 p-5 rounded-xl text-left
                      bg-slate-900/40 backdrop-blur-sm border
                      ${colors.border}
                      hover:bg-slate-800/50
                      transition-all duration-300
                    `}
                  >
                    {/* Ícono */}
                    <div className={`p-3 rounded-xl ${colors.bg} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    
                    {/* Texto - SIN TRUNCATE */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-normal mb-0.5 group-hover:text-cyan-400 transition-colors">
                        {link.title}
                      </p>
                      <p className="text-slate-500 text-sm">
                        {link.description}
                      </p>
                    </div>
                    
                    {/* Flecha */}
                    <ArrowRight className={`
                      w-5 h-5 flex-shrink-0 transition-all duration-300
                      ${hoveredLink === index 
                        ? `${colors.icon} translate-x-1` 
                        : 'text-slate-700'
                      }
                    `} />
                  </button>
                );
              })}
            </div>

            {/* Volver - más cerca */}
            <button
              onClick={handleBack}
              className="
                flex items-center gap-2 mt-8
                text-slate-600 hover:text-slate-400
                transition-colors duration-200
              "
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver</span>
            </button>
          </div>
        )}

        {/* INDICADORES (dots) */}
        <div className="flex justify-center gap-2 py-6">
          <div 
            className={`
              h-2 rounded-full transition-all duration-300
              ${currentPanel === 0 ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'}
            `} 
          />
          <div 
            className={`
              h-2 rounded-full transition-all duration-300
              ${currentPanel === 1 ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'}
            `} 
          />
        </div>

      </div>
    </div>
  );
}