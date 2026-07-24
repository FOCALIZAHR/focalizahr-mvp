# Cascada Ejecutiva de Clima — Contenido
## Documento vivo · Gate 4.5 · Chat dedicado de contenido

> Producto: **Experiencia Colaborador** (EX Clima). El clima es un indicador
> dentro de la experiencia del colaborador, no una encuesta aislada — el tono
> y el framing de todo este documento parte de esa base: hablamos de cómo
> vive la gente su experiencia en la organización, el número es evidencia de
> eso, no el producto en sí mismo.
>
> Estado: **COMPLETO + ENRIQUECIDO**. Portada + Acto Ancla (sección 0) +
> 7 Actos + Síntesis, con nombre+número+comparación en el momento de
> revelar. Sección 7 (Diccionario del "O") completa. Sección 8
> (decisiones de UX) resuelta. 2 puntos técnicos a confirmar por Code
> antes de implementar el enriquecimiento — ver Nota G.

---

## Índice

0. [Portada + Acto Ancla](#0-portada--acto-ancla)
1. [TEATRO_GENERALIZADO](#1-teatro_generalizado)
2. [HOTSPOT_CONCENTRADO](#2-hotspot_concentrado)
3. [DRIVER_SISTEMICO](#3-driver_sistemico)
4. [MOMENTUM_NEGATIVO](#4-momentum_negativo)
5. [BIEN_CON_FOCOS](#5-bien_con_focos)
5.5. [OBSERVACION_SIN_FOCO](#55-observacion_sin_foco)
6. [SALUDABLE](#6-saludable)
7. [Diccionario del "O" — Motor de Asociación](#7-diccionario-del-o)
8. [Decisiones de UX](#8-decisiones-de-ux---resueltas)
9. [Notas abiertas / decisiones de alcance](#9-notas-abiertas)

---

## 0. Portada + Acto Ancla

> Estos dos textos son la cima de la pirámide — el número general, antes de
> que la Cascada empiece a contar por qué. Tipo 2 (Masa y Gravedad, igual
> que P&L del Talento): `orgFavorability` es un promedio ponderado, no una
> composición — los 4 nodos no descomponen el número en partes que suman
> 100%, muestran **dónde vive el peso** detrás del promedio.
>
> **Regla anti-robo-de-trueno (§3 del semilla):** ningún nodo nombra
> todavía lo que la Cascada va a revelar. Magnitud sí, detalle no. Si acá
> ya dijéramos "Desarrollo Software está en crisis", el Acto
> HOTSPOT_CONCENTRADO que viene después pierde su momento de revelación.

### 0.1 · Portada — el gancho

Regla de la portada: cero costo, cero amplificador. Solo el número y la
pregunta que abre — nada más. `{n}` = orgFavorability.

```
Gancho por zona:

roja (<60):
  "Tu organización opera al {n}%. No es solo un número, es lo que tu
  gente está viviendo hoy."

naranja (60-64):
  "Tu organización opera al {n}%, bajo el estándar. No es solo un
  número, es lo que tu gente está viviendo hoy."

amarilla (65-74):
  "Tu organización opera al {n}%, a {gap} puntos de tu objetivo. No es
  solo un número, es lo que tu gente está viviendo hoy."

verde (≥75):
  "Tu organización opera al {n}%. No es solo un número, es lo que tu
  gente está viviendo hoy."
```

*(La frase de cierre — "No es solo un número, es lo que tu gente está
viviendo hoy" — se mantiene igual en las 4 zonas a propósito: es el
recordatorio de que esto es experiencia real, no una encuesta de
satisfacción, y funciona igual de bien como gancho de alarma que como
gancho de atención plena.)*

**CTA:** Ver evidencia →

---

### 0.2 · Acto Ancla — los 4 nodos

**Gauge central:** `{orgFavorability}` vs `CLIMA_TARGET_FAVORABILITY=75`.
Número en blanco, arco en color de gravedad (cyan ≥75 / amber 60-74 /
purple <60).

#### Nodo 1 — Distribución de zonas

```
label:  "Distribución de zonas"
value:  {n} de {total}   (gerencias bajo el umbral de 75)

narrativa por rango:
  0:          "Ninguna gerencia está bajo el estándar."
  1-20%:      "Una parte pequeña de tus gerencias está bajo el estándar."
  21-50%:     "Una de cada {ratio} gerencias está bajo el estándar."
  >50%:       "Más de la mitad de tus gerencias está bajo el estándar."
```

#### Nodo 2 — Concentración

```
label:  "Concentración"
value:  {n}%   (del riesgo total que vive en el punto más afectado —
        sin nombrarlo)

narrativa por rango:
  <20%:       "El riesgo está repartido, sin un punto que concentre
              más que el resto."
  20-49%:     "Una parte relevante del riesgo vive en un solo lugar."
  ≥50%:       "La mayoría del riesgo vive en un solo lugar."
```

#### Nodo 3 — Volatilidad

```
label:  "Volatilidad"
value:  {n} de {total}   (gerencias cayendo vs. el ciclo anterior)

narrativa por rango:
  0:          "Ninguna gerencia viene cayendo respecto al ciclo anterior."
  1-20%:      "Un grupo pequeño viene cayendo respecto al ciclo anterior."
  21-50%:     "Una parte relevante viene cayendo respecto al ciclo anterior."
  >50%:       "Más de la mitad viene cayendo respecto al ciclo anterior."
```

#### Nodo 4 — Confiabilidad *(Ancla Científica — requiere tooltip)*

```
label:  "Confiabilidad"
value:  {n}   (gerencias con contradicción detectada entre cumplimiento
        y clima real — sin nombrar cuáles)

narrativa por rango:
  0:          "No hay contradicción entre lo que el cumplimiento
              declara y lo que el clima real muestra."
  >0:         "En algún punto de la organización, lo que el
              cumplimiento declara y lo que el clima real muestra no
              coinciden."

tooltip (Ancla Científica):
  "Se detecta cuando el cumplimiento formal de una gerencia se marca
   como en regla, mientras su clima real cae por debajo del estándar
   esperado en el mismo período. No mide mala fe — mide que dos fuentes
   que, en condiciones normales, deberían contar la misma historia,
   dejaron de hacerlo. Cuando aparece en 2 o más gerencias a la vez, la
   discrepancia deja de ser un caso aislado y se vuelve un patrón que
   hay que resolver antes de confiar en cualquier otro número."
```

*(Nodo 4 es el candidato natural a Ancla Científica porque es el único de
los 4 que resulta de cruzar dos fuentes en vez de contar directamente —
igual que el nodo "Poder predictivo" en Metas × Performance. Los otros 3
son descriptivos/agregación puros y no requieren tooltip.)*

**CTA:** Ver diagnóstico completo →

---

**ActSeparator:** "Confiabilidad" · purple

**Ancla:** `{n} gerencias` — *con el papel y la gente diciendo cosas distintas*

**Narrativa:**

En {n} gerencias, el sistema de cumplimiento dice que todo está en orden. Las personas que trabajan ahí dicen otra cosa.

No es que una fuente esté equivocada y la otra en lo correcto. Es que dos fuentes independientes — el proceso formal y la voz real de la gente — dejaron de contar la misma historia. Y cuando eso pasa, ningún número de esas gerencias es confiable hasta que se resuelva por qué.

O el proceso de cumplimiento está midiendo que se siguieron los pasos, no que la gente está bien. O la gente no se siente segura respondiendo con honestidad cuando sabe que la respuesta pasa por el mismo canal formal.

**Coaching tip:**
*Antes de intervenir el clima de esas gerencias, hay que entender por qué la gente no está hablando con libertad ahí. Esa pregunta, sola, ya es más importante que el número.*

**CTA:** Ver las {n} gerencias →

**Síntesis**
```
classification:  Este no es un problema de clima. Es un problema de qué
                  tan seguro se puede confiar en lo que el sistema dice
                  que está bien.

implication:      Mientras el cumplimiento declare tranquilidad y la
                  gente diga lo contrario, cada decisión que se tome
                  sobre esos datos parte de una base que no se sostiene.
                  Actuar sobre un número que no es confiable puede ser
                  peor que no actuar todavía.

path:             Resolver la contradicción antes de resolver el clima.
                  Empezar por entender por qué esas gerencias no están
                  hablando con la misma voz en los dos canales.

accountability:   El próximo ciclo confirmará si la contradicción se
                  cerró o si se repite.
```

---

## 2. HOTSPOT_CONCENTRADO

**ActSeparator:** "Concentración" · amber

**Ancla:** `{favorability}` — *{Gerencia}, muy por debajo del resto*

**Narrativa:**

{Gerencia} está sola, y está lejos. Mientras el resto de la organización se mueve dentro de un rango razonable, esta gerencia quedó muy por debajo — no es la cola de una tendencia general, es un caso aislado.

`[SI n≥5 en {Gerencia} — usar cifra y nombre exactos:]`
{Gerencia} está en {favorabilidadGerencia}%, {gapVsPromedio} puntos bajo el promedio de la organización. La brecha entre esta gerencia y la mejor de la empresa es de {spreadVsMejor} puntos — no es una diferencia menor, es buena parte del ancho completo de la escala de riesgo.

`[SI n<5 en la gerencia detectada — no nombrar, usar solo magnitud:]`
Una gerencia está {gapVsPromedio} puntos bajo el promedio de la organización — con un volumen de personas insuficiente para nombrarla con precisión, pero la brecha es real.

Y no es un hallazgo que viva solo en la encuesta de clima: quienes se fueron de {Gerencia} en el último tiempo señalaron lo mismo al salir. `[si DepartmentExitInsight.topExitFactors de {Gerencia} nombra jefe/manager — omitir la frase si no hay dato]`

O el liderazgo actual de {Gerencia} está generando algo que el resto de la empresa no tiene. O {Gerencia} heredó una condición — de carga, de reestructuración, de rotación reciente — que todavía no se resolvió.

**Coaching tip:**
*Un incendio localizado no se combate con una política transversal. Una conversación directa con quien lidera {Gerencia} vale más que un programa para toda la empresa — acá el problema tiene nombre y dirección.*

**CTA:** Ver evidencia de {Gerencia} →

**Síntesis**
```
classification:  Este no es un problema cultural de la empresa. Es un
                  problema con responsable identificado.

implication:      {Gerencia} concentra un déficit que el resto de la
                  organización no tiene. Cuando el clima de una sola
                  gerencia colapsa así, arrastra a quienes dependen de
                  ese liderazgo y a quienes trabajan codo a codo con
                  ese equipo.

path:             Una conversación directa con el liderazgo de
                  {Gerencia}. No un programa transversal — el problema
                  tiene origen identificado.

accountability:   El próximo ciclo confirmará si esa gerencia se
                  acercó al resto o si el patrón se repite.
```

---

## 3. DRIVER_SISTEMICO

**ActSeparator:** "Patrón organizacional" · purple

**Ancla:** `{n} gerencias` — *comparten el mismo problema de {dimensión}*

**Narrativa:**

{Dimensión} no falla en una gerencia. Falla en {n}, sin relación jerárquica entre ellas — no reportan al mismo líder, no comparten equipo, no tienen nada en común más que el mismo síntoma.

Cuando el mismo problema aparece en lugares que no se tocan entre sí, no es casualidad. Es sistema.

Y no es cualquier problema: {dimensión} es, hoy, el driver que más pesa en tu resultado general — y también el que más cayó respecto al ciclo anterior, con una variación de {deltaDimension} puntos. Cuando el factor más influyente es también el que más se está moviendo, la urgencia no es solo de patrón, es de magnitud.

`[SI dimensión = liderazgo Y hay señal de sesgo del evaluador o "evaluador protege" en ≥2 de las {n} gerencias — insertar:]`
Y no es solo lo que la gente marcó en la encuesta: en más de una de esas gerencias, la forma en que se evalúa el desempeño de los equipos muestra el mismo patrón — quienes lideran tienden a calificar parejo, sin diferenciar a quien rinde de quien no. Dos fuentes distintas, mismo síntoma.

`[SI dimensión ≠ liderazgo Y hay abandono temprano de onboarding elevado en ≥2 de esas gerencias — insertar:]`
Y hay una segunda señal que lo confirma: en más de una de esas gerencias, la gente que recién llega se está yendo antes de asentarse — la misma condición que golpea a quien ya está, golpea primero a quien acaba de entrar.

O la forma en que se selecciona y forma a quienes lideran no está preparando a nadie para sostener {dimensión}. O hay una política o un proceso que toca a toda la organización por igual, y el efecto se nota en {dimensión} antes que en cualquier otro lado.

**Coaching tip:**
*Reemplazar a los {n} líderes no resuelve un patrón que el sistema sigue produciendo. La pregunta no es quién falla — es qué está formando a quienes fallan de la misma manera.*

**CTA:** Ver las {n} gerencias →

**Síntesis**
```
classification:  Este no es un problema de {n} líderes distintos. Es
                  un problema de cómo el sistema los está formando.

implication:      {Dimensión} se repite igual en gerencias que no
                  tienen relación entre sí. Intervenir persona por
                  persona corrige el síntoma, no la causa.

path:             Revisar cómo se selecciona, forma y acompaña a
                  quienes lideran, antes de intervenir gerencia por
                  gerencia.

accountability:   El próximo ciclo confirmará si el patrón se rompió
                  o si aparece en una gerencia más.
```

---

## 4. MOMENTUM_NEGATIVO

**ActSeparator:** "Tendencia" · amber

**Ancla:** `{n} gerencias` — *cayendo respecto a la medición anterior*

**Narrativa:**

El nivel de hoy todavía no es crítico. La dirección, sí. {n} de tus gerencias no están en la misma posición que en la medición anterior — están más abajo.

Un número que cae y todavía se ve bien es la señal más barata de leer y la más fácil de ignorar. Nadie declara una crisis por una caída que parte de un buen lugar.

`[SI n≥5 en la gerencia con mayor caída — usar nombre y cifra exactos:]`
{GerenciaBaja} cayó {deltaBaja} puntos respecto al ciclo anterior — la caída más pronunciada de toda la organización.

`[SI existe una gerencia con mejora relevante en el mismo período Y n≥5 — insertar contraste:]`
Y en el mismo período, {GerenciaSube} subió {deltaSube} puntos. La dirección no es uniforme: hay lugares moviéndose en sentidos opuestos al mismo tiempo, dentro de la misma organización.

`[SI n<5 en la gerencia de mayor caída — no nombrar, usar solo magnitud:]`
La caída más pronunciada de la organización fue de {deltaBaja} puntos, en una gerencia con volumen insuficiente para nombrarla con precisión.

`[SI abandono temprano de onboarding también viene en alza en esas gerencias — insertar:]`
Y no es la única señal cayendo: en las mismas gerencias, la gente que recién entra se está yendo antes de lo esperado. Cuando dos indicadores caen juntos, la tendencia deja de ser ruido.

O algo cambió en la organización que todavía no se ha nombrado en voz alta. O una señal temprana ya se había visto antes y no se actuó sobre ella — y esta caída es la continuación de esa misma historia.

**Coaching tip:**
*La ventana más barata para intervenir es antes de que el nivel absoluto obligue a hacerlo. Después de zona crítica, la misma conversación cuesta más — en tiempo, en confianza, en gente.*

**CTA:** Ver la tendencia completa →

**Síntesis**
```
classification:  Este no es un problema de nivel. Es un problema de
                  dirección.

implication:      El número de hoy todavía se sostiene. La tendencia
                  de los últimos ciclos dice otra cosa. Actuar antes
                  de la zona crítica siempre cuesta menos que actuar
                  después.

path:             Identificar qué cambió antes de que el nivel
                  absoluto obligue a actuar de todas formas.

accountability:   El próximo ciclo confirmará si la tendencia se
                  revirtió.
```

---

## 5. BIEN_CON_FOCOS

**ActSeparator:** "Focos de atención" · cyan

**Ancla:** `{n} de {total}` — *gerencias fuera del buen resultado general*

**Narrativa:**

La organización está sobre el estándar. Eso es real, y vale la pena decirlo primero: el resultado general es bueno.

Pero un promedio sano puede esconder a quien no lo vive así. {n} gerencias no acompañan ese resultado — y para las personas que trabajan ahí, el promedio de la empresa no cambia nada de lo que sienten todos los días.

`[SI n≥5 en la gerencia fuera del estándar — usar nombre y cifra exactos:]`
{Gerencia}, en {favorabilidadGerencia}%, es la excepción — {gapVsPromedioOrg} puntos bajo el resto de la organización.

`[SI n<5 — no nombrar, usar solo magnitud:]`
Una gerencia queda fuera del estándar, con un volumen insuficiente para nombrarla con precisión, pero con una brecha de {gapVsPromedioOrg} puntos respecto al resto.

Un buen número general no es evidencia de que no haya nadie sufriendo un mal clima. Es evidencia de que la mayoría está bien — que no es lo mismo.

`[SI abandono temprano de onboarding también está elevado en alguna de las {n} gerencias fuera del estándar — insertar:]`
Y no es solo el clima el que lo marca: en esa misma gerencia, la gente que recién entra se está yendo antes de asentarse, en una proporción que no se repite en el resto de la organización. La excepción no vive solo en la encuesta.

O son casos puntuales — un cambio de liderazgo reciente, una reestructuración, algo con fecha de inicio identificable. O son la primera señal de algo que el promedio todavía no alcanza a mostrar, porque el resto de la organización es lo suficientemente grande para diluirlo.

**Coaching tip:**
*No hace falta una alarma para mirar de cerca lo que un buen promedio esconde. El cuidado más barato es el que se da antes de que el número obligue a prestar atención.*

**CTA:** Ver gerencias fuera del estándar →

**Síntesis**
```
classification:  El promedio de tu organización está sano. No toda
                  tu organización lo está viviendo así.

implication:      {n} gerencias no acompañan el resultado general.
                  Un promedio bueno no es garantía para quienes
                  trabajan en las que quedan fuera de él.

path:             Sostener lo que funciona en el resto de la
                  organización, y mirar de cerca a las gerencias que
                  no acompañan el promedio — antes de que dejen de
                  ser la excepción.

accountability:   El próximo ciclo confirmará si esas gerencias se
                  acercaron al resto o si el foco se amplió.
```

---

## 5.5. OBSERVACION_SIN_FOCO

> Este es el 7º tipo — resuelve la contradicción que costó 3 rondas de
> corrección: **todos bajo el objetivo, mostrado como saludable.** Antes
> de este Acto, si ninguno de los 5 diagnósticos "con foco" disparaba
> (TEATRO, HOTSPOT, DRIVER_SISTEMICO, MOMENTUM_NEGATIVO, BIEN_CON_FOCOS),
> el motor caía por default a SALUDABLE — aunque `orgFavorability`
> estuviera bajo el objetivo. SALUDABLE exige explícitamente
> `orgFavorability ≥ CLIMA_TARGET_FAVORABILITY`; este Acto es lo que pasa
> cuando **no** se cumple esa condición y tampoco hay un patrón
> concentrado, sistémico, de tendencia o de teatro que lo explique.
> Precedencia: se evalúa **después** de BIEN_CON_FOCOS y **antes** que
> SALUDABLE.

**ActSeparator:** "Panorama general" · amber

**Ancla:** `{orgFavorability}` — *bajo el objetivo, sin un punto que concentre el problema*

**Narrativa:**

El resultado general está bajo el objetivo — no en una gerencia, no en un driver puntual, no en una tendencia que caiga. Está bajo en todos lados, de manera pareja.

Esto no es un caso aislado que se pueda señalar y resolver con una conversación. Es un nivel general que todavía no alcanza el estándar, sin que ningún lugar concentre la explicación más que el resto.

`[SI n≥5 en la gerencia con el resultado más bajo — usar nombre y cifra exactos:]`
{GerenciaMasBaja}, en {favorabilidadMasBaja}%, es la que está más lejos del objetivo — pero incluso ella no está sola: el resto de la organización tampoco llega, solo que un poco menos lejos.

`[SI n<5 en la gerencia más baja — no nombrar, usar solo magnitud:]`
Incluso la gerencia más lejos del objetivo tiene un volumen insuficiente para nombrarla con precisión — y de todas formas no está sola: el resto de la organización tampoco llega.

`[SI abandono temprano de onboarding también está elevado de forma pareja, sin concentrarse en una gerencia — insertar:]`
Y hay una segunda señal pareja: la gente que recién entra tampoco se está asentando mejor en un lugar que en otro. La condición no distingue entre quien lleva años y quien acaba de llegar.

O el estándar de {CLIMA_TARGET_FAVORABILITY} está fuera de alcance con las condiciones actuales de la organización. O hay una condición transversal — de carga, de momento de la empresa, de expectativas que cambiaron — que afecta a todos por igual y todavía no tiene nombre.

**Coaching tip:**
*Cuando nadie destaca por estar peor, la tentación es no actuar sobre nadie en particular. Pero un nivel general bajo el estándar, sin foco, sigue siendo un nivel general bajo el estándar — merece la misma atención que si tuviera un responsable identificado. Solo que la intervención no es local, es de conjunto.*

**CTA:** Ver el panorama completo →

**Síntesis**
```
classification:  Este no es un problema con responsable identificado.
                  Es un piso general que todavía no alcanza el
                  estándar.

implication:      Ninguna gerencia concentra el problema más que las
                  demás — lo que significa que corregir una sola no
                  va a mover el resultado general. El desafío no es
                  de foco, es de conjunto.

path:             Revisar qué condición transversal explica un nivel
                  parejo bajo el estándar, en vez de buscar un
                  responsable puntual que no existe.

accountability:   El próximo ciclo confirmará si el nivel general se
                  acercó al estándar o si la brecha se mantiene
                  pareja.
```

---

**ActSeparator:** "Lo que sostiene el resultado" · cyan

**Ancla:** `{orgFavorability}` — *sin gerencias en riesgo, sin señales de caída*

**Narrativa:**

Ninguna gerencia está en zona de riesgo. No hay señales de que el buen resultado sea reciente ni frágil. Eso no es casualidad — algo se está haciendo bien, y se sostiene en el tiempo.

La brecha entre tu mejor y tu peor gerencia es de solo {spreadTotal} puntos. No es solo el promedio lo que sostiene este resultado — es que casi nadie se queda atrás.

Un buen resultado sin explicación es más frágil que uno que se entiende. Cuando el clima está sano y nadie sabe bien por qué, alcanza con que una condición cambie para que el resultado se vaya con ella.

{Dimensión más fuerte} es, hoy, lo que más sostiene este resultado — y es también lo primero que hay que proteger cuando algo en la organización cambie.

La señal más temprana de que esto empieza a moverse no va a aparecer primero en el promedio general — el promedio es lento para mostrar grietas. Va a aparecer primero en cómo se siente quien recién llega. El abandono temprano de la gente nueva es, hoy, el número más barato de vigilar antes que cualquier otro.

**Coaching tip:**
*El desafío de un buen resultado no es mejorarlo — es no asumir que se mantiene solo. Lo que hoy sostiene el clima merece la misma atención que un problema, solo que en sentido contrario: protegerlo, no repararlo.*

**CTA:** Ver qué sostiene el resultado →

**Síntesis**
```
classification:  El clima de tu organización sostiene el resultado,
                  no solo lo declara.

implication:      Ninguna gerencia en riesgo, sin señales de
                  deterioro. Eso no es casualidad — refleja
                  condiciones que se sostienen en el tiempo, no un
                  buen momento aislado.

path:             El desafío ahora no es corregir. Es sostener las
                  condiciones que produjeron este resultado, y no
                  asumir que se mantienen solas.

accountability:   El próximo ciclo confirmará si esta condición se
                  sostiene o se erosiona.
```

---

## 7. Diccionario del "O"

Cada entrada sigue el mismo patrón de los Actos: **el hecho de convergencia
primero**, afirmado con seguridad porque es verificable (dos fuentes
independientes dijeron lo mismo) — **nunca con conector causal**, solo de
coincidencia. Cierra con el **"O"**: 2-3 hipótesis abiertas, nunca una sola,
nunca una instrucción. Formato `[SI...]` idéntico a los Actos — Code lo
inserta solo si el dato existe para esa gerencia/dimensión en ese ciclo; si
no existe, el texto base del Acto se sostiene igual, sin el cruce.

### 7.1 · Liderazgo × sesgo del evaluador (SEVERITY / LENIENCY)

```
[SI liderazgo bajo estándar en {Gerencia} Y PerformanceRatingService
 detecta sesgo del evaluador en esa misma gerencia — insertar, variante
 según tipo de sesgo:]

  [SI sesgo = LENIENCY — calificaciones sistemáticamente altas, sin
   diferenciar a quien rinde de quien no:]

  Y no es solo lo que la gente marcó en la encuesta: la forma en que ese
  liderazgo evalúa a su equipo muestra el mismo patrón — calificaciones
  parejas, sin diferenciar a quien rinde de quien no. Dos fuentes
  distintas, la misma gerencia, al mismo tiempo.

  [SI sesgo = SEVERITY — calificaciones sistemáticamente más duras que
   gerencias comparables:]

  Y no es solo lo que la gente marcó en la encuesta: la forma en que ese
  liderazgo evalúa a su equipo también se aparta del resto de la
  organización — calificaciones sistemáticamente más duras que en
  gerencias comparables. Dos fuentes distintas, la misma gerencia, al
  mismo tiempo.

O el líder no está viendo a su equipo con la misma vara que el resto de
la organización. O la forma de evaluar y el clima del equipo son dos
caras del mismo problema, no una la causa de la otra. O ambas señales
responden a una condición del cargo — o una carga reciente — que
todavía no se ha nombrado.
```

### 7.2 · Liderazgo × "¿el evaluador los protege?"

```
[SI liderazgo bajo estándar en {Gerencia} Y GoalsDiagnosticService marca
 "evaluadorProtege" en esa misma gerencia — insertar:]

Y hay una segunda coincidencia: en esa misma gerencia, las metas del
equipo se aprueban con una holgura que no se repite en el resto de la
organización — el sistema la marca como un patrón de protección del
evaluador hacia su gente. El clima bajo y esa holgura aparecen en el
mismo lugar, al mismo tiempo.

O el líder está protegiendo a su equipo de una presión que siente que ya
es suficiente. O esa protección es, en sí misma, parte del problema — sin
exigencia real tampoco hay desarrollo real. O ninguna de las dos explica
todo por sí sola, y conviene mirar ambas señales juntas antes de sacar
una conclusión.
```

### 7.3 · Liderazgo × motivos de salida (Exit)

```
[SI liderazgo bajo estándar en {Gerencia} Y DepartmentExitInsight
 .topExitFactors de esa gerencia nombra jefe/manager — insertar:]

Y esta no es la primera vez que aparece esta señal: entre quienes dejaron
{Gerencia} en los últimos meses, el motivo más mencionado al salir fue su
jefe directo. El clima de hoy y las salidas de ayer están señalando lo
mismo.

O el liderazgo actual heredó un problema que ya venía de antes y todavía
no logra revertir. O es un patrón que se repite con cada persona nueva
que pasa por ese equipo, más allá de quién ocupe el cargo hoy. O el
clima bajo de hoy es la continuación exacta de la razón por la que la
gente ya se estaba yendo.
```

### 7.4 · Cualquier dimensión × abandono temprano en onboarding

```
[SI {dimensión} bajo estándar en {Gerencia} Y DepartmentOnboardingInsight
 muestra abandono temprano elevado en esa misma gerencia — insertar:]

Y hay una tercera fuente que coincide: quienes recién entran a
{Gerencia} se están yendo antes de asentarse, en una proporción mayor
que el resto de la organización. Lo que describe el clima de quienes ya
están, lo confirma también quien recién llegó y no se quedó.

O lo que golpea a los nuevos es la misma condición que golpea a quienes
ya están — solo que a los nuevos los golpea más rápido, porque todavía
no tienen nada que los sostenga. O el proceso de bienvenida no está
preparando a nadie para lo que realmente se va a encontrar en ese
equipo. O ambas señales, clima y abandono temprano, están describiendo
la misma condición desde ángulos distintos.
```

**Dónde aplica cada entrada — mapa rápido:**

| Entrada | Aplica en |
|---|---|
| 7.1 (sesgo evaluador) | DRIVER_SISTEMICO (si dimensión=liderazgo), HOTSPOT_CONCENTRADO (si la gerencia hotspot es de liderazgo) |
| 7.2 (evaluador protege) | Mismo alcance que 7.1 — variante alternativa, no se usan ambas a la vez sobre la misma gerencia (elegir la que tenga dato, o la más fuerte si ambas existen) |
| 7.3 (exit) | HOTSPOT_CONCENTRADO, DRIVER_SISTEMICO (si dimensión=liderazgo) |
| 7.4 (onboarding) | DRIVER_SISTEMICO (si dimensión≠liderazgo), MOMENTUM_NEGATIVO, BIEN_CON_FOCOS, SALUDABLE (como indicador líder, no como hallazgo negativo) |

---

## 8. Decisiones de UX — RESUELTAS

### 8.1 · Card "sana"

Clon directo del patrón `ALINEADO` de P&L del Talento
(`cascada-ejecutiva.md`) — mismo componente completo, no una variante
reducida. Regla explícita: **nunca semáforo**, ni siquiera de forma
sutil.

```
Estructura:      idéntica a una Card de hallazgo (Capa 1 + Capa 2 +
                  Capa 3) — no se le quita ninguna capa por estar sana.
Tono del arco:    cyan con glow. Nunca amber, nunca purple — esos
                  colores quedan reservados a atención/crisis.
Narrativa:        anclada, sin felicitación ingenua (mismo principio
                  que la Síntesis SALUDABLE de la sección 6 — no dice
                  "todo bien", dice qué lo sostiene).
CTA:              "Explorar →" — tono neutro, nunca urgente, nunca
                  "Ver evidencia" (ese CTA queda reservado para
                  hallazgos que requieren acción).
```

**Regla de consistencia:** si la Síntesis SALUDABLE (sección 6) cambia de
copy en una futura iteración, la Card sana del Lobby debe moverse con
ella — son el mismo tono en dos escalas, igual que exige el patrón de
las 3 capas del semilla (sección 2).

### 8.2 · Distinción Card ↔ Toolbar

Sin badges inventados, sin estado "ya destacado" artificial. Resuelto de
forma estructural, no visual:

```
Clic en cualquier ícono del ClimaToolbar → abre Modal
  (clon de AvatarInfoModal, Cinema Mode canónico)
  → mismo componente rico de 3 capas, exista o no una Card grande
    de esa dimensión en el Lobby.
  → "Ver más ▼" si el contenido es extenso (evita el modal gigante).
```

**Por qué esto resuelve el problema sin badges:** la pregunta original
era cómo distinguir visualmente el ícono de una dimensión que ya tiene
Card grande, de los otros 7 que no la tienen. La respuesta es que no hace
falta distinguirlos — el Toolbar siempre abre el mismo tipo de
componente (Modal rico), tenga o no Card en el Lobby. La Card grande y el
Modal del Toolbar no compiten por atención porque no son la misma
superficie: la Card es lo que el sistema decidió mostrar sin que nadie
pida nada (auto-selección); el Toolbar es lo que el CEO pide ver
explícitamente. No necesitan verse distintos entre sí — necesitan
comportarse distinto, y ya lo hacen.

---

## 9. Notas abiertas

**Nota A — RESUELTA. Cruzamos fuentes confirmadas en Gate 4.5.**
Confirmado por Victor: cruzar fuentes es exactamente lo que nos distingue
del mercado — "todo el mundo describe el dato aislado, nosotros cruzamos
datos, eso está bien". Aplicado en esta pasada a HOTSPOT_CONCENTRADO
(exit), DRIVER_SISTEMICO (sesgo evaluador / evaluador protege si
liderazgo, onboarding si otra dimensión), MOMENTUM_NEGATIVO (onboarding
como segunda señal cayendo). Cada cruce está escrito como bloque
condicional `[SI...]` — Code lo inserta solo si el dato confirmado existe
para esa gerencia/dimensión en ese ciclo; si no existe, el Acto se
sostiene igual sin esa línea, nunca se inventa el cruce.

**Nota C — tamaño de muestra, sigue abierta.**
Propuse agregar una nota de confiabilidad cuando N de personas en una
gerencia es chico (ej. concentración del 58% con solo 4 personas pesa
distinto que con 60). Victor no tiene certeza de si existe ese umbral
para Clima específicamente — el resto del sistema usa n≥5 como threshold
de privacidad en otros módulos, pero no está confirmado que aplique igual
acá. **A confirmar por Code**: si Clima ya trae un umbral mínimo de N
antes de activar un diagnóstico por gerencia, o si hay que definirlo. No
se agregó texto sobre esto a ningún Acto todavía — que quede como
decisión de activación del motor, no como matiz en la narrativa.

**Nota B — framing "Experiencia Colaborador".**
Todo este documento asume que Clima es una lectura dentro de la experiencia
del colaborador, no un producto de encuesta aislado. Si en una relectura
aparece algún texto que suene a "encuesta de clima" en vez de "cómo vive
la gente su experiencia acá", corregir ahí.

**Nota H — 7º Acto agregado: OBSERVACION_SIN_FOCO.**
Cerraba un vacío real de precedencia, no solo de copy: si ninguno de los
5 diagnósticos "con foco" disparaba, el motor caía a SALUDABLE por
default sin verificar que `orgFavorability` realmente cumpliera
`≥ CLIMA_TARGET_FAVORABILITY` — de ahí la contradicción "todos bajo el
objetivo mostrado como saludable" que costó 3 rondas de corrección.
Precedencia correcta: evaluar después de BIEN_CON_FOCOS, antes que
SALUDABLE. El texto evita explícitamente sonar a "caso aislado" (la
narrativa lo dice dos veces: "no es un caso aislado", "incluso ella no
está sola") porque justo esa es la lectura errónea que este Acto existe
para prevenir. Lleva el mismo enriquecimiento de nombre+cifra (con guard
n<5) que los demás 5 Actos "con foco".

**Nota G — enriquecimiento "momento de revelación" (McKinsey), con 2 puntos a confirmar por Code.**
Tras la primera revisión visual de 4.5a, se detectó que la Cascada usaba
`{n}` (cantidad) pero casi nunca `{quién}` ni `{cuánto}` al momento de
revelar. Se agregó nombre + cifra exacta + comparación (spread, movers,
driver que más pesa y más se movió) en HOTSPOT_CONCENTRADO,
DRIVER_SISTEMICO, MOMENTUM_NEGATIVO, BIEN_CON_FOCOS y SALUDABLE — **la
magnitud arriba (Portada + Ancla, sección 0) no se tocó**, sigue sin
nombrar nada, anti-robo-de-trueno intacto. TEATRO_GENERALIZADO tampoco se
tocó a propósito: nombrar gerencias específicas en un diagnóstico que
implica simulación de cumplimiento es más sensible que nombrar una
gerencia con clima bajo, y el semilla no lo pidió.

No bloquea el sello de 4.5a — es enriquecimiento de copy sobre una
estructura ya construida. Dos puntos técnicos quedan a confirmar por
Code antes de que Code lo implemente:

1. **Guard n≥5 en movers.** `rankMomentumMovers` puede señalar gerencias
   que no dispararon ningún diagnóstico propio — antes de nombrarlas con
   cifra exacta en la revelación, confirmar que respetan el mismo umbral
   de privacidad n≥5 que ya aplica a HOTSPOT/TEATRO/DRIVER_SISTEMICO. Si
   un mover no cumple n≥5, el copy ya contempla el fallback: se describe
   como magnitud ("una gerencia cayó X puntos") sin nombre — ver los
   bloques `[SI n<5...]` agregados en cada Acto.
2. **Variables nuevas en `interpolate()`.** Este copy necesita
   `spreadVsMejor`, `spreadTotal`, `deltaBaja`/`deltaSube` (y sus
   gerencias), `deltaDimension` — confirmar que el contrato de
   interpolación ya las soporta o si es un ajuste chico al contrato
   (no arquitectura nueva).

**Nota F — tooltip del Nodo 4, faltaba el umbral de interpretación.**
Revisión contra la skill (`cascada-ejecutiva.md`, Regla del Ancla
Científica): el tooltip requiere 3 elementos — cómo se calcula, qué mide,
umbral de interpretación. Tenía los dos primeros, faltaba el tercero.
Agregado usando el mismo umbral (≥2 gerencias) que ya define el disparador
de `TEATRO_GENERALIZADO` en la sección 1.3 del documento anterior — así
el Ancla y el motor quedan consistentes entre sí, sin inventar un número
nuevo solo para el tooltip.

**Nota E — Portada + Acto Ancla, vacío cerrado.**
Code lo marcó correctamente como PROVISIONAL al implementar 4.5a — nunca
habíamos escrito ni el gancho de Portada ni las narrativas de los 4
nodos del Ancla, solo los 6 Actos y la Síntesis. Agregado en sección 0.
Los 4 nodos son magnitud pura (cuántas gerencias, qué %), nunca nombran
gerencia ni dimensión específica — eso se lo reserva la Cascada, que
recién ahí revela el detalle. Nodo 4 (Confiabilidad) es el único con
tooltip de Ancla Científica, porque es el único que cruza dos fuentes en
vez de contar directo — mismo criterio que el nodo "Poder predictivo" en
Metas × Performance.

**Nota D — BIEN_CON_FOCOS sí tenía un cruce aplicable, era un vacío real.**
La auditoría anterior detectó que era el único Acto sin cruce de fuente y
preguntó si era intencional. No lo era: `DepartmentOnboardingInsight`
(abandono temprano, universal a cualquier dimensión) aplica exactamente
igual que en MOMENTUM_NEGATIVO — si la gerencia fuera del estándar tiene
abandono de onboarding elevado, es la misma lógica de "la excepción no
vive solo en la encuesta". Agregado como bloque `[SI...]` en la sección 5.
Con esto, los 6 Actos quedan con cruce de fuente disponible donde
corresponde (SALUDABLE lo usa como indicador líder positivo, no como
hallazgo negativo — ver sección 6).

**Auditoría de disciplina de evidencia — MOMENTUM_NEGATIVO y BIEN_CON_FOCOS.**
Verificación línea por línea contra la tabla CONFIRMADAS/NO CONFIRMADAS del
semilla (sección 4). Resultado: **limpio en los 6 Actos**, sin correcciones
necesarias.
- MOMENTUM_NEGATIVO: único cruce = abandono de onboarding
  (`DepartmentOnboardingInsight`) — CONFIRMADA.
- BIEN_CON_FOCOS: el "O" agregado en la pasada anterior son hipótesis
  narrativas sin cita de fuente de datos — no cruza ninguna señal,
  confirmada o no. No requiere corrección.
- Ninguna mención, directa ni parafraseada, de `PDISuggestionEngine`,
  `GoalCompletionRate` ni `BonusTalentFactor` en ningún Acto.

**TEATRO_GENERALIZADO — sin cambios, confirmado.**
Victor corrigió mi lectura: el Acto no le baja el perfil al fenómeno — lo
nombra correctamente como una contradicción entre dos fuentes (el
cumplimiento dice una cosa, la gente dice otra), que es exactamente el
patrón de la Regla 1. Se mantiene el texto original de la sección 1 sin
modificar.
