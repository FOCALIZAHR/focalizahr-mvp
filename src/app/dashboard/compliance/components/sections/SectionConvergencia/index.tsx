'use client';

// SectionConvergencia (C3 "Las Señales") — orquestador rebuild v2.
// Plan: PLAN_UI_C3_SECCION_CONVERGENCIA_v2.md.
//
// Una sola vista: header editorial (state machine 5 estados) + lista de bandas
// con acordeón inline. Cero state machine de 3 vistas (eso era el rebuild
// anterior — reemplazado).
//
// El payload del report ya trae todo lo necesario:
//   - report.data.convergencia.departments[i] (Motor A/B/nivelFinal)
//   - report.data.departments[i] (isaScore, dimensionScores, deltaVsAnterior)
//   - report.data.alerts (filtradas por departmentId)
// Helper mergeDepartmentData cruza los 3 arrays en MergedDept.

import { useMemo, useState } from 'react';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import ConvergenciaOrgHeader from './ConvergenciaOrgHeader';
import BandaDepartamento from './BandaDepartamento';
import ConvergenciaEmptyState from './ConvergenciaEmptyState';
import {
  mergeDepartmentData,
  classifyHeaderState,
  byUrgencia,
  getEmptyStateVariant,
  type MergedDept,
} from './_shared/helpers';

interface Props {
  hook: UseComplianceDataReturn;
}

export default function SectionConvergencia({ hook }: Props) {
  const report = hook.report;
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  // Cruza los 3 arrays + filtra deptos con convergencia + ordena por urgencia.
  // useMemo evita recomputar en cada render del padre.
  // Optional chaining defensivo: campañas legacy pre-Fase-1 no tienen
  // `convergenciaInterna` en el JSON persistido. Filter las descarta
  // silenciosamente — el backfill las normaliza después.
  const deptosConConvergencia: MergedDept[] = useMemo(() => {
    if (!report) return [];
    return report.data.convergencia.departments
      .filter(
        (d) => (d.convergenciaInterna?.nivelConvergencia ?? 'ninguna') !== 'ninguna'
      )
      .map((d) => mergeDepartmentData(report, d))
      .sort(byUrgencia);
  }, [report]);

  if (!report) return null;

  // Empty state — 3 variantes según contexto del ciclo
  if (deptosConConvergencia.length === 0) {
    return <ConvergenciaEmptyState variant={getEmptyStateVariant(report)} />;
  }

  const headerState = classifyHeaderState(deptosConConvergencia);
  const hayCriticaSistema = deptosConConvergencia.some(
    (d) => d.nivelFinal === 'critica_sistema'
  );

  const handleToggle = (deptId: string) => {
    setExpandedDeptId(expandedDeptId === deptId ? null : deptId);
  };

  return (
    <div className="flex flex-col gap-6">
      <ConvergenciaOrgHeader
        state={headerState}
        deptos={deptosConConvergencia}
        hayCriticaSistema={hayCriticaSistema}
      />
      <div className="flex flex-col gap-3">
        {deptosConConvergencia.map((dept) => (
          <BandaDepartamento
            key={dept.departmentId}
            dept={dept}
            isExpanded={expandedDeptId === dept.departmentId}
            onToggle={() => handleToggle(dept.departmentId)}
          />
        ))}
      </div>
    </div>
  );
}
