// src/app/api/survey/[token]/save/route.ts
// API para guardado parcial de respuestas (auto-save)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/survey/[token]/save
 * Guarda respuestas parciales sin marcar como completada
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Buscar participante por token
    const participant = await prisma.participant.findUnique({
      where: { uniqueToken: token },
      select: {
        id: true,
        hasResponded: true,
        campaignId: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 404 }
      );
    }

    // No guardar si ya completó
    if (participant.hasResponded) {
      return NextResponse.json(
        { success: false, error: 'Encuesta ya completada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { responses } = body;

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { success: false, error: 'Respuestas inválidas' },
        { status: 400 }
      );
    }

    // Guardar respuestas parciales (findFirst + update/create)
    let savedCount = 0;
    for (const r of responses) {
      if (!r.questionId) continue;

      // Solo guardar si tiene algún dato
      const hasData = r.rating != null ||
        (r.textResponse && r.textResponse.trim()) ||
        (r.choiceResponse && r.choiceResponse.length > 0);

      if (!hasData) continue;

      const existing = await prisma.response.findFirst({
        where: {
          participantId: participant.id,
          questionId: r.questionId
        }
      });

      if (existing) {
        await prisma.response.update({
          where: { id: existing.id },
          data: {
            rating: r.rating ?? null,
            textResponse: r.textResponse ?? null,
            choiceResponse: r.choiceResponse
              ? JSON.stringify(r.choiceResponse)
              : null
          }
        });
      } else {
        await prisma.response.create({
          data: {
            participantId: participant.id,
            questionId: r.questionId,
            rating: r.rating ?? null,
            textResponse: r.textResponse ?? null,
            choiceResponse: r.choiceResponse
              ? JSON.stringify(r.choiceResponse)
              : null
          }
        });
      }
      savedCount++;
    }

    // Nota: El Participant no tiene campo status editable,
    // el estado se gestiona via hasResponded flag

    return NextResponse.json({
      success: true,
      savedCount,
      savedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[API] Error en auto-save:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
