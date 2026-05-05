---
name: focalizahr-design
description: |
  OBLIGATORIO para TODO componente frontend en FocalizaHR.
  Triggers: "crea", "diseña", "estiliza", "componente", "card", "botón",
  "dashboard", "página", "formulario", "modal", "UI", "frontend",
  "Cinema Mode", "Smart Router", "flujo guiado", "Guided Intelligence",
  "narrativa", "hallazgos", "checkpoint", "compensación", "portada",
  "efficiency", "workforce", "cascada", "lente", "briefing".
  REEMPLAZA completamente la skill frontend-design genérica.
---

# FOCALIZAHR DESIGN SKILL v3.0

> OBLIGATORIO para TODO componente frontend.
> Leer ANTES de escribir cualquier línea de código UI.

---

## TOKENS CANÓNICOS — COPIAR LITERAL

Estos son los valores definitivos. NO usar otros valores.
NO consultar otras fuentes para estos tokens.
Si un archivo de referencia contradice esta sección, ESTA SECCIÓN GANA.

### Card (contenedor universal)

```
CLASE TAILWIND COMPLETA (copiar literal):
bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]

PADDING:
  mobile:   p-5
  desktop:  md:p-6
  portada:  p-8 md:p-10
  compacto: p-4

HOVER (solo si la card es clickeable):
  hover:border-slate-700 transition-colors

NUNCA USAR:
  ❌ .fhr-card (CSS desactualizado, valores distintos)
  ❌ .fhr-glass-card (CSS desactualizado)
  ❌ rounded-2xl, rounded-3xl, rounded-xl
  ❌ backdrop-blur-xl, backdrop-blur-sm
  ❌ bg-slate-800/90, bg-slate-900/80
```

### Línea Tesla (firma visual)

```tsx
// COPIAR LITERAL — no modificar valores
<div
  className="absolute top-0 left-0 right-0 h-[2px] z-10"
  style={{
    background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
    boxShadow: '0 0 20px #22D3EE',
  }}
/>

// Variante con color dinámico
<div
  className="absolute top-0 left-0 right-0 h-[2px] z-10"
  style={{
    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    boxShadow: `0 0 15px ${color}`,
  }}
/>

REGLAS:
  ✅ UNA sola Tesla Line por card/página
  ✅ Siempre en top-0 (parte superior)
  ✅ El contenedor padre debe tener: relative overflow-hidden
  ❌ NUNCA h-[1px] ni h-[3px]
  ❌ NUNCA múltiples Tesla Lines compitiendo
```

### Colores — paleta completa

```
PRIMARIOS:
  cyan:    #22D3EE  → text-cyan-400, bg-cyan-500/20, border-cyan-500/30
  purple:  #A78BFA  → text-purple-400, bg-purple-500/20, border-purple-500/30

ESTADOS:
  success: #10B981  → text-emerald-400
  warning: #F59E0B  → text-amber-400
  error:   #EF4444  → text-red-400

FONDOS:
  página:  bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
  pattern: bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/8 via-transparent to-transparent

TEXTOS:
  principal: text-white
  secundario: text-slate-400
  terciario: text-slate-500
  mínimo: text-slate-600 (solo para escalas/ejes, nunca para contenido legible)
```

### Color semántico en narrativas

```
REGLA ABSOLUTA — quién lleva qué color:
  cyan (#22D3EE):   Nombres, categorías, entidades, acciones
  purple (#A78BFA):  Números, métricas, porcentajes, benchmarks
  white:             Conectores, contexto, texto narrativo

EJEMPLO:
  <span className="text-cyan-400">María</span>
  {' obtuvo '}
  <span className="text-purple-400">4.2</span>
  {' en su evaluación.'}
```

### Tipografía

```
HEADLINE NUMBER (protagonista):
  text-[72px] md:text-[96px] font-extralight text-white
  NUNCA en cyan. NUNCA font-bold. El número siempre es blanco y ultraligero.

TÍTULO PRINCIPAL (word split obligatorio):
  Primera parte: text-3xl md:text-4xl font-extralight text-white
  Palabra clave: fhr-title-gradient (o text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400)

EYEBROW (contexto superior):
  text-[10px] uppercase tracking-widest text-slate-500

NARRATIVA:
  text-base text-slate-400 font-light leading-relaxed

LABEL DE SECCIÓN:
  text-[11px] text-slate-400 (mínimo legible, NUNCA text-[9px])
```

### Botones — jerarquía estricta

```
REGLA: 1 solo Primary por vista. Resto son Secondary/Ghost.

IMPORT:
  import { PrimaryButton, SecondaryButton, GhostButton, DangerButton, SuccessButton } from '@/components/ui/PremiumButton'

JERARQUÍA CORRECTA:
  [GhostButton: Cancelar] [SecondaryButton: Guardar] [PrimaryButton: Publicar →]

TAMAÑOS:
  sm: tablas, acciones compactas
  md: default
  lg: CTAs principales, portadas
  xl: hero actions (raro, solo portadas)

MOBILE:
  En lg/xl siempre agregar fullWidth={true}
```

### Badges

```
USAR CLASES .fhr-badge-* (estas SÍ están actualizadas en CSS):
  fhr-badge-success  → Completado/Éxito (verde)
  fhr-badge-active   → En progreso (cyan)
  fhr-badge-warning  → Atención (amarillo)
  fhr-badge-error    → Error/Crítico (rojo)
  fhr-badge-draft    → Borrador (gris)
  fhr-badge-purple   → Especial/Premium (purple)
```

### Animaciones

```
SPRING ESTÁNDAR (framer-motion):
  transition={{ type: 'spring', stiffness: 220, damping: 30 }}

TIMINGS:
  Entrada: 300ms ease-out
  Salida:  200ms ease-in
  Hover:   150ms ease
  Gauge:   1200ms ease-out

CONTAINER + STAGGER:
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 30 } }
  }
```

### Breakpoints mobile-first

```
Base: 320px+ (mobile) → sin prefijo
sm:   640px+ (tablet)
md:   1024px+ (desktop)
lg:   1280px+ (large)

PATRONES FRECUENTES:
  padding:    px-4 py-6 md:px-8 md:py-10
  texto:      text-2xl md:text-3xl
  dirección:  flex-col md:flex-row
  grid:       grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  ocultar:    hidden md:block / md:hidden
```

---

## ESTRUCTURA DE PÁGINA ESTÁNDAR

```tsx
// COPIAR LITERAL para cualquier página nueva
export default function MiPagina() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background pattern sutil */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/8 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* HEADER — título + acciones */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extralight text-white">
              Título de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Página
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Descripción breve</p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton icon={Plus}>Acción</SecondaryButton>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] overflow-hidden p-5 md:p-6">
          {/* Tesla Line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
              boxShadow: '0 0 20px #22D3EE',
            }}
          />
          {/* Tu contenido */}
        </div>

      </div>
    </div>
  )
}
```

---

## LOS 8 MANDAMIENTOS

1. **Jerarquía Absoluta** — El ojo tiene UN camino. No dos.
2. **Above the Fold = Decisión** — CTA visible sin scroll.
3. **Un Solo CTA Principal** — Solo 1 Primary por vista.
4. **Mobile-First** — Base 320px, escala hacia arriba.
5. **Progressive Disclosure** — Esencial visible, complejo bajo demanda.
6. **Feedback Inmediato** — Toda acción responde < 100ms.
7. **Consistencia Absoluta** — Mismo problema = misma solución visual.
8. **Narrativa Antes de Dato** — Cuando la complejidad es el valor, el usuario lee ANTES de ver nombres.

---

## ADN VISUAL

```
APPLE (70%) — Minimalismo y enfoque
  Glassmorphism oscuro, espacios negativos, tipografías extralight
  Cero emojis, cero semáforos rojo/amarillo/verde, cero ruido

TESLA (20%) — Telemetría de un vistazo
  Gauges luminosos, Línea Tesla signature, cyan glow
  Dashboard como cockpit premium

FOCALIZA (10%) — Liderazgo guiado
  "Tu Misión Hoy", CTAs dinámicos, coaching tips
  El sistema busca, el líder actúa
```

---

## PATRONES DE PÁGINA — CUÁL USAR

| Patrón | Cuándo | Ejemplo |
|--------|--------|---------|
| **Smart Router (Hub)** | Pantalla principal con Gauge + CTA | Portal evaluador, Metas |
| **Rail Colapsable** | Listas de personas/entidades | Equipo del jefe, campañas |
| **Landing Card** | Contexto antes de formulario | SpotlightCard persona |
| **Wizard Aislado** | Paso a paso, 1 card a la vez | Crear meta, crear PDI |
| **Landing + Mission** | Portada de producto | Onboarding Intelligence |
| **Executive Dashboard 30/70** | Seguimiento con índice lateral | Workspace seguimiento |
| **Pantalla de Guía** | Confirmaciones entre transiciones | Evaluación enviada |
| **Cinema Mode** | Flujo inmersivo tipo Netflix | Portal evaluador Split 35/65 |
| **Guided Intelligence (G)** | Hallazgos complejos multi-variable | Checkpoint pre-compensación |
| **Cascada Ejecutiva** | Narrativa CEO escalada de 8 capas | Workforce Planning, AI Exposure |

Para implementación detallada de cada patrón, consultar `references/`:
- Smart Router + Rail + Landing + Wizard + Dashboard + Guía → `references/page-patterns.md`
- Cinema Mode → `references/cinema-mode.md`
- Guided Intelligence → `references/guided-intelligence.md`
- Cascada Ejecutiva → `references/cascada-ejecutiva.md`
- Landing Cards / SpotlightCard → `references/executive-portadas.md`

---

## ANTI-PATRONES CRÍTICOS — NUNCA HACER

```yaml
UX:
  ❌ Tabla como pantalla principal → usar Smart Router
  ❌ Múltiples CTAs primarios → 1 Primary, resto Secondary/Ghost
  ❌ Formulario sin contexto previo → Landing Card primero
  ❌ Listas largas sin colapsar → Rail colapsable
  ❌ Modales anidados → confirmación inline
  ❌ Más de 4 filtros visibles → pills + "Más filtros"

VISUAL:
  ❌ Fondos claros (bg-white) → siempre fondo oscuro
  ❌ Colores fuera de paleta → solo cyan/purple/estados
  ❌ Emojis decorativos → Lucide icons
  ❌ Semáforos rojo/amarillo/verde como indicadores
  ❌ Border-radius distinto a rounded-[20px] en cards
  ❌ Sombras pesadas → solo glow sutil cyan

CÓDIGO:
  ❌ Estilos inline para tokens resueltos → usar valores de esta skill
  ❌ Clases CSS inventadas → usar tokens canónicos
  ❌ .fhr-card / .fhr-glass-card → usar Tailwind canónico de esta skill
  ❌ Sin loading states → siempre skeleton
  ❌ Sin empty states → siempre mensaje + CTA
  ❌ Strings de BD sin formatear → formatDate(), formatDisplayName()

TEXTO:
  ❌ score360 visible al CEO → usar roleFitScore
  ❌ Nombres en UPPERCASE → formatDisplayName() siempre
  ❌ Labels inventados → solo los del motor correspondiente
  ❌ Pantallas sin indicar siguiente paso
  ❌ Mensajes técnicos al usuario → lenguaje humano

PATRÓN G ESPECÍFICOS:
  ❌ Badges gritando (NO AUDITABLE uppercase amarillo)
  ❌ Colores de fondo en filas de persona
  ❌ Modales para contenido expandible inline
  ❌ Pearson sin contexto ("azar puro" o equivalente)
```

Para lista completa con ejemplos de código → `references/anti-patterns.md`

---

## REGLA DE ORO: 4 ACTOS

Todo wizard/flujo guiado sigue esta estructura narrativa:

```
ACTO 1: BRIEFING     → "La IA hizo el trabajo" → El jefe ENTIENDE
ACTO 2: EDICIÓN ÁGIL → "Aprueba con 1 clic"    → El jefe DECIDE
ACTO 3: LIBERTAD     → "Agrega tu toque"       → OPCIONAL, toque humano
ACTO 4: CHECKOUT     → "Ve al mundo real"       → Próximo paso FÍSICO
```

El software de RRHH termina cuando el usuario hace clic en "Guardar".
FocalizaHR COMIENZA ahí.

---

## MANIFIESTO — PRINCIPIOS QUE GOBIERNAN TODO

Antes de elegir patrón o escribir código, recordar:

- **P7:** Las personas en nuestras pantallas no son filas en una tabla
- **P8:** El diseño se adapta a la gravedad de la decisión (no todo es 3 segundos y 1 clic)
- **P10:** Análisis es del cargo, gestión es de la persona
- **P12:** Hablamos como gerentes, no como consultores ni como sistema
- **P13:** La batería de herramientas se elige por contexto, no por defecto
- **P15:** Arquitectura enterprise desde el día uno — no hardcodear, no parches

Manifiesto completo → `references/MANIFIESTO_FOCALIZAHR_v5.md`

---

## CHECKLIST PRE-ENTREGA

```yaml
TOKENS:
  □ Cards usan: bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]
  □ Tesla Line: h-[2px] con gradient y glow
  □ Headline numbers: font-extralight text-white (NUNCA cyan)
  □ Word split en títulos: blanco + gradient
  □ Color semántico: cyan=nombres, purple=números, white=conectores

ESTRUCTURA:
  □ Fondo oscuro con pattern sutil
  □ max-w-5xl mx-auto con padding responsive
  □ Solo 1 CTA Primary visible
  □ Loading states implementados
  □ Empty states con mensaje + CTA

MOBILE:
  □ Funciona en 320px
  □ Breakpoints md: para desktop
  □ Padding responsive (px-4 md:px-8)
  □ Botones fullWidth en mobile

PATRONES:
  □ Sigue alguno de los patrones documentados
  □ NO viola anti-patrones
  □ La gravedad de la decisión justifica el patrón elegido (P8)
  □ Las personas se tratan como personas, no filas (P7)
```

---

## COMPONENTES REFERENCIA — COPIAR DE ESTOS

Antes de crear un componente nuevo, buscar si ya existe uno del mismo tipo.
Estos son los mejores logrados visualmente — usarlos como plantilla.

### Portada de Módulo (Nivel 1 — tipografía pura)

```
ARCHIVO: src/app/dashboard/seguimiento/page.tsx
PATRÓN: Landing + Mission
DESTACA: Fondo plano sin cards, título centrado font-extralight con gradient en keyword,
         ProductCards limpias, containerVariants + itemVariants stagger.
         Es la estética Survey Premium que queremos replicar en todas las portadas.
USAR COMO BASE PARA: Portadas de cualquier módulo nuevo.
```

### Card de Métrica (Nivel 2 — operativo)

```
ARCHIVO: src/components/performance/PerformanceScoreCard.tsx
PATRÓN: Card operativa con Tesla Line dinámica
DESTACA: Tesla Line con color dinámico según clasificación, glassmorphism canónico,
         score hero font-extralight, barra de progreso, 3 tamaños (sm/md/lg),
         mobile-first con sizeStyles responsive.
USAR COMO BASE PARA: Cualquier card que muestre una métrica principal con contexto.
```

### Wizard con Steps

```
ARCHIVOS:
  Orchestrator: src/components/goals/config/GoalsConfigWizard.tsx
  Step indicator: src/components/goals/wizard/WizardProgress.tsx
PATRÓN: Wizard Aislado con Cover → Form
DESTACA: Patrón cover/form por step (stepPhase), WizardProgress con circles +
         connector lines + step names, AnimatePresence mode="wait" entre steps,
         navegación Atrás/Siguiente con GhostButton/PrimaryButton.
USAR COMO BASE PARA: Cualquier wizard nuevo (configuración, creación, onboarding).
```

### Vista Análisis por Persona (Split 35/65)

```
ARCHIVOS:
  Card: src/components/evaluator/cinema/SpotlightCard.tsx
  Header: src/components/performance/summary/CinemaSummaryHeader.tsx
PATRÓN: Cinema Mode — SpotlightCard
DESTACA: Split 35% identidad (avatar, nombre, cargo, tenure) + 65% narrativa + CTA,
         Tesla Line dinámica por score, botón Volver sutil top-left,
         StatusBadge debajo del avatar, formatDisplayNameFull para nombres.
USAR COMO BASE PARA: Cualquier detalle de persona que requiera contexto + acción.
```

### Modal Ejecutivo (Wizard en modal)

```
ARCHIVO: src/components/calibration/closing/ClosingCeremonyModal.tsx
PATRÓN: Modal con wizard 3 pasos (Evidence → Cost → Verdict)
DESTACA: Progress bar animada gradient cyan→purple, AnimatePresence entre steps,
         3 componentes separados (StepEvidence, StepCost, StepVerdict),
         overlay bg-black/60 backdrop-blur-sm, contenido scrolleable con overflow-auto.
USAR COMO BASE PARA: Cualquier modal que requiera múltiples pasos o confirmación compleja.
```

### Cinema Mode Completo (Hub → Spotlight → Rail)

```
ARCHIVO: src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
PATRÓN: Smart Router + Cinema Mode completo
DESTACA: 3 estados (lobby/spotlight/victory) con AnimatePresence,
         MissionControl con Gauge + CTA, SpotlightCard con detalle,
         Rail colapsable bottom con backdrop blur, VictoryOverlay al completar.
         Fullscreen h-screen bg-[#0F172A].
REPLICADO EN: src/app/dashboard/metas/equipo/cinema/GoalsCinemaOrchestrator.tsx
USAR COMO BASE PARA: Cualquier flujo inmersivo persona por persona.
```

### Guided Intelligence (Hub → Cover → Content)

```
ARCHIVO: src/components/performance/summary/GuidedSummaryOrchestrator.tsx
PATRÓN: Guided Intelligence — 3 niveles de profundidad
DESTACA: ViewLevel = 'hub' | 'cover' | 'content', SummaryHub con Moments,
         MomentCover como portada narrativa antes de entrar al componente,
         MomentContent con sub-tabs internos, SummaryLeftColumn para navegación.
USAR COMO BASE PARA: Cualquier vista donde la complejidad ES el valor.
```

### NineBox Grid (CSS Grid + Cinema Focus)

```
ARCHIVO: src/components/performance/NineBoxGrid.tsx
PATRÓN: Grid interactivo con Cinema Focus
DESTACA: CSS Grid (NO tabla HTML), glassmorphism canónico con Tesla Line purple,
         AnimatePresence para Cinema backdrop al seleccionar celda,
         labels de ejes (Potencial/Desempeño) fuera del grid rotados.
USAR COMO BASE PARA: Cualquier matriz/grid interactiva.
```

### Badge System

```
ARCHIVOS:
  Performance: src/components/performance/PerformanceBadge.tsx
  NineBox: src/components/performance/NineBoxBadge.tsx
PATRÓN: Mapeo nivel → clase .fhr-badge-*
DESTACA: Usa LEVEL_TO_FHR_BADGE para mapear clasificaciones a clases CSS existentes,
         variantes xs/sm/md/lg, showScore + showLabel configurables.
USAR COMO BASE PARA: Cualquier badge que represente un estado o clasificación.
```

### Wizard Step Indicator

```
ARCHIVO: src/components/goals/wizard/WizardProgress.tsx
PATRÓN: Circles + connector lines + step names
DESTACA: Círculos con Check icon si completed, border cyan si current,
         slate-800 si pending. Connector line cyan/slate-700. Nombres ocultos en mobile.
USAR COMO BASE PARA: Cualquier wizard que necesite indicador de progreso.
```

---

## REFERENCIAS (PROFUNDIZACIÓN)

| Archivo | Cuándo consultar |
|---------|-----------------|
| `references/page-patterns.md` | Al crear página nueva — elegir patrón correcto |
| `references/cinema-mode.md` | Para flujos inmersivos Split 35/65 con Rail |
| `references/guided-intelligence.md` | Para hallazgos complejos multi-variable (Patrón G) |
| `references/cascada-ejecutiva.md` | Para narrativas CEO de 8 capas (Workforce Planning) |
| `references/executive-portadas.md` | Para Landing Cards / SpotlightCard de personas |
| `references/anti-patterns.md` | Para lista completa de anti-patrones con código |
| `references/premium-components.md` | Para Gauge SVG, animaciones, botones premium |
| `references/MANIFIESTO_FOCALIZAHR_v5.md` | Para principios filosóficos del producto |

> IMPORTANTE: Los tokens de esta sección principal son CANÓNICOS.
> Si una referencia contradice un token de aquí, el token de aquí gana.

---

## NOTIFICACIONES

Para CUALQUIER toast, feedback, error, success → usar skill `focalizahr-notificaciones`.
NUNCA usar shadcn `use-toast` directamente.
