# 📐 PATRONES DE PÁGINA - UX FOCALIZAHR

> Basado en `FILOSOFIA_UX_SMART_ROUTER_v1_0.md`
> Ejemplos extraídos de código REAL del proyecto

---

## 🎯 FILOSOFÍA CENTRAL

**No construimos formularios. Construimos historias guiadas.**

```
ANTES (Software RRHH Tradicional):
Usuario → Tabla gigante → Busca → Filtra → ¿Qué hago? → Abandona

DESPUÉS (FocalizaHR Smart Router):
Usuario → Ve SU misión → UN botón → Clic → Acción completada → Siguiente
```

---

## 📋 LOS 7 PATRONES UX

| # | Patrón | Fase | Propósito |
|---|--------|------|-----------|
| 1 | **Smart Router (Hub)** | Encontrar | Gauge + CTA único sugerido |
| 2 | **Rail Colapsable** | Encontrar | Complejidad oculta estilo Netflix |
| 3 | **Landing Cards** | Crear | Contexto antes de formulario |
| 4 | **Wizard Aislado** | Crear | Paso a paso, 1 card a la vez |
| 5 | **Micro-Copy Ejecutivo** | Todas | Textos humanizados + tips |
| 6 | **Executive Dashboard** | Seguimiento | Split 30/70 con acción mutable |
| 7 | **Pantallas de Guía** | Transiciones | Confirmaciones limpias |

---

## PATRÓN 1: SMART ROUTER (HUB)

**Propósito:** La pantalla principal NO es una tabla. Es un Centro de Mando con UN botón gigante sugerido por el sistema.

### Estructura

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃   HEADER (Título + Botones)                                     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                 ┃
┃   ┌─────────────┐      ┌────────────────────────────────────┐   ┃
┃   │             │      │                                    │   ┃
┃   │    GAUGE    │      │  Tu próxima misión:                │   ┃
┃   │    80%      │      │                                    │   ┃
┃   │   8/10      │      │  ╔════════════════════════════╗    │   ┃
┃   │             │      │  ║   [CTA ÚNICO CYAN GLOW]   ║    │   ┃
┃   └─────────────┘      │  ╚════════════════════════════╝    │   ┃
┃                        └────────────────────────────────────┘   ┃
┃                                                                 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃   RAIL COLAPSABLE (Ver más ▼)                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Ejemplo Real: `metas/estrategia/page.tsx`

```tsx
<div className="fhr-bg-main min-h-screen">
  <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">

    {/* HEADER */}
    <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 className="fhr-hero-title text-2xl md:text-3xl">
          Torre de{' '}
          <span className="fhr-title-gradient">Control Estratégico</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Visualiza cómo las metas se conectan con la estrategia
        </p>
      </div>
      <div className="flex items-center gap-3">
        <GhostButton icon={Settings2}>Configurar</GhostButton>
        <SecondaryButton icon={Plus}>Nueva Meta</SecondaryButton>
      </div>
    </div>

    {/* HERO: Gauge + Narrativa + CTAs */}
    <ExecutiveHero
      report={report}
      orphanCount={orphans.length}
      onViewTeam={handleViewTeam}
    />

    {/* RAIL: Contenido colapsable */}
    <div className="mt-8">
      <CorporateGoalsRail goals={corporateGoals} />
    </div>

  </div>
</div>
```

---

## PATRÓN 2: RAIL COLAPSABLE

**Propósito:** Las listas NUNCA invaden la pantalla. Se presentan como carrusel colapsable estilo Netflix.

### Ejemplo Real: Filtros con Pills

```tsx
{/* Filters */}
<div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
  {FILTER_OPTIONS.map(opt => (
    <button
      key={opt.value}
      onClick={() => setFilter(opt.value)}
      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
        filter === opt.value
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
      }`}
    >
      {opt.label}
    </button>
  ))}
</div>
```

### Reglas de Pills

- Máximo 4 pills visibles
- Cada pill muestra contador: `[Todos 10] [Pendientes 2] [Completados 8]`
- Colapsado por defecto
- Scroll horizontal en mobile

---

## PATRÓN 3: LANDING CARDS

**Propósito:** Antes de lanzar a un formulario, dar contexto de dónde está parado el usuario.

### Estructura

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [ICONO GRANDE]                           │
│                                                             │
│                  María García Soto                          │
│              Analista Senior · Comercial                    │
│              2 años 3 meses en la empresa                   │
│                                                             │
│   ─────────────────────────────────────────────────────     │
│                                                             │
│          ●────────────────●────────────────○                │
│         ED              PT              PDI                 │
│       (hecho)        (hecho)        (pendiente)             │
│                                                             │
│   ─────────────────────────────────────────────────────     │
│                                                             │
│              Tu misión ahora es crear su                    │
│              Plan de Desarrollo Individual.                 │
│                                                             │
│         ╔═══════════════════════════════════╗               │
│         ║      Iniciar Plan de Desarrollo   ║               │
│         ╚═══════════════════════════════════╝               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CTA Dinámico Según Estado

| Estado | Mensaje | CTA |
|--------|---------|-----|
| Sin Evaluación | "María aún no tiene evaluación" | `Iniciar Evaluación` |
| Sin Potencial | "Tu misión es evaluar su potencial" | `Evaluar Potencial` |
| Sin PDI | "Tu misión es crear su Plan" | `Crear Plan` |
| Completo | "María tiene todo completo" | `Ver Resumen` |

---

## PATRÓN 4: WIZARD AISLADO

**Propósito:** Paso a paso con UNA sola tarjeta visible a la vez. El usuario no ve el menú lateral.

### Reglas

```yaml
✅ OBLIGATORIO:
  - Indicador "Paso X de Y"
  - 1 sola card visible
  - Navegación Anterior/Siguiente
  - Sin menú lateral visible
  - Foco total en la tarea

❌ PROHIBIDO:
  - Mostrar todos los pasos a la vez
  - Formularios largos scrolleables
  - Múltiples acciones compitiendo
```

### Diferencia Wizard vs Flow Guide

| Wizard | Flow Guide |
|--------|------------|
| Crea algo nuevo | Guía entre opciones existentes |
| Aislado del mundo | Mantiene contexto visible |
| Lineal estricto | Permite saltar pasos |

---

## PATRÓN 5: LANDING + MISSION (Portada)

**Propósito:** Página de entrada que orienta según contexto y rol.

### Estructura

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                              ┃
┃                  BIENVENIDA AL PRODUCTO                      ┃
┃                  Descripción breve 1 línea                   ┃
┃                                                              ┃
┃  ╔════════════════════════════════════════════════════════╗  ┃
┃  ║                  TU MISIÓN HOY                         ║  ┃
┃  ║                                                        ║  ┃
┃  ║  [Acción principal contextualizada al rol/estado]      ║  ┃
┃  ║                                                        ║  ┃
┃  ╚════════════════════════════════════════════════════════╝  ┃
┃                                                              ┃
┃  ┌─────────────────────────────────────────────────────────┐ ┃
┃  │         🎯 GAUGE DE CONTEXTO (Score actual)             │ ┃
┃  └─────────────────────────────────────────────────────────┘ ┃
┃                                                              ┃
┃                  EXPLORAR INTELIGENCIA                       ┃
┃  [Vista Ejecutiva] [Pipeline] [Alertas] [Dashboard]          ┃
┃                                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Ejemplo Real: `seguimiento/page.tsx`

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
  {/* Background Pattern */}
  <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/8 via-transparent to-transparent pointer-events-none" />
  
  <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      
      {/* PORTADA - Título centrado */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Centro de{' '}
          <span className="fhr-title-gradient">Seguimiento</span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Inteligencia continua del ciclo de vida del colaborador
        </p>
      </motion.div>

      {/* Cards de productos */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProductCard product="onboarding" metrics={liveMetrics} />
        <ProductCard product="exit" status="coming-soon" />
      </div>

    </motion.div>
  </div>
</div>
```

---

## PATRÓN 6: EXECUTIVE DASHBOARD (30/70)

**Propósito:** Vista de seguimiento con índice navegable (30%) y detalle con coaching (70%).

### Estructura

```
┌───────────────────────────────────────────────────────────────┐
│  BLOQUE DE ACCIÓN MUTABLE (cambia según estado)               │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│   ÍNDICE      │              DETALLE GUIADO                   │
│   (30%)       │              (70%)                            │
│               │                                               │
│  ○ Item 1     │   Contenido del item seleccionado             │
│  ● Item 2     │   + Barra de progreso                         │
│  ○ Item 3     │   + Coaching Tip al final                     │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

---

## PATRÓN 7: PANTALLAS DE GUÍA

**Propósito:** Confirmaciones limpias entre transiciones importantes.

### Tipos

| Tipo | Cuándo | Ejemplo |
|------|--------|---------|
| Estado Actual | Click en persona | "María tiene evaluación completa" |
| Confirmación | Al completar | "✓ Evaluación enviada" |
| Onboarding | Primera vez | "Bienvenido al módulo de Metas" |
| Warning | Acción irreversible | "Esta acción no se puede deshacer" |
| Celebración | Proceso completo | "🎉 ¡Felicidades!" |

### Reglas

```yaml
✅ OBLIGATORIO:
  - Máximo 2 líneas de texto
  - UN solo CTA brillante
  - Icono grande contextual
  - Fondo limpio (sin ruido)
  - Animación sutil de entrada

❌ PROHIBIDO:
  - Párrafos largos
  - Múltiples CTAs
  - Formularios inline
  - Datos técnicos
```

---

## 📋 CHECKLIST POR TIPO DE PANTALLA

### Smart Router (Hub)

```yaml
□ Gauge visible arriba
□ CTA único con nombre de persona/entidad
□ Rail colapsado por defecto
□ Pills de filtro (máximo 4)
□ Contadores en cada pill
```

### Wizard

```yaml
□ Indicador "Paso X de Y"
□ 1 sola tarjeta visible
□ Navegación Anterior/Siguiente
□ Sin menú lateral
□ Foco total en tarea
```

### Landing/Portada

```yaml
□ Título centrado con gradiente
□ "Tu Misión Hoy" destacado
□ Gauge de contexto
□ Links a vistas especializadas
□ Background pattern sutil
```

### Executive Dashboard

```yaml
□ Bloque de acción mutable arriba
□ Split 30/70 (índice/detalle)
□ Coaching tip al final del panel
□ Badge de estado visible
```

---

## 🏁 LA REGLA DE ORO: 4 ACTOS

Todo wizard debe seguir esta estructura narrativa:

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│   ACTO 1       │   ACTO 2       │   ACTO 3       │   ACTO 4       │
│   BRIEFING     │   EDICIÓN      │   LIBERTAD     │   CHECKOUT     │
│                │   ÁGIL         │                │   EJECUTIVO    │
├────────────────┼────────────────┼────────────────┼────────────────┤
│   "La IA hizo  │   "Aprueba     │   "Agrega tu   │   "Ve al       │
│    el trabajo" │    con 1 clic" │    toque"      │    mundo real" │
│                │                │                │                │
│   El jefe      │   El jefe      │   OPCIONAL     │   Próximo paso │
│   ENTIENDE     │   DECIDE       │   Toque humano │   FÍSICO       │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

**Principio:** El software TERMINA cuando el usuario hace clic en 'Guardar'. FocalizaHR COMIENZA ahí.
