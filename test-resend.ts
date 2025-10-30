// Script para testing aislado de Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendDirect() {
  try {
    console.log('🧪 Testing Resend API directamente...');
    console.log('API Key:', process.env.RESEND_API_KEY ? '✅ Configurada' : '❌ NO configurada');
    
    const data = await resend.emails.send({
      from: 'FocalizaHR <noreply@focalizahr.com>',
      to: ['vyanezb@gmail.com'],  // ← CAMBIAR POR TU EMAIL
      subject: '🧪 Test Directo Resend - FocalizaHR-1312',
      html: '<h1>✅ Test exitoso</h1><p>Si recibes este email, Resend funciona correctamente.</p>'
    });

    console.log('✅ Email enviado:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testResendDirect();