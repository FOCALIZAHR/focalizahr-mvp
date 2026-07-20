// src/app/dashboard/inicio/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portada "Signos Vitales" — SPEC_HOME_SIGNOS_VITALES_v1.1, Gate B.
//
// SERVER COMPONENT: el rol llega en el PRIMER render, leído de los headers que
// inyecta el middleware. NADA de localStorage, NADA de decodificar JWT en
// cliente, NADA del campo `role` colapsado a CLIENT. Precedente del proyecto:
// clima/page.tsx, server component que delega a un client component.
//
// No hace fetch a /api/vitals/summary: llama al servicio directo. El endpoint
// existe para consumo externo; acá un hop HTTP solo agregaría latencia y
// obligaría a reenviar cookies. La regla de acceso es la MISMA en ambos
// caminos porque ambos usan resolveVitalsAccess.
//
// Gate C resolverá el router por rol (redirect server-side de HR_OPERATOR).
// En Gate B, un rol sin permiso ve el estado explícito de abajo.
// ════════════════════════════════════════════════════════════════════════════

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import { hasPermission } from '@/lib/services/AuthorizationService';
import { buildVitalsNarrative } from '@/lib/narratives/vitalsNarratives';
import { getVitalSigns } from '@/lib/services/vitals/VitalSignsService';
import { resolveVitalsAccess } from '@/lib/services/vitals/resolveVitalsAccess';
import VitalSignsPortada from '@/components/vitals/VitalSignsPortada';
import VitalsBelowFold from '@/components/vitals/VitalsBelowFold';

export const metadata = {
  title: 'Signos Vitales — FocalizaHR',
  description: 'Estado de la organización en una lectura.',
};

/**
 * Router por rol (spec seccion 4, Gate C): la casa de HR_OPERATOR es la vista
 * operativa, donde si puede actuar sobre campanas y participantes. No tiene
 * 'vitals:view' por diseno, asi que sin este redirect aterrizaria en el estado
 * de acceso denegado en vez de en su superficie de trabajo.
 *
 * EVALUATOR NO se lista: el middleware (:252) ya lo redirige a evaluaciones.
 * Duplicarlo aca crearia dos fuentes para la misma decision.
 */
const ROLES_A_VISTA_OPERATIVA: readonly string[] = ['HR_OPERATOR'];

export default async function InicioPage() {
  const h = headers();

  // Antes de resolver acceso: si no es su superficie, se va a la suya.
  if (ROLES_A_VISTA_OPERATIVA.includes(h.get('x-user-role') ?? '')) {
    redirect('/dashboard');
  }

  const access = await resolveVitalsAccess((name) => h.get(name));

  // x-company-name viaja codificado (middleware.ts:218) por ñ/tildes.
  const rawCompany = h.get('x-company-name');
  const companyName = rawCompany ? decodeURIComponent(rawCompany) : null;

  // ── Acceso denegado: estado explícito, jamás pantalla muda ──────────────
  if (!access.ok) {
    const esSinDepartamento = access.code === 'AREA_MANAGER_SIN_DEPARTAMENTO';
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-16 md:px-8 md:py-24">
          <FHREmptyState
            type={esSinDepartamento ? 'requires' : 'pending'}
            title={
              esSinDepartamento
                ? 'Tu acceso no tiene área asignada'
                : 'Esta lectura no está disponible para tu perfil'
            }
            description={
              esSinDepartamento
                ? 'Los signos vitales se leen por área. Tu usuario todavía no tiene una asignada, así que el sistema no puede determinar qué te corresponde ver.'
                : 'Tu trabajo ocurre en la vista operativa, donde sí puedes actuar sobre campañas y participantes.'
            }
            insight={
              esSinDepartamento
                ? 'El sistema prefiere no mostrarte nada antes que mostrarte lo que no te corresponde.'
                : undefined
            }
            cta={
              esSinDepartamento
                ? undefined
                : { label: 'Ver la operación', href: '/dashboard' }
            }
          />
        </div>
      </div>
    );
  }

  const summary = await getVitalSigns({
    accountId: access.accountId,
    departmentIds: access.departmentIds,
  });

  const narrative = buildVitalsNarrative(summary, {
    canManageCampaigns: hasPermission(access.role, 'campaigns:manage'),
  });

  return (
    <VitalSignsPortada narrative={narrative} companyName={companyName}>
      <VitalsBelowFold summary={summary} />
    </VitalSignsPortada>
  );
}
