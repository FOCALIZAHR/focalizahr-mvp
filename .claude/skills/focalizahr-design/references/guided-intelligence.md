# 🧠 PATRÓN G: GUIDED INTELLIGENCE

> **Propósito:** Comunicar hallazgos de alto valor intelectual donde la complejidad ES el valor. No todo se entiende en 3 segundos — algunos insights valen 30 segundos de lectura guiada porque el descubrimiento que revelan ahorra meses de errores.

"La competencia muestra datos en tablas. FocalizaHR muestra inteligencia en narrativa. Un componente Guided Intelligence vale más que mil filas de Excel."

---

## FILOSOFÍA

```
PROBLEMA QUE RESUELVE:
  Décadas de reportes de RRHH mostrando datos sin contexto.
  El CEO ve números pero no entiende QUÉ significan,
  POR QUÉ importan, ni QUÉ hacer con ellos.

  Un badge que dice "Sesgo evaluador" no comunica nada.
  Una narrativa que dice "El jefe de esta persona fue clasificado
  como Mano Blanda — el 80% de sus evaluaciones están sobre 4.0.
  La evaluación alta no refleja desempeño real, refleja criterio laxo."
  — eso sí genera acción.

PRINCIPIO TUFTE APLICADO:
  "El gráfico y su explicación no deberían estar separados
   en espacios cognitivos distintos."
  → La narrativa y la evidencia viven lado a lado.

PRINCIPIO PROGRESSIVE DISCLOSURE:
  "Restringir la interfaz inicial a resúmenes de alto nivel,
   luego implementar exploración guiada que gradualmente
   introduce insights más profundos." (Nielsen-Norman)
  → Selector → Categorías → Narrativa → Personas → Acción.

LA VELOCIDAD DE COMPRENSIÓN:
  La velocidad no está en la simplicidad del dato
  — está en la claridad de la narrativa.
  Un componente visual con narrativa guiada comunica
  lo que un bloque de texto no puede lograr.
  Nos comunicamos como Apple: con simplicidad y fuerza visual.
```

---

## CUÁNDO USAR

```yaml
✅ USAR GUIDED INTELLIGENCE para:
  - Correlaciones cross-dimensionales (metas vs desempeño vs sesgo)
  - Discrepancias con múltiples variables explicativas
  - Hallazgos que contradicen la intuición del ejecutivo
  - Insights donde mostrar datos sin contexto genera más confusión que claridad
  - Problemas crónicos de negocio que RRHH no ha resuelto en décadas
  - Cualquier cruce de 2+ motores de inteligencia FocalizaHR

❌ NO USAR para:
  - Métricas simples de un solo eje → Patrón 1 (Smart Router)
  - Listas operativas → Patrón 2 (Rail Colapsable)
  - Procesos secuenciales → Cinema Mode
  - KPIs de monitoreo → Patrón 6 (Executive Dashboard)
```

---

## ESTRUCTURA: 6 CAPAS

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ═══ LÍNEA TESLA ═══════════════════════════════════════════════    ┃
┃                                                                     ┃
┃  CAPA 1: CONTEXTO (header)                                         ┃
┃  ┌────────────────────────────────┬────────────────────────────┐    ┃
┃  │  Producto / Módulo (tiny)      │                            │    ┃
┃  │  Título                        │  N personas con hallazgo   │    ┃
┃  │  Subtítulo gradiente           │  Descripción accionable    │    ┃
┃  └────────────────────────────────┴────────────────────────────┘    ┃
┃                                                                     ┃
┃  CAPA 2: PERSPECTIVAS (tabs underline)                             ┃
┃  ──────────────────────────────────────────────────────────         ┃
┃  │ Mérito │ Bonos │ Señales │                                      ┃
┃  ─────────────────────────────                                      ┃
┃                                                                     ┃
┃  CAPA 3: CATEGORÍAS (cards selectoras)                             ┃
┃  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              ┃
┃  │    3     │ │    2     │ │    1     │ │    4     │              ┃
┃  │  Sesgo   │ │ Talento  │ │  Doble   │ │Alineados │              ┃
┃  │evaluador │ │invisible │ │  riesgo  │ │          │              ┃
┃  └──────────┘ └──────────┘ └──────────┘ └──────────┘              ┃
┃                                                                     ┃
┃  CAPA 4+5: SPLIT NARRATIVA + EVIDENCIA                            ┃
┃  ┌────────────────────────┬────────────────────────┐               ┃
┃  │                        │                        │               ┃
┃  │  LA OBSERVACIÓN        │  PERSONAS              │               ┃
┃  │  Qué está pasando      │  Quiénes, con score    │               ┃
┃  │                        │  y segunda variable     │               ┃
┃  │  LA DECISIÓN DE VALOR  │                        │               ┃
┃  │  Qué preguntas hacer   │  Tags sutiles por      │               ┃
┃  │                        │  tipo jefe/talento     │               ┃
┃  │  SEGUNDA VARIABLE      │                        │               ┃
┃  │  Motor que explica     │                        │               ┃
┃  │  la discrepancia       │                        │               ┃
┃  │                        │                        │               ┃
┃  │  💡 COACHING TIP       │  ┌──────────────────┐  │               ┃
┃  │                        │  │ Enviar a RRHH    │  │               ┃
┃  └────────────────────────┘  └──────────────────┘  │               ┃
┃                               CAPA 6: ACCIÓN       │               ┃
┃                              ──────────────────────┘               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## REGLA DE AUTO-SELECCIÓN

```yaml
CRÍTICO:
  El componente NUNCA debe aterrizar vacío.
  La categoría con mayor urgencia se auto-selecciona al cargar.

PRIORIDAD AUTO-SELECCIÓN:
  1. DOUBLE_RISK (si existe) → máxima urgencia
  2. PERCEPTION_BIAS / HIDDEN_PERFORMER → discrepancia activa
  3. CONSISTENT → si todo está bien, mostrar excelencia

CAMBIO DE TAB:
  Al cambiar de perspectiva, auto-seleccionar la categoría
  más crítica de esa nueva vista. Nunca dejar estado vacío.
```

---

## ANATOMÍA DE LA NARRATIVA

```yaml
SECCIÓN "LA OBSERVACIÓN":
  Qué: Describe el hallazgo en lenguaje de negocio
  Tono: McKinsey — directo, sin jerga RRHH
  Largo: 2-3 líneas máximo
  Estilo: font-weight 300, color slate-400, con <b> en palabras clave

SECCIÓN "LA DECISIÓN DE VALOR":
  Qué: Las preguntas que el CEO debe hacerse
  Tono: Consultivo — no da respuestas, abre las preguntas correctas
  Largo: 2-3 líneas con preguntas en bold
  Estilo: border-left gradiente cyan→purple, padding-left 14px

SECCIÓN "SEGUNDA VARIABLE" (condicional):
  Qué: Motor de inteligencia que EXPLICA la discrepancia
  Fuentes: CalibrationHealth (sesgo), TalentNarrativeService (talento)
  Estilo: Card interna con dot indicator cyan, background sutil
  Cuándo: Solo si el motor tiene datos para esa categoría

SECCIÓN "COACHING TIP" (condicional):
  Qué: Una línea accionable con urgencia temporal
  Icono: Bombilla (Lightbulb) en amber/40
  Estilo: text-xs, color slate-500
  Ejemplo: "Revisa estos perfiles antes de la próxima reunión de compensaciones."
```

---

## ANATOMÍA DE LA EVIDENCIA (Panel Derecho)

```yaml
HEADER:
  "N personas en esta categoría" — uppercase tracking-widest

FILAS:
  Rank + Nombre + Métrica principal + Tag segunda variable
  - Filas highlight: border-left amber sutil para casos de riesgo
  - Tags: pills redondeados, colores ghost (opacity 60%, border 12%)
  - Departamento: debajo en color casi invisible

ACCIÓN:
  Botón "Enviar a RRHH" — border sutil, hover cyan
  Conecta con sistema de emails existente (Resend + templates)
  CEO puede agregar comentario libre
```

---

## TÍTULOS DE NARRATIVA — REGLAS DE PUNTO FOCAL

```yaml
❌ PROHIBIDO:
  - Labels en 9px uppercase color #334155 (invisible)
  - Mismo peso visual para label y contenido
  - Labels que el ojo salta sin ver

✅ OBLIGATORIO:
  - Labels en 11px con font-weight 400
  - Color slate-400 mínimo (no slate-600+)
  - Opciones para aumentar presencia:
    a) Sentence case con dash cyan: "— La observación"
    b) Dot indicator antes: "● La observación"
    c) font-weight 500 en slate-300
  - El label GUÍA la lectura, no se esconde
```

---

## ANTI-PATRONES

```yaml
❌ LISTA SIN NARRATIVA:
  Mostrar personas con badges sin explicar qué significa
  → El CEO ve datos, no entiende la inteligencia

❌ NARRATIVA SIN EVIDENCIA:
  Explicar el problema sin mostrar quiénes están afectados
  → El CEO entiende pero no puede actuar

❌ TODO VISIBLE A LA VEZ:
  Mostrar las 4 categorías expandidas simultáneamente
  → Information overload, pierde el foco

❌ ESTADO VACÍO AL ATERRIZAR:
  "Selecciona una categoría" como primera vista
  → Dos clics antes de ver contenido = abandono

❌ BADGES COMO COMUNICACIÓN:
  "Sesgo evaluador" en un badge de 9px es críptico
  → Si requiere tooltip para entenderse, no funciona

❌ SEPARAR EXPLICACIÓN DE DATO:
  Narrativa en un modal, datos en una tabla
  → Tufte: "Aumenta error y reduce comprensión"
```

---

## EJEMPLO DE APLICACIÓN: CompensationBoard

```yaml
COMPONENTE: CompensationBoard (Checkpoint pre-compensación)
MÓDULO: Metas × Performance → Cascada
RUTA: /dashboard/executive-hub/components/GoalsCorrelation/cascada/

PERSPECTIVAS: Mérito | Bonos | Señales
CATEGORÍAS POR PERSPECTIVA:
  Mérito: Sesgo evaluador, Talento invisible, Doble riesgo, Alineados
  Bonos: Talento invisible, Sesgo evaluador, Doble riesgo, Alineados
  Señales: Alto bono + bajo mérito, Bajo bono + alto mérito, Doble negativa, Coherente

MOTORES NARRATIVOS CONECTADOS:
  - CompensacionNarrativeDictionary (La Observación + La Decisión de Valor)
  - CalibrationHealth / IntegrityScore (sesgo evaluador: Mano Blanda, Estándar de Hierro, Zona Gris)
  - TalentNarrativeService (tipo talento: Fuga Cerebros, Motor Equipo, Sucesor Natural)

ACCIÓN: Email a RRHH con template + comentario CEO vía sistema Resend existente
```

---

## FUTUROS COMPONENTES QUE USARÍAN PATRÓN G

```yaml
CANDIDATOS:
  - Exit Intelligence: correlaciones salida vs onboarding (Journey de la Ilusión)
  - Sucesión: gaps de pipeline con riesgo de vacancia
  - Calibración: discrepancias evaluador vs benchmark departamental
  - Cualquier cruce de 2+ capas de inteligencia donde el badge no alcanza
```

---

## 📋 CHECKLIST: Guided Intelligence

```yaml
HEADER:
  □ Contexto de módulo (tiny uppercase)
  □ Título split: palabra blanca + palabra gradiente
  □ Subtítulo descriptivo AL LADO (no abajo)
  □ Número protagonista en el subtítulo
  □ Línea Tesla en el tope del componente

PERSPECTIVAS:
  □ Tabs underline (no pills con color)
  □ Tab activa con border-bottom cyan
  □ Máximo 3-4 perspectivas

CATEGORÍAS:
  □ Cards con número grande (font-weight 200)
  □ Número despierta en cyan/white al seleccionar
  □ Dot indicator con glow en card activa
  □ Mini Tesla line en card activa
  □ Auto-selección de categoría más crítica al cargar
  □ Ancla descriptiva debajo del label (combinación de ejes)

NARRATIVA:
  □ Labels visibles (11px, slate-400 mínimo) SIN dash "—"
  □ "La observación" en prosa de negocio
  □ "La decisión de valor" con border-left gradiente
  □ Preguntas en líneas separadas (split por ?)
  □ Bold en ideas fuerza (font-medium text-slate-200)
  □ Segunda variable cuando el motor tiene datos
  □ Coaching tip con ícono bombilla al cierre

EVIDENCIA:
  □ Lista con rank + nombre + métrica + tag
  □ formatDisplayName() SIEMPRE para nombres
  □ Tags ghost uniformes (zero colores por urgencia)
  □ Tesla line solo en cards con señal (no CONSISTENT)
  □ Departamento como dato terciario

ACCIÓN:
  □ Botón "Enviar a RRHH" conectado a sistema email
  □ Campo para comentario del CEO
  □ Template automático con contexto del caso
```

---

## MEJORAS VALIDADAS (CompensationBoard v2)

### Estructura de Layers

```
Layer 0: PORTADA (sentencia + 1 CTA)
Layer 1: RANKING (opcional, cards expandibles por gerencia)
Layer 2: HUB (path cards)
Layer 3: ACTOS (stepper narrativo)
Layer 4: SPLIT (narrativa + evidencia)
```

La portada responde UNA pregunta previa al flujo. No repite info del Hub.

### Home Siempre Presente

Desde layer 2 en adelante, botón Home arriba derecha:

```tsx
<button onClick={() => setLayer('portada')}
  className="border border-slate-800 text-slate-500 hover:border-cyan-500/20 
             hover:text-slate-400 text-[10px] px-3 py-1.5 rounded-md 
             flex items-center gap-1.5 transition-all">
  <Home className="w-3 h-3" /> Portada
</button>
```

### Watermark de Números en Actos

```css
font-size: 180px;
font-weight: 900;
color: white;
opacity: 0.06;  /* NO 0.025 */
position: absolute;
bottom: -24px;
right: -6px;
pointer-events: none;
```

### Jerarquía de Título en Portada

```yaml
Título principal:    text-3xl font-extralight text-white
Subtítulo gradient:  text-2xl fhr-title-gradient  
Número protagonista: text-[72px] font-extralight text-white (NO cyan)
Narrativa:           text-base text-slate-400 font-light
Consecuencia:        text-sm text-slate-500 (separada con mb-3)
```

El número en BLANCO para no competir con el CTA cyan.

### Hallazgo Focaliza (Brain)

```tsx
// ❌ NO: Bloque grande que grita
🧠 INTELIGENCIA FOCALIZA

// ✅ SÍ: Título protagonista, Brain sutil
● El hallazgo Focaliza  🧠

// Brain como ícono sutil con tooltip
<Brain className="w-3.5 h-3.5 text-purple-400/40" />
// Tooltip: "Los algoritmos de inteligencia FocalizaHR detectaron 
// esta inconsistencia al cruzar múltiples fuentes de datos."
```

### Path Cards con Marca de Agua

```tsx
<div className="group relative p-6 rounded-xl border border-slate-800/50
                hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.08)]
                cursor-pointer transition-all duration-300 overflow-hidden">
  {/* Marca de agua: inicial de la perspectiva */}
  <div className="absolute bottom-2 right-2 text-[120px] font-serif 
                  text-white opacity-[0.03] group-hover:opacity-[0.06]
                  transition-opacity duration-300 pointer-events-none">
    M  {/* o B, S */}
  </div>
  
  {/* Número */}
  <span className="text-4xl font-extralight text-white 
                   group-hover:text-cyan-400 transition-colors">
    {count}
  </span>
  
  {/* Divisor sutil */}
  <div className="w-8 h-px bg-cyan-500/30 my-3" />
  
  {/* Label + descripción */}
  <span className="text-sm font-medium text-white">{name}</span>
  <span className="text-xs text-slate-500 font-light mt-1 block">{desc}</span>
</div>
```

### Cards Selectoras con Ancla

```tsx
{/* Ancla: combinación de ejes que define la categoría */}
<span className="text-[10px] text-slate-500 font-light mt-1 block">
  Cumple metas · no domina el cargo
</span>

{/* Tesla line solo en activa */}
{isActive && (
  <div className="absolute top-0 left-0 right-0 h-px 
                  bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
)}
```

### Tags Ghost Uniformes

Zero colores por urgencia. Todos igual:

```css
text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 
border border-slate-700/30 font-light
```

### Tesla Line Solo con Señal

```tsx
const hasSignal = point.riskQuadrant !== null || 
                  point.evaluatorStatus !== null || 
                  point.quadrant === 'DOUBLE_RISK'
// CONSISTENT sin línea Tesla
```

### Evidencia en 3 Columnas (no lista)

```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="text-center">
    <span className="text-2xl font-mono text-amber-400">0.01</span>
    <p className="text-[10px] text-slate-500">Correlación de Pearson (r)</p>
    <p className="text-[10px] text-amber-400/60">Equivale a azar puro</p>
  </div>
</div>
```

Veredicto narrativo ARRIBA, datos como evidencia DEBAJO.
