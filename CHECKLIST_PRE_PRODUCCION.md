# Checklist Pre-Producción — FocalizaHR

> Items que DEBEN resolverse antes de (o al momento de) pasar a producción real.
> Versionado a propósito (no en `.claude/tasks`, que está gitignored).

## Infraestructura / Vercel

- [ ] **Capa 3 del dispatcher (trigger periódico de retries).** Al activar Vercel Pro:
  agregar el cron del `message-dispatcher` a `vercel.json`:
  ```json
  { "path": "/api/cron/message-dispatcher", "schedule": "*/5 * * * *" }
  ```
  Sin esto, las retries programadas (`scheduledAt` futuro) **no se disparan** — quedan inertes.
  En Vercel Hobby NO se puede (un cron `*/5` hace fallar el deploy). El endpoint ya valida
  `Authorization: Bearer CRON_SECRET`. Ver comentario `CAPA 3 PENDIENTE` en
  `src/app/api/cron/message-dispatcher/route.ts` y P6 del smoke test Gate A.

- [ ] **Remitente de correo (SSOT).** Confirmar en Vercel
  `RESEND_FROM_EMAIL = FocalizaHR <noreply@focalizahr.cl>` y borrar la env var huérfana
  `FROM_EMAIL` (nadie la lee). El fallback del helper ya cubre, pero completa el SSOT en
  el entorno. Ver `src/lib/constants/email-sender.ts`.
