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
import type { AlertaNarrative } from '@/lib/services/compliance/ComplianceNarrativeEngine';
import ConvergenciaOrgHeader from './ConvergenciaOrgHeader';
import BandaDepartamento from './BandaDepartamento';
import BandaSilencioVozExterna from './BandaSilencioVozExterna';
import ConvergenciaEmptyState from './ConvergenciaEmptyState';
import {
  mergeDepartmentData,
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

  // Lookup alertType → AlertaNarrative completa desde
  // `narratives.artefacto4_alertas`. Construido una sola vez y prop-drilled
  // a cada banda → chips colapsados (consecuencia) y Bloque 5 expandido
  // (titulo + contexto + intervencion). Reemplaza el "SLA Nh" eliminado.
  const narrativaByAlertType = useMemo(() => {
    if (!report) return new Map<string, AlertaNarrative>();
    return new Map(
      report.narratives.artefacto4_alertas.map((n) => [n.alertType, n]),
    );
  }, [report]);

  // Lookup departmentId → narrativa estructural desde
  // `narratives.artefacto3_convergencia` (Motor 1 — buildConvergencia).
  // Renderizada en banda colapsada arriba de la combinatoria conductual
  // (Motor 6). Las dos narrativas conviven en paralelo.
  const narrativaEstructuralByDeptId = useMemo(() => {
    if (!report) return new Map<string, string>();
    return new Map(
      report.narratives.artefacto3_convergencia.map((n) => [n.departmentId, n.narrativa])
    );
  }, [report]);

  if (!report) return null;

  // Sexta alerta — deptos sin voz en AS pero con señales externas.
  // Banda dedicada, no requiere MergedDept (componente aislado).
  const silencioItems = report.data.silencioVozExterna ?? [];

  // Empty state — solo si NO hay convergencia NI sexta alerta. Si hay
  // deptos en silencio_con_voz_externa, hay contenido que mostrar.
  if (deptosConConvergencia.length === 0 && silencioItems.length === 0) {
    return <ConvergenciaEmptyState variant={getEmptyStateVariant(report)} />;
  }

  const handleToggle = (deptId: string) => {
    setExpandedDeptId(expandedDeptId === deptId ? null : deptId);
  };

  return (
    <div className="flex flex-col gap-6">
      <ConvergenciaOrgHeader
        deptos={deptosConConvergencia}
        totalDeptosUniverso={
          report.data.totalDeptosUniverso ?? report.data.departments.length
        }
        criticalByManagerCount={report.data.convergencia.criticalByManager.length}
        patronCulturalDominante={report.data.metaAnalysis?.patron_cultural_dominante ?? 'ninguno'}
        cruceNarrativa={report.narratives.cruceNarrativa}
        criticalByManagerNarrativa={report.narratives.criticalByManagerNarrativa}
      />
      <div className="flex flex-col gap-3">
        {deptosConConvergencia.map((dept) => (
          <BandaDepartamento
            key={dept.departmentId}
            dept={dept}
            isExpanded={expandedDeptId === dept.departmentId}
            onToggle={() => handleToggle(dept.departmentId)}
            narrativaByAlertType={narrativaByAlertType}
            narrativaEstructural={narrativaEstructuralByDeptId.get(dept.departmentId)}
            recommendations={hook.interventionPlan.recommendations}
            planActions={hook.planActions}
            onRegister={hook.registerPlanAction}
            onClear={hook.clearPlanAction}
            isSavingPlanAction={hook.isSavingPlanAction}
          />
        ))}
        {/* Sexta alerta — bandas de deptos sin voz en AS, con señales externas.
            Van al final: son la casilla "silencio con voz externa", distinta
            de las bandas de convergencia estándar. */}
        {silencioItems.map((item, i) => (
          <BandaSilencioVozExterna
            key={item.departmentId ?? `silencio-${i}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
