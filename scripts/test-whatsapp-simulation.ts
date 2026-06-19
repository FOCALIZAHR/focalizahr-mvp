// ════════════════════════════════════════════════════════════════════════════
// SMOKE - whatsapp-service en modo simulation - Gate B v3.0
// scripts/test-whatsapp-simulation.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar: npx tsx scripts/test-whatsapp-simulation.ts
//
// Verifica el contrato del modo simulation SIN BD y SIN envio real:
//   - emite el log estructurado [WhatsApp SIMULATION]
//   - retorna success=true, messageId 'sim_...', cost 0
// ════════════════════════════════════════════════════════════════════════════

// Forzar simulation por si el entorno no lo trae.
process.env.TWILIO_MODE = 'simulation';

import { sendWhatsApp } from '../src/lib/services/whatsapp-service';

async function main() {
  let passed = 0;
  let failed = 0;
  const check = (label: string, cond: boolean) => {
    if (cond) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.log(`  FAIL  ${label}`); }
  };

  console.log('\n=== whatsapp-service simulation smoke (Gate B) ===\n');

  const result = await sendWhatsApp({
    to: '+56912345678',
    templateId: 'HX_PENDIENTE_META',
    variables: {
      participant_name: 'Test Persona',
      company_name: 'Empresa Demo',
      survey_url: 'http://localhost:3000/encuesta/token-demo',
    },
  });

  console.log('\n  resultado:', JSON.stringify(result), '\n');

  check('success === true', result.success === true);
  if (result.success) {
    check('messageId empieza con sim_', result.messageId.startsWith('sim_'));
    check('cost === 0 (simulation, cero costo)', result.cost === 0);
  }

  console.log(`\n=== Resultado: ${passed} PASS, ${failed} FAIL ===\n`);
  if (failed > 0) process.exit(1);
}

main();
