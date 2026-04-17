# 🧠 PATRÓN G: GUIDED INTELLIGENCE (Intelligence Workspace)

> **Propósito:** Componentes de diagnóstico ejecutivo donde la complejidad ES el valor.
> **Regla de Oro:** Todo Patrón G es un Workspace de Pantalla Única. Zero scroll vertical en la página. Todo ocurre dentro del contenedor fijo.

"La competencia muestra datos en tablas. FocalizaHR muestra inteligencia en narrativa. Un componente Guided Intelligence vale más que mil filas de Excel."

---

## ⚠️ LO MÁS IMPORTANTE: ES UNA APP DE UNA PANTALLA

```
❌ Code interpretó mal la versión anterior:
   "6 capas" → construyó página larga con scroll

✅ Lo correcto:
   "2 estados" → contenedor fijo, contenido CAMBIA dentro
```

Cada "capa" es una PANTALLA COMPLETA que reemplaza a la anterior.
NO son secciones apiladas. NO hay scroll entre ellas.
El contenedor nunca se mueve. Solo su contenido interior cambia.

---

## 1. LEY DEL CONTENEDOR RÍGIDO (Single Viewport App)

```tsx
// ✅ SIEMPRE así — contenedor padre del componente
<div className="h-[700px] overflow-hidden relative">
  {/* TODO el Patrón G vive aquí dentro */}
  {/* El contenedor NUNCA se mueve */}
  {/* El contenido interior CAMBIA con useState */}
</div>
```

```yaml
REGLAS DEL CONTENEDOR:
  - Altura fija: h-[700px] o h-[calc(100vh-120px)]
  - overflow-hidden: OBLIGATORIO — elimina scroll global
  - position: relative — para AnimatePresence
  - Cero navegación a otras páginas
  - El CEO no sale de esta vista hasta tomar una decisión
```

---

## 2. EL MOTOR DE 2 ESTADOS (La Máquina Central)

```tsx
// REFERENCIA CANÓNICA — CalibrationHealth.tsx hace esto correctamente
const [view, setView] = useState<'portada' | 'workspace'>('portada')

return (
  <div className="h-[700px] overflow-hidden relative">
    <AnimatePresence mode="wait">
      {view === 'portada' ? (
        <motion.div key="portada" /* fade in/out */>
          <Portada onCTA={() => setView('workspace')} />
        </motion.div>
      ) : (
        <motion.div key="workspace" /* fade in/out */>
          <Workspace onBack={() => setView('portada')} />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
```

```yaml
ESTADO 1 — PORTADA (Impact Hook):
  - Ocupa el 100% del contenedor
  - Muestra UN número crítico de negocio (CLP, riesgo, %)
  - UN solo CTA: "Ver Evidencia" / "Analizar" / "Explorar"
  - Al hacer clic → transición AnimatePresence al Estado 2
  - NO hay scroll. Si no cabe, simplificar el contenido.

ESTADO 2 — WORKSPACE (Layout 70/30):
  - El contenedor se divide en flex row rígido
  - 70% izquierda: El Lienzo (área interactiva)
  - 30% derecha: El Panel de Control (fijo, siempre visible)
  - Botón "Volver" arriba derecha para regresar a Portada
```

---

## 3. ANATOMÍA DEL WORKSPACE 70/30

```tsx
// Estado 2: Layout rígido, inamovible
<div className="flex h-full">

  {/* EL LIENZO — 70% */}
  <div className="flex-1 overflow-hidden flex flex-col">
    {/* Tabs de navegación (si aplica) */}
    <div className="flex gap-4 border-b border-slate-700/50 px-6 pt-4 pb-0 shrink-0">
      {tabs.map(tab => (
        <button key={tab} className={`pb-3 text-sm ${
          activeTab === tab
            ? 'text-cyan-400 border-b-2 border-cyan-400'
            : 'text-slate-500'
        }`}>{tab}</button>
      ))}
    </div>

    {/* Contenido del tab activo */}
    {/* Si hay lista larga, SOLO ESTA ZONA tiene scroll interno */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Matrices, grafos, categorías selectoras, listas */}
    </div>
  </div>

  {/* EL PANEL DE CONTROL — 30% */}
  <div className="w-[300px] shrink-0 border-l border-slate-700/50 flex flex-col h-full">

    {/* ACUMULADORES (Top) — reactivos a lo que el CEO toca en el Lienzo */}
    <div className="p-4 border-b border-slate-700/30 shrink-0">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">
        Impacto identificado
      </span>
      <p className="text-2xl font-extralight text-white mt-1">
        {formatCLP(impacto)}
      </p>
      <p className="text-xs text-slate-500">{descripcionImpacto}</p>
    </div>

    {/* NARRATIVA (Centro) — scrollable solo si es largo */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <span className="text-[11px] text-slate-400">— La observación</span>
        <p className="text-slate-300 font-light mt-1 text-sm">{narrativa.observacion}</p>
      </div>
      <div className="border-l-2 border-cyan-500/40 pl-3">
        <span className="text-[11px] text-slate-400">— La decisión de valor</span>
        <p className="text-slate-300 font-light mt-1 text-sm">{narrativa.decision}</p>
      </div>
    </div>

    {/* ACCIÓN (Bottom) — siempre visible */}
    <div className="p-4 border-t border-slate-700/30 shrink-0">
      <button className="fhr-btn-secondary w-full text-sm">
        {labelAccion}
      </button>
    </div>

  </div>
</div>
```

---

## 4. REGLA DEL ZERO SCROLL

```yaml
JERARQUÍA DE SCROLL PERMITIDO:

✅ PERMITIDO — scroll INTERNO de una zona pequeña:
  - Lista de personas dentro del Lienzo (max-h limitado, overflow-y-auto)
  - Narrativa larga en el Panel de Control (flex-1 overflow-y-auto)
  
❌ PROHIBIDO — scroll que MUEVE el marco:
  - Scroll de página (document)
  - Scroll que mueve el contenedor padre h-[700px]
  - Scroll que oculta los Acumuladores o la Acción del Panel de Control
  - Scroll que oculta los tabs de navegación del Lienzo

REGLA PRÁCTICA:
  Si en un iPhone en horizontal cabe todo sin mover la página → correcto.
  Si el CEO tiene que scrollear para ver el botón de Acción → incorrecto.
```

---

## 5. EL LIENZO (70% Izquierda)

```yaml
PROPÓSITO:
  Donde el CEO "juega" con los datos estratégicos.
  Interactivo. Responde a clics. Alimenta el Panel de Control.

ELEMENTOS QUE VIVEN AQUÍ:
  - Tabs de perspectiva (Mérito | Bonos | Señales)
  - Cards selectoras de categoría (con número grande, auto-selección)
  - Matrices 2x2 interactivas
  - Mapas de calor por gerencia
  - Listas de personas (con scroll interno propio)
  - Grafos de red (cuando aplica)

REGLA DE AUTO-SELECCIÓN:
  Siempre aterrizar con la categoría más crítica seleccionada.
  NUNCA mostrar estado vacío al cargar.
  Orden de prioridad: DOUBLE_RISK > PERCEPTION_BIAS > HIDDEN_PERFORMER > CONSISTENT

FILOSOFÍA:
  Toca para entender.
  Cada elemento que el CEO toca actualiza los Acumuladores del Panel de Control.
```

---

## 6. EL PANEL DE CONTROL (30% Derecha)

```yaml
PROPÓSITO:
  Columna fija. Siempre visible. Procesa la inteligencia
  en tiempo real según lo que el CEO toca en el Lienzo.

ZONAS (de arriba a abajo, inamovibles):

  ZONA A — ACUMULADORES (shrink-0, border-b):
    Datos financieros reactivos.
    Cambian al tocar elementos en el Lienzo.
    Ejemplo: "Costo de rotación de este grupo: $24.000.000 CLP"
    Número grande + descripción pequeña + delta si aplica.

  ZONA B — NARRATIVA (flex-1, overflow-y-auto si es larga):
    Sección "La observación" — qué está pasando, tono McKinsey.
    Sección "La decisión de valor" — preguntas que el CEO debe hacerse.
    Sección "Segunda variable" — motor que explica la discrepancia (condicional).
    Coaching Tip — una línea accionable con ícono bombilla (condicional).

  ZONA C — ACCIÓN (shrink-0, border-t):
    UN botón de ejecución.
    Siempre visible. Nunca se oculta con scroll.
    Ejemplo: "Enviar a RRHH", "Generar Simulación", "Agregar al Plan".
```

---

## 7. ANATOMÍA DE LA PORTADA (Estado 1)

```tsx
// 100% del contenedor, sin scroll
<div className="h-full flex flex-col items-center justify-center p-8 text-center">

  {/* Línea Tesla */}
  <div className="absolute top-0 left-0 right-0 h-[2px]"
    style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }} />

  {/* Contexto */}
  <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">
    Workforce Intelligence
  </span>

  {/* Número protagonista — en BLANCO, no cyan */}
  <p className="text-[72px] font-extralight text-white leading-none mb-2">
    {numeroProtagonista}
  </p>

  {/* Título */}
  <h2 className="text-3xl font-extralight text-white mb-1">
    Personas en{' '}
    <span className="fhr-title-gradient">zona de riesgo</span>
  </h2>

  {/* Narrativa — máximo 2 líneas */}
  <p className="text-slate-400 font-light text-base max-w-md mb-2">
    {narrativaBreve}
  </p>

  {/* Consecuencia — más pequeña, separada */}
  <p className="text-slate-500 text-sm mb-8">{consecuencia}</p>

  {/* UN SOLO CTA */}
  <PrimaryButton onClick={onCTA} icon={ArrowRight}>
    Ver Evidencia
  </PrimaryButton>

</div>
```

```yaml
JERARQUÍA PORTADA:
  Número protagonista:  text-[72px] font-extralight text-WHITE (no cyan)
  Título principal:     text-3xl font-extralight text-white
  Subtítulo gradient:   fhr-title-gradient
  Narrativa:            text-base text-slate-400 font-light
  Consecuencia:         text-sm text-slate-500 (separada con mb-3)
  CTA:                  PrimaryButton — único, centrado

REGLA: El número en BLANCO para no competir visualmente con el CTA cyan.
```

---

## 8. TRANSICIONES (AnimatePresence)

```tsx
// Transición estándar entre Portada y Workspace
const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } }
}

// Botón Volver — presente desde Workspace
<button
  onClick={() => setView('portada')}
  className="border border-slate-800 text-slate-500 hover:border-cyan-500/20
             hover:text-slate-400 text-[10px] px-3 py-1.5 rounded-md
             flex items-center gap-1.5 transition-all">
  <Home className="w-3 h-3" /> Portada
</button>
```

---

## 9. ANTI-PATRONES PROHIBIDOS

```yaml
❌ SCROLL ENTRE CAPAS:
  "6 capas en una página larga" → INCORRECTO
  Cada capa es una pantalla completa que REEMPLAZA a la anterior.

❌ PÁGINA QUE SE MUEVE:
  Scroll del documento que oculta el Panel de Control → INCORRECTO
  El marco nunca se mueve. Solo el contenido interior cambia.

❌ ESTADO VACÍO AL ATERRIZAR:
  "Selecciona una categoría para comenzar" → INCORRECTO
  Auto-seleccionar siempre la categoría más crítica al cargar.

❌ MODALES:
  Toda información secundaria va en el Panel de Control (30%).
  Los modales rompen el "universo cerrado" del Workspace.

❌ TABLAS COMO DEFAULT:
  La tabla es último recurso.
  Priorizar: matrices, cards selectoras, grafos, mapas de calor.

❌ SpotlightCard dentro de Patrón G:
  El Patrón G evalúa ESTRUCTURAS y GRUPOS, no personas individuales.
  Para personas individuales → Cinema Mode.

❌ MÚLTIPLES CTA EN PORTADA:
  La portada tiene UN solo botón principal.
  Si el CEO necesita "Exportar" o "Comparar", eso va en el Workspace.
```

---

## 10. CUÁNDO USAR PATRÓN G

```yaml
✅ USAR para:
  - Correlaciones cross-dimensionales (metas vs desempeño vs sesgo)
  - Simuladores con impacto financiero reactivo
  - Hallazgos que cruzan 2+ motores de inteligencia FocalizaHR
  - Diagnósticos donde mostrar datos sin contexto genera confusión
  - Cualquier análisis donde el CEO debe "explorar" antes de decidir

❌ NO USAR para:
  - Métricas simples de un eje → Patrón Smart Router
  - Listas operativas → Rail Colapsable
  - Procesos secuenciales persona por persona → Cinema Mode
  - KPIs de monitoreo pasivo → Executive Dashboard (Patrón B)
```

---

## 11. EJEMPLO CANÓNICO: CompensationBoard

```yaml
COMPONENTE: CompensationBoard
RUTA: /dashboard/executive-hub/components/GoalsCorrelation/cascada/

ESTADO 1 — PORTADA:
  Número: N personas con discrepancia mérito/evaluación
  CTA: "Analizar discrepancias"

ESTADO 2 — WORKSPACE 70/30:
  LIENZO (70%):
    Tabs: Mérito | Bonos | Señales
    Cards selectoras: Sesgo evaluador, Talento invisible, Doble riesgo, Alineados
    Lista personas de la categoría seleccionada (scroll interno)

  PANEL DE CONTROL (30%):
    Acumuladores: Impacto estimado en compensación ($CLP)
    Narrativa: Observación + Decisión de valor + Segunda variable
    Acción: "Enviar a RRHH" → sistema Resend existente

REFERENCIA DE CÓDIGO: CalibrationHealth.tsx
  → Patrón useState<'portada' | 'content'> implementado correctamente.
```

---

## 12. DOS VARIANTES DEL WORKSPACE

El Patrón G tiene dos implementaciones internas válidas. Elegir según el tipo de instrumento:

```yaml
VARIANTE A — TABS (análisis comparativo):
  Cuándo: Múltiples perspectivas del mismo dato
  Mecánica: Workspace 70/30 con tabs en el Lienzo
  Ejemplos: CompensationBoard (Mérito | Bonos | Señales)
  
  LIENZO (70%): Tabs horizontales + contenido del tab activo
  PANEL (30%):  Acumuladores + Narrativa + Acción (fijo)

VARIANTE B — ACTOS (instrumento operacional):
  Cuándo: Flujo con consecuencia acumulada, CEO opera paso a paso
  Mecánica: 4 Actos en scroll vertical DENTRO del contenedor
  Ejemplos: Simulador de cargos IA, OrgDesign Studio
  
  ACTO 0: ¿Por qué me importa? (portada — número + contradicción)
  ACTO 1: ¿Qué tiene? (ancla — evidencia agrupada)
  ACTO 2: ¿Qué puedo hacer? (simulador — CEO opera)
  ACTO 3: ¿Cuánto capturé? (síntesis — footer sticky con consecuencia)
```

```
REGLA DE ELECCIÓN:
  ¿El CEO compara perspectivas del mismo dato?  → Variante A (Tabs)
  ¿El CEO necesita entender ANTES de operar?    → Variante B (Actos)
```

### Variante B: Reglas de los 4 Actos

```yaml
ACTO 0 — PORTADA:
  El CEO llega frío. Sin contexto previo, el instrumento no tiene
  peso emocional. La portada responde "¿por qué este cargo/problema
  me importa?" ANTES de mostrar cualquier dato.
  Formato: UN número crítico + UNA contradicción + UN CTA

ACTO 1 — ANCLA:
  La evidencia agrupada. Máximo 3 bloques visuales.
  El CEO entiende la estructura del problema completo de un vistazo.

ACTO 2 — SIMULADOR:
  El CEO opera. Sliders, selecciones, interacciones.
  REGLA: separar la acción (horas, %) de la consecuencia ($CLP).
  Nunca ambos en el mismo elemento visual.

ACTO 3 — SÍNTESIS:
  Footer sticky con la consecuencia acumulada.
  Responde: ¿cuánto capturé / cuánto cuesta la inercia?
  Siempre visible mientras el CEO opera en Acto 2.
```

### Reglas visuales validadas (ambas variantes)

```yaml
CONTENEDOR COMO PRODUCTO:
  max-w-4xl centrado + rounded-2xl + shadow-2xl sobre fondo oscuro
  = aspecto de aplicación nativa, no página web
  El contenedor es el producto. El fondo es el contexto.

DATO ÚNICO = PROTAGONISMO EXPLÍCITO:
  El dato que ningún competidor tiene necesita:
  ícono propio + color semántico propio (ej: cerebro púrpura para Anthropic)
  No puede ser nota al pie. Debe ser hallazgo visual.

SEPARAR ACCIÓN DE CONSECUENCIA:
  Acción operacional (horas, %) → en el elemento interactivo
  Consecuencia financiera ($CLP) → en footer/panel separado
  Mezclarlos en el mismo elemento confunde la decisión.

CADA ELEMENTO RESPONDE UNA PREGUNTA:
  Si un elemento visual no responde ninguna pregunta del CEO → eliminarlo.
  Velocímetro decorativo → fuera.
  Número con color dinámico que comunica decisión real → dentro.
```

---

## 13. CHECKLIST ANTES DE ENTREGAR

```yaml
CONTENEDOR:
  □ ¿Tiene h-[700px] o h-[calc(100vh-Xpx)]?
  □ ¿Tiene overflow-hidden?
  □ ¿El documento/página NO scrollea cuando el componente está activo?

MOTOR DE ESTADOS:
  □ ¿Usa useState para manejar 'portada' | 'workspace'?
  □ ¿Usa AnimatePresence para las transiciones?
  □ ¿Hay botón "Volver" en el Workspace?

PORTADA:
  □ ¿Número protagonista en BLANCO (no cyan)?
  □ ¿UN solo CTA principal?
  □ ¿Cabe todo sin scroll en h-[700px]?

WORKSPACE:
  □ ¿Layout flex row rígido (70/30)?
  □ ¿Panel de Control siempre visible (shrink-0)?
  □ ¿Acumuladores en la zona top del Panel?
  □ ¿Acción en la zona bottom del Panel (shrink-0)?
  □ ¿Auto-selección de categoría más crítica al cargar?
  □ ¿Scroll interno SOLO en zonas de lista, no en el marco?

ANTI-PATRONES:
  □ ¿Cero modales?
  □ ¿Cero tablas como vista principal?
  □ ¿No hay SpotlightCard dentro?
  □ ¿No hay scroll de página?
```
