// ====================================================================
// DEPARTMENTWOWCAROUSEL - DISEÑO HORIZONTAL UX MEJORADO
// src/components/monitor/DepartmentWowCarousel.tsx
// Layout: Contexto Izquierda (40%) | Componente Derecha (60%)
// ====================================================================

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Zap,
  Info,
  Eye,
  Target,
  Sparkles
} from 'lucide-react';

// ====================================================================
// IMPORTS DE COMPONENTES WOW (Verificados)
// ====================================================================
import TopMoversPanel from '@/components/monitor/TopMoversPanel';
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import LeadershipFingerprintPanel from '@/components/monitor/LeadershipFingerprintPanel';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';

// ====================================================================
// CONTEXTO EDUCATIVO PARA CADA COMPONENTE
// ====================================================================

interface ComponentContext {
  id: string;
  title: string;
  icon: React.ElementType;
  whatItShows: string;
  whyItMatters: string;
  howToRead: string;
  actionableInsight: string;
}

const WOW_CONTEXTS: Record<string, ComponentContext> = {
  rhythm: {
    id: 'rhythm',
    title: "Ritmo y Proyección",
    icon: Zap,
    whatItShows: "Timeline visual con respuestas diarias, tendencia actual y proyección matemática del resultado final",
    whyItMatters: "Anticipa el resultado con días de anticipación para tomar acciones correctivas a tiempo",
    howToRead: "Barras = respuestas diarias | Línea sólida = progreso actual | Línea punteada = proyección futura",
    actionableInsight: "Si la proyección está bajo el objetivo, intensifique comunicaciones ahora"
  },
  
  topmovers: {
    id: 'topmovers',
    title: "Top Movers Departamental",
    icon: TrendingUp,
    whatItShows: "Los 5 departamentos con mayor momentum de participación en las últimas 48 horas",
    whyItMatters: "Identifica dónde está la energía organizacional y qué áreas están respondiendo mejor",
    howToRead: "🟢 Acelerando = momentum positivo | 🟡 Estable = sin cambios | 🔴 Desacelerando = requiere atención",
    actionableInsight: "Replique las estrategias de los departamentos en verde"
  },
  
  pulse: {
    id: 'pulse',
    title: "Pulso Departamental",
    icon: Activity,
    whatItShows: "Estado de salud de participación por departamento con semáforo visual inteligente",
    whyItMatters: "Prioriza dónde enfocar recursos y esfuerzos de comunicación",
    howToRead: "🟢 >80% Excelente | 🟡 50-80% Requiere atención | 🔴 <50% Crítico",
    actionableInsight: "Enfoque inmediato en departamentos rojos, mantenga verdes"
  },
  
  anomalies: {
    id: 'anomalies',
    title: "Detector de Anomalías",
    icon: AlertTriangle,
    whatItShows: "Departamentos con participación estadísticamente inusual usando análisis Z-score",
    whyItMatters: "Detecta problemas ocultos antes de que escalen y reconoce éxitos inesperados",
    howToRead: "Z > 2 = excepcional positivo | Z < -2 = requiere intervención inmediata",
    actionableInsight: "Intervenga en departamentos con Z < -2 en las próximas 24 horas"
  },
  
  heatmap: {
    id: 'heatmap',
    title: "Mapa de Calor Temporal",
    icon: Clock,
    whatItShows: "Patrones de respuesta por hora del día y día de la semana",
    whyItMatters: "Optimiza el timing exacto para enviar recordatorios y comunicaciones",
    howToRead: "Colores intensos = alta actividad | Colores claros = baja actividad",
    actionableInsight: "Programe recordatorios en los horarios de máxima actividad"
  },
  
  leadership: {
    id: 'leadership',
    title: "Huella de Liderazgo",
    icon: Users,
    whatItShows: "Análisis demográfico y patrones de liderazgo sin preguntar datos sensibles",
    whyItMatters: "Revela dinámicas organizacionales ocultas y estilos de liderazgo",
    howToRead: "Correlaciones entre participación y características demográficas inferidas",
    actionableInsight: "Ajuste el estilo de comunicación según los patrones detectados"
  },
  
  crossstudy: {
    id: 'crossstudy',
    title: "Comparador Histórico",
    icon: BarChart3,
    whatItShows: "Comparación con campañas anteriores similares de su organización",
    whyItMatters: "Aprende de experiencias pasadas y predice resultados probables",
    howToRead: "% similaridad indica probabilidad de replicar el resultado histórico",
    actionableInsight: "Aplique tácticas exitosas de campañas con alta similaridad"
  }
};

// ====================================================================
// CONFIGURACIÓN DE COMPONENTES
// ====================================================================

const WOW_COMPONENTS = [
  { id: 'rhythm', component: CampaignRhythmPanel },
  { id: 'topmovers', component: TopMoversPanel },
  { id: 'pulse', component: DepartmentPulsePanel },
  { id: 'anomalies', component: AnomalyDetectorPanel },
  { id: 'heatmap', component: EngagementHeatmapCard },
  { id: 'leadership', component: LeadershipFingerprintPanel },
  { id: 'crossstudy', component: CrossStudyComparatorCard }
];

// ====================================================================
// COMPONENTE PRINCIPAL - DISEÑO HORIZONTAL
// ====================================================================

interface DepartmentWowCarouselProps {
  monitorData: any;
  className?: string;
}

export function DepartmentWowCarousel({ 
  monitorData,
  className = ''
}: DepartmentWowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Validación de datos
  if (!monitorData) {
    return (
      <Card className="fhr-card p-6">
        <div className="text-center text-slate-400">
          Cargando análisis departamental...
        </div>
      </Card>
    );
  }

  const currentComponent = WOW_COMPONENTS[currentIndex];
  const CurrentWowComponent = currentComponent.component;
  const currentContext = WOW_CONTEXTS[currentComponent.id];

  // Navegación con prevención de doble-click
  const navigateNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % WOW_COMPONENTS.length);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const navigatePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => 
        prev === 0 ? WOW_COMPONENTS.length - 1 : prev - 1
      );
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  // Mapeo de props específicas
  const getComponentProps = () => {
    switch (currentComponent.id) {
      case 'rhythm':
        return {
          dailyResponses: monitorData.dailyResponses || [],
          participationRate: monitorData.participationRate || 0,
          participationPrediction: monitorData.participationPrediction,
          daysRemaining: monitorData.daysRemaining || 0,
          totalInvited: monitorData.totalInvited || 0
        };
      
      case 'topmovers':
        return {
          topMovers: monitorData.topMovers || [],
          lastRefresh: monitorData.lastRefresh
        };
      
      case 'pulse':
        return monitorData;
      
      case 'anomalies':
        return {
          departmentAnomalies: monitorData.departmentAnomalies || [],
          positiveAnomalies: monitorData.positiveAnomalies || [],
          negativeAnomalies: monitorData.negativeAnomalies || [],
          meanRate: monitorData.meanRate || 0,
          totalDepartments: monitorData.totalDepartments || 0,
          lastRefresh: monitorData.lastRefresh
        };
      
      case 'heatmap':
        return monitorData;
      
      case 'leadership':
        return {
          leadershipAnalysis: monitorData.leadershipAnalysis
        };
      
      case 'crossstudy':
        return {
          comparison: monitorData.crossStudyComparison,
          onApplyLearning: () => console.log('Apply learning')
        };
      
      default:
        return monitorData;
    }
  };

  return (
    <Card 
      className={`fhr-card ${className}`}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: '12px'
      }}
    >
      {/* ====== LAYOUT HORIZONTAL: CONTEXTO IZQUIERDA | COMPONENTE DERECHA ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
        
        {/* ====== PANEL IZQUIERDO: CONTEXTO EDUCATIVO (40%) ====== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header del contexto */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <currentContext.icon className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {currentContext.title}
              </h3>
              <p className="text-xs text-slate-400">
                Análisis {currentIndex + 1} de {WOW_COMPONENTS.length}
              </p>
            </div>
          </div>

          {/* Contenido educativo */}
          <div className="space-y-4">
            {/* ¿Qué muestra? */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-cyan-400">¿Qué muestra?</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {currentContext.whatItShows}
              </p>
            </div>

            {/* ¿Por qué importa? */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-start gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-purple-400">¿Por qué importa?</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {currentContext.whyItMatters}
              </p>
            </div>

            {/* ¿Cómo interpretarlo? */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-start gap-2 mb-2">
                <Eye className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-green-400">¿Cómo interpretarlo?</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-6">
                {currentContext.howToRead}
              </p>
            </div>

            {/* Acción recomendada */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-yellow-400">Acción recomendada</p>
              </div>
              <p className="text-sm text-white font-medium leading-relaxed pl-6">
                {currentContext.actionableInsight}
              </p>
            </div>
          </div>

          {/* Indicadores de posición para mobile */}
          <div className="flex lg:hidden justify-center gap-1 pt-4">
            {WOW_COMPONENTS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                disabled={isTransitioning}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-6 bg-gradient-to-r from-cyan-400 to-purple-400'
                    : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ====== PANEL DERECHO: COMPONENTE WOW (60%) ====== */}
        <div className="lg:col-span-3">
          <div className="h-full min-h-[450px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentComponent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <CurrentWowComponent {...getComponentProps()} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ====== NAVEGACIÓN INFERIOR (Full width) ====== */}
      <div className="border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Botón anterior */}
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrev}
            disabled={isTransitioning}
            className="border-slate-700 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {/* Dots indicadores (desktop only) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {WOW_COMPONENTS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => !isTransitioning && setCurrentIndex(idx)}
                disabled={isTransitioning}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-gradient-to-r from-cyan-400 to-purple-400'
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Ir a análisis ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botón siguiente */}
          <Button
            variant="outline"
            size="sm"
            onClick={navigateNext}
            disabled={isTransitioning}
            className="border-slate-700 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default DepartmentWowCarousel;