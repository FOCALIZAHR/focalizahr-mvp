// src/app/api/test/route.ts
import { NextResponse } from 'next/server';
import { generateUniqueToken } from '@/lib/auth';

export async function GET() {
  try {
    // Test 1: Verificar que la función existe
    console.log('🧪 Testing generateUniqueToken function...');
    
    if (typeof generateUniqueToken !== 'function') {
      return NextResponse.json({
        success: false,
        error: 'generateUniqueToken is not a function',
        type: typeof generateUniqueToken
      }, { status: 500 });
    }

    // Test 2: Generar múltiples tokens para verificar unicidad
    const tokens = [];
    for (let i = 0; i < 5; i++) {
      const token = generateUniqueToken();
      tokens.push(token);
    }

    // Test 3: Verificar propiedades de los tokens
    const tokenTests = tokens.map((token, index) => ({
      index,
      token: token.substring(0, 16) + '...', // Solo mostrar inicio por seguridad
      length: token.length,
      isString: typeof token === 'string',
      isHex: /^[a-f0-9]+$/i.test(token)
    }));

    // Test 4: Verificar unicidad
    const uniqueTokens = new Set(tokens);
    const allUnique = uniqueTokens.size === tokens.length;

    return NextResponse.json({
      success: true,
      message: 'generateUniqueToken function working correctly',
      results: {
        functionExists: true,
        tokensGenerated: tokens.length,
        allUnique,
        expectedLength: 64, // randomBytes(32).toString('hex') = 64 chars
        tokenTests
      }
    });

  } catch (error) {
    console.error('❌ Error testing generateUniqueToken:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}