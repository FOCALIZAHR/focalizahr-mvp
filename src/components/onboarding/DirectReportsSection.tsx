// src/components/onboarding/DirectReportsSection.tsx
// ✅ v4.1 FILOSOFÍA FOCALIZAHR: Neutro, Mobile-first, Apple/Tesla

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, ChevronDown } from 'lucide-react';
import PersonCard from './PersonCard';

interface DirectReportsSectionProps {
 people: any[];
  gerenciaName: string;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
  onManagedAlertClick?: (alert: any) => void;
}

export default function DirectReportsSection({ 
  people,
  gerenciaName,
  onAcknowledgeAlert,
  onManagedAlertClick
}: DirectReportsSectionProps) {
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (people.length === 0) return null;
  
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };
  
  const totalRisk = people.reduce((sum, p) => sum + p.risk, 0);
  const activeCount = people.reduce((sum, p) => sum + p.activeCount, 0);
  const managedCount = people.reduce((sum, p) => sum + p.managedCount, 0);
  const totalAlerts = activeCount + managedCount;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-3 md:mb-4"
    >
      {/* Header - NEUTRO, MOBILE FIRST */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          group relative overflow-hidden
          bg-slate-800/25 hover:bg-slate-800/40
          border border-slate-700/20 hover:border-slate-600/30
          rounded-xl transition-all duration-300 cursor-pointer
          p-3 md:p-4
        "
      >
        {/* Layout: stack en mobile, row en desktop */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Izquierda: Icono + Info */}
          <div className="flex items-center gap-3">
            {/* Icono - NEUTRO */}
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-slate-700/30 border border-slate-600/20 flex items-center justify-center flex-shrink-0">
              <UserCog className="h-4 w-4 md:h-5 md:w-5 text-slate-400" strokeWidth={1.5} />
            </div>
            
            <div className="min-w-0 flex-1">
              {/* Título + Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h5 className="text-sm md:text-base font-medium text-white group-hover:text-slate-200 transition-colors">
                  Personas Directas
                </h5>
                <span className="px-2 py-0.5 text-[10px] md:text-xs font-medium bg-slate-700/40 border border-slate-600/20 text-slate-300 rounded">
                  {people.length} {people.length === 1 ? 'persona' : 'personas'}
                </span>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] md:text-xs text-slate-500">
                <span>
                  {totalAlerts} {totalAlerts === 1 ? 'alerta' : 'alertas'}
                </span>
                {activeCount > 0 && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-amber-400/80">
                      {activeCount} {activeCount === 1 ? 'activa' : 'activas'}
                    </span>
                  </>
                )}
                {managedCount > 0 && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-green-400/80">
                      {managedCount} {managedCount === 1 ? 'gestionada' : 'gestionadas'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Derecha: Riesgo + Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 pt-2 md:pt-0 border-t border-slate-700/20 md:border-0">
            {/* Riesgo - SIN GRADIENTE */}
            <div className="text-left md:text-right">
              <div className="text-base md:text-lg font-medium text-white">
                {formatCurrency(totalRisk)}
              </div>
              <div className="text-[9px] md:text-[10px] text-slate-600 uppercase tracking-wide">
                Riesgo
              </div>
            </div>
            
            {/* Toggle - NEUTRO */}
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`
                w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center
                transition-all duration-300
                ${isExpanded 
                  ? 'bg-slate-700/50 text-white border border-slate-600/30' 
                  : 'bg-slate-800/30 text-slate-500 border border-slate-700/20'
                }
              `}
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Lista de Personas */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 mt-2 pl-2 md:pl-3"
          >
            {people.map((person, index) => (
              <PersonCard
                key={person.journeyId}
                person={person}
                index={index}
                onAcknowledgeAlert={onAcknowledgeAlert}
                onManagedAlertClick={onManagedAlertClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Separador */}
      {isExpanded && (
        <div className="mt-3 md:mt-4 border-t border-slate-700/20" />
      )}
    </motion.div>
  );
}