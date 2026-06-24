---
name: focalizahr-whatsapp-templates
description: "Crea, audita y prepara templates WhatsApp Business de FocalizaHR para envío a aprobación Meta. Triggers: 'template WhatsApp', 'plantilla WhatsApp', 'mensaje WhatsApp', 'enviar a Meta', 'aprobación Twilio', 'channel-onboarding', 'survey invitation WhatsApp', 'goal assigned WhatsApp', 'evaluation invitation WhatsApp', 'reminder WhatsApp', cualquier copy de WhatsApp para Pulso, Experiencia, Ambiente Sano, Onboarding, Exit, Performance o Metas. También usar cuando el usuario diga 'este template Meta lo va a rechazar', 'audita este mensaje WhatsApp', 'pásame el contentVariables', o pida estructurar payload Twilio Content API. Aplica Gate B/C de ARQUITECTURA_COMUNICACIONES_v3."
---

# FocalizaHR · Skill de Templates WhatsApp Business

## Propósito

Producir templates WhatsApp que pasen la revisión Meta a la primera, mantengan el tono FocalizaHR (McKinsey + Apple, sin jerga RRHH) y respeten la arquitectura del channel-selector y el outbox pattern del sistema de comunicaciones v3.0.

Toda decisión técnica de esta skill se subordina a tres documentos: `ARQUITECTURA_COMUNICACIONES_v3_MAESTRO.md`, `ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR.md` y la skill `focalizahr-narrativas` (las 6 Reglas de Oro aplican igual aquí, solo cambia el canal).

---

## 1. Reglas Meta para Templates (auditadas a junio 2026)

### 1.1 Las tres categorías (desde abril 2023, vigentes)

| Categoría | Cuándo aplica | Ejemplo FocalizaHR | Costo relativo |
|---|---|---|---|
| **UTILITY** | Mensaje atado a una acción/relación previa del usuario. Transaccional, informativo, sin promoción. | Invitación a encuesta de la empresa donde trabaja, recordatorio de evaluación pendiente, aviso de reporte disponible. | Más bajo. Prioritario en entrega. |
| **MARKETING** | Promoción, oferta, awareness, engagement comercial. | Para FocalizaHR: ninguno. No vendemos productos al empleado. | Más alto. Sujeto a límites diarios y opt-out. |
| **AUTHENTICATION** | OTP, códigos de verificación de login o recuperación. | No aplica hoy en FocalizaHR. | Pricing especial. |

**Regla para FocalizaHR: TODOS los templates son UTILITY.** El empleado está en una relación laboral con la empresa que contrató FocalizaHR, y cada mensaje responde a una acción del ciclo de vida de esa relación (ingreso, evaluación, salida, meta asignada). Eso es exactamente lo que Meta define como utility.

### 1.2 Cómo evitar la re-categorización automática a MARKETING

Meta reclasifica utility como marketing si detecta lenguaje promocional. Desde abril 2025 el enforcement es estricto. Estas palabras y patrones DISPARAN reclasificación:

| ❌ Prohibido en utility | ✅ Reemplazo correcto |
|---|---|
| "oferta", "descuento", "exclusivo" | (no usar en encuestas) |
| "novedad", "última oportunidad" | "recordatorio", "queda(n) X día(s)" |
| "no te pierdas", "aprovecha" | "tu participación" |
| "compra", "reserva ahora", "regístrate" | "responder", "completar" |
| CTA "Buy Now", "Shop Now", "Learn More" | CTA "Responder encuesta", "Abrir evaluación" |
| Saludo genérico tipo "Hola {{1}}, mira esto" | Anclar a la acción/empresa específica |

**Ancla utility**: el mensaje debe mencionar la empresa del usuario, el contexto laboral o un instrumento específico. "Te escribimos desde {{1}}" + "responder una encuesta confidencial" deja claro que es servicio, no promoción.

### 1.3 Formato de variables (regla dura)

Meta y Twilio Content API usan variables **numéricas posicionales**: `{{1}}`, `{{2}}`, `{{3}}`. NO se usa `{{variable_name}}` en el template aprobado. El sistema interno de FocalizaHR puede tener nombres legibles (`participantName`, `companyName`), pero el `contentSid` aprobado solo conoce posiciones.

Reglas de formato (rejection automática si se violan):

- Variables secuenciales sin saltos: `{{1}}, {{2}}, {{3}}`. NUNCA `{{1}}, {{2}}, {{4}}`.
- Doble llave siempre, sin espacios: `{{1}}` ✅. `{ {1} }` o `{1}` ❌.
- Sin caracteres especiales dentro: `{{1#}}` ❌.
- **No empezar ni terminar el body con una variable**. Siempre texto envuelve la variable.
- **No variables consecutivas**: `{{1}} {{2}}` con solo un espacio entre ellas se rechaza. Insertar al menos una palabra entre variables.
- **Ratio mínimo Twilio**: por cada `x` variables, al menos `(2x + 1)` palabras no-variable. Para 4 variables: mínimo 9 palabras de texto plano.
- Nombre del template: solo minúsculas, números y guion bajo. `survey_invitation_es` ✅. `Survey-Invitation` ❌.
- Un template por idioma. La versión española es independiente de la portuguesa.

### 1.4 Límites de caracteres

| Componente | Límite |
|---|---|
| Body | 1024 caracteres totales (incluyendo variables expandidas) |
| Header (text) | 60 caracteres |
| Footer | 60 caracteres, solo texto plano, sin emojis ni variables |
| Texto de botón | 20 caracteres |
| Botones quick reply | Máximo 3 |
| Botones CTA (URL o phone) | Máximo 2 |
| **No se pueden mezclar** quick reply con CTA en el mismo template |
| Variables en un template | 100 (en la práctica para FocalizaHR: 2 a 5) |
| Emojis en marketing | Máximo 10 (utility: sin tope formal, pero usar 0 a 1 por buena práctica) |

### 1.5 Contenido prohibido (rejection o ban)

- Tono amenazante o coercitivo. "Última oportunidad o pierdes acceso", "si no respondes habrá consecuencias" → rechazo.
- Solicitar datos sensibles completos: número de tarjeta, RUT completo, contraseña.
- URLs acortadas (`bit.ly`, `wa.me`). Solo HTTPS desde dominio verificado. Desde 1 enero 2026 Meta exige URLs HTTPS verificables o rechaza el template.
- Contenido que imite mensajes del sistema o de WhatsApp.
- Typos. Meta los lee como falta de profesionalismo.
- Templates duplicados (mismo body que uno ya aprobado).
- Promesas legales o financieras ("garantizamos", "100% efectivo").
- **Para FocalizaHR específicamente**: NUNCA mencionar "Ley Karin" ni número de ley directamente en el template (regla de proyecto, sección 3 abajo). NUNCA incluir deadlines legales.

### 1.6 Proceso de aprobación

- Aprobación típica: **minutos a 24 horas** si el template es limpio. Hasta 48 horas en horas pico.
- Tasa de aprobación a primera vista para templates Meta-compliant: **>85%** según data 2024-2025 de BSPs.
- Si se rechaza, el motivo aparece como código (`INVALID_FORMAT`, `TAG_CONTENT_MISMATCH`, `POLICY_VIOLATION`, etc.). Se puede editar y reenviar.
- Una vez aprobado el body **no se puede editar**. Solo categoría. Si hace falta cambiar el texto se crea un template nuevo.
- Un template aprobado se identifica por su `contentSid` (formato `HX` + 32 hex), que es lo que el código de FocalizaHR persiste en `whatsapp-templates.ts`.
- Reducción del período de gracia: desde 2024 una violación grave puede deshabilitar el template en 7 días (antes 30).

---

## 2. Buenas Prácticas WhatsApp Business

### 2.1 Tasas de respuesta de referencia (2025-2026)

| Métrica | Email | WhatsApp |
|---|---|---|
| Open rate | 20-30% | 85-98% |
| CTR (click en botón/link) | 2-5% | 15-65% según industria |
| Response rate en encuestas | 8-15% | 45-65% |
| Time-to-read mediano | varias horas a días | <3 minutos |

**Implicación para FocalizaHR**: WhatsApp no es "otra cola" del mismo template. Cambia la economía del producto. Una encuesta con 12% de respuesta por email se vuelve viable con 50% por WhatsApp. Esto justifica el costo por mensaje y el esfuerzo de aprobación.

### 2.2 Qué hace que un usuario bloquee el número

Bloqueos > 5% de los envíos disparan downgrade de quality rating y eventual pausa del número. Causas frecuentes:

- Mensaje no esperado (sin opt-in claro, sin contexto de relación).
- Frecuencia excesiva. Un empleado que recibe 4 WhatsApp en una semana del mismo número lo bloquea.
- Tono comercial. Aunque el contenido sea utility, si "huele a venta", se reporta.
- Primer contacto sin presentarse. Mensaje sin nombre de la empresa empleadora se siente spam.
- Imposibilidad de salirse. El template debe permitir respuesta "STOP" o equivalente.

### 2.3 Horarios y frecuencia para FocalizaHR

- **Horario civil**: 09:00 a 19:00 hora local del destinatario. Nunca antes de 08:00 ni después de 20:00. Domingos: evitar.
- **Frecuencia máxima por empleado**: 1 mensaje WhatsApp por campaña en curso + 1 recordatorio. Total: 2 mensajes en 7 a 10 días. Más alto = riesgo de bloqueo.
- **Channel-onboarding**: una sola vez por empleado, al primer contacto. Si responde "no quiero WhatsApp" → marcar `preferredChannel='email'` y nunca más enviar WhatsApp.
- **Performance**: el evaluador puede recibir hasta 3 (invitación + 2 recordatorios escalados), porque tiene obligación contractual de evaluar. Pero el evaluado nunca recibe WhatsApp sobre Performance.

### 2.4 Consideraciones LATAM / Chile

- **Penetración WhatsApp Chile**: >90% de la población adulta con smartphone. Más confiable que email corporativo para empleados de terreno (operación, retail, manufactura).
- **Idioma**: español de Chile, tuteo (`tú` y `te`), sin voseo. "Hola Juan, te escribimos desde..." NUNCA "Hola Juan, vos sabés...".
- **Tono cultural**: cercano sin perder respeto. El chileno se incomoda con tono corporativo gringo traducido. Pero también desconfía del exceso de informalidad de un canal extraño.
- **Confidencialidad como anclaje cultural**: en Chile post-Ley Karin la sensibilidad a la confidencialidad de encuestas de clima es alta. Mencionarla explícitamente sube response rate.
- **Empresa empleadora primero**: el template debe nombrar a la empresa donde trabaja el destinatario, no a FocalizaHR. "Te escribimos desde {{empresa}}" funciona; "Te escribimos desde FocalizaHR sobre tu empresa" suena tercerizado y baja la confianza.

---

## 3. Tono FocalizaHR WhatsApp

### 3.1 Principio único

El WhatsApp de FocalizaHR habla como **un colega cercano de RRHH que avisa algo importante en pocas líneas**. No como una empresa enviando comunicación corporativa, ni como un bot, ni como un amigo del colegio. Punto medio profesional-cercano.

Aplican las **6 Reglas de Oro** de la skill `focalizahr-narrativas`, adaptadas al canal:

- **Regla 0 (Pirámide Minto)**: el primer renglón resuelve qué es y qué se pide. Detalles abajo.
- **Regla 7 (sin em dashes)**: nunca `—` en el template. Usar dos puntos, comas o paréntesis. Esto vale igual para WhatsApp que para el resto del producto.
- **Una idea por mensaje**. WhatsApp no es lugar para narrativas largas. Eso vive en el dashboard al que el botón lleva.

### 3.2 Tono SÍ vs NO con ejemplos

**❌ Demasiado formal y corporativo**
> "Estimado colaborador, por medio del presente se le informa que la empresa ha dispuesto una instancia de medición de clima organizacional. Sírvase acceder al siguiente enlace para responder el instrumento."

Problemas: lenguaje notarial, "se le informa" (pasiva), "instrumento", no nombra a la persona ni a la empresa, suena a notificación judicial. Rechazo emocional inmediato.

**❌ Demasiado informal**
> "Holaaa Juan! 👋😊 Cómo estaiii? Tu pega quiere saber qué onda contigo jajaja, respondi acá 👉"

Problemas: jerga, emojis recargados, "pega", risa innecesaria, parece phishing o broma. Bloqueo casi seguro.

**❌ Promocional (Meta reclasifica a marketing)**
> "Hola Juan! 🎉 No te pierdas esta oportunidad única de hacer tu voz escuchada. Aprovecha y responde ahora!"

Problemas: "no te pierdas", "oportunidad única", "aprovecha", signo exclamación múltiple. Reclasificación automática a marketing y costo subiendo.

**✅ Tono FocalizaHR correcto**
> "Hola Juan, te escribimos desde Cencosud. Queremos conocer tu experiencia en la empresa. Son 5 minutos y es 100% confidencial."

Por qué funciona: nombra a la persona, nombra a la empresa empleadora real, dice qué se pide, anticipa la objeción (tiempo, confidencialidad), no vende.

### 3.3 Uso de emojis

Regla operativa: **cero o uno por mensaje**. Si hay uno, va al final como cierre suave o en el botón. Nunca en cascada.

- ✅ Aceptables (utility-friendly): 📋 (encuesta), 🔒 (confidencialidad), ⏰ (recordatorio), 📊 (reporte).
- ❌ Evitar: emojis de cara (😊👋🎉), corazones, manos aplaudiendo, pulgares.

Por qué: los emojis de cara y celebración disparan filtros de Meta como "tono promocional" o "no-utility". Los de objeto/función son neutros.

### 3.4 Formato WhatsApp (negritas, cursivas)

Meta permite y recomienda formato dentro del body de un template. WhatsApp usa sintaxis propia, **no Markdown estándar**. Confundirlas es razón frecuente de rechazo.

| Formato | Sintaxis WhatsApp | Sintaxis Markdown ❌ | Uso recomendado |
|---|---|---|---|
| Negrita | `*texto*` (un asterisco) | `**texto**` | Cifras críticas, labels de campo, acción única |
| Cursiva | `_texto_` (underscore) | `*texto*` | Casi nunca (algunos clientes la ignoran) |
| Tachado | `~texto~` | n/a | Nunca en utility (connotación negativa) |
| Monoespaciado | ` ```texto``` ` | n/a | Nunca (es para código) |

**Reglas duras del formato en FocalizaHR**:

- Solo en el **body**. Header y footer NO aceptan formato (Meta los rechaza).
- **Máximo 1 a 2 énfasis por mensaje**. Si todo se destaca, nada se destaca. Regla Apple aplicada a tipografía.
- **Nunca poner una variable entera en negrita**. `*{{1}}*` se expande a `*Carolina Pérez*` y queda forzado.
- **Nunca el saludo en negrita**. `*Hola Juan*` se ve gritón, no acogedor.
- **Nunca títulos en mayúsculas con negrita**. Suena a notificación de spam.
- **Una sola convención por mensaje**. Si decides usar negrita para labels, mantenla en todos los labels del mismo template.

**Patrones aprobados de uso**:

| Patrón | Ejemplo |
|---|---|
| Cifra crítica como ancla | `Te queda(n) *{{3}} día(s)* para responder.` |
| Label de campo en mensaje estructurado | `*Meta:* {{3}}` + `*Fecha objetivo:* {{4}}` |
| Confidencialidad como ancla de confianza | `Es *100% confidencial*.` |
| Acción única destacada | `Tu evaluación es *necesaria* para que reciba feedback.` |

**Patrones prohibidos**:

```
❌ *Hola {{1}}*, te escribimos desde *{{2}}*.
   (Saludo en negrita + dos variables resaltadas. Visualmente caótico.)

❌ *URGENTE*: La encuesta cierra HOY.
   (Mayúsculas con negrita = tono amenazante. Disparo de rechazo Meta.)

❌ Hola {{1}}, *queremos* *conocer* *tu* *opinión*.
   (Negrita esparcida. Confunde el ojo, no destaca nada.)
```

### 3.5 Largo del mensaje

Benchmarks de la industria (2025-2026): los templates utility tienen mejor read-rate en **80 a 160 caracteres**. Mensajes sobre 300 caracteres muestran caída medible en lectura completa.

Tabla operativa FocalizaHR:

| Tipo | Largo objetivo | Cuándo se justifica salirse |
|---|---|---|
| Channel-onboarding (primer contacto) | 250 a 350 caracteres | Necesita explicar el contexto: quiénes somos, por qué este canal, opción de opt-out. |
| Survey-invitation | 180 a 250 caracteres | Si el producto requiere disclaimer (Ambiente Sano necesita anclar confidencialidad). |
| Reminder | 120 a 200 caracteres | Casi nunca. Recordatorio = breve por definición. |
| Escalation (último intento) | 200 a 280 caracteres | La frase de "está bien si no respondes" justifica los caracteres extra. |
| Goal-assigned | 200 a 300 caracteres | Necesita mostrar meta + fecha + asignador. |
| Goal-at-risk | 200 a 280 caracteres | Necesita explicar qué pasa y sugerencia de acción. |
| Goal-completed | 150 a 220 caracteres | Confirmación factual, no narrativa. |
| Evaluation-invitation | 280 a 380 caracteres | Justificado: 5 datos críticos (evaluador, empresa, evaluado, cargo, deadline). |
| Report-ready | 150 a 220 caracteres | Aviso breve, no resumen del reporte. |

Regla operativa: si el mensaje pasa el rango superior, primera revisión es "qué frase puedo cortar". Solo después se justifica largo extra.

### 3.6 Relación con la skill `focalizahr-narrativas`

Las **6 Reglas de Oro** de la skill `focalizahr-narrativas` aplican parcialmente al canal WhatsApp:

| Regla narrativas | Aplica a WhatsApp | Razón |
|---|---|---|
| Regla 0 (Pirámide Minto) | NO | El WhatsApp es muy corto para tener pirámide. La primera línea ES el headline y resuelve sola. |
| Regla 1 (Contradicción protagonista) | NO | WhatsApp no comunica hallazgos al empleado, comunica acciones. No hay contradicción que mostrar. |
| Regla 2 (O McKinsey para causas) | NO | No estamos diagnosticando al destinatario, le estamos pidiendo una acción. |
| Regla 3 (Consecuencia, no instrucción) | PARCIAL | Verbos operacionales sí ("responder", "completar"). Verbos paternalistas NO ("deberías", "es necesario"). |
| **Regla 4 (Sin jerga técnica)** | **SÍ, 100%** | Nada de RoleFit, EXO Score, EIS, NineBox, Pearson, ISA. |
| **Regla 5 (Una idea por oración, ritmo)** | **SÍ, 100%** | Crítico en canal corto. Cada oración debe poder leerse sola. |
| Regla 6 (Cierre ancla urgencia) | PARCIAL | La urgencia en WhatsApp es informativa ("queda 1 día"), no emocional ("destrucción silenciosa"). |
| **Regla 7 (Sin em dashes)** | **SÍ, 100%** | Regla absoluta del proyecto, vale para todo canal. |

**Vocabulario heredado prohibido en WhatsApp** (toda la lista de `focalizahr-narrativas` aplica):

- Jerga consultora: stakeholders, deliverables, roadmap, framework, engagement, tracción, complacencia, fricción, inercia organizacional.
- Jerga técnica del sistema: RoleFit, NineBox, EXO Score, EIS, Pearson, CompetencyTargets, standardCategory, performanceTrack.
- Jerga RRHH excesiva: desconexión emocional, employee journey, talent pipeline, valor agregado.
- Verbos prescriptivos: deberías, se recomienda, es necesario, conviene que, sugerimos que.
- Plazos prescriptivos con cifra impuesta: "en los próximos 30 días", "antes de que termine la semana".

**Verbos operacionales SÍ válidos en WhatsApp** (estos quedan):

- responder, completar, ver, abrir, revisar
- queremos, te recordamos, te avisamos, te escribimos
- "puedes" (invitación) en vez de "debes" (imposición)

---

## 4. Templates Base FocalizaHR

> **Notas técnicas comunes a TODOS los templates**:
> - Categoría Meta: **UTILITY** en todos los casos (FocalizaHR no envía marketing).
> - Idioma: `es` (español, variante neutral aceptada por Meta para LATAM. Para Chile específico no hay sub-locale en Meta).
> - Tipo Twilio: `twilio/call-to-action` (cuando hay URL botón) o `twilio/text` (cuando no).
> - Variables sample: incluir SIEMPRE valores ejemplo realistas, no `John Doe`. Meta usa los samples para entender el contexto del template.
> - Naming convention: `focalizahr_<producto>_<accion>_<idioma>`. Ej: `focalizahr_pulso_invitation_es`.
> - URL del botón: dominio verificado de FocalizaHR (ej. `https://app.focalizahr.com/encuesta/{{token}}`). HTTPS obligatorio.

### 4.1 channel-onboarding (primer contacto, pedir consentimiento)

**Propósito**: primer mensaje a un empleado que nunca interactuó. Único contexto en que se contacta sin acción previa del usuario, justificado por el contrato B2B con la empresa empleadora (consent proxy). Meta requiere que sea template aprobado.

**Nombre técnico**: `focalizahr_channel_onboarding_es`

**Categoría**: UTILITY (anclado al hecho de ser empleado de la empresa que contrató FocalizaHR)

**Body** (340 caracteres):

```
Hola {{1}}, te escribimos desde {{2}}.

Nos contactaremos por este canal para encuestas internas y comunicaciones importantes de la empresa. Todo es confidencial.

¿Prefieres recibir estas comunicaciones por WhatsApp o por email? Tu respuesta queda registrada y respetamos tu elección.
```

**Variables sample**:
- `{{1}}`: `María González`
- `{{2}}`: `Cencosud`

**Botones**: quick-reply (3 opciones)
1. `Sigo por WhatsApp` (16 caracteres) → setea `preferredChannel='whatsapp'`, `channelConsentAt=NOW()`, `channelConsentMethod='whatsapp_button'`
2. `Prefiero email` (14 caracteres) → setea `preferredChannel='email'`, `awaitingEmailCapture=true` si no hay email registrado
3. `Más información` (15 caracteres) → triggera template auxiliar con detalle sobre confidencialidad y FocalizaHR

**Footer**: `Powered by FocalizaHR · Confidencial` (37 caracteres - dentro del límite de 60)

**Checklist pre-Meta**:
- [x] Variables sample son nombres reales (no placeholders genéricos)
- [x] Body no empieza ni termina con variable
- [x] Sin emojis, sin tono promocional
- [x] Botones < 20 caracteres cada uno
- [x] Sin mención a "Ley Karin" ni números de ley
- [x] Mensaje da opción explícita de opt-out (botón "Prefiero email")

---

### 4.2 survey-invitation (invitación a encuesta de clima/experiencia)

**Propósito**: invitar al empleado a responder Pulso Express, Experiencia Full o Ambiente Sano. El channel-selector ya validó que tiene consent WhatsApp.

**Nombre técnico**: `focalizahr_survey_invitation_es`

**Categoría**: UTILITY

**Body** (290 caracteres):

```
Hola {{1}}, en {{2}} queremos conocer tu opinión.

La encuesta toma *5 minutos* y es *100% confidencial*. Solo se analiza en conjunto, nadie identifica respuestas individuales.

Te queda(n) *{{3}} día(s)* para responder.
```

**Variables sample**:
- `{{1}}`: `Carolina Pérez`
- `{{2}}`: `Falabella`
- `{{3}}`: `7`

**Botón CTA URL**: `Responder encuesta` (18 caracteres)
- URL: `https://app.focalizahr.com/encuesta/{{4}}` (el `{{4}}` se reemplaza con el `uniqueToken` del Participant)
- Nota: Meta exige HTTPS verificable. El dominio `focalizahr.com` debe estar verificado en Business Manager antes de enviar el template a aprobación.

**Footer**: `FocalizaHR · Tu respuesta es confidencial` (43 caracteres)

**Variante Ambiente Sano**: el body cambia mínimamente. NO mencionar "Ley Karin". Resolver el contexto con `legalBadgeForCountry()` en backend antes de armar contentVariables. Variante body:

```
Hola {{1}}, en {{2}} estamos evaluando el clima del ambiente laboral.

Es una encuesta breve (5 a 8 minutos) y 100% confidencial. Nos ayuda a detectar a tiempo cualquier indicio de riesgo y mejorar.

Te queda(n) {{3}} día(s) para responder.
```

Atender la diferencia: "indicio de riesgo" en lugar de "ambiente sano explícitamente referido a Ley Karin". El sistema interno sabe que es Ambiente Sano. El template aprobado por Meta no necesita saberlo.

**Checklist pre-Meta**:
- [x] Ratio palabras/variable: 9 variables max, 35+ palabras non-variable → ratio 11.6:1 ✓ (mínimo es 7 palabras non-variable para 3 variables)
- [x] No empezar/terminar con variable
- [x] Sin URL acortada en body (la URL va en el botón)
- [x] Tono utility (informativo, no promocional)
- [x] Anclaje a la empresa empleadora

---

### 4.3 survey-reminder (recordatorio amable)

**Propósito**: recordar al empleado que aún no responde una encuesta activa. Se envía a los 3 días del envío inicial (no antes).

**Nombre técnico**: `focalizahr_survey_reminder_es`

**Categoría**: UTILITY

**Body** (210 caracteres):

```
Hola {{1}}, te recordamos que la encuesta de {{2}} sigue abierta.

Quedan {{3}} día(s) y son 5 minutos. Tu respuesta es confidencial y suma al diagnóstico del equipo.
```

**Variables sample**:
- `{{1}}`: `Diego Soto`
- `{{2}}`: `Cencosud`
- `{{3}}`: `3`

**Botón CTA URL**: `Responder ahora` (15 caracteres)
- URL: `https://app.focalizahr.com/encuesta/{{4}}`

**Footer**: `FocalizaHR · Confidencial` (25 caracteres)

**Checklist pre-Meta**:
- [x] Tono recordatorio neutro (sin urgencia exagerada)
- [x] Sin "última oportunidad", "no te pierdas", "aprovecha" (palabras-trampa que disparan reclasificación a marketing)
- [x] Mantiene anclaje a empresa empleadora

---

### 4.4 survey-escalation (último intento)

**Propósito**: último mensaje antes del cierre de la campaña, después de email + recordatorio sin respuesta. Tono urgente pero NUNCA amenazante.

**Nombre técnico**: `focalizahr_survey_escalation_es`

**Categoría**: UTILITY

**Body** (250 caracteres):

```
Hola {{1}}, la encuesta de {{2}} cierra mañana.

Es la última instancia para que tu opinión quede registrada. Son 5 minutos. Confidencial.

Si decides no responder, también está bien. Solo queremos asegurarnos de no dejarte fuera.
```

**Variables sample**:
- `{{1}}`: `Ana Ramírez`
- `{{2}}`: `Falabella`

**Botón CTA URL**: `Abrir encuesta` (14 caracteres)
- URL: `https://app.focalizahr.com/encuesta/{{3}}`

**Footer**: `FocalizaHR · Confidencial` (25 caracteres)

**Checklist pre-Meta**:
- [x] La frase "Si decides no responder, también está bien" es clave: desactiva el riesgo de tono amenazante que Meta penaliza.
- [x] "Última instancia" (técnica) en vez de "última oportunidad" (promocional).
- [x] Sin signos de exclamación múltiples.

---

### 4.5 goal-assigned (notificación de meta asignada)

**Propósito**: avisar al empleado que su jefe le asignó una meta nueva en el módulo Metas. La meta ya existe en el sistema cuando se dispara el mensaje (acción del jefe = trigger utility válido).

**Nombre técnico**: `focalizahr_goal_assigned_es`

**Categoría**: UTILITY

**Body** (320 caracteres):

```
Hola {{1}}, {{2}} te asignó una meta nueva.

*Meta:* {{3}}
*Fecha objetivo:* {{4}}

Puedes ver el detalle, los criterios de éxito y dejar comentarios desde la plataforma.
```

**Variables sample**:
- `{{1}}`: `Felipe Castro`
- `{{2}}`: `Patricia Vidal` (nombre del jefe asignador)
- `{{3}}`: `Aumentar tasa de conversión 15% Q4`
- `{{4}}`: `31 diciembre 2026`

**Botón CTA URL**: `Ver mi meta` (11 caracteres)
- URL: `https://app.focalizahr.com/metas/{{5}}`

**Footer**: `FocalizaHR · Módulo Metas` (25 caracteres)

**Checklist pre-Meta**:
- [x] 4 variables, mínimo de palabras non-variable: 9. Tenemos 24 palabras non-variable. Ratio 6:1 ✓.
- [x] Texto del jefe asignador es variable (legitima el mensaje como triggered por acción humana real, no spam).
- [x] No promete recompensa ni amenaza con consecuencias.

---

### 4.6 goal-at-risk (alerta de meta en riesgo)

**Propósito**: alertar al empleado que su meta está en riesgo según el progreso registrado. Máximo 1 alerta por meta por semana (controlado por `dedupKey` con yyyy-ww).

**Nombre técnico**: `focalizahr_goal_at_risk_es`

**Categoría**: UTILITY

**Body** (280 caracteres):

```
Hola {{1}}, tu meta "{{2}}" está mostrando atraso según el último avance registrado.

Quedan *{{3}} día(s)* hasta la fecha objetivo. Conviene revisar el plan o conversar con {{4}} para ajustar.
```

**Variables sample**:
- `{{1}}`: `Felipe Castro`
- `{{2}}`: `Aumentar tasa de conversión 15% Q4`
- `{{3}}`: `21`
- `{{4}}`: `Patricia` (primer nombre del jefe)

**Botón CTA URL**: `Revisar meta` (12 caracteres)
- URL: `https://app.focalizahr.com/metas/{{5}}`

**Footer**: `FocalizaHR · Alerta predictiva` (30 caracteres)

**Checklist pre-Meta**:
- [x] Tono asistente, no acusatorio. "Está mostrando atraso" (descriptivo) en vez de "estás atrasado" (acusatorio).
- [x] Sugerencia de acción concreta (conversar con el jefe), no amenaza.
- [x] Sin "último plazo", "fracaso", "incumplimiento".

---

### 4.7 goal-completed (meta cumplida)

**Propósito**: confirmar al empleado que su meta fue marcada como cumplida (por él o por el jefe).

**Nombre técnico**: `focalizahr_goal_completed_es`

**Categoría**: UTILITY

**Body** (200 caracteres):

```
Hola {{1}}, tu meta "{{2}}" quedó registrada como cumplida.

Queda guardada en tu historial para la próxima conversación de desarrollo y para la revisión de ciclo.
```

**Variables sample**:
- `{{1}}`: `Felipe Castro`
- `{{2}}`: `Aumentar tasa de conversión 15% Q4`

**Botón CTA URL**: `Ver historial` (13 caracteres)
- URL: `https://app.focalizahr.com/metas/historial/{{3}}`

**Footer**: `FocalizaHR · Módulo Metas` (25 caracteres)

**Checklist pre-Meta**:
- [x] Reconocimiento factual, sin felicitación efusiva (eso es marketing tone).
- [x] Conecta con la utilidad próxima (conversación de desarrollo, revisión de ciclo).

---

### 4.8 evaluation-invitation (Performance 360°, invitación al EVALUADOR)

**Propósito**: invitar al EVALUADOR (jefe, par o auto-evaluador) a completar una evaluación de desempeño 360° asignada. El destinatario es el evaluador, NUNCA el evaluado.

> ⚠️ **Crítico técnico**: en Performance, `Participant.email` y el teléfono resuelto vía `evaluationAssignmentId → evaluator.phoneNumber` corresponden al EVALUADOR. `Participant.nationalId` apunta al EVALUADO y NO debe usarse para resolver canal. Ver `ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR.md` sección "Estrategia 2b".

**Nombre técnico**: `focalizahr_performance_evaluation_invitation_es`

**Categoría**: UTILITY

**Body** (380 caracteres):

```
Hola {{1}}, en {{2}} estamos en proceso de evaluación de desempeño.

Tienes pendiente evaluar a {{3}} ({{4}}). Toma alrededor de 10 minutos.

El ciclo cierra el {{5}} y tu evaluación es necesaria para que {{3}} reciba su feedback de desarrollo.
```

**Variables sample**:
- `{{1}}`: `Patricia Vidal` (evaluador)
- `{{2}}`: `Falabella`
- `{{3}}`: `Felipe Castro` (evaluado)
- `{{4}}`: `Analista Comercial` (cargo del evaluado)
- `{{5}}`: `30 noviembre 2026`

**Botón CTA URL**: `Completar evaluación` (20 caracteres - en el límite, dejar tal cual)
- URL: `https://app.focalizahr.com/encuesta/{{6}}`

**Footer**: `FocalizaHR · Evaluación 360°` (29 caracteres)

**Checklist pre-Meta**:
- [x] 5 variables, mínimo 11 palabras non-variable. Tenemos 38. Ratio 7.6:1 ✓.
- [x] El destinatario tiene contexto claro: evalúa a alguien específico, en una empresa específica, con un cargo específico.
- [x] No empieza ni termina con variable.

---

### 4.9 report-ready (reporte de evaluación disponible)

**Propósito**: avisar al empleado evaluado que su reporte de desempeño está disponible. Se envía cuando termina el ciclo y la calibración cierra.

**Nombre técnico**: `focalizahr_report_ready_es`

**Categoría**: UTILITY

**Body** (220 caracteres):

```
Hola {{1}}, tu reporte de desempeño del ciclo {{2}} ya está disponible.

Incluye tus resultados, fortalezas y áreas de desarrollo. El link estará activo por {{3}} días.
```

**Variables sample**:
- `{{1}}`: `Felipe Castro`
- `{{2}}`: `2026 Q3`
- `{{3}}`: `30`

**Botón CTA URL**: `Ver mi reporte` (14 caracteres)
- URL: `https://app.focalizahr.com/desempeno/reporte/{{4}}`

**Footer**: `FocalizaHR · Reporte 360°` (25 caracteres)

**Checklist pre-Meta**:
- [x] Anclaje claro a un proceso del que el empleado fue parte (participó como evaluado).
- [x] Mención de expiración (`{{3}} días`) es informativa, no presión comercial.

---

## 5. Mapping de Variables a `contentVariables` (Twilio)

El sistema interno trabaja con nombres legibles. El payload Twilio espera números. Esta tabla es la fuente de verdad del mapeo por template:

| Template | `{{1}}` | `{{2}}` | `{{3}}` | `{{4}}` | `{{5}}` | `{{6}}` |
|---|---|---|---|---|---|---|
| `channel_onboarding` | `participantFirstName` | `companyName` | - | - | - | - |
| `survey_invitation` | `participantFirstName` | `companyName` | `daysRemaining` | `surveyToken` | - | - |
| `survey_reminder` | `participantFirstName` | `companyName` | `daysRemaining` | `surveyToken` | - | - |
| `survey_escalation` | `participantFirstName` | `companyName` | `surveyToken` | - | - | - |
| `goal_assigned` | `employeeFirstName` | `managerFullName` | `goalTitle` | `targetDate` | `goalId` | - |
| `goal_at_risk` | `employeeFirstName` | `goalTitle` | `daysRemaining` | `managerFirstName` | `goalId` | - |
| `goal_completed` | `employeeFirstName` | `goalTitle` | `goalId` | - | - | - |
| `evaluation_invitation` | `evaluatorFullName` | `companyName` | `evaluateeFullName` | `evaluateePosition` | `cycleEndDate` | `evaluationToken` |
| `report_ready` | `employeeFirstName` | `cycleName` | `expirationDays` | `reportId` | - | - |

Implementación esperada en `src/lib/templates/whatsapp-templates.ts` (Gate B):

```typescript
// Cada template lleva su contentSid placeholder (se reemplaza con HX real
// post-aprobación Meta) y la función de mapping internal-name → posicional.

export const WHATSAPP_TEMPLATES = {
  channel_onboarding: {
    contentSid: 'HX_PLACEHOLDER_CHANNEL_ONBOARDING',
    category: 'UTILITY',
    language: 'es',
    mapVariables: (ctx: { participantFirstName: string; companyName: string }) => ({
      '1': ctx.participantFirstName,
      '2': ctx.companyName,
    }),
  },
  // ... resto de templates
} as const;
```

Razón de la estructura: el `contentSid` y el mapping viven juntos por template, así que cambiar un template no requiere tocar el dispatcher. El dispatcher solo invoca `template.mapVariables(ctx)` y manda `JSON.stringify(...)` a Twilio.

---

## 6. Checklist Pre-Aprobación Meta (consolidado)

Antes de enviar **cualquier** template a aprobación Meta, validar TODO:

### Formato
- [ ] Nombre: `focalizahr_<producto>_<accion>_<idioma>`, solo minúsculas + números + `_`.
- [ ] Variables secuenciales: `{{1}}, {{2}}, {{3}}, ...` sin saltos.
- [ ] No empezar ni terminar el body con variable.
- [ ] No variables consecutivas sin palabra entre ellas.
- [ ] Ratio palabras non-variable / variable ≥ (2x + 1).
- [ ] Body ≤ 1024 caracteres (incluyendo expansión de variables sample).
- [ ] Header ≤ 60 caracteres (si existe). Footer ≤ 60 caracteres (solo texto, sin emojis ni variables).
- [ ] Texto de cada botón ≤ 20 caracteres.
- [ ] Máximo 3 quick-reply OR máximo 2 CTA. NO mezclar.

### Categoría
- [ ] Categoría = **UTILITY** (todos los templates FocalizaHR).
- [ ] Sin palabras-trampa que disparen reclasificación: "oferta", "exclusivo", "descuento", "última oportunidad", "no te pierdas", "aprovecha", "novedad", "compra", "reserva", "regístrate".
- [ ] CTAs alineados a utility: "Responder", "Ver", "Abrir", "Completar", "Revisar". NUNCA "Buy Now", "Shop Now", "Learn More".

### Contenido
- [ ] Sin tono amenazante ni coercitivo. Frases tipo "si no respondes, perderás acceso" → reformular o eliminar.
- [ ] Sin solicitud de datos sensibles completos.
- [ ] Sin URL acortada (`bit.ly`, `wa.me`). Solo HTTPS desde dominio verificado (`focalizahr.com` o subdominio).
- [ ] Sin emojis de cara o celebración. Máximo 1 emoji utility-friendly (📋, 🔒, ⏰, 📊) por mensaje, idealmente cero.
- [ ] Sin typos. Revisar a mano (Meta los penaliza).
- [ ] Sin imitación de mensajes del sistema ("VERIFICAR", "NOTIFICACIÓN OFICIAL", etc.).

### Reglas FocalizaHR específicas
- [ ] **Ley Karin**: el template NUNCA menciona "Ley Karin" ni número de ley. La identificación legal se resuelve con `legalBadgeForCountry()` en backend y NO viaja en el contenido aprobado por Meta.
- [ ] **Indicios, no denuncias**: nunca framing de denuncia. Solo "indicio" o "riesgo".
- [ ] **Sin deadlines legales**: ningún SLA legal, ni días-hábiles regulatorios. Solo días-calendario de la encuesta.
- [ ] **Em dashes prohibidos**: ningún `—` en body ni footer. Usar dos puntos, comas o paréntesis.
- [ ] **Español de Chile, tuteo**: nada de "usted", nada de "vos", nada de "Holiii".
- [ ] **Empresa empleadora nombrada**: cuando hay `companyName` disponible, debe aparecer en el body. El destinatario debe reconocer la fuente como su empleador, no como FocalizaHR.

### Formato (negrita, cursiva)
- [ ] Sintaxis WhatsApp correcta: `*bold*` (un asterisco), NO `**bold**` (Markdown estándar).
- [ ] Máximo 1 a 2 énfasis por mensaje. Si todo está destacado, nada destaca.
- [ ] Sin negrita en saludo (`*Hola Juan*` se ve gritón).
- [ ] Sin variable entera en negrita (`*{{1}}*` se expande forzado).
- [ ] Sin mayúsculas con negrita (suena a notificación spam).
- [ ] Formato solo en body. Header y footer no aceptan formato (Meta los rechaza si tienen).

### Vocabulario heredado de skill `focalizahr-narrativas`
- [ ] Sin jerga consultora: stakeholders, deliverables, roadmap, framework, engagement, tracción, complacencia, fricción.
- [ ] Sin jerga técnica del sistema: RoleFit, NineBox, EXO Score, EIS, Pearson, CompetencyTargets, performanceTrack, ISA.
- [ ] Sin jerga RRHH excesiva: desconexión emocional, employee journey, talent pipeline, valor agregado.
- [ ] Sin verbos prescriptivos paternalistas: "deberías", "se recomienda", "es necesario", "conviene que", "sugerimos que".
- [ ] Verbos operacionales sí válidos: responder, completar, ver, abrir, revisar.

### Largo del mensaje
- [ ] Body ajustado al rango de la tabla sección 3.5. Templates utility rinden mejor en 80 a 250 caracteres.
- [ ] Si pasa de 300 caracteres, revisar qué frase recortar antes de aprobar.

### Variables sample
- [ ] Cada variable tiene un valor ejemplo realista (no `John Doe`, no `Test`).
- [ ] Los samples reflejan el uso real esperado (nombres latinos en español, fechas en formato chileno, etc.).
- [ ] Verificar mentalmente cómo se ve el mensaje con los samples expandidos.

### Botones
- [ ] Si hay URL: dominio verificado en Business Manager antes de submit.
- [ ] Texto del botón coherente con la acción (sin verbo comercial).
- [ ] Si el template usa variable en URL (`{{n}}`), está en el último slot de variables y coincide con el mapping `Twilio contentVariables`.

### Twilio Content API
- [ ] Tipo: `twilio/call-to-action` (si hay botón URL) o `twilio/text` (si no).
- [ ] `friendly_name` único y descriptivo.
- [ ] El template se submitea desde Twilio Console o vía Content API; el `contentSid` resultante se persiste en `whatsapp-templates.ts`.

---

## 7. Cuándo NO usar un template (envío directo o session message)

Hay dos casos donde NO se necesita template aprobado:

1. **Session message (ventana 24h)**: si el usuario respondió a WhatsApp en las últimas 24 horas, FocalizaHR puede mandar mensajes libres sin template. Caso típico: el empleado responde al `channel-onboarding` con "más información" y el sistema le envía detalle en texto libre dentro de la ventana.

2. **Reply al webhook con quick-reply**: la respuesta del usuario al template (botón apretado) abre la ventana 24h. Cualquier follow-up dentro de esa ventana es libre.

Fuera de esos dos casos, **siempre template aprobado**. No hay tercera vía.

---

## 8. Errores frecuentes a evitar (lecciones aprendidas)

| Error | Por qué pasa | Fix |
|---|---|---|
| Submit con `{{nombre}}` en vez de `{{1}}` | Confundir con templates internos (Resend usa `{participant_name}`) | Mapping explícito en `whatsapp-templates.ts`. Meta solo entiende numérico. |
| Template aprobado, pero falla en envío | URL del botón no es HTTPS verificable | Verificar dominio en Business Manager ANTES de submit. |
| Categoría asignada como MARKETING por Meta a un utility | Lenguaje promocional latente (palabras-trampa) | Auditar contra checklist sección 6. Apelar dentro de 60 días o reescribir. |
| Template rechazado por "INVALID_FORMAT" | Variable consecutiva, variable al inicio/fin, ratio insuficiente | Re-revisar sección 1.3. |
| Bloqueos en producción tras lanzamiento | Frecuencia excesiva o falta de opt-out claro | Cumplir sección 2.3 (frecuencia). Channel-onboarding debe permitir opt-out. |
| Performance: WhatsApp llega al evaluado en vez del evaluador | Resolución de teléfono por `nationalId` (estrategia incorrecta para Performance) | Usar `evaluationAssignmentId → evaluator.phoneNumber` (Estrategia 2b). Ver `ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR.md`. |

---

## 9. Fuentes y referencias

**Reglas Meta**:
- Meta for Developers · Template Categorization (developers.facebook.com/docs/whatsapp/message-templates)
- Política de re-categorización utility→marketing (vigente desde abril 2025, enforcement reforzado)
- Política HTTPS verificable obligatoria (vigente desde 1 enero 2026)

**Twilio Content API**:
- twilio.com/docs/content/create-templates-with-the-content-template-builder
- twilio.com/docs/content/create-and-send-your-first-content-api-template
- twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates

**Benchmarks de tasas** (2025-2026):
- Mobilesquared WhatsApp Business Research (open rates 85-98%)
- ChatArchitect Analytics (CTR 15-65% en utility)
- Múltiples reportes industria sobre encuestas WhatsApp vs email (45-65% vs 8-15% response rate)

**Documentos FocalizaHR (prioridad sobre toda fuente externa)**:
- `ARQUITECTURA_COMUNICACIONES_v3_MAESTRO.md` (Victor, junio 2026)
- `ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR.md` (junio 2026)
- Skill `focalizahr-narrativas` (6 Reglas de Oro)
- `FICHAS_MAESTRAS_PRODUCTOS_FOCALIZAHR.md` (definiciones de producto)
