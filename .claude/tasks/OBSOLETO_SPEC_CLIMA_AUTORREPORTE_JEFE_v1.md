# SPEC — Autorreporte del jefe (cierre del circuito 5C)

**Estado:** listo para construir. Gate 0 cerrado con evidencia file:line.
**Ubicación sugerida:** `.claude/tasks/SPEC_CLIMA_AUTORREPORTE_JEFE_v1.md`

---

## 0. El problema, en una frase

Al aprobar un plan de clima, el sistema crea una fila de bitácora vacía por
cada hallazgo aceptado y agenda un correo al responsable a los 30 días. Pero
no existe ninguna vía para escribir en esa fila. `ActionEffectivenessService`
lee ese campo para decidir si hubo ejecución, así que hoy todo departamento
quedaría clasificado como que no hizo nada.

Este gate cierra ese circuito.

---

## 1. Estado verificado (Gate 0, no re-investigar)

| Hecho | Evidencia |
|---|---|
| `ClimaActionLog` existe con todos los campos | `prisma/schema.prisma:4075-4098` |
| Las filas se crean al aprobar, con `actionText: null` | `ClimaActionLogService.ts:64-75` |
| Unicidad por `(actionPlanId, triggerRef)` | `schema.prisma`, mismo modelo |
| El motor de efectividad lee `actionText` | `ActionEffectivenessService.ts:62-63` |
| El veredicto se escribe en la misma fila | `ActionEffectivenessService.ts:116-125` |
| NO existe `/api/clima/action-log` | `ls src/app/api/clima/` |
| NO existe `ClimaActionLogEntry` | verificado en schema |
| El correo ya se encola, apunta a `/dashboard/clima` | `ClimaActionLogService.ts:134-157` |
| `clima:view` incluye AREA_MANAGER; `clima:manage` no | `permissions.ts:625-641` |
| `resolveDepartmentResponsable` sellado (walk-up + fallback) | `DepartmentResponsableService.ts:37-88` |
| Molde de propiedad: comparar FK del recurso contra el actor | `pdi/generate-suggestion/route.ts:65-70` |
| `userContext.employeeId` disponible (Etapa 1 vínculo, `c1e08e6`) | `extractUserContext` |
| Tab 2: `pdiEnabled=false` hardcodeado | `ClimaPlanPersonaTab.tsx:194` |
| `by-person` recalcula, no lee `ActionPlan` | `by-person/route.ts:107-126` |

---

## 2. Decisiones cerradas (no reabrir)

1. **No hay pantalla nueva.** El campo de autorreporte vive en la card del
   hallazgo de Tab 1, que ya existe. El filtrado jerárquico define qué ve
   cada rol. Esto ya estaba previsto en la semilla original de Gate 5D.
2. **Acceso con sesión.** El jefe entra con su usuario, el mismo de
   desempeño. Sin link mágico, sin acceso paralelo.
3. **Múltiples entradas por hallazgo.** Tabla hija; el campo `actionText`
   queda como espejo de la entrada más reciente.
4. **La propiedad manda sobre el rol.** El permiso deja entrar al módulo;
   escribir el autorreporte requiere ser el responsable resuelto de ese
   departamento, verificado en el servidor.
5. **El jefe nunca ve la mecánica.** Sin veredicto, sin cuadrante, sin
   explicar cómo se evalúa, sin advertencias por no escribir. Capturar
   solamente.
6. **Sin fecha límite, sin mínimo, sin obligación.**

---

## 3. Lo que NO se toca

- `ActionEffectivenessService` (ni una línea: sigue leyendo `actionText`).
- `ClimaActionLogService.onClimaPlanApproved`, salvo el `action_url` (P6).
- `DepartmentResponsableService`.
- `resolveDepartmentResponsable`, `getChildDepartmentIds`.
- El camino de meta de Tab 2, sellado en 5D-ii.
- El proyecto del vínculo `Employee` con `User` (etapas propias, backfill
  diferido a cliente real).
- `PDISuggestionEngine` y `clima-competency-mapping` (camino descartado).

---

## 4. Piezas

### P1 — Modelo `ClimaActionLogEntry` (aditivo puro)

```prisma
model ClimaActionLogEntry {
  id               String   @id @default(cuid())
  accountId        String   @map("account_id")
  climaActionLogId String   @map("clima_action_log_id")
  text             String   @db.VarChar(200)
  createdAt        DateTime @default(now()) @map("created_at")
  createdBy        String?  @map("created_by")   // Employee.id del autor

  climaActionLog   ClimaActionLog @relation(fields: [climaActionLogId], references: [id], onDelete: Cascade)

  @@index([accountId, climaActionLogId])
  @@map("clima_action_log_entries")
}
```

Back-reference en `ClimaActionLog`. `db push` (nunca `migrate dev`).

**Cero cambios a `ClimaActionLog`.** El campo `actionText` se mantiene y pasa
a reflejar la entrada más reciente, sincronizado por el servicio de escritura.

**Sello:** `tsc` limpio, `db push` aplicado, back-reference presente.

---

### P2 — `POST /api/clima/action-log`

Skill obligatoria antes de escribir: `focalizahr-api`.

**Contrato:**
```
body: { climaActionLogId: string, text: string }
200:  { success: true, data: { entry, entriesCount } }
```

**Secuencia (patrón de 3 capas + propiedad):**

1. `extractUserContext(request)`. Sin `accountId` → 401.
2. `hasPermission(role, 'clima:action-log:write')` → 403 si no.
3. Cargar el `ClimaActionLog` por id **con `accountId` en el where**.
   No existe → 404. La fila nace solo al aprobar un plan: si no existe,
   la decisión no fue aceptada y no corresponde escribir.
4. **Guard de propiedad:**
   ```
   resolveDepartmentResponsable({ departmentId: log.departmentId, accountId })
   ```
   Si `source !== 'responsable'` → 403.
   Si `responsable.employeeId !== userContext.employeeId` → 403.
   Si `userContext.employeeId` es null → 403 con mensaje honesto (el vínculo
   con la ficha de empleado no está poblado; es esperado hasta el backfill).

   Nunca resolver la identidad por email. Regla vigente del proyecto.
5. Validar `text`: `trim().length > 0` y `<= 200`. Rechazo con mensaje claro,
   nunca error crudo de Prisma.
6. En una transacción: crear la `Entry` y actualizar en la fila padre
   `actionText` con el mismo texto, `registeredAt = now()` y
   `registeredBy = userContext.employeeId`.

   > **Corrección §P2-6 (Victor, 2026-07-31):** el espejo del padre refleja la
   > entrada más reciente COMPLETA, no solo el texto. Por eso `registeredBy`
   > también se sincroniza con el `employeeId` del autor, junto a `actionText`
   > y `registeredAt`. (La redacción original nombraba solo `actionText` +
   > `registeredAt`.)

**Sello:** smoke contra el handler real con evidencia leída de vuelta desde la
base: entrada creada, espejo sincronizado, 403 con un responsable ajeno, 403
con `employeeId` null, 400 con texto vacío y con 201 caracteres, y 404 con un
log de otra cuenta. Borrar el smoke al sellar.

---

### P3 — Permiso

En `permissions.ts`, junto a los de clima:

```
'clima:action-log:write': [
  FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, HR_OPERATOR,
  CEO, AREA_MANAGER
]
```

Amplio a propósito: **el permiso solo abre la puerta; el guard de propiedad
del P2 es la protección real.** Un rol global con el permiso igual recibe 403
si no es el responsable de ese departamento.

No se toca `clima:manage` (aprobar planes es otra capacidad y sigue siendo
solo de RRHH).

**Sello:** `hasPermission` verificado por rol, sin arrays hardcodeados en
ningún endpoint.

---

### P4 — Campo de autorreporte en la card del hallazgo

Skill obligatoria antes de escribir: `focalizahr-design` (Gate 0 de la skill
ya cubierto por este spec: no es pantalla nueva, es un bloque dentro de un
componente existente).

**No se despliega sin P5.** Ver la dependencia dura en la sección 5.

**Dónde:** dentro de la card de decisión de Tab 1 (`ClimaDecisionCard` o el
componente equivalente que Code confirme), debajo del contenido ya existente.

El AREA_MANAGER entra a la misma ruta y ve el mismo componente que RRHH
(verificado: `/dashboard/clima` renderiza un solo orquestador, el middleware
solo restringe a EVALUATOR). Por eso no hace falta pantalla nueva: lo que
cambia es el alcance, que lo da P5, y si el campo aparece, que lo dan las
tres condiciones de abajo.

**Visible solo si** las tres cosas se cumplen:
- el plan está aprobado,
- la decisión fue aceptada o modificada,
- el usuario es el responsable resuelto de ese departamento.

En cualquier otro caso el bloque no se renderiza. Sin candado, sin mensaje de
bloqueo, sin explicación: simplemente no está.

**Contenido del bloque:**
- Las entradas anteriores, más reciente arriba, con fecha. Se muestran hasta
  3; si hay más, "Ver todas".
- Un campo de texto con contador de 200.
- Un botón. El verbo nombra el resultado, nunca la operación
  (`Guardar`, `Confirmar` y `Enviar` están prohibidos por el diccionario de
  verbos de la skill). Propuesta: **"Registrar lo que hice"**, a validar con
  Victor.

**Comportamiento:**
- Botón deshabilitado con el campo vacío.
- Al enviar: espera real del servidor, sin confirmación optimista.
- Éxito: la entrada aparece arriba del historial y el campo se limpia.
- Error: el texto escrito **no se pierde** y se puede reintentar.
- Si hay más de un hallazgo con campo visible en la misma vista, el texto sin
  enviar de cada campo se mantiene en memoria mientras el jefe navega entre
  cards de la misma sesión. No se pierde por scrollear a otra card sin haber
  tocado el botón. En memoria del componente solamente: nunca en
  `localStorage` ni `sessionStorage` (es texto sobre personas del equipo, y
  además el almacenamiento del navegador no se usa en esta plataforma).
- Sin avance automático a otro hallazgo. Sin pantalla de cierre. Sin
  contadores de pendientes. Sin advertencia al salir.

**Prohibido en este bloque:** cualquier veredicto, cuadrante, semáforo, score,
porcentaje o mención de cómo se evalúa la efectividad.

**Sello:** visto en pantalla por Victor en 320px y en escritorio, con un
hallazgo sin entradas y con uno que ya tiene varias.

---

### P5 — Filtrado jerárquico sobre las decisiones del plan

**El riesgo:** el `ActionPlan` es una sola fila con las decisiones de todos
los departamentos en un JSON, y el endpoint que lo entrega no filtra por
departamento. Un AREA_MANAGER podría recibir las decisiones de toda la
empresa.

**Verificar primero** (parte del trabajo, no gate aparte): si
`GET /api/action-plans` y `GET /api/action-plans/[planId]` aplican filtrado
jerárquico sobre el contenido de `decisiones`.

**Si no lo aplican:** filtrar en el servidor, nunca en el cliente.
- Roles globales: sin filtro adicional.
- AREA_MANAGER: `getChildDepartmentIds(userContext.departmentId)` más su
  propio departamento; se devuelven solo las decisiones cuyo `departmentId`
  caiga en ese conjunto.
- Sin `departmentId` en el contexto: no devolver nada. **Fail-closed.**
  (Existe un antecedente de fail-open en `GET /api/goals` con este mismo
  patrón. No repetirlo acá.)

**Sello:** smoke con un AREA_MANAGER real que confirme que recibe solo su
subárbol, y que sin `departmentId` recibe vacío.

---

### P6 — Destino del recordatorio

`ClimaActionLogService.ts:141-157`: cambiar el `action_url` para que lleve al
jefe a la vista donde está su hallazgo, no a la portada de la torre de RRHH.

Es un cambio de una línea, pero sin él el correo que ya se está encolando en
cada aprobación sigue aterrizando en el lugar equivocado.

**Sello:** un mensaje encolado en la cola real con la URL correcta.

---

### P7 — Tab 2: "Atacar la causa" (vista de revisión de RRHH)

**Definido, no pendiente.** Este botón es de RRHH y CEO. El jefe nunca entra
acá: Tab 2 vive detrás de `clima:manage`, que no incluye a AREA_MANAGER.

El botón deja de estar gateado y abre una **vista de revisión**: qué
hallazgos aprobados tiene ese responsable y en qué estado está su bitácora.
Con la opción de sacar un caso por excepción.

**No asigna nada.** La asignación ya ocurre automáticamente al aprobar en
Tab 1, junto con la creación de la fila de bitácora y el encolado del
recordatorio.

Quitar el `pdiEnabled=false` hardcodeado (`ClimaPlanPersonaTab.tsx:194`) y su
tooltip.

**No bloquea P1 a P6.** Se construye después: revisar el estado de las
bitácoras solo tiene sentido cuando ya se pueden escribir.

---

## 5. Orden de construcción

```
P1 (modelo)  →  P2 (endpoint)  →  P3 (permiso)
                                       ↓
                          P4 (campo) + P5 (filtrado)
                          se construyen y despliegan JUNTOS
                                       ↓
                              P6 (correo)  →  P7 (Tab 2)
```

### Dependencia dura P4 con P5

**P4 y P5 son una sola entrega. Nunca se despliega P4 sin P5.**

Razón: hoy el plan de acción es una sola fila con las decisiones de todos los
departamentos en un JSON, y el endpoint que la entrega no filtra por
departamento. Si el campo de escritura sale antes que el filtro, un jefe
abriría Tab 1 y vería los hallazgos de toda la empresa, con el campo activo
sobre lo que le corresponde y a la vista lo que no.

El guard de propiedad del P2 protege la escritura, pero no la lectura. El
filtro es lo único que impide que un jefe lea el clima de departamentos
ajenos.

Operativamente: mismo gate, y si van en commits separados, P5 va primero y
ninguno se pushea hasta que los dos estén verificados. El smoke de sello se
corre sobre los dos juntos, con un AREA_MANAGER real.

P6 es independiente y puede ir en cualquier momento después de P4.

Commits separados para código y documentación. `git status --stat` antes de
cada commit (hay sesiones paralelas sobre el mismo repo). `git add` archivo
por archivo. Code no pushea.

---

## 6. Deuda que este gate deja anotada, no resuelve

- **Umbral de comentarios de texto abierto.** Cuando Gate 6 habilite el
  procesamiento de respuestas abiertas de clima, decidir si usan el mismo
  piso de 5 que los puntajes o uno más alto. La referencia de la industria
  es 7 u 8 para texto libre, por el riesgo de identificación indirecta.
  Referencia de gating en el repo: `ComplianceAnalysisOrchestrator.ts:192`.
- **Caché de `getChildDepartmentIds`.** `invalidateDepartmentCache` no tiene
  call-sites de producción: reparentar un departamento puede tardar hasta
  15 minutos en reflejarse en el filtrado.
- **`sourceTriggerRef` de las metas de clima** guarda el slug del reactivo,
  mientras `ClimaActionLog.triggerRef` guarda `clima:{departamento}:{dimensión}`.
  No comparten llave: si algún día hay que cruzar metas con bitácora, hace
  falta resolverlo.
- **Endpoint `/api/clima/pdi-suggestion`** escribe sobre planes no-DRAFT sin
  guard de estado. Latente, ninguna UI lo llama.
