---
name: focalizahr-design
description: |
  OBLIGATORIO para TODO componente frontend en FocalizaHR.
  Triggers: "crea", "diseña", "estiliza", "componente", "card", "botón",
  "dashboard", "página", "formulario", "modal", "UI", "frontend",
  "Cinema Mode", "Smart Router", "flujo guiado", "Guided Intelligence",
  "narrativa", "hallazgos", "checkpoint", "compensación".
  REEMPLAZA completamente la skill frontend-design genérica.
---

# 🎨 FOCALIZAHR DESIGN SKILL

> **OBLIGATORIO** para TODO componente frontend en FocalizaHR.
> Leer ANTES de crear cualquier página, componente, card, botón o elemento UI.

---

## 🧭 REFERENCIA VISUAL CANÓNICA OBLIGATORIA

**`src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationPortada.tsx`** es el **patrón maestro**.

Antes de crear cualquier componente nuevo, leer ese archivo y replicar:

- **Tesla line superior** — `absolute top-0 h-[2px]` con gradient `transparent → #22D3EE → #A78BFA → transparent` y `opacity: 0.7`
- **Word-split de títulos** — primera palabra en `text-white font-extralight`, segunda en `fhr-title-gradient`
- **Container glassmorphism** — `rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden`
- **PremiumButton para CTAs** — `<PrimaryButton>` / `<SecondaryButton>` de `@/components/ui/PremiumButton`. Nunca botones custom con `style={{borderColor, background}}` inline
- **Número hero** — `text-[72px] font-extralight tabular-nums text-white leading-[0.9]` (centrado cuando aplica)

> Si el diagnóstico de un componente nuevo dice "no se parece a FocalizaHR", la causa casi siempre es omitir uno de estos 5 elementos.

---

## 🎯 CUÁNDO USAR ESTA SKILL

```yaml
SIEMPRE para:
  - Crear páginas de dashboard
  - Crear componentes React
  - Estilizar cards, botones, badges
  - Implementar fondos y títulos
  - Cualquier elemento visual

TRIGGERS:
  - "crea componente/página/card/botón"
  - "diseña/estiliza/formatea"
  - "dashboard/formulario/modal"
```

---

## 📚 ARCHIVOS DE REFERENCIA

| Archivo | Cuándo Consultar |
|---------|------------------|
| `references/page-patterns.md` | **SIEMPRE PRIMERO** - Los 7+1 Patrones UX |
| `references/cinema-mode.md` | **Para flujos guiados** - Smart Router + Cinema Mode completo |
| `references/guided-intelligence.md` | **Para hallazgos complejos** - Patrón G: Narrativa + Evidencia + Acción |
| `references/executive-portadas.md` | **Para landing cards** - Split 35/65, color semántico, CTA dinámico |
| `references/css-classes.md` | Para usar clases `.fhr-*` |
| `references/premium-components.md` | Para Línea Tesla, Glassmorphism, Gauges |
| `references/anti-patterns.md` | Para verificar qué NO hacer |
| `→ SKILL focalizahr-notificaciones` | **Para CUALQUIER toast/feedback al usuario** - Nunca usar shadcn `use-toast` |
| `MANIFIESTO_FOCALIZAHR_v5.md` | **ANTES de elegir patrón** - Principios 7, 8 y 13: gravedad, personas, contexto |
| `references/empty-states.md` | **SIEMPRE** cuando un componente puede no tener datos — reemplaza todo `return null` |
---

## ⚡ QUICK REFERENCE - COPIAR Y PEGAR

### Estructura de Página Estándar

```tsx
export default function MiPagina() {
  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
        
        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="fhr-hero-title text-2xl md:text-3xl">
              Título de{' '}
              <span className="fhr-title-gradient">Página</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Descripción breve de la página
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton icon={Plus}>Acción</SecondaryButton>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="fhr-card p-6">
          {/* Tu contenido aquí */}
        </div>

      </div>
    </div>
  )
}
```

### Variables CSS Corporativas

```css
/* Colores Principales */
--focalizahr-cyan: #22D3EE
--focalizahr-purple: #A78BFA

/* Estados */
--focalizahr-success: #10B981
--focalizahr-warning: #F59E0B
--focalizahr-error: #EF4444

/* Fondos */
--focalizahr-slate-900: #0f172a
--focalizahr-slate-800: #1e293b
```

### Clases Esenciales

| Clase | Uso |
|-------|-----|
| `fhr-bg-main` | Fondo principal página |
| `fhr-title-gradient` | Texto con gradiente cyan→purple |
| `fhr-hero-title` | Título grande (text-2xl md:text-3xl) |
| `fhr-card` | Card con glassmorphism |
| `fhr-glass-card` | Card premium (blur-24px) |
| `fhr-btn-primary` | Botón principal (cyan) |
| `fhr-btn-secondary` | Botón secundario (outline) |

### Línea Tesla (Card Premium)

```tsx
{/* Agregar dentro de fhr-card con position: relative */}
<div
  className="absolute top-0 left-0 right-0 h-[2px]"
  style={{
    background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
    boxShadow: '0 0 20px #22D3EE',
  }}
/>
```

### Word Split en Títulos (Obligatorio)

```tsx
// Primera palabra/línea en WHITE, segunda en GRADIENT
<h2 className="text-3xl font-extralight text-white">Checkpoint</h2>
<h3 className="text-2xl fhr-title-gradient">pre-compensación</h3>

// O en una línea
<h1 className="text-2xl md:text-3xl font-extralight text-white">
  Torre de{' '}
  <span className="fhr-title-gradient">Control Estratégico</span>
</h1>
```

### Jerarquía de Portada

```yaml
Título principal:    text-3xl font-extralight text-white
Subtítulo gradient:  text-2xl fhr-title-gradient  
Número protagonista: text-[72px] font-extralight text-white (NO cyan)
Narrativa:           text-base text-slate-400 font-light
```

### Breakpoints Mobile-First

```css
/* Base: 320px+ (mobile) */
/* sm: 640px+ (tablet) */
/* md: 1024px+ (desktop) */
/* lg: 1280px+ (large) */

/* Ejemplo */
className="px-4 py-6 md:px-8 md:py-10"
className="text-2xl md:text-3xl"
className="flex-col md:flex-row"
```

### Cinema Mode (Flujos Guiados)

```tsx
// Estructura básica - Ver references/cinema-mode.md para detalle completo

// 1. LOBBY (MissionControl): Gauge + CTA único
<MissionControl
  stats={{ total: 10, completed: 8 }}
  nextEmployee={{ id: '123', displayName: 'Claudia P.' }}
  onSelect={handleSelect}
/>

// 2. SPOTLIGHT (SpotlightCard): Detalle de persona
<SpotlightCard
  employee={selectedEmployee}
  onBack={handleBack}
/>

// 3. RAIL (colapsable): Lista horizontal
<Rail
  employees={employees}
  isExpanded={isRailExpanded}
  onToggle={toggleRail}
  onSelect={handleSelect}
/>
```

**Regla de narrativa Cinema Mode:**
```tsx
// Nombre en CYAN, métricas en PURPLE
<p className="text-2xl font-light text-white">
  <span className="text-cyan-400 font-medium">{firstName}</span>
  {' obtuvo '}
  <span className="text-purple-400 font-medium">{score}</span>
  {' en su evaluación.'}
</p>
```

### Guided Intelligence (Hallazgos Complejos)

```tsx
// Estructura básica - Ver references/guided-intelligence.md para detalle

// 1. HEADER: Contexto + Título split + Subtítulo al lado
<div className="contexto">
  <span className="text-[10px] uppercase tracking-widest text-slate-500">
    Metas × Performance
  </span>
  <div className="flex items-start justify-between gap-8">
    <div>
      <h2 className="text-2xl font-extralight text-white">
        Checkpoint{' '}
        <span className="fhr-title-gradient">pre-compensación</span>
      </h2>
    </div>
    <p className="text-slate-400 font-light text-sm max-w-xs">
      11 personas con discrepancia mérito vs evaluación
    </p>
  </div>
</div>

// 2. PERSPECTIVAS: Tabs underline (no pills)
<div className="flex gap-6 border-b border-slate-700/50">
  {['Mérito', 'Bonos', 'Señales'].map(tab => (
    <button className={`pb-2 text-sm ${
      activeTab === tab 
        ? 'text-cyan-400 border-b-2 border-cyan-400' 
        : 'text-slate-500'
    }`}>
      {tab}
    </button>
  ))}
</div>

// 3. CATEGORÍAS: Cards con número grande + auto-selección
<div className="grid grid-cols-4 gap-3">
  {categories.map(cat => (
    <button className={`p-4 rounded-lg text-center ${
      selected === cat.id
        ? 'bg-slate-800/80 border border-cyan-500/30'
        : 'bg-slate-800/40 border border-slate-700/50'
    }`}>
      <span className={`text-3xl font-extralight ${
        selected === cat.id ? 'text-cyan-400' : 'text-slate-500'
      }`}>
        {cat.count}
      </span>
      <p className="text-xs text-slate-400 mt-1">{cat.label}</p>
    </button>
  ))}
</div>

// 4. SPLIT: Narrativa izq | Evidencia der
<div className="grid grid-cols-2 gap-6">
  {/* Narrativa */}
  <div className="space-y-4">
    <div>
      <span className="text-[11px] text-slate-400">— La observación</span>
      <p className="text-slate-300 font-light mt-1">
        El jefe de esta persona fue clasificado como <b>Mano Blanda</b>...
      </p>
    </div>
    <div className="border-l-2 border-gradient-to-b from-cyan-500 to-purple-500 pl-4">
      <span className="text-[11px] text-slate-400">— La decisión de valor</span>
      <p className="text-slate-300 font-light mt-1">
        <b>¿Confías en esta evaluación?</b> ¿O necesitas calibrar?
      </p>
    </div>
  </div>
  
  {/* Evidencia */}
  <div>
    <span className="text-[10px] uppercase tracking-widest text-slate-500">
      3 personas en esta categoría
    </span>
    {/* Lista de personas con tags */}
  </div>
</div>

// 5. ACCIÓN: Email a RRHH
<button className="fhr-btn-secondary">Enviar a RRHH</button>
```

**Regla Guided Intelligence:**
```tsx
// Narrativa SIEMPRE antes de lista
// Auto-selección de categoría más crítica
// Labels de sección VISIBLES (11px, slate-400)
// Segunda variable conecta con motores existentes
```

---

## 🏛️ LOS 8 MANDAMIENTOS

1. **Jerarquía Absoluta** - El ojo tiene UN camino claro
2. **Above the Fold = Decisión** - CTA visible sin scroll
3. **Un Solo CTA Principal** - Solo 1 botón Primary por vista
4. **Mobile-First Obligatorio** - Base 320px, escala hacia arriba
5. **Progressive Disclosure** - Mostrar esencial, revelar bajo demanda
6. **Feedback Inmediato** - Toda acción responde < 100ms
7. **Consistencia Absoluta** - Mismo problema = misma solución visual
8. **Narrativa Antes de Dato** - Cuando la complejidad es el valor, el usuario lee ANTES de ver nombres

---

## 🎨 ADN VISUAL FOCALIZAHR

```
🍎 APPLE (Minimalismo)
   └─ Glassmorphism, espacios negativos, cero emojis

🚗 TESLA (Telemetría)
   └─ Gauges, datos de UN vistazo, cyan glow

🎯 FOCALIZA (Liderazgo Guiado)
   └─ "Tu Misión Hoy", CTAs dinámicos, coaching tips
```

---

## ✅ CHECKLIST PRE-ENTREGA

```yaml
ESTRUCTURA:
  □ ¿Usa fhr-bg-main como fondo?
  □ ¿Títulos usan fhr-title-gradient?
  □ ¿Cards usan fhr-card o fhr-glass-card?
  □ ¿Max-width apropiado (max-w-5xl)?

MOBILE-FIRST:
  □ ¿Funciona en 320px?
  □ ¿Breakpoints md: para desktop?
  □ ¿Padding responsive (px-4 md:px-8)?

UX:
  □ ¿Solo 1 CTA principal visible?
  □ ¿Loading states implementados?
  □ ¿Empty states usan FHREmptyState? → Ver references/empty-states.md

PATRONES:
  □ ¿Sigue alguno de los 7 patrones UX?
  □ ¿NO usa anti-patrones prohibidos?
  MANIFIESTO:
  □ ¿La gravedad de la decisión justifica el patrón elegido? (P8)
  □ ¿Las personas se tratan como personas, no como filas? (P7)
  □ ¿La profundidad y momento de exposición están definidos en el spec? (P13)
```

---

## 📖 DOCUMENTACIÓN COMPLETA

Para casos complejos, consultar en Project Knowledge:
- `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` - Patrones de página completos
- `FILOSOFIA_UX_SMART_ROUTER_v1_0.md` - Los 7 patrones UX detallados
- `📬 SISTEMA DE NOTIFICACIONES FOCALIZAHR.docx` - CSS completo

