'use client';

// src/app/dashboard/compliance/components/ComplianceOrchestrator.tsx
// STUB temporal — Sesión 3 del rebuild.
// El orquestador completo (clonado de CinemaModeOrchestrator — Rail + Stage +
// AnimatePresence + estados 0/1/2) se escribe en Sesión 4.
//
// Hoy sólo mantiene la firma que page.tsx consume para preservar typecheck.

import { useComplianceData } from '@/hooks/useComplianceData';

interface ComplianceOrchestratorProps {
  initialCampaignId?: string;
}

export default function ComplianceOrchestrator({
  initialCampaignId,
}: ComplianceOrchestratorProps) {
  const { pageState, error } = useComplianceData(initialCampaignId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-300 flex items-center justify-center p-6">
      <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 max-w-xl w-full">
        <h1 className="text-2xl font-light text-white">Compliance Intelligence</h1>
        <p className="text-slate-400 font-light mt-3">
          Estado: <span className="text-cyan-400">{pageState}</span>
        </p>
        {error && (
          <p className="text-amber-400 font-light text-sm mt-2">{error}</p>
        )}
        <p className="text-slate-500 font-light text-xs mt-6 italic">
          Dashboard en reconstrucción. La experiencia completa llega en la
          próxima entrega.
        </p>
      </div>
    </div>
  );
}
