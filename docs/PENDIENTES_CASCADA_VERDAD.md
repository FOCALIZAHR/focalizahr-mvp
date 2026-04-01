# Pendientes — P&L del Talento / Cascada de la Verdad

> Features pendientes del módulo P&L Talent en Executive Hub.
> Cada item tiene objetivo, complejidad, dependencias y notas de implementación.
> Fecha: Abril 2026

---

## 1. REFACTORIZACIÓN MONOLITO

**Objetivo:** Dividir PLTalentExecutiveBriefing.tsx (+700 líneas) en componentes por acto para mantenibilidad y escalabilidad.

**Complejidad:** Media

**Dependencias:** Ninguna — refactor interno sin impacto en APIs ni datos.

**Notas:**
- Componentes propuestos: `CascadaActoDiagnostico`, `CascadaActoLiderazgo`, `CascadaActoImpactoNegocio`, `CascadaActoFinanciero`, `CascadaActoCargosCriticos`, `CascadaSintesis`
- Cada acto recibe props tipadas — sin lógica de negocio propia
- `ActSeparator` y `SubtleLink` ya están extraídos como funciones internas
- Los modals (Leaders, Radar, Tenure, CriticalRoles) se mantienen en archivos separados (ya están)
- El componente padre queda como orquestador de actos con la lógica de derived data

---

## 2. NARRATIVAS POSITIVAS

**Objetivo:** Implementar la Cascada completa cuando RoleFit > 75% — misma estructura de 5 actos pero con narrativas que celebran el resultado y orientan la protección del talento.

**Complejidad:** Alta

**Dependencias:**
- Requiere diccionarios de narrativas positivas (nuevos o extensión de los existentes)
- Los diccionarios actuales (TenureRoleFitDictionary, SuccessionRiskDictionary) ya tienen variantes `high` pero están orientados a nivel individual, no a síntesis ejecutiva
- ExecutiveSynthesisEngine necesita variante POSITIVE (hoy solo diagnostica problemas)

**Notas:**
- Hoy si `brecha.totalPeople === 0` la Cascada retorna `null` — el CEO no ve nada
- Los actos positivos podrían ser: "Tu organización opera al 82%" → "Tus líderes superan el estándar" → "El talento senior está protegido" → Síntesis: "Mantener este estándar requiere..."
- Tono: no complaciente — orientado a protección y continuidad
- El backend ya devuelve datos cuando no hay brecha, solo el frontend los ignora

---

## 3. CASCADA POR GERENCIA

**Objetivo:** Adaptar narrativas y recalibrar umbrales del ExecutiveSynthesisEngine para mostrar la Cascada filtrada por gerencia específica.

**Complejidad:** Alta

**Dependencias:**
- Backend: YA SOPORTADO — todos los endpoints aceptan `?gerencia=X`
- Hook: YA SOPORTADO — `drillGerencia` state + `selectGerencia()` + `buildParams()`
- Frontend: PLTalentExecutiveBriefing renderiza lo que reciba sin filtrar

**Notas — Problemas narrativos por resolver:**
- Acto 3 (Impacto Negocio): "Gerencia Comercial concentra el riesgo" pierde sentido si YA estás dentro de Comercial — necesita narrativa alternativa ("Dentro de esta gerencia, el problema se concentra en...")
- Acto 5 (Cargos Críticos): puede quedar vacío si la gerencia no tiene cargos críticos
- Síntesis: ExecutiveSynthesisEngine usa umbrales pensados para empresa completa (ej: LIDERAZGO requiere 30% de líderes bajo estándar) — con N=3 líderes en una gerencia, los porcentajes se distorsionan
- Solución propuesta: ExecutiveSynthesisEngine recibe un `context: 'company' | 'gerencia'` que ajusta umbrales y templates de narrativa

---

## 4. HEATMAP LAYER × GERENCIA

**Objetivo:** Rediseñar HeatmapTab (CapacidadesIntelligence/tabs/HeatmapTab.tsx) con estilos FocalizaHR — aplicar design system sin cambiar la lógica de drill-down por celda.

**Complejidad:** Media

**Dependencias:**
- Componente existente: `src/app/dashboard/executive-hub/components/CapacidadesIntelligence/tabs/HeatmapTab.tsx`
- Design system: clases `.fhr-*`, glassmorphism, font-light, colores semánticos (cyan/amber/purple)
- Evaluar si el heatmap debería vivir también dentro de PLTalent como vista complementaria

**Notas:**
- Leer HeatmapTab actual antes de rediseñar — entender su lógica de drill-down
- Aplicar patrones validados: cards glassmorphism, tooltips group-hover, dot LEDs, font-light
- Mobile-first: touch targets 44px, scroll horizontal si necesario

---

## 5. AUTO-EXPANDIR FAMILIA DE CARGO

**Objetivo:** Al llegar desde "Ver por familia de cargo →" de la Cascada, expandir automáticamente la sección colapsable en el tab Localización.

**Complejidad:** Baja

**Dependencias:**
- `onNavigateToCargoFamily` callback ya existe en PLTalentExecutiveBriefing
- `showCargo` state ya existe en BrechaProductivaTab
- Solo falta pasar un flag `autoExpandCargo` al tab

**Notas:**
- Implementación: `onNavigateToCargoFamily` pasa `{ autoExpand: true }` → BrechaProductivaTab recibe prop → `useEffect` hace `setShowCargo(true)` + `scrollIntoView`
- Alternativa: usar un ref + `scrollIntoView({ behavior: 'smooth' })` para que el usuario vea la expansión

---

## 6. ARQUITECTURA CONDICIONAL COMPLETA

**Objetivo:** Implementar manejo de actos vacíos — cuando no hay líderes bajo estándar, cargos críticos, o datos de antigüedad, mostrar estado alternativo por acto en vez de silencio.

**Complejidad:** Media

**Dependencias:**
- Requiere definir qué dice cada acto vacío (narrativa positiva por ausencia)
- Relación con item 2 (Narrativas Positivas) — si se implementan juntos, el acto vacío se convierte en acto positivo

**Notas:**
- Hoy los actos condicionales usan guards: `{leadersAtRisk > 0 && (...)}` — si no hay líderes, el acto desaparece
- Propuesta: cada acto tiene un estado "positivo por ausencia":
  - Sin líderes bajo estándar → "Todos tus líderes operan al nivel esperado"
  - Sin cargos críticos bajo estándar → "Tus posiciones críticas están protegidas"
  - Sin datos de antigüedad → No mostrar (dato no disponible, no positivo)
- Considerar: ¿el CEO prefiere silencio (menos scroll) o completitud (todos los actos)?
- Recomendación: implementar con item 2 para coherencia narrativa

---

## Orden sugerido de ejecución

| Prioridad | Item | Razón |
|-----------|------|-------|
| 1 | 5 - Auto-expandir | Baja complejidad, alto valor UX, quick win |
| 2 | 1 - Refactorización | Prerequisito para mantener los demás items |
| 3 | 6 - Condicional | Mejora experiencia actual sin features nuevas |
| 4 | 2 - Positivas | Completa la narrativa (hoy solo cuenta problemas) |
| 5 | 4 - Heatmap | Rediseño visual, no bloquea otros items |
| 6 | 3 - Por gerencia | Más complejo, requiere recalibración de umbrales |
