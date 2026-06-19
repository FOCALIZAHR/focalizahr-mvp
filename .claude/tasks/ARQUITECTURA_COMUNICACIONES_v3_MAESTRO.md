# ARQUITECTURA SISTEMA DE COMUNICACIONES MULTI-CANAL v3.0
## FocalizaHR: Email + WhatsApp sobre cola unificada
## DOCUMENTO MAESTRO

**Version:** 3.0
**Fecha:** 12 Junio 2026
**Estado:** APROBADO por Victor Samuel Yanez (CEO)
**Reemplaza:** ARQUITECTURA_MULTICANAL v2.3.1 y BRIEFING v2.3.3 (quedan como
referencia historica; este documento manda en todo conflicto)
**Specs ejecutables derivadas:** SPEC_GATE_A_COMUNICACIONES_v3.md (creada),
SPEC_GATE_B a E (se crean al sellar el gate anterior)

---

## 1. OBJETIVOS (identicos a v2.3.1)

| # | Objetivo v2.3.1 | Como lo cumple v3.0 | Gate |
|---|---|---|---|
| 1 | Multi-canal Email + WhatsApp en la misma campania | channel-selector + cola con channel por mensaje | B-C |
| 2 | Escalamiento dinamico (no responde email -> WhatsApp) | Regla lineal post-reminder2 sobre la cola | D |
| 3 | Segmentacion por departamento/cargo/persona | preferredChannel por empleado; ChannelRule diferida hasta demanda real | B (parcial) |
| 4 | Flujos configurables por campania | Diferido: hoy no hay caso de uso; la cola lo soporta a futuro | Futuro |
| 5 | Tracking unificado por canal | UNA tabla CommunicationMessage para todo producto | A |
| 6 | Escalabilidad (estado explicito, no reconstruir desde logs) | status + scheduledAt + retryCount en cada mensaje | A |
| 7 | Comunicaciones ad-hoc (metas, PDF, reconocimientos) | Misma tabla con employeeId/goalId opcionales | E |
| 8 | Canal corporativo completo para el 70% sin email | Regla Cero + consent + onboarding de canal | C |
| 9 | NUEVO: resolver timeout 504 en activacion masiva | activate encola y responde inmediato | A |
| 10 | NUEVO: funcionar en Vercel Hobby HOY | Triple disparador sin crons nuevos | A |

El objetivo 4 (journeys configurables con branching) es el unico que se difiere
deliberadamente: no existe cliente que lo pida y la tabla unificada permite
construirlo encima sin migrar datos cuando exista demanda.

---

## 2. PRINCIPIOS DE DISENO

1. **Outbox pattern:** los mensajes se persisten como PENDING en Postgres y un
   dispatcher los drena. Sobreviven a crashes, son auditables, y el motor de
   envio es reemplazable (Resend/Twilio hoy; worker dedicado a gran escala
   maniana) sin tocar productores ni schema.
2. **Idempotencia en el schema, no en la disciplina:** dedupKey @unique. Un
   productor que corre dos veces no duplica jamas. Leccion del Protocolo 4 v5
   llevada a la base de datos.
3. **Schema-first real:** GATE A instala el 100% del schema de los 5 gates.
   B, C, D y E son solo codigo. Cero migraciones posteriores (unica excepcion
   posible: seccion 7.3).
4. **Event-driven sobre polling donde se pueda:** metas notifican en el momento
   del evento (crear/cerrar), no esperando un cron diario.
5. **Coexistencia, no big bang:** EmailLog y send-reminders v5 intactos hasta
   GATE D. El dispatcher crea EmailLog espejo para invitaciones, asi el cron
   legacy ni se entera del cambio.
6. **No cambiar lo que funciona:** cada gate toca el minimo de codigo legacy.

---

## 3. ARQUITECTURA EN UNA IMAGEN

```
PRODUCTORES (escriben PENDING en communication_messages)
  activate/route.ts ............ invitaciones (GATE A email, GATE B mixto)
  send-reminders + escalacion .. survey-escalation whatsapp (GATE D)
  GoalsService (event-driven) .. goal_assigned, goal_completed (GATE E)
  scheduler at-risk ............ goal_at_risk, goal_progress (GATE E)
  futuros: send-reports, calibracion, notificaciones admin

                    |
                    v
        +---------------------------+
        |  CommunicationMessage     |   UNA tabla: cola + log + auditoria
        |  PENDING -> SENDING ->    |   dedupKey unique = idempotencia
        |  SENT/FAILED (retry x3)   |   referencias opcionales por producto
        +---------------------------+
                    |
                    v
            message-dispatcher  (batch 50, rate limit 600ms,
                    |            anti-solapamiento, retry backoff)
                    |
         channel-selector (Regla Cero + preferredChannel + consent)
              /            \
             v              v
        email-service    whatsapp-service
        (Resend,         (Twilio: simulation -> sandbox -> production,
         Protocolos v5)   retry backoff, costo por env var)

DISPARO DEL DISPATCHER (triple capa, compatible Vercel Hobby):
  1. Inmediato: waitUntil post-encolado en activate
  2. Encadenado: el dispatcher se auto-invoca mientras queden PENDING (max 15)
  3. Red de seguridad: scheduler externo gratuito cada 5 min
     (cron-job.org / GitHub Actions) -> al migrar a Vercel Pro se reemplaza
     por una linea en vercel.json, cero refactor

ENTRADA (GATE C):
  webhook Twilio firmado -> consent, captura de email personal,
  delivered/read -> deliveredAt en CommunicationMessage
```

---

## 4. SCHEMA COMPLETO (se instala integro en GATE A)

### 4.1 Enums

```prisma
enum MessageChannel {
  EMAIL
  WHATSAPP
}

enum MessageStatus {
  PENDING
  SENDING
  SENT
  DELIVERED
  FAILED
  CANCELLED
}
```

### 4.2 CommunicationMessage

```prisma
model CommunicationMessage {
  id            String   @id @default(cuid())
  accountId     String   @map("account_id")

  channel       MessageChannel
  templateSlug  String   @map("template_slug")
  variables     Json?

  toEmail       String?  @map("to_email")
  toPhone       String?  @map("to_phone")

  participantId String?  @map("participant_id")
  employeeId    String?  @map("employee_id")
  campaignId    String?  @map("campaign_id")
  goalId        String?  @map("goal_id")
  messageType   String   @map("message_type")

  status        MessageStatus @default(PENDING)
  scheduledAt   DateTime @default(now()) @map("scheduled_at")
  sentAt        DateTime? @map("sent_at")
  deliveredAt   DateTime? @map("delivered_at")
  failedAt      DateTime? @map("failed_at")
  retryCount    Int      @default(0) @map("retry_count")
  errorMessage  String?  @map("error_message")
  providerId    String?  @map("provider_id")
  costUsd       Decimal? @map("cost_usd") @db.Decimal(10, 6)

  dedupKey      String?  @unique @map("dedup_key")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  account       Account      @relation(fields: [accountId], references: [id])
  participant   Participant? @relation(fields: [participantId], references: [id])
  campaign      Campaign?    @relation(fields: [campaignId], references: [id])
  employee      Employee?    @relation(fields: [employeeId], references: [id])

  @@index([status, scheduledAt], map: "idx_message_dispatcher")
  @@index([campaignId, channel, status])
  @@index([accountId, createdAt])
  @@index([providerId])
  @@map("communication_messages")
}
```

Convencion dedupKey por tipo:
```
invitation:{participantId}
reminder1:{participantId}            (solo si algun dia migra de v5)
survey-escalation:{participantId}
goal_assigned:{goalId}
goal_completed:{goalId}
goal_at_risk:{goalId}:{yyyy-ww}      (semana ISO: max 1 alerta por semana)
goal_progress:{goalId}:{yyyy-ww}
channel-onboarding:{employeeId}
```

### 4.3 Employee (campos nuevos)

```prisma
  preferredChannel      String?   @map("preferred_channel")        // 'email' | 'whatsapp'
  personalEmail         String?   @map("personal_email")
  channelConsentAt      DateTime? @map("channel_consent_at")
  channelConsentMethod  String?   @map("channel_consent_method")   // 'whatsapp_button' | 'whatsapp_text' | 'employer_proxy'
  awaitingEmailCapture  Boolean   @default(false) @map("awaiting_email_capture")
```
Mas indice en phoneNumber si no existe, y relaciones inversas en Account,
Campaign, Participant, Employee.

### 4.4 Lo que NO se crea (diferido con criterio de activacion)

| Tabla v2.3.1 | Estado | Se construye cuando |
|---|---|---|
| CommunicationJourney/Step/State | Diferida | Un cliente pague por flujos configurables |
| CorporateCommunication | Eliminada | Nunca: CommunicationMessage la absorbe |
| ChannelRule | Diferida | Un cliente pida forzar WhatsApp a grupos CON email |

---

## 5. SERVICIOS (vista completa; detalle ejecutable en cada spec)

| Servicio | Archivo | Gate | Rol |
|---|---|---|---|
| email-service | src/lib/services/email-service.ts | A | Envio Resend con Protocolos 1-3 v5, extraido de activate |
| channel-selector | src/lib/services/channel-selector.ts | A | Funcion pura: preferredChannel+consent -> email -> whatsapp -> none. JAMAS throw |
| message-dispatcher | src/lib/services/message-dispatcher.ts | A | Drena la cola: batch 50, anti-solapamiento via updateMany condicional, retry backoff 1/5/15 min, alerta >50% fallos |
| whatsapp-service | src/lib/services/whatsapp-service.ts | B | Twilio Content API, modos simulation/sandbox/production, retry 1s/2s/4s, costo via env var |
| whatsapp-templates | src/lib/templates/whatsapp-templates.ts | B | Templates con contentSid (placeholder hasta aprobacion Meta) |

Endpoints:

| Endpoint | Gate | Notas |
|---|---|---|
| GET /api/cron/message-dispatcher | A | CRON_SECRET + encadenamiento con tope 15 |
| GET /api/admin/communication-health | A | Stats por status/canal, scoping skill focalizahr-api |
| POST /api/admin/force-dispatcher | A | Solo FOCALIZAHR_ADMIN, boton de emergencia |
| POST /api/webhooks/twilio | C | Firma Twilio OBLIGATORIA + manejo multi-tenant |

---

## 6. REGLA CERO Y CONSENT (definicion canonica)

```
determineChannel(ctx):
  1. preferredChannel explicito + channelConsentAt presente
     -> respetar la eleccion del empleado (si el canal tiene dato valido)
  2. email valido (corporativo, o personalEmail) -> EMAIL
  3. phone valido -> WHATSAPP
  4. nada -> NONE (reportar, jamas throw)
```

Politica de primer contacto WhatsApp (GATE C, requisito Meta):
- El PRIMER mensaje a un empleado que nunca interactuo es SIEMPRE el template
  channel-onboarding aprobado por Meta. Nunca contenido directo.
- DECISION DE NEGOCIO ABIERTA (la toma Victor antes de GATE C):
  a) Consent proxy: el contrato con el cliente B2B documenta la autorizacion
     para contactar a su dotacion -> channelConsentMethod 'employer_proxy'
  b) Opt-in individual: nada se envia hasta que el empleado responde el
     onboarding de canal
- En cualquier caso el empleado puede responder y elegir email personal
  (flujo awaitingEmailCapture del webhook).

---

## 7. PLAN POR GATES

### GATE A: Nucleo (cola + dispatcher email-only)
Spec: SPEC_GATE_A_COMUNICACIONES_v3.md (lista)
Mata el 504, instala el 100% del schema, no toca send-reminders.
Done: 8 verificaciones definidas en la spec.

### GATE B: WhatsApp en simulation
- channel-selector activo en activate: participantes sin email encolan
  WHATSAPP con TWILIO_MODE=simulation (log, sin envio real)
- whatsapp-service + whatsapp-templates (contentSid placeholder)
- Response de activacion con breakdown {email, whatsapp, sinContacto}
- npm install twilio
Investigacion previa de Code: de donde sale el phone en activacion
(Participant.phoneNumber existe con indice; definir prioridad
Participant.phoneNumber vs Employee.phoneNumber cuando ambos existen).
Done: campania mixta de prueba encola ambos canales; los WHATSAPP quedan
SENT en simulation con log [WhatsApp SIMULATION]; los EMAIL llegan real.

### GATE C: Twilio real + consent + webhook
- Cuenta Twilio + WhatsApp sandbox; templates enviados a aprobacion Meta
- TWILIO_MODE=sandbox: prueba con el numero personal de Victor
- Webhook POST /api/webhooks/twilio:
  - Validacion de firma twilio.validateRequest OBLIGATORIA (sin esto no se
    despliega)
  - Multi-tenant: lookup por phone puede colisionar entre cuentas con un
    numero Twilio compartido. Mitigacion fase 1: si hay mas de un Employee
    match cross-account, loguear y NO escribir. Si la colision resulta
    frecuente: unica migracion adicional posible del proyecto, tabla
    WhatsAppConversation {phone, accountId, lastMessageAt} para enrutar
  - Botones: consent whatsapp / pedir email / captura email con validacion
  - Status callbacks de Twilio: delivered/read -> deliveredAt del mensaje
    (via providerId, por eso el indice)
- Decision de negocio de consent (seccion 6) tomada antes de iniciar
Done: WhatsApp real recibido; consent persiste en Employee; firma invalida
retorna 403; email invalido en captura repregunta.

### GATE D: Escalacion + Exit sin email
- Extension a send-reminders (primera y unica modificacion al legacy):
  participante con reminderCount >= 2, sin respuesta N dias post-reminder2
  (default 3, configurable), con phone y consent valido -> encolar
  survey-escalation WHATSAPP con dedupKey. ~15 lineas
- Exit Intelligence sin email corporativo: ya cubierto por Regla Cero en
  GATE B; aqui se valida formalmente con una campania exit de prueba
- Activacion del scheduler externo como red de seguridad permanente
Done: escalacion dispara una sola vez por participante (doble ejecucion del
cron = cero duplicados); campania exit con participantes solo-phone completa
el ciclo.

### GATE E: Metas y ad-hoc
- Event-driven (sin cron): cascadeGoal/createManagerGoal con meta INDIVIDUAL
  -> encolar goal_assigned en el momento; approveClosure -> goal_completed
- Polling minimo: goal_at_risk y goal_progress semanal via scheduler externo
  (o vercel.json al tener Pro), con dedupKey semanal
- Los 4 metodos de consulta de GoalsService del doc v2.3.1 (seccion 10.1)
  se reutilizan tal cual estaban: ese diseno era correcto
Done: crear meta INDIVIDUAL -> mensaje en cola < 1 min; aprobar cierre ->
goal_completed; doble corrida del at-risk semanal -> cero duplicados.

### POST-GATES (backlog ordenado, no comprometido)
1. Migrar send-reports/send-alerts/calibracion a la cola (hoy envian directo)
2. Webhook Resend real: firma + delivered/opened -> CommunicationMessage
3. UI admin de comunicaciones (Cinema Mode, skill focalizahr-design)
4. Deprecar EmailLog cuando todos los productores usen la cola
5. ChannelRule y/o journeys configurables si aparece demanda de cliente

---

## 8. INFRAESTRUCTURA Y MIGRACION A VERCEL PRO

HOY (Hobby, 2 crons ocupados por send-reminders y aggregation):
- Dispatcher disparado por waitUntil + encadenamiento + scheduler externo
- maxDuration al limite real del plan (Code lo verifica, NO asumir 800)

AL MIGRAR A PRO:
- Agregar a vercel.json: message-dispatcher cada 5 min
- Apagar scheduler externo (o dejarlo como redundancia)
- Subir maxDuration y opcionalmente BATCH_SIZE
- Cero cambios de codigo: solo configuracion

---

## 9. VARIABLES DE ENTORNO (consolidado)

```bash
# Existentes (sin cambios)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
NEXT_PUBLIC_BASE_URL=

# GATE B+
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
TWILIO_MODE=simulation          # simulation | sandbox | production
WHATSAPP_COST_USD=0.0087        # nunca hardcodear costo (Protocolo 3)

# GATE C+
TWILIO_WEBHOOK_VALIDATE=true
```

---

## 10. COMPARACION FINAL v2.3.1 vs v3.0

| Dimension | v2.3.1 | v3.0 |
|---|---|---|
| Tablas nuevas | 6 | 1 |
| Enums nuevos | 7 | 2 |
| Crons Vercel nuevos | 4 (2 de ellos */5 min) | 0 |
| Funciona en Vercel Hobby | No (exige Pro) | Si |
| Timeout 504 campanias legacy | Sin resolver | Resuelto para TODAS en GATE A |
| Idempotencia | Por disciplina de codigo | dedupKey unique en BD |
| Retry | Sin definir | Backoff 1/5/15 min, x3 |
| Tracking | 4 tablas (EmailLog, EmailAutomation, CommunicationLog, CorporateCommunication) | 1 tabla + EmailLog legacy en coexistencia |
| Metas | Cron diario polling | Event-driven + polling semanal minimo |
| Webhook Twilio | Sin firma, sin scoping tenant | Firma obligatoria + manejo colision multi-tenant |
| Consent | Capturado pero ignorado por el selector | Primera prioridad del selector |
| Migraciones totales del proyecto | 1 grande + correcciones inevitables | 1 (GATE A) + 1 posible (7.3 GATE C) |

---

## 11. WORKFLOW DE EJECUCION

```
1. Victor aprueba este maestro
2. Por cada gate:
   a. Claude chat escribe/actualiza la SPEC del gate (GATE A ya existe)
   b. Victor la guarda en .claude/tasks/
   c. Code en MODO PLAN: lee spec + skills, investiga el repo real,
      presenta plan con las decisiones abiertas resueltas
   d. Victor aprueba el plan de Code
   e. Code implementa
   f. Verificacion del DONE del gate (criterios en cada spec)
   g. Gate sellado. Hallazgos nuevos se anotan para gates siguientes,
      NUNCA reabren el gate actual
3. Push a main solo a peticion explicita de Victor
```

---

## Estado de Gates

- **GATE A** — SELLADO 8/8 — commit `1f0299f` — (+ SSOT remitente)
- **GATE B** — SELLADO 8/8 — commit `448d810` — 2026-06-19 — WhatsApp simulation +
  resolucion telefono multi-estrategia + breakdown 3 canales. Performance NO conectado
  a la cola (sigue por ruta legacy `admin/performance-cycles/[id]`); B5 vivo diferido a
  backlog, obligatorio antes de integrar Performance a la cola en Gate D/E.
- **GATE C** — pendiente — Twilio real + sandbox + webhook firmado + consent + captura opt-in

---

FIN DEL DOCUMENTO MAESTRO v3.0
