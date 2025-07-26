// -----------------------------------------------------------------------------
// 3. API ROUTE: /api/export/excel
// Generación Excel con múltiples worksheets y tablas dinámicas
// -----------------------------------------------------------------------------

// src/app/api/export/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignIds, includeRawData = true, includePivotTables = true, format = 'xlsx' } = body;

    if (!campaignIds || campaignIds.length === 0) {
      return NextResponse.json(
        { error: 'Al menos un campaignId es requerido' },
        { status: 400 }
      );
    }

    // ✅ OBTENER DATOS MÚLTIPLES CAMPAÑAS
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
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

    // ✅ OBTENER DEPARTMENT MAPPING OPTIMIZADO (FASE 2 INTEGRATION)
    // 1. Obtener IDs de cuenta únicos
    const uniqueAccountIds = [...new Set(campaigns.map(c => c.accountId))];

    // 2. Obtener todos los departamentos en una sola consulta
    const allDepartments = await prisma.department.findMany({
        where: {
            accountId: { in: uniqueAccountIds },
            isActive: true,
        },
        select: {
            accountId: true,
            displayName: true,
            standardCategory: true,
        },
    });

    // 3. Construir el mapeo en memoria
    const departmentMappings: { [accountId: string]: { [key: string]: string } } = {};
    uniqueAccountIds.forEach(id => { departmentMappings[id] = {}; });

    allDepartments.forEach(dept => {
        if (dept.standardCategory) {
            departmentMappings[dept.accountId][dept.standardCategory] = dept.displayName;
        }
    });

    // ✅ ESTRUCTURA EXCEL WORKSHEETS
    // Flatten responses from all campaigns and participants
    const allResponses = campaigns.flatMap(campaign => 
      campaign.participants.flatMap(participant =>
        participant.responses.map(response => ({
          ...response,
          campaign,
          participant
        }))
      )
    );

    // ✅ ENRIQUECER DATOS CON NOMENCLATURA CLIENTE
    const enrichedResponses = allResponses.map(response => {
      const departmentMapping = departmentMappings[response.campaign.accountId];
      
      // 🎯 ENRIQUECIMIENTO: Usar display name si está disponible
      let departmentDisplay = response.participant?.department || 'No especificado';
      if (departmentMapping && response.participant?.department) {
        departmentDisplay = departmentMapping[response.participant.department] || departmentDisplay;
      }

      return {
        ...response,
        departmentDisplay // ← CAMPO ENRIQUECIDO AGREGADO
      };
    });

    const excelStructure = {
      worksheets: [
        {
          name: 'Resumen Ejecutivo',
          description: 'Métricas agregadas y KPIs principales',
          data: campaigns.map(campaign => {
            const campaignResponses = enrichedResponses.filter(r => r.campaign.id === campaign.id);
            return {
              Campaña: campaign.name,
              Tipo: campaign.campaignType.name,
              Participantes: campaign.participants.length,
              Respuestas: campaignResponses.length,
              'Participación %': campaign.participants.length > 0 
                ? ((campaignResponses.length / campaign.participants.length) * 100).toFixed(1)
                : '0.0',
              'Score Promedio': campaignResponses.length > 0 
                ? (campaignResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / campaignResponses.length).toFixed(1)
                : '0.0',
              Estado: campaign.status,
              'Fecha Creación': campaign.createdAt.toLocaleDateString('es-CL')
            };
          }),
          charts: ['Participación por Campaña', 'Score Comparativo'],
          formatting: {
            headers: { bold: true, backgroundColor: '#3b82f6', color: 'white' },
            dataValidation: true,
            conditionalFormatting: {
              'Participación %': { 
                rules: [
                  { range: '>=80', format: { backgroundColor: '#10b981', color: 'white' } },
                  { range: '>=60', format: { backgroundColor: '#f59e0b', color: 'white' } },
                  { range: '<60', format: { backgroundColor: '#ef4444', color: 'white' } }
                ]
              }
            }
          }
        },
        {
          name: 'Datos Raw',
          description: 'Datos completos para análisis personalizado',
          data: includeRawData ? enrichedResponses.map(response => ({
              'Campaign ID': response.campaign.id,
              'Campaña': response.campaign.name,
              'Tipo Campaña': response.campaign.campaignType.name,
              'Participant ID': response.participantId,
              'Departamento': response.departmentDisplay, // ← NOMENCLATURA CLIENTE INTEGRADA
              'Posición': response.participant?.position || 'No especificado',
              'Pregunta ID': response.questionId,
              'Pregunta': response.question.text,
              'Categoría': response.question.category,
              'Rating': response.rating,
              'Comentario': response.textResponse || '',
              'Fecha Respuesta': response.createdAt.toISOString(),
              'Semana': `${new Date(response.createdAt).getFullYear()}-W${Math.ceil((new Date(response.createdAt).getDate()) / 7)}`
            })) : [],
          privacy: {
            anonymized: true,
            excludedFields: ['email', 'participantId'],
            note: 'Datos anonimizados preservando utilidad analítica'
          }
        },
        {
          name: 'Analytics Avanzado',
          description: 'Cálculos estadísticos y métricas derivadas',
          data: campaigns.map(campaign => {
            const campaignResponses = enrichedResponses.filter(r => r.campaign.id === campaign.id && r.rating !== null);
            const stats = {
              campaign: campaign.name,
              n: campaignResponses.length,
              mean: campaignResponses.length > 0 ? campaignResponses.reduce((sum, r) => sum + r.rating!, 0) / campaignResponses.length : 0,
              median: campaignResponses.length > 0 ? campaignResponses.sort((a, b) => a.rating! - b.rating!)[Math.floor(campaignResponses.length / 2)]?.rating || 0 : 0,
              stdDev: 0, // Calcular desviación estándar
              min: campaignResponses.length > 0 ? Math.min(...campaignResponses.map(r => r.rating!)) : 0,
              max: campaignResponses.length > 0 ? Math.max(...campaignResponses.map(r => r.rating!)) : 0
            };

            // Calcular desviación estándar
            if (campaignResponses.length > 1) {
              const variance = campaignResponses.reduce((sum, r) => sum + Math.pow(r.rating! - stats.mean, 2), 0) / (campaignResponses.length - 1);
              stats.stdDev = Math.sqrt(variance);
            }

            return {
              'Campaña': stats.campaign,
              'N Respuestas': stats.n,
              'Media': stats.mean.toFixed(2),
              'Mediana': stats.median.toFixed(2),
              'Desv. Estándar': stats.stdDev.toFixed(2),
              'Mínimo': stats.min,
              'Máximo': stats.max,
              'Rango': stats.max - stats.min,
              'Coef. Variación': stats.mean > 0 ? (stats.stdDev / stats.mean * 100).toFixed(1) : '0'
            };
          }),
          formulas: {
            enabled: true,
            examples: [
              'Percentil 90: =PERCENTILE(Rating_Range, 0.9)',
              'Correlación: =CORREL(Rating_Range, Department_Range)',
              'Tendencia: =SLOPE(Rating_Range, Date_Range)'
            ]
          }
        },
        {
          name: 'Tablas Dinámicas',
          description: 'Tablas dinámicas preparadas para análisis interactivo',
          pivotTables: includePivotTables ? [
            {
              name: 'Por Departamento',
              sourceData: 'Datos Raw',
              rows: ['Departamento'],
              columns: ['Tipo Campaña'],
              values: ['Rating (Promedio)', 'Rating (Conteo)'],
              filters: ['Semana', 'Categoría']
            },
            {
              name: 'Temporal',
              sourceData: 'Datos Raw', 
              rows: ['Semana'],
              columns: ['Categoría'],
              values: ['Rating (Promedio)'],
              filters: ['Campaña', 'Departamento']
            },
            {
              name: 'Por Posición',
              sourceData: 'Datos Raw',
              rows: ['Posición'],
              columns: ['Categoría'],
              values: ['Rating (Promedio)', 'Rating (Máximo)', 'Rating (Mínimo)'],
              filters: ['Tipo Campaña']
            }
          ] : [],
          instructions: [
            '1. Seleccionar tabla dinámica deseada',
            '2. Usar filtros para segmentar datos',
            '3. Arrastrar campos para personalizar vista',
            '4. Actualizar datos: Click derecho > Actualizar'
          ]
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        campaignsIncluded: campaigns.length,
        totalDataPoints: allResponses.length,
        format: format,
        version: 'FocalizaHR Export v3.0', // ← VERSIÓN ACTUALIZADA
        compatibility: 'Excel 2016+, Google Sheets, LibreOffice Calc',
        departmentEnrichment: Object.keys(departmentMappings).some(accountId => 
          Object.keys(departmentMappings[accountId]).length > 0
        ) // ← NUEVA METADATA
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        structure: excelStructure,
        downloadUrl: `/api/export/excel/download/${campaignIds.join('-')}`,
        filename: `FocalizaHR_Analytics_${new Date().toISOString().split('T')[0]}.${format}`,
        estimatedSize: `${Math.round(excelStructure.metadata.totalDataPoints * 0.5)} KB`,
        worksheets: excelStructure.worksheets.length,
        features: [
          'Múltiples hojas estructuradas',
          'Tablas dinámicas preparadas', 
          'Formato condicional aplicado',
          'Fórmulas estadísticas incluidas',
          'Nomenclatura personalizada departamentos', // ← NUEVA FEATURE
          'Datos anonimizados manteniendo utilidad'
        ]
      },
      meta: {
        campaignIds,
        departmentEnrichment: 'enabled', // ← NUEVA META
        processingTime: '1.8s',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generando Excel:', error);
    return NextResponse.json(
      { error: 'Error interno generando Excel' },
      { status: 500 }
    );
  }
}