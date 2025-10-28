import { Resend } from 'resend';

const resend = new Resend('re_HUGFiaMC_BPGNYk2JixAzzMapUtrYji6G');

async function testEmail() {
  try {
    console.log('🚀 Enviando email de prueba...');
    console.log('🔑 API Key:', 're_HUGFiaMC_BPGNYk2JixAzzMapUtrYji6G');
    
    const result = await resend.emails.send({
      from: 'FocalizaHR <onboarding@resend.dev>',
      to: 'vyanezb@gmail.com',
      subject: 'Test FocalizaHR - Sistema Funcionando ✅',
      html: '<h1>Test</h1>'
    });

    console.log('\n📧 ===== RESPUESTA COMPLETA DE RESEND =====');
    console.log('Objeto completo:', JSON.stringify(result, null, 2));
    console.log('==========================================\n');
    
    console.log('Data:', result.data);
    console.log('Error:', result.error);
    
  } catch (error: any) {
    console.error('\n❌ ERROR CAPTURADO:');
    console.error('Nombre:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Completo:', JSON.stringify(error, null, 2));
  }
}

testEmail();