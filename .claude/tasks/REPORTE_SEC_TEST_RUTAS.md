# Reporte de Seguridad — Mapa de rutas `/api/test/`

**Para:** Arquitectura · **Fecha:** 2026-07-01 · **Tipo:** Investigación read-only (sin cambios de código)
**Propósito:** insumo para la spec de "limpieza de rutas de test" (decisión: eliminar `/api/test/` completo vs. bloquearlo en producción, antes del primer cliente).
**Método:** enumeración vía glob de `src/app/api/test/**` + grep de referencias en todo el repo. Verificado contra código actual.

## Resumen ejecutivo

`/api/test/` contiene **2 endpoints, ambos `GET`, ambos huérfanos** (ninguna referencia en el código del repo). **Ninguno** valida rol ni `accountId`. El middleware exige JWT (no son anónimos), pero cualquier usuario autenticado de cualquier cuenta los alcanza. El riesgo real se concentra en **uno**: una **fuga cross-tenant de lectura**. Al ser huérfanos, eliminarlos no rompe dependencias (misma condición verificada al cerrar la ruta `_ELIMINAR`, commit `635d67c`).

| Endpoint | Método | RBAC/accountId | Datos reales | Huérfano | Riesgo |
|---|---|---|---|---|---|
| `/api/test` | GET | ❌ ninguno | ❌ no toca BD | ✅ | 🟢 bajo (leak de stack trace) |
| `/api/test/participants` | GET | ❌ ninguno | 🔴 sí (cross-tenant) | ✅ | 🔴 fuga de lectura |

## Contexto de middleware (aplica a ambos)

Ambas rutas están bajo `/api`, por lo que `middleware.ts:129-131` **exige un JWT válido** para alcanzarlas. Pero **ninguna** tiene chequeo de rol ni de `accountId` en su handler → autenticado-only, sin scoping de tenant ni de rol.

## Hallazgo 1 — `src/app/api/test/route.ts` · 🟢 inocuo

- **Método:** `GET` (`:5`), único.
- **Función:** self-test de `generateUniqueToken` (import `:3`). Genera 5 tokens (`:19-23`), verifica unicidad/formato (`:26-36`), devuelve *previews* de 16 chars (`:28`) + metadata (`:38-48`).
- **RBAC/accountId:** ninguno.
- **Exposición de datos:** ninguna real — no accede a BD. Único leak: **stack trace** en el catch (`:56`, `details: error.stack`).
- **Referencias:** ninguna (solo su cabecera `:1`). **Huérfano.**

## Hallazgo 2 — `src/app/api/test/participants/route.ts` · 🔴 fuga cross-tenant (lectura)

- **Método:** `GET` (`:6`), único.
- **Función:** self-test del flujo de participantes. Genera 2 tokens (`:11-12`), busca una campaña, arma participantes mock, devuelve diagnóstico.
- **RBAC/accountId:** ninguno.
- **Exposición de datos:** 🔴 **sí.**
  - `:18` — `prisma.campaign.findFirst({ where: { status: 'draft' }, include: { account: true } })` — **sin filtro de `accountId`**: devuelve la **primera campaña draft de cualquier cuenta** con el **objeto `account` completo**.
  - `:72-76` — retorna `id/name/status` de esa campaña de otro tenant.
  - **Read-only:** el `participantsToInsert` mock (`:50-60`) se arma pero **nunca se persiste** (no hay `create`/`createMany`).
  - Leak adicional: **stack trace** en el catch (`:93`).
- **Referencias:** ninguna (solo su cabecera `:1`). **Huérfano.**

## Notas para la decisión

- **Alcance cerrado:** son exactamente 2 rutas; no hay subrutas ocultas bajo `/api/test/`.
- **Sin dependencias:** las únicas menciones de `api/test` en el repo son las cabeceras de los propios archivos y el registro de este hallazgo en `BACKLOG_ENTERPRISE.md` (ítem SEC-TEST). Cero `fetch`/`import`/link → borrarlos no afecta nada.
- **Adyacente (fuera de alcance de este reporte, para conciencia):** existen páginas UI dev/test ruteables — `dashboard/DD_PREV`, `dashboard/pruebas`, `dashboard/succession-demo`, `dashboard/test-exit-metrics` (auth-gated), y `src/app/test`, `src/app/test-analytics` (raíz, **sin auth**). Son `page.tsx`, no exponen datos por sí solas.
- **Sin recomendación de fix:** este reporte mapea; la acción (eliminar vs. bloquear en prod) la define la spec de Arquitectura.

**Trazabilidad:** ítem `SEC-TEST` en `.claude/tasks/BACKLOG_ENTERPRISE.md` (commit `2df9a70`), marcado *pendiente de decisión de Arquitectura*.
