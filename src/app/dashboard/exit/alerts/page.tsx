// src/app/(dashboard)/dashboard/exit/alerts/page.tsx

'use client';

import React from 'react';
import ExitAlertsCommandCenter from '@/components/exit/ExitAlertsCommandCenter';
import '@/styles/focalizahr-design-system.css';

import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

export default function ExitAlertsPage() {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <DashboardNavigation />
      <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* HERO */}
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
                Exit Intelligence
              </h1>
              <p className="text-xl text-slate-300 font-light">
                Centro de Alertas · Compliance Ley Karin · Detección Automática
              </p>
            </div>
          </div>
          
          {/* COMPONENTE EXIT */}
          <ExitAlertsCommandCenter />
          
        </div>
      </main>
    </>
  );
}