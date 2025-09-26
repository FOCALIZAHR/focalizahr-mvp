// src/lib/services/AggregationService.ts
// VERSIÓN CORRECTA - SQL Optimizado sin CTE recursivo problemático

import { prisma } from '@/lib/prisma';

export interface HierarchicalScore {
  id: string;
  parentId: string | null;
  displayName: string;
  unitType: string;
  level: number;
  score: number;
  participants: number;
  children?: HierarchicalScore[];
}

export class AggregationService {
  /**
   * Obtiene scores jerárquicos usando consulta SQL optimizada
   * SOLUCIÓN: Evita agregaciones en CTE recursivo usando subconsultas
   */
  static async getHierarchicalScores(
    campaignId: string, 
    accountId: string
  ): Promise<HierarchicalScore[]> {
    try {
      console.log('📊 Starting hierarchical score calculation...');
      
      // ESTRATEGIA: Primero calculamos todos los scores base, 
      // luego construimos la jerarquía con una segunda consulta
      
      const results = await prisma.$queryRaw<HierarchicalScore[]>`
        WITH base_scores AS (
          -- Calculamos scores para TODOS los departamentos (nivel 3)
          SELECT 
            d.id,
            d.parent_id,
            d.display_name,
            d.unit_type,
            d.level,
            COALESCE(AVG(r.rating), 0) as score,
            COUNT(DISTINCT p.id) as participant_count
          FROM departments d
          LEFT JOIN participants p ON d.id = p.department_id 
            AND p.campaign_id = ${campaignId}
          LEFT JOIN responses r ON p.id = r.participant_id
          WHERE d.account_id = ${accountId}
            AND d.is_active = true
            AND d.level = 3
          GROUP BY d.id, d.parent_id, d.display_name, d.unit_type, d.level
        ),
        aggregated_scores AS (
          -- Para las gerencias, agregamos los scores de sus departamentos hijos
          SELECT 
            g.id,
            g.parent_id,
            g.display_name,
            g.unit_type,
            g.level,
            COALESCE(
              SUM(bs.score * bs.participant_count) / NULLIF(SUM(bs.participant_count), 0),
              0
            ) as score,
            COALESCE(SUM(bs.participant_count), 0) as participant_count
          FROM departments g
          LEFT JOIN base_scores bs ON g.id = bs.parent_id
          WHERE g.account_id = ${accountId}
            AND g.is_active = true
            AND g.level = 2
          GROUP BY g.id, g.parent_id, g.display_name, g.unit_type, g.level
        )
        -- Combinamos gerencias y departamentos
        SELECT 
          id,
          parent_id as "parentId",
          display_name as "displayName",
          unit_type as "unitType",
          level,
          ROUND(score::numeric, 2) as score,
          participant_count::INTEGER as participants
        FROM (
          SELECT * FROM aggregated_scores
          UNION ALL
          SELECT * FROM base_scores
        ) combined
        ORDER BY level, display_name
      `;

      console.log(`✅ Retrieved ${results.length} hierarchical units`);

      // Construir árbol jerárquico
      return this.buildHierarchyTree(results);
      
    } catch (error) {
      console.error('❌ Error in getHierarchicalScores:', error);
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
    try {
      const count = await prisma.department.count({
        where: {
          accountId,
          parentId: { not: null },
          isActive: true
        }
      });
      return count > 0;
    } catch (error) {
      console.error('❌ Error checking hierarchy:', error);
      return false;
    }
  }

  /**
   * Agrupa scores por nivel jerárquico (helper para visualización)
   */
  static groupScoresByLevel(scores: HierarchicalScore[]): Record<number, HierarchicalScore[]> {
    const grouped: Record<number, HierarchicalScore[]> = {};
    
    const flattenTree = (nodes: HierarchicalScore[]) => {
      nodes.forEach(node => {
        if (!grouped[node.level]) {
          grouped[node.level] = [];
        }
        grouped[node.level].push(node);
        if (node.children && node.children.length > 0) {
          flattenTree(node.children);
        }
      });
    };
    
    flattenTree(scores);
    return grouped;
  }

  /**
   * Calcula estadísticas generales de la jerarquía
   */
  static calculateHierarchyStats(scores: HierarchicalScore[]): {
    avgScoreByLevel: Record<number, number>;
    participationByLevel: Record<number, number>;
    topPerformers: HierarchicalScore[];
    bottomPerformers: HierarchicalScore[];
  } {
    const allNodes: HierarchicalScore[] = [];
    
    // Aplanar el árbol para análisis
    const flattenTree = (nodes: HierarchicalScore[]) => {
      nodes.forEach(node => {
        allNodes.push(node);
        if (node.children && node.children.length > 0) {
          flattenTree(node.children);
        }
      });
    };
    
    flattenTree(scores);
    
    const levels = [...new Set(allNodes.map(s => s.level))];
    const avgScoreByLevel: Record<number, number> = {};
    const participationByLevel: Record<number, number> = {};
    
    levels.forEach(level => {
      const levelNodes = allNodes.filter(s => s.level === level);
      const totalScore = levelNodes.reduce((sum, s) => sum + s.score, 0);
      const totalParticipants = levelNodes.reduce((sum, s) => sum + s.participants, 0);
      
      avgScoreByLevel[level] = levelNodes.length > 0 
        ? Math.round((totalScore / levelNodes.length) * 100) / 100 
        : 0;
      participationByLevel[level] = totalParticipants;
    });

    // Top y bottom performers (solo unidades con participación)
    const nodesWithParticipation = allNodes.filter(s => s.participants > 0);
    const sortedByScore = [...nodesWithParticipation].sort((a, b) => b.score - a.score);
    
    return {
      avgScoreByLevel,
      participationByLevel,
      topPerformers: sortedByScore.slice(0, 5),
      bottomPerformers: sortedByScore.slice(-5).reverse()
    };
  }
}