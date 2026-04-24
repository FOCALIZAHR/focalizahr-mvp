// src/app/dashboard/compliance/page.tsx
// Server Component minimal — delega al orquestador client.
// Query param opcional: ?campaignId=... preselecciona una campaña.

import ComplianceOrchestrator from './components/ComplianceOrchestrator';

interface PageProps {
  searchParams?: { campaignId?: string };
}

export default function CompliancePage({ searchParams }: PageProps) {
  return <ComplianceOrchestrator initialCampaignId={searchParams?.campaignId} />;
}

export const metadata = {
  title: 'Compliance Intelligence — FocalizaHR',
  description:
    'Análisis preventivo de riesgo psicosocial. Ambiente Sano (Ley 21.724).',
};
