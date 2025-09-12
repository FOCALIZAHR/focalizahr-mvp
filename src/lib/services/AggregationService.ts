import { prisma } from '@/lib/prisma';

export interface HierarchicalScore {
  id: string;
  parentId: string | null;
  displayName: string;
  unitType: string;
  level: number;
  score: number;
  participants: number;  // CORREGIDO: era participantCount
  children?: HierarchicalScore[];
}

export class AggregationService {
  /**
   * Obtiene scores jerárquicos usando CTE recursivo (implementación Gemini optimizada)
   * Performance optimizado con cálculo en BD
   */
  static async getHierarchicalScores(
    campaignId: string, 
    accountId: string
  ): Promise<HierarchicalScore[]> {
    try {
      // ✅ CORRECCIÓN: Usando template literals con Prisma para seguridad SQL
      const results = await prisma.$queryRaw<HierarchicalScore[]>`
        WITH RECURSIVE unit_scores AS (
          -- ANCLA: Departamentos con participantes y scores directos
          SELECT 
            d.id,
            d.parent_id,
            d.display_name,
            d.unit_type,
            d.level,
            d.employee_count,
            COALESCE(AVG(r.rating), 0) AS weighted_score,
            COUNT(DISTINCT p.id)::FLOAT AS participant_count
          FROM departments d
          LEFT JOIN participants p ON d.id = p.department_id AND p.campaign_id = ${campaignId}
          LEFT JOIN responses r ON p.id = r.participant_id
          WHERE d.account_id = ${accountId}
            AND d.is_active = true
            AND d.level = 3  -- Solo departamentos (hojas)
          GROUP BY d.id, d.parent_id, d.display_name, d.unit_type, d.level, d.employee_count
          
          UNION ALL
          
          -- RECURSIVO: Agregación ponderada hacia arriba (gerencias)
          SELECT
            parent.id,
            parent.parent_id,
            parent.display_name,
            parent.unit_type,
            parent.level,
            parent.employee_count,
            -- Promedio ponderado usando participant_count como peso
            CASE 
              WHEN SUM(child.participant_count) > 0 THEN
                SUM(child.weighted_score * child.participant_count) / SUM(child.participant_count)
              ELSE 0
            END AS weighted_score,
            SUM(child.participant_count) AS participant_count
          FROM departments parent
          INNER JOIN unit_scores child ON parent.id = child.parent_id
          WHERE parent.account_id = ${accountId}
            AND parent.is_active = true
          GROUP BY parent.id, parent.parent_id, parent.display_name, parent.unit_type, parent.level, parent.employee_count
        )
        SELECT 
          id,
          parent_id AS "parentId",           -- ✅ Alias para mapear correctamente
          display_name AS "displayName",     -- ✅ Alias para mapear correctamente
          unit_type AS "unitType",           -- ✅ Alias para mapear correctamente
          level,
          ROUND(weighted_score::numeric, 2) as score,
          participant_count::INTEGER as participants
        FROM unit_scores
        ORDER BY level, display_name;
      `;
      
      return this.buildHierarchyTree(results);
    } catch (error) {
      console.error('Error in getHierarchicalScores:', error);
      throw error;
    }
  }

  /**
   * Construye árbol jerárquico desde lista plana
   */
  private static buildHierarchyTree(flatList: HierarchicalScore[]): HierarchicalScore[] {
    const map = new Map<string, HierarchicalScore>();
    const roots: HierarchicalScore[] = [];
    
    // Primera pasada: crear nodos con children vacíos
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });
    
    // Segunda pasada: establecer relaciones padre-hijo
    flatList.forEach(item => {
      const node = map.get(item.id);
      if (node) {
        if (item.parentId) {
          const parent = map.get(item.parentId);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          // Nodo sin padre = raíz (gerencias de nivel superior)
          roots.push(node);
        }
      }
    });
    
    return roots;
  }

  /**
   * Detecta si hay estructura jerárquica configurada
   */
  static async hasHierarchy(accountId: string): Promise<boolean> {
    const count = await prisma.department.count({
      where: {
        accountId,
        parentId: { not: null }
      }
    });
    return count > 0;
  }
}