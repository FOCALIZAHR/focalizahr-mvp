# Plan Futuro — Rediseño del Banco de Encuesta (post-lanzamiento del plan actual)

> **Estado: PENDIENTE, deliberadamente no ahora.** El banco actual de `experiencia-full`
> se trata como banco de prueba mientras dure el plan en curso. Esto se ejecuta al
> terminar, no antes — no bloquea nada de lo que se está construyendo hoy.
>
> **Principio rector, confirmado por Victor: es UN SOLO arreglo, no dos.** Se corrige
> `experiencia-full` completo — cantidad de reactivos por dimensión, redacción de
> preguntas ambiguas/doble-barril, y mapeo a la dimensión correcta — y `pulso-express`
> hereda ese resultado como subconjunto (§6 más abajo). No se arregla cada banco por
> separado; arreglar el chico antes de que el grande esté resuelto es esfuerzo que se
> tira apenas se unifiquen.

## El hallazgo — 3 problemas distintos, no uno solo

1. **Cantidad insuficiente de reactivos por dimensión:** `Reconocimiento` y
   `Compensaciones` tienen 1 solo reactivo cada una — muy por debajo del mínimo
   confiable (ver metodología abajo).
2. **Preguntas mal redactadas** (ambiguas o doble-barril, mezclan 2 cosas en una):
   `comunicacion_interna`, `cohesion_equipo`, `carga_trabajo`, `energia`, `seguridad`
   (`AUDITORIA_BANCO_REACTIVOS_v1.md` §4-6).
3. **Preguntas mal mapeadas a su dimensión:** `autonomia` (el reactivo, no la
   dimensión) vive dentro de la dimensión Autonomía, pero su redacción y patrón
   ("Mi supervisor me da la autonomía necesaria...") coincide exacto con los otros 7
   reactivos de Liderazgo, todos con el mismo patrón "Mi supervisor/jefe hace X"
   (`AUDITORIA_BANCO_REACTIVOS_v1.md` §3). Candidato a mover de dimensión, no a
   reescribir.

   **Caso confirmado adicional — `colaboracion` bajo `autonomia` (2026-07-27):**
   `colaboracion` catalogado bajo `autonomia` en `Question.category` — confirmado durante
   Fase 3 de Clima con query real (la pregunta "Existe un buen ambiente de compañerismo en
   mi equipo" renderiza como dimensión Autonomía en la UI de Tab 2). Evidencia de que el
   problema de taxonomía es **real y más amplio que un caso aislado**. **No tocar categorías
   individuales hasta que este refactor se aborde como proyecto propio.**

## La metodología — rango 3 a 7 reactivos reales (no circulares) por dimensión

**Piso — 3, citado, no estimado:** Byrne (2009) y Hair et al. (2010) — mínimo 3 ítems
por constructo/dimensión para que un análisis de confiabilidad sea válido.

**Techo — 5 a 7, derivado de evidencia real de industria + confirmado internamente:**
el survey completo de Culture Amp (57 preguntas, ~8-10 temas reales) promedia entre 5,7
y 7,1 reactivos por tema. Confirmado con nuestro propio caso: la única dimensión del
banco actual que se pasa de ese rango (`Satisfaccion`, 9 reactivos) resultó ser
exactamente donde se encontraron 4 reactivos circulares (medían lo mismo que el
resultado general) — el rango no es arbitrario, marca dónde una dimensión deja de ser
una sola cosa coherente.

## Qué hay que hacer, cuando llegue el momento

1. Expandir o fusionar `Reconocimiento` y `Compensaciones` (1 reactivo cada una hoy).
2. Confirmar `Satisfaccion` en 5 reactivos reales una vez descontados los 4 circulares
   ya excluidos (`retencion`, `recomendacion`, `orgullo`, `experiencia_general`).
3. Resolver los doble-barril y ambiguos ya identificados (`AUDITORIA_BANCO_REACTIVOS_v1.md`):
   `comunicacion_interna`, `cohesion_equipo`, `carga_trabajo`, `energia`, `seguridad`.

   **Tratamiento interino de `energia` mientras no se reescribe (confirmado 2026-07-22,
   Tab 2 / Gate 5D):** no se sella su exclusión formal en `REACTIVE_CIRCULARITY_EXCLUDE`
   — hacerlo prejuzgaría "exclusión" cuando la resolución real más probable es
   "reescritura" (separar "energía" real de "motivación" circular, no descartar el
   reactivo completo). En su lugar, Tab 2 la trata como excluida de cualquier
   conteo/regla crítica (incluida la clasificación de bloques) mediante un filtro local,
   sin tocar la constante compartida. Regla de escalamiento acordada: con un solo
   reactivo en esta situación no se pausa nada — si en el camino aparece un SEGUNDO
   ítem que también necesite cambiar de identidad (no solo de redacción) para que algo
   de Tab 2 funcione, ahí sí se para a revisar antes de seguir. Quien retome el
   rediseño completo del banco debe saber que este tratamiento interino ya existe,
   para no decidir algo distinto sin estar al tanto.
4. Mover `autonomia` (el reactivo) de la dimensión Autonomía a Liderazgo — su patrón de
   redacción coincide con los otros 7 reactivos de Liderazgo, no con el resto de
   Autonomía (`AUDITORIA_BANCO_REACTIVOS_v1.md` §3).
5. Evaluar si agregar Propósito/Responsabilidad Social (huecos ya confirmados contra
   Gallup/Culture Amp/Glint) — cada dimensión nueva nace ya dentro del rango 3-7, no se
   agrega como 1 ítem suelto.
6. Toda dimensión resultante, nueva o existente, se valida contra el rango 3-7 antes de
   darse por cerrada.
7. **Unificar Pulso Express y Experiencia Full en un solo banco (Item Bank), no dos
   instrumentos con vocabulario distinto.** Decisión de arquitectura, con precedente
   real: el mismo patrón que usa el SF-36→SF-12 (la encuesta de salud más citada del
   mundo) y el sistema PROMIS — un "item bank" único, calibrado, del cual se arman
   formularios cortos como SUBCONJUNTOS de las mismas preguntas, nunca reescritas con
   otra redacción. Confirmado con Code (Gate 0) que hoy `pulso-express` tiene 12
   reactivos con nombres y redacción propios, sin overlap real con los 31 de
   `experiencia-full` — por eso Capa 2 (93 celdas, investigación real) no cubre a
   `pulso-express` en absoluto.
   - **Cómo se recorta el Pulso, correctamente:** menos DIMENSIONES por pulso
     (rotando cuáles se miden cada vez), nunca menos reactivos POR dimensión —
     toda dimensión que se incluya en un pulso mantiene su piso de 3 reactivos reales
     (mismo principio ya establecido para `isSystemic`, Byrne/Hair). Medir una
     dimensión con 1-2 reactivos no la hace "más corta" — la hace estadísticamente
     inválida para cualquier cálculo agregado.
   - **Beneficio directo:** con el mismo vocabulario, las 93 celdas de Capa 2 ya
     escritas cubren Pulso Express automáticamente — no hace falta escribir 30 celdas
     nuevas ni reinvestigar evidencia para un segundo banco.
   - **Confirmado en la práctica (2026-07-22):** cuando se revisó a qué tier debían
     pertenecer `condiciones`, `equilibrio`, `capacitacion` (reactivos propios de
     pulso-express, sin equivalente exacto en el banco unificado) y la circularidad de
     `satisfaccion/satisfaccion` — la decisión correcta en los 4 casos fue NO tocarlos
     ahora. Son vocabulario de pulso-express, condenado a reemplazarse por el banco
     unificado — asignarles tier o corregir su exclusión hoy es esfuerzo que se tira en
     cuanto pulso-express pase a ser un subconjunto de `experiencia-full`. Mismo
     criterio para cualquier hallazgo nuevo que aparezca sobre vocabulario exclusivo de
     pulso-express: se anota acá, no se corrige suelto.

## Actualización de prioridad

Pendiente de confirmar con Victor: si `pulso-express` tiene clientes reales activos
hoy, este rediseño sube de prioridad — un cliente real viendo contenido genérico en
la mayoría de sus tarjetas de plan de acción es un problema comercial, no solo deuda
técnica. Si es secundario/sin uso real todavía, queda en la cola normal, después del
plan en curso. Registrado también en `PENDIENTES_ACTIVOS_EX_CLIMA.md`.

## Proceso de generación de ítems nuevos — metodología, no tarea de Code

> Confirmado con Victor (2026-07-22): escribir las preguntas nuevas/reescritas es
> trabajo de metodología (esta sesión + Victor), igual que las narrativas de acción —
> Code solo carga el texto ya decidido a `seed.ts`, no participa en redactarlo.

Proceso estándar de "Scale Development" (DeVellis, 2016 — referencia central de
psicometría para exactamente esta tarea), adaptado a la realidad pre-lanzamiento de
FocalizaHR:

1. **Clarificar el constructo** — ya resuelto (diccionario de dimensiones en lenguaje
   llano, cruzado contra Gallup/Culture Amp/Glint).
2. **Generar el pool de ítems candidatos** — 2-3 candidatos de texto por hueco (no 1
   solo), inspirados en cómo Gallup/Culture Amp/Glint miden ese mismo concepto —
   parafraseado a la voz de FocalizaHR, nunca copiado textual (mismo criterio de
   derechos de autor de toda esta conversación). Insumo de investigación + redacción
   (Gemini), mismo rol que ya cumplió con las narrativas de intervención.
3. **Formato de medición** — ya fijo, Likert 1-5.
4. **Revisión de contenido (validez)** — cada candidato se filtra contra el criterio ya
   validado de "constructo doblemente concreto" (Bergkvist & Rossiter, ver
   `METODOLOGIA_METAS_REACTIVO_INDIVIDUAL_v1.md`): objeto y atributo únicos, sin
   ambigüedad, sin doble-barril. Revisor: Victor (+ Studio IA como segundo revisor si
   corresponde — la literatura pide mínimo 2-3 expertos para validez de contenido).
5. **Ítems de validación (circularidad)** — ya construido, mismo criterio de
   `REACTIVE_CIRCULARITY_EXCLUDE` se aplica a los ítems nuevos antes de darlos por
   buenos.
6-7. **Pilotaje empírico con muestra real** — diferido hasta que existan clientes
   reales. No se puede validar estadísticamente sin datos de respuesta reales — mismo
   tratamiento que el resto de los números PROVISIONAL de este proyecto.
8. **Optimizar largo final** — ya decidido, rango 3-7 por dimensión.

**Secuencia de ejecución cuando llegue el momento:** generación de candidatos →
revisión de Victor → selección final → recién ahí Code carga a `seed.ts`. Ningún paso
se salta ni se invierte.

## Referencia cruzada, no bloqueante hoy

Mientras este rediseño no ocurra, cualquier cálculo agregado por dimensión (`isSystemic`
y futuros similares) necesita su propio piso de reactivos medidos como guarda de código
— eso sí se resuelve ahora, por separado, y no depende de este documento.
