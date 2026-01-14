# 🎯 REDISEÑO EXIT CAUSES - NIVEL UX MUNDIAL
## Alineado 100% con FILOSOFIA_DISENO + GUIA_ESTILOS FocalizaHR

**Versión:** 3.0 DEFINITIVA CON INTELIGENCIA  
**Fecha:** Enero 2026  
**Principio Rector:** "EMOCIÓN → Contexto → Dato → Acción"

---

## 🧠 PROPÓSITO REAL DE ESTA PÁGINA

**NO ES:** Mostrar datos de salidas
**ES:** Revelar la INTELIGENCIA - "Lo que RRHH cree vs Lo que FocalizaHR descubre"

### El AHA Moment que debe provocar:
> "RRHH dice: 'Se van por mejor sueldo'. FocalizaHR descubre: 'Se van huyendo del jefe'. 
> El 100% de las salidas tenían alertas de onboarding ignoradas. La señal estaba ahí."

---

## 📋 DIAGNÓSTICO: Por qué la versión actual NO cumple

| Principio FocalizaHR | Requisito | Estado Actual | Acción |
|---------------------|-----------|---------------|--------|
| Above the fold | Decidir sin scroll | ❌ Solo ve Acto 1 | Resumen ejecutivo arriba |
| Un protagonista | Una pantalla = un mensaje | ❌ 5 actos compiten | Tabs para separar |
| Tipografía | font-light (300) en heroes | ❌ Parece bold | Aplicar .fhr-hero-title |
| Colores | Un protagonista por sección | ❌ Rojo/amarillo/verde juntos | Cyan + badges sutiles |
| Línea Tesla | Signature en cards premium | ❌ No visible | Agregar .fhr-top-line |
| Sistema de diseño | Clases .fhr-* | ❌ Tailwind inline | Migrar a sistema |
| Espaciado | "El silencio comunica" | ❌ Muy denso | gap-8, padding generoso |

---

## 🏗️ ARQUITECTURA: Executive Summary + Tabs

### Concepto UX

```
PATRÓN: "COMMAND CENTER" (de FILOSOFIA_DISENO)
- Above the fold = Resumen ejecutivo para DECIDIR
- Tabs = Drill-down para EXPLORAR
- Un tab activo = Un acto visible = Un protagonista
```

### Estructura de Página

```
/dashboard/exit/causes

├── ABOVE THE FOLD (visible sin scroll)
│   ├── Header con título + navegación
│   ├── Card Diagnóstico Ejecutivo (PROTAGONISTA)
│   └── Strip de 5 KPIs resumen
│
└── BELOW THE FOLD (tabs)
    ├── Tab 1: Factores (ex Acto 1)
    ├── Tab 2: Departamentos (ex Acto 2)
    ├── Tab 3: Talento (ex Acto 3)
    ├── Tab 4: Predicción (ex Acto 4)
    └── Tab 5: ROI (ex Acto 5)
```

---

## 🎨 WIREFRAME DETALLADO

### ABOVE THE FOLD (Sin scroll)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                          ┃
┃  ← Volver                                           [Actualizar] [Vista] ┃
┃                                                                          ┃
┃                    Análisis de Causas                                    ┃
┃                    ────────── • ──────────                               ┃
┃                    Inteligencia profunda sobre por qué se van            ┃
┃                                                                          ┃
┃  ┌────────────────────────────────────────────────────────────────────┐  ┃
┃  │ ▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃ (línea Tesla cyan)    │  ┃
┃  │                                                                    │  ┃
┃  │  💡 LA REVELACIÓN                                                  │  ┃
┃  │                                                                    │  ┃
┃  │  ┌─────────────────────────┐  vs  ┌─────────────────────────┐     │  ┃
┃  │  │ 📋 Lo que dicen         │      │ 🔍 Lo que duele         │     │  ┃
┃  │  │                         │      │                         │     │  ┃
┃  │  │ 1. Compensación    35%  │      │ 1. Liderazgo      4.8★  │     │  ┃
┃  │  │ 2. Crecimiento     28%  │      │ 2. Flexibilidad   4.2★  │     │  ┃
┃  │  │ 3. Flexibilidad    20%  │      │ 3. Autonomía      3.8★  │     │  ┃
┃  │  │                         │      │                         │     │  ┃
┃  │  │ (frecuencia mención)    │      │ (severidad impacto)     │     │  ┃
┃  │  └─────────────────────────┘      └─────────────────────────┘     │  ┃
┃  │                                                                    │  ┃
┃  │  ⚡ INSIGHT CLAVE:                                                 │  ┃
┃  │  "Dicen que es el sueldo, pero los datos muestran que huyen       │  ┃
┃  │   del liderazgo. El 100% tenía alertas de onboarding ignoradas."  │  ┃
┃  │                                                                    │  ┃
┃  └────────────────────────────────────────────────────────────────────┘  ┃
┃                                                                          ┃
┃  PROFUNDIZA EN:  (cards clickeables → tabs)                             ┃
┃                                                                          ┃
┃  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ┃
┃  │   3.2   →│ │    2    →│ │   19%   →│ │  100%   →│ │  $96M   →│       ┃
┃  │ Severidad│ │  Focos   │ │ Talento  │ │Predecible│ │  Costo   │       ┃
┃  │ promedio │ │ tóxicos  │ │  clave   │ │          │ │ inacción │       ┃
┃  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       ┃
┃       ↓            ↓            ↓            ↓            ↓             ┃
┃   Factores    Deptos      Talento    Predicción     ROI                ┃
┃                                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🆕 COMPONENTE CLAVE: RevelationCard

### Propósito
Este es el componente que diferencia FocalizaHR de la competencia. 
Muestra el CONTRASTE entre lo que la empresa cree y lo que los datos revelan.

### Wireframe Detallado

```
┌────────────────────────────────────────────────────────────────────────┐
│ ▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃ (línea Tesla cyan)       │
│                                                                        │
│  💡 LA REVELACIÓN                                                      │
│     Lo que dicen vs lo que duele                                       │
│                                                                        │
│  ┌─────────────────────────┐      ┌─────────────────────────┐         │
│  │                         │      │                         │         │
│  │  📋 LO QUE DICEN        │  VS  │  🔍 LO QUE DUELE        │         │
│  │                         │      │                         │         │
│  │  Compensación      35%  │      │  Liderazgo        4.8★  │         │
│  │  ████████████░░░░       │      │  ████████████████░░     │         │
│  │                         │      │                         │         │
│  │  Crecimiento       28%  │      │  Flexibilidad     4.2★  │         │
│  │  █████████░░░░░░░       │      │  ██████████████░░░░     │         │
│  │                         │      │                         │         │
│  │  Flexibilidad      20%  │      │  Autonomía        3.8★  │         │
│  │  ██████░░░░░░░░░░       │      │  ████████████░░░░░░     │         │
│  │                         │      │                         │         │
│  │  (% de menciones)       │      │  (severidad 1-5)        │         │
│  │                         │      │                         │         │
│  └─────────────────────────┘      └─────────────────────────┘         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ⚡ INSIGHT CLAVE:                                                 │ │
│  │                                                                   │ │
│  │ "Dicen que es el sueldo (35%), pero los datos muestran que      │ │
│  │  huyen del liderazgo (severidad 4.8). El 100% de las salidas    │ │
│  │  tenían alertas de onboarding ignoradas."                        │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Props del Componente

```typescript
interface RevelationCardProps {
  // Lo que la empresa cree (frecuencia de mención)
  whatTheySay: {
    factors: Array<{
      name: string;
      percentage: number; // % de menciones
    }>;
  };
  
  // Lo que FocalizaHR descubre (severidad real)
  whatHurts: {
    factors: Array<{
      name: string;
      severity: number; // 1-5 escala
    }>;
  };
  
  // El insight generado por inteligencia
  keyInsight: string;
  
  // Dato de onboarding correlation (opcional)
  onboardingCorrelation?: {
    percentage: number; // % con alertas ignoradas
    alertsIgnored: number;
  };
}
```

### Lógica de Negocio

```typescript
// Algoritmo para generar insight automático
function generateInsight(whatTheySay, whatHurts, onboardingCorrelation) {
  const topMentioned = whatTheySay.factors[0];
  const topSeverity = whatHurts.factors[0];
  
  // Si el más mencionado NO es el más severo = REVELACIÓN
  if (topMentioned.name !== topSeverity.name) {
    return `Dicen que es "${topMentioned.name}" (${topMentioned.percentage}%), ` +
           `pero los datos muestran que huyen de "${topSeverity.name}" ` +
           `(severidad ${topSeverity.severity}). ` +
           (onboardingCorrelation 
             ? `El ${onboardingCorrelation.percentage}% tenía alertas de onboarding ignoradas.`
             : '');
  }
  
  // Si coinciden = confirmar
  return `"${topMentioned.name}" es el factor dominante tanto en menciones ` +
         `(${topMentioned.percentage}%) como en severidad (${topSeverity.severity}). ` +
         `El problema está claramente identificado.`;
}
```

---

## 🔗 KPI Cards Clickeables

### Comportamiento

Cada card KPI es clickeable y navega al tab correspondiente:

```typescript
interface KPICardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  targetTab: 'factores' | 'deptos' | 'talento' | 'prediccion' | 'roi';
  onClick: (tab: string) => void;
}

// Uso
<KPICard 
  value="3.2" 
  label="Severidad promedio"
  icon={<TrendingUp />}
  targetTab="factores"
  onClick={() => setActiveTab('factores')}
/>
```

### Indicador Visual de Clickeable

```css
/* Card clickeable */
.kpi-card-clickeable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.kpi-card-clickeable:hover {
  transform: translateY(-2px);
  border-color: var(--fhr-cyan);
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.2);
}

/* Flecha indicadora */
.kpi-card-arrow {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.kpi-card-clickeable:hover .kpi-card-arrow {
  opacity: 1;
}
```

---

## 🏗️ ARQUITECTURA: Revelation + Summary + Tabs

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                          ┃
┃  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            ┃
┃  │Factores │ │ Deptos  │ │ Talento │ │Predicción│ │   ROI   │            ┃
┃  │ ━━━━━━━ │ │         │ │         │ │         │ │         │            ┃
┃  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            ┃
┃                                                                          ┃
┃  ┌────────────────────────────────────────────────────────────────────┐  ┃
┃  │                                                                    │  ┃
┃  │              CONTENIDO DEL TAB ACTIVO                              │  ┃
┃  │                                                                    │  ┃
┃  │              (Ver especificación por tab abajo)                    │  ┃
┃  │                                                                    │  ┃
┃  └────────────────────────────────────────────────────────────────────┘  ┃
┃                                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 📑 ESPECIFICACIÓN POR TAB

### TAB 1: FACTORES (ex "La Verdad Destilada")

**Pregunta que responde:** "¿Qué los hace irse realmente?"

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  La Verdad Destilada                                                   │
│  Lo que dicen vs lo que duele                                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 💡 No hay factores con severidad crítica (≥3.5). "Autonomía"    │  │
│  │    es lo más mencionado pero no representa una herida profunda.  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  FACTORES POR SEVERIDAD                                                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Autonomía y Confianza                          15x       3.2   │  │
│  │  ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Flexibilidad y Equilibrio                      14x       3.4   │  │
│  │  ██████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Oportunidades de Crecimiento                   12x       3.0   │  │
│  │  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [▸ Ver metodología de clasificación]                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Cambios de diseño:**
- Barra de progreso en CYAN (no múltiples colores)
- Badge de frecuencia sutil (slate-600 background)
- Severidad como número, no color
- Sin categorías "Lo que duele" / "Ruido" visualmente agresivas
- Colapsable para metodología

---

### TAB 2: DEPARTAMENTOS (ex "Mapa del Dolor")

**Pregunta que responde:** "¿Dónde están los focos?"

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Mapa del Dolor                                                        │
│  ¿Se quema toda la empresa o son focos aislados?                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 💡 2 departamentos son focos tóxicos (severidad ≥4.0).          │  │
│  │    No es un problema generalizado.                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  FOCOS DE ATENCIÓN                                                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ▌Desarrollo Software                                        4.1 │  │
│  │ │ 3 salidas · Gerencia de Tecnología                            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ▌Subgerencia Compensaciones                                 4.0 │  │
│  │ │ 3 salidas · Gerencia de Personas                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [▸ Ver todos los departamentos (5)]                                   │
│                                                                        │
│  Cuando expande:                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │   GERENCIA DE PERSONAS          4 salidas                   3.8 │  │
│  │   NUTRICION                     3 salidas                   3.0 │  │
│  │   Gerencia de Operaciones       5 salidas                   2.8 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Cambios de diseño:**
- Borde izquierdo CYAN para focos (no rojo agresivo)
- Severidad en texto, no barra de color
- Sin badges de colores rojo/amarillo/verde
- Progressive disclosure: solo focos visibles inicialmente
- Leyenda de colores ELIMINADA (no necesaria)

---

### TAB 3: TALENTO (ex "Drenaje de Talento")

**Pregunta que responde:** "¿Perdimos grasa o músculo?"

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Drenaje de Talento                                                    │
│  ¿Perdimos grasa o músculo?                                           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 💡 El 19% de las salidas fueron talento clave. Aunque no es     │  │
│  │    crítico, cada pérdida estratégica tiene alto impacto.        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│                         ┌─────────────┐                                │
│                         │             │                                │
│                         │    19%      │                                │
│                         │   Talento   │                                │
│                         │    Clave    │                                │
│                         │             │                                │
│                         └─────────────┘                                │
│                          (Donut cyan/slate)                            │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Pérdida Estratégica      4 personas                       19%  │  │
│  │  Pérdida Estándar         4 personas                       19%  │  │
│  │  Rotación Sana           13 personas                       62%  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Cambios de diseño:**
- Donut en CYAN y SLATE (no rojo/amarillo/verde)
- KPI central destacado
- Leyenda abajo como lista simple
- Sin emojis 🔴🟡🟢 (no profesional según guía)
- Texto descriptivo en vez de colores semánticos

---

### TAB 4: PREDICCIÓN (ex "Crónica Anunciada")

**Pregunta que responde:** "¿El sistema avisó?"

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Crónica Anunciada                                                     │
│  ¿El sistema avisó y no actuamos?                                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │                          100%                                    │  │
│  │                       PREDECIBLE                                 │  │
│  │                                                                  │  │
│  │         de las salidas tenían alertas sin gestionar              │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │    2     │ │    2     │ │   1.5    │ │    0     │                  │
│  │ Con Onb. │ │Ignoradas │ │Prom. Ign │ │Prom. Ges │                  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 💡 La oportunidad está en ACTUAR sobre las alertas,              │  │
│  │    no en generar más datos.                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Cambios de diseño:**
- KPI "100%" en CYAN grande (no rojo)
- Métricas secundarias en cards slate
- Insight como conclusión, no como alerta roja

---

### TAB 5: ROI (ex "Contexto y ROI")

**Pregunta que responde:** "¿Cuánto cuesta no actuar?"

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Contexto y ROI                                                        │
│  Impacto financiero y comparación de mercado                          │
│                                                                        │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                             │  │                                 │  │
│  │  COSTO DE INACCIÓN          │  │  TU SEVERIDAD VS MERCADO        │  │
│  │                             │  │                                 │  │
│  │       $96M                  │  │  Tú      ████████████░░  3.2    │  │
│  │        CLP                  │  │  Mercado ████████░░░░░░  2.8    │  │
│  │                             │  │                                 │  │
│  │  4 salidas talento clave    │  │  Diferencia: +0.4               │  │
│  │  × 125% salario anual       │  │                                 │  │
│  │                             │  │                                 │  │
│  │  Metodología: SHRM 2024     │  │                                 │  │
│  │                             │  │                                 │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 💡 Tu severidad (3.2) supera al mercado (2.8). No es el         │  │
│  │    mercado, hay oportunidad de mejora interna.                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Cambios de diseño:**
- Monto en CYAN grande (no rojo)
- Barra comparativa en cyan/slate
- Grid de 2 columnas
- Insight como conclusión

---

## 🎨 ESPECIFICACIÓN DE ESTILOS

### Clases .fhr-* a Utilizar

```tsx
// Página completa
<div className="fhr-bg-main">
  <div className="fhr-content">
    
    // Header
    <div className="fhr-hero">
      <h1 className="fhr-hero-title">
        Análisis de <span className="fhr-title-gradient">Causas</span>
      </h1>
      <div className="fhr-divider">
        <div className="fhr-divider-line"></div>
        <div className="fhr-divider-dot"></div>
        <div className="fhr-divider-line"></div>
      </div>
    </div>
    
    // Card protagonista con línea Tesla
    <div className="fhr-card relative">
      <div className="fhr-top-line"></div>
      {/* contenido */}
    </div>
    
    // KPIs
    <div className="fhr-card-metric">
      {/* número grande + label */}
    </div>
    
    // Tabs
    <Tabs className="fhr-tabs">
      <TabsList className="fhr-tabs-list">
        <TabsTrigger className="fhr-tabs-trigger">
      </TabsList>
    </Tabs>
    
  </div>
</div>
```

### Paleta de Colores (SIMPLIFICADA)

```css
/* PROTAGONISTAS (usar estos) */
--fhr-cyan: #22D3EE;        /* Interacciones, destacados, barras */
--fhr-text-primary: #E2E8F0; /* Texto principal */
--fhr-text-secondary: #94A3B8; /* Texto secundario */
--fhr-bg-card: rgba(30, 41, 59, 0.9); /* Cards */

/* SEMÁNTICOS (usar con moderación, solo en badges pequeños) */
--fhr-warning: #F59E0B;     /* Solo para alertas críticas */
--fhr-error: #EF4444;       /* Solo para errores */
--fhr-success: #10B981;     /* Solo para confirmaciones */

/* REGLA: Un color protagonista por sección = CYAN */
```

### Tipografía

```css
/* Heroes = font-light (300) - OBLIGATORIO */
.fhr-hero-title {
  font-weight: 300;
  font-size: 2.5rem; /* 40px */
}

/* Secciones = font-semibold (600) */
.fhr-title-section {
  font-weight: 600;
  font-size: 1.25rem; /* 20px */
}

/* Body = font-normal (400) */
.fhr-text {
  font-weight: 400;
  font-size: 1rem; /* 16px */
}

/* KPIs = font-light (300) números grandes */
.fhr-kpi-number {
  font-weight: 300;
  font-size: 3rem; /* 48px */
}
```

### Espaciado (Generoso)

```css
/* Entre secciones principales */
gap: 2rem; /* 32px - gap-8 */

/* Dentro de cards */
padding: 1.5rem; /* 24px - p-6 */

/* Entre elementos en lista */
gap: 1rem; /* 16px - gap-4 */
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### Estructura Nueva

```
src/app/dashboard/exit/causes/
├── page.tsx                    # Página principal con tabs
└── components/
    ├── ExecutiveSummary.tsx    # Card diagnóstico + KPIs
    ├── KPIStrip.tsx            # Strip de 5 KPIs
    ├── FactorsTab.tsx          # Tab 1: Factores
    ├── DepartmentsTab.tsx      # Tab 2: Departamentos
    ├── TalentTab.tsx           # Tab 3: Talento
    ├── PredictionTab.tsx       # Tab 4: Predicción
    └── ROITab.tsx              # Tab 5: ROI
```

### Archivos a Eliminar

```
src/components/exit/causes/
├── TruthScatterChart.tsx       # ELIMINAR
├── PainHeatmap.tsx             # ELIMINAR
├── TalentDrainDonut.tsx        # MANTENER (ajustar)
├── PredictabilityTimeline.tsx  # ELIMINAR
└── ROIBenchmarkCard.tsx        # MANTENER (ajustar)
```

---

## ✅ CHECKLIST FINAL

### Filosofía FocalizaHR

- [ ] ¿Entiende en 3 segundos? (Diagnóstico ejecutivo visible)
- [ ] ¿Decide en 10 segundos? (KPIs claros)
- [ ] ¿Actúa en 1 clic? (Tabs para profundizar)
- [ ] ¿Above the fold permite decidir? (Resumen sin scroll)

### Diseño Visual

- [ ] ¿Tipografía hero es font-light (300)?
- [ ] ¿Tiene línea Tesla en card principal?
- [ ] ¿Tiene divider ── • ── bajo título?
- [ ] ¿Gradiente solo en PARTE del título?
- [ ] ¿Un color protagonista (cyan)?
- [ ] ¿Espaciado generoso (gap-8)?

### Sistema de Diseño

- [ ] ¿Usa clases .fhr-* del sistema?
- [ ] ¿Sin Tailwind inline excesivo?
- [ ] ¿Cards usan .fhr-card?
- [ ] ¿Botones usan .fhr-btn-*?

### Responsive

- [ ] ¿Funciona en 375px?
- [ ] ¿Touch targets 44px+?
- [ ] ¿Tabs se adaptan a mobile?

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. **Crear estructura de tabs** en page.tsx
2. **Implementar ExecutiveSummary** con línea Tesla
3. **Implementar KPIStrip** con 5 métricas
4. **Migrar cada tab** uno por uno
5. **Aplicar clases .fhr-*** en todo
6. **Eliminar colores semánticos** agresivos
7. **Testing responsive** en todos los breakpoints
8. **Validar checklist** completo

---

**Filosofía FocalizaHR:** "Cada píxel debe ganarse su lugar"

> "FocalizaHR no muestra datos. FocalizaHR guía decisiones."
