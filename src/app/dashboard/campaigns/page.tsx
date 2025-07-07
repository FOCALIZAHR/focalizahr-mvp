// src/app/dashboard/campaigns/page.tsx
// ARQUITECTURA CORRECTA: Redirect a dashboard principal donde está CampaignsList

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CampaignsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 🔄 REDIRECT INMEDIATO A DASHBOARD PRINCIPAL
    // Según arquitectura oficial: CampaignsList está en dashboard principal
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center neural-gradient">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-white/70">Redirigiendo a Dashboard Principal...</p>
        <p className="text-sm text-white/50">
          La gestión de campañas se encuentra en el Dashboard Principal
        </p>
      </div>
    </div>
  );
}