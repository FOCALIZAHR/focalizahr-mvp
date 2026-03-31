# 🎬 Cinema Mode & Smart Router — Guía para Desarrolladores FocalizaHR

> **Versión:** 1.0  
> **Fuentes:** `FILOSOFIA_UX_SMART_ROUTER_v1_0.md`, `FILOSOFIA_DISENO_FOCALIZAHR_v2.md`, código base verificado  
> **Para:** Cualquier desarrollador que deba crear o extender módulos con flujo guiado

---

## TL;DR — En 30 segundos

FocalizaHR **no construye formularios ni tablas**. Construye **experiencias guiadas** donde el software empuja al usuario hacia la siguiente acción. El patrón que hace esto posible tiene dos nombres según el contexto:

- **Smart Router** → el *hub* de decisión (pantalla que dice "tu siguiente paso es X")
- **Cinema Mode** → el *ensamblado completo* de todas las piezas (Header + MissionControl + SpotlightCard + Rail + Modal)

Ambos comparten la misma filosofía. Cinema Mode es la implementación visual de Smart Router.

---

## Parte 1 — Filosofía Smart Router

### El problema que resuelve

```
ANTES (patrón clásico):
  Usuario → Abre sistema → Ve tabla de 50 personas
    → Busca quién le falta → Aplica filtros → Adivina el orden
      → Abre formulario → Confunde el estado → Abandona

DESPUÉS (Smart Router):
  Usuario → Abre sistema → Ve "Tu siguiente misión: Evaluar a Claudia P."
    → Un clic → Contexto completo → Acción clara → Completado
      → Sistema sugiere siguiente → Repite hasta 100%
```

### Los 3 principios que nunca se rompen

| Principio | Implementación |
|---|---|
| **UN solo CTA dominante** | Siempre hay un botón cyan con glow más grande que los demás |
| **El sistema decide el orden** | `nextEmployee` calculado por el hook, no por el usuario |
| **Complejidad es opt-in** | La lista completa (Rail) está colapsada por defecto |

### Checklist de validación (antes de hacer PR)

```
SMART ROUTER (HUB):
☐ ¿Hay un gauge/anillo que muestra progreso global?
☐ ¿El CTA único tiene el nombre de la persona/entidad específica?
☐ ¿El Rail está colapsado por defecto?
☐ ¿Las pills de filtro son máximo 4?
☐ ¿Hay un mensaje de misión contextual?

ANTI-PATRONES PROHIBIDOS:
☐ Tabla como pantalla principal → RECHAZAR
☐ Más de 1 CTA del mismo peso visual → RECHAZAR
☐ Formulario sin Landing Card previa → RECHAZAR
☐ Lista larga sin colapsar → RECHAZAR
```

---

## Parte 2 — Arquitectura Cinema Mode

### Layout completo de pantalla

```
┌──────────────────────────────────────────────────────────────────┐
│  CinemaHeader                                                    │
│  [← Volver]    Nombre del Ciclo/Contexto          [Acción aux]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                   ZONA PRINCIPAL (flex-1)                        │
│                                                                  │
│   Estado A: MissionControl (LOBBY)                               │
│   ┌─────────────────────┐   ┌────────────────────────────────┐  │
│   │  Gauge de progreso  │   │  Tu próxima misión:            │  │
│   │   ╭─────────────╮   │   │                               │  │
│   │   │  8/10 · 80% │   │   │  ╔══════════════════════════╗ │  │
│   │   ╰─────────────╯   │   │  ║  Evaluar a Claudia P.   ║ │  │
│   └─────────────────────┘   │  ╚══════════════════════════╝ │  │
│                              └────────────────────────────────┘  │
│                                                                  │
│   Estado B: SpotlightCard (DETALLE de persona)                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Línea Tesla cyan (top border glow)                     │   │
│   │  [← Volver]                                             │   │
│   │  ┌────────────┬────────────────────────────────────┐   │   │
│   │  │  AVATAR*   │  StorytellingGuide                 │   │   │
│   │  │  (click)   │  Nombre · Cargo · Depto            │   │   │
│   │  │            │  CTAs: Evaluar / Ver Resumen / PDI  │   │   │
│   │  └────────────┴────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   * Click en avatar → AvatarInfoModal (fixed z-50, backdrop)     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Rail (colapsable 50px ↔ 320px)                                  │
│  [Ver equipo ▼]  [Todos 10] [Pendientes 2] [Completados 8]       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ← scroll →       │
│  │ Ana  │ │Pedro │ │Carla │ │ ... │ │ ... │                     │
└──────────────────────────────────────────────────────────────────┘

Sobre todo (z-50): AvatarInfoModal / VictoryOverlay
```

### Los 5 componentes del ensamblado

```
src/components/evaluator/cinema/
  ├── CinemaHeader.tsx         → Barra superior con contexto
  ├── MissionControl.tsx       → LOBBY: gauge + CTA único
  ├── SpotlightCard.tsx        → DETALLE: card grande de persona
  ├── Rail.tsx                 → Carrusel inferior colapsable
  ├── AvatarInfoModal.tsx      → Modal de perfil (se abre desde avatar)
  └── VictoryOverlay.tsx       → Celebración al 100%
```

El **Orchestrator** (`CinemaModeOrchestrator.tsx`) ensambla todo y gestiona:
- `selectedId`: qué persona está en foco (`null` = LOBBY, `string` = SPOTLIGHT)
- `isRailExpanded`: estado del carrusel inferior
- `showVictoryOverlay`: al completar todos

---

## Parte 3 — Componentes Reutilizables (Catálogo)

### Cómo leer este catálogo

Cada componente tiene:
- **Qué hace** — en una línea
- **Cuándo usarlo** — el caso de uso exacto
- **Cómo adaptarlo** — los props que cambias para otro módulo
- **Patrón de origen** — de qué componente hereda la idea

---

### `MomentCover.tsx` — El Patrón Base

**Archivo:** `src/components/performance/summary/MomentCover.tsx`  
**Qué hace:** Portada narrativa con Journey Indicator (stepper de dots) + frase dinámica con datos reales + CTA de color variable según el momento

**Cuándo usarlo:** Siempre que necesites una pantalla intermedia entre "elegir qué ver" y "verlo". Es la separación que transforma una navegación anónima en una historia.

**Anatomía del componente:**
```
┌────────────────────────────────────────────┐
│  [← Volver]                               │
│                                            │
│  ○ ─────── ● ─────── ○   ← Journey dots   │
│  DIAG     CONV       DEV                  │
│                                            │
│                                            │
│  "Ana tiene 3 brechas de percepción        │
│   que debes conocer antes de tu            │
│   próxima conversación."                   │
│                                            │
│        ╔═══════════════════╗               │
│        ║  Preparar mi 1:1  ║               │
│        ╚═══════════════════╝               │
└────────────────────────────────────────────┘
```

**Props clave:**
```typescript
interface MomentCoverProps {
  moment: 'diagnostico' | 'conversacion' | 'desarrollo'  // determina el color del CTA
  evaluateeName: string       // nombre de la persona analizada
  summary: CinemaSummaryData  // datos reales para la narrativa dinámica
  onBack: () => void
  onEnter: () => void         // avanza a MomentContent
}
```

**Para adaptarlo a otro módulo:** Reemplaza `Moment` por tu propio enum de pasos, define tus propias funciones `getNarrativeForStep(firstName, data)` que retornen `ReactNode` con `<span className="text-cyan-400">` para el nombre y `<span className="text-purple-400">` para las métricas.

**Regla de narrativa:**
```typescript
// SIEMPRE: nombre del protagonista en cyan
<span className="text-cyan-400 font-medium">{firstName}</span>

// SIEMPRE: métricas relevantes en purple
<span className="text-purple-400 font-medium">{score}</span>

// NUNCA: texto genérico sin datos reales
// ❌ "Revisa los resultados de evaluación"
// ✅ "Ana obtuvo Alto Desempeño. Revisa su diagnóstico."
```

---

### `GoalStepCover.tsx` — Portada Wizard con CTA + Ghost

**Archivo:** `src/components/goals/wizard/GoalStepCover.tsx`  
**Qué hace:** Variante de MomentCover sin Journey Indicator, con narrativa dinámica según el estado actual de la entidad + CTA primario cyan + botón ghost opcional

**Cuándo usarlo:** Cuando el wizard tiene un solo paso o cuando el contexto es "iniciar asignación" en lugar de navegar entre análisis.

**Narrativa dinámica según estado:**
```typescript
// El componente evalúa el estado y genera narrativa apropiada:
'EMPTY'      → "Ana aún no tiene metas asignadas. Comencemos a definir sus objetivos."
'INCOMPLETE' → "A Ana le falta un 40% para completar su plan de Metas."
'READY'      → "Ana ya tiene su plan completo. ¿Deseas agregar una meta adicional?"
'EXCEEDED'   → Estado de error manejado visualmente
```

**Para adaptarlo:** Crea un enum de estados propio (`'SIN_INICIAR' | 'EN_PROGRESO' | 'COMPLETO'`) y una función `getNarrative(firstName, status)` que retorne el `ReactNode` correspondiente.

---

### `SuccessionCandidatesCover.tsx` — Portada de 2 Pasos Narrativos

**Archivo:** `src/components/succession/SuccessionCandidatesCover.tsx`  
**Qué hace:** Portada con **2 pantallas secuenciales** antes de mostrar los datos — primero una frase estratégica de contexto, luego los números de la búsqueda con el "cómo lo calculamos"

**Cuándo usarlo:** Cuando el resultado que vas a mostrar requiere justificación metodológica (por qué se eligieron esos candidatos, por qué ese score, etc.). Ideal para módulos con algoritmos no obvios.

**Flujo interno:**
```
step 1: Frase narrativa de contexto estratégico
  "Las organizaciones que planifican su sucesión retienen
   el doble de su talento crítico."
  [Siguiente →]
        ↓
step 2: Números reales + metodología colapsable
  "Analizamos 120 colaboradores y encontramos 8 talentos."
  [¿Cómo lo calculamos? ▼]  ← HelpModal opcional
  [Ver Candidatos →]
```

**Props:**
```typescript
interface SuccessionCandidatesCoverProps {
  positionTitle: string      // nombre del cargo analizado
  totalEmployees: number     // universo total de la búsqueda
  candidatesFound: number    // resultado de la búsqueda
  onEnter: () => void        // avanza a la lista de candidatos
}
```

**Importante:** El modal de ayuda (`HELP_STEPS`) es un array de objetos `{num, title, body}` — puedes reemplazarlo con los pasos de tu propio algoritmo sin cambiar la estructura del componente.

**Patrón de origen:** Clona directamente `MomentCover.tsx`.

---

### `GuidedSummaryOrchestrator.tsx` — Hub → Cover → Content (3 Niveles)

**Archivo:** `src/components/performance/summary/GuidedSummaryOrchestrator.tsx`  
**Qué hace:** Orquestador que implementa el patrón de **3 niveles de profundidad** para consumir inteligencia compleja: Hub de selección → Portada narrativa → Contenido real

**Cuándo usarlo:** Cuando tienes múltiples "momentos" o secciones de análisis y quieres que el usuario las navegue como capítulos, no como tabs.

**Diagrama de estados:**

```
ViewLevel = 'hub' | 'cover' | 'content'

         HUB (SummaryHub)
         Elige momento: Diagnóstico / Conversación / Desarrollo
                ↓ handleSelectMoment(moment)

         COVER (MomentCover)
         Narrativa dinámica con datos reales del momento elegido
                ↓ handleEnterContent()

         CONTENT (MomentContent)
         Componente real con toda la información del momento
                ↑ handleBack() en cualquier nivel
```

**Layout Split 25/75:**
```
┌────────────────────────────────────────────────────────────────┐
│  SummaryLeftColumn (25%)  │  AnimatePresence zona derecha (75%)│
│  - Avatar persona         │  hub    → SummaryHub               │
│  - Score global           │  cover  → MomentCover              │
│  - NineBox position       │  content → MomentContent           │
│  - Contexto fijo          │  (AnimatePresence mode="wait")      │
└───────────────────────────┴────────────────────────────────────┘
```

**Para adaptarlo a otro módulo:**
1. Define tu `ViewLevel` con los estados que necesites
2. La columna izquierda es el "contexto fijo" que nunca cambia
3. La columna derecha usa `AnimatePresence mode="wait"` para las transiciones
4. Cada Cover recibe `onBack` y `onEnter` para navegar entre niveles

---

## Parte 4 — Receta para un Módulo Nuevo con Cinema Mode

### Paso a paso

```
1. HOOK PERSONALIZADO
   Crea useXxxCinemaMode.ts que exponga:
   - employees/items: lista de entidades
   - stats: { total, completed, pending }
   - nextItem: { id, displayName } | null
   - selectedId: string | null
   - selectedItem: ItemData | null
   - isRailExpanded: boolean
   - Handlers: handleSelect, handleBack, toggleRail, reload

2. TYPES
   En src/types/xxx-cinema.ts define:
   - ItemCardData (equivalente a EmployeeCardData)
   - SelectedItem extends ItemCardData
   - CinemaStats
   - RailProps, MissionControlProps, SpotlightCardProps

3. ORCHESTRATOR (adaptar CinemaModeOrchestrator.tsx)
   - Importa CinemaHeader, MissionControl, SpotlightCard, Rail
   - Pasa tu hook al lugar del useEvaluatorCinemaMode
   - AnimatePresence mode="wait" entre MissionControl y SpotlightCard

4. MISSION CONTROL (reutilizar casi directo)
   - Cambia el label del CTA ("Siguiente: [nombre]")
   - Adapta el gauge a tu métrica de progreso

5. SPOTLIGHT CARD (más personalización)
   - Mantén: Línea Tesla + glassmorphism + layout columnas + Avatar clickeable
   - Personaliza: columna derecha con StorytellingGuide de tu módulo

6. RAIL (reutilizar casi directo)
   - Cambia las FilterPills por las de tu módulo
   - Adapta EmployeeRailCard a tu entidad

7. AVATAR INFO MODAL (reutilizar casi directo)
   - Mantén: fixed inset-0 z-50 + backdrop + Tesla line
   - Personaliza: datos del perfil mostrados
```

---

## Parte 5 — Identidad Visual Obligatoria

Estas reglas aplican a **todos** los componentes Cinema Mode, sin excepción:

### Fondo y glassmorphism
```css
/* Fondo de pantalla */
bg-[#0F172A]

/* Card principal */
bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl
```

### Línea Tesla (SIEMPRE en todo SpotlightCard)
```tsx
<div
  className="absolute top-0 left-0 right-0 h-[1px] z-20"
  style={{
    background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
    boxShadow: '0 0 15px #22D3EE'
  }}
/>
```

### Narrativa: siempre nombre en cyan, métricas en purple
```tsx
// ✅ CORRECTO
<p className="text-2xl font-light text-white">
  <span className="text-cyan-400 font-medium">{firstName}</span>
  {' obtuvo '}
  <span className="text-purple-400 font-medium">{score}</span>
  {' en su evaluación.'}
</p>

// ❌ INCORRECTO — texto plano sin jerarquía visual
<p>{firstName} obtuvo {score} en su evaluación.</p>
```

### CTA primario (cyan glow)
```tsx
<motion.button
  className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium"
  style={{
    background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
    color: '#0F172A',
    boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
  }}
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
>
  <span>Texto acción específica</span>
  <ArrowRight className="w-4 h-4" />
</motion.button>
```

### Animaciones de transición
```typescript
// Entry de SpotlightCard / Cover
initial={{ opacity: 0, scale: 0.95, y: 30 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 30 }}
transition={{ type: 'spring', stiffness: 220, damping: 30 }}

// Entry de Modal
initial={{ opacity: 0, scale: 0.9, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}

// AnimatePresence siempre con mode="wait" en zonas principales
<AnimatePresence mode="wait">
  {condition ? <ComponenteA key="a" /> : <ComponenteB key="b" />}
</AnimatePresence>
```

---

## Parte 6 — Mapa de Componentes por Módulo

| Módulo | Orchestrator | Hook | Tipo de Cover |
|---|---|---|---|
| Evaluaciones 360 | `CinemaModeOrchestrator.tsx` | `useEvaluatorCinemaMode` | `SpotlightCard` directo |
| Performance Summary | `GuidedSummaryOrchestrator.tsx` | datos desde API | `MomentCover` (3 momentos) |
| Succession | `SuccessionSpotlightCard.tsx` | `useSuccession*` | `SuccessionCandidatesCover` (2 pasos) |
| Goals/Metas | wizard propio | estado local | `GoalStepCover` (1 paso) |
| Calibration | `CalibrationCinemaModeOrchestrator` | `useCalibrationRoom` | `CinemaGrid` (9-box drag) |

---

## Parte 7 — Anti-Patrones que ROMPEN el Cinema Mode

```
❌ Usar <table> como pantalla principal
   → Usar MissionControl + Rail

❌ Mostrar el Rail expandido por defecto
   → isRailExpanded siempre arranca en false

❌ Dos botones con el mismo weight visual (misma clase, mismo tamaño)
   → El CTA de misión en cyan, los secundarios en ghost/outline

❌ Abrir AvatarInfoModal con position:absolute dentro del card
   → Siempre fixed inset-0 z-50 para que flote sobre Rail también

❌ Hardcodear el "siguiente" en el componente
   → El hook es quien calcula nextEmployee basado en estado real de BD

❌ AnimatePresence sin key única en cada hijo
   → Siempre key={`spotlight-${selectedId}`} para forzar remount

❌ Línea Tesla en color diferente a cyan
   → Siempre #22D3EE, sin variaciones por módulo

❌ Narrativa en texto plano sin destacar nombre/métrica
   → El nombre SIEMPRE en cyan-400, las métricas SIEMPRE en purple-400
```

---

## Referencias de código

```
src/components/evaluator/cinema/
  CinemaHeader.tsx, MissionControl.tsx, SpotlightCard.tsx,
  Rail.tsx, AvatarInfoModal.tsx, VictoryOverlay.tsx

src/app/dashboard/evaluaciones/components/
  CinemaModeOrchestrator.tsx

src/components/performance/summary/
  GuidedSummaryOrchestrator.tsx, MomentCover.tsx,
  SummaryHub.tsx, MomentContent.tsx

src/components/goals/wizard/
  GoalStepCover.tsx

src/components/succession/
  SuccessionCandidatesCover.tsx

src/types/
  evaluator-cinema.ts  ← tipos de referencia para nuevos módulos
```

---

*Documento generado desde código base verificado — Project Knowledge FocalizaHR*  
*Fuentes: `FILOSOFIA_UX_SMART_ROUTER_v1_0.md` · `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` · código fuente*
