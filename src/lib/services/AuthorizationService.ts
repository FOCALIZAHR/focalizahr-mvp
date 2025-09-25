// src/lib/services/AuthorizationService.ts
// VERSIÓN FINAL VALIDADA - INCLUYE AMBOS NIVELES DE SEGURIDAD

import { prisma } from '@/lib/prisma';
import { LRUCache } from 'lru-cache';

// Cache para optimizar consultas recursivas
const hierarchyCache = new LRUCache<string, string[]>({
  max: 500,
  ttl: 1000 * 60 * 15 // 15 minutos
});

/**
 * Obtiene todos los departamentos hijos de una gerencia
 * Utiliza CTE recursivo con cache para optimización
 */
async function getChildDepartmentIds(parentId: string): Promise<string[]> {
  if (hierarchyCache.has(parentId)) {
    debugLog(`📦 Cache hit para departamento ${parentId}`);
    return hierarchyCache.get(parentId)!;
  }
  
  debugLog(`🔍 Consultando hijos de departamento ${parentId}`);
  
  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE dept_tree AS (
      SELECT id, 0 as depth 
      FROM departments 
      WHERE parent_id = ${parentId}
      
      UNION ALL
      
      SELECT d.id, dt.depth + 1
      FROM departments d
      JOIN dept_tree dt ON d.parent_id = dt.id
      WHERE dt.depth < 3
    )
    SELECT id FROM dept_tree
  `;
  
  const ids = result.map(r => r.id);
  debugLog(`✅ Encontrados ${ids.length} departamentos hijos`);
  
  hierarchyCache.set(parentId, ids);
  return ids;
}

/**
 * FUNCIÓN CRÍTICA - Construye filtros de seguridad multi-nivel
 * NIVEL 1: Multi-tenant (accountId) - SIEMPRE
 * NIVEL 2: Departamental (departmentId) - Solo AREA_MANAGER
 */
export async function buildParticipantAccessFilter(userContext: {
  accountId: string;
  role: string | null;
  departmentId: string | null;
}): Promise<any> {
  
  debugLog(`🔐 Construyendo filtros para rol: ${userContext.role}, account: ${userContext.accountId}`);
  
  const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'CEO'];
  
  // CASO 1: Roles globales - filtro por cuenta únicamente
  if (globalRoles.includes(userContext.role || '')) {
    debugLog(`✅ Acceso total para ${userContext.role} en cuenta ${userContext.accountId}`);
    return {
      campaign: { 
        accountId: userContext.accountId  // CRÍTICO: Filtro multi-tenant
      }
    };
  }
  
  // CASO 2: AREA_MANAGER - filtro por cuenta Y departamentos
  if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
    debugLog(`🏢 AREA_MANAGER: Aplicando filtros para depto ${userContext.departmentId}`);
    
    const childIds = await getChildDepartmentIds(userContext.departmentId);
    const allAllowedIds = [userContext.departmentId, ...childIds];
    
    debugLog(`✅ Puede ver ${allAllowedIds.length} departamentos en cuenta ${userContext.accountId}`);
    
    return {
      campaign: { 
        accountId: userContext.accountId  // NIVEL 1: Multi-tenant
      },
      departmentId: { 
        in: allAllowedIds  // NIVEL 2: Departamental
      }
    };
  }
  
  // CASO 3: Sin acceso (seguridad por defecto)
  debugLog(`🚫 Sin acceso: rol ${userContext.role} no reconocido`);
  return {
    campaign: { 
      accountId: userContext.accountId 
    },
    id: 'no-access-impossible-value'  // Garantiza 0 resultados
  };
}

/**
 * Helper para extraer contexto del usuario de los headers
 * Los headers vienen del middleware (Día 3)
 */
export function extractUserContext(request: Request): {
  accountId: string;
  role: string | null;
  departmentId: string | null;
  userId: string | null;
} {
  return {
    accountId: request.headers.get('x-account-id') || '',
    role: request.headers.get('x-user-role'),
    departmentId: request.headers.get('x-department-id'),
    userId: request.headers.get('x-user-id')
  };
}

/**
 * Logger condicional para desarrollo
 */
const DEBUG = process.env.NODE_ENV === 'development';
function debugLog(message: string) {
  if (DEBUG) {
    console.log(message);
  }
}

/**
 * Invalida el cache cuando hay cambios en estructura organizacional
 */
export function invalidateDepartmentCache(departmentId?: string) {
  if (departmentId) {
    debugLog(`🗑️ Invalidando cache para departamento ${departmentId}`);
    hierarchyCache.delete(departmentId);
  } else {
    debugLog(`🗑️ Limpiando todo el cache de departamentos`);
    hierarchyCache.clear();
  }
}