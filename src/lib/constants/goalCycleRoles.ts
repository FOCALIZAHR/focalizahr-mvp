// src/lib/constants/goalCycleRoles.ts
// ════════════════════════════════════════════════════════════════════════════
// Roles que ven la superficie de gestión de ciclos de metas en el FRONTEND
// (ítem de menú + guard de página /dashboard/metas/ciclos).
//
// FUENTE DE VERDAD REAL DE SEGURIDAD: 'goals:cycles:manage' en
// src/lib/services/AuthorizationService.ts (Decisión de Negocio #1 CORREGIDA,
// espeja performance:manage). Esta constante es SOLO decoración de UI
// (mostrar/ocultar) — la API sigue protegiendo con hasPermission() sin cambios.
// AuthorizationService no puede importarse en client components (importa
// prisma), por eso existe esta constante espejo. Si el set cambia allá,
// actualizar acá — un solo lugar en el frontend.
// ════════════════════════════════════════════════════════════════════════════

export const GOAL_CYCLE_MANAGER_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
] as const

export function canManageGoalCycles(role: string | null | undefined): boolean {
  return !!role && (GOAL_CYCLE_MANAGER_ROLES as readonly string[]).includes(role)
}
