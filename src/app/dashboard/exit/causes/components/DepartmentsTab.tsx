// ====================================================================
// TAB 2: DEPARTAMENTOS - MAPA DEL DOLOR
// src/app/dashboard/exit/causes/components/DepartmentsTab.tsx
// ====================================================================
//
// PREGUNTA: "¿Dónde están los focos?"
// DISEÑO: Borde cyan, sin colores semánticos agresivos
//
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Building2, Lightbulb } from 'lucide-react';
import type { PainMapNode } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface DepartmentsTabProps {
  data: PainMapNode[];
  onDepartmentClick?: (departmentId: string) => void;
}

// ====================================================================
// DEPARTMENT CARD COMPONENT
// ====================================================================
function DepartmentCard({
  node,
  isFocus,
  onClick
}: {
  node: PainMapNode;
  isFocus: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-l-4 border border-slate-700/30
        text-left transition-all hover:bg-slate-700/20
        ${isFocus
          ? 'border-l-cyan-500 bg-cyan-500/5'
          : 'border-l-slate-600 bg-slate-800/30'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white font-medium block mb-1">
            {node.departmentName}
          </span>
          <p className="text-xs text-slate-400">
            {node.exitCount} salida{node.exitCount !== 1 ? 's' : ''} · {node.gerenciaName || 'Sin Gerencia'}
          </p>
        </div>
        <span className={`text-xl font-light ${isFocus ? 'text-cyan-400' : 'text-slate-400'}`}>
          {node.avgSeverity.toFixed(1)}
        </span>
      </div>
    </button>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function DepartmentsTab({ data, onDepartmentClick }: DepartmentsTabProps) {
  const [showAll, setShowAll] = useState(false);

  // Separar focos de atención del resto
  const { focusDepts, otherDepts, insight } = useMemo(() => {
    const focus = data
      .filter(d => d.avgSeverity >= 4.0)
      .sort((a, b) => b.avgSeverity - a.avgSeverity);

    const others = data
      .filter(d => d.avgSeverity < 4.0)
      .sort((a, b) => b.avgSeverity - a.avgSeverity);

    // Generar insight
    let insightText = '';
    if (focus.length > 0) {
      insightText = `${focus.length} departamento${focus.length > 1 ? 's son focos' : ' es foco'} tóxico${focus.length > 1 ? 's' : ''} (severidad ≥4.0). No es un problema generalizado.`;
    } else if (data.length > 0) {
      const maxSeverity = Math.max(...data.map(d => d.avgSeverity));
      insightText = `No hay focos tóxicos críticos. La severidad máxima es ${maxSeverity.toFixed(1)}. La rotación está distribuida de forma más uniforme.`;
    } else {
      insightText = 'No hay datos de departamentos disponibles para analizar.';
    }

    return { focusDepts: focus, otherDepts: others, insight: insightText };
  }, [data]);

  // Si no hay datos
  if (data.length === 0) {
    return (
      <div className="fhr-card p-6">
        <p className="text-slate-400 text-sm text-center">
          No hay datos de departamentos disponibles
        </p>
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

      {/* Insight */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* Focos de Atención */}
      {focusDepts.length > 0 && (
        <div className="px-6 pb-6">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
            Focos de Atención
          </h4>
          <div className="space-y-3">
            {focusDepts.map(node => (
              <DepartmentCard
                key={node.departmentId}
                node={node}
                isFocus={true}
                onClick={() => onDepartmentClick?.(node.departmentId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Otros Departamentos (colapsable) */}
      {otherDepts.length > 0 && (
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4"
          >
            {showAll ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <Building2 className="w-4 h-4" />
            Ver todos los departamentos ({otherDepts.length})
          </button>

          {showAll && (
            <div className="space-y-3">
              {otherDepts.map(node => (
                <DepartmentCard
                  key={node.departmentId}
                  node={node}
                  isFocus={false}
                  onClick={() => onDepartmentClick?.(node.departmentId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
