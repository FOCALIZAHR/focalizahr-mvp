// src/app/dashboard/onboarding/alerts/page.tsx

'use client';

import React from 'react';
import { AlertsCommandCenter } from '@/components/onboarding/AlertsCommandCenter';
import '@/styles/focalizahr-design-system.css';

// ═══════════════════════════════════════════════════════════════
// 🆕 NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

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
  // ═══════════════════════════════════════════════════════════════
  // 🆕 NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════
  const { isCollapsed } = useSidebar();

  return (
    <>
      <DashboardNavigation />
      <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* HERO - AGREGAR ESTE BLOQUE COMPLETO */}
          <div className="text-center space-y-8 mb-16">
            <div className="flex justify-center mb-6">
              <img 
                src="/images/focalizahr-logo_palabra.svg" 
                alt="FocalizaHR" 
                className="h-8 opacity-80"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extralight text-white tracking-tight">
                Onboarding Journey Intelligence
              </h1>
              <p className="text-xl text-slate-300 font-light">
                Centro de Alertas · Monitoreo proactivo · Intervención temprana
              </p>
            </div>
          </div>
          {/* FIN HERO */}
          
          <AlertsCommandCenter />
        </div>
      </main>
    </>
  );
}
