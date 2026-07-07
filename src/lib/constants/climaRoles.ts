// src/lib/constants/climaRoles.ts
// ════════════════════════════════════════════════════════════════════════════
// Roles que ven la superficie de Inteligencia de Clima en el FRONTEND
// (ítem de menú + guard de página /dashboard/clima).
//
// FUENTE DE VERDAD REAL DE SEGURIDAD: 'clima:view' en
// src/lib/services/AuthorizationService.ts (mismo patrón que compliance:view).
// Esta constante es SOLO decoración de UI (mostrar/ocultar) — la API sigue
// protegiendo con hasPermission('clima:view') sin cambios. AuthorizationService
// no puede importarse en client components (importa prisma), por eso existe
// esta constante espejo. Si el set cambia allá, actualizar acá — un solo lugar.
// ════════════════════════════════════════════════════════════════════════════

export const CLIMA_VIEW_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'HR_OPERATOR',
  'CEO',
  'AREA_MANAGER',
] as const;

export function canViewClima(role: string | null | undefined): boolean {
  return !!role && (CLIMA_VIEW_ROLES as readonly string[]).includes(role);
}
