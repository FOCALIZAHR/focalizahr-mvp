// src/components/onboarding/DepartmentCard.tsx
// COMPONENTE: Card de Departamento (Nivel 2)
// Agrupa personas de un departamento con expand/collapse
// ✅ v4.1 FILOSOFÍA FOCALIZAHR: Neutro, Mobile-first, Apple/Tesla

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, ChevronDown, ChevronUp, Users } from 'lucide-react';
import PersonCard from './PersonCard';

interface DepartmentCardProps {
  department: {
    departmentId: string;
    departmentName: string;
    people: any[];
    totalRisk: number;
    pendingRisk: number;
    managedRisk: number;
    activeCount: number;
    managedCount: number;
  };
  index: number;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
  onManagedAlertClick?: (alert: any) => void;
}

export default function DepartmentCard({ 
  department, 
  index,
  onAcknowledgeAlert,
  onManagedAlertClick
}: DepartmentCardProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };
  
  const totalPeople = department.people.length;
  const totalAlerts = department.activeCount + department.managedCount;
  
  // Contadores de severidad
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  department.people.forEach(person => {
    person.alerts.forEach((alert: any) => {
      severityCounts[alert.severity as keyof typeof severityCounts]++;
    });
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="space-y-2"
    >
      {/* Header Departamento - MOBILE FIRST */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          group relative overflow-hidden
          bg-slate-800/20 hover:bg-slate-800/40
          border border-slate-700/20 hover:border-slate-600/30
          rounded-xl transition-all duration-300 cursor-pointer
          p-3 md:p-4
        "
      >
        {/* Layout: stack en mobile, row en desktop */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Izquierda: Icono + Info */}
          <div className="flex items-center gap-3">
            {/* Icono Folder - NEUTRO */}
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-700/30 border border-slate-600/20 flex items-center justify-center flex-shrink-0">
              <Folder className="h-4 w-4 md:h-5 md:w-5 text-slate-400" strokeWidth={1.5} />
            </div>
            
            {/* Nombre y stats */}
            <div className="min-w-0 flex-1">
              <h5 className="text-sm md:text-base font-medium text-white group-hover:text-slate-200 transition-colors truncate">
                {department.departmentName}
              </h5>
              
              {/* Stats en línea - wrap en mobile */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] md:text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalPeople} {totalPeople === 1 ? 'persona' : 'personas'}
                </span>
                <span className="text-slate-700">•</span>
                <span>{totalAlerts} {totalAlerts === 1 ? 'alerta' : 'alertas'}</span>
                {severityCounts.critical > 0 && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-red-400/80">
                      {severityCounts.critical} {severityCounts.critical === 1 ? 'crítica' : 'críticas'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Derecha: Riesgo + Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 pt-2 md:pt-0 border-t border-slate-700/20 md:border-0">
            {/* Riesgo */}
            <div className="text-left md:text-right">
              <div className="text-base md:text-lg font-medium text-white">
                {formatCurrency(department.totalRisk)}
              </div>
              <div className="text-[9px] md:text-[10px] text-slate-600 uppercase tracking-wide">
                Riesgo
              </div>
            </div>
            
            {/* Toggle Icon - NEUTRO */}
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-300
                ${isExpanded 
                  ? 'bg-slate-700/50 text-white border border-slate-600/40' 
                  : 'bg-slate-800/30 text-slate-500 border border-slate-700/20'
                }
              `}
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Lista de Personas (colapsable) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 pl-3 md:pl-6"
          >
            {department.people.map((person, personIndex) => (
              <PersonCard
                key={person.journeyId}
                person={person}
                index={personIndex}
                onAcknowledgeAlert={onAcknowledgeAlert}
                onManagedAlertClick={onManagedAlertClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}