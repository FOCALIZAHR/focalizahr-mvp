# 📋 BRIEF TÉCNICO: Página CAUSES - Exit Intelligence v1.0

**Fecha:** Enero 2026  
**Estado:** ✅ APROBADO PARA IMPLEMENTACIÓN  
**Prioridad:** ALTA - Próxima funcionalidad

---

## 🎯 RESUMEN EJECUTIVO

### Objetivo
Crear página `/dashboard/exit/causes` que transforme datos de salida en inteligencia accionable para CEOs.

### Paradigma
- **ANTES (Detective):** "¿Por qué se fue Juan?" (caso a caso, inmanejable)
- **AHORA (Epidemiólogo):** "¿Dónde están los focos de infección?" (sistémico, financiero)

### Ubicación
Página nueva: `/dashboard/exit/causes`

---

## 📊 DATOS DISPONIBLES (YA EXISTEN)

| Dato | Tabla/Campo | Validado |
|------|-------------|----------|
| Factores de salida | `exit_records.exit_factors` | ✅ |
| Severidad por factor | `exit_records.exit_factors_detail` | ✅ JSON: `{"Liderazgo": 4.8}` |
| Severidad promedio | `exit_records.exit_factors_avg` | ✅ |
| Jerarquía departamental | `departments.parent_id` | ✅ |
| Correlación Onboarding | `exit_records.onboarding_ignored_alerts` | ✅ |
| Cálculos financieros | `src/config/impactAssumptions.ts` | ✅ |
| Benchmarks | Sistema existente `/api/benchmarks` | ✅ |

### Query Validada - Severidad por Departamento
```sql
-- PROBADO Y FUNCIONANDO
WITH factor_data AS (
  SELECT 
    er.department_id,
    d.display_name as departamento,
    key as factor,
    value::float as severity
  FROM exit_records er
  JOIN departments d ON d.id = er.department_id,
  LATERAL jsonb_each(er.exit_factors_detail::jsonb)
  WHERE er.exit_factors_detail IS NOT NULL
)
SELECT 
  departamento,
  COUNT(*) as total_factores,
  ROUND(AVG(severity)::numeric, 2) as severidad_promedio,
  MAX(severity) as severidad_maxima
FROM factor_data
GROUP BY departamento
ORDER BY severidad_promedio DESC;
```

**Resultado real validado:**
| Departamento | Severidad | Diagnóstico |
|--------------|-----------|-------------|
| Desarrollo Software | 4.11 | 🔴 FOCO TÓXICO |
| Subgerencia Compensaciones | 4.00 | 🔴 FOCO TÓXICO |
| GERENCIA DE PERSONAS | 3.78 | 🟡 En riesgo |
| Gerencia de Operaciones | 2.78 | 🟢 Rotación sana |

---

## ⏳ DATO POR IMPLEMENTAR

### Nuevo Campo: talentClassification

**Schema Prisma:**
```prisma
model ExitRecord {
  // ... campos existentes ...
  
  // NUEVO: Clasificación de talento (obligatorio en UI)
  talentClassification String? @map("talent_classification")
  // Valores: 'key_talent' | 'meets_expectations' | 'poor_fit'
}
```

**Migration:**
```sql
ALTER TABLE exit_records 
ADD COLUMN talent_classification VARCHAR(50);
```

**UI en Registro de Salida (RRHH llena, jefes no tienen acceso):**
```
¿Cómo clasificarías a este colaborador? (Obligatorio)

🔴 Talento Clave / Alto Potencial
   Impacto crítico en el negocio
   
🟡 Buen Desempeño / Cumple
   Cumple expectativas del rol
   
🟢 Bajo Ajuste / Error de Contratación  
   No alcanzó el nivel esperado
```

**Validación:** Campo obligatorio, sin opción "Sin clasificar"

---

## 🎬 ESTRUCTURA: LOS 5 ACTOS

### ACTO 1: LA VERDAD DESTILADA

**Pregunta CEO:** "¿Por qué dicen que se van vs por qué se van realmente?"

**Insight:** El CEO cree que es salario. Le demostramos que salario es "ruido" (frecuente pero poco severo) y "Liderazgo" es la herida real.

**Visualización:** Gráfico de Dispersión o Barras Duales
- Eje X: Frecuencia (cuántos lo mencionan)
- Eje Y: Severidad (cuánto duele, 1-5)

**Clasificación Visual:**
- 🔴 Severidad ≥ 4.0 = **HERIDA REAL** (highlight rojo)
- 🔵 Frecuencia alta + Severidad < 3 = **RUIDO** (color tenue)
- 🟡 Otros = **MIXTO**

**Query API:**
```typescript
// GET /api/exit/causes?section=truth
const truthData = await prisma.$queryRaw`
  WITH factor_data AS (
    SELECT 
      key as factor,
      value::float as severity
    FROM exit_records,
    LATERAL jsonb_each(exit_factors_detail::jsonb)
    WHERE exit_factors_detail IS NOT NULL
    AND account_id = ${accountId}
  )
  SELECT 
    factor,
    COUNT(*)::int as frequency,
    ROUND(AVG(severity)::numeric, 2)::float as avg_severity
  FROM factor_data
  GROUP BY factor
  ORDER BY avg_severity DESC
`;
```

**Componente:** `TruthScatterChart.tsx`

---

### ACTO 2: EL MAPA DEL DOLOR (Focos Internos)

**Pregunta CEO:** "¿Se me quema toda la empresa o son focos aislados?"

**Insight:** No usamos benchmarks externos. Usamos el organigrama real para señalar qué Gerencia/Departamento es el foco tóxico.

**Visualización:** Heatmap Jerárquico (TreeMap o Cards)
- Nodos: Gerencias > Departamentos (usa `parentId`)
- Color por Severidad Promedio:
  - 🟢 Verde: 1.0 - 2.9 (rotación sana)
  - 🟡 Amarillo: 3.0 - 3.9 (atención)
  - 🔴 Rojo: 4.0 - 5.0 (FOCO TÓXICO)

**Interacción:** Click en nodo rojo → filtra todo el dashboard por esa unidad

**Query API:**
```typescript
// GET /api/exit/causes?section=painmap
const painMapData = await prisma.$queryRaw`
  WITH factor_data AS (
    SELECT 
      er.department_id,
      d.display_name as department_name,
      d.parent_id as gerencia_id,
      p.display_name as gerencia_name,
      value::float as severity
    FROM exit_records er
    JOIN departments d ON d.id = er.department_id
    LEFT JOIN departments p ON p.id = d.parent_id,
    LATERAL jsonb_each(er.exit_factors_detail::jsonb)
    WHERE er.exit_factors_detail IS NOT NULL
    AND er.account_id = ${accountId}
  )
  SELECT 
    department_id,
    department_name,
    gerencia_id,
    gerencia_name,
    COUNT(*)::int as exit_count,
    ROUND(AVG(severity)::numeric, 2)::float as avg_severity,
    MAX(severity)::float as max_severity
  FROM factor_data
  GROUP BY department_id, department_name, gerencia_id, gerencia_name
  ORDER BY avg_severity DESC
`;
```

**Componente:** `PainHeatmap.tsx`

---

### ACTO 3: EL DRENAJE DE TALENTO

**Pregunta CEO:** "¿Estamos perdiendo grasa o músculo?"

**Insight:** Clasificamos la calidad del talento fugado usando el dropdown de RRHH.

**Visualización:** Donut Chart
- 🔴 **Pérdida Estratégica:** `talent_classification = 'key_talent'`
- 🟡 **Pérdida Estándar:** `talent_classification = 'meets_expectations'`
- 🟢 **Rotación Sana:** `talent_classification = 'poor_fit'`

**Narrativa:** "Atención: El 40% de tus salidas fueron clasificadas como 'Talento Clave'. Son promesas rotas, no errores de selección."

**Query API:**
```typescript
// GET /api/exit/causes?section=drain
const drainData = await prisma.exitRecord.groupBy({
  by: ['talentClassification'],
  where: { 
    accountId,
    talentClassification: { not: null }
  },
  _count: { id: true }
});
```

**Componente:** `TalentDrainDonut.tsx`

**NOTA:** Requiere implementar `talentClassification` primero.

---

### ACTO 4: LA CRÓNICA DE UNA MUERTE ANUNCIADA

**Pregunta CEO:** "¿El sistema avisó y no hicimos nada?"

**Insight:** Auditoría de gestión. Cruzamos alertas históricas con salida actual.

**Visualización:**
- KPI Grande: "Tasa de Predictibilidad: 85%"
- Subtexto: "En el 85% de las salidas críticas existían alertas sin gestionar"
- Timeline opcional: Alerta Día 30 (Ignorada) → Alerta Día 90 (Ignorada) → Exit

**Privacidad:** Mostrar conteos agregados, nunca nombres.

**Diseño Extensible para Futuras Fuentes:**
```typescript
interface AlertSource {
  type: 'onboarding' | 'pulso' | 'ambiente' | 'performance'; // Futuras
  alertDate: Date;
  status: 'pending' | 'resolved' | 'ignored';
  relatedExitId?: string;
}
```

**Query API (actual - Onboarding):**
```typescript
// GET /api/exit/causes?section=predictability
const predictData = await prisma.exitRecord.findMany({
  where: { 
    accountId,
    hadOnboarding: true 
  },
  select: {
    id: true,
    onboardingIgnoredAlerts: true,
    onboardingManagedAlerts: true,
    onboardingAlertsCount: true
  }
});

const withIgnoredAlerts = predictData.filter(r => r.onboardingIgnoredAlerts > 0).length;
const predictabilityRate = (withIgnoredAlerts / predictData.length) * 100;
```

**Componente:** `PredictabilityTimeline.tsx`

---

### ACTO 5: CONTEXTO Y ROI (La Cura)

**Pregunta CEO:** "¿Cuánto me cuesta arreglar esto y cómo estoy vs el mercado?"

**Visualización A - Benchmark:**
"Tu severidad en 'Comercial': 4.5 vs Benchmark Industria: 2.8. No es el mercado, eres tú."

**Visualización B - Business Case:**
- Costo de Inacción: Talento Clave × Salario Anual × 125%
- Costo Intervención: Estimado consultoría/formación
- ROI Estimado: Ahorro por retención

**Usa sistema existente:**
```typescript
import { FinancialCalculator, CHILE_ECONOMIC_ADJUSTMENTS } from '@/config/impactAssumptions';
import { formatCurrencyCLP } from '@/lib/financialCalculations';
```

**Componente:** `ROIBenchmarkCard.tsx`

---

## 🛠️ ARCHIVOS A CREAR

```
CREAR:
├── src/app/api/exit/causes/route.ts           # API con 5 secciones
├── src/app/dashboard/exit/causes/page.tsx     # Página principal
├── src/hooks/useExitCauses.ts                 # Hook de datos
├── src/components/exit/causes/
│   ├── TruthScatterChart.tsx                  # Acto 1
│   ├── PainHeatmap.tsx                        # Acto 2
│   ├── TalentDrainDonut.tsx                   # Acto 3
│   ├── PredictabilityTimeline.tsx             # Acto 4
│   └── ROIBenchmarkCard.tsx                   # Acto 5
```

## 📝 ARCHIVOS A MODIFICAR

```
MODIFICAR:
├── prisma/schema.prisma
│   └── Agregar: talentClassification String? @map("talent_classification")
│
├── src/app/dashboard/exit/register/individual/page.tsx
│   └── Agregar: Dropdown talentClassification (obligatorio)
│
├── src/app/api/exit/register/route.ts
│   └── Aceptar: talentClassification en body
│
├── src/types/exit.ts
│   └── Agregar: TalentClassification type
```

---

## 📐 DISEÑO UI

### Layout Página `/causes`

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ← Volver a Exit Intelligence                          ┃
┃                                                        ┃
┃  📊 Análisis de Causas                                ┃
┃  "Inteligencia profunda sobre por qué se van"         ┃
┃                                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  ┌─────────────────────────────────────────────────┐  ┃
┃  │ ACTO 1: LA VERDAD DESTILADA                     │  ┃
┃  │ [Gráfico Dispersión: Frecuencia vs Severidad]   │  ┃
┃  │                                                 │  ┃
┃  │ 💡 "El 80% menciona 'Oportunidades', pero      │  ┃
┃  │    'Liderazgo' tiene severidad 4.8"            │  ┃
┃  └─────────────────────────────────────────────────┘  ┃
┃                                                        ┃
┃  ┌─────────────────────────────────────────────────┐  ┃
┃  │ ACTO 2: MAPA DEL DOLOR                          │  ┃
┃  │ [Heatmap Jerárquico por Departamento]           │  ┃
┃  │                                                 │  ┃
┃  │ 🔴 Desarrollo Software: 4.11                   │  ┃
┃  │ 🟢 Operaciones: 2.78                           │  ┃
┃  └─────────────────────────────────────────────────┘  ┃
┃                                                        ┃
┃  ┌──────────────────────┐ ┌──────────────────────┐   ┃
┃  │ ACTO 3: DRENAJE      │ │ ACTO 4: PREDICTIB.   │   ┃
┃  │ [Donut Chart]        │ │ [KPI + Timeline]     │   ┃
┃  │ 🔴 40% Talento Clave │ │ 85% Predecibles     │   ┃
┃  └──────────────────────┘ └──────────────────────┘   ┃
┃                                                        ┃
┃  ┌─────────────────────────────────────────────────┐  ┃
┃  │ ACTO 5: ROI Y BENCHMARK                         │  ┃
┃  │ [Business Case + Comparativa Industria]         │  ┃
┃  └─────────────────────────────────────────────────┘  ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Estilos (usar Design System existente)
```typescript
// Clases FocalizaHR
className="fhr-card"
className="fhr-title-gradient"
className="fhr-btn-primary"

// Colores severidad
const severityColors = {
  safe: 'text-green-400 bg-green-500/20',    // 1.0 - 2.9
  warning: 'text-yellow-400 bg-yellow-500/20', // 3.0 - 3.9
  toxic: 'text-red-400 bg-red-500/20'         // 4.0 - 5.0
};
```

---

## ⏱️ ESTIMACIÓN

| Fase | Tarea | Horas |
|------|-------|-------|
| 1 | Schema + Migration `talentClassification` | 1h |
| 2 | Modificar UI registro salida (dropdown) | 2h |
| 3 | API `/api/exit/causes` (5 secciones) | 4h |
| 4 | Hook `useExitCauses` | 1h |
| 5 | Página base `/causes` | 2h |
| 6 | Componente Acto 1 (Scatter) | 3h |
| 7 | Componente Acto 2 (Heatmap) | 3h |
| 8 | Componente Acto 3 (Donut) | 2h |
| 9 | Componente Acto 4 (Timeline) | 2h |
| 10 | Componente Acto 5 (ROI) | 2h |
| 11 | Interactividad + Filtros | 2h |
| **Total** | | **~24h (3-4 días)** |

---

## 📚 REFERENCIAS

- `GUIA_SCOPE_RBAC_RANKING_v2_0.md` - Patrón viewMode/scope
- `src/config/impactAssumptions.ts` - Cálculos financieros
- `src/lib/financialCalculations.ts` - formatCurrencyCLP
- `src/components/ui/FocalizaIntelligenceModal.tsx` - Modales
- `src/components/onboarding/NPSOnboardingCard.tsx` - Patrón card

---

## ✅ CHECKLIST PRE-IMPLEMENTACIÓN

```
□ Migration talentClassification ejecutada
□ UI dropdown en registro funcionando
□ API /api/exit/causes respondiendo
□ Página /causes renderizando
□ 5 componentes visuales creados
□ Drill-down funcionando
□ Mobile responsive
□ Datos de prueba validados
```

---

**APROBADO:** ✅ Enero 2026  
**PRÓXIMO PASO:** Ejecutar implementación en Claude Code
