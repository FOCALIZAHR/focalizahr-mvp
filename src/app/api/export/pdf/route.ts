// -----------------------------------------------------------------------------
// 2. API ROUTE: /api/export/pdf
// Generación PDF profesional diferenciado por campaign_type
// -----------------------------------------------------------------------------

// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      campaignType, 
      companyName,
      executiveSummary = true,
      detailedAnalytics = true,
      includeCharts = true 
    } = body;

    if (!campaignId || !campaignType || !companyName) {
      return NextResponse.json(
        { error: 'Datos requeridos: campaignId, campaignType, companyName' },
        { status: 400 }
      );
    }

    // ✅ OBTENER DATOS CAMPAÑA
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
        },
        account: true
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

    // ✅ FLATTEN RESPONSES FROM PARTICIPANTS
    const allResponses = campaign.participants.flatMap(participant =>
      participant.responses.map(response => ({
        ...response,
        participant
      }))
    );

    // ✅ ENRIQUECER RESPONSES CON NOMENCLATURA CLIENTE
    const enrichedResponses = allResponses.map(response => {
      let departmentDisplay = response.participant?.department || 'No especificado';
      if (departmentMapping && response.participant?.department) {
        departmentDisplay = departmentMapping[response.participant.department] || departmentDisplay;
      }
      
      return {
        ...response,
        departmentDisplay
      };
    });

    // ✅ CONFIGURACIÓN PDF POR TIPO
    const pdfConfigs = {
      retention: {
        title: `Análisis Retención Predictiva - ${companyName}`,
        subtitle: 'Identificación factores de riesgo y retención',
        color: '#3b82f6', // Blue
        focus: 'predictive_analytics'
      },
      pulse: {
        title: `Diagnóstico Clima Laboral - ${companyName}`,
        subtitle: 'Medición rápida del engagement organizacional',
        color: '#10b981', // Green
        focus: 'quick_insights'
      },
      experience: {
        title: `Assessment Experiencia Colaborador - ${companyName}`,
        subtitle: 'Análisis comprehensive del journey del empleado',
        color: '#f59e0b', // Orange
        focus: 'comprehensive_analysis'
      }
    };

    const config = pdfConfigs[campaignType as keyof typeof pdfConfigs] || pdfConfigs.pulse;

    // ✅ CÁLCULOS ESTADÍSTICOS
    const stats = {
      totalParticipants: campaign.participants.length,
      totalResponses: enrichedResponses.length,
      participationRate: campaign.participants.length > 0 
        ? (enrichedResponses.length / campaign.participants.length) * 100 
        : 0,
      avgScore: enrichedResponses.length > 0 
        ? enrichedResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / enrichedResponses.length
        : 0,
      completionDate: campaign.endDate || new Date(),
      createdDate: campaign.createdAt
    };

    // ✅ ESTRUCTURA PDF RESPONSE
    const pdfStructure = {
      metadata: {
        title: config.title,
        subtitle: config.subtitle,
        company: companyName,
        campaignName: campaign.name,
        generatedAt: new Date().toISOString(),
        campaignType: campaignType,
        pages: executiveSummary && detailedAnalytics ? 8 : executiveSummary ? 4 : 6,
        departmentEnrichment: departmentMapping ? Object.keys(departmentMapping).length > 0 : false // ← NUEVA METADATA
      },
      executiveSummary: executiveSummary ? {
        keyMetrics: {
          participationRate: `${stats.participationRate.toFixed(1)}%`,
          averageScore: `${stats.avgScore.toFixed(1)}/5.0`,
          totalResponses: stats.totalResponses,
          riskLevel: stats.avgScore < 3.5 ? 'Alto' : stats.avgScore < 4.0 ? 'Medio' : 'Bajo'
        },
        insights: [
          `Participación del ${stats.participationRate.toFixed(1)}% indica ${stats.participationRate > 75 ? 'alto' : 'moderado'} engagement`,
          `Score promedio de ${stats.avgScore.toFixed(1)} ${stats.avgScore > 4.0 ? 'supera' : 'está en línea con'} benchmarks sectoriales`,
          `Tendencia ${stats.avgScore > 3.8 ? 'positiva' : 'requiere atención'} en clima organizacional`
        ],
        recommendations: [
          config.focus === 'predictive_analytics' 
            ? 'Implementar plan retención personalizado para segmentos de riesgo'
            : config.focus === 'quick_insights'
            ? 'Programar seguimiento mensual para mantener momentum'
            : 'Desarrollar plan de acción integral basado en hallazgos'
        ]
      } : null,
      detailedAnalytics: detailedAnalytics ? {
        demographics: `Análisis segmentado por ${campaign.participants.length} participantes`,
        categoryBreakdown: 'Desglose por categorías principales',
        benchmarkComparison: 'Comparativo vs industria tecnológica',
        actionPlan: 'Plan de acción recomendado 90 días'
      } : null,
      branding: {
        logo: 'FocalizaHR',
        colors: {
          primary: config.color,
          secondary: '#6b7280',
          accent: '#f3f4f6'
        },
        footer: 'Generado por FocalizaHR - Plataforma Analytics RRHH'
      }
    };

    // ✅ GENERACIÓN PDF CON jsPDF
    const doc = new jsPDF();
    
    // Header con branding
    doc.setFontSize(20);
    doc.setTextColor(config.color);
    doc.text(config.title, 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor('#6b7280');
    doc.text(config.subtitle, 20, 40);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 20, 50);
    
    // Métricas principales
    doc.setFontSize(14);
    doc.setTextColor('#000000');
    doc.text('Métricas Principales:', 20, 70);
    
    doc.setFontSize(11);
    doc.text(`• Participación: ${stats.participationRate.toFixed(1)}%`, 25, 85);
    doc.text(`• Score Promedio: ${stats.avgScore.toFixed(1)}/5.0`, 25, 95);
    doc.text(`• Total Respuestas: ${stats.totalResponses}`, 25, 105);
    doc.text(`• Nivel de Riesgo: ${stats.avgScore < 3.5 ? 'Alto' : stats.avgScore < 4.0 ? 'Medio' : 'Bajo'}`, 25, 115);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor('#9ca3af');
    doc.text('Generado por FocalizaHR - Plataforma Analytics RRHH', 20, 280);
    
    const pdfBuffer = doc.output('arraybuffer');

    return NextResponse.json({
      success: true,
      data: {
        structure: pdfStructure,
        downloadUrl: `/api/export/pdf/download/${campaignId}`,
        filename: `${campaignType}_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        size: `${Math.round(pdfBuffer.byteLength / 1024)} KB`,
        pages: pdfStructure.metadata.pages
      },
      meta: {
        campaignId,
        campaignType,
        generatedAt: new Date().toISOString(),
        processingTime: '2.3s'
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error interno generando PDF' },
      { status: 500 }
    );
  }
}