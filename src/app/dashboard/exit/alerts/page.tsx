// src/app/(dashboard)/dashboard/exit/alerts/page.tsx
// ============================================================================
// PÁGINA: EXIT INTELLIGENCE - CENTRO DE ALERTAS
// ============================================================================
// COPIADO DE: src/app/dashboard/onboarding/alerts/page.tsx
// ADAPTADO PARA: Exit Intelligence
// 
// RUTA: /dashboard/exit/alerts
// 
// ESTRUCTURA:
// - DashboardNavigation
// - Hero section con logo, título, subtítulo
// - ExitAlertsCommandCenter (orquestador principal)
// ============================================================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Siren, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

import { useSidebar } from '@/hooks/useSidebar';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import ExitAlertsCommandCenter from '@/components/exit/ExitAlertsCommandCenter';

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ExitAlertsPage() {
  
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-all duration-300 ${
      isCollapsed ? 'ml-0' : 'ml-0'
    }`}>
      
      {/* ========================================
          NAVEGACIÓN DASHBOARD
          ======================================== */}
      <DashboardNavigation />
      
      {/* ========================================
          CONTENIDO PRINCIPAL
          ======================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================
            HERO SECTION
            ======================================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Breadcrumb / Back link */}
          <Link 
            href="/dashboard/exit"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Exit Intelligence
          </Link>
          
          {/* Header con logo y título */}
          <div className="flex items-start gap-6">
            
            {/* Logo/Ícono */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 rounded-2xl">
                <Siren className="h-10 w-10 text-red-400" />
              </div>
              {/* Badge de compliance */}
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <Shield className="h-3 w-3 text-emerald-400" />
              </div>
            </motion.div>
            
            {/* Título y subtítulo */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">
                Exit Intelligence
              </h1>
              <p className="text-slate-400 mt-2 text-lg">
                Centro de Alertas · Detección de riesgos · Compliance Ley Karin
              </p>
              
              {/* Tags informativos */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  Ley Karin 24h SLA
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400">
                  Salidas Tóxicas 48h SLA
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400">
                  Detección Automática
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* ========================================
            COMMAND CENTER (Orquestador Principal)
            ======================================== */}
        <ExitAlertsCommandCenter />
        
      </main>
      
      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-800/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>FocalizaHR</span>
            <span>•</span>
            <span>Exit Intelligence v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Compliance Legal Chile</span>
            <span>•</span>
            <span>Ley 21.643 (Ley Karin)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}