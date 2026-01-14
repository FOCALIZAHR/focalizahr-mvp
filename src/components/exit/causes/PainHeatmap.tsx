// ====================================================================
// ACTO 2: EL MAPA DEL DOLOR
// src/components/exit/causes/PainHeatmap.tsx
// v2.0 - Refactorizado según FILOSOFIA_DISENO_FOCALIZAHR
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"
//
// ESTRUCTURA:
// 1. Insight protagonista
// 2. Focos tóxicos (severidad >= 4.0) VISIBLES
// 3. Resto colapsable
//
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, AlertTriangle, Building2 } from 'lucide-react';
import type { PainMapNode } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface PainHeatmapProps {
  data: PainMapNode[];
  onDepartmentClick?: (departmentId: string) => void;
}

// ====================================================================
// DEPARTMENT CARD COMPONENT
// ====================================================================
function DepartmentCard({
  node,
  onClick
}: {
  node: PainMapNode;
  onClick?: () => void;
}) {
  const isToxic = node.avgSeverity >= 4.0;
  const isWarning = node.avgSeverity >= 3.0 && node.avgSeverity < 4.0;

  const borderColor = isToxic
    ? 'border-l-red-500'
    : isWarning
    ? 'border-l-yellow-500'
    : 'border-l-green-500';

  const bgColor = isToxic
    ? 'bg-red-500/10'
    : isWarning
    ? 'bg-yellow-500/5'
    : 'bg-green-500/5';

  const severityColor = isToxic
    ? 'text-red-400'
    : isWarning
    ? 'text-yellow-400'
    : 'text-green-400';

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-l-4 border border-slate-700/30
        ${borderColor} ${bgColor}
        text-left transition-all hover:scale-[1.01]
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isToxic && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span className="text-sm text-white font-medium">
              {node.departmentName}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {node.exitCount} salida{node.exitCount !== 1 ? 's' : ''} · {node.gerenciaName || 'Sin Gerencia'}
          </p>
        </div>
        <span className={`text-xl font-bold ${severityColor}`}>
          {node.avgSeverity.toFixed(1)}
        </span>
      </div>
    </button>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function PainHeatmap({ data, onDepartmentClick }: PainHeatmapProps) {
  const [showOthers, setShowOthers] = useState(false);

  // Separar focos tóxicos del resto
  const { toxicFocuses, others, insight } = useMemo(() => {
    const toxic = data
      .filter(d => d.avgSeverity >= 4.0)
      .sort((a, b) => b.avgSeverity - a.avgSeverity);

    const rest = data
      .filter(d => d.avgSeverity < 4.0)
      .sort((a, b) => b.avgSeverity - a.avgSeverity);

    // Generar insight dinámico
    let insightText = '';
    if (toxic.length > 0) {
      insightText = `${toxic.length} departamento${toxic.length > 1 ? 's' : ''} ${toxic.length > 1 ? 'son' : 'es'} foco${toxic.length > 1 ? 's' : ''} tóxico${toxic.length > 1 ? 's' : ''} (severidad ≥4.0). No es un problema generalizado, requiere${toxic.length > 1 ? 'n' : ''} intervención específica.`;
    } else if (data.length > 0) {
      const maxSeverity = Math.max(...data.map(d => d.avgSeverity));
      insightText = `No hay focos tóxicos críticos. La severidad máxima es ${maxSeverity.toFixed(1)}. La rotación está distribuida de forma más uniforme.`;
    } else {
      insightText = 'No hay datos de departamentos disponibles para analizar.';
    }

    return {
      toxicFocuses: toxic,
      others: rest,
      insight: insightText
    };
  }, [data]);

  // Si no hay datos
  if (data.length === 0) {
    return (
      <div className="fhr-card p-6">
        <h3 className="text-lg font-light text-white mb-4">Mapa del Dolor</h3>
        <p className="text-slate-400 text-sm">No hay datos de departamentos disponibles</p>
      </div>
    );
  }

  return (
    <div className="fhr-card relative overflow-hidden">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="p-6 pb-4">
        <h3 className="text-lg font-light text-white mb-1">
          Mapa del Dolor
        </h3>
        <p className="text-sm text-slate-400">
          ¿Se quema toda la empresa o son focos aislados?
        </p>
      </div>

      {/* INSIGHT PROTAGONISTA */}
      <div className="px-6 pb-6">
        <div className="p-5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-lg font-medium text-slate-200 leading-relaxed">
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* FOCOS TÓXICOS */}
      {toxicFocuses.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide">
              Focos Tóxicos (Severidad ≥ 4.0)
            </h4>
          </div>
          <div className="space-y-3">
            {toxicFocuses.map(node => (
              <DepartmentCard
                key={node.departmentId}
                node={node}
                onClick={() => onDepartmentClick?.(node.departmentId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* OTROS DEPARTAMENTOS (COLAPSABLE) */}
      {others.length > 0 && (
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="
              flex items-center gap-2 text-sm text-slate-400
              hover:text-slate-200 transition-colors mb-4
            "
          >
            {showOthers ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <Building2 className="w-4 h-4" />
            Ver todos los departamentos ({others.length})
          </button>

          {showOthers && (
            <div className="space-y-3">
              {others.map(node => (
                <DepartmentCard
                  key={node.departmentId}
                  node={node}
                  onClick={() => onDepartmentClick?.(node.departmentId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEYENDA */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Tóxico (≥4.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>Atención (3.0-3.9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Sano (&lt;3.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
