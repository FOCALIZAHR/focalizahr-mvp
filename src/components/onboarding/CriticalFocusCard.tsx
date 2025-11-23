// src/components/onboarding/CriticalFocusCard.tsx
'use client';

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search,      // Clarification
  Users,       // Culture
  Link2,       // Connection
  CheckCircle  // Compliance
} from 'lucide-react';

interface Driver {
  dimension: 'compliance' | 'clarification' | 'culture' | 'connection';
  score: number;
  label: string;
  icon: typeof Search;
  insight: string;
}

interface CriticalFocusCardProps {
  avgComplianceScore: number | null;
  avgClarificationScore: number | null;
  avgCultureScore: number | null;
  avgConnectionScore: number | null;
  onTabChange: (tab: 'diagnostic') => void;
}

function getCriticalDriver(
  compliance: number | null,
  clarification: number | null,
  culture: number | null,
  connection: number | null
): Driver | null {
  
  const drivers: Driver[] = [];
  
  // ⚠️ Backend envía scores en escala 0-5, convertir a 0-100
  if (compliance !== null && compliance !== undefined) {
    drivers.push({
      dimension: 'compliance',
      score: Math.round((compliance / 5) * 100),
      label: 'Compliance',
      icon: CheckCircle,
      insight: 'Se detectan brechas en la primera semana'
    });
  }
  
  if (clarification !== null && clarification !== undefined) {
    drivers.push({
      dimension: 'clarification',
      score: Math.round((clarification / 5) * 100),
      label: 'Claridad de Rol',
      icon: Search,
      insight: 'Confusión sobre expectativas y responsabilidades'
    });
  }
  
  if (culture !== null && culture !== undefined) {
    drivers.push({
      dimension: 'culture',
      score: Math.round((culture / 5) * 100),
      label: 'Adaptación Cultural',
      icon: Users,
      insight: 'Desajuste cultural detectado en el primer mes'
    });
  }
  
  if (connection !== null && connection !== undefined) {
    drivers.push({
      dimension: 'connection',
      score: Math.round((connection / 5) * 100),
      label: 'Sentido de Pertenencia',
      icon: Link2,
      insight: 'Falta de conexión con equipo y organización'
    });
  }
  
  if (drivers.length === 0) return null;
  
  const sorted = drivers.sort((a, b) => a.score - b.score);
  return sorted[0];
}

function getScoreColor(score: number): string {
  if (score < 60) return 'text-red-500';
  if (score < 75) return 'text-amber-500';
  return 'text-green-500';
}

function getProgressColor(score: number): string {
  if (score < 60) return 'bg-red-500';
  if (score < 75) return 'bg-amber-500';
  return 'bg-green-500';
}

function getBadgeVariant(score: number): 'destructive' | 'default' {
  return score < 60 ? 'destructive' : 'default';
}

const CriticalFocusCard = memo(function CriticalFocusCard({
  avgComplianceScore,
  avgClarificationScore,
  avgCultureScore,
  avgConnectionScore,
  onTabChange
}: CriticalFocusCardProps) {
  
  const criticalDriver = useMemo(() => {
    return getCriticalDriver(
      avgComplianceScore,
      avgClarificationScore,
      avgCultureScore,
      avgConnectionScore
    );
  }, [avgComplianceScore, avgClarificationScore, avgCultureScore, avgConnectionScore]);
  
  if (!criticalDriver) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
        <p className="text-sm text-slate-500 text-center">
          Sin datos suficientes para análisis
        </p>
      </div>
    );
  }
  
  const IconComponent = criticalDriver.icon;
  const scoreColor = getScoreColor(criticalDriver.score);
  const progressColor = getProgressColor(criticalDriver.score);
  const badgeVariant = getBadgeVariant(criticalDriver.score);
  
  return (
    <Card className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden hover:border-slate-700/50 transition-all duration-300">
      
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">
            Foco Crítico
          </p>
        </div>
        
        <Badge 
          variant={badgeVariant}
          className="text-[10px] font-medium px-2 py-0.5"
        >
          {criticalDriver.score < 60 ? 'CRÍTICO' : 'ATENCIÓN'}
        </Badge>
      </div>
      
      <div className="px-4 pb-4 space-y-3">
        
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${scoreColor} tabular-nums`}>
            {criticalDriver.score}
          </span>
          <span className="text-sm text-slate-500 font-light">
            / 100
          </span>
        </div>
        
        <p className="text-sm font-medium text-white">
          {criticalDriver.label}
        </p>
        
        <div className="space-y-1.5">
          <Progress 
            value={criticalDriver.score} 
            className="h-2 bg-slate-800/50"
            indicatorClassName={progressColor}
          />
        </div>
        
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          {criticalDriver.insight}
        </p>
        
        <button
          onClick={() => onTabChange('diagnostic')}
          className="w-full mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-cyan-500/5 transition-all duration-200"
        >
          Ver Diagnóstico
          <span className="text-xs">→</span>
        </button>
      </div>
      
    </Card>
  );
});

CriticalFocusCard.displayName = 'CriticalFocusCard';

export default CriticalFocusCard;