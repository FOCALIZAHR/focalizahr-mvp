// src/lib/services/AggregationService.ts
// VERSIÓN FINAL CORREGIDA - Con Inteligencia Predictiva
// ✅ TODOS LOS CAMPOS IA INCLUIDOS EN EL RETURN
// 📅 ACTUALIZACIÓN: Filtrado de departamentos sin participantes (8 cambios quirúrgicos)

import { prisma } from '@/lib/prisma';

export interface HierarchicalScore {
  id: string;
  parentId: string | null;
  displayName: string;
  unitType: string;
  level: number;
  score: number;
  participants: number;
  responded: number;
  rate: number;
  children?: HierarchicalScore[];
}

// 🆕 INTERFACE PARA INTELIGENCIA PREDICTIVA
export interface AggregatedGerencia {
  // --- Datos Base ---
  id: string;
  displayName: string;
  participants: number;
  responded: number;
  scoreNum: number;      // Mantener consistencia con frontend
  rateNum: number;       // Mantener consistencia con frontend
  children: DepartmentChild[];

  // --- Inteligencia Agregada ---
  trend: 'acelerando' | 'desacelerando' | 'estable' | 'crítico' | null;
  velocity: number;
  projection: number;
  position: number;
}

export interface DepartmentChild {
  id: string;
  displayName: string;
  participants: number;
  responded: number;
  scoreNum: number;
  rateNum: number;
}

export class AggregationService {
  /**
   * 🎯 FUNCIÓN PRINCIPAL OPTIMIZADA - INTELIGENCIA PREDICTIVA
   * Una sola query para todo - Sin N+1 problem
   * 📅 ACTUALIZADO: Solo retorna departamentos CON participantes
   */
  static async getGerenciaIntelligence(
    campaignId: string, 
    accountId: string,
    daysRemaining: number = 5
  ): Promise<AggregatedGerencia[]> {
    try {
      console.log('🧠 Starting Gerencia Intelligence calculation (OPTIMIZED + FILTERED)...');
      
      // UNA SOLA QUERY OPTIMIZADA - Todo en una llamada
      const results = await prisma.$queryRaw<any[]>`
        WITH department_data AS (
          -- Métricas y velocity para DEPARTAMENTOS (Nivel 3)
          SELECT 
            d.id,
            d.parent_id,
            d.display_name,
            d.unit_type,
            d.level,
            COALESCE(AVG(r.rating), 0) as score,
            COUNT(DISTINCT p.id) as participants,
            COUNT(DISTINCT CASE WHEN p.has_responded THEN p.id END) as responded,
            -- Velocity: respuestas últimos 3 días
            (COUNT(DISTINCT CASE 
              WHEN r.created_at >= CURRENT_DATE - INTERVAL '3 days'
              THEN p.id END)::FLOAT / NULLIF(COUNT(DISTINCT p.id), 0) * 100
            ) as velocity_rate
          FROM departments d
          INNER JOIN participants p ON d.id = p.department_id  -- 🔧 CAMBIO 1: LEFT → INNER JOIN
            AND p.campaign_id = ${campaignId}
          LEFT JOIN responses r ON p.id = r.participant_id
          WHERE d.account_id = ${accountId} 
            AND d.is_active = true 
            AND d.level = 3
          GROUP BY d.id, d.parent_id, d.display_name, d.unit_type, d.level  -- 🔧 FIX 1: GROUP BY completo
          HAVING COUNT(DISTINCT p.id) > 0  -- 🔧 CAMBIO 2: Agregar HAVING para filtrar sin participantes
        ),
        gerencia_data AS (
          -- Agregación para GERENCIAS (Nivel 2)
          SELECT 
            g.id,
            NULL::uuid as parent_id,
            g.display_name,
            g.unit_type,
            g.level,
            -- Score ponderado
            COALESCE(
              SUM(dd.score * dd.participants) / NULLIF(SUM(dd.participants), 0), 
              0
            ) as score,
            COALESCE(SUM(dd.participants), 0) as participants,
            COALESCE(SUM(dd.responded), 0) as responded,
            -- Velocity agregado
            CASE 
              WHEN SUM(dd.participants) > 0 THEN
                AVG(dd.velocity_rate)
              ELSE 0
            END as velocity
          FROM departments g
          LEFT JOIN department_data dd ON g.id = dd.parent_id
          WHERE g.account_id = ${accountId} 
            AND g.is_active = true 
            AND g.level = 2
          GROUP BY g.id, g.display_name, g.unit_type, g.level
          HAVING COALESCE(SUM(dd.participants), 0) > 0  -- 🔧 CAMBIO 3: Solo gerencias con participantes
        )
        -- Retornar solo gerencias con sus hijos como JSON
        SELECT 
          gd.id,
          gd.display_name as "displayName",
          gd.unit_type as "unitType",
          gd.level,
          CAST(gd.participants AS INTEGER) as participants,
          CAST(gd.responded AS INTEGER) as responded,
          ROUND(gd.score::numeric, 2) as "scoreNum",
          ROUND(
            CASE 
              WHEN gd.participants > 0 THEN 
                (gd.responded::FLOAT / gd.participants * 100)
              ELSE 0 
            END::numeric, 2
          ) as "rateNum",
          ROUND(COALESCE(gd.velocity, 0)::numeric, 2) as velocity,
          -- Incluir hijos como JSON
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', dd.id,
                  'displayName', dd.display_name,
                  'participants', dd.participants,
                  'responded', dd.responded,
                  'scoreNum', ROUND(dd.score::numeric, 2),
                  'rateNum', ROUND(
                    CASE 
                      WHEN dd.participants > 0 THEN 
                        (dd.responded::FLOAT / dd.participants * 100)
                      ELSE 0 
                    END::numeric, 2
                  )
                )
              )
              FROM department_data dd
              WHERE dd.parent_id = gd.id
                AND dd.participants > 0  -- 🔧 CAMBIO 4: Solo hijos con participantes
            ),
            '[]'::json
          ) as children
        FROM gerencia_data gd
        WHERE gd.participants > 0  -- 🔧 CAMBIO 5: Filtro final - solo gerencias con participantes
        ORDER BY "rateNum" DESC, "displayName"
      `;

      console.log(`✅ Retrieved ${results.length} active gerencias (filtered, with participants only)`);

      // Procesar inteligencia predictiva en JavaScript
      const processedResults = results.map((gerencia, index) => {
        const velocity = parseFloat(gerencia.velocity) || 0;
        const rateNum = parseFloat(gerencia.rateNum) || 0;
        
        const trend = this.calculateTrend(velocity, rateNum);
        const projection = this.calculateProjection(rateNum, velocity, daysRemaining);
        
        // Parsear children JSON
        let children = gerencia.children || [];
        if (typeof children === 'string') {
          try {
            children = JSON.parse(children);
          } catch (e) {
            console.error('Error parsing children:', e);
            children = [];
          }
        }
        
        // 🔧 CAMBIO 6: Filtrar children sin participantes en JavaScript como doble seguridad
        children = Array.isArray(children) 
          ? children.filter((child: any) => child.participants > 0)
          : [];
        
        return {
          id: gerencia.id,
          displayName: gerencia.displayName,
          unitType: gerencia.unitType,
          level: gerencia.level,
          participants: parseInt(gerencia.participants) || 0,
          responded: parseInt(gerencia.responded) || 0,
          rateNum,
          scoreNum: parseFloat(gerencia.scoreNum) || 0,
          children,
          // Campos de inteligencia predictiva
          trend,
          velocity,
          projection: projection || rateNum,
          position: index + 1
        };
      });

      console.log('🧠 Intelligence calculation completed (optimized + filtered)');
      return processedResults;
      
    } catch (error) {
      console.error('❌ Error in getGerenciaIntelligence:', error);
      throw error;
    }
  }

  /**
   * Calcula trend basado en velocity y rate actual
   */
  private static calculateTrend(
    velocity: number, 
    currentRate: number
  ): 'acelerando' | 'desacelerando' | 'estable' | 'crítico' | null {
    // Sin datos suficientes
    if (currentRate === 0) return null;
    
    // Casos críticos
    if (currentRate < 30 && velocity <= 0) return 'crítico';
    if (currentRate < 50 && velocity < -2) return 'crítico';
    
    // Análisis de velocity
    if (velocity > 5) return 'acelerando';
    if (velocity > 2) return 'estable';
    if (velocity < -5) return 'desacelerando';
    if (velocity < -2) return 'desacelerando';
    
    return 'estable';
  }

  /**
   * Calcula proyección final basada en velocity y días restantes
   */
  private static calculateProjection(
    currentRate: number, 
    velocity: number, 
    daysRemaining: number
  ): number {
    // Si no hay días restantes o rate es 0, retornar rate actual
    if (daysRemaining <= 0 || currentRate === 0) return currentRate;
    
    // Si ya está al 100%, mantener
    if (currentRate >= 100) return 100;
    
    // Proyección lineal con factor de decaimiento
    const decayFactor = Math.max(0.5, 1 - (daysRemaining / 30)); // Menos impacto a más días
    const effectiveVelocity = velocity * decayFactor;
    const projectedIncrease = effectiveVelocity * Math.min(daysRemaining, 10); // Cap a 10 días
    
    const finalProjection = currentRate + projectedIncrease;
    
    // Límites realistas [currentRate, 100]
    return Math.min(100, Math.max(currentRate, finalProjection));
  }

  /**
   * Función original para compatibilidad
   * 📅 ACTUALIZADO: También filtra departamentos sin participantes
   */
  static async getHierarchicalScores(
    campaignId: string, 
    accountId: string
  ): Promise<HierarchicalScore[]> {
    try {
      console.log('📊 Starting hierarchical score calculation (filtered)...');
      
      const results = await prisma.$queryRaw<HierarchicalScore[]>`
        WITH base_scores AS (
          SELECT 
            d.id,
            d.parent_id,
            d.display_name,
            d.unit_type,
            d.level,
            COALESCE(AVG(r.rating), 0) as score,
            COUNT(DISTINCT p.id) as participant_count,
            COUNT(DISTINCT CASE WHEN p.has_responded THEN p.id END) as responded_count,
            CASE 
              WHEN COUNT(DISTINCT p.id) > 0 THEN
                (COUNT(DISTINCT CASE WHEN p.has_responded THEN p.id END)::FLOAT / 
                 COUNT(DISTINCT p.id)) * 100
              ELSE 0 
            END as rate
          FROM departments d
          INNER JOIN participants p ON d.id = p.department_id  -- 🔧 CAMBIO 7: LEFT → INNER JOIN
            AND p.campaign_id = ${campaignId}
          LEFT JOIN responses r ON p.id = r.participant_id
          WHERE d.account_id = ${accountId}
            AND d.is_active = true
            AND d.level = 3
          GROUP BY d.id, d.parent_id, d.display_name, d.unit_type, d.level  -- 🔧 FIX 2: GROUP BY completo
          HAVING COUNT(DISTINCT p.id) > 0  -- 🔧 CAMBIO 8: Agregar HAVING para filtrar
        ),
        aggregated_scores AS (
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
            COALESCE(SUM(bs.participant_count), 0) as participant_count,
            COALESCE(SUM(bs.responded_count), 0) as responded_count,
            -- FIX: Agregar cálculo de rate que faltaba
            CASE 
             WHEN SUM(bs.participant_count) > 0 THEN
               (SUM(bs.responded_count)::FLOAT / SUM(bs.participant_count)) * 100
             ELSE 0
            END as rate
          FROM departments g
          LEFT JOIN base_scores bs ON g.id = bs.parent_id
          WHERE g.account_id = ${accountId}
            AND g.is_active = true
            AND g.level = 2
          GROUP BY g.id, g.parent_id, g.display_name, g.unit_type, g.level
          -- Solo mostrar gerencias que tienen al menos algún departamento con participantes
          HAVING COALESCE(SUM(bs.participant_count), 0) > 0
        )
        SELECT 
          id,
          parent_id as "parentId",
          display_name as "displayName",
          unit_type as "unitType",
          level,
          ROUND(score::numeric, 2) as score,
          participant_count::INTEGER as participants,
          responded_count::INTEGER as responded,
          ROUND(rate::numeric, 2) as rate
        FROM (
          SELECT * FROM aggregated_scores
          UNION ALL
          SELECT * FROM base_scores
        ) combined
        ORDER BY level, display_name
      `;

      return this.buildHierarchyTree(results);
      
    } catch (error) {
      console.error('❌ Error in getHierarchicalScores:', error);
      throw error;
    }
  }

  /**
   * Construye árbol jerárquico
   */
  private static buildHierarchyTree(flatList: HierarchicalScore[]): HierarchicalScore[] {
    const map = new Map<string, HierarchicalScore>();
    const roots: HierarchicalScore[] = [];
    
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });
    
    flatList.forEach(item => {
      const node = map.get(item.id);
      if (node) {
        if (item.parentId) {
          const parent = map.get(item.parentId);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      }
    });
    
    return roots;
  }

  /**
   * Detecta si hay estructura jerárquica
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
}