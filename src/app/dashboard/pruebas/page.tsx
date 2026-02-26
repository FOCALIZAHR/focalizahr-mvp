import React from 'react';
import { Check, Activity, ShieldCheck, Zap, AlertCircle, TrendingDown } from "lucide-react";

// Componentes Simulados de shadcn/ui para la prueba rápida
const Button = ({ children, className, variant }: any) => (
  <button className={`px-6 py-3 rounded-full font-bold transition-all ${className}`}>
    {children}
  </button>
);

export default function SimpleHRPruebaPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] selection:bg-cyan-100 antialiased font-sans">
      
      {/* --- NAVBAR ESTILO APPLE --- */}
      <nav className="flex justify-between items-center px-12 py-8 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="text-2xl font-bold tracking-tighter italic">
          Simple<span className="bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] bg-clip-text text-transparent">HR</span>
        </div>
        <div className="hidden md:flex space-x-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          <a href="#metodo" className="hover:text-slate-900 transition-colors">Método Ejecutivo</a>
          <a href="#inteligencia" className="hover:text-slate-900 transition-colors">Ciencia de Datos</a>
          <a href="#planes" className="hover:text-slate-900 transition-colors">Membresías</a>
        </div>
        <Button className="border border-slate-200 text-slate-900 text-[10px] tracking-widest hover:bg-slate-50">
          AGENDA UNA CONSULTA
        </Button>
      </nav>

      <main className="max-w-6xl mx-auto px-6">
        
        {/* --- HERO: CONTINUIDAD OPERATIVA --- */}
        <section className="pt-32 pb-24 text-center">
          <div className="inline-block px-4 py-1.5 mb-8 text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase bg-cyan-50 rounded-full">
            Líderes de Negocio buscando a sus pares
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-8 leading-[1.05]">
            Talento técnico. <br />
            <span className="bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] bg-clip-text text-transparent">Certeza operativa.</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-slate-500 mb-12 leading-relaxed font-medium">
            No somos una agencia externa; somos tu <strong>extensión táctica</strong>. Encontramos, integramos y blindamos tu talento con la experiencia de quienes han gestionado presupuestos de +$1.000MM.
          </p>
          <Button className="bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] text-white px-12 py-8 text-lg shadow-2xl shadow-cyan-100 hover:opacity-90">
            SOLICITAR PLAN DE CONTINUIDAD
          </Button>
        </section>

        {/* --- SECCIÓN: LA REVELACIÓN (OFFBOARDING) --- */}
        <section id="inteligencia" className="py-20 grid md:grid-cols-2 gap-16 items-center border-t border-slate-50">
          <div>
            <h2 className="text-4xl font-bold italic tracking-tight mb-6">La Verdad de tu Rotación.</h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              Auditamos científicamente por qué se va tu talento 30 días después de su salida, cuando ya no hay miedo a represalias. 
              Comparamos tus hipótesis con la <strong>Realidad Científica</strong> para ajustar tus búsquedas de raíz.
            </p>
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <TrendingDown className="text-red-400 w-5 h-5" /> Estimación real del costo de salida por área.
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <Check className="text-cyan-500 w-5 h-5" /> Planes de mitigación focalizados con ROI medible.
               </div>
            </div>
          </div>
          <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Dashboard: La Revelación</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 uppercase">Hipótesis RRHH: Sueldo</div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 w-[55%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-black text-cyan-500 mb-2 uppercase tracking-widest">Realidad: Autonomía y Confianza</div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] w-[24%]" />
                </div>
              </div>
              <p className="text-[10px] text-center text-slate-400 italic mt-6">
                "El 80% de las salidas en Ventas se predijeron en el Onboarding".
              </p>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN: EL SELLO DE LOS 90 DÍAS (ONBOARDING) --- */}
        <section className="py-24 border-t border-slate-50">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold italic tracking-tight mb-4">El Sello de los 90 Días</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Monitor de signos vitales para cada nuevo líder. Detectamos riesgos de fuga antes de que ocurran.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { l: "Alistamiento", m: "Compliance", d: "Día 1: ¿Cumplió la empresa su promesa?", c: "bg-cyan-500" },
              { l: "Claridad de Rol", m: "Clarification", d: "Día 7: Comprensión total de KPIs técnicos.", c: "bg-purple-500" },
              { l: "Ajuste Cultural", m: "Culture", d: "Día 30: ¿Se ve aquí en un año?", c: "bg-cyan-400" },
              { l: "Conexión Social", m: "Connection", d: "Día 90: Calidad de redes de confianza.", c: "bg-purple-400" }
            ].map((v, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-2xl transition-all">
                <div className={`w-2 h-2 rounded-full ${v.c} mb-4`} />
                <h4 className="font-black text-slate-900 mb-2">{v.l}</h4>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4">{v.m}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- PLANES DE MEMBRESÍA --- */}
        <section id="planes" className="py-24 mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                n: "Profesional", p: "$500.000", c: "3 Créditos", 
                d: "3 Jefaturas o 2 Subgerencias (1.5 c/u)", 
                f: ["Búsqueda Ejecutiva Dirigida", "Diagnóstico Científico 4C Individual"],
                btn: "bg-slate-900 text-white"
              },
              { 
                n: "PRO", p: "$1.000.000", c: "3 Créditos", 
                d: "Blindaje Operativo de toda la empresa", 
                f: ["Todo lo Profesional", "Onboarding del 100% de la empresa", "Dashboard Live 24/7", "Alertas Preventivas de Fuga"],
                btn: "bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] text-white shadow-xl shadow-cyan-100",
                best: true
              },
              { 
                n: "Enterprise", p: "$1.800.000", c: "6 Créditos", 
                d: "Estrategia Global y Mitigación", 
                f: ["Todo lo PRO", "Offboarding de toda la empresa", "Estudio Científico de Rotación", "Plan Semestral de Salud Org."],
                btn: "bg-slate-900 text-white"
              }
            ].map((plan, i) => (
              <div key={i} className={`p-10 rounded-[3rem] bg-white border border-slate-100 flex flex-col relative ${plan.best ? 'ring-2 ring-cyan-400 shadow-2xl shadow-cyan-50' : ''}`}>
                <div className="mb-8">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{plan.n}</h3>
                  <div className="text-5xl font-black mb-1">{plan.p}</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Mensual / Plan Anual</p>
                </div>
                <div className="mb-8 p-5 bg-slate-50 rounded-[2rem]">
                  <p className="text-xs font-black text-cyan-600 mb-1">{plan.c} ANUALES</p>
                  <p className="text-[10px] text-slate-500 font-bold italic leading-tight">{plan.d}</p>
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                  {plan.f.map((feat, idx) => (
                    <li key={idx} className="flex gap-3 text-[13px] font-medium text-slate-600">
                      <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full py-7 rounded-full font-black text-xs uppercase tracking-widest ${plan.btn}`}>
                  SELECCIONAR
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}