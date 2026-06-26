# Ficha de Producto — Capa de Estrategia (Cockpit Ejecutivo)

> El meta-producto: un solo tablero ejecutivo que funde Workforce + Efficiency + Metas + Executive Hub en una narrativa para el CEO, replicada y filtrada para cada gerente.
> Mapeado 2026-06-26. Es 70% packaging + glue de lo ya construido, 30% síntesis nueva. Honesto decirlo: no es un módulo desde cero — es la capa que unifica los existentes.

## Qué es
Hoy el CEO entra por separado a Workforce (dotación), Efficiency (decisiones), Metas (estrategia), Executive Hub (talento/P&L). La **Capa de Estrategia** es **un único cockpit** que los integra: del estado de la organización a las 3-5 decisiones del trimestre, todo drillable y **filtrado por jerarquía** para que cada gerente vea su propia versión.

## Qué agrupa (los productores ya existentes)
- **Workforce Intelligence** — la dotación: quién, cuánto cuesta, exposición a IA, 9 detectores org, presupuesto de dotación.
- **Efficiency Hub** — las 9 lentes → carrito de decisiones CEO + business case exportable.
- **Metas** — la estrategia ejecutable: cascada de objetivos + cuadrantes Goals×Performance.
- **Executive Hub / P&L Talent** — el desempeño puesto en pesos: brecha productiva, semáforo legal, síntesis 5 diagnósticos, 9-box, Calibration Health, Succession panel, Capabilities/RoleFit, InsightsRail.

## Las capacidades del producto

**1. Síntesis cross-módulo ("State of the Organization")**
Un veredicto que funde clima + desempeño + metas + exposición IA + costo en un solo lenguaje. Las piezas ya existen (`ExecutiveSynthesisEngine`, `AmbienteSynthesisEngine`, `GoalsSynthesisEngine`); el producto es la **meta-síntesis** que las une en los 3-5 movimientos prioritarios.

**2. Accountability en cascada (acceso filtrado por jerarquía)**
El RBAC de 3 capas ya está: GLOBAL (CEO ve la empresa entera) / AREA_MANAGER (ve solo su gerencia + hijos, vía `getChildDepartmentIds`) / EVALUATOR (directos). El pitch: *todos miran el mismo tablero, cada gerente es dueño del suyo*. Convierte el dashboard en herramienta de responsabilidad, no de reporte.

**3. Simulación / what-if**
Decide en pantalla y ve el impacto en pesos: presupuesto de dotación (5 pasos), descriptor simulator (rediseño de cargos en vivo), carrito de Efficiency (ahorro/mes + inversión + payback).

**4. Anticipación con SLA**
Alertas con plazo: fuga de cerebros (48h), pasivo laboral creciente, compliance (Ley Karin 24h), riesgo de adopción. El CEO actúa antes del incidente, no después.

**5. Business case exportable**
Plan de decisiones del directorio, sin nombres, agrupado por familia con subtotales (ya existe en Efficiency). El puente entre el diagnóstico y la junta.

## Qué se vende — CEO vs Gerentes

| | CEO / C-level | Gerente (AREA_MANAGER) |
|---|---|---|
| Alcance | Empresa entera | Su gerencia + sub-departamentos |
| Síntesis | State of the Organization (3-5 decisiones) | Su tablero filtrado, mismas métricas |
| Acción | Business case para directorio | Acciones sobre su equipo (TAC, planes) |
| Framing comercial | "El cockpit de la organización" | "Cada líder, dueño de su tablero" |

**Lo que diferencia (más allá del acceso filtrado):** la **síntesis** es el verdadero diferenciador. Acceso filtrado lo tienen muchos; fundir clima+desempeño+metas+IA+costo en un veredicto accionable, no. El acceso filtrado es el **gancho de accountability**; la síntesis es el **valor**.

## Diferenciadores
1. **Un cockpit, no cuatro pestañas** — el ejecutivo deja de saltar entre módulos.
2. **Síntesis cross-módulo** — un solo lenguaje de talento, costo y riesgo.
3. **Accountability en cascada** — cada gerente ve lo mismo que el CEO, filtrado a su scope.
4. **Del diagnóstico a la decisión** — carrito + business case, no solo gráficos.
5. **Anticipatorio** — alertas con SLA, no reportes post-mortem.

## Qué falta construir (el "glue" + dependencias)
Esto es packaging, pero el packaging tiene trabajo real:
- **El cockpit unificado**: hoy las superficies viven separadas (Workforce cinema, Efficiency hub, Executive Hub). Falta el entry-point único que las orqueste. Esfuerzo M-L.
- **La meta-síntesis "State of the Organization"**: unir los 3 synthesis engines en un veredicto org. Esfuerzo M.
- **DEPENDENCIA DURA del backlog**: el pitch de "accountability en cascada" solo es enterprise-grade si se cierran los gaps de RBAC primero:
  - `P0-1` Metas 6 endpoints sin `hasPermission`.
  - `P1-5` Efficiency: AREA_MANAGER sin permiso cableado (hoy recibe 403).
  - `P1-6` Benchmark sin gate · `P2-1/2/3` Onboarding/Exit/Succession RBAC.
  - Sin esto, "cada gerente ve solo lo suyo" es falso. **Cerrar la auditoría RBAC es prerequisito de vender esta capa.**
- **Consistencia de clasificación** (`P2-5`): el cockpit debe hablar UN vocabulario de talento (hoy hay 6 taxonomías). Sin esto, la síntesis se ve incoherente.

## Honestidad para el dossier
- Es un **empaque** de módulos existentes + síntesis nueva. Vendible y potente, pero no anunciar "construido desde cero".
- El acceso filtrado **existe en el RBAC** pero tiene huecos (ver dependencia dura). No prometer "cada gerente su tablero" hasta cerrar la auditoría RBAC del backlog.
- La síntesis cross-módulo **aún no está unificada** — los engines existen por módulo, falta el meta-engine.

---
Relacionado: fichas de `project_workforce_inventario_producto`, `project_efficiency_inventario_producto`, `project_metas_inventario_producto`, `project_pltalent_inventario_producto`, `project_performance_inventario_producto`. Dependencias técnicas: `.claude/tasks/BACKLOG_ENTERPRISE.md` (P0-1, P1-5, P1-6, P2-1/2/3, P2-5).
