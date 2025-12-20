// src/components/onboarding/BackToHub.tsx
// ============================================================================
// BACK TO HUB - Navegación Breadcrumb Premium
// Usar en: alerts, pipeline, executive, dashboard (page.tsx)
// ============================================================================

'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface BackToHubProps {
  /** Variante de navegación */
  variant?: 'simple' | 'breadcrumb';
  /** Página actual para breadcrumb */
  currentPage?: string;
  /** Destino del botón (default: /dashboard/onboarding/inicio) */
  href?: string;
  /** Label personalizado */
  label?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BackToHub = memo(function BackToHub({
  variant = 'simple',
  currentPage,
  href = '/dashboard/onboarding/inicio',
  label = 'Volver al Hub'
}: BackToHubProps) {
  const router = useRouter();

  // ========================================
  // VARIANT: SIMPLE (Solo botón)
  // ========================================
  if (variant === 'simple') {
    return (
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => router.push(href)}
        className="
          inline-flex items-center gap-2 px-4 py-2
          text-sm text-slate-400 font-light
          bg-slate-800/30 hover:bg-slate-800/50
          border border-slate-700/30 hover:border-slate-600/50
          rounded-xl backdrop-blur-sm
          transition-all duration-200
          hover:text-cyan-400
          group
        "
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>{label}</span>
      </motion.button>
    );
  }

  // ========================================
  // VARIANT: BREADCRUMB (Con ruta completa)
  // ========================================
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-sm"
      aria-label="Breadcrumb"
    >
      {/* Home / Seguimiento */}
      <button
        onClick={() => router.push('/dashboard/seguimiento')}
        className="
          flex items-center gap-1.5 px-3 py-1.5
          text-slate-500 hover:text-cyan-400
          transition-colors duration-200
          rounded-lg hover:bg-slate-800/30
        "
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-light">Seguimiento</span>
      </button>

      <ChevronRight className="w-4 h-4 text-slate-600" />

      {/* Hub Onboarding */}
      <button
        onClick={() => router.push('/dashboard/onboarding/inicio')}
        className="
          flex items-center gap-1.5 px-3 py-1.5
          text-slate-500 hover:text-cyan-400
          transition-colors duration-200
          rounded-lg hover:bg-slate-800/30
        "
      >
        <span className="font-light">Onboarding</span>
      </button>

      {/* Current Page (si existe) */}
      {currentPage && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <span className="px-3 py-1.5 text-slate-300 font-medium">
            {currentPage}
          </span>
        </>
      )}
    </motion.nav>
  );
});

BackToHub.displayName = 'BackToHub';

export default BackToHub;

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================

/*
// En /dashboard/onboarding/alerts/page.tsx:
import BackToHub from '@/components/onboarding/BackToHub';

export default function AlertsPage() {
  return (
    <div>
      <BackToHub variant="breadcrumb" currentPage="Centro de Alertas" />
      // ... resto del contenido
    </div>
  );
}

// En /dashboard/onboarding/pipeline/page.tsx:
import BackToHub from '@/components/onboarding/BackToHub';

export default function PipelinePage() {
  return (
    <div>
      <BackToHub variant="simple" />
      // ... resto del contenido
    </div>
  );
}

// En /dashboard/onboarding/page.tsx (Dashboard con tabs):
import BackToHub from '@/components/onboarding/BackToHub';

export default function OnboardingDashboard() {
  return (
    <div>
      <BackToHub variant="breadcrumb" currentPage="Dashboard" />
      // ... resto del contenido
    </div>
  );
}
*/