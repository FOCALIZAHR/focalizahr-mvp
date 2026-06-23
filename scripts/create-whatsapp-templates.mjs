#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════
// FocalizaHR · scripts/create-whatsapp-templates.mjs
// ────────────────────────────────────────────────────────────────────────────
// Gate C · Crea los 2 templates WhatsApp en Twilio Content API.
//
//   1. focalizahr_channel_onboarding_es
//      Tipo: twilio/quick-reply (3 botones)
//      Body: skill focalizahr-whatsapp-templates §4.1
//      Variables:
//        {{1}} = participant_name   (sample: María González)
//        {{2}} = company_name       (sample: Cencosud)
//
//   2. focalizahr_survey_invitation_es
//      Tipo: twilio/call-to-action (1 botón URL dinámico)
//      Body: skill focalizahr-whatsapp-templates §4.2
//      Variables:
//        {{1}} = participant_name   (sample: Carolina Pérez)
//        {{2}} = company_name       (sample: Falabella)
//        {{3}} = days_remaining     (sample: 7)
//        {{4}} = survey_token       (sample: tok_a1b2c3d4e5)
//
// El footer NO existe como propiedad en quick-reply ni call-to-action;
// se embebe como última línea del body (literal de la skill).
//
// Categoría conceptual: UTILITY. Idioma: es.
// (Twilio Content API no acepta el campo `category` al crear; la categoría
// se asigna al submitear approval a Meta en Gate D.)
//
// request-email NO va a la Content API: es session message (mensaje libre,
// dentro de ventana 24h) y se envía vía sendWhatsApp({ to, body }) directo.
//
// Requisitos:
//   - Node 18+ (fetch global)
//   - Variables de entorno TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN
//
// Uso:
//   export TWILIO_ACCOUNT_SID="AC..."
//   export TWILIO_AUTH_TOKEN="..."
//   node scripts/create-whatsapp-templates.mjs
//
// Output:
//   - stdout con los dos ContentSid claramente etiquetados
//   - archivo ./whatsapp-content-sids.json con la misma información
// ════════════════════════════════════════════════════════════════════════════

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ──────────────────────────────────────────────────────────────────────────
// Configuración
// ──────────────────────────────────────────────────────────────────────────

const TWILIO_CONTENT_API = 'https://content.twilio.com/v1/Content';
const OUTPUT_FILE = resolve(process.cwd(), 'whatsapp-content-sids.json');

// ──────────────────────────────────────────────────────────────────────────
// Validación de variables de entorno
// ──────────────────────────────────────────────────────────────────────────

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Faltan variables de entorno.');
  console.error('   TWILIO_ACCOUNT_SID:', accountSid ? 'OK' : 'FALTA');
  console.error('   TWILIO_AUTH_TOKEN:', authToken ? 'OK' : 'FALTA');
  console.error('');
  console.error('Exporta antes de correr:');
  console.error('   export TWILIO_ACCOUNT_SID="AC..."');
  console.error('   export TWILIO_AUTH_TOKEN="..."');
  process.exit(1);
}

if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
  console.error('❌ TWILIO_ACCOUNT_SID inválido (debe empezar con AC y tener 34 caracteres).');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
const accountSidMasked = `${accountSid.substring(0, 8)}...${accountSid.substring(28)}`;

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 · channel-onboarding (twilio/quick-reply)
// ──────────────────────────────────────────────────────────────────────────
// Mapping conceptual de variables (lo que el código de FocalizaHR resolverá
// en runtime al construir contentVariables):
//   {{1}} ← participant_name
//   {{2}} ← company_name
//
// IDs de botones: estos valores aparecen en el webhook como ButtonPayload
// cuando el destinatario aprieta cada botón. El handler del webhook (Gate C
// §6 del plan de Code) los lee para decidir qué hacer.
// ──────────────────────────────────────────────────────────────────────────

const TEMPLATE_CHANNEL_ONBOARDING = {
  friendly_name: 'focalizahr_channel_onboarding_es',
  language: 'es',
  // Los valores en `variables` son samples para que Meta entienda el contexto
  // del template durante aprobación. NO son los valores que se envían en runtime.
  variables: {
    '1': 'María González',   // sample de participant_name
    '2': 'Cencosud',          // sample de company_name
  },
  types: {
    'twilio/quick-reply': {
      // Body LITERAL de la skill §4.1, con footer embebido como última línea
      // (twilio/quick-reply no tiene propiedad footer).
      body:
`Hola {{1}}, te escribimos desde {{2}}.

Nos contactaremos por este canal para encuestas internas y comunicaciones importantes de la empresa. Todo es confidencial.

¿Prefieres recibir estas comunicaciones por WhatsApp o por email? Tu respuesta queda registrada y respetamos tu elección.

Powered by FocalizaHR · Confidencial`,
      actions: [
        { title: 'Sigo por WhatsApp', id: 'channel_whatsapp' },
        { title: 'Prefiero email',    id: 'channel_email' },
        { title: 'Más información',   id: 'channel_more_info' },
      ],
    },
    // Fallback para canales sin quick-reply (SMS, etc.). No bloquea nada
    // si el destinatario está solo en WhatsApp; Twilio lo recomienda igual.
    'twilio/text': {
      body:
`Hola {{1}}, te escribimos desde {{2}}.

Nos contactaremos por este canal para encuestas internas y comunicaciones importantes de la empresa. Todo es confidencial.

Responde 1 para seguir por WhatsApp, 2 para email, 3 para más información.

Powered by FocalizaHR · Confidencial`,
    },
  },
};

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 · survey-invitation (twilio/call-to-action)
// ──────────────────────────────────────────────────────────────────────────
// Mapping conceptual de variables:
//   {{1}} ← participant_name
//   {{2}} ← company_name
//   {{3}} ← days_remaining
//   {{4}} ← survey_token   (se inyecta en la URL del botón)
//
// Importante: el dominio app.focalizahr.com debe estar verificado en Meta
// Business Manager ANTES del submit de aprobación Meta (Gate D). En sandbox
// el dominio no requiere verificación previa.
// ──────────────────────────────────────────────────────────────────────────

const TEMPLATE_SURVEY_INVITATION = {
  friendly_name: 'focalizahr_survey_invitation_es',
  language: 'es',
  variables: {
    '1': 'Carolina Pérez',     // sample de participant_name
    '2': 'Falabella',           // sample de company_name
    '3': '7',                   // sample de days_remaining
    '4': 'tok_a1b2c3d4e5',      // sample de survey_token
  },
  types: {
    'twilio/call-to-action': {
      // Body LITERAL de la skill §4.2, con footer embebido como última línea.
      // Mantiene las negritas con sintaxis WhatsApp (*texto*, un solo asterisco).
      body:
`Hola {{1}}, en {{2}} queremos conocer tu opinión.

La encuesta toma *5 minutos* y es *100% confidencial*. Solo se analiza en conjunto, nadie identifica respuestas individuales.

Te queda(n) *{{3}} día(s)* para responder.

FocalizaHR · Tu respuesta es confidencial`,
      actions: [
        {
          type: 'URL',
          title: 'Responder encuesta',
          url: 'https://app.focalizahr.com/encuesta/{{4}}',
        },
      ],
    },
    'twilio/text': {
      body:
`Hola {{1}}, en {{2}} queremos conocer tu opinión.

La encuesta toma 5 minutos y es 100% confidencial.

Te queda(n) {{3}} día(s) para responder: https://app.focalizahr.com/encuesta/{{4}}

FocalizaHR · Tu respuesta es confidencial`,
    },
  },
};

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 · survey-escalation (twilio/call-to-action) · GATE D
// ──────────────────────────────────────────────────────────────────────────
// Último recurso: el email no respondió -> WhatsApp. Copy basado en skill
// focalizahr-whatsapp-templates §4.4 con un ajuste documentado: "cierra manana"
// -> "cierra pronto" por correctitud temporal contra la logica de D3 (la frase
// "Si decides no responder, también está bien" desactiva el tono amenazante).
// Mapping conceptual:
//   {{1}} ← participant_name   {{2}} ← company_name   {{3}} ← survey_token (en la URL)
// ──────────────────────────────────────────────────────────────────────────

const TEMPLATE_SURVEY_ESCALATION = {
  friendly_name: 'focalizahr_survey_escalation_es',
  language: 'es',
  variables: {
    '1': 'Ana Ramírez',      // sample de participant_name
    '2': 'Falabella',         // sample de company_name
    '3': 'tok_a1b2c3d4e5',    // sample de survey_token
  },
  types: {
    'twilio/call-to-action': {
      body:
`Hola {{1}}, la encuesta de {{2}} cierra pronto.

Es la última instancia para que tu opinión quede registrada. Son 5 minutos. Confidencial.

Si decides no responder, también está bien. Solo queremos asegurarnos de no dejarte fuera.

FocalizaHR · Confidencial`,
      actions: [
        {
          type: 'URL',
          title: 'Abrir encuesta',
          url: 'https://app.focalizahr.com/encuesta/{{3}}',
        },
      ],
    },
    'twilio/text': {
      body:
`Hola {{1}}, la encuesta de {{2}} cierra pronto.

Es la última instancia para que tu opinión quede registrada. Son 5 minutos y es confidencial.

Si decides no responder, también está bien: https://app.focalizahr.com/encuesta/{{3}}

FocalizaHR · Confidencial`,
    },
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Helper: crear un template vía POST a Content API
// ──────────────────────────────────────────────────────────────────────────

async function createTemplate(payload, label) {
  const friendlyName = payload.friendly_name;
  console.log(`\n[${label}] Creando: ${friendlyName}`);

  try {
    const res = await fetch(TWILIO_CONTENT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.error(`[${label}] ❌ Falló`);
      console.error(`         HTTP ${res.status} ${res.statusText}`);
      console.error('         Body de respuesta:');
      console.error('         ' + JSON.stringify(data, null, 2).split('\n').join('\n         '));
      return { label, friendlyName, success: false, status: res.status, error: data };
    }

    const sid = data.sid;
    if (!sid || !sid.startsWith('HX')) {
      console.error(`[${label}] ❌ Respuesta sin sid válido`);
      console.error('         ' + JSON.stringify(data, null, 2).split('\n').join('\n         '));
      return { label, friendlyName, success: false, error: 'sin sid' };
    }

    console.log(`[${label}] ✅ OK · ${sid}`);
    return {
      label,
      friendlyName,
      contentSid: sid,
      language: data.language,
      dateCreated: data.date_created,
      success: true,
    };
  } catch (err) {
    console.error(`[${label}] ❌ Error de red: ${err.message}`);
    return { label, friendlyName, success: false, error: err.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('FocalizaHR · Crear templates WhatsApp en Twilio Content API');
  console.log('Gate C · channel-onboarding + survey-invitation');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Account: ${accountSidMasked}`);
  console.log('');
  console.log('⚠️  Este script NO verifica duplicados.');
  console.log('   Si ya creaste estos templates antes, se generarán copias');
  console.log('   con HX distintos. Para listar los existentes primero:');
  console.log('');
  console.log('   curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \\');
  console.log('     "https://content.twilio.com/v1/Content?PageSize=50" \\');
  console.log('     | jq \'.contents[] | {sid, friendly_name, language}\'');
  console.log('');

  // Mint SELECTIVO: `node create-whatsapp-templates.mjs survey-escalation` crea SOLO ese.
  // Sin args -> los 3 (comportamiento original). Evita duplicar/pisar HX de Gate C.
  const onlyArgs = process.argv.slice(2);
  const registry = [
    { tpl: TEMPLATE_CHANNEL_ONBOARDING, label: 'TEMPLATE 1', key: 'channel-onboarding' },
    { tpl: TEMPLATE_SURVEY_INVITATION,  label: 'TEMPLATE 2', key: 'survey-invitation' },
    { tpl: TEMPLATE_SURVEY_ESCALATION,  label: 'TEMPLATE 3', key: 'survey-escalation' },
  ];
  const selected = onlyArgs.length > 0
    ? registry.filter((r) => onlyArgs.includes(r.key) || onlyArgs.includes(r.tpl.friendly_name))
    : registry;
  if (selected.length === 0) {
    console.error(`Ningun template coincide con: ${onlyArgs.join(', ')}. Validos: ${registry.map((r) => r.key).join(', ')}`);
    process.exit(1);
  }
  console.log(`Creando ${selected.length} template(s): ${selected.map((r) => r.key).join(', ')}`);
  const results = [];
  for (const r of selected) {
    results.push(await createTemplate(r.tpl, r.label));
  }

  const success = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('RESUMEN');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Creados: ${success.length}/2     Fallidos: ${failed.length}/2`);
  console.log('');

  if (success.length > 0) {
    console.log('────────────────────────────────────────────────────────────');
    console.log('ContentSid generados (copiar a whatsapp-templates.ts)');
    console.log('────────────────────────────────────────────────────────────');
    console.log('');
    for (const r of success) {
      console.log(`  [${r.label}]`);
      console.log(`    friendly_name : ${r.friendlyName}`);
      console.log(`    contentSid    : ${r.contentSid}`);
      console.log(`    language      : ${r.language}`);
      console.log(`    dateCreated   : ${r.dateCreated}`);
      console.log('');
    }

    const output = {
      generatedAt: new Date().toISOString(),
      accountSidMasked,
      gate: 'C',
      templates: Object.fromEntries(
        success.map(r => [
          r.friendlyName,
          {
            contentSid: r.contentSid,
            language: r.language,
            dateCreated: r.dateCreated,
            internalSlug: r.friendlyName === 'focalizahr_channel_onboarding_es'
              ? 'channel-onboarding'
              : r.friendlyName === 'focalizahr_survey_invitation_es'
                ? 'campaign-invitation-whatsapp'
                : r.friendlyName === 'focalizahr_survey_escalation_es'
                  ? 'survey-escalation'
                  : null,
          },
        ])
      ),
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`📄 Resultado guardado en: ${OUTPUT_FILE}`);
    console.log('');
  }

  // ──────────────────────────────────────────────────────────────────────
  // Aclaración sobre cuenta trial y aprobación Meta
  // ──────────────────────────────────────────────────────────────────────
  console.log('════════════════════════════════════════════════════════════');
  console.log('Sobre cuenta TRIAL y aprobación Meta');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Crear Content templates vía Content API procede en cuenta');
  console.log('trial sin restricción. Los HX que acabas de obtener son');
  console.log('usables YA en el sandbox de WhatsApp para envíos IN-SESSION');
  console.log('(dentro de la ventana 24h después de que el destinatario');
  console.log('envíe "join <código-sandbox>" al número de Twilio).');
  console.log('');
  console.log('Esto es suficiente para correr el smoke C2 del Gate C.');
  console.log('');
  console.log('La aprobación formal de Meta NO se hace en este script.');
  console.log('Requiere WhatsApp Business Account vinculada (WABA), Meta');
  console.log('Business Manager verificado y dominio app.focalizahr.com');
  console.log('verificado. Todo eso queda para Gate D.');

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
