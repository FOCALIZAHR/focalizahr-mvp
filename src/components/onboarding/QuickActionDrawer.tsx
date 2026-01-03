// ============================================================================
// QUICK ACTION DRAWER - FocalizaHR Premium v2.0
// ============================================================================
// 
// FILOSOFÍA DE DISEÑO:
// ✓ Patrón C: "DRAWER ACTION" - CTA → Drawer con form/wizard
// ✓ Lista de personas con acciones claras
// ✓ Usa PremiumButton para todas las acciones
// ✓ Glassmorphism sutil, no agresivo
// ✓ Jerarquía clara: críticos primero
//
// COMPONENTES:
// - Lista de personas en riesgo
// - Filtros rápidos por etapa 4C
// - Acciones individuales y masivas
//
// ============================================================================

'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Users,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Filter,
  ChevronRight,
  ExternalLink,
  Clock,
  Target,
  Sparkles
} from 'lucide-react';
import { 
  PrimaryButton, 
  SecondaryButton, 
  GhostButton,
  ButtonGroup 
} from '@/components/ui/PremiumButton';

// ============================================================================
// TYPES
// ============================================================================

interface PersonAtRisk {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  currentStage: number; // 1, 7, 30, 90
  stageName: string;    // 'Compliance', 'Clarificación', etc.
  exoScore: number;
  alertType: string;
  daysInStage: number;
  hireDate: string;
}

interface QuickActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  people: PersonAtRisk[];
  departmentName: string;
  onContactPerson?: (person: PersonAtRisk, method: 'email' | 'phone') => void;
  onViewDetail?: (person: PersonAtRisk) => void;
  onScheduleMeeting?: (person: PersonAtRisk) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const STAGE_LABELS: Record<number, string> = {
  1: 'Compliance',
  7: 'Clarificación',
  30: 'Culture',
  90: 'Connection'
};

const STAGE_COLORS: Record<number, string> = {
  1: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  7: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  30: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  90: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Filtro de etapas 4C
 */
interface StageFilterProps {
  activeStage: number | null;
  onStageChange: (stage: number | null) => void;
  stageCounts: Record<number, number>;
}

const StageFilter = memo(function StageFilter({
  activeStage,
  onStageChange,
  stageCounts
}: StageFilterProps) {
  const stages = [1, 7, 30, 90];
  
  return (
    <div className="flex flex-wrap gap-2">
      {/* Todos */}
      <button
        onClick={() => onStageChange(null)}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200
          ${activeStage === null
            ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
            : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
          }
        `}
      >
        Todos
      </button>
      
      {/* Etapas 4C */}
      {stages.map(stage => (
        <button
          key={stage}
          onClick={() => onStageChange(stage)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200 flex items-center gap-1.5
            ${activeStage === stage
              ? STAGE_COLORS[stage]
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
            }
            border
          `}
        >
          <span>Día {stage}</span>
          {stageCounts[stage] > 0 && (
            <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px]">
              {stageCounts[stage]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

/**
 * Card de persona individual
 */
interface PersonCardProps {
  person: PersonAtRisk;
  onContact?: (method: 'email' | 'phone') => void;
  onViewDetail?: () => void;
  onScheduleMeeting?: () => void;
}

const PersonCard = memo(function PersonCard({
  person,
  onContact,
  onViewDetail,
  onScheduleMeeting
}: PersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stageColor = STAGE_COLORS[person.currentStage] || STAGE_COLORS[1];
  const scoreColor = getScoreColor(person.exoScore);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        bg-slate-800/40 border border-slate-700/50 rounded-xl
        overflow-hidden transition-all duration-300
        hover:border-slate-600/50
      `}
    >
      {/* Header clickeable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300">
              {person.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          
          <div>
            <p className="text-sm font-medium text-white">
              {person.fullName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`
                text-xs px-2 py-0.5 rounded border ${stageColor}
              `}>
                Día {person.currentStage}
              </span>
              <span className={`text-xs ${scoreColor}`}>
                EXO {person.exoScore}
              </span>
            </div>
          </div>
        </div>
        
        <ChevronRight 
          className={`
            w-4 h-4 text-slate-500 transition-transform duration-200
            ${isExpanded ? 'rotate-90' : ''}
          `} 
          strokeWidth={1.5}
        />
      </button>
      
      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Info adicional */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{person.alertType}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{person.daysInStage} días en etapa</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Ingreso: {formatDate(person.hireDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Target className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{person.department}</span>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                {person.email && (
                  <GhostButton
                    size="sm"
                    icon={Mail}
                    onClick={() => onContact?.('email')}
                  >
                    Email
                  </GhostButton>
                )}
                {person.phone && (
                  <GhostButton
                    size="sm"
                    icon={Phone}
                    onClick={() => onContact?.('phone')}
                  >
                    Llamar
                  </GhostButton>
                )}
                <GhostButton
                  size="sm"
                  icon={Calendar}
                  onClick={onScheduleMeeting}
                >
                  Agendar
                </GhostButton>
                <SecondaryButton
                  size="sm"
                  icon={ExternalLink}
                  onClick={onViewDetail}
                >
                  Ver detalle
                </SecondaryButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default memo(function QuickActionDrawer({
  isOpen,
  onClose,
  people,
  departmentName,
  onContactPerson,
  onViewDetail,
  onScheduleMeeting
}: QuickActionDrawerProps) {
  
  const [activeStageFilter, setActiveStageFilter] = useState<number | null>(null);
  
  // Calcular conteos por etapa
  const stageCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 7: 0, 30: 0, 90: 0 };
    people.forEach(p => {
      if (counts[p.currentStage] !== undefined) {
        counts[p.currentStage]++;
      }
    });
    return counts;
  }, [people]);
  
  // Filtrar personas
  const filteredPeople = useMemo(() => {
    if (activeStageFilter === null) return people;
    return people.filter(p => p.currentStage === activeStageFilter);
  }, [people, activeStageFilter]);
  
  // Ordenar por score (menor primero = más crítico)
  const sortedPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => a.exoScore - b.exoScore);
  }, [filteredPeople]);

  // Handlers
  const handleContact = useCallback((person: PersonAtRisk, method: 'email' | 'phone') => {
    onContactPerson?.(person, method);
  }, [onContactPerson]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="
              fixed right-0 top-0 bottom-0 
              w-full max-w-lg
              bg-slate-900 border-l border-slate-800
              z-50 flex flex-col
            "
          >
            {/* ─── Header ─── */}
            <div className="
              flex items-center justify-between 
              p-6 border-b border-slate-800
            ">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-400/10">
                  <Users className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-light text-white">
                    Personas que requieren atención
                  </h2>
                  <p className="text-sm text-slate-500">
                    {departmentName} · {people.length} persona{people.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <GhostButton
                size="sm"
                icon={X}
                onClick={onClose}
              >
                Cerrar
              </GhostButton>
            </div>
            
            {/* ─── Filtros ─── */}
            <div className="p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Filtrar por etapa
                </span>
              </div>
              <StageFilter
                activeStage={activeStageFilter}
                onStageChange={setActiveStageFilter}
                stageCounts={stageCounts}
              />
            </div>
            
            {/* ─── Lista de personas ─── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedPeople.length > 0 ? (
                sortedPeople.map(person => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onContact={(method) => handleContact(person, method)}
                    onViewDetail={() => onViewDetail?.(person)}
                    onScheduleMeeting={() => onScheduleMeeting?.(person)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-slate-500">
                    {activeStageFilter 
                      ? `No hay personas en Día ${activeStageFilter}`
                      : 'No hay personas que requieran atención'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* ─── Footer con acciones masivas ─── */}
            {sortedPeople.length > 0 && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
                <ButtonGroup orientation="horizontal" spacing={12} fullWidth>
                  <SecondaryButton
                    icon={Mail}
                    onClick={() => {
                      // Acción masiva: enviar emails
                      console.log('Enviar emails a', sortedPeople.length, 'personas');
                    }}
                  >
                    Contactar todos
                  </SecondaryButton>
                  <PrimaryButton
                    icon={Calendar}
                    onClick={() => {
                      // Acción masiva: programar seguimiento
                      console.log('Programar seguimiento para', sortedPeople.length, 'personas');
                    }}
                    glow
                  >
                    Programar seguimiento
                  </PrimaryButton>
                </ButtonGroup>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});