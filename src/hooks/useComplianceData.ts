// src/hooks/useComplianceData.ts
// STUB temporal — Sesión 3 del rebuild.
// El hook completo (con planActions, interventionPlan, navegación 9 secciones,
// etc.) se escribe en Sesión 4 clonando el patrón de CinemaModeOrchestrator.
//
// Este stub sólo existe para que el typecheck compile mientras las piezas
// reales no están en su lugar. Retorna defaults vacíos — la UI lo detecta como
// estado 'loading' y no renderiza nada consumible.

import { useComplianceCampaigns } from './useComplianceCampaigns';
import type {
  ComplianceCampaignSummary,
  ComplianceReportResponse,
  ComplianceSectionId,
  CompliancePageState,
  CompliancePlanAction,
  ComplianceReportDepartment,
  InterventionPlan,
} from '@/types/compliance';

export interface UseComplianceDataReturn {
  // Estado global
  pageState: CompliancePageState;
  error: string | null;

  // Campañas
  campaigns: ComplianceCampaignSummary[];
  selectedCampaignId: string | null;
  selectedCampaign: ComplianceCampaignSummary | null;
  selectCampaign: (id: string) => void;

  // Navegación Rail (9 secciones)
  activeSection: ComplianceSectionId;
  selectSection: (id: ComplianceSectionId) => void;
  navigateNext: () => void;
  isRailExpanded: boolean;
  toggleRail: () => void;

  // Estado 'active'
  activeParticipationRate: number | null;
  activeCampaign: ComplianceCampaignSummary | null;

  // Estado 'closed'
  report: ComplianceReportResponse | null;
  selectedDepartmentId: string | null;
  selectedDepartment: ComplianceReportDepartment | null;
  selectDepartment: (id: string) => void;

  // Plan de acción — Simulador + Alertas
  planActions: CompliancePlanAction[];
  interventionPlan: InterventionPlan;
  registerPlanAction: (input: {
    triggerType: 'dimension_low' | 'patron' | 'alert';
    triggerRef: string;
    triggerLabel: string;
    chosenOption: number;
    interventionId: string;
  }) => Promise<void>;
  clearPlanAction: (triggerRef: string) => Promise<void>;
  isSavingPlanAction: boolean;

  // Exportación PDF (Fase 6) — noop por ahora, UI muestra disabled
  exportPDF: (type: 'executive' | 'semestral') => Promise<void>;
  isExporting: boolean;
}

export function useComplianceData(_initialCampaignId?: string): UseComplianceDataReturn {
  // Mantenemos el fetch de campañas para que el estado 'empty' siga funcionando
  // en la transición. El resto queda como stub hasta Sesión 4.
  const { campaigns, isLoading, error } = useComplianceCampaigns();

  const pageState: CompliancePageState = isLoading
    ? 'loading'
    : error
      ? 'error'
      : campaigns.length === 0
        ? 'empty'
        : 'loading';

  return {
    pageState,
    error,
    campaigns,
    selectedCampaignId: null,
    selectedCampaign: null,
    selectCampaign: () => {},
    activeSection: 'sintesis',
    selectSection: () => {},
    navigateNext: () => {},
    isRailExpanded: false,
    toggleRail: () => {},
    activeParticipationRate: null,
    activeCampaign: null,
    report: null,
    selectedDepartmentId: null,
    selectedDepartment: null,
    selectDepartment: () => {},
    planActions: [],
    interventionPlan: { recommendations: [], totalTriggers: 0 },
    registerPlanAction: async () => {},
    clearPlanAction: async () => {},
    isSavingPlanAction: false,
    exportPDF: async () => {},
    isExporting: false,
  };
}
