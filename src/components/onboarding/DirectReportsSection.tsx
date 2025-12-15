// src/components/onboarding/DirectReportsSection.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, ChevronDown, ChevronUp } from 'lucide-react';
import PersonCard from './PersonCard';

interface DirectReportsSectionProps {
  people: any[];
  gerenciaName: string;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
}

export default function DirectReportsSection({ 
  people, 
  gerenciaName,
  onAcknowledgeAlert 
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
      className="mb-4"
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-cyan-500/10 hover:from-cyan-500/15 hover:via-purple-500/10 hover:to-cyan-500/15 border border-cyan-500/20 hover:border-cyan-400/30 rounded-xl transition-all duration-300 cursor-pointer backdrop-blur-sm p-4"
        style={{
          boxShadow: '0 4px 20px rgba(34, 211, 238, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserCog className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  Personas Directas
                </h5>
                <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded">
                  {people.length} {people.length === 1 ? 'persona' : 'personas'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>
                  {totalAlerts} {totalAlerts === 1 ? 'alerta' : 'alertas'}
                </span>
                {activeCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">
                      {activeCount} {activeCount === 1 ? 'activa' : 'activas'}
                    </span>
                  </>
                )}
                {managedCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">
                      {managedCount} {managedCount === 1 ? 'gestionada' : 'gestionadas'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {formatCurrency(totalRisk)}
              </div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wide">
                Riesgo
              </div>
            </div>
            
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-700/20 text-slate-500 border border-slate-600/20'}`}>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 mt-2 pl-3"
          >
            {people.map((person, index) => (
              <PersonCard
                key={person.journeyId}
                person={person}
                index={index}
                onAcknowledgeAlert={onAcknowledgeAlert}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {isExpanded && (
        <div className="mt-4 border-t border-slate-700/30" />
      )}
    </motion.div>
  );
} 