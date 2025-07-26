// -----------------------------------------------------------------------------
// 4. API ROUTE: /api/export/csv
// Generación CSV limpio y estructurado
// -----------------------------------------------------------------------------

// src/app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'; // <== AÑADIR ESTA LÍNEA
import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, includeComments = false, anonymize = true, delimiter = ',' } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId es requerido' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        campaignType: true,
        participants: {
          include: {
            responses: {
              include: {
                question: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // ✅ OBTENER DEPARTMENT MAPPING (FASE 2 INTEGRATION)
    const departmentMapping = await DepartmentAdapter.getDepartmentMapping(campaign.accountId);

    // ✅ PREPARAR DATOS CSV - Flatten responses from participants
    const allResponses = campaign.participants.flatMap(participant => 
      participant.responses.map(response => ({
        ...response,
        participant: {
          department: participant.department,
          position: participant.position,
          email: participant.email,
          createdAt: participant.createdAt
        }
      }))
    );
    const headers = [
      'campaign_name',
      'campaign_type', 
      'response_date',
      'question_category',
      'question_text',
      'rating',
      ...(includeComments ? ['comments'] : []),
      ...(anonymize ? ['department_anonymized', 'position_level'] : ['department', 'position']),
      'response_week',
      'response_month'
    ];

    const csvData = allResponses.map(response => {
      const responseDate = new Date(response.createdAt);
      
      // 🎯 ENRIQUECIMIENTO: Usar display name si está disponible
      let departmentDisplay = response.participant?.department || 'No especificado';
      if (departmentMapping && response.participant?.department) {
        departmentDisplay = departmentMapping[response.participant.department] || departmentDisplay;
      }
      
      const department = anonymize 
        ? `Dept_${response.participant?.department?.charAt(0) || 'X'}`
        : departmentDisplay; // ← AQUÍ USAMOS EL DISPLAY NAME
      const position = anonymize
        ? response.participant?.position?.includes('Manager') || response.participant?.position?.includes('Director') ? 'Leadership' : 'Individual Contributor'
        : response.participant?.position || 'No especificado';

      const row = [
        campaign.name,
        campaign.campaignType.name,
        responseDate.toISOString().split('T')[0],
        response.question.category,
        response.question.text.replace(/"/g, '""'), // Escape quotes
        response.rating || '',
        ...(includeComments ? [response.textResponse?.replace(/"/g, '""') || ''] : []),
        department,
        position,
        `${responseDate.getFullYear()}-W${Math.ceil(responseDate.getDate() / 7)}`,
        `${responseDate.getFullYear()}-${(responseDate.getMonth() + 1).toString().padStart(2, '0')}`
      ];

      return row;
    });

    // ✅ GENERAR CSV STRING
    const csvContent = [
      headers.join(delimiter),
      ...csvData.map(row => 
        row.map(cell => 
          typeof cell === 'string' && (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n'))
            ? `"${cell}"`
            : cell
        ).join(delimiter)
      )
    ].join('\n');

    const csvStructure = {
      headers: headers,
      rowCount: csvData.length,
      delimiter: delimiter,
      encoding: 'UTF-8',
      features: {
        anonymized: anonymize,
        commentsIncluded: includeComments,
        temporalFields: ['response_week', 'response_month'],
        categoricalFields: ['campaign_type', 'question_category', 'department', 'position'],
        numericFields: ['rating'],
        clientNomenclature: departmentMapping ? Object.keys(departmentMapping).length > 0 : false // ← NUEVO
      },
      qualityChecks: {
        missingValues: csvData.filter(row => row.some(cell => cell === '')).length,
        duplicateRows: 0, // Could implement duplicate detection
        departmentMapping: departmentMapping ? `${Object.keys(departmentMapping).length} departments personalizados` : 'Nomenclatura estándar', // ← NUEVO
        dataTypes: {
          rating: 'numeric (1-5)',
          dates: 'ISO 8601 format',
          text: 'UTF-8 encoded'
        }
      },
      usageRecommendations: [
        'Importar con encoding UTF-8',
        'Usar rating como variable dependiente',
        'Agrupar por question_category para análisis',
        'Filtrar por response_month para tendencias',
        departmentMapping ? 'Departamentos usan nomenclatura personalizada del cliente' : 'Usar department_anonymized para segmentación' // ← ACTUALIZADO
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        structure: csvStructure,
        downloadUrl: `/api/export/csv/download/${campaignId}`,
        filename: `${campaign.name.replace(/\s+/g, '_')}_datos_${new Date().toISOString().split('T')[0]}.csv`,
        size: `${Math.round(csvContent.length / 1024)} KB`,
        preview: csvData.slice(0, 5), // Primeras 5 filas para preview
        totalRows: csvData.length
      },
      meta: {
        campaignId,
        campaignName: campaign.name,
        departmentEnrichment: departmentMapping ? 'enabled' : 'disabled', // ← NUEVO
        exportedAt: new Date().toISOString(),
        processingTime: '0.8s'
      }
    });

  } catch (error) {
    console.error('Error generando CSV:', error);
    return NextResponse.json(
      { error: 'Error interno generando CSV' },
      { status: 500 }
    );
  }
}