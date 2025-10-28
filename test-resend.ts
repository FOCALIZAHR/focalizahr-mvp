// test-resend.ts
import { config } from 'dotenv';
import { Resend } from 'resend';
import { resolve } from 'path';

// ✅ CARGAR .env.local EXPLÍCITAMENTE
config({ path: resolve(process.cwd(), '.env.local') });

console.log('📂 Directorio de trabajo:', process.cwd());
console.log('🔍 Archivo .env.local:', resolve(process.cwd(), '.env.local'));
console.log('🔑 RESEND_API_KEY cargada:', process.env.RESEND_API_KEY ? '✅ SÍ' : '❌ NO');

if (!process.env.RESEND_API_KEY) {
  console.error('\n❌ ERROR: No se pudo cargar RESEND_API_KEY desde .env.local');
  console.error('📝 Verifica que estás ejecutando el script desde la raíz del proyecto');
  process.exit(1);
}

console.log('🔑 API Key (primeros 10 chars):', process.env.RESEND_API_KEY.substring(0, 10) + '...');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('\n🚀 Enviando email de prueba...');
    
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
            <h2 style="color: #1e293b; margin-top: 0;">Detalles del Test</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;"><strong>Fecha:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${new Date().toLocaleString('es-CL')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;"><strong>API Key:</strong></td>
                <td style="padding: 10px 0; text-align: right;">re_HUGFiaMC... (verificada)</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;"><strong>Remitente:</strong></td>
                <td style="padding: 10px 0; text-align: right;">onboarding@resend.dev</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b;"><strong>Sistema:</strong></td>
                <td style="padding: 10px 0; text-align: right;">FocalizaHR MVP</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #dcfce7; border-radius: 8px;">
            <p style="color: #166534; margin: 0; font-weight: 600;">
              🎉 Tu configuración de Resend está lista para producción
            </p>
          </div>
        </div>
      `
    });

    console.log('\n✅ ¡EMAIL ENVIADO EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Resend Email ID:', result.data?.id);
    console.log('📩 Destinatario:', 'vyanezb@gmail.com');
    console.log('🔗 Dashboard Resend:', 'https://resend.com/emails');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Revisa tu bandeja de entrada (vyanezb@gmail.com)');
    console.log('2. Verifica en https://resend.com/emails');
    console.log('3. Confirma que "Total Uses" cambió de 0 a 1');
    console.log('4. Si todo funciona, tu sistema de emails está listo ✅');
    
  } catch (error: any) {
    console.error('\n❌ ERROR AL ENVIAR EMAIL:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Causa probable: API Key inválida o revocada');
      console.error('   Solución: Verifica en https://resend.com/api-keys');
    } else if (error.message.includes('rate limit')) {
      console.error('\n💡 Causa probable: Límite de envíos excedido');
      console.error('   Solución: Espera o upgrade tu plan');
    } else if (error.message.includes('network')) {
      console.error('\n💡 Causa probable: Problema de conexión');
      console.error('   Solución: Verifica tu internet y firewall');
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testEmail();