# Refactorización UX/UI /dashboard/exit/causes
## Alineado con FILOSOFIA_DISENO_FOCALIZAHR_v1.md

**PRINCIPIO RECTOR:** "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"

---

## CAMBIOS GLOBALES

1. **Espaciado:** Agregar gap-8 entre actos (actualmente muy apretados)
2. **Textos:** NUNCA truncar. Si no cabe, reducir font-size o usar tooltip
3. **Mobile:** Stack vertical completo en < 1024px
4. **Typography:** Insights deben ser text-lg font-medium, no notas al pie
5. **Jerarquía:** UN protagonista por acto (el INSIGHT)

---

## ACTO 1: LA VERDAD DESTILADA

### ANTES
Scatter chart con cards desordenadas, textos truncados ("Liderazgo de A...")

### PROBLEMA
CEO no entiende en 3 segundos qué es importante

### DESPUÉS
DOS SECCIONES CLARAS con insight como protagonista

```
┌─────────────────────────────────────────────────────────────┐
│  LA VERDAD DESTILADA                                        │
│  "Lo que dicen vs lo que duele"                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💡 INSIGHT PROTAGONISTA (text-xl font-medium):            │
│  "El 80% menciona Oportunidades de Crecimiento, pero       │
│   Liderazgo tiene severidad 3.4. Se van por el jefe,       │
│   no por falta de oportunidades."                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔴 LO QUE DUELE (Severidad ≥ 3.5)                         │
│  ┌─────────────────────────────────────────────────┐       │
│  │ Liderazgo de Apoyo          ████████░░  3.4  8x │       │
│  │ Flexibilidad y Equilibrio   ████████░░  3.4 14x │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  🔵 RUIDO (Alta frecuencia, baja severidad)                │
│  ┌─────────────────────────────────────────────────┐       │
│  │ Oportunidades de Crecimiento ██████░░░░  3.0 12x│       │
│  │ Compensación y Beneficios    ██████░░░░  3.0  2x│       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  [▸ Ver metodología de clasificación] ← Colapsado          │
└─────────────────────────────────────────────────────────────┘
```

### COMPONENTE
- Lista vertical con barra de progreso (severidad) + badge (frecuencia)
- NO SCATTER CHART - es demasiado complejo para "3 segundos"
- Nombres de factores COMPLETOS (nunca truncar)
- Separar en 2 grupos: "Lo que duele" vs "Ruido"

### LÓGICA DE CLASIFICACIÓN
```typescript
// Lo que duele: severidad >= 3.5
const loQueDuele = factors.filter(f => f.avgSeverity >= 3.5)
  .sort((a, b) => b.avgSeverity - a.avgSeverity);

// Ruido: severidad < 3.5
const ruido = factors.filter(f => f.avgSeverity < 3.5)
  .sort((a, b) => b.mentions - a.mentions); // Ordenar por frecuencia
```

---

## ACTO 2: MAPA DEL DOLOR

### ANTES
Treemap ilegible con textos cortados ("Subgerencia Compensa...")

### PROBLEMA
No hay jerarquía visual clara, no se ven los focos tóxicos de inmediato

### DESPUÉS
FOCOS TÓXICOS como protagonistas + lista secundaria colapsable

```
┌─────────────────────────────────────────────────────────────┐
│  MAPA DEL DOLOR                                             │
│  "¿Se quema toda la empresa o son focos aislados?"         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💡 INSIGHT PROTAGONISTA (text-xl):                        │
│  "2 departamentos son focos tóxicos (severidad ≥4.0).      │
│   No es un problema generalizado, requieren intervención   │
│   específica."                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔴 FOCOS TÓXICOS (Severidad ≥ 4.0)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ Desarrollo Software                     4.1      │   │
│  │    3 salidas · Gerencia de Tecnología               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⚠️ Subgerencia Compensaciones y Proyectos  4.0      │   │
│  │    3 salidas · Gerencia de Personas                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [▸ Ver todos los departamentos (5)]  ← Colapsable         │
│                                                             │
│  Cuando se expande:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 GERENCIA DE PERSONAS              3.8  4 salidas │   │
│  │ 🟡 NUTRICION                         3.0  3 salidas │   │
│  │ 🟢 Gerencia de Operaciones           2.8  5 salidas │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### COMPONENTE
- Cards con borde-left color según severidad:
  - Rojo (#EF4444): severidad >= 4.0
  - Amarillo (#F59E0B): severidad 3.0 - 3.9
  - Verde (#10B981): severidad < 3.0
- Nombres COMPLETOS de departamentos
- Progressive disclosure: Solo focos rojos visibles inicialmente
- Resto en sección colapsable

### LÓGICA
```typescript
const focosToxicos = departments.filter(d => d.avgSeverity >= 4.0);
const otros = departments.filter(d => d.avgSeverity < 4.0);
```

---

## ACTO 3: DRENAJE DE TALENTO

### ANTES
Donut comprimido con leyenda a la derecha que aplasta el gráfico

### PROBLEMA
No se ve el KPI principal, leyenda mal ubicada

### DESPUÉS
Donut centrado + KPI en el centro + leyenda horizontal abajo

```
┌─────────────────────────────────────────────────────────────┐
│  DRENAJE DE TALENTO                                         │
│  "¿Perdimos grasa o músculo?"                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   ┌─────────────┐                           │
│                   │             │                           │
│                   │    40%      │  ← text-4xl font-bold    │
│                   │   Talento   │     en el centro         │
│                   │    Clave    │                           │
│                   │             │                           │
│                   └─────────────┘                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Pérdida Estratégica    4   ████████████░░  40%  │   │
│  │ 🟡 Pérdida Estándar       3   █████████░░░░░  30%  │   │
│  │ 🟢 Rotación Sana          3   █████████░░░░░  30%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 "4 de cada 10 salidas fueron talento clave.            │
│      No son errores de selección, son promesas rotas."     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### COMPONENTE
- Donut con espacio en centro para KPI
- Leyenda ABAJO del donut (flex-col), no al lado
- Barras de progreso horizontales en la leyenda
- Insight al final

### LABELS UX
```typescript
const talentLabels = {
  key_talent: { label: 'Pérdida Estratégica', color: '#EF4444', icon: '🔴' },
  meets_expectations: { label: 'Pérdida Estándar', color: '#F59E0B', icon: '🟡' },
  poor_fit: { label: 'Rotación Sana', color: '#10B981', icon: '🟢' }
};
```

---

## ACTO 4: CRÓNICA ANUNCIADA

### ANTES
Parece tabla de Excel con datos duros sin jerarquía

### PROBLEMA
No hay protagonista, todo al mismo nivel visual

### DESPUÉS
KPI GIGANTE como protagonista + métricas secundarias pequeñas

```
┌─────────────────────────────────────────────────────────────┐
│  CRÓNICA ANUNCIADA                                          │
│  "¿El sistema avisó y no actuamos?"                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                       100%                                  │
│                    PREDECIBLE                               │
│                                                             │
│            (text-5xl font-bold text-red-400)               │
│                                                             │
│  "En TODAS las salidas con onboarding existían             │
│   alertas sin gestionar"                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │    2     │ │    2     │ │   1.5    │ │    0     │       │
│  │ Con Onb. │ │ Alertas  │ │ Prom.Ign │ │ Prom.Ges │       │
│  │          │ │ Ignoradas│ │          │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ⚠️ INSIGHT:                                                │
│  "La oportunidad está en ACTUAR sobre las alertas,         │
│   no en generar más datos."                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### COMPONENTE
- KPI "100%" en text-5xl text-red-400 font-bold CENTRADO
- Subtítulo "PREDECIBLE" debajo
- Grid de 4 métricas secundarias pequeñas
- Insight con ícono de alerta al final

---

## ACTO 5: CONTEXTO Y ROI

### ANTES
Falta peso visual en el monto, benchmark poco claro

### PROBLEMA
El dinero no impacta, la comparación es confusa

### DESPUÉS
Monto GIGANTE rojo + barra comparativa simple lado a lado

```
┌─────────────────────────────────────────────────────────────┐
│  IMPACTO FINANCIERO              BENCHMARK INDUSTRIA        │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│  💰 Costo de Inacción           │  📊 Tu Severidad vs       │
│                                 │     Mercado               │
│      $96M                       │                           │
│      CLP                        │  Tú      ████████░░ 3.2   │
│                                 │  Mercado ██████░░░░ 2.8   │
│  (text-5xl text-red-400)        │                           │
│                                 │  Diferencia: +0.4         │
│  4 salidas talento clave        │                           │
│  × 125% salario anual           │  💡 "No es el mercado,    │
│                                 │   hay oportunidad de      │
│  Metodología: SHRM 2024         │   mejora interna"         │
│                                 │                           │
└─────────────────────────────────┴───────────────────────────┘
```

### COMPONENTE
- Layout grid 2 columnas en desktop, stack en mobile
- Monto en text-5xl text-red-400 font-bold
- Barra comparativa simple (no gauge complejo)
- Insight contextual

---

## RESUMEN DE CAMBIOS

| Acto | Componente Actual | Nuevo Componente | Cambio Principal |
|------|-------------------|------------------|------------------|
| 1 | TruthScatterChart | FactorSeverityList | Lista en 2 categorías + insight |
| 2 | PainHeatmap | ToxicFocusCards | Focos rojos destacados + colapsable |
| 3 | TalentDrainDonut | (mismo, ajustado) | Leyenda abajo + KPI central |
| 4 | PredictabilityTimeline | PredictabilityKPI | KPI gigante protagonista |
| 5 | ROIBenchmarkCard | (mismo, ajustado) | Monto $96M gigante |

---

## ARCHIVOS A MODIFICAR

```
src/components/exit/causes/
├── TruthScatterChart.tsx      → REESCRIBIR como FactorSeverityList
├── PainHeatmap.tsx            → REESCRIBIR como ToxicFocusCards  
├── TalentDrainDonut.tsx       → AJUSTAR layout (leyenda abajo)
├── PredictabilityTimeline.tsx → REESCRIBIR como PredictabilityKPI
└── ROIBenchmarkCard.tsx       → AJUSTAR (monto gigante)

src/app/dashboard/exit/causes/page.tsx
└── Agregar gap-8 entre secciones
└── Verificar responsive mobile
```

---

## PRIORIDADES DE IMPLEMENTACIÓN

1. **INSIGHT como protagonista** de cada acto (text-xl font-medium)
2. **Textos COMPLETOS** - nunca truncar nombres
3. **Progressive disclosure** - detalle colapsado por defecto
4. **Espacio generoso** entre actos (gap-8)
5. **Mobile-first** - stack vertical en < 1024px

---

## CHECKLIST FINAL

- [ ] Cada acto tiene UN insight protagonista visible
- [ ] Ningún texto está truncado
- [ ] Focos tóxicos son lo primero que se ve en Acto 2
- [ ] KPI 100% es gigante y rojo en Acto 4
- [ ] Monto $96M impacta visualmente en Acto 5
- [ ] Funciona en mobile 375px
- [ ] Gap de 32px (gap-8) entre actos
- [ ] Secciones colapsables funcionan

---

**Filosofía FocalizaHR:** "Cada píxel debe ganarse su lugar"
