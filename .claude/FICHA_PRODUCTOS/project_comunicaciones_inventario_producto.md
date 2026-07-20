---
name: project_comunicaciones_inventario_producto
description: "Inventario de producto del módulo Comunicaciones 3.0 FocalizaHR — cola unificada multicanal email/WhatsApp, dispatcher resiliente, consent, gates A-E. Infraestructura headless. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Comunicaciones 3.0 mapeado como producto, 2026-06-25. Read-only, file:line abajo. Columna vertebral de envíos multicanal de toda la plataforma. Infraestructura headless (monitoreo solo API). Arquitectura gates A→E: A/B/C SELLADOS, D spec, E diseño.

**7 CAPACIDADES:**
1. Cola unificada CommunicationMessage (schema:3788) — 6 estados PENDING/SENDING/SENT/DELIVERED/FAILED/CANCELLED, channel EMAIL/WHATSAPP, templateSlug/variables, toEmail/toPhone snapshot, correlación participant/employee/campaign/goal, providerId (nexo Twilio/Resend), costUsd, dedupKey unique idempotencia. Índices status+scheduledAt/providerId/campaignId+channel+status.
2. Dispatcher resiliente message-dispatcher.ts (318 líneas) — batch 50, claim atómico (UPDATE WHERE status=PENDING), crash recovery (SENDING>10min→PENDING), retry backoff 60s/300s/900s→FAILED, rate limit 600ms. Triple disparo: Capa1 waitUntil activate, Capa2 auto-encadena ≤15, Capa3 scheduler externo PENDIENTE.
3. Channel-selector.ts (97 líneas) — Regla Cero determineChannel email>whatsapp>none, NUNCA lanza (none si sin contacto). Respeta preferredChannel+channelConsentAt. Email regex, phone E.164 lax.
4. resolvePhone.ts (225 líneas) 4 estrategias — Participant directo / Employee por id (Ambiente) / 2b Performance evaluationAssignmentId→evaluador (EXCEPCIÓN: nunca cae a nationalId, evita escribir al evaluado) / Employee por nationalId (Onboarding/Exit). Batched cero N+1, isActive:true.
5. whatsapp-service.ts (147 líneas) — TWILIO_MODE simulation(Gate B default, logs sim_)/sandbox/production. Template (contentSid+variables posicionales) o body libre (24h). Retry interno 3x. Webhook bidireccional: status callbacks (delivered/read→deliveredAt) + inbound consent. GOTCHA inbound SmsStatus=received+Body, discrimina por hasUserContent no status.
6. Consent híbrido Gate E.1 — captura WhatsApp: botón WhatsApp→opt-in real whatsapp_button, Email→captura email personal 2 pasos awaitingEmailCapture. Distingue proxy (admin_loaded/imported) vs real (whatsapp_button/text/self_service). Revocación channelOptedOutAt. Webhook multi-tenant detección colisión número. channel-onboarding.ts marca channelConsentRequestedAt.
7. Escalación encuestas survey-escalation.ts (162 líneas, Gate D3) — tras ≥1 reminder sin respuesta + consent WhatsApp, escala email→WhatsApp offset cascada Campaign>Account>default 2d. dedupKey survey-escalation:participantId.

**MODELOS PRISMA (3 + Employee):** CommunicationMessage (3788), EmailAutomation (673 legacy triggers), CommunicationTemplate (596). Employee 8 campos canal (1639-1657): preferredChannel/personalEmail/channelConsentAt/channelConsentMethod/awaitingEmailCapture/channelConsentRequestedAt/channelOptedOutAt/channelOptedOutMethod. Enums MessageChannel/MessageStatus. Todo PERSISTIDO; channel decision + phone resolution DERIVADOS (servicios puros).

**APIs (~6):** GET /api/cron/message-dispatcher (Bearer CRON_SECRET, chain), POST /api/webhooks/twilio (firma HMAC fail-closed, inbound+status), PUT /api/campaigns/[id]/activate (encola+Capa1 waitUntil), GET /api/admin/communication-health (monitor), POST /api/admin/force-dispatcher (emergencia), GET /api/cron/send-reminders (legacy+D3 escalación). RBAC communication:monitor (ADMIN/OWNER/HR_ADMIN/HR_MANAGER), communication:force-dispatch (solo FOCALIZAHR_ADMIN). Servicios: message-dispatcher, whatsapp-service, email-service, channel-selector, resolvePhone, channel-onboarding, survey-escalation. Templates whatsapp-templates.ts (campaign-invitation/channel-onboarding/survey-escalation Meta + request-email libre, variables posicionales buildContentVariables).

**UI: SIN dashboard, monitoreo 100% API (communication-health). Infraestructura headless.**

**ESTADO GATES:** A SELLADO 2026-06-16 (cola+dispatcher+channel-selector+email). B SELLADO 2026-06-20 (WhatsApp simulation+resolvePhone). C SELLADO (Twilio real+webhook firmado+consent, 20/20 smoke+fix discriminador C3). D spec sellado decisiones 1-3, implementación parcial (D3 escalación activo). E diseño abierto (E.1 consent fail-closed core + E.2 cola+stock diferidos).

**DIFERENCIADORES:** (1) multicanal real fallback automático (correo o WhatsApp según contacto+consent, sin manual). (2) resiliencia cola (crash recovery+idempotencia+retry, no pierde ni duplica). (3) consent operable por WhatsApp (opt-in botón auditado). (4) reutilizable todos los productos (Pulso/Experiencia/Onboarding/Exit/Performance/Metas mismo carril).

**BLOQUEADORES GO-LIVE VERIFICADOS:** TWILIO_MODE=simulation default (no envía real hasta production+credenciales Twilio). Aprobación Meta pendiente (survey-escalation contentSid placeholder HX_PENDING). Capa3 scheduler NO cableado (no en vercel.json, retries inertes tras 15 encadenamientos). Copy request-email pendiente Studio IA.

Backbone de [[project_onboarding_inventario_producto]], [[project_exit_inventario_producto]], [[project_performance_inventario_producto]], [[project_metas_inventario_producto]] (encolan invitaciones/recordatorios). Ver [[project_gate_d_implementado]], [[project_gate_e1_spec]], [[project_gate_c_comunicaciones]], [[project_gate_b_comunicaciones]], [[ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR]]. Skill focalizahr-whatsapp-templates.

## Por qué importa (vista comercial)

- **Qué resuelve:** entrega **multicanal real con fallback automático** — correo o WhatsApp según el contacto disponible y el consentimiento vigente, decidido por el sistema y no por alguien revisando una planilla.
- **A quién le importa:** a **RRHH** (la operación de envío deja de ser manual) y al **CEO**, porque la tasa de respuesta de todos los instrumentos depende de que el mensaje efectivamente llegue.
- **Qué ofrece que el mercado no:** la cola es **resiliente de verdad** — recuperación ante caídas, idempotencia y reintentos: no pierde mensajes ni los duplica, que es donde fallan las integraciones caseras.
- **Cumplimiento operable:** el consentimiento se captura y audita **por el propio WhatsApp** (opt-in por botón), no con una casilla en un contrato que nadie puede demostrar después.
- **Economía de plataforma:** el mismo carril sirve a Pulso, Experiencia, Onboarding, Exit, Performance y Metas — se construye una vez y lo usan todos.
