'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Target,
  Shield,
  Compass,
  Rocket,
  DoorOpen,
  Brain,
  LayoutDashboard,
  FileText,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Zap,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface ProductCardProps {
  icon: LucideIcon;
  name: string;
  desc: string;
  kpi: string;
  kpiLabel: string;
  color: 'cyan' | 'purple';
}

interface JourneyCardProps {
  icon: LucideIcon;
  name: string;
  score: string;
  scoreValue: number;
  features: string[];
  color: 'cyan' | 'purple';
}

interface OutputCardProps {
  icon: LucideIcon;
  name: string;
  features: string[];
}

interface SystemLevelProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

interface PreviewKPICardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  sublabel?: string;
  alert?: boolean;
  showGauge?: boolean;
  gaugeValue?: number;
}

interface DepartmentMiniCardProps {
  name: string;
  score: number;
  estado: 'crisis' | 'observacion' | 'estable' | 'saludable';
  size?: 'normal' | 'compact';
}

interface AlertMiniItemProps {
  severity: 'critical' | 'high';
  title: string;
  dept: string;
  time: string;
}

interface CollapsibleSectionProps {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface PatronDetectado {
  nombre: string;
  descripcion: string;
  correlacion: {
    productos: Array<{
      nombre: string;
      score: number;
      label: string;
    }>;
    coincidencia: number;
  };
  insight: string;
}

interface PrediccionRiesgo {
  timeline: string;
  consecuencias: string[];
  costoProyectado: string;
  probabilidad: number;
}

interface DepartamentoCritico {
  nombre: string;
  isd: number;
  sintomasConvergentes: string[];
  patronAsociado: string;
  costoEnJuego: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function SystemOverviewPage() {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <DashboardNavigation />
      <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header */}
        <header className="text-center mb-12 sm:mb-16">
          {/* Logo oficial */}
          <div className="flex justify-center mb-6">
            <img
              src="/images/focalizahr-logo_palabra.svg"
              alt="FocalizaHR"
              className="h-8 opacity-80"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
              Sistema de <span className="fhr-title-gradient">Inteligencia</span>
            </h1>
          </motion.div>

          {/* Divider Tesla */}
          <motion.div
            className="flex items-center justify-center gap-3 my-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-slate-600 to-cyan-500/50" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-slate-600 to-purple-500/50" />
          </motion.div>

          <motion.p
            className="text-slate-400 font-light text-lg sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Sistema de Inteligencia de Talento
          </motion.p>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 1: PRODUCTOS DE CAPTURA
           ═══════════════════════════════════════════════════════════════ */}
        <SystemLevel
          title="Productos de Captura"
          subtitle="Estudios temporales especializados"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <ProductCard icon={Activity} name="Pulso Express" desc="Clima rápido" kpi="3.8" kpiLabel="/5.0" color="cyan" />
            <ProductCard icon={Target} name="Experiencia Full" desc="360°" kpi="+32" kpiLabel="eNPS" color="cyan" />
            <ProductCard icon={Shield} name="Ambiente Sano" desc="Ley Karin" kpi="78" kpiLabel="/100" color="cyan" />
            <ProductCard icon={Compass} name="Culture Scope" desc="Cultura Org." kpi="65" kpiLabel="ICC" color="cyan" />
          </div>
        </SystemLevel>

        {/* Conector */}
        <FlowConnector />

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 2: PRODUCTOS PERMANENTES
           ═══════════════════════════════════════════════════════════════ */}
        <SystemLevel
          title="Productos Permanentes"
          subtitle="Journey completo del colaborador"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <JourneyCard
              icon={Rocket}
              name="Onboarding Journey Intelligence"
              score="EXO Score"
              scoreValue={72}
              features={['D7 → D30 → D60 → D90', '6 alertas predictivas', '85% accuracy retención']}
              color="cyan"
            />
            <JourneyCard
              icon={DoorOpen}
              name="Exit Intelligence"
              score="EIS Score"
              scoreValue={58}
              features={['Encuesta confidencial', 'Causa raíz real', 'Correlación onboarding']}
              color="purple"
            />
          </div>
        </SystemLevel>

        {/* Conector */}
        <FlowConnector />

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 3: MOTOR DE INTELIGENCIA
           ═══════════════════════════════════════════════════════════════ */}
        <SystemLevel
          title="Motor de Inteligencia"
          subtitle="5 capas de procesamiento"
        >
          <IntelligenceLayers />
        </SystemLevel>

        {/* Conector */}
        <FlowConnector />

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 4: SALIDAS EJECUTIVAS
           ═══════════════════════════════════════════════════════════════ */}
        <SystemLevel
          title="Salidas Ejecutivas"
          subtitle="Decisiones, no reportes"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <OutputCard
              icon={LayoutDashboard}
              name="Torre de Control"
              features={['Dashboard ejecutivo', 'Alertas tiempo real', 'ROI cuantificado']}
            />
            <OutputCard
              icon={FileText}
              name="Kit Comunicación"
              features={['110+ templates', 'Business case auto', 'Presenta al CEO en 5 min']}
            />
          </div>
        </SystemLevel>

        {/* Spacer */}
        <div className="h-12 sm:h-16" />

        {/* ═══════════════════════════════════════════════════════════════
            PREVIEW ISD - COLAPSABLE
           ═══════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          title="Preview: Inteligencia Organizacional"
          subtitle="Próximamente - Mapa de Salud Departamental"
          defaultOpen={false}
        >
          <ISDPreviewMock />
        </CollapsibleSection>

        </div>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: SystemLevel
// ═══════════════════════════════════════════════════════════════════════════

function SystemLevel({ title, subtitle, children }: SystemLevelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative mb-4"
    >
      {/* Top Line Tesla - Más visible */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 30%, #A78BFA 70%, transparent 95%)'
        }}
      />

      <div className="pt-6 pb-4">
        <h2 className="text-xs uppercase tracking-wider text-cyan-400 font-medium mb-1">
          {title}
        </h2>
        <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
        {children}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ProductCard
// ═══════════════════════════════════════════════════════════════════════════

function ProductCard({ icon: Icon, name, desc, kpi, kpiLabel, color }: ProductCardProps) {
  return (
    <motion.div
      className="fhr-card-static p-3 sm:p-4 text-center group cursor-default"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`
        w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl
        flex items-center justify-center transition-colors duration-300
        ${color === 'cyan'
          ? 'bg-cyan-500/10 group-hover:bg-cyan-500/20'
          : 'bg-purple-500/10 group-hover:bg-slate-700/50'
        }
      `}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`} />
      </div>
      <p className="text-sm font-medium text-white">{name}</p>
      <p className="text-xs text-slate-500">{desc}</p>
      <div className="mt-2">
        <span className={`text-xl sm:text-2xl font-light ${color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`}>
          {kpi}
        </span>
        <span className="text-xs sm:text-sm text-slate-500 ml-0.5">{kpiLabel}</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: JourneyCard
// ═══════════════════════════════════════════════════════════════════════════

function JourneyCard({ icon: Icon, name, score, scoreValue, features, color }: JourneyCardProps) {
  return (
    <motion.div
      className="fhr-card-static p-5 sm:p-6"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${color === 'cyan' ? 'bg-cyan-500/10' : 'bg-purple-500/10'}
        `}>
          <Icon className={`w-5 h-5 ${color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`} />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-white">{name}</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <ScoreGauge value={scoreValue} color={color} />
        <div>
          <p className={`text-lg font-medium ${color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'}`}>
            {score}
          </p>
          <p className="text-xs text-slate-500">(0-100)</p>
        </div>
      </div>

      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan-400' : 'bg-purple-400'}`} />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ScoreGauge (Mini gauge circular para EXO/EIS)
// ═══════════════════════════════════════════════════════════════════════════

function ScoreGauge({ value, color }: { value: number; color: 'cyan' | 'purple' }) {
  const percentage = (value / 100) * 100;
  const dashOffset = 126 - (126 * percentage / 100);
  const strokeColor = color === 'cyan' ? '#22D3EE' : '#A78BFA';

  return (
    <svg className="w-16 h-16" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="none" stroke="#1e293b" strokeWidth="3" />
      <motion.circle
        cx="22" cy="22" r="20" fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeDasharray="126"
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
        initial={{ strokeDashoffset: 126 }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      <text
        x="22"
        y="26"
        textAnchor="middle"
        className="fill-white text-sm font-light"
        style={{ fontSize: '12px' }}
      >
        {value}
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: OutputCard
// ═══════════════════════════════════════════════════════════════════════════

function OutputCard({ icon: Icon, name, features }: OutputCardProps) {
  return (
    <motion.div
      className="fhr-card-static p-5 sm:p-6"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-white">{name}</h3>
      </div>

      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: IntelligenceLayers
// ═══════════════════════════════════════════════════════════════════════════

function IntelligenceLayers() {
  const layers = [
    { id: 'L0', name: 'CAPTURA', desc: 'Datos crudos', highlight: false },
    { id: 'LA', name: 'AGREGACIÓN', desc: 'Por departamento', highlight: false },
    { id: 'LB', name: 'CORRELACIÓN', desc: 'Cruza productos', highlight: false },
    { id: 'LC', name: 'PREDICCIÓN', desc: 'Alertas + ROI', highlight: false },
    { id: 'LD', name: 'ACCIÓN', desc: 'Kit + Delegación', highlight: true },
  ];

  return (
    <div className="relative">
      {/* Brain central con glow - Desktop */}
      <div className="hidden sm:flex absolute -top-8 left-1/2 -translate-x-1/2 z-10">
        <div
          className="p-3 rounded-full bg-slate-900/80 border border-slate-700/50"
          style={{ boxShadow: '0 0 30px rgba(167, 139, 250, 0.4), 0 0 60px rgba(167, 139, 250, 0.2)' }}
        >
          <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>
      </div>

      {/* Mobile: Stack vertical */}
      <div className="flex flex-col sm:hidden gap-3">
        {/* Brain móvil */}
        <div className="flex justify-center mb-2">
          <div
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700/50"
            style={{ boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)' }}
          >
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
        </div>
        {layers.map((layer, i) => (
          <div key={layer.id}>
            <motion.div
              className={`fhr-card-static p-4 text-center ${layer.highlight ? 'border-purple-500/50' : ''}`}
              style={layer.highlight ? { boxShadow: '0 0 15px rgba(167, 139, 250, 0.2)' } : undefined}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    layer.highlight
                      ? 'text-purple-400 bg-purple-400/10'
                      : 'text-cyan-400 bg-cyan-400/10'
                  }`}>
                    {layer.id}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white flex items-center gap-1.5">
                      {layer.name}
                      {layer.highlight && <Zap className="w-3.5 h-3.5 text-purple-400" />}
                    </p>
                    <p className="text-xs text-slate-500">{layer.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            {i < layers.length - 1 && (
              <div className="flex justify-center py-2">
                <AnimatedFlowConnectorVertical />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Horizontal */}
      <div className="hidden sm:flex items-center justify-between gap-1 pt-6">
        {layers.map((layer, i) => (
          <div key={layer.id} className="flex items-center flex-1">
            <motion.div
              className={`fhr-card-static p-3 lg:p-4 flex-1 text-center ${layer.highlight ? 'border-purple-500/50' : ''}`}
              style={layer.highlight ? { boxShadow: '0 0 15px rgba(167, 139, 250, 0.2)' } : undefined}
              whileHover={{ scale: 1.02 }}
            >
              <p className={`text-xs font-bold inline-block px-2 py-1 rounded mb-2 ${
                layer.highlight
                  ? 'text-purple-400 bg-purple-400/10'
                  : 'text-cyan-400 bg-cyan-400/10'
              }`}>
                {layer.id}
              </p>
              <p className="text-xs sm:text-sm font-medium text-white flex items-center justify-center gap-1">
                {layer.name}
                {layer.highlight && <Zap className="w-3 h-3 text-purple-400" />}
              </p>
              <p className="text-xs text-slate-500 mt-1">{layer.desc}</p>
            </motion.div>
            {i < layers.length - 1 && (
              <AnimatedFlowConnectorHorizontal />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: AnimatedFlowConnectorHorizontal (Efecto flujo de datos)
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedFlowConnectorHorizontal() {
  return (
    <div className="relative w-8 lg:w-12 h-4 mx-1 lg:mx-2 flex-shrink-0 overflow-hidden">
      {/* Línea base */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 -translate-y-1/2" />
      {/* Partícula animada */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-1 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)'
        }}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: AnimatedFlowConnectorVertical (Efecto flujo de datos móvil)
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedFlowConnectorVertical() {
  return (
    <div className="relative w-4 h-4 overflow-hidden">
      {/* Línea base */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400/30 to-purple-400/30 -translate-x-1/2" />
      {/* Partícula animada */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-1 h-2 rounded-full"
        style={{
          background: 'linear-gradient(180deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 6px rgba(34, 211, 238, 0.6)'
        }}
        animate={{
          y: ['-100%', '300%'],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: FlowConnector
// ═══════════════════════════════════════════════════════════════════════════

function FlowConnector() {
  return (
    <div className="flex justify-center py-4 sm:py-6">
      <motion.div
        className="w-px h-8 sm:h-10 bg-gradient-to-b from-cyan-400/50 to-purple-400/50"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: CollapsibleSection
// ═══════════════════════════════════════════════════════════════════════════

function CollapsibleSection({ title, subtitle, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-800/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
      >
        <div>
          <h3 className="text-sm font-medium text-purple-400">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-purple-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ISDPreviewMock
// ═══════════════════════════════════════════════════════════════════════════

function ISDPreviewMock() {
  // Datos mock que representan la inteligencia real
  const patronDetectado: PatronDetectado = {
    nombre: "Hipocresía Corporativa",
    descripcion: "Desconexión entre valores declarados y conducta real",
    correlacion: {
      productos: [
        { nombre: "Exit", score: 35, label: "EIS" },
        { nombre: "Culture", score: 42, label: "ICC" },
        { nombre: "Onboard", score: 38, label: "EXO" },
      ],
      coincidencia: 87
    },
    insight: "Los que se van, los que miden cultura, y los nuevos coinciden: valores declarados ≠ conducta real"
  };

  const prediccion: PrediccionRiesgo = {
    timeline: "30 días",
    consecuencias: [
      "3 personas clave con 85% prob. de renuncia",
      "Efecto contagio a Ventas y Marketing",
      "Pérdida conocimiento crítico irreversible"
    ],
    costoProyectado: "$57M",
    probabilidad: 85
  };

  const deptoCritico: DepartamentoCritico = {
    nombre: "Operaciones",
    isd: 34,
    sintomasConvergentes: [
      "ICC: 42 — cultura desalineada",
      "5 alertas onboarding abiertas",
      "Rotación 12m: 25%",
      "EIS menciona 'liderazgo' en 4/5 salidas"
    ],
    patronAsociado: "Hipocresía Corporativa",
    costoEnJuego: "$57M"
  };

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════
          HERO: Dinero + Contexto
          ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center py-8">
        <p className="text-5xl sm:text-6xl font-light text-cyan-400 mb-2">
          $135M
        </p>
        <p className="text-lg text-slate-400 font-light mb-4">en riesgo organizacional</p>

        {/* Barra de contexto */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '18%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm text-slate-400">18% de nómina</span>
          </div>
          <p className="text-xs text-slate-500">
            Calculado desde: rotación proyectada + costos reemplazo + pérdida productividad
          </p>
        </div>
      </div>

      {/* Divider con línea Tesla */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <div className="px-4 bg-slate-900">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PATRÓN DETECTADO - La Inteligencia
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Línea Tesla superior - gradiente sutil */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)'
          }}
        />

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-slate-700/50">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">Patrón Detectado</p>
            <h3 className="text-xl font-light text-white">&ldquo;{patronDetectado.nombre}&rdquo;</h3>
          </div>
        </div>

        {/* Correlación visual de productos */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-3">Correlación entre productos FocalizaHR:</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {patronDetectado.correlacion.productos.map((prod, i) => (
              <div key={prod.nombre} className="flex items-center gap-2">
                <div className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-center min-w-[80px]">
                  <p className="text-xs text-slate-500 mb-1">{prod.nombre}</p>
                  <p className="text-lg font-light text-white">{prod.score}</p>
                  <p className="text-[10px] text-slate-600">{prod.label}</p>
                </div>
                {i < patronDetectado.correlacion.productos.length - 1 && (
                  <div className="text-purple-400/50">
                    <Zap className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-700/50">
              <p className="text-sm text-purple-400 font-medium">{patronDetectado.correlacion.coincidencia}%</p>
              <p className="text-[10px] text-purple-400/70">coincidencia</p>
            </div>
          </div>
        </div>

        {/* Insight */}
        <p className="text-sm text-slate-300 text-center italic">
          &ldquo;{patronDetectado.insight}&rdquo;
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          GRID: Departamento Crítico + Predicción
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Departamento Crítico */}
        <motion.div
          className="relative p-5 rounded-2xl border border-slate-700/50 bg-slate-800/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Línea Tesla cyan */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
            }}
          />

          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Requiere Intervención</p>
              <h3 className="text-2xl font-light text-white">{deptoCritico.nombre}</h3>
            </div>
            <div className="text-right">
              <p className="text-4xl font-light text-cyan-400">{deptoCritico.isd}</p>
              <p className="text-xs text-slate-500">ISD Score</p>
            </div>
          </div>

          {/* Síntomas convergentes */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-500">Síntomas convergentes:</p>
            {deptoCritico.sintomasConvergentes.map((sintoma, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
                {sintoma}
              </div>
            ))}
          </div>

          {/* Costo */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500">Costo en juego:</span>
            <span className="text-lg font-light text-cyan-400">{deptoCritico.costoEnJuego}</span>
          </div>
        </motion.div>

        {/* Predicción */}
        <motion.div
          className="relative p-5 rounded-2xl border border-slate-700/50 bg-slate-800/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-700/50">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Predicción</p>
              <h3 className="text-lg font-light text-white">
                Si no actúas en <span className="text-amber-400">{prediccion.timeline}</span>
              </h3>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            {prediccion.consecuencias.map((cons, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="w-1 h-1 rounded-full bg-amber-400/70 mt-2" />
                {cons}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div>
              <span className="text-xs text-slate-500">Costo proyectado: </span>
              <span className="text-lg font-light text-white">{prediccion.costoProyectado}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <span className="text-sm text-amber-400">{prediccion.probabilidad}% prob.</span>
            </div>
          </div>

          {/* CTA - Usar sistema de botones FocalizaHR */}
          <button className="fhr-btn fhr-btn-secondary w-full mt-4 flex items-center justify-center gap-2">
            Ver plan de intervención
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DEPARTAMENTOS SECUNDARIOS (Compactos)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="pt-4">
        <p className="text-xs text-slate-500 mb-3">Otros departamentos:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DepartmentMiniCard name="TI" score={92} estado="saludable" size="compact" />
          <DepartmentMiniCard name="Finanzas" score={88} estado="saludable" size="compact" />
          <DepartmentMiniCard name="Comercial" score={74} estado="estable" size="compact" />
          <DepartmentMiniCard name="RRHH" score={71} estado="estable" size="compact" />
        </div>
      </div>

      {/* Badge Coming Soon */}
      <div className="text-center pt-4">
        <span className="fhr-badge fhr-badge-premium inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Próximamente en FocalizaHR
        </span>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PreviewKPICard
// ═══════════════════════════════════════════════════════════════════════════

function PreviewKPICard({ label, value, trend, trendUp, sublabel, alert, showGauge, gaugeValue = 0 }: PreviewKPICardProps) {
  return (
    <div className={`fhr-card-static p-4 text-center ${alert ? 'border-orange-500/30' : ''}`}>
      {showGauge ? (
        <div className="flex items-center justify-center mb-1">
          <MiniGauge value={gaugeValue} displayValue={value} />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl sm:text-3xl font-light text-white">{value}</p>
          {alert && <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse" />}
        </div>
      )}
      {trend && (
        <p className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend}
        </p>
      )}
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: MiniGauge (Arco de progreso circular)
// ═══════════════════════════════════════════════════════════════════════════

function MiniGauge({ value, displayValue }: { value: number; displayValue: string }) {
  const radius = 36;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Determinar color según valor
  const getColor = (v: number) => {
    if (v >= 80) return '#10B981'; // emerald
    if (v >= 60) return '#F59E0B'; // amber
    if (v >= 40) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const color = getColor(value);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90"
      >
        {/* Fondo del arco */}
        <circle
          stroke="rgba(71, 85, 105, 0.3)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Arco de progreso */}
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${color})`
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Valor central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-light text-white">{displayValue}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: DepartmentMiniCard
// ═══════════════════════════════════════════════════════════════════════════

function DepartmentMiniCard({ name, score, estado, size = 'normal' }: DepartmentMiniCardProps) {
  const ESTADOS_CONFIG = {
    crisis:      { label: 'Crisis',         color: 'text-slate-300' },
    observacion: { label: 'Observación',    color: 'text-slate-400' },
    estable:     { label: 'Estable',        color: 'text-slate-500' },
    saludable:   { label: 'Saludable',      color: 'text-emerald-400/70' },
  };

  const config = ESTADOS_CONFIG[estado];
  const isCompact = size === 'compact';

  return (
    <div className={`
      relative rounded-xl border border-slate-700/50
      bg-slate-800/30 backdrop-blur-sm
      ${isCompact ? 'p-3' : 'p-4'}
      transition-all duration-200 hover:bg-slate-800/50 hover:border-slate-600/50
    `}>
      <p className={`text-white font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
        {name}
      </p>
      <p className={`font-light text-white ${isCompact ? 'text-xl' : 'text-2xl'}`}>
        {score}
      </p>
      <p className={`${config.color} ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
        {config.label}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: AlertMiniItem
// ═══════════════════════════════════════════════════════════════════════════

function AlertMiniItem({ severity, title, dept, time }: AlertMiniItemProps) {
  const isCritical = severity === 'critical';

  return (
    <div className={`
      p-3 rounded-lg border-l-2 border-l-slate-600
      bg-slate-800/30
      ${isCritical ? 'ring-1 ring-slate-600/50' : ''}
    `}>
      <div className="flex items-start gap-2">
        {isCritical && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-1.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-sm text-white">{title}</p>
          <p className="text-xs text-slate-500">{dept} • {time}</p>
        </div>
      </div>
    </div>
  );
}
