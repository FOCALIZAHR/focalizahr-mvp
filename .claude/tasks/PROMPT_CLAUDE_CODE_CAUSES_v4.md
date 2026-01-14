# 🎯 PROMPT CLAUDE CODE: EXIT CAUSES v4.0

## CONTEXTO
Rediseño de `/dashboard/exit/causes/page.tsx` siguiendo 100% la guía oficial `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md`.

## DOCUMENTOS DE REFERENCIA (LEER PRIMERO)
1. `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Sistema de diseño oficial
2. `src/styles/focalizahr-unified.css` - Clases CSS disponibles
3. `src/app/dashboard/exit/causes/` - Código actual

---

## TAREA 1: Verificar CSS Disponible

Antes de modificar componentes, verificar en `src/styles/focalizahr-unified.css`:

```bash
# ¿Existen estas clases?
grep -n "fhr-top-line" src/styles/focalizahr-unified.css
grep -n "fhr-divider" src/styles/focalizahr-unified.css
grep -n "fhr-hero" src/styles/focalizahr-unified.css
```

Si NO existen, agregarlas según la guía.

---

## TAREA 2: Modificar page.tsx

### 2.1 Agregar Hero con Título y Divider

```tsx
// ANTES del contenido actual, agregar:

<div className="fhr-hero">
  <h1 className="fhr-hero-title">
    Análisis de <span className="fhr-title-gradient">Causas</span>
  </h1>
  
  <div className="fhr-divider">
    <div className="fhr-divider-line"></div>
    <div className="fhr-divider-dot"></div>
    <div className="fhr-divider-line"></div>
  </div>
  
  <p className="fhr-subtitle">
    Inteligencia profunda sobre por qué se van
  </p>
</div>
```

### 2.2 Estructura General

```tsx
<div className="fhr-bg-main min-h-screen">
  <div className="fhr-content">
    {/* Hero */}
    {/* La Revelación */}
    {/* KPIs */}
    {/* Tabs */}
  </div>
</div>
```

---

## TAREA 3: Corregir RevelationCard

### 3.1 Problema Actual
Ambas columnas usan datos de encuesta (exitFactors). 

### 3.2 Corrección
- **Columna Izquierda:** Usar `exitReason` del formulario de registro
- **Columna Derecha:** Usar `exitFactors` + `exitFactorsDetail` de encuesta

### 3.3 Props Correctas

```typescript
interface RevelationCardProps {
  hrHypothesis: {
    reasons: Array<{
      reason: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    totalRecords: number;
  };
  
  surveyReality: {
    factors: Array<{
      factor: string;
      avgSeverity: number;
      mentions: number;
    }>;
    totalResponses: number;
  };
  
  insight: string;
}
```

### 3.4 Calcular hrHypothesis en page.tsx

```typescript
const EXIT_REASON_LABELS: Record<string, string> = {
  'mejor_oportunidad': 'Mejor oportunidad laboral',
  'compensacion': 'Compensación / Sueldo',
  'crecimiento_carrera': 'Falta de crecimiento',
  'balance_vida_trabajo': 'Balance vida-trabajo',
  'mal_clima': 'Mal clima laboral',
  'problemas_liderazgo': 'Problemas con liderazgo',
  'relocalizacion': 'Relocalización geográfica',
  'motivos_personales': 'Motivos personales',
  'otro': 'Otro motivo'
};

function calculateHRHypothesis(exitRecords: ExitRecord[]) {
  const counts: Record<string, number> = {};
  
  exitRecords.forEach(record => {
    const reason = record.exitReason || 'sin_especificar';
    counts[reason] = (counts[reason] || 0) + 1;
  });
  
  const total = exitRecords.length;
  
  return Object.entries(counts)
    .map(([reason, count]) => ({
      reason,
      label: EXIT_REASON_LABELS[reason] || 'Sin especificar',
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
```

### 3.5 Estructura Visual RevelationCard

```tsx
<div className="fhr-card relative">
  {/* Top Line Tesla */}
  <div className="fhr-top-line" />
  
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <Lightbulb className="w-6 h-6 text-cyan-400" />
    <h2 className="fhr-title-card">
      La <span className="fhr-title-gradient">Revelación</span>
    </h2>
  </div>
  
  {/* Grid 2 columnas */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    
    {/* Izquierda: Hipótesis RRHH (barras SLATE) */}
    <div>
      <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
        Hipótesis RRHH
      </h3>
      {hrHypothesis.map(item => (
        <div key={item.reason} className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{item.label}</span>
            <span className="text-slate-500">{item.percentage}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full">
            <div 
              className="h-full bg-slate-500 rounded-full"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500 mt-2">% de registros de salida</p>
    </div>
    
    {/* Derecha: Realidad Encuesta (barras CYAN) */}
    <div className="md:border-l md:border-slate-700 md:pl-8">
      <h3 className="text-sm uppercase tracking-wide text-cyan-400 mb-4">
        Realidad Encuesta
      </h3>
      {surveyReality.map(item => (
        <div key={item.factor} className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{item.factor}</span>
            <span className="text-cyan-400">{item.avgSeverity.toFixed(1)}★</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full">
            <div 
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${(item.avgSeverity / 5) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500 mt-2">Severidad de impacto (1-5)</p>
    </div>
    
  </div>
  
  {/* Insight Box */}
  <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
    <div className="flex gap-3">
      <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      <p className="text-slate-300">{insight}</p>
    </div>
  </div>
</div>
```

---

## TAREA 4: KPI Cards Clickeables

```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
  {kpis.map(kpi => (
    <button
      key={kpi.id}
      onClick={() => setActiveTab(kpi.targetTab)}
      className={`
        fhr-card text-left p-4
        transition-all duration-200
        hover:border-cyan-500/50
        ${activeTab === kpi.targetTab ? 'border-cyan-500' : ''}
      `}
    >
      <div className="flex justify-between items-center">
        <kpi.icon className="w-4 h-4 text-slate-500" />
        <ArrowRight className="w-4 h-4 text-slate-600" />
      </div>
      <p className="text-2xl font-light text-cyan-400 mt-2">{kpi.value}</p>
      <p className="text-sm text-slate-500">{kpi.label}</p>
    </button>
  ))}
</div>
```

---

## VALIDACIÓN FINAL

```yaml
CHECKLIST:
  ☐ Hero con .fhr-hero-title y gradiente PARCIAL
  ☐ Divider ── • ── presente
  ☐ La Revelación con .fhr-top-line
  ☐ Columna izquierda usa exitReason (barras slate)
  ☐ Columna derecha usa exitFactors (barras cyan)
  ☐ Insight generado automáticamente
  ☐ KPI cards clickeables con hover
  ☐ Tabs funcionando
  ☐ Mobile responsive (grid-cols-1 en mobile)
  ☐ Sin errores TypeScript
```

---

## NOTAS IMPORTANTES

1. **NO crear clases CSS nuevas** - Usar solo las de focalizahr-unified.css
2. **NO cambiar lógica de tabs** - Solo visual
3. **Gradiente PARCIAL** - Solo en "Causas" y "Revelación", no en todo
4. **Barras diferenciadas** - Slate para RRHH, Cyan para encuesta
5. **Verificar que exitReason existe** en el modelo ExitRecord de Prisma

---

## COMANDO INICIAL

```bash
# Verificar estructura actual
ls -la src/app/dashboard/exit/causes/
cat src/app/dashboard/exit/causes/page.tsx | head -100
```
