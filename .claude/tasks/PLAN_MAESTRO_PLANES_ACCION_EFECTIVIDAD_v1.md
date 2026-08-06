# PLAN MAESTRO — Planes de Acción: Hub + Seguimiento de Efectividad

> **Estado:** plan completo, listo para ejecutar. No es borrador ni idea.
> **Fecha:** 2026-08-04
> **Origen:** sesión de diseño Victor + Claude + Gemini (UX/UI/narrativa)
> **Destino:** un chat nuevo lee esto y construye. Sin contexto adicional.

---

## 0. El producto en una frase

Hoy "Planes de Acción" abre directo a unas pestañas de RRHH. Se
reestructura como un **hub con 3 mundos**, cada uno para una audiencia
distinta, bajo una sola card en el Rail de Clima. El tercer mundo
(Seguimiento de Efectividad) es la capa de inteligencia que cruza "qué
hizo cada jefe" con "si funcionó", analizado por LLM — algo que ninguna
plataforma del mercado hace hoy.

---

## 1. Arquitectura: una card, tres cápsulas

### 1.1 Cómo funciona hoy (lo que se reemplaza)

La card "Planes de Acción" en el Rail de Clima abre directo a
`ClimaPlanesView`, que tiene tabs internas (Tab 1 departamental, Tab 2
por persona). No hay hub, no hay enrutamiento.

### 1.2 Cómo queda

La card abre a un **hub** con 3 tarjetas grandes, cada una lleva a su
propio componente independiente. No son tabs — son tres mundos.

| Cápsula | Nombre | Para quién | Qué hace | Estado |
|---------|--------|------------|----------|--------|
| 1 | **Planes** | RRHH | Aprobación masiva por departamento (Tab 1) + consulta de asignación (Tab 2, solo lectura). Un solo flujo. | Ya funciona — solo conectar |
| 2 | **Bitácora** | Jefe / línea de mando | El jefe escribe qué hizo con cada plan. Componente nuevo, independiente, abierto desde card propia en el Rail. | En construcción (F3/F4) |
| 3 | **Seguimiento de Efectividad** | CEO / gerencia / RRHH | Inteligencia: cruza bitácora con resultados de clima, analiza con LLM, muestra hallazgos accionables. | **Este plan** |

### 1.3 Diseño del hub (aprobado por Victor, wireframes de Gemini)

**Barra de progreso global arriba del hub** (no dentro de ninguna
cápsula): planes con al menos 1 acción registrada vs. total de planes
asignados. Es lo primero que ve cualquier persona al entrar. Dato puro,
sin LLM — es una división sobre `ClimaActionLog.actionText !== null`.

Ejemplo: "34 de 42 planes registran al menos 1 acción (81%)"

**Las 3 tarjetas:**
- Peso visual idéntico en los botones — es navegación, no embudo. No
  hay un CTA dominante. Las tres son equivalentes.
- Badges por misión, no por rol: `[Aprobación & Cobertura]`,
  `[Registro & Bitácora]`, `[Inteligencia & Efectividad]`. No dicen
  "RRHH" ni "C-LEVEL" — no limitan quién puede entrar.
- Cada tarjeta comunica en 3 segundos qué mundo va a encontrar
  adentro, con una frase corta debajo del badge.

**Tesla Line:** solo en la firma de marca (gradiente cyan→violeta),
nunca cambia de color según contenido. No es un semáforo.

**Wireframe escritorio:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Clima > Planes de Acción                                         │
│ Progreso: [================================........] 81%         │
│ 34 de 42 planes con al menos 1 acción registrada                │
├──────────────────┬──────────────────┬────────────────────────────┤
│ [Aprobación &    │ [Registro &      │ [Inteligencia &            │
│  Cobertura]      │  Bitácora]       │  Efectividad]              │
│                  │                  │                            │
│ Aprobación de    │ Registro táctico │ Impacto real de las        │
│ planes y control │ de acciones por  │ intervenciones y           │
│ de cobertura por │ cada líder de    │ hallazgos basados en       │
│ departamento.    │ equipo.          │ evidencia.                 │
│                  │                  │                            │
│ [ Entrar → ]     │ [ Entrar → ]     │ [ Entrar → ]               │
└──────────────────┴──────────────────┴────────────────────────────┘
```

**Wireframe móvil 320px:** las 3 tarjetas se apilan verticalmente.
Barra de progreso arriba, fija.

---

## 2. Cápsula 3 — Seguimiento de Efectividad

### 2.1 Dos estados de la misma pantalla

No son dos vistas separadas. La pantalla muta según la disponibilidad
de datos:

**Estado A — Pre-resultados (solo actividad):**
Funciona ANTES de que RRHH lance el Seguimiento Focalizado. Muestra:
- Barra de progreso (la misma del hub, repetida acá como contexto).
- Cobertura de registro por gerencia (quién escribió, quién no).
- Cadencia táctica (cuándo escribieron — distribuido o concentrado).
- Sin hallazgos del LLM, sin cuadrantes, sin deltas — no hay ground
  truth todavía.

**Estado B — Post-resultados (inteligencia):**
Se activa al concluir la siguiente campaña de medición (Seguimiento
Focalizado). Agrega:
- Acto Ancla: delta global + multiplicador + cuadrantes de efectividad.
- Cascada de hallazgos (tarjetas Minto, una a la vez).
- Drill-down con evidencia táctica, citas de bitácora, métricas LLM.

La transición es automática — no requiere acción del usuario.

### 2.2 Datos disponibles (sin construir nada nuevo)

| Dato | Fuente | Estado |
|------|--------|--------|
| Plan aprobado (narrativa + pasos, por dimensión/departamento) | `ActionPlan.decisiones` | Ya existe |
| Texto libre de la bitácora (qué hizo, con fecha y autoría) | `ClimaActionLogEntry` | Sellado (Fase A) |
| Si mejoró o no (delta numérico por reactivo) | `PulseEngine.momentumDelta` | Sellado (Gate 3) |
| 4 cuadrantes (hizo+mejoró, hizo+no mejoró, etc.) | `ActionEffectivenessService` | Sellado (Gate 5C) |
| Quién es el responsable | `resolveDepartmentResponsable` | Sellado (Gate 1) |
| Cadena jerárquica completa | `resolveResponsableChain` | Sellado (F1) |
| 70+ motores de inteligencia (Performance, Metas, Exit, Onboarding, Compliance, Workforce, Efficiency) | Suite completa | Disponibles para cruces |

### 2.3 Motores de análisis LLM — qué construir y en qué orden

**PRIORIDAD 1 — Los más robustos (inmunes a subjetividad del LLM):**

1. **Densidad de Entidades:** contar en el texto libre fechas,
   herramientas, nombres de procesos, cantidades. "Hice una reunión"
   = densidad baja. "El martes pasé el reporte de Excel a Tableau
   para ahorrarles 2 horas" = densidad alta. Correlacionar con delta
   de clima. Implementable con NER básico o Haiku. Viable con N≥30
   entradas por área (alcanzable en el primer ciclo).

2. **Verbos de Ejecución vs. Intención:** clasificar el verbo núcleo
   de cada entrada: "Modificamos", "Eliminamos" (ejecución fuerte)
   vs. "Intentaremos", "Planteamos" (intención débil). Proporción de
   verbos fuertes cruzada con delta = predictor limpio. Haiku alcanza.

3. **Cadencia Temporal (Burstiness):** no qué escribe, sino cuándo.
   ¿Distribuido en 3 meses o todo junto 48h antes de la medición? No
   necesita LLM — es metadata pura (timestamps). Las ejecuciones
   distribuidas correlacionan mucho más con mejora que los atracones.

---

### 2.3.bis — Dos decisiones que corrigen lo de arriba (Victor, 2026-08-06)

Salieron de correr los motores 1 y 2 sobre las **8 entradas reales** de la cuenta
de prueba. No son ajustes de implementación: cambian lo que dice §2.3.

**(a) La densidad NUNCA se muestra sola. Va en un indicador compuesto.**

El motor 1 está descrito arriba como señal independiente. Los datos reales lo
desmienten: la entrada *"eso no es verdad, acá todos han crecido"* —una
refutación pura, sin ninguna acción— puntuó **densidad 2**, porque mencionaba
"próxima evaluación" y "encuesta". Leída sola, la densidad premia a quien
argumenta mejor, no a quien actúa.

La densidad se combina con el verbo en un score único:

| Verbo | Densidad | Señal | Score |
|---|---|---|---|
| ejecución | alta | fuerte | 2 |
| ejecución | baja | débil (acción vaga) | 1 |
| intención | cualquiera | **nula — argumenta, no actúa** | 0 |
| ninguno | cualquiera | nula | 0 |

Implementado en `deriveCompositeSignal()`
(`src/lib/services/clima/ClimaTextAnalysisService.ts`), función pura y sin LLM: el
modelo clasifica, la regla de negocio vive en el código.

**(b) Umbral de visibilidad: ≥30 entradas por gerencia.**

§2.3 pedía volumen solo para el clustering (PRIORIDAD 2). Se extiende a TODOS los
hallazgos de LLM que se le muestren al CEO: por debajo de 30 entradas por unidad
de análisis, la UI muestra placeholder.

⚠️ **Es un gate de VISIBILIDAD, no de cómputo.** El clasificador corre y persiste
desde la primera entrada, para que el día que se cruce el umbral haya historia
acumulada y no haya que reprocesar hacia atrás. Constante:
`CLIMA_LLM_MIN_ENTRIES_PER_UNIT` en `src/types/clima-text-analysis.ts`.

**Además: apareció una conducta que §2.3 no contemplaba.** Ni ejecución ni
intención — la REFUTACIÓN ("eso no es verdad"). Se agrupa hoy bajo `ninguno`,
sin inventarle un valor propio al union: eso sería contrato y lo decide Victor.

---

**PRIORIDAD 2 — Potentes, necesitan volumen:**

4. **Clustering Semántico con Resultado:** agrupar entradas por tipo
   de acción concreta (sin categorías predefinidas, el LLM las
   descubre de los datos). Cruzar cada cluster con si funcionó o no.
   Salida: "Los jefes que instalaron rituales de equipo mejoraron en
   73% de los casos; los que solo hicieron reunión informativa, 12%."
   Necesita mínimo 200-300 entradas globales.

5. **COM-B Contextualizado:** clasificar barreras de ejecución
   (Capacidad/Oportunidad/Motivación) inyectando como contexto los
   pasos concretos del plan aprobado — el LLM no adivina de qué habla
   el jefe, compara texto contra expectativa conocida. Eso lo hace
   viable con 200 caracteres, a diferencia de COM-B genérico. Valor:
   "El 60% de los planes fallaron por sobrecarga operativa, no por
   falta de motivación."

**DIFERIDO (necesita volumen de varios ciclos):**

6. **Taxonomía de Nudges** (situacional, default, social) — clasificar
   qué palanca de cambio activó el jefe. Necesita cientos de entradas.

7. **Locus de Control aislado** — valioso solo cruzado con otros
   motores (Compliance, Metas). No usar solo.

**DESCARTADO:**

- **Micro-Rebote (interceptar texto mientras escribe):** contradice
  la regla de cero presión. Genera abandono. La densidad de entidades
  ya obtiene la misma señal sin forzar nada.

### 2.4 Cruces con otros módulos de la suite

Integrados como sub-hallazgos dentro de la misma narrativa, no en
sección aparte:

- **Clima × Performance:** ¿los jefes que mejor ejecutan planes de
  clima también tienen mejor score en su 360?
- **Clima × Metas:** ¿los departamentos con metas de clima ("Fijar
  meta") mejoran más que los que solo tienen plan de acción?
- **Clima × Exit:** ¿los departamentos con bitácora activa tienen
  menos rotación voluntaria?
- **Clima × Onboarding:** ¿la experiencia de onboarding mejora donde
  el jefe está activo en planes de clima?

### 2.5 UI — cómo se muestra

**Principio:** respuesta arriba, datos abajo (Pirámide de Minto).

**Portada (Estado A y B):** barra de progreso + métrica simple.

**Acto Ancla (solo Estado B):** delta global + multiplicador +
distribución de cuadrantes. Una card grande, números protagonistas.

**Cascada de hallazgos (solo Estado B):** tarjetas colapsadas, una
por hallazgo. Cada tarjeta:
- Headline resolutivo en ≤8 palabras (la conclusión, no la pregunta).
- Al expandir (click/tap): 3 capas de evidencia:
  1. Dato real y delta (ej. grupo temprano +8.4 pts vs. tardío +3.5).
  2. Análisis LLM (verbos, densidad, cadencia, COM-B).
  3. Citas literales de la bitácora con nombre completo, cargo
     (Employee.position, con formatDisplayName()), fecha.
- Jerarquizados por impacto (mayor caída o mayor multiplicador
  primero), no por orden alfabético ni por departamento.

**Móvil 320px:** lectura secuencial vertical, una tarjeta a la vez.
**Escritorio:** cabecera con métrica global + lista de hallazgos con
desplegables inline.

**Estado vacío:** mensaje neutro y salida. "Sin registros de
efectividad todavía. Los hallazgos aparecen cuando se complete la
siguiente medición." Sin conclusiones, sin interpretar la ausencia.

### 2.6 Regla ética dura (no negociable)

El sistema NUNCA califica al jefe como persona. Califica la táctica
y la ejecución.

**Correcto:** "Juan Pérez, Jefe de Logística — plan con baja densidad
de ejecución táctica."
**Incorrecto:** "Juan Pérez es un mal gestor."
**Incorrecto:** "Líder Operativo — baja densidad." (anonimizar es
inútil, el CEO necesita saber a quién llamar).

Nombre completo + cargo se muestran siempre. La responsabilidad se
pone en el proceso, no en la persona.

### 2.7 Narrativas ejecutivas — tono y estructura

**Tono:** McKinsey / Apple. Directo, sin jerga de RRHH, sin
tecnicismos de LLM. Causa con el "O" de McKinsey ("o falló la
ejecución, o el plan era incorrecto"). Consecuencia sin prescribir.
Urgencia sin alarma.

**Headline base:** "Un plan de clima sin registro no es una
intervención — es una declaración de intenciones sin evidencia."

**Estructura de cada hallazgo (Cascada de 6 pasos):**
1. Gancho (el número que detiene al CEO)
2. El problema (impacto operacional)
3. Amplificador (nombre + cargo + dato concreto)
4. El costo (financiero / P&L)
5. El riesgo futuro (el "O" McKinsey — dos hipótesis, no un juicio)
6. Síntesis / francotirador (consecuencia sin prescribir)

**Auditoría contra las 6 Reglas de Oro:**
- Minto: respuesta arriba, datos abajo. Cumple.
- Contradicción: texto vs. delta real. Cumple.
- El "O": hipótesis separadas, cero juicios categóricos. Cumple.
- Consecuencia: sin instrucción ni prescripción operativa. Cumple.
- Sin jerga: "verbos de acción" en vez de "NLP", "velocidad de
  registro" en vez de "cadencia temporal". Cumple.
- Ritmo y cierre: frases cortas, ascendentes en gravedad. Cumple.

**Ejemplos de hallazgos (ficticios, para ilustrar el formato):**

> **Hallazgo 1: Velocidad de registro**
> "Registrar temprano multiplicó por 2.4x la efectividad del plan."
> [Expand → grupo temprano +8.4 pts vs. tardío +1.2 pts, cita de
> bitácora con nombre y cargo, métricas LLM]

> **Hallazgo 2: Verbos de ejecución**
> "Los planes redactados como intenciones no cambiaron el clima."
> [Expand → 68% intención vs. 32% ejecución, delta 0.0 en los de
> intención, cita con verbo concreto]

> **Hallazgo 3: Cadencia concentrada**
> "El 40% de los registros se concentraron en las últimas 48 horas.
> Esos departamentos mostraron delta de -3.1 pts."
> [Expand → distribución temporal, comparación con registros
> distribuidos]

**Nota:** estos ejemplos usan datos ficticios. El LLM generará
hallazgos reales a partir de los datos de cada empresa.

---

## 3. Ciclo de recordatorio inteligente (State-Aware Nudging)

**No es parte de este plan — es del módulo de Comunicaciones.** Se
documenta acá para que quien construya la cápsula 3 sepa qué datos
va a tener disponibles y cuándo.

**El ciclo completo:**

1. **Día 0:** Plan aprobado → correo único a 30 días (ya construido,
   `clima_action_reminder`, siembra inicial). Ya existe.
2. **Días intermedios:** el jefe escribe cuando quiere, sin presión.
3. **Pre-cierre:** cuando RRHH programa el Seguimiento Focalizado, el
   sistema avisa al jefe con mensaje hiper-específico:
   - Le dice QUÉ dimensión se va a medir en SU departamento.
   - Le dice su estado actual de bitácora.
   - Distingue jefe proactivo (ya tiene entradas) de jefe en blanco.
   - No regaña, no amenaza — informa estado real.
   **Este segundo recordatorio se coordina con el módulo de
   Comunicaciones, no se construye en este plan.**
4. **Cierre (t1):** Seguimiento Focalizado arroja delta real.
5. **Inteligencia:** LLM cruza texto acumulado con delta.

---

## 4. Lo que ya está construido y NO se toca

| Pieza | Estado | Qué hace |
|-------|--------|----------|
| Tab 1 (aprobación por RRHH) | Sellada | Aprueba planes por departamento |
| Tab 2 ("Atacar la causa", solo lectura) | Limpiada | Muestra qué plan le quedó asignado a cada persona |
| `ClimaActionLogEntry` (tabla) | Sellada, Fase A | Guarda entradas de la bitácora |
| `clima:action-log:write` (permiso) | Sellado, Fase A | Gate de escritura |
| `POST /api/clima/action-log` | Sellado, Fase A | Guarda una entrada con guard de propiedad |
| `GET /api/clima/action-log` | Sellado, V1 | Lee decisiones+logs filtrados por departamento |
| F1 (guard ampliado a línea jerárquica) | Sellado | Responsable o superior puede leer y escribir |
| F2 (modo persona-céntrico, autor en DTO) | Sellado | `scope=mine` devuelve hallazgos de la persona |
| `ActionEffectivenessService` (4 cuadrantes) | Sellado, Gate 5C | Calcula la matriz de efectividad |
| `PulseEngine` (momentumDelta) | Sellado, Gate 3 | Calcula si mejoró o no |
| `resolveDepartmentResponsable` | Sellado, Gate 1 | Resuelve quién es el responsable |
| `resolveResponsableChain` | Sellado, F1 | Resuelve la cadena jerárquica completa |
| `ClimaActionLogService.onClimaPlanApproved` | Sellado, Gate 5C | Crea logs + encola recordatorio 30 días |
| Bitácora (F3/F4) | En construcción | Componente nuevo + card en Rail |

**No se modifica NINGUNO de estos.** Si algo de la cápsula 3 necesita
un dato que no está en estos endpoints, se crea un endpoint nuevo —
no se modifican los existentes.

---

## 5. Orden de construcción

```
1. Cerrar Bitácora (F3 + F4)
   ↓
2. Hub con las 3 cápsulas
   - Conectar Cápsula 1 (Planes, ya existe)
   - Conectar Cápsula 2 (Bitácora, recién cerrada)
   - Placeholder para Cápsula 3
   ↓
3. Cápsula 3 — Estado A (pre-resultados)
   - Barra de progreso (conteo, sin LLM)
   - Cobertura por gerencia
   - Cadencia táctica (timestamps, sin LLM)
   ↓
4. Cápsula 3 — Estado B (post-resultados)
   - Acto Ancla (delta global + cuadrantes, ya calculados)
   - Motor de Densidad de Entidades
   - Motor de Verbos de Ejecución
   - Motor de Cadencia Temporal
   - Cascada de hallazgos con narrativas
   - Drill-down con evidencia
   ↓
5. Cápsula 3 — Motores avanzados (cuando haya volumen)
   - Clustering Semántico
   - COM-B Contextualizado
   - Cruces con otros módulos
```

**Dependencia externa (no de este plan):** el segundo recordatorio
(nudge pre-Seguimiento) se coordina con el módulo de Comunicaciones.
No bloquea nada de este orden.

---

## 6. Restricciones para quien construya

- **Tab 1 no se toca. Tab 2 no se toca. Ni un archivo.**
- **No nombrar patrones internos de diseño** (Cinema Mode, Patrón G,
  Smart Router) sin haberlos verificado en el código. Describir la
  interacción deseada y dejar que Code resuelva el patrón.
- **No nombrar clases CSS internas** (fhr-glass-card, fhr-btn-ghost)
  sin haberlas verificado en el código.
- **Cargar skills obligatorias antes de tocar UI:**
  `focalizahr-design`, `focalizahr-narrativas`, `focalizahr-notificaciones`.
- **Tesla Line:** siempre la misma (firma de marca), nunca cambia de
  color según contenido.
- **Campo de bitácora:** 200 caracteres, texto libre, sin mínimo,
  sin obligación, sin presión para escribir. Si el jefe no escribe,
  eso es un dato, no un error.
- **Regla ética:** calificar la táctica, nunca a la persona. Nombre
  completo + cargo siempre visibles, nunca anonimizados.
- **Estado vacío:** mensaje neutro y salida, sin narrativa editorial.
- **Narrativas:** consecuencia, no instrucción. El "O" de McKinsey
  para hipótesis, no juicios categóricos. Sin jerga de LLM en la UI
  visible.
- **Commits:** separados para código y documentación. `git status -s`
  antes de cada commit. `git add` archivo por archivo. No pushear.

---

## 7. Contexto de mercado (para quien escriba las narrativas)

**El dolor:** "Invertimos millones en medir clima y nada cambia."

**Lo que hace el mercado:**
- Nivel 1: nube de palabras (decorativo, no accionable).
- Nivel 2: sentimiento + temas (resumen, no evidencia).
- Nivel 3: consultoras leen a mano (caro, lento).

**Lo que FocalizaHR hace distinto (Nivel 4, no existe en el mercado):**
No tiene solo opiniones de encuesta — tiene texto de EJECUCIÓN real,
con resultado medido después. El LLM analiza acciones concretas con
su consecuencia, no sentimientos abstractos.

**La nube de palabras:** incluirla como vista básica (el mercado la
espera), pero abajo de todo. El producto principal son los hallazgos
con resultado.

**Ventaja competitiva en una frase:** FocalizaHR puede decir "en tu
propia empresa, los 5 departamentos que más mejoraron en Liderazgo
hicieron esto: [lista de acciones reales, de la bitácora]." Ningún
competidor puede hacerlo porque no tiene el texto de ejecución
cruzado con el resultado.

---

## 8. Instrucciones para el chat que construya esto

### 8.1 Metodología — Gate por gate, sin excepciones

Cada paso del orden de construcción (Sección 5) es un gate propio:

1. **Gate 0 (read-only):** antes de escribir una línea de código, leer
   los archivos reales involucrados con file:line. Reportar qué existe,
   qué no, y si algo del plan no coincide con el código real. NO
   proponer cambios todavía.
2. **Plan Mode:** proponer qué se va a hacer, qué archivos se tocan,
   qué no se toca. Mostrar a Victor ANTES de escribir código.
3. **Implementación:** solo después de aprobación explícita de Victor.
4. **Smoke con evidencia real:** probar contra la base de datos real,
   con datos leídos de vuelta (no "lo corrí y pasó" — mostrar el dato
   que volvió). Cleanup en `try/finally`, por id exacto + accountId.
5. **Sello:** `tsc` limpio, `next build` limpio, smoke borrado, commit
   separado código y doc.

**Si en cualquier paso aparece algo que el plan no contemplaba: PARAR
y reportar a Victor. No resolver por cuenta propia.**

### 8.2 Regla de oro — esto es 100% aditivo

**No se modifica NINGÚN archivo existente de Tab 1, Tab 2, Planes, ni
los endpoints sellados de Fase A/F1/F2/V1.** Todo lo que se construye
es nuevo: archivos nuevos, endpoints nuevos, componentes nuevos.

Si en algún momento parece que hay que modificar algo existente para
que funcione, eso es una señal de que algo del plan está mal — no de
que hay que modificar lo existente. Parar y reportar.

La única excepción pre-aprobada: agregar una card nueva al Rail
(`climaSubproductos.ts`, `clima.ts` union, `ClimaCinemaOrchestrator`
rama de render) — esos 3 puntos mínimos ya fueron aprobados en el
gate de la Bitácora y se repiten acá para el hub.

### 8.3 Skills obligatorias — cargar ANTES de escribir cualquier código

| Skill | Cuándo |
|-------|--------|
| `focalizahr-design` | Antes de tocar cualquier componente de UI |
| `focalizahr-narrativas` | Antes de escribir cualquier texto visible al usuario (copy, tooltips, narrativas, estados vacíos) |
| `focalizahr-notificaciones` | Antes de implementar cualquier feedback (toast, error, confirmación) |
| `focalizahr-api` | Antes de crear cualquier endpoint nuevo |

**No inventar copy sin cargar la skill de narrativas.** No inventar
toast sin cargar la skill de notificaciones. Las skills tienen reglas
específicas (tuteo, verbos prohibidos, patrones de error) que no se
pueden adivinar.

### 8.4 Cómo levanta los datos el LLM

Los motores de análisis (Densidad de Entidades, Verbos, Cadencia,
COM-B, Clustering) se ejecutan como **servicios de backend**, no en
el cliente. El flujo:

1. **Gatillo:** al cerrar un Seguimiento Focalizado (el mismo evento
   que ya dispara `ActionEffectivenessService`), se ejecutan los
   motores de análisis sobre las entradas de bitácora acumuladas
   entre t0 (aprobación) y t1 (cierre del seguimiento).

2. **Fuente de datos:**
   - Entradas de bitácora: `ClimaActionLogEntry` (texto, fecha,
     autoría) — ya existe, sellado.
   - Plan aprobado: `ActionPlan.decisiones` filtradas por departamento
     — el `GET /api/clima/action-log` (V1, sellado) ya lo devuelve
     acotado.
   - Delta de clima: `momentumDelta` por reactivo — `PulseEngine`, ya
     sellado.
   - Cuadrantes: `ActionEffectivenessService` — ya sellado.
   - Para COM-B contextualizado: los pasos del plan aprobado como
     contexto del prompt del LLM (ya disponibles en
     `ActionPlan.decisiones`).

3. **Procesamiento:**
   - Densidad de Entidades y Verbos: clasificación por entrada,
     ejecutable con Haiku (rápido, barato).
   - Cadencia Temporal: cálculo sobre timestamps, sin LLM.
   - Clustering: embeddings sobre el corpus completo del periodo,
     agrupación, cruce con delta.
   - COM-B: prompt con contexto del plan + texto de la entrada,
     clasificación por entrada.

4. **Persistencia:** los resultados se guardan como datos calculados
   (patrón ya existente en la plataforma: `DepartmentClimaInsight`,
   `ComplianceAnalysis`), no se recalculan en cada request. El
   frontend lee datos ya persistidos, nunca llama al LLM directo.

5. **El frontend solo lee:** la Cápsula 3 consume endpoints que
   devuelven hallazgos ya calculados y persistidos. No hay llamadas
   al LLM desde el cliente.

### 8.5 Cuenta de prueba y datos

- Cuenta: `cmfgedx7b00012413i92048wl` (Corporación Enterprise).
- **`User.employeeId` está en null para todos.** Para probar
  escritura/lectura con `canWrite:true`, hay que poblarlo
  temporalmente con el protocolo de cleanup ya establecido (poblar,
  probar, revertir a null en `try/finally`, verificar que volvió a
  null leyendo por id).
- **No crear ni modificar** `Department`, `Employee`, ni
  `responsableId` sin aprobación explícita.
- Smoke: cleanup en `try/finally`, por id exacto + accountId. Borrar
  el smoke al sellar.

### 8.6 Lo que pasó antes y no debe repetirse

Este plan nace después de 5 intentos fallidos de construir la pieza
de "dónde escribe el jefe" — cada uno revirtió porque se construyó
una pantalla completa antes de confirmar si era el lugar correcto.

Las reglas de arriba existen por eso:
- Gate 0 antes de escribir código — para no construir sobre un
  supuesto sin verificar.
- 100% aditivo — para no romper lo que ya funciona.
- Parar y reportar si algo no coincide — para no improvisar una
  solución que después hay que revertir.
- Victor aprueba antes de implementar — para no descubrir a mitad de
  camino que se construyó algo que no correspondía.

No es burocracia — es el resultado de haber gastado una semana
revirtiendo trabajo por no aplicar estas reglas antes.
