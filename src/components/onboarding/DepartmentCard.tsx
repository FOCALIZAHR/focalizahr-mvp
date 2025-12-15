// src/components/onboarding/DepartmentCard.tsx
// COMPONENTE: Card de Departamento (Nivel 2)
// Agrupa personas de un departamento con expand/collapse

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
}

export default function DepartmentCard({ 
  department, 
  index,
  onAcknowledgeAlert 
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
      {/* Header Departamento */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          group relative overflow-hidden
          bg-slate-800/30 hover:bg-slate-800/50
          border border-slate-700/30 hover:border-slate-600/50
          rounded-xl transition-all duration-300 cursor-pointer
          p-4
        "
      >
        <div className="flex items-center justify-between">
          {/* Izquierda: Icono + Info */}
          <div className="flex items-center gap-3">
            {/* Icono Folder */}
            <div className="w-10 h-10 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-center">
              <Folder className="h-5 w-5 text-purple-400" />
            </div>
            
            {/* Nombre y stats */}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h5 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {department.departmentName}
                </h5>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalPeople} {totalPeople === 1 ? 'persona' : 'personas'}
                </span>
                <span>•</span>
                <span>{totalAlerts} {totalAlerts === 1 ? 'alerta' : 'alertas'}</span>
                {severityCounts.critical > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-400">
                      🚨 {severityCounts.critical} {severityCounts.critical === 1 ? 'crítica' : 'críticas'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Derecha: Riesgo + Toggle */}
          <div className="flex items-center gap-4">
            {/* Riesgo */}
            <div className="text-right">
              <div className="text-lg font-semibold text-white">
                {formatCurrency(department.totalRisk)}
              </div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wide">
                Riesgo
              </div>
            </div>
            
            {/* Toggle Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isExpanded 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
              }
            `}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
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
            className="space-y-2 pl-6"
          >
            {department.people.map((person, personIndex) => (
              <PersonCard
                key={person.journeyId}
                person={person}
                index={personIndex}
                onAcknowledgeAlert={onAcknowledgeAlert}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}