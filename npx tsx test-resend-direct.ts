// test-resend-direct.ts
import { Resend } from 'resend';

// ✅ API Key directo - SOLO PARA TEST
const resend = new Resend('re_HUGFiaMC_BPGNYk2JixAzzMapUtrYji6G');

async function testEmail() {
  try {
    console.log('🚀 Enviando email de prueba con API Key directa...');
    
    const result = await resend.emails.send({
      from: 'FocalizaHR <onboarding@resend.dev>',
      to: 'vyanezb@gmail.com',
      subject: 'Test FocalizaHR - Sistema Funcionando ✅',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); padding: 40px; text-align: center; border-radius: 12px;">
            <h1 style="color: white; margin: 0; font-size: 32px;">✅ ÉXITO</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">
              Sistema de emails funcionando correctamente
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-top: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">✅ Test Exitoso</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
            <p><strong>API Key:</strong> re_HUGFiaMC... (verificada)</p>
            <p><strong>Remitente:</strong> onboarding@resend.dev</p>
            <p style="color: #22C55E; font-weight: 600; margin-top: 20px;">
              🎉 Tu cuenta Resend está activa y funcionando
            </p>
          </div>
        </div>
      `
    });

    console.log('\n✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Resend Email ID:', result.data?.id);
    console.log('📩 Destinatario: vyanezb@gmail.com');
    console.log('🔗 Dashboard: https://resend.com/emails');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 VERIFICA:');
    console.log('1. Email llegó a tu bandeja (vyanezb@gmail.com)');
    console.log('2. En https://resend.com/api-keys cambió de "0 uses" a "1 use"');
    console.log('3. En https://resend.com/emails aparece el email enviado');
    
  } catch (error: any) {
    console.error('\n❌ ERROR AL ENVIAR EMAIL:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testEmail();