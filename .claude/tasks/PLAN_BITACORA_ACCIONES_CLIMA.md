# PLAN — Bitácora de Acciones de Clima

## 🔒 ESTADO FINAL — GATE SELLADO 2026-08-05

**Construida, probada y sellada. NO alcanzable todavía.**

La pantalla existe, el endpoint está verificado contra datos reales y el flujo completo
se revisó en navegador con un fixture temporal. Pero **le devuelve estado vacío a todos
los usuarios**: `User.employeeId` está en NULL en los 26 usuarios de la base, y sin esa
identidad no hay con qué comparar contra la cadena de responsables.

Se enciende sola cuando la **Etapa 3** del vínculo Employee↔User puebla ese dato. Punto
exacto: `resolveViewerEmployeeId` en `src/app/api/clima/action-log/route.ts`. No hay nada
más que cambiar ahí.

### Base de datos: limpia (verificado fuera del script)

```
users.employee_id (maria@empresa.cl)      = NULL
departments.responsable_id (Ger. Comercial) = NULL
ClimaActionLogEntry en TODA la base       = 0
ClimaActionLog con espejo NO nulo         = 0
Departamentos con responsable             = 4   (los mismos que antes del gate)
Users con vínculo employeeId              = 0
```

El fixture de review se revirtió y las 11 entradas de prueba se borraron por id exacto
más `accountId`, con el espejo de los 8 `ClimaActionLog` padres restaurado a `null`.

### Pendientes que quedan anotados

| Qué | Dónde |
|---|---|
| Gatear la card por `pendingCount > 0`. Hoy daría 0 para todos y escondería la pantalla | `src/lib/constants/climaSubproductos.ts`, junto a la card |
| El overlay de la bitácora es local a esta pantalla. Si otro módulo lo necesita, se EXTRAE a `components/ui` | comentario en `ClimaBitacoraView.tsx` |
| Se perdió el aviso de "registró hace N horas" al sacarlo. El caso de dos personas registrando lo mismo ahora depende de que abran "N registros" antes de escribir | decisión Victor 2026-08-04 |
| `useClimaCinemaMode.ts:162-179` hace `setActiveSubproducto(null)` al cambiar `campaignCacheKey`. Si se dispara, la Bitácora se desmonta y se pierde el borrador | fuera de alcance de este gate |
| `employeeId` es claim cacheado 7 días: poblar o revocar el vínculo no tiene efecto hasta re-loguear | `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` §Etapa 3 |

### Scripts que NO se borran

Contra la regla habitual de borrar los smokes al sellar, quedan tres en
`prisma/scripts/` porque `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md:190-215` los documenta
como el procedimiento de verificación para el día que se retome la Etapa 3:

- `smoke-clima-actionlog-chain-guard.ts` (guard ampliado, GET y POST)
- `smoke-clima-actionlog-mine.ts` (modo `scope=mine` y autoría)
- `fixture-review-bitacora.ts` (enciende la pantalla para una persona, reversible)

`smoke-clima-actionlog-read-guard.ts` es de la sesión de V1 (2026-08-01), no de este
gate, y quedó superado por `chain-guard`. No se toca sin decisión de su autor.

---


> Gate 0 aprobado 2026-08-03. Decisiones D1-D6 selladas por Victor.
> Gate 0 completo (verificaciones con file:line): `GATE0_BITACORA_ACCIONES_CLIMA.md`
> Estado: **PLAN, esperando OK para F1.** Sin código escrito.
> HEAD `3c57bfa`

---

## Decisiones selladas

| # | Decisión |
|---|---|
| D1 | Pestaña propia colgada del Rail. No es una 4ª pestaña de Planes |
| D2 | Card del Rail visible solo si el viewer tiene hallazgos asignados |
| D3 | La ampliación jerárquica toca escritura **y** lectura. Caso negativo cubre las dos |
| D4 | Cargo = `Employee.position`, mostrado con `formatDisplayName()` |
| D5 | Distintivo directo/superior derivado en lectura. Sin columna nueva |
| D6 | Pendiente = `ClimaActionLog.actionText === null` |
| Color | **Sin color protagonista.** Chrome canónico, distinción por estructura. Ver Gate 0 §7 |
| Píldoras | Scroll horizontal, sin "+N", con indicador fijo "1 de N" |
| Patrón | Landing Card 60/40. Victor lo ve en pantalla antes de sellar |

---

## Topología real verificada (2026-08-03, solo lectura)

Cuenta de prueba `cmfgedx7b00012413i92048wl`.

| Dato | Valor |
|---|---|
| Departamentos activos | 57, de los cuales **4 tienen responsable** |
| Con responsable | Comercial · Atención a Clientes · Gerencia E2E (los tres bajo Gerencia Comercial) · GERENCIA DE PERSONAS (raíz) |
| Cadenas con 2 responsables | **ninguna** (ver D7) |
| Gerencia Comercial | `cmfgedyfo000d2413t42n3vwr`, `responsableId = null` |
| Plan aprobado | `cmruvpmzx000110lephf8fma6`, campaña `cmrb5a5c100whbqao4zg0d1bk` |
| Logs del plan | 17, **los 17 con `actionText = NULL`** (todos pendientes por D6) |
| Responsable con 2 deptos | `cmktf3127008xvvgxpxqy14xq` cubre Comercial (2 hallazgos) y Atención a Clientes (6) = **8 hallazgos**, caso ideal para probar el modo persona-céntrico |
| `position` / `jobTitle` | 50/50 · 0/50 |

---

## F1 — Fundacional: cadena jerárquica y guard ampliado (backend)

> Nada de UI hasta que F1 pase su smoke.

### F1.1 Predicado de cadena

Nueva función exportada en `src/lib/services/DepartmentResponsableService.ts`
(archivo commiteado; la adición es aditiva, no altera las 4 funciones existentes):

```
resolveResponsableChain({ departmentId, accountId })
  → { resolved: DepartmentResponsableResult,
      chainEmployeeIds: Set<string> }
```

Sube por `parentId` desde el propio `departmentId`, mismo `MAX_DEPTH = 6` y mismo
guard multi-tenant por salto que `resolveDepartmentResponsable` (`:46-54`),
recogiendo el `responsableId` de **cada** departamento de la cadena cuyo Employee
esté activo y sea de la cuenta. `resolved` es el primer hit (idéntico a hoy);
`chainEmployeeIds` son todos.

Por qué acá y no una función suelta: es el mismo conocimiento que ya vive en ese
archivo (`:5-9` documenta el contrato del walk-up). Partirlo garantiza divergencia.

**Sube por `parentId` crudo, no por `getChildDepartmentIds()`.** Esa función usa
LRU cacheado de 15 minutos (`AuthorizationService.ts:8-11`); el walk-up existente
la evita a propósito y esta lo mantiene.

Semántica resultante, exactamente lo pedido:
- responsable resuelto de D → escribe (es el primer elemento de la cadena)
- responsable de cualquier ancestro de D → escribe (está en la cadena)
- cualquier otro → 403, aunque tenga `clima:view`

Fail-closed preservado: si nadie en la cadena tiene responsable activo,
`resolved.source === 'account_admin'` y `chainEmployeeIds` queda vacío. Nadie
escribe. Es el comportamiento de hoy (`action-log/route.ts:298-303`).

### F1.2 Guard ampliado en los tres puntos (D3)

`src/app/api/clima/action-log/route.ts`

| Punto | Línea actual | Cambio |
|---|---|---|
| `isViewerDeptResponsable` | `:45-57` | Renombrar a `isViewerInResponsableChain`. Devuelve `chainEmployeeIds.has(userContext.employeeId)`. Sin `employeeId` → `false` (se preserva `:49`) |
| 3ª puerta de lectura | `:99-102` | Sin cambio estructural: llama a la función renombrada. **La lectura se ensancha aquí, por D3** |
| `canWrite` del modo lista | `:187` | Sin cambio estructural. Sigue siendo la misma resolución compartida con la puerta 3 (`:182-186`) |
| Guard de propiedad del POST | `:293-321` | Reemplazar la comparación `responsable.employeeId === userContext.employeeId` (`:316`) por pertenencia a la cadena. Se conservan intactos: el corte por `source !== 'responsable'` (`:298-303`) y el mensaje honesto de vínculo no poblado (`:304-315`) |

Se actualizan los comentarios de `:10-14`, `:39-44` y `:60-75`, que hoy dicen
"responsable resuelto" y pasarían a mentir.

### F1.3 Smoke A — `prisma/scripts/smoke-clima-actionlog-chain-guard.ts`

Reusa la mecánica del smoke actual (`smoke-clima-actionlog-read-guard.ts:47-68`:
`hdr()` inyecta `x-employee-id`, invoca el handler real). Ese smoke se borra al
sellar y este lo reemplaza.

Los tres casos, **cada uno contra GET y contra POST** (D3):

| # | Caso | GET | POST |
|---|---|---|---|
| 1 | Responsable directo (LUCIANO → Comercial) | 200 + `canWrite: true` | 200 + entry creada |
| 2 | Superior en la línea (responsable de Gerencia Comercial → Comercial) | 200 + `canWrite: true` | 200 + entry creada |
| 3 | **Fuera de la línea**, con `clima:view`, sin relación jerárquica | **403** | **403** |
| 4 | Sin `employeeId` (vínculo no poblado) | 403 | 403 con el mensaje de vínculo |

Caso 3 usa Desarrollo Software (`cmfgee09w000k2413mfl6wsak`) como departamento
del JWT del viewer: es hoja bajo otra rama, su subárbol no cubre Comercial, y su
empleado no está en la cadena de Comercial. Sirve además para verificar que
MARIA (GERENCIA DE PERSONAS) sigue recibiendo 403 sobre Comercial: ramas
hermanas, no línea vertical.

Precondiciones aserradas antes de correr (que el smoke pruebe lo que cree probar):
Comercial tiene responsable propio, Gerencia Comercial es su padre, y la cadena
de Comercial contiene exactamente 2 employeeIds.

Escrituras: las entries del caso 1 y 2. Cleanup por **id exacto** en
`try/finally` con `$transaction`, incluyendo la restauración del espejo del padre
(`ClimaActionLog.actionText/registeredAt/registeredBy`), que el POST sincroniza
en `:351-358` y hoy está en `NULL` en los 17 logs. Sin restaurarlo, el smoke
dejaría un log falsamente "ejecutado" y rompería D6.

**⚠️ F1 no sella sin resolver D7 (abajo).** El caso 2 no tiene datos reales.

---

## F2 — Modo persona-céntrico y autor en el DTO (backend)

### F2.1 Modo `mine` del GET (G1, "modo nuevo, no parche")

`GET /api/clima/action-log?scope=mine&campaignId=<id>`

Tercer modo del handler, hermano de los dos actuales (`:139` logId, `:176`
planId+departmentId). No los toca.

Resolución, toda en el servidor:
1. Permiso `clima:view` (el mismo del GET actual, `:129`).
2. Plan aprobado de la campaña: `actionPlan` con `accountId`, `moduleType: 'clima'`,
   `estado: 'aprobado'`. Sin plan → `{ items: [], pendingCount: 0 }`, no error.
3. `climaActionLog` del plan (`:221-224`), sus `departmentId` distintos.
4. **Un solo query** de departamentos de la cuenta (`id, parentId, responsableId`)
   y las cadenas se calculan en memoria, patrón de
   `computeResponsableCandidateCounts` (`DepartmentResponsableService.ts:165-226`).
   Evita N walk-ups. Se filtra a los departamentos donde el viewer está en la cadena.
5. Decisiones del plan acotadas a esos departamentos y a `aceptar|modificar`,
   misma regla que `:206-218`.
6. Entradas: las últimas 3 por log, con autor resuelto (F2.2).

Respuesta:
```ts
{ items: ClimaBitacoraItemDTO[], pendingCount: number }
```
donde cada item lleva `logId · triggerRef · category · departmentId ·
departmentName · narrative · steps · ceoNotes · entriesCount · entries[] · canWrite`.

`category` sale de `d.category` del `ClimaDecisionItem` (`clima-planes.ts:171`),
que ya está en memoria. No se parsea `triggerRef` en el cliente.

Orden de los items: departamento, luego dimensión, estable entre recargas. Los
pendientes (D6) primero dentro de cada departamento.

### F2.2 Autor en el DTO (G2)

`src/types/clima-atacar-causa.ts` — ampliación aditiva de
`ClimaAtacarCausaEntryDTO` (`:19-23`):

```ts
export type ClimaBitacoraAuthorRelation = 'responsable' | 'superior';

export interface ClimaAtacarCausaEntryAuthorDTO {
  name: string;                 // formatDisplayName(fullName) aplicado en el server
  position: string | null;      // D4
  relation: ClimaBitacoraAuthorRelation;
}

// añadido al DTO existente:
author: ClimaAtacarCausaEntryAuthorDTO | null;
```

`null` cuando `createdBy` es null (`schema.prisma:4113` lo permite) o el Employee
ya no está. La UI omite el distintivo, no muestra un hueco.

**Tab 2 sigue intacta.** Es un campo nuevo en una interfaz que
`ClimaAtacarCausaScreen.tsx:249-259` no lee. Compila y renderiza idéntico. Se
verifica en F5 con `tsc --noEmit`.

`formatDisplayName()` (`src/lib/utils/formatName.ts:21-50`) se aplica **en el
servidor**, junto al `select`, para que el DTO viaje ya legible. `position` se
muestra crudo (no es un nombre propio; `toTitleCase` sobre un cargo real podría
degradar acrónimos).

### F2.3 Derivación del distintivo (D5)

Por departamento, una sola resolución (la de F1.1, ya calculada para el guard):

```
entry.createdBy === resolved.employeeId  →  'responsable'
en la cadena, pero no el resuelto        →  'superior'
```

Foto del presente, aceptado en D5. Se deja una línea de comentario en el handler
diciendo exactamente eso, para que nadie lo lea después como dato histórico.

### F2.4 Conteo para la card (D2 + G5)

`GET /api/clima/action-log?scope=mine&campaignId=<id>&count=1` →
`{ pendingCount }`. Misma resolución de cadena, corta antes de armar decisiones y
entradas. Pendiente = logs de la cadena del viewer con `actionText === null` (D6).

Existe como parámetro y no como endpoint aparte para que la regla de cadena viva
en un solo handler.

### F2.5 Smoke B — `prisma/scripts/smoke-clima-actionlog-mine.ts`

Solo lectura, sin cleanup necesario:
- `cmktf3127008xvvgxpxqy14xq` (responsable de Comercial y de Atención a Clientes)
  → **8 items** repartidos en 2 departamentos, `pendingCount = 8`.
- Viewer fuera de toda cadena → `items: []`, `pendingCount: 0`, status 200 (no
  es un error, es un vacío legítimo).
- Campaña sin plan aprobado → `items: []`, sin excepción.
- Ningún item trae `narrative` sin su `category` (garantiza que las píldoras
  siempre tienen etiqueta).

---

## F3 — Pantalla (UI) · Victor la ve antes de sellar

Se carga `focalizahr-narrativas` antes de escribir copy.

### F3.1 Constantes de copy

`src/lib/constants/climaBitacoraContent.ts`, molde de `climaTab2Content.ts`.
Cero literal en el componente. Sin em dash, sin emojis, sin "Guardar",
"Confirmar" ni "Enviar".

CTA: `"Registrar intervención en bitácora"` según lo aprobado, con la variante
corta `"Registrar en bitácora"` bajo `md:` si al medirla no entra en 320px sin
truncar. Si hace falta usarla, te lo muestro antes.

### F3.2 Vista

`src/app/dashboard/clima/components/bitacora/ClimaBitacoraView.tsx`

Carpeta propia, no dentro de `planes/`: D1 estableció que es superficie del jefe,
no de RRHH, y la separación física evita que dentro de tres meses alguien la
lea como una pestaña de Planes.

Chrome: `rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm`
y **Tesla canónica cian→violeta**, idéntica a las otras 7 superficies de clima
(`ClimaPlanesView.tsx:75` y hermanas):

```
linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)
```

Sin color protagonista propio (D8). La pantalla se distingue por estructura:
barra de píldoras con contador fijo, split 60/40, campo de escritura, badges
ghost neutros. Píldora activa en cian, mismo token que `ClimaPlanesView.tsx:100`.

**Barra de píldoras.** Contador fijo a la izquierda (`flex-shrink-0`), píldoras
con scroll-snap a la derecha, clon de `ClimaRail.tsx:132-136`
(`scrollSnapType: 'x mandatory'`, scrollbar oculta). Sin flechas laterales en
móvil. Activa en violeta, inactivas en `text-slate-500`.

```
[ 1 de 8 ]  ( Liderazgo · 3 ) ( Comunicación · 0 ) ( Autonomía · 1 ) →
 ^ fijo      ^ scrollea
```

El contador es el `1 de N` pedido: visible en 320px sin recorrer la barra.

**Cuerpo, Landing Card 60/40.** Izquierda: narrativa del hallazgo como texto
primario, pasos acordados debajo, nota de RRHH si existe, aviso de 24h, campo y
botón. Derecha: las 3 entradas más recientes, la última arriba, cada una con
fecha, nombre, cargo y distintivo.

En 320px: una columna, bitácora colapsada tras un disclosure con su contador
("3 registros"). Tap targets ≥ 44px.

**Distintivo de autoría:** tag ghost neutro, el mismo token que ya usan
`ClimaPlanPersonaTab.tsx:313-315` y `ClimaMissionControl.tsx:199-203`. Dice
`Responsable` o `Superior`, nada más. Sin leyenda explicativa, según el brief.

**Aviso de 24h:** aparece si la entrada más reciente del hallazgo en foco tiene
menos de 24h y su autor no es el viewer. Texto con nombre y tiempo relativo vía
`formatDistanceToNow` de `date-fns` (`^3.6.0`, ya en `package.json`) con locale
`es`. Tono preventivo, no bloqueante: no deshabilita el campo.

**Envío.** Campo deshabilitado durante el vuelo, espera real del `await` del POST,
sin actualización optimista. Con la confirmación: la entrada nueva entra arriba
del historial, el contador de la píldora sube, el campo se limpia. Si falla, el
texto **queda en el campo** y el botón vuelve a estar activo.

Feedback con `toast-system.tsx` (`success()` / `error()`, `:16-23`). Nada nuevo.

**Estado vacío.** Sin hallazgos asignados: `FHREmptyState`. Sin CTA de salida
inventado; la pestaña ya está dentro de Clima y el Rail es la salida.

### F3.3 Entrada en el Rail, sin gating todavía

Para que puedas verla: 6ª card en `climaSubproductos.ts:22-29`, valor nuevo en el
union de `src/types/clima.ts:209`, rama en el switch de
`ClimaCinemaOrchestrator.tsx:170-197`.

**Al terminar F3 te digo la ruta exacta para navegar en tu dev server y paro.**
No sello sin tu visto en pantalla.

---

## F4 — Gating de la card por conteo (D2)

La card aparece solo si `pendingCount > 0`, vía F2.4 desde
`useClimaCinemaMode.ts` (estado en `:111`, handler en `:256`).

Es la **primera condición de visibilidad del Rail**: hoy toda card se muestra a
cualquiera con `clima:view`. El filtro se aplica sobre `CLIMA_SUBPRODUCTOS` en
`ClimaRail.tsx:137-144`, con la constante de la card gateada en
`src/lib/constants/`, nunca un array inline en el componente.

Mientras el conteo está en vuelo la card no se muestra: es preferible que
aparezca un instante tarde a que parpadee y desaparezca.

---

## F5 — Cierre

1. `npx --no-install tsc --noEmit` y `npx --no-install next build`.
   Si tu dev server está arriba, salteo `prisma generate` (no se toca el schema).
2. Verificar que Tab 1 y Tab 2 compilan y renderizan sin cambios.
3. As-built en este mismo archivo.
4. ~~Borrar los dos smokes y el `smoke-clima-actionlog-read-guard.ts` que reemplazan.~~
   **REVERTIDO al sellar:** los smokes quedan porque el doc del vínculo los documenta
   como procedimiento de verificación de la Etapa 3. Ver §ESTADO FINAL arriba.
5. Commits: `git status -s` antes de cada uno, `git add` archivo por archivo,
   `git commit -F <msg> -- <paths>`, código y doc separados. **Sin push.**

---

## AS-BUILT F1 — ✅ 2026-08-03

**Código** (`tsc --noEmit` limpio):

- `src/lib/services/DepartmentResponsableService.ts` — `resolveResponsableChain()`
  nueva, aditiva. Sube por `parentId` crudo (no `getChildDepartmentIds`, LRU 15 min:
  la respuesta gatea escritura). Devuelve `{resolved, chainEmployeeIds}`; `resolved`
  conserva la semántica exacta de `resolveDepartmentResponsable` (primer hit +
  fallback `account_admin`). Solo ascendente. Lleva el aviso ⚠️ de regla duplicada,
  con el motivo: `resolveDepartmentResponsable` corta en el primer hit y lo llaman
  rutas calientes (`by-person`, una vez por departamento); ésta recorre la cadena
  entera.
- `src/app/api/clima/action-log/route.ts` — `isViewerDeptResponsable` →
  `isViewerInResponsableChain`, consumida sin cambio estructural por la 3ª puerta de
  lectura y por `canWrite`. Guard del POST: de igualdad a pertenencia a la cadena,
  conservando el corte por `source !== 'responsable'` y el mensaje de vínculo no
  poblado. Actualizados los 3 bloques de comentario que habrían quedado mintiendo,
  con el racional de D3 escrito en la 3ª puerta.

**Smoke** `prisma/scripts/smoke-clima-actionlog-chain-guard.ts` (untracked, se borra
al sellar): **29 PASS · 0 FAIL** con `--commit`.

Añadido sobre el plan: el arnés del POST se verifica ANTES de aplicar el fixture,
con un caso que da 403 y no escribe. Si la invocación del handler estuviera rota,
nos enteramos sin haber tocado producción.

Casos cubiertos, cada uno contra GET y POST: responsable directo 200 · superior en
la línea 200 · fuera de la línea 403 · sin `employeeId` 403 · regresión de rol global
(200 con `canWrite: false`).

**Fixture D7 ejecutado y revertido.** Verificación independiente, leída fuera del
`finally` del propio smoke:

```
Gerencia Comercial.responsableId = null
Departamentos con responsable = 4        (igual que antes del smoke)
Logs del plan = 17 | con espejo NO nulo = 0
ClimaActionLogEntry totales en la cuenta = 0
Entries con texto del smoke = 0
```

---

## ✅ CERRADO — "un rol global recibe 8 items con employeeId null". NO ERA UN BUG.

> **No volver a investigarlo.** Quedó explicado y verificado el 2026-08-04.

**Síntoma:** `admin@corporacionenterprise.cl` (ACCOUNT_OWNER, `employeeId` NULL) recibía
8 items en vez del estado vacío, mientras `maria@empresa.cl` recibía
`{"items":[],"pendingCount":0}`, que es lo correcto.

**Causa:** JWT viejo. La sesión tenía un token acuñado cuando un fixture de demo había
poblado `User.employeeId`. El claim viaja **dentro** del token
(`api/auth/user/login/route.ts:141`), así que el header `x-employee-id` seguía llegando
con valor aunque la base ya estuviera en NULL. Cerrando sesión y volviendo a entrar, el
token nuevo no lo lleva y la pantalla muestra el estado vacío.

**El código estaba bien.** `route.ts` corta con `if (!viewerEmployeeId) return emptyData`,
y el smoke lo cubre con el caso `4a. rol GLOBAL sin ser responsable → 200 y vacío`, que
pasa invocando el handler real. Nunca hubo una rama que devolviera items sin identidad.

### 📌 Lo que sí deja como aprendizaje para la Etapa 3

`employeeId` es un claim **cacheado en el token por 7 días** (`generateJWT`,
`expiresIn: '7d'`). Consecuencias reales para quien implemente el vínculo:

- **Revocar `User.employeeId` en la base NO tiene efecto inmediato.** El usuario sigue
  presentando el claim viejo hasta que expire o vuelva a entrar. Si alguna vez hay que
  cortarle el acceso a alguien, la baja del vínculo no alcanza.
- **Poblar el vínculo tampoco se ve al instante:** hay que volver a loguearse. Esto
  aplica al fixture de review que quedó planificado.
- Cualquier verificación de la Bitácora debe empezar por **cerrar sesión y entrar de
  nuevo**, o se mide contra un token viejo. Fue exactamente lo que pasó acá.

---

## REDISEÑO 2 — UNA PANTALLA, SIN SCROLL — ✅ 2026-08-04 (`617997c`)

Después de verla con el fixture puesto: ocupaba **tres pantallas de alto**, once bloques
apilados y dos scrolls antes del campo. La persona entra cada varios meses por un
recordatorio y tiene un minuto. Sacar y juntar, cero lógica nueva.

**Cuatro bloques:** salida + identidad en un renglón · contador fijo + píldoras ·
UNA caja con departamento, problema, pasos, nota, aviso, campo y botón · bitácora en
un renglón que no reserva altura.

**Se eliminan kicker, título y bajada.** Diverge de "Los 5 Elementos Obligatorios"
(`.claude/rules/frontend-design.md`), que exige word-split de títulos. Se trajo como
decisión antes de escribir: la regla apunta a pantallas de ENTRADA a módulo, y acá la
card del Rail por la que se entra ya dice "Bitácora de Acciones".

**Píldoras monolínea con el patrón canónico de la skill**
(`references/page-patterns.md:107-131`, PATRÓN 2) en vez del carrusel de cards de
`ClimaRail` que se había clonado por error. De paso se cerró un conflicto mal
diagnosticado: "máximo 4 pills" es **4 visibles más scroll**, no un tope de cantidad.

**Abreviatura de departamento con garantía anti-colisión** en
`climaBitacoraContent.ts`: primera palabra significativa saltando preposiciones y
prefijos genéricos, y si dos departamentos de la vista abrevian igual, ambos caen al
nombre completo. El truncado CSS no servía: dos focos de "Atención a Clientes" decían
los dos `ATENCIÓN A CLIENT…`.

Verificado sobre nombres reales: `Atención a Clientes → ATENCIÓN`, `Gerencia General →
GENERAL`, y `Comercial` + `Gerencia Comercial` juntos → los dos con nombre completo.

---

## REDISEÑO 1 — DE SPLIT A UNA COLUMNA — ✅ 2026-08-04 (`e87075b`)

Victor entró a la pantalla y no entendió qué tenía que hacer. El split 60/40 dejaba el
campo compitiendo con un historial casi siempre vacío. **Reordenamiento, no
reconstrucción:** fetch, envío, borradores, toasts, paginación y estados sin tocar.

Flujo vertical único: salida → título → quién sos → píldoras → el foco → **el campo** →
bitácora colapsada. La bitácora pasa a colapsada en TODOS los breakpoints.

**Píldoras de dos líneas** (departamento + dimensión). Con un jefe de varios equipos se
veían dos "Autonomía" y dos "Liderazgo" indistinguibles hasta tocarlas: en una pantalla
que firma lo que se escribe, eso es registrar sobre el foco equivocado. El departamento
sale de arriba del plan, donde quedaba duplicado.

**`viewer` nuevo en el DTO del modo mine.** Nombre y cargo resueltos en el servidor, sin
etiqueta. Va en el server y no desde `x-user-name` porque lo que corresponde mostrar es
la identidad que el guard usó para decidir, que es la que va a firmar.

**Dos defectos confirmados, arreglados:** el campo se renderizaba sin mirar `canWrite`
(el POST ya revalidaba, era solo UI); y la salida existía pero en `slate-600` sobre
`slate-900/60` era ilegible, así que subió a `slate-400` con label. Esa segunda es una
divergencia deliberada del token del módulo.

Smoke 23/23 (3 asserts nuevos de `viewer`). Sin línea de "sin permiso de escritura":
decisión de Victor, no se agrega texto para explicar un caso que no debería existir.

---

## AS-BUILT F3 + F4 — ✅ 2026-08-04 · GATE CERRADO

**Nuevos:** `src/lib/constants/climaBitacoraContent.ts` ·
`src/app/dashboard/clima/components/bitacora/ClimaBitacoraView.tsx`
**Cableado:** union en `types/clima.ts` · card en `climaSubproductos.ts` · rama en
`ClimaCinemaOrchestrator.tsx`. **Ningún archivo de Planes, Tab 1 ni Tab 2 fue tocado.**

Landing Card 60/40, chrome canónico sin color protagonista, píldoras con scroll-snap y
contador fijo "1 de N", borradores por foco, envío con espera real del servidor y texto
preservado ante error, autoría con nombre y cargo sin etiqueta de jerarquía.

**F4 — el gating NO se implementó, a propósito.** La card se muestra siempre. Con el
vínculo Employee↔User sin poblar, `pendingCount` da 0 para todos, así que el gate
escondería la pantalla entera en vez de filtrarla. Queda anotado como una línea en
`climaSubproductos.ts`, junto a la card.

### ⛔ La pantalla está construida y ESPERANDO el vínculo Employee↔User

Hoy devuelve estado vacío a **todos** los usuarios: `User.employeeId` está en NULL en
los 12 de la cuenta y la identidad del jefe no se puede resolver de otra forma.

Lo verificado en el camino, todo con evidencia en el doc de arquitectura:

- El claim SÍ existe (`api/auth/user/login/route.ts:141` → `middleware.ts:215`). Un
  reporte anterior de esta sesión decía lo contrario mirando el login de **cuenta**, que
  es otro archivo. Corregido.
- `User.departmentId` viaja y está poblado en 2 de 12, pero **no sustituye** a
  `employeeId`: dice dónde está una persona, no de qué responde. La responsabilidad vive
  en `Department.responsableId → Employee`.
- El fallback por email **resuelve a la persona equivocada**: 199 de 219 empleados
  comparten `1uan@corre.cl` y 3 de los 4 responsables lo tienen. Descartado.

Anclado en `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` §Etapa 3, con los 4 commits y el
punto exacto donde se enciende (`resolveViewerEmployeeId`).

---

## AS-BUILT F2 — ✅ 2026-08-03

**Código** (`tsc --noEmit` limpio):

- `DepartmentResponsableService.ts` — `computeResponsableChains()`, versión BULK de
  `resolveResponsableChain` en **2 queries** para N departamentos. Sin fallback a
  `account_admin`: al caller bulk no le sirve el admin, le sirve saber si el viewer
  responde o no. Lleva el mismo aviso ⚠️ de regla duplicada.
- `src/types/clima-atacar-causa.ts` — `ClimaBitacoraAuthorRelation`,
  `ClimaAtacarCausaEntryAuthorDTO`, y `author?` **opcional** en la entry.
- `src/types/clima-bitacora.ts` — NUEVO. `ClimaBitacoraItemDTO` +
  `ClimaBitacoraMineResponse`.
- `action-log/route.ts` — `getMine()`, tercer modo. Plan aprobado → logs → cadenas
  bulk → filtro persona-céntrico → decisiones por `triggerRef` → entradas con autor.

**Desvíos del plan, deliberados:**

1. `author` quedó **opcional**, no requerido. Requerido habría obligado a los modos
   lista y entradas (los de Tab 2) a resolver autores que Tab 2 no muestra: queries de
   más en una ruta que no los usa. Verificado en el smoke (6n).
2. **No** se agregó `category` a `ClimaAtacarCausaDecisionDTO`. La Bitácora usa
   `ClimaBitacoraItemDTO`, que ya lo trae. Agregarlo al DTO de Tab 2 era tocar su
   contrato sin ningún consumidor.

**Smoke** `prisma/scripts/smoke-clima-actionlog-mine.ts`: **37 PASS · 0 FAIL** con
`--commit` (20 de ellos read-only).

Cubre: 8 hallazgos en 2 departamentos sin que el cliente elija · `category` presente y
coincidente con el sufijo del `triggerRef` en los 8 · `count=1` con el mismo
`pendingCount` y sin items · responsable sin hallazgos, fuera de cadena, rol global,
campaña sin plan aprobado y sin `employeeId` → 200 vacío · sin `campaignId` 400 · sin
`clima:view` 403 · autoría con `relation` `'responsable'` y `'superior'` · el superior
ve los departamentos de abajo · Tab 2 no paga el join.

**Fixture ejecutado y revertido.** Verificación independiente, fuera del `finally`:

```
Gerencia Comercial.responsableId = null
Departamentos con responsable = 4        (igual que antes)
Logs del plan = 17 | con espejo NO nulo = 0
ClimaActionLogEntry totales en la cuenta = 0
```

---

## ⚠️ ABIERTA — consecuencia de F1 sobre Tab 2 (decisión de Victor)

F1 amplió quién escribe. **Antes**, todas las entradas de un hallazgo venían del único
responsable, así que "quién escribió" era implícito y no hacía falta mostrarlo.
**Ahora** pueden venir del responsable o de cualquier superior, y el historial read-only
de Tab 2 (`ClimaAtacarCausaScreen.tsx:249-259`) muestra solo texto y fecha.

Resultado: RRHH puede leer dos entradas del mismo hallazgo sin saber que las escribieron
personas distintas.

No se tocó porque la instrucción fue explícita: Tab 2 no se toca. El dato ya existe
(`ClimaActionLogEntry.createdBy`) y el DTO ya soporta `author`; sería llenarlo también en
el modo lista y renderizarlo. **Esperando decisión: se arregla, o va a
`PENDIENTES_ACTIVOS_EX_CLIMA.md`.**

---

## D7 — ✅ RESUELTO (fixture ejecutado y revertido, ver as-built)

El caso positivo "superior en la jerarquía" **no tiene datos reales**: de 57
departamentos activos solo 4 tienen responsable, y ninguna cadena tiene dos. No
hay ningún departamento contra el cual probar que un superior escribe y lee.

Sin resolverlo, F1 puede escribirse pero no sellarse: quedaría cubierto el
positivo directo y el negativo, y sin cubrir la mitad de la ampliación que es
todo el objeto del cambio.

Tres salidas:

**(a) Fixture temporal, restaurado en `finally`.** Gerencia Comercial
(`cmfgedyfo000d2413t42n3vwr`) tiene `responsableId = null` y es padre de
Comercial, que tiene a LUCIANO. Setearle un responsable crea exactamente la
cadena de dos que falta. Es **una escritura a producción** de un campo nullable,
restaurada a `null` en `finally` junto al resto del cleanup.
Recomendada: contenida, reversible, y el valor previo (`null`) es conocido con
certeza.

**(b) Esperar la primera nómina real.** El backfill de responsables
(`ARQUITECTURA_RESPONSABLE_DEPARTAMENTO.md`) está sin correr esperando esa
nómina. Cuando exista habrá cadenas reales. Cuesta bloquear F1 por tiempo
indefinido.

**(c) Asignar de verdad un responsable a Gerencia Comercial.** Deja de ser
fixture y pasa a ser dato de la cuenta de prueba. Solo si tiene sentido de
negocio, no para satisfacer un test.

**No escribo nada a producción sin tu sí explícito.** Decime cuál y arranco F1.

---

## D8 — ✅ RESUELTO: sin color protagonista de la pantalla

Retiré la propuesta de violeta. Contradice la skill en tres frentes, con cita
textual en `GATE0_BITACORA_ACCIONES_CLIMA.md` §7:

1. `MANIFIESTO_FOCALIZAHR_v5.md:158` asigna el violeta a "Números, métricas,
   porcentajes. Inteligencia y benchmarks". Esta pantalla no produce ninguna
   métrica: la escribe una persona a mano.
2. `cascada-ejecutiva.md:201` le da una segunda carga, `purple crisis`, que clima
   ya aplica en `cascada/shared.tsx:61-64`. Mi argumento de "no tiene carga de
   estado" era falso.
3. `PremiumButton.tsx:67-74` ya usa violeta sólido para `SecondaryButton`, avalado
   por `.claude/rules/frontend-design.md`. El acento colisionaría con el CTA.

**Propuesta que reemplaza:** ningún color protagonista. Chrome canónico idéntico
al resto de clima, distinción por estructura (§F3.2). Sostiene el Mandamiento 7
(`SKILL.md:152`, "Mismo problema = misma solución visual") y no crea el primer
precedente de identidad cromática por pantalla en el módulo.

**Aprobado por Victor 2026-08-03.** Es lo que implementa F3.

---

## Qué NO se toca

`ClimaPlanDeptTab.tsx` (Tab 1) · `ClimaPlanPersonaTab.tsx` (Tab 2) ·
`ClimaAtacarCausaScreen.tsx` · `ClimaPlanesView.tsx` ·
`ClimaActionLogService.ts` · `ActionEffectivenessService.ts` ·
`ClimaInterventionDictionary.ts` · `middleware.ts` · `prisma/schema.prisma`.
