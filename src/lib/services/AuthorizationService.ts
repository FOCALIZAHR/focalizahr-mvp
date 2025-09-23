// COPIAR ESTE CÓDIGO EXACTO
import { prisma } from '@/lib/prisma';
import { LRUCache } from 'lru-cache';

// Cache para optimizar consultas recursivas
const hierarchyCache = new LRUCache<string, string[]>({
  max: 500,
  ttl: 1000 * 60 * 15 // 15 minutos
});

/**
 * Obtiene todos los departamentos hijos de una gerencia
 * CON CACHE para evitar CTE recursivo repetido
 */
async function getChildDepartmentIds(parentId: string): Promise<string[]> {
  // Revisar cache primero
  if (hierarchyCache.has(parentId)) {
    return hierarchyCache.get(parentId)!;
  }
  
  // CTE recursivo con límite de profundidad
  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE dept_tree AS (
      SELECT id, 0 as depth 
      FROM departments 
      WHERE parent_id = ${parentId}
      
      UNION ALL
      
      SELECT d.id, dt.depth + 1
      FROM departments d
      JOIN dept_tree dt ON d.parent_id = dt.id
      WHERE dt.depth < 3  -- Máximo 3 niveles
    )
    SELECT id FROM dept_tree
  `;
  
  const ids = result.map(r => r.id);
  hierarchyCache.set(parentId, ids);
  return ids;
}

/**
 * Construye el filtro WHERE para Prisma basado en rol del usuario
 * NUNCA trae todos los datos a memoria
 */
export async function buildParticipantAccessFilter(
  user: { 
    role: string | null; 
    departmentId: string | null; 
  }
): Promise<any> {
  
  // Roles con acceso total
  const globalRoles = [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_MANAGER', 
    'CEO'
  ];
  
  // Acceso total = WHERE vacío
  if (globalRoles.includes(user.role || '') || !user.departmentId) {
    return {}; 
  }

  // AREA_MANAGER = WHERE con departamentos permitidos
  if (user.role === 'AREA_MANAGER' && user.departmentId) {
    const childIds = await getChildDepartmentIds(user.departmentId);
    return {
      departmentId: {
        in: [user.departmentId, ...childIds],
      },
    };
  }

  // Seguridad por defecto: denegar todo
  return { id: 'access-denied-no-results' }; 
}

/**
 * Invalida el cache cuando hay cambios en estructura
 */
export function invalidateDepartmentCache(departmentId?: string) {
  if (departmentId) {
    hierarchyCache.delete(departmentId);
  } else {
    hierarchyCache.clear();
  }
}