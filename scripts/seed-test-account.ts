// scripts/seed-test-account.ts
// Seed de CALIDAD para crear empresa de prueba sin departamentos
// Permite probar el wizard de estructura organizacional

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * SEED PROFESIONAL - CREAR EMPRESA DE PRUEBA
 * 
 * Características:
 * - Usa el schema real de la tabla accounts
 * - Hash de contraseña real con bcrypt
 * - Sin crear departamentos (para probar wizard)
 * - Datos realistas pero claramente de prueba
 * - Manejo de errores robusto
 */

async function seedTestAccount() {
  console.log('🚀 Iniciando creación de empresa de prueba...\n')
  
  // Configuración de la empresa de prueba
  const TEST_ACCOUNT = {
    companyName: 'Empresa Demo Wizard',
    adminEmail: 'demo@focalizahr.test',
    adminName: 'Admin Demo',
    password: 'Demo123456!', // Contraseña clara para pruebas
    subscriptionTier: 'basic',
    // Campos opcionales si existen en tu schema
    industry: 'tech',
    companySize: 'large', // Large para activar wizard automáticamente
  }

  try {
    // 1. Verificar si ya existe
    console.log('🔍 Verificando si la empresa de prueba ya existe...')
    const existingAccount = await prisma.account.findUnique({
      where: { adminEmail: TEST_ACCOUNT.adminEmail }
    })

    if (existingAccount) {
      console.log('⚠️  La empresa de prueba ya existe:')
      console.log(`    ID: ${existingAccount.id}`)
      console.log(`    Empresa: ${existingAccount.companyName}`)
      console.log(`    Email: ${existingAccount.adminEmail}`)
      console.log('')
      console.log('💡 Para usar esta cuenta:')
      console.log(`    Email: ${TEST_ACCOUNT.adminEmail}`)
      console.log(`    Password: ${TEST_ACCOUNT.password}`)
      console.log('')
      console.log('🔗 Acceso directo al wizard:')
      console.log('    http://localhost:3000/onboarding/structure')
      console.log('')
      console.log('📝 Para pruebas en consola del navegador:')
      console.log(`    localStorage.setItem('token', 'test-token-${existingAccount.id}')`)
      console.log(`    localStorage.setItem('accountId', '${existingAccount.id}')`)
      return existingAccount
    }

    // 2. Crear hash de contraseña real
    console.log('🔐 Generando hash de contraseña...')
    const passwordHash = await bcrypt.hash(TEST_ACCOUNT.password, 12)
    console.log('✅ Hash generado correctamente')

    // 3. Crear la cuenta
    console.log('📝 Creando empresa de prueba...')
    const newAccount = await prisma.account.create({
      data: {
        companyName: TEST_ACCOUNT.companyName,
        adminEmail: TEST_ACCOUNT.adminEmail,
        adminName: TEST_ACCOUNT.adminName,
        passwordHash: passwordHash,
        subscriptionTier: TEST_ACCOUNT.subscriptionTier,
        // Campos adicionales si existen en tu schema
        ...(TEST_ACCOUNT.industry && { industry: TEST_ACCOUNT.industry }),
        ...(TEST_ACCOUNT.companySize && { companySize: TEST_ACCOUNT.companySize }),
        // Límites por defecto para plan basic
        maxActiveCampaigns: 1,
        maxParticipantsPerCampaign: 500,
        maxCampaignDurationDays: 30,
      }
    })

    console.log('✅ Empresa de prueba creada exitosamente!\n')
    console.log('📊 Detalles de la cuenta:')
    console.log(`    ID: ${newAccount.id}`)
    console.log(`    Empresa: ${newAccount.companyName}`)
    console.log(`    Admin: ${newAccount.adminName}`)
    console.log(`    Email: ${newAccount.adminEmail}`)
    console.log(`    Tier: ${newAccount.subscriptionTier}`)
    if (newAccount.industry) console.log(`    Industria: ${newAccount.industry}`)
    if (newAccount.companySize) console.log(`    Tamaño: ${newAccount.companySize}`)
    console.log('')
    
    // 4. Verificar que NO se crearon departamentos
    const departmentCount = await prisma.department.count({
      where: { accountId: newAccount.id }
    })
    
    console.log('✅ Verificación de estructura:')
    console.log(`    Departamentos creados: ${departmentCount} (debe ser 0)`)
    console.log('')
    
    // 5. Instrucciones de uso
    console.log('📋 INSTRUCCIONES DE USO:')
    console.log('─────────────────────────────────────')
    console.log('')
    console.log('1️⃣  Para hacer login normal:')
    console.log(`    Email: ${TEST_ACCOUNT.adminEmail}`)
    console.log(`    Password: ${TEST_ACCOUNT.password}`)
    console.log('')
    console.log('2️⃣  Para ir directo al wizard (bypass login):')
    console.log('    En la consola del navegador ejecuta:')
    console.log(`    localStorage.setItem('token', 'test-jwt-token')`)
    console.log(`    localStorage.setItem('accountId', '${newAccount.id}')`)
    console.log(`    window.location.href = '/onboarding/structure'`)
    console.log('')
    console.log('3️⃣  Para verificar en Prisma Studio:')
    console.log('    npx prisma studio')
    console.log(`    Buscar: ${TEST_ACCOUNT.adminEmail}`)
    console.log('')
    console.log('⚠️  IMPORTANTE:')
    console.log('    Esta es una cuenta de PRUEBA.')
    console.log('    NO usar en producción.')
    console.log('─────────────────────────────────────')
    
    return newAccount

  } catch (error) {
    console.error('❌ Error creando empresa de prueba:', error)
    
    // Diagnóstico del error
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.log('💡 El email ya está en uso. Intenta con otro email.')
      } else if (error.message.includes('connect')) {
        console.log('💡 No se puede conectar a la BD. Verifica tu conexión.')
        console.log('   - Revisa DATABASE_URL en .env')
        console.log('   - Verifica que Supabase esté activo')
      } else {
        console.log('💡 Error desconocido. Revisa los logs.')
      }
    }
    
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Script para eliminar la cuenta de prueba
async function cleanupTestAccount() {
  console.log('🧹 Eliminando empresa de prueba...\n')
  
  try {
    const deleted = await prisma.account.deleteMany({
      where: { adminEmail: 'demo@focalizahr.test' }
    })
    
    if (deleted.count > 0) {
      console.log('✅ Empresa de prueba eliminada')
    } else {
      console.log('ℹ️  No se encontró empresa de prueba para eliminar')
    }
  } catch (error) {
    console.error('❌ Error eliminando:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar según argumentos
const command = process.argv[2]

if (command === 'cleanup') {
  cleanupTestAccount()
    .then(() => console.log('\n✨ Limpieza completada'))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
} else {
  seedTestAccount()
    .then(() => console.log('\n✨ Seed completado'))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

/**
 * CÓMO USAR ESTE SEED:
 * 
 * 1. Crear empresa de prueba:
 *    npx tsx scripts/seed-test-account.ts
 * 
 * 2. Eliminar empresa de prueba:
 *    npx tsx scripts/seed-test-account.ts cleanup
 * 
 * 3. Si no tienes tsx instalado:
 *    npm install -D tsx
 *    O usa: npx ts-node scripts/seed-test-account.ts
 */