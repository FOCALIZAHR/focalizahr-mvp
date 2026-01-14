// ====================================================================
// KPI STRIP - STRIP DE 5 MÉTRICAS CLAVE CLICKEABLES
// src/app/dashboard/exit/causes/components/KPIStrip.tsx
// ====================================================================
//
// PRINCIPIO: "Decidir en 10 segundos"
// 5 KPIs clickeables que navegan a los tabs
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import type {
  TruthDataPoint,
  PainMapNode,
  TalentDrainData,
  PredictabilityData,
  ROIData
} from '@/hooks/useExitCauses';

// ====================================================================
// TYPES
// ====================================================================
type TabValue = 'factors' | 'departments' | 'talent' | 'prediction' | 'roi';

// ====================================================================
// PROPS
// ====================================================================
interface KPIStripProps {
  truth: TruthDataPoint[];
  painmap: PainMapNode[];
  drain: TalentDrainData[];
  predictability: PredictabilityData | null;
  roi: ROIData | null;
  activeTab?: TabValue;
  onTabChange?: (tab: TabValue) => void;
}

// ====================================================================
// HELPERS
// ====================================================================
function formatCLP(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  return `$${Math.round(amount / 1000).toFixed(0)}K`;
}

// ====================================================================
// KPI CARD COMPONENT
// ====================================================================
function KPICard({
  value,
  label,
  sublabel,
  icon: Icon,
  targetTab,
  isActive,
  onClick
}: {
  value: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  targetTab: TabValue;
  isActive?: boolean;
  onClick?: (tab: TabValue) => void;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(targetTab);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fhr-card text-left p-4 w-full
        cursor-pointer transition-all duration-200
        hover:border-cyan-500/50
        ${isActive ? 'border-cyan-500' : ''}
      `}
    >
      {/* Icon Row */}
      <div className="flex justify-between items-center">
        <Icon className="w-4 h-4 text-slate-500" />
        <ArrowRight className="w-4 h-4 text-slate-600" />
      </div>

      {/* Value */}
      <p className="text-2xl font-light text-cyan-400 mt-2">{value}</p>

      {/* Label */}
      <p className="text-sm text-slate-500">
        {label}
        {sublabel && <span> {sublabel}</span>}
      </p>
    </button>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function KPIStrip({
  truth,
  painmap,
  drain,
  predictability,
  roi,
  activeTab,
  onTabChange
}: KPIStripProps) {
  // Calcular KPIs
  const kpis = useMemo(() => {
    // 1. Severidad promedio
    const avgSeverity = truth.length > 0
      ? (truth.reduce((sum, t) => sum + t.avgSeverity, 0) / truth.length).toFixed(1)
      : '0.0';

    // 2. Focos tóxicos
    const toxicCount = painmap.filter(d => d.avgSeverity >= 4.0).length;

    // 3. Talento clave perdido
    const keyTalent = drain.find(d => d.classification === 'key_talent');
    const keyTalentPercent = keyTalent?.percentage || 0;

    // 4. Predictibilidad
    const predictRate = predictability?.predictabilityRate || 0;

    // 5. Costo de inacción
    const cost = roi?.estimatedCostCLP || 0;

    return [
      {
        value: avgSeverity,
        label: 'Severidad',
        sublabel: 'promedio',
        icon: TrendingUp,
        targetTab: 'factors' as TabValue
      },
      {
        value: toxicCount.toString(),
        label: 'Focos',
        sublabel: 'tóxicos',
        icon: AlertTriangle,
        targetTab: 'departments' as TabValue
      },
      {
        value: `${keyTalentPercent}%`,
        label: 'Talento',
        sublabel: 'clave',
        icon: Users,
        targetTab: 'talent' as TabValue
      },
      {
        value: `${predictRate}%`,
        label: 'Predecible',
        sublabel: '',
        icon: Target,
        targetTab: 'prediction' as TabValue
      },
      {
        value: formatCLP(cost),
        label: 'Costo',
        sublabel: 'inacción',
        icon: DollarSign,
        targetTab: 'roi' as TabValue
      }
    ];
  }, [truth, painmap, drain, predictability, roi]);

  return (
    <div className="space-y-3 mt-8">
      {/* Label */}
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">
        Profundiza en:
      </p>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            value={kpi.value}
            label={kpi.label}
            sublabel={kpi.sublabel}
            icon={kpi.icon}
            targetTab={kpi.targetTab}
            isActive={activeTab === kpi.targetTab}
            onClick={onTabChange}
          />
        ))}
      </div>
    </div>
  );
}
