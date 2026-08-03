# GATE 0 — Bitácora de Acciones de Clima (pestaña del responsable)

> Estado: **✅ GATE 0 CERRADO.** Victor aprobó D1-D6, color y patrón el 2026-08-03.
> Las decisiones están en §6, §7 y §8 de este documento, ya resueltas. Ninguna
> pregunta de este archivo sigue abierta.
> **Plan de implementación:** `PLAN_BITACORA_ACCIONES_CLIMA.md` (fases F1-F5).
> Única decisión viva del proyecto: **D7**, en el plan, no acá.
>
> Fecha: 2026-08-03 · HEAD `3c57bfa`
> No confundir con Tab 2 ("Atacar la causa"), que queda intacta.

## Decisiones cerradas (resumen de arrastre)

| # | Decisión sellada |
|---|---|
| D1 | Pestaña propia colgada del Rail. **No** es una 4ª pestaña de Planes |
| D2 | Card del Rail visible solo si el viewer tiene hallazgos asignados |
| D3 | La ampliación jerárquica toca escritura **y** lectura. Caso negativo cubre ambas |
| D4 | Cargo = `Employee.position` (verificado: 50/50 poblado, `jobTitle` 0/50). Mostrar con `formatDisplayName()` |
| D5 | Distintivo directo/superior **derivado en lectura**. Sin columna nueva |
| D6 | Pendiente = `ClimaActionLog.actionText === null` |
| Color | ✅ **Sin color protagonista.** Chrome canónico, distinción por estructura. El violeta que propuse contradecía la skill; ver §7 para las citas |
| Píldoras | Scroll horizontal, **sin "+N"**, con indicador fijo "1 de N" visible en 320px |
| Patrón | Landing Card 60/40. Victor lo ve en pantalla antes de sellar |

---

## 0. Resumen en una línea

Existe la tabla, el permiso y el POST. Lo que NO existe es la consulta
persona-céntrica ("mis hallazgos"), el autor de cada entrada en el DTO, y la
ampliación jerárquica del guard. Son 3 gaps reales, no cosmética.

---

## 1. Verificaciones pedidas en el brief

### 1.1 ¿La dimensión sale del triggerRef? SÍ, y además ya está en memoria

| Hecho | file:line |
|---|---|
| Formato del id | `src/lib/services/clima/ClimaActionPlanBuilder.ts:191` → `` triggerRef: `clima:${input.departmentId}:${driver.category}` `` |
| Parser YA escrito y en uso | `src/lib/services/clima/ActionEffectivenessService.ts:47-56` (`categoryFromTriggerRef`, corta después del 2º `:`) |
| Contrato documentado | `src/types/clima-planes.ts:168-171` — `triggerRef` + `category` conviven en `ClimaDecisionItem` |
| Label ejecutivo | `src/lib/constants/climaDimensions.ts:41-43` (`dimensionLabel(key)`), 8 dimensiones en `:27-36` |
| Lo que el DTO NO expone | `src/types/clima-atacar-causa.ts:10-16` — `ClimaAtacarCausaDecisionDTO` no lleva `category` |

**Conclusión.** No hay que inventar nada. `ClimaDecisionItem.category` ya está
cargado en el handler cuando arma el DTO (`src/app/api/clima/action-log/route.ts:205-218`),
o sea que el dato está a una línea de distancia.

Dos caminos, con recomendación:

- **(a) Parsear `triggerRef` en el cliente.** Duplica un parser que ya existe en
  el servidor. Descartado.
- **(b) Agregar `category: string` al DTO de decisión.** Aditivo puro, sale de
  `d.category` en el `.map()` de `:212-218`, y Tab 2 no lo lee, así que no la
  altera. **Recomendado.**

Matiz: los `logs[]` (`route.ts:243-252`) vienen de la tabla y solo tienen
`triggerRef`, sin `category`. Las píldoras se arman desde `decisiones`, así que
con (b) alcanza. Si alguna vez hiciera falta la dimensión de un log huérfano, se
reusa `categoryFromTriggerRef`, no se escribe otro parser.

### 1.2 El prefijo PROVISIONAL — el brief tiene el carácter equivocado

El prefijo real es **`PROVISIONAL: `** (dos puntos + espacio), no `PROVISIONAL — `.

`src/lib/services/clima/ClimaInterventionDictionary.ts:46`:
```
const P = 'PROVISIONAL: '; // prefijo obligatorio de toda narrativa scaffold (sin em-dash: regla de texto visible)
```

El propio comentario dice que el em dash está descartado a propósito. El régimen
está declarado en `:10-14` y el guard explícito en `:30`
(`DICTIONARY_CONTENT_STATUS = 'PROVISIONAL'`). Ejemplo de narrativa afectada en
`:57-60`.

Confirmado el punto de fondo del brief: **las píldoras usan `dimensionLabel(category)`,
nunca `narrative`.** La narrativa con su prefijo solo aparece en el cuerpo del
hallazgo en foco, tal como hoy en Tab 2 (`ClimaAtacarCausaScreen.tsx:216`).

### 1.3 Dónde vive la navegación de pestañas de Clima

`src/app/dashboard/clima/components/planes/ClimaPlanesView.tsx`

| Qué | Línea |
|---|---|
| Union de tabs | `:25` — `type PlanesTab = 'departamento' \| 'persona' \| 'seguimiento'` |
| Array de labels | `:27-31` (`TABS`) |
| Estado | `:39` (`useState<PlanesTab>('departamento')`) |
| Render de las pestañas | `:93-106` (mono 10px, activo `text-cyan-400`) |
| Switch del cuerpo | `:111-128` |
| Modo `bare` (oculta el chrome del shell) | `:48-51`, aplicado en `:66`, `:70`, `:81`, `:85` |

**Agregar una pestaña = 3 toques mecánicos** (union, array, rama del switch), más
decidir si entra en modo `bare`.

**⚠️ Choque con el brief.** El brief pide "una pestaña nueva, tercera". Ya hay
tres, y la tercera (`seguimiento`) **es un producto real diferido**, no un hueco:
`ClimaPlanesView.tsx:9` la declara como GROUP C y `:122-128` renderiza su empty
state. La pestaña nueva sería la **cuarta**. Ver §4, Decisión D1.

### 1.4 Dónde vive la card de entrada y su gating por rol

| Qué | file:line |
|---|---|
| Catálogo de cards del Rail | `src/lib/constants/climaSubproductos.ts:22-29` (son **5**, no 4 como dice su comentario `:4`) |
| Union type | `src/types/clima.ts:209` — `'cascada' \| 'analisis' \| 'ranking' \| 'dimensiones' \| 'planes'` |
| Componente de card | `src/app/dashboard/clima/components/ClimaSubproductoRailCard.tsx` |
| Render del carrusel | `ClimaRail.tsx:137-144` |
| Switch de vistas | `ClimaCinemaOrchestrator.tsx:170-197` |
| Estado / handler | `src/hooks/useClimaCinemaMode.ts:111`, `:256` |

**Gating por rol: hoy no existe.** El Rail no filtra nada; toda card se le muestra
a cualquiera con `clima:view`. Meter una card visible solo para responsables
significa introducir la primera condición de rol/relación del Rail. Si se hace,
va como constante compartida en `src/lib/constants/`, no como array inline.

El Lobby (`ClimaMissionControl.tsx:197-206`) solo tiene tags de texto inertes,
no cards navegables. No sirve como anfitrión.

---

## 2. Lo que se reusa tal cual (confirmado commiteado)

| Pieza | Ubicación | Estado |
|---|---|---|
| `ClimaActionLogEntry` | `prisma/schema.prisma:4107-4119` | `text @db.VarChar(200)`, `createdBy String?` = Employee.id |
| `ClimaActionLog` (padre + espejo) | `prisma/schema.prisma:4075-4096` | `@@unique([actionPlanId, triggerRef])` |
| Permiso `clima:action-log:write` | `src/lib/auth/permissions.ts:641-656` | 7 roles, AREA_MANAGER incluido |
| `POST /api/clima/action-log` | `src/app/api/clima/action-log/route.ts:264-374` | transacción entry + espejo + count |
| `GET` modo lista / modo entradas | `route.ts:123-262` | base de la paginación |
| `resolveDepartmentResponsable` | `src/lib/services/DepartmentResponsableService.ts:37-88` | walk-up + fallback admin |
| Toasts | `src/components/ui/toast-system.tsx:16-23` | `success()` / `error()` (error con `autoClose:false`) |
| Tiempo relativo | `date-fns@^3.6.0` (package.json) | `formatDistanceToNow` + locale `es`. No hay helper propio en `src/lib/` |

---

## 3. CÓDIGO SELLADO QUE SE TOCA

El brief anticipó dos puntos. Son **tres**, y el tercero es el que importa.

### 3.1 El guard del POST (anticipado)

`route.ts:293-321`. Exige responsable EXACTO: `responsable.source === 'responsable'`
y `responsable.employeeId === userContext.employeeId`. Ampliarlo a "responsable o
superior" cambia el corazón del gate. Commit sellado de referencia: `2af983c`.

### 3.2 El `canWrite` del GET (anticipado)

`route.ts:45-57`, función `isViewerDeptResponsable`. Su comentario (`:39-41`) dice
literalmente que es *"la MISMA condición que decide `canWrite` en el POST, fuente
única para que leer y escribir no diverjan"*. Si se amplía uno y no el otro, ese
comentario pasa a mentir. Van juntos.

### 3.3 ⚠️ La 3ª puerta del guard de LECTURA (NO anticipado por el brief)

`route.ts:99-102`. `isDepartmentReadDenied` llama a **la misma
`isViewerDeptResponsable`** como tercera puerta. Consecuencia:

> Ampliar `isViewerDeptResponsable` a "responsable o superior" **ensancha también
> quién puede LEER** el plan de un departamento, no solo quién puede escribir.

Es la 3ª puerta que se acaba de sellar en `2af983c`, con su racional escrito en
`route.ts:60-75` (`canWrite ⟹ read`). Esa implicación se mantiene si se amplía
todo junto, pero el efecto lateral sobre la lectura tiene que ser una decisión
consciente, no un derrame. Ver Decisión D3.

### 3.4 Smoke a rehacer

`prisma/scripts/smoke-clima-actionlog-read-guard.ts` (untracked, se borra al
sellar). Trae la topología real ya verificada 2026-08-01 y **es reutilizable casi
entera** para el smoke nuevo:

| Constante | Línea | Sirve para |
|---|---|---|
| `EMP_LUCIANO` responsable directo de `DEPT_COMERCIAL` | `:29-30` | caso positivo directo (200) |
| `EMP_MARIA` responsable de GERENCIA DE PERSONAS, walk-up a `DEPT_RRHH` | `:31-32` | caso positivo superior (200) |
| `DEPT_UNRELATED` (Desarrollo Software, hoja) | `:33` | **caso negativo obligatorio (403)** |
| `DEPT_GERENCIA_COMERCIAL` (padre de Comercial) | `:34` | superior real sobre Comercial |

El caso negativo del brief es exactamente el escenario de `:33`: alguien con
`clima:view` sin relación jerárquica con ese departamento. Ampliar el permiso no
puede convertirse en abrirlo a cualquiera con `clima:view`.

---

## 4. GAPS NUEVOS (no estaban en el brief)

### G1 — No existe la consulta "mis hallazgos" 🔴 bloqueante

El GET exige `planId` **y** `departmentId` (`route.ts:176-181`). Es
plan-céntrico y depto-céntrico.

La pestaña nueva es **persona-céntrica**: "los hallazgos que me tocan a mí".
Un responsable puede cubrir N departamentos (por walk-up, incluso departamentos
que no están en su JWT), y el cliente no conoce el `planId` aprobado sin pedirlo
aparte. Hoy Tab 2 lo resuelve porque RRHH ya eligió responsable y departamento
antes de entrar (`ClimaPlanPersonaTab.tsx:193-209`).

**Falta un modo nuevo del GET** (por ejemplo `?scope=mine&campaignId=`) que
resuelva servidor-side: plan aprobado de la campaña + departamentos de los que
el viewer es responsable (o superior) + decisiones + logs + entradas.
Sin esto, la pestaña no tiene de dónde leer.

### G2 — El DTO de entrada no trae autor 🔴 bloqueante

`src/types/clima-atacar-causa.ts:19-23`: `ClimaAtacarCausaEntryDTO = {id, text, createdAt}`.

La pestaña pide **nombre y cargo** de quien escribió. El dato existe en
`ClimaActionLogEntry.createdBy` (`schema.prisma:4113`) pero nunca se resuelve a
Employee: los `select` de `route.ts:161`, `:235` no lo traen.

Además, "cargo" es ambiguo en el schema: Employee tiene **dos** campos,
`position` (`schema.prisma:1780`) y `jobTitle` (`:1781`). Hay que elegir uno
(ver D4).

`createdBy` es nullable. Hoy el POST siempre lo puebla (`route.ts:304-315` corta
sin `employeeId`), pero el DTO tiene que tolerar `null` de todas formas.

### G3 — El distintivo "directo vs superior" no está persistido 🟡 decisión

Se puede **derivar en lectura** comparando `createdBy` contra el
`resolveDepartmentResponsable` de hoy. Pero eso es una foto del presente: si
mañana cambia el responsable del departamento, entradas viejas **cambian de
etiqueta retroactivamente**. Una entrada que dice "responsable directo" hoy
podría decir "superior" en tres meses sin que nadie haya tocado nada.

Alternativa: columna nueva en `ClimaActionLogEntry` que estampe la relación al
momento de escribir. Es schema-first, exige plan escrito. Ver D5.

### G4 — Aviso de 24h: derivable, sin schema nuevo 🟢

Se resuelve con la entrada más reciente del log: si `createdAt` está dentro de
24h y su autor ≠ viewer, se muestra. Depende de G2 (necesita el autor). Formato
"hace cuánto" con `formatDistanceToNow` de date-fns, locale `es`.

### G5 — Contador de pendientes de la card 🟡 decisión

No hay endpoint que lo calcule, y **"pendiente" no está definido en ninguna
parte del código**. ¿Hallazgo con cero entradas? ¿Con cero entradas en los
últimos 30 días (el offset del recordatorio,
`ClimaActionLogService.ts:21`)? Ver D6.

---

## 5. Las 4 preguntas del Gate 0 (skill focalizahr-design)

**1. El trabajo del usuario.** Un jefe de área que recibió el correo a los 30
días entra a dejar constancia de qué hizo con un hallazgo concreto de su equipo,
para que la próxima medición pueda evaluar si sirvió.

**2. Fricción mínima.** Correo → login → la pestaña ya abierta en su primer
hallazgo → escribe → un tap. Cero selección de campaña, cero selección de
departamento, cero elección de plan: el servidor ya sabe qué le toca (G1).

**3. El flujo completo.**
```
[correo 30 días]  →  /dashboard/clima  →  card "Bitácora"  →  pestaña
                                                                  │
                    ┌─────────────────────────────────────────────┤
                    │  píldora de dimensión (1..N)                 │
                    │  hallazgo en foco + aviso 24h                │
                    │  campo 200 chars → registrar                 │
                    └── confirmación del servidor → entrada arriba ┘
                                          │
                    queda en la pestaña, otra píldora o salir por el Rail
```
No hay pantalla de cierre: el usuario vuelve al mismo lugar con su entrada ya
visible. Mandamiento 9 satisfecho por el estado, no por un CTA de salida. Y el
brief lo pide explícito: nada de "volver al módulo de Clima", ya está adentro.

**4. Mobile-first (base 320px).** Una columna. Píldoras con scroll horizontal
y snap (patrón ya existente en `ClimaRail.tsx:132-136`). Irrenunciable en
móvil: hallazgo en foco + campo + botón. La bitácora arranca colapsada tras un
disclosure con el contador ("3 registros").

---

## 6. DECISIONES — ✅ TODAS RESUELTAS (Victor, 2026-08-03)

| # | Decisión | ✅ Resolución | Razón que dio Victor |
|---|---|---|---|
| **D1** | Dónde vive la pestaña | **Vista propia colgada del Rail.** No es 4ª pestaña de Planes | Planes es superficie de RRHH, la bitácora es del jefe. Mezclarlas repite un error ya cometido |
| **D2** | La card de entrada | **Visible solo con hallazgos asignados** | Una card que lleva a una pantalla vacía es ruido. El endpoint de conteo es parte de G1 igual |
| **D3** | Alcance de la ampliación | **La lectura también se amplía.** El caso negativo del smoke cubre lectura Y escritura | Ampliar solo la escritura dejaría a alguien registrando sin poder ver lo ya registrado |
| **D4** | Qué campo es "cargo" | **`Employee.position`**, con `formatDisplayName()` al mostrar | Verificado contra la BD real: `job_title` null en casi todos. Algunos nombres vienen en ALL CAPS |
| **D5** | Distintivo directo/superior | **Derivar en lectura.** Sin columna nueva | El distintivo es orientativo (que el jefe sepa quién escribió antes que él), no evidencia legal. Una columna es schema-first para un adorno |
| **D6** | Qué es "pendiente" | **`actionText === null`** | Alineado con lo que ya lee `ActionEffectivenessService` |

Verificación posterior contra la BD (2026-08-03, solo lectura) que confirma D4:
50/50 empleados activos con `position`, **0/50** con `jobTitle`.

---

## 7. COLOR E IDENTIDAD — ✅ RESUELTO: sin color protagonista

> Propuesta de violeta **retirada**. Victor aprobó el reemplazo (chrome canónico,
> distinción por estructura) el 2026-08-03. Las citas de abajo son el porqué.

### 7.1 Lo que dice la skill (citas textuales)

`references/MANIFIESTO_FOCALIZAHR_v5.md:155-159`
```
### Color semántico en narrativas

- **Cyan (#22D3EE)** — Nombres, categorías, entidades. Interacción y acción.
- **Purple (#A78BFA)** — Números, métricas, porcentajes. Inteligencia y benchmarks.
- **White** — Conectores, contexto. Lo que une la historia.
```

`references/executive-portadas.md:84` → `// PURPLE (#A78BFA) → Números, métricas, porcentajes`
`references/executive-portadas.md:528` → `2. **Color Semántico** - CYAN categorías, PURPLE métricas`
`references/executive-portadas.md:562` → `□ Números/métricas en PURPLE`
`references/cinema-mode.md:451` → `→ El nombre SIEMPRE en cyan-400, las métricas SIEMPRE en purple-400`
`references/premium-components.md:76` → `| Premium/Destacado | Purple | #A78BFA |`

Y una **segunda** asignación que invalida el argumento de "no tiene carga de estado":

`references/cascada-ejecutiva.md:103` → `Arco del gauge en color de gravedad: cyan >75%, amber 30-75%, purple <30%`
`references/cascada-ejecutiva.md:201` → `value < 20  → text-violet-400 (purple crisis — alerta visual)`

Clima ya la aplica: `src/app/dashboard/clima/components/cascada/shared.tsx:61-64`
`/** Color del hero number por gravedad (skill cascada-ejecutiva: purple=crisis). */`

### 7.2 Por qué la propuesta estaba mal

Argumenté por eliminación (cian tomado, ámbar es warning, verde choca con zona
saludable) y concluí que el violeta estaba libre **sin verificar a qué lo asigna
la skill**. La skill le asigna dos cosas: métricas/inteligencia/benchmarks, y
gravedad crítica en cascada. Una pantalla donde una persona escribe a mano no
produce ninguna métrica ni ninguna salida de motor. Y la afirmación "no tiene
carga semántica de estado" es falsa según `cascada-ejecutiva.md:201`.

### 7.3 Además, el violeta ya es el botón secundario

`src/components/ui/PremiumButton.tsx:67-74` — la variante `secondary` es violeta
sólido `linear-gradient(135deg, #A78BFA, #8B5CF6)`. Está **avalada**, no es deuda:
`.claude/rules/frontend-design.md` la fija como uno de los 5 elementos
obligatorios ("solo `PrimaryButton` / `SecondaryButton`"), y las pantallas de plan
de acción la usan (`ClimaPersonaWorkspace.tsx:289`, `ClimaPlanPersonaTab.tsx:343`).

La única corrección hecha sobre violeta fue de *estado disabled*, no del color:
`ClimaPersonaWorkspace.tsx:287` y `:359` → `Gateado = GhostButton neutro (no
violeta tenue): el disabled se lee inequívoco.`

Consecuencia: hacer el violeta acento protagonista de la pantalla lo colisiona
con el CTA secundario. Acento y botón quedarían del mismo color y se rompe el
Mandamiento 3 (un solo CTA principal visible).

### 7.4 Lo que corresponde según la skill

**La pantalla NO lleva color protagonista propio.**

La skill no tiene el concepto de "identidad de color por pantalla". Tiene lo
contrario: `SKILL.md:152`, Mandamiento 7 → `**Consistencia Absoluta** — Mismo
problema = misma solución visual`. Y `references/anti-patterns.md:137` →
`### 2. Colores Fuera de Paleta`.

El código lo confirma: **las 7 superficies de clima usan la misma Tesla**
`transparent 5% → #22D3EE 35% → #A78BFA 65% → transparent 95%`
(`ClimaPortada.tsx:44`, `ClimaDimensionesView.tsx:152`, `ClimaPlanesView.tsx:75`,
`ClimaPlanPortada.tsx:54`, `ClimaFixMetaScreen.tsx:170`,
`ClimaAtacarCausaScreen.tsx:124`, `ClimaSubproductoScaffold.tsx:44`). No hay
precedente de identidad cromática por pantalla en todo el módulo.

**La pantalla se distingue por estructura, no por color:**
- la barra de píldoras con el contador fijo, que ninguna otra superficie tiene
- el split 60/40 de Landing Card
- el campo de escritura, único en todo Clima
- badges ghost neutros para la autoría

Chrome idéntico al canónico: Tesla cian→violeta, glassmorphism slate, píldora
activa en cian (mismo token que `ClimaPlanesView.tsx:100` y `ClimaRail.tsx:78`).

**Aprobado por Victor 2026-08-03.** Es lo que implementa F3.

---

## 8. PATRÓN VISUAL — propuesta, esperando visto bueno

**Píldoras: Rail-filtro (Patrón 2A) horizontal arriba, no fixed-bottom.**

⚠️ Conflicto declarado con la skill: `focalizahr-design` fija **máximo 4 pills**
para la variante A. Acá son de 1 a 10+. Resolución propuesta: scroll horizontal
con snap, clonando `ClimaRail.tsx:132-136` (`scrollSnapType: 'x mandatory'`,
scrollbar oculta), sin flechas laterales en móvil. Si preferís respetar el tope
de 4 y colapsar el resto en un "+N", decilo y cambio.

**Cuerpo: Landing Card (Patrón 3), split 60/40, NO Cinema Mode.**

Landing Card es exactamente "contexto antes del formulario": el jefe lee el
problema y los pasos acordados, y recién entonces escribe. No es Cinema Mode
porque no hay identidad de persona que confirmar: el usuario **es** la persona.
Aplicar el split 35/65 con avatar acá sería el anti-patrón que la skill marca en
su checklist del Gate 3.

```
┌──────────────────────────────────────────────────────┐
│ ▔▔▔▔▔ Tesla violeta                                  │
│                                                      │
│  ( Liderazgo · 3 )  ( Comunicación · 0 )  ( … )      │  ← scroll-snap
│                                                      │
│  ┌────────────────────────┐  ┌────────────────────┐  │
│  │ HALLAZGO EN FOCO       │  │ BITÁCORA           │  │
│  │ narrativa (grande)     │  │ ─────────────────  │  │
│  │ pasos acordados        │  │ 12 jul · Nombre    │  │
│  │ nota de RRHH           │  │   Cargo · directo  │  │
│  │                        │  │   texto…           │  │
│  │ ⓘ aviso 24h            │  │ ─────────────────  │  │
│  │ ┌────────────────────┐ │  │ …2 más             │  │
│  │ │ campo 200      0/200│ │  │ Ver anteriores    │  │
│  │ └────────────────────┘ │  │                    │  │
│  │ [ Registrar … ]        │  │                    │  │
│  └────────────────────────┘  └────────────────────┘  │
│           60%                       40%              │
└──────────────────────────────────────────────────────┘

320px: una columna. Bitácora colapsada tras disclosure "3 registros".
```

**No construyo nada hasta que apruebes el patrón.**

### Cierre formal del Gate 0 (formato de la skill)

```yaml
RECURSOS_DE_DISEÑO_REQUERIDOS:
  patron_navegacion: Rail-filtro (2A, horizontal) + Landing Card (3)
  necesita_identidad_persona: no    # el usuario ES la persona
  elementos_visuales_minimos: >
    píldoras con scroll-snap, narrativa, lista de pasos, textarea con
    contador, 1 PrimaryButton, lista de 3 entradas.
    SIN avatar, SIN split 35/65, SIN gauge, SIN semáforo de color.
  verbo_del_cta: "Registrar intervención en bitácora"   # ver nota abajo
  siguiente_pantalla: >
    ninguna. Queda en la misma pestaña con la entrada nueva arriba del
    historial y el campo limpio. Salida por el Rail.
```

Nota sobre el verbo: cumple el diccionario (nombra el resultado, no la
operación) y evita los tres vetados. Es largo para 320px. Si querés, "Registrar
en bitácora" dice lo mismo y entra sin truncar. Tu llamada.

---

## 9. Archivos que se tocarían (estimación, para dimensionar)

**Modifican código sellado:**
1. `src/app/api/clima/action-log/route.ts` — guard ampliado + modo `mine` + autor en el DTO
2. `src/types/clima-atacar-causa.ts` — `category` en decisión, autor en entrada

**Nuevos:**
3. Vista de la pestaña + su card de entrada
4. Constantes de copy (cero literal, patrón `climaTab2Content.ts`)
5. Smoke del guard ampliado (3 casos, negativo obligatorio)

**Tocados si D1=(b) / D2=(b):**
6. `src/types/clima.ts:209` (union) · `src/lib/constants/climaSubproductos.ts:22-29`
   · `ClimaCinemaOrchestrator.tsx:170-197` · `useClimaCinemaMode.ts`

**Solo si D5=(b):** `prisma/schema.prisma` (columna nueva) → plan escrito aparte.

**NO se tocan:** `ClimaPlanDeptTab.tsx` (Tab 1), `ClimaPlanPersonaTab.tsx` (Tab 2),
`ClimaAtacarCausaScreen.tsx`, `ClimaActionLogService.ts`, `ActionEffectivenessService.ts`.
