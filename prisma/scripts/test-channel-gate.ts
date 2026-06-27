// ════════════════════════════════════════════════════════════════════════════
// TEST GATE E.1 bloque 2 - determineChannel fail-closed (purpose + consent)
// prisma/scripts/test-channel-gate.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar:
//   npx tsx prisma/scripts/test-channel-gate.ts
//
// Prueba la PUERTA de consent de determineChannel (funcion pura, sin BD):
//   - CONTENIDO (default) + sin opt-in real -> NO whatsapp (cae a email o none).
//   - CONTENIDO + opt-in real (canReceivePersonalContent=true) -> whatsapp.
//   - SOLICITATION -> whatsapp aunque no haya opt-in real (pide el consent).
//   - DEFAULT fail-closed: sin purpose, se asume 'content'.
//   - El email corporativo NO pasa por el gate (se manda siempre que haya email).
// La derivacion del booleano (admin_loaded -> false) la prueba test-consent-derivation.
// ════════════════════════════════════════════════════════════════════════════

import { determineChannel } from '../../src/lib/services/channel-selector';

let pass = 0;
let fail = 0;
function assert(id: string, cond: boolean, detail: string) {
  if (cond) pass++;
  else fail++;
  console.log(`[${cond ? 'OK ' : 'XX '}] ${id} :: ${detail}`);
}

const phone = '+56911112222';
const email = 'corp@empresa.cl';

// 1. CONTENIDO + phone-only sin opt-in real -> none (NO whatsapp). Fail-closed.
assert('G-1',
  determineChannel({ phoneNumber: phone, canReceivePersonalContent: false }, { purpose: 'content' }) === 'none',
  'content + phone sin opt-in real -> none (no whatsapp)');

// 2. CONTENIDO default (sin purpose) + phone sin consent -> none. Default fail-closed.
assert('G-2',
  determineChannel({ phoneNumber: phone }) === 'none',
  'default (sin purpose) + phone sin consent -> none (default fail-closed)');

// 3. CONTENIDO + opt-in real -> whatsapp.
assert('G-3',
  determineChannel({ phoneNumber: phone, canReceivePersonalContent: true }, { purpose: 'content' }) === 'whatsapp',
  'content + opt-in real -> whatsapp');

// 4. SOLICITATION + phone sin consent -> whatsapp (pide el consent).
assert('G-4',
  determineChannel({ phoneNumber: phone, canReceivePersonalContent: false }, { purpose: 'solicitation' }) === 'whatsapp',
  'solicitation + phone sin consent -> whatsapp (la solicitud sí sale)');

// 5. Email corporativo NO pasa por el gate: con email, content sin consent -> email.
assert('G-5',
  determineChannel({ email, phoneNumber: phone, canReceivePersonalContent: false }, { purpose: 'content' }) === 'email',
  'email corporativo presente -> email (no lo gatea el consent)');

// 6. preferredChannel whatsapp pero sin opt-in real (content) -> NO gana, cae a email.
assert('G-6',
  determineChannel({ preferredChannel: 'whatsapp', email, phoneNumber: phone, canReceivePersonalContent: false }, { purpose: 'content' }) === 'email',
  'preferencia whatsapp sin opt-in real -> no gana (cae a email)');

// 7. preferredChannel whatsapp con opt-in real -> whatsapp.
assert('G-7',
  determineChannel({ preferredChannel: 'whatsapp', email, phoneNumber: phone, canReceivePersonalContent: true }, { purpose: 'content' }) === 'whatsapp',
  'preferencia whatsapp con opt-in real -> whatsapp');

// 8. Sin canal -> none.
assert('G-8',
  determineChannel({ canReceivePersonalContent: true }, { purpose: 'content' }) === 'none',
  'sin email ni phone -> none');

console.log(`\nGATE bloque 2: ${pass}/${pass + fail} PASS`);
process.exit(fail === 0 ? 0 : 1);
