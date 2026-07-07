// src/app/dashboard/clima/page.tsx
// EX Clima — Cinema Mode (Gate 4). Server component minimal: delega al
// orquestador client. Deep-link opcional ?campaignId=... preselecciona campaña.

import ClimaCinemaOrchestrator from './components/ClimaCinemaOrchestrator';

interface PageProps {
  searchParams?: { campaignId?: string };
}

export default function ClimaPage({ searchParams }: PageProps) {
  return <ClimaCinemaOrchestrator initialCampaignId={searchParams?.campaignId} />;
}

export const metadata = {
  title: 'Inteligencia de Clima — FocalizaHR',
  description: 'Resultados de clima organizacional. Pulso Express · Experiencia Full.',
};
