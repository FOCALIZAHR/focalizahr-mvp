// src/app/dashboard/onboarding/alerts/page.tsx

'use client';

import React from 'react';
import { AlertsCommandCenter } from '@/components/onboarding/AlertsCommandCenter';
import '@/styles/focalizahr-design-system.css';

/**
 * PÁGINA: CENTRO DE ALERTAS ONBOARDING
 * 
 * Features:
 * - Métricas de inteligencia comparativa
 * - Top 3 alertas más frecuentes
 * - Filtros por severity, status, SLA
 * - Marcar alertas como accionadas
 * - Filtrado jerárquico automático
 */
export default function OnboardingAlertsPage() {
  return (
    <div className="fhr-bg-main fhr-bg-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <AlertsCommandCenter />
      </div>
    </div>
  );
}