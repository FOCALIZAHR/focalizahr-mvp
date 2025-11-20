/**
 * API ENDPOINT: ONBOARDING BENCHMARK
 * 
 * GET /api/onboarding/benchmark
 * 
 * Query params:
 * - departmentId: ID del departamento a comparar (required)
 * - country: Código país ISO ('CL', 'AR', 'MX', 'ALL') (optional, default: 'CL')
 * 
 * Returns: Benchmark comparison + insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { OnboardingBenchmarkService } from '@/lib/services/OnboardingBenchmarkService';

// Países soportados
const SUPPORTED_COUNTRIES = ['CL', 'AR', 'MX', 'BR', 'CO', 'PE', 'UY', 'EC', 'ALL'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const country = searchParams.get('country') || 'CL';
    
    // Validación departmentId
    if (!departmentId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Parámetro departmentId es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Validación country
    if (!SUPPORTED_COUNTRIES.includes(country)) {
      return NextResponse.json(
        { 
          success: false,
          error: `País no soportado: ${country}. Valores válidos: ${SUPPORTED_COUNTRIES.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    console.log(`[API Benchmark] Request: departmentId=${departmentId}, country=${country}`);
    
    // Calcular benchmark
    const benchmarkData = await OnboardingBenchmarkService.getDepartmentBenchmark(
      departmentId,
      country
    );
    
    return NextResponse.json({
      success: true,
      data: benchmarkData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestedCountry: country,
        departmentCountry: benchmarkData.department.country
      }
    });
    
  } catch (error: any) {
    console.error('[API Benchmark] Error:', error);
    
    // Error handling específico
    if (error.message.includes('no encontrado')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 404 }
      );
    }
    
    if (error.message.includes('sin datos') || error.message.includes('No hay datos disponibles')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          hint: 'Este departamento o categoría aún no tiene suficientes datos para benchmark. Se requieren al menos 30 días de actividad.'
        },
        { status: 422 }
      );
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al calcular benchmark',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}