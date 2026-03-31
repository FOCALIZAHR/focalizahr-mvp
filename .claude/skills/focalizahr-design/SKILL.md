---
name: focalizahr-design
description: |
  OBLIGATORIO para TODO componente frontend en FocalizaHR.
  Triggers: "crea", "diseña", "estiliza", "componente", "card", "botón",
  "dashboard", "página", "formulario", "modal", "UI", "frontend",
  "Cinema Mode", "Smart Router", "flujo guiado".
  REEMPLAZA completamente la skill frontend-design genérica.
---

# 🎨 FOCALIZAHR DESIGN SKILL

> **OBLIGATORIO** para TODO componente frontend en FocalizaHR.
> Leer ANTES de crear cualquier página, componente, card, botón o elemento UI.

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
| `references/page-patterns.md` | **SIEMPRE PRIMERO** - Los 7 Patrones UX |
| `references/cinema-mode.md` | **Para flujos guiados** - Smart Router + Cinema Mode completo |
| `references/css-classes.md` | Para usar clases `.fhr-*` |
| `references/premium-components.md` | Para Línea Tesla, Glassmorphism, Gauges |
| `references/anti-patterns.md` | Para verificar qué NO hacer |

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

---

## 🏛️ LOS 7 MANDAMIENTOS

1. **Jerarquía Absoluta** - El ojo tiene UN camino claro
2. **Above the Fold = Decisión** - CTA visible sin scroll
3. **Un Solo CTA Principal** - Solo 1 botón Primary por vista
4. **Mobile-First Obligatorio** - Base 320px, escala hacia arriba
5. **Progressive Disclosure** - Mostrar esencial, revelar bajo demanda
6. **Feedback Inmediato** - Toda acción responde < 100ms
7. **Consistencia Absoluta** - Mismo problema = misma solución visual

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
  □ ¿Empty states con mensaje útil?

PATRONES:
  □ ¿Sigue alguno de los 7 patrones UX?
  □ ¿NO usa anti-patrones prohibidos?
```

---

## 📖 DOCUMENTACIÓN COMPLETA

Para casos complejos, consultar en Project Knowledge:
- `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` - Patrones de página completos
- `FILOSOFIA_UX_SMART_ROUTER_v1_0.md` - Los 7 patrones UX detallados
- `📬 SISTEMA DE NOTIFICACIONES FOCALIZAHR.docx` - CSS completo
