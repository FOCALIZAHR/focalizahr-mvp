// src/app/api/test/participants/route.ts
import { NextResponse } from 'next/server';
import { generateUniqueToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🧪 Testing complete participants flow...');

    // Test 1: Función generateUniqueToken
    const token1 = generateUniqueToken();
    const token2 = generateUniqueToken();
    
    console.log('✅ Token 1 generated:', token1.substring(0, 16) + '...');
    console.log('✅ Token 2 generated:', token2.substring(0, 16) + '...');

    // Test 2: Verificar campaña de prueba existe
    const testCampaign = await prisma.campaign.findFirst({
      where: { status: 'draft' },
      include: { account: true }
    });

    if (!testCampaign) {
      return NextResponse.json({
        success: false,
        error: 'No hay campañas en estado draft para testing',
        suggestion: 'Crea una campaña de prueba primero'
      });
    }

    // Test 3: Simular carga participantes (mock data)
    const mockParticipants = [
      {
        email: 'test1@example.com',
        name: 'Test User 1',
        department: 'IT',
        position: 'Developer',
        location: 'Santiago'
      },
      {
        email: 'test2@example.com', 
        name: 'Test User 2',
        department: 'Marketing',
        position: 'Manager',
        location: 'Valparaíso'
      }
    ];

    // Test 4: Preparar datos como lo haría loadParticipantsToDatabase
    const participantsToInsert = mockParticipants.map(participant => ({
      campaignId: testCampaign.id,
      email: participant.email,
      uniqueToken: generateUniqueToken(), // Esta es la línea que falla
      name: participant.name,
      department: participant.department,
      position: participant.position,
      location: participant.location,
      hasResponded: false,
      createdAt: new Date(),
    }));

    console.log('✅ Mock data prepared successfully');
    console.log('✅ Tokens generated for participants:', 
      participantsToInsert.map(p => p.uniqueToken.substring(0, 16) + '...')
    );

    return NextResponse.json({
      success: true,
      message: 'Complete participants flow test successful',
      results: {
        generateUniqueTokenWorks: true,
        testCampaign: {
          id: testCampaign.id,
          name: testCampaign.name,
          status: testCampaign.status
        },
        mockParticipantsCount: mockParticipants.length,
        tokensGenerated: participantsToInsert.length,
        sampleTokens: participantsToInsert.map(p => ({
          email: p.email,
          tokenPreview: p.uniqueToken.substring(0, 16) + '...',
          tokenLength: p.uniqueToken.length
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error in participants flow test:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'Error occurred during flow testing'
    }, { status: 500 });
  }
}