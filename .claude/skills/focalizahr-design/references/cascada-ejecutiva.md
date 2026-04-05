# PATRÓN: LA CASCADA EJECUTIVA FOCALIZAHR
# El método narrativo maestro para insights de directorio
# Versión: 1.0 · Fecha: 2026-04-05
# Referencia implementada: Metas × Performance (Tab 1 Diagnóstico)

---

## FILOSOFÍA

El CEO no lee un diagnóstico si no cree que el problema es real. La Cascada Ejecutiva resuelve ese problema de convicción en 3 movimientos secuenciales: primero **ancla** el número en la mente del CEO (Pre-Cascada), luego **construye la historia** caso por caso (Actos), finalmente **destila la decisión** (Síntesis). Cada movimiento tiene reglas distintas porque resuelven problemas distintos — confundirlos colapsa el método.

---

## ESTRUCTURA UNIVERSAL

```
┌─────────────────────────────────────────────────┐
│  PORTADA                                        │
│  StatusBadge + narrativa + CTA único            │
│  "El sistema funciona al 17%"                   │
│  [Ver evidencia →]                              │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  ACTO ANCLA (Pre-Cascada)                       │
│  Gauge central + 3-5 componentes + líneas       │
│  El CEO ENTIENDE el número antes de creerlo     │
│  [Ver diagnóstico completo →]                   │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  LA CASCADA (actos diagnósticos, N condicional) │
│  Acto 1 → 2 → ... → Síntesis                    │
│  Scroll-driven con whileInView, ActSeparator    │
│  Historia con nombre, gerencia y costo          │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  TABS DE APOYO (opcionales)                     │
│  Herramientas de exploración complementarias    │
│  El CEO puede ignorarlos sin perder la historia │
└─────────────────────────────────────────────────┘
```

**Flujo de atención del CEO**:
1. Portada → convicción inicial ("esto es importante")
2. Ancla → comprensión estructural ("entiendo de qué está hecho")
3. Cascada → historia forense ("veo el problema caso por caso")
4. Síntesis → decisión ("sé qué hacer")
5. Tabs → profundización opcional ("si quiero, exploro")

---

## PARTE 1 · ACTO ANCLA (PRE-CASCADA)

### Estado de implementación

**Patrón definido, componente reutilizable pendiente**. La Portada actual del insight Metas × Performance usa `PanelPortada` + `CoherenceGauge` en `GoalsCorrelation/index.tsx` — es una aproximación parcial al patrón Ancla, pero no tiene los 3-5 componentes con líneas conectoras descritos aquí. El componente `<AnclaInteligente />` propuesto en este documento es el siguiente paso: convertir el gauge aislado en un sistema de nodos explicados.

### Qué es el Acto Ancla

Una pantalla minimalista entre la portada y la cascada que **explica visualmente la composición del indicador principal**. No es un acto más — es la **premisa** que habilita todo lo que sigue. Sin ancla, la cascada es un informe. Con ancla, la cascada es una investigación.

### Qué NO es

- No es un dashboard con 10 métricas
- No es una tabla de desglose
- No es un gráfico de analista
- No es un acto narrativo largo

### Visual — Gauge + Líneas + Nodos

```
                    ┌─────────┐
                    │         │
                    │   17%   │    ← gauge FocalizaHR grande, central
                    │         │      Número en BLANCO, no en rojo
                    └────┬────┘      Arco del gauge en color de gravedad
                         │
              ┌──────────┼──────────┐
              │          │          │
              │          │          │
         ┌────┴───┐ ┌───┴────┐ ┌───┴────┐ ┌────────┐
         │  44%   │ │   1%   │ │  13%   │ │   0%   │
         │ ▓▓▓░░  │ │ ▓░░░░  │ │ ▓░░░░  │ │ ░░░░░  │
         │        │ │        │ │        │ │        │
         │Evalua- │ │Predic- │ │Estre-  │ │Geren-  │
         │ción vs │ │ción de │ │llas    │ │cias    │
         │result. │ │result. │ │reales  │ │confia. │
         └────────┘ └────────┘ └────────┘ └────────┘

         "De cada    "Azar      "1 de 8    "Ninguna
          10, en 4    puro"      respalda   tiene
          coincide"              con        base"
                                 datos"
```

### Principios de diseño del visual

**1. Gauge central como protagonista**
- Reutilizar el estilo del `CoherenceGauge` actual (SVG circular con glow)
- **Número DENTRO del gauge en `text-white`** — nunca rojo, nunca cyan, nunca purple
- **Arco del gauge en color de gravedad**: cyan >75%, amber 30-75%, purple <30%
- El color vive en la línea, no en el número

**2. Líneas elegantes que conectan**
- SVG paths delgados con gradiente sutil cyan→purple
- Curvas suaves desde el gauge hacia cada nodo
- **Animación térmica**: las líneas "cargan" secuencialmente desde el gauge hacia los nodos (stagger, 200ms entre cada una)
- Opacidad final ~0.3 para no competir con los nodos

**3. Nodos como componentes limpios**
- **Número grande arriba** (font-mono, color según valor)
- **Label debajo** (`text-xs text-slate-400 uppercase tracking-wider`)
- **Narrativa de UNA línea** (`text-xs text-slate-500`)
- **Micro-barra 2px** debajo del número, proporcional al valor (44% llena 44% del ancho, 0% queda ghost)
- Sin cards ni borders — nodos tipográficos puros

**4. Una sola pantalla sin scroll**
- Todo visible sin bajar
- El CEO mira 30 segundos y entiende la composición
- Mobile: nodos stackean verticalmente, líneas se convierten en conectores laterales

**5. Animación de montaje (carga térmica)**
```
t=0      Gauge aparece con fade + scale
t=400ms  Arco del gauge anima de 0% a valor final
t=800ms  Línea al nodo 1 crece desde gauge + nodo 1 fade in
t=1000ms Línea al nodo 2 crece + nodo 2 fade in
t=1200ms Línea al nodo 3 crece + nodo 3 fade in
t=1400ms Línea al nodo 4 crece + nodo 4 fade in
```

El efecto visual es de "carga térmica" — el gauge irradia energía hacia los componentes.

### Narrativas por componente (dinámicas por valor)

Cada nodo tiene UNA frase que traduce el número a lenguaje ejecutivo. La frase cambia según el valor:

| Rango | Tono | Ejemplo (componente "Evaluación vs resultados") |
|-------|------|--------------------------------------------------|
| Alto (>70%) | Confianza | "De cada 10, en 8 coincide" |
| Medio (30-70%) | Atención | "De cada 10, en 4 coincide. El resto es ruido" |
| Bajo (10-30%) | Alerta | "Solo 1 de cada 10 respalda la evaluación" |
| Crítico (<10%) | Crisis | "Las competencias no predicen resultados. Es azar" |
| Zero (0%) | Vacío | "Ninguna gerencia tiene base confiable" |

**Reglas de narrativa** (ver skill `focalizahr-narrativas` para detalle):
- Zero jerga: no "Pearson", no "desconexión", no "RoleFit", no "score360"
- Una idea por frase
- Sin instrucciones — solo hechos
- Sin cifras crudas en la frase (el número ya vive arriba)

### Regla del Ancla Científica (obligatoria)

**Al menos UN componente del Acto Ancla debe mostrar sustento metodológico explícito mediante tooltip (i).** Este componente es el "ancla de confianza" del insight — la pieza que aguanta escrutinio técnico cuando un analista pregunta *"¿de dónde sale ese número?"*.

Sin ancla científica, el Acto Ancla es decoración bonita. La convicción del CEO depende de dos capas:

1. **Confianza intuitiva** — narrativas en lenguaje ejecutivo (ya cubierto arriba)
2. **Respaldo técnico disponible** — sustento metodológico accesible con hover

Si la segunda capa no existe, el CEO no puede defender el insight en una reunión con otros ejecutivos o consultores externos.

#### Qué requiere backing

| Tipo de métrica | Requiere backing | Ejemplo | Por qué |
|---|---|---|---|
| **Predictiva** (correlación) | ✅ **SIEMPRE** | Pearson, regresión, ML scoring | Un analista puede discutir la metodología |
| **Causal** (test A/B) | ✅ **SIEMPRE** | Intervalos de confianza, p-value | Requiere defensa estadística |
| **Agregación** (promedio) | ❌ No | "67% de estrellas cumplen metas" | Conteo directo, no admite debate |
| **Descriptiva** (conteo) | ❌ No | "3 de 8 gerencias sin base" | Hechos, no modelos |
| **Normativa** (vs threshold) | ⚠️ A veces | "Cobertura < 70%" | Si el threshold es opinado, sí; si es consensuado, no |

#### Contenido obligatorio del tooltip

El tooltip científico debe explicar en lenguaje ejecutivo (no técnico) **3 cosas**:

1. **Cómo se calcula** — método específico (ej: "Coeficiente de Correlación de Pearson (r)")
2. **Qué mide** — una frase traducida al negocio (ej: "Mide si las competencias evaluadas predicen quién cumple metas")
3. **Umbrales de interpretación** — cuándo es confiable, cuándo no (ej: "Sobre 0.5 hay predicción, debajo de 0.3 es azar")

#### Ejemplo implementado — Metas × Performance

De los 4 componentes del Ancla, solo **uno** lleva tooltip (el que mide predictibilidad):

| Componente | Tipo | Backing |
|---|---|---|
| Evaluación vs resultados (44%) | Descriptiva | ❌ no requiere |
| **Poder predictivo (1%)** | **Predictiva (Pearson)** | ✅ **REQUERIDO** — tooltip (i) |
| Estrellas reales (13%) | Agregación | ❌ no requiere |
| Gerencias confiables (0%) | Agregación | ❌ no requiere |

Tooltip exacto usado en "Poder predictivo":

> *"Calculado mediante Coeficiente de Correlación de Pearson (r). Mide si las competencias evaluadas predicen quién cumple metas. Sobre 0.5 hay predicción, debajo de 0.3 es azar."*

#### Implementación en `<AnclaInteligente />`

El componente acepta `tooltip?: string` opcional en cada `AnclaComponent`:

```tsx
export interface AnclaComponent {
  value: number
  label: string
  narrative: string
  tooltip?: string  // ← sustento científico si aplica
}
```

Cuando `tooltip` está presente, renderiza un icono `<Info>` junto al label con hover revealing el texto. Si está ausente, el componente se renderiza limpio sin el icono — el patrón respeta que no todos los componentes requieren backing.

**Regla de oro**: si ningún componente del Ancla tiene tooltip, estás violando la regla. Buscá cuál de tus métricas es predictiva o causal y agregale sustento.

### CTA final

```tsx
<PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
  Ver diagnóstico completo
</PrimaryButton>
```

**Un solo CTA**. El ancla no propone ramas de navegación — solo profundiza en la historia.

### Edge case: indicador saludable (>75%)

Cuando el indicador es alto, el tono cambia pero el componente se renderiza igual:

- Arco del gauge en cyan con glow
- Nodos en color base (no amber/purple)
- Narrativas celebratorias: "Los datos son confiables. Base sólida para decisiones."
- CTA en tono neutro: "Explorar diagnóstico →" (no urgente)

### Componente reutilizable propuesto

```tsx
// src/components/executive/AnclaInteligente.tsx — PENDIENTE DE IMPLEMENTACIÓN

interface AnclaComponent {
  value: number            // 0-100
  label: string            // "Evaluación vs resultados"
  narrative: string        // "De cada 10, en 4 coincide"
}

interface AnclaInteligenteProps {
  score: number            // 0-100 (el indicador principal)
  label: string            // "Confiabilidad" | "Productividad" | etc.
  components: AnclaComponent[]  // 3 a 5 factores (nunca más)
  onContinue: () => void
  ctaLabel?: string        // default: "Ver diagnóstico completo"
}
```

**Responsabilidades del componente**:
- Renderizar el gauge central con `score` y `label`
- Calcular color del arco según gravedad
- Renderizar 3-5 nodos con líneas SVG conectoras
- Orquestar la animación térmica de montaje
- Layout responsive (desktop: radial; mobile: stack vertical)

**Lo que el componente NO hace**:
- No computa valores (los recibe ya normalizados)
- No decide narrativas (las recibe como strings)
- No define umbrales de color (los deriva del score directamente)

---

## PARTE 2 · ACTOS DE LA CASCADA

### Estructura común de un Acto

Cada acto de la cascada sigue la misma anatomía. Evidencia extraída de `ActoPanorama.tsx` y `ActoAnomalias.tsx`:

```tsx
// Estructura canónica (ActoPanorama.tsx)
return (
  <>
    <ActSeparator label="Resultados" color="cyan" />

    <div>
      {/* Ancla del acto — número gigante */}
      <motion.div {...fadeInDelay} className="text-center mb-10">
        <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
          {pctDesalineamiento}%
        </p>
        <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
          de desalineamiento organizacional
        </p>
      </motion.div>

      {/* Narrativa protagonista + hipótesis + coaching tip */}
      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
        <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
          De <span className="font-medium text-slate-200">{totalEvaluados}</span> personas evaluadas,
          el <span className="font-medium text-amber-400">{pctDesalineamiento}%</span> muestra
          una contradicción entre su capacidad y sus resultados de negocio.
        </p>
        <p className="text-base font-light text-slate-400 leading-relaxed text-center">
          O tus mejores evaluados no están entregando resultados.
          O quienes sí entregan no están siendo reconocidos por el sistema.
        </p>

        {/* Blockquote coaching */}
        <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
          <p className="text-sm italic font-light text-slate-300 leading-relaxed">
            El desalineamiento no es un dato más. Es la señal de que el sistema no está midiendo lo que el negocio necesita.
          </p>
        </div>
      </motion.div>
    </div>
  </>
)
```

### Los 5 elementos obligatorios de un acto

1. **`ActSeparator`** con label y color — marca el inicio del acto
2. **Ancla numérica** — dato gigante (`text-7xl md:text-8xl font-extralight`) + label uppercase
3. **Narrativa principal** en 2-3 párrafos con jerarquía:
   - Primer párrafo: `text-xl text-slate-300` (idea protagonista con palabras clave en `font-medium`)
   - Párrafos siguientes: `text-base text-slate-400` (hipótesis con "O")
4. **Coaching tip** en blockquote con borde izquierdo de color: `border-l-2 border-{color}-500/30 pl-4` + `text-sm italic text-slate-300`
5. **CTA `SubtleLink`** al final: "Ver N personas →" con flecha animada

### ActSeparator — primitivo compartido

Archivo: `cascada/shared.tsx`

```tsx
export function ActSeparator({ label, color }: { label: string; color: 'amber' | 'purple' | 'cyan' | 'red' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4"
    >
      <div className="flex-1 h-px bg-slate-800" />
      <span className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full', ACT_COLORS[color])}>
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </motion.div>
  )
}
```

**Uso en GoalsCascada.tsx**:
```tsx
<div className="space-y-24 pb-12">
  <ActoPanorama ... />        {/* ActSeparator: "Resultados" cyan */}
  <ActoAnomalias ... />       {/* ActSeparator: "Anomalías" amber */}
  <ActoEstrellas ... />       {/* ActSeparator: "Estrellas" amber */}
  <ActoCargosCriticos ... />  {/* ActSeparator: "Cargos Críticos" purple */}
  <ActoOrganizacion ... />    {/* ActSeparator: "Organización" purple */}
  <ActoSintesis ... />        {/* ActSeparator: "Síntesis" cyan */}
</div>
```

`space-y-24` es la respiración obligatoria entre actos.

### Animaciones scroll-driven (shared.tsx)

```tsx
const viewport = { once: true, margin: '-80px' }

export const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

export const fadeInDelay = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
}
```

**Regla**: el ancla numérica usa `fadeInDelay` (aparece 150ms después), la narrativa usa `fadeIn`. Esto crea micro-secuencia: primero el número golpea, después la explicación aterriza.

### Actos condicionales

Los actos pueden desaparecer según los datos. Regla: **si no hay dato, no hay acto** (return null al principio).

```tsx
// ActoEstrellas.tsx línea 23
if (total === 0) return null

// ActoCargosCriticos.tsx línea 23
if (total === 0) return null

// ActoAnomalias.tsx línea 42
if (topAlerts.length === 0) return null

// ActoOrganizacion.tsx línea 30
if (byGerencia.length === 0) return null
```

El **orquestador no controla la visibilidad** — cada acto decide si mostrarse. El orquestador solo pasa datos.

### Narrativa condicional por valor

Algunos actos cambian su narrativa según umbrales. Patrón de `ActoEstrellas.tsx`:

```tsx
{percentage >= 80 ? (
  <p>...base confiable, respaldada por ejecución...</p>
) : percentage >= 60 ? (
  <p>...{total - withHighGoals} no respaldan su clasificación...</p>
) : (
  <p>Solo {withHighGoals} de {total} estrellas cumplen metas...</p>
)}
```

**Regla de 3 tiers narrativos**:
- Tier sano (≥80%): celebra y confirma
- Tier atención (60-79%): observa y advierte
- Tier crítico (<60%): confronta sin suavizar

Los umbrales se eligen por métrica — no hay un único estándar.

### Diccionario centralizado de narrativas

Los hallazgos detallados (sub-findings dentro de un acto) no tienen su narrativa hardcoded en el componente — viven en un diccionario:

```ts
// src/config/narratives/GoalsNarrativeDictionary.ts

export interface GoalsNarrative {
  headline: string         // "Cumplen metas y están en riesgo de irse."
  description: string      // 2-3 oraciones con consecuencia
  coachingTip: string      // qué conversación tener
  teslaColor: string       // hex para Tesla line del bloque
}

export const GOALS_NARRATIVE_DICTIONARY: Record<string, GoalsNarrative> = {
  fugaProductiva: { ... },
  bonosSinRespaldo: { ... },
  talentoInvisible: { ... },
  // ...
}
```

El componente `FindingBlock.tsx` consume el diccionario:

```tsx
const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null
// ...
<p>{dictNarrative.headline}</p>
<p>{dictNarrative.description}</p>
<div className="border-l-2" style={{ borderColor: dictNarrative.teslaColor }}>
  {dictNarrative.coachingTip}
</div>
```

**Beneficio**: las narrativas están centralizadas, auditables contra las 6 Reglas de Oro (skill `focalizahr-narrativas`), y reutilizables entre cascada y tabs de apoyo.

### FindingBlock — primitivo para hallazgos dentro de un acto

Cuando un acto tiene sub-hallazgos (ej: `ActoAnomalias` muestra los top 2), se renderizan con `FindingBlock.tsx`. Estructura:

1. **Tesla line accent** (12px wide, 2px tall, con `boxShadow` del color del finding)
2. **Headline** (`text-xl font-light text-slate-200`) — la idea en una frase
3. **Description** (`text-base text-slate-400 leading-relaxed`) — 2-3 oraciones de contexto
4. **Count + impacto financiero** (`font-mono` con separador `·`)
5. **Coaching tip** en blockquote
6. **Links**: primario "Ver N personas →" (cyan) + secundario "Perspectiva de compensaciones" (slate)

---

## PARTE 3 · SÍNTESIS CON MOTOR DE DIAGNÓSTICO

### Qué hace el motor

El motor de síntesis **selecciona automáticamente** el diagnóstico más severo posible para el cierre de la cascada, basándose en los datos. No es una narrativa fija — es un árbol de decisión ejecutivo que prioriza causas.

Archivo: `src/lib/services/GoalsSynthesisEngine.ts`

### Anatomía del diagnóstico

```ts
export interface GoalsSynthesis {
  diagnosticType: GoalsDiagnosticType
  trigger: string           // "3 gerencias con evaluaciones inconsistentes"
  classification: string    // "Este no es un problema de X. Es un problema de Y."
  implication: string       // Por qué esa clasificación importa
  path: string              // Una dirección, no pasos
  accountability: string    // Quién debe actuar / cómo se mide
}
```

### Tipos de diagnóstico (prioridad descendente)

```ts
export type GoalsDiagnosticType =
  | 'EVALUADOR'                    // prioridad 1 — >=2 gerencias inconsistentes
  | 'CONCENTRACION'                // prioridad 2 — 1 gerencia domina el problema
  | 'ESTRELLAS_EN_RIESGO'          // prioridad 3 — <80% estrellas cumplen
  | 'FRAMEWORK'                    // prioridad 4 — Pearson < 0.3
  | 'ALINEADO'                     // saludable
  | 'DESALINEAMIENTO_GENERALIZADO' // default
```

**Regla del motor**: ordenar por prioridad y retornar el primer diagnóstico que dispare. Si hay EVALUADOR + FRAMEWORK, gana EVALUADOR (es más accionable).

### Ejemplo de rama (EVALUADOR — prioridad 1)

```ts
const gerenciasRed = byGerencia.filter(g => g.confidenceLevel === 'red')
if (gerenciasRed.length >= THRESHOLDS.EVALUADOR_MIN_GERENCIAS) {
  return {
    diagnosticType: 'EVALUADOR',
    trigger: `${gerenciasRed.length} gerencias con evaluaciones que no coinciden con resultados`,
    classification:
      'Este no es un problema de las personas. Es un problema de quién las evalúa.',
    implication:
      `El patrón se repite bajo el mismo liderazgo. Evaluaciones altas, metas bajas — en más de una gerencia. ` +
      `O el evaluador no diferencia entre quienes rinden y quienes no. ` +
      `O el sistema no le exige hacerlo.`,
    path: 'El problema tiene nombre. La conversación también.',
    accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
  }
}
```

### Patrón narrativo McKinsey

Todas las ramas siguen el mismo molde verbal:

```
classification: "Este no es un problema de [A]. Es un problema de [B]."
implication:    [Por qué ese cambio de foco importa — 2-3 oraciones con "O"]
path:           [Una dirección, no pasos. Sin imperativos. Sin plazos.]
accountability: [Cómo se medirá el resultado. Sin acusaciones.]
```

**Regla crítica**: el motor no recomienda — reencuadra. Convierte el problema percibido en el problema real, y deja al CEO la decisión. Ver skill `focalizahr-narrativas` para las 6 Reglas de Oro aplicadas aquí.

### Render en ActoSintesis.tsx

```tsx
const synthesis = useMemo(() => GoalsSynthesisEngine.generate(data), [data])

return (
  <>
    <ActSeparator label="Síntesis" color="cyan" />
    <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
      {/* Classification — hero verbal */}
      <p className="text-lg font-light text-slate-200 text-center">
        {synthesis.classification}
      </p>

      {/* Implication — el "por qué" */}
      <p className="text-base italic font-light text-slate-300 text-center">
        {synthesis.implication}
      </p>

      {/* Path — dirección */}
      <div className="border-l-2 border-cyan-500/30 pl-4">
        <p className="text-base font-light text-slate-400">{synthesis.path}</p>
      </div>

      {/* Accountability — accountability */}
      <p className="text-sm italic font-light text-slate-500 text-center">
        {synthesis.accountability}
      </p>
    </motion.div>
  </>
)
```

### Puente a tabs de apoyo con dato concreto

La síntesis termina con un **puente dato-driven** hacia los tabs de apoyo. No es una instrucción genérica — es un número que hace la conexión inevitable:

```tsx
// Dato del checkpoint de compensaciones
const discrepancyInComp =
  data.quadrantCounts.perceptionBias +
  data.quadrantCounts.hiddenPerformer +
  data.quadrantCounts.doubleRisk

{discrepancyInComp > 0 && (
  <p className="text-sm font-light text-slate-400 text-center border-t pt-4">
    <span className="text-white font-normal">{discrepancyInComp}</span>{' '}
    {discrepancyInComp === 1 ? 'persona' : 'personas'} con discrepancia{' '}
    están en la lista de compensaciones de este ciclo.
  </p>
)}

{/* Bridge instruccional sutil */}
<p className="text-[11px] font-light text-slate-600 text-center">
  Antes de aprobar compensaciones, valida estos datos en la pestaña Compensación.
</p>
```

**Regla del puente**: un dato concreto + una frase de bridge. El dato justifica el tab, la frase lo invita. Nunca un CTA grande — es transición, no acción.

### Caso saludable (ALINEADO)

El motor también maneja el caso positivo. Narrativa celebratoria pero con anclaje:

```ts
return {
  diagnosticType: 'ALINEADO',
  trigger: `${100 - pctDesalineamiento}% de coherencia entre evaluación y resultados`,
  classification: 'La evaluación y los resultados cuentan la misma historia.',
  implication:
    `El ${100 - pctDesalineamiento}% de la organización muestra coherencia. ` +
    `Eso no es casualidad — refleja un sistema de gestión que funciona.`,
  path:
    'La base es confiable para tomar decisiones de compensación. El desafío ahora es ' +
    'proteger a quienes sostienen este resultado — y no asumir que el paquete estándar alcanza.',
  accountability: 'El próximo ciclo confirmará si esta coherencia se mantiene o se erosiona.',
}
```

**Regla**: incluso cuando todo está bien, la síntesis no felicita ingenuamente. Reencuadra hacia el siguiente riesgo ("proteger lo que funciona").

---

## PARTE 4 · TABS DE APOYO

### Regla de existencia

Un tab de apoyo existe SOLO si:
1. **Aporta un ángulo que la cascada NO cubre**
2. **Es una herramienta de exploración, no más narrativa**
3. **El CEO puede ignorarlo completamente sin perder la historia**

Si un tab no cumple las 3, sobra.

### Regla de diferenciación

Cada tab responde **UNA pregunta distinta**. Ejemplo de Metas × Performance:

| Tab | Pregunta que responde | Tipo |
|-----|------------------------|------|
| **Diagnóstico** (cascada) | *"¿Qué tan grave es?"* | Narrativa forense |
| **Localización** | *"¿Dónde y quién?"* | Herramienta visual |
| **Compensación** | *"¿Puedo aprobar?"* | Checkpoint de acción |

Si dos tabs responden la misma pregunta → **sobra uno**.

### Regla de no-duplicación

Si un componente del tab repite datos de la cascada, debe mostrarlos desde **un ángulo distinto**:

- **Cascada** dice "56% desalineamiento" (impacto global)
- **Tab Localización** dice "3 gerencias concentran el 78%" (Pareto)
- **Tab Compensación** dice "esta gerencia no es auditable" (veredicto individual)

Mismos datos base, tres insights distintos. Cada uno tiene su **unidad mental**:
- Global → % del total
- Pareto → concentración 80/20
- Individual → veredicto caso por caso

Si dos tabs usan la misma unidad mental sobre los mismos datos, hay que fusionarlos o eliminar uno.

### Estructura interna de un tab de apoyo

Un tab de apoyo puede tener su propio Patrón G (portada + capas), especialmente si contiene múltiples componentes. Ejemplo: el Tab Localización usa 3 componentes (Scatter, GerenciaHeatmap, EvaluadorHeatmap) cada uno con su propia portada interna + drill-down.

Ver `GoalsCorrelation/index.tsx` (LocalizacionTab) y `CompensationBoard.tsx` (5 layers: portada → ranking → hub → acts → split) como referencias de tabs de apoyo implementados.

---

## APLICACIÓN: METAS × PERFORMANCE

### Estado: implementado

Archivos principales:
- **Portada**: `GoalsCorrelation/index.tsx` (PanelPortada + CoherenceGauge)
- **Orquestador**: `GoalsCorrelation/GoalsCascada.tsx` (6 actos)
- **Actos**: `GoalsCorrelation/cascada/Acto*.tsx`
- **Motor**: `lib/services/GoalsSynthesisEngine.ts`
- **Diccionario**: `config/narratives/GoalsNarrativeDictionary.ts`
- **Primitivos**: `GoalsCorrelation/cascada/shared.tsx` (ActSeparator, fadeIn, SubtleLink)

### Estructura implementada

```
PORTADA (GoalsCorrelation/index.tsx)
   PanelPortada con statusBadge + narrativa dinámica
   CoherenceGauge con score 0-100 + tooltip de componentes
   CTA: "Ver evidencia →" → entra a la cascada
        ↓
[ACTO ANCLA — PENDIENTE DE CONSTRUIR COMO COMPONENTE SEPARADO]
   Hoy: el CoherenceGauge de la portada cumple parcialmente este rol
   Faltante: los 3-5 nodos con líneas conectoras y narrativas por componente
        ↓
CASCADA — GoalsCascada.tsx (space-y-24)
   1. ActoPanorama      (Resultados, cyan)    — % desalineamiento global
   2. ActoAnomalias     (Anomalías, amber)    — top 2 hallazgos + costo financiero
   3. ActoEstrellas     (Estrellas, amber)    — condicional: % estrellas cumplen
   4. ActoCargosCriticos (Cargos Críticos, purple) — condicional: continuidad operacional
   5. ActoOrganizacion  (Organización, purple) — gerencias confiables vs en revisión
   6. ActoSintesis      (Síntesis, cyan)      — GoalsSynthesisEngine + puente a compensación
        ↓
TABS DE APOYO
   [Localización]   → Scatter + Pareto por gerencia + Cultura de evaluadores
   [Compensación]   → Portada → Ranking → Hub → Actos → Split
```

### Motor de síntesis — 6 ramas

`GoalsSynthesisEngine.generate(data)` retorna UNA de estas:

1. **EVALUADOR** — ≥2 gerencias red
2. **CONCENTRACION** — 1 gerencia red con disconnection > 50%
3. **ESTRELLAS_EN_RIESGO** — estrellas < 80% cumplimiento
4. **FRAMEWORK** — mejor Pearson < 0.3
5. **ALINEADO** — desalineamiento ≤ 15% y 0 gerencias red
6. **DESALINEAMIENTO_GENERALIZADO** — default

### Diccionario de narrativas — 5 hallazgos

`GOALS_NARRATIVE_DICTIONARY`:
- `fugaProductiva` — cumplen metas pero compromiso crítico
- `bonosSinRespaldo` — percepción alta, resultados bajos
- `talentoInvisible` — cumplen metas pero 360° bajo
- Más entradas para organización, cargos críticos, etc.

Cada entrada tiene `headline + description + coachingTip + teslaColor`.

---

## APLICACIÓN FUTURA: P&L DEL TALENTO

### Estado: cascada implementada, patrón documentable pendiente

Existe `PLTalent/components/PLTalentExecutiveBriefing.tsx` que sigue una estructura similar según la inscripción en `GoalsCascada.tsx:10` ("Patrón clonado de PLTalentExecutiveBriefing.tsx"). **No documentado en este archivo por decisión explícita** — pendiente de investigación y documentación en una siguiente iteración.

### Estructura esperada

```
PORTADA
   "Tu organización opera al 68% de capacidad."
        ↓
ACTO ANCLA (pendiente de construir)
   Gauge 68% + componentes:
   - Brecha mandos medios: 50%
   - Liderazgo bajo estándar: 67%
   - Cargos críticos deficitarios: 57%
        ↓
CASCADA (5 actos — investigar orden real)
   Productividad → Liderazgo → Impacto → Financiero → Cargos → Síntesis
```

### Motor de síntesis

Se asume que existe un equivalente a `GoalsSynthesisEngine` con ramas distintas de diagnóstico. **Investigar y documentar cuando se extienda este archivo**.

---

## APLICACIÓN FUTURA: CALIBRACIÓN

### Estado: conceptual

```
PORTADA
   "La integridad de tus evaluaciones es X%."
        ↓
ACTO ANCLA
   Gauge X% + componentes de integridad
        ↓
CASCADA
   Distribución → Gerencias → Evaluadores → Síntesis
```

Por implementar.

---

## ANTI-PATRONES

### Del Acto Ancla

- ❌ Gauge decorativo sin explicación de composición
- ❌ Desglose técnico expuesto (Pearson, desconexión, confidenceLevel, score360)
- ❌ Más de 5 componentes — si son más, agrupar
- ❌ Scroll en el Acto Ancla — todo visible sin bajar
- ❌ Narrativas iguales para valores distintos
- ❌ CTA que salta la Cascada directo a tabs
- ❌ Acto Ancla sin CTA — siempre empuja al siguiente paso
- ❌ Número del gauge en rojo/amber/cyan — el número va en blanco, el color vive en el arco

### De los Actos

- ❌ Acto sin `ActSeparator` al inicio
- ❌ Acto sin ancla numérica gigante (`text-7xl md:text-8xl`)
- ❌ Narrativa sin `max-w-2xl mx-auto` — rompe el ritmo vertical
- ❌ Coaching tip sin blockquote (`border-l-2 border-{color}-500/30`)
- ❌ Datos crudos en la narrativa sin `font-medium` en las palabras clave
- ❌ Acto obligatorio cuando no hay datos — debe retornar `null`
- ❌ Jerga HR en las narrativas (ver skill `focalizahr-narrativas`)

### De la Síntesis

- ❌ Conclusión sin motor — narrativa hardcoded que no responde a los datos
- ❌ Motor sin caso ALINEADO — el CEO saludable también merece una síntesis
- ❌ Instrucciones prescriptivas con plazos ("en los próximos 30 días...")
- ❌ Acusaciones directas sobre personas nombradas
- ❌ Puente a tab sin dato concreto — solo frase genérica "ve al otro tab"
- ❌ CTA grande al final de la síntesis — rompe el tono reflexivo

### De los Tabs de Apoyo

- ❌ Tab que duplica el ángulo de la cascada (misma pregunta, mismos datos)
- ❌ Tab con narrativa larga — el narrativa es de la cascada, el tab es herramienta
- ❌ Tab obligatorio para entender la cascada — debe ser ignorable
- ❌ Dos tabs con la misma unidad mental sobre los mismos datos

---

## PRINCIPIO RECTOR

> **"El CEO no lee un diagnóstico si no cree que el problema es real."**

El Acto Ancla convierte un número en convicción.
La Cascada convierte la convicción en comprensión.
La Síntesis convierte la comprensión en decisión.
Los Tabs de Apoyo convierten la decisión en acción.

Si un paso de la secuencia no cumple su trabajo, los siguientes fallan aunque estén bien construidos.

---

## REFERENCIAS CRUZADAS

- **Skill narrativas**: `.claude/skills/focalizahr-narrativas/SKILL.md` — las 6 Reglas de Oro aplicadas en actos y síntesis
- **Skill diseño**: `.claude/skills/focalizahr-design/references/guided-intelligence.md` — Patrón G (portada + capas) para tabs de apoyo
- **Implementación Goals**: `src/app/dashboard/executive-hub/components/GoalsCorrelation/` — codebase de referencia

---

**Versión 1.0** — escrita con evidencia del codebase (Goals × Performance) en 2026-04-05. P&L del Talento y Calibración pendientes de documentación en siguientes iteraciones.
