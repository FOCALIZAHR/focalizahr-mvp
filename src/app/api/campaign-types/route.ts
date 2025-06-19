// src/app/api/campaign-types/route.ts - OPTIMIZADO CHAT 3A
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache simple en memoria para tipos de campaña (datos relativamente estáticos)
interface CachedCampaignTypes {
  data: any;
  timestamp: number;
  etag: string;
}

let campaignTypesCache: CachedCampaignTypes | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos (más largo porque son datos estáticos)

// GET /api/campaign-types - Listar tipos de campaña disponibles
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar cache
    const now = Date.now()
    const clientETag = request.headers.get('if-none-match')
    
    if (campaignTypesCache && (now - campaignTypesCache.timestamp) < CACHE_TTL) {
      // Verificar ETag para 304 Not Modified
      if (clientETag && clientETag === campaignTypesCache.etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutos
            'ETag': campaignTypesCache.etag,
            'X-Cache-Status': 'HIT-304',
            'X-Response-Time': String(Date.now() - startTime)
          }
        })
      }

      // Cache hit - devolver datos
      const response = {
        ...campaignTypesCache.data,
        cache: {
          lastUpdated: new Date(campaignTypesCache.timestamp).toISOString(),
          ttl: Math.ceil((CACHE_TTL - (now - campaignTypesCache.timestamp)) / 1000),
          source: 'cache'
        },
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: true
        }
      }

      return new NextResponse(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'ETag': campaignTypesCache.etag,
          'X-Cache-Status': 'HIT',
          'X-Response-Time': String(Date.now() - startTime)
        }
      })
    }

    // Cache miss - consultar base de datos
    const campaignTypes = await prisma.campaignType.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        estimatedDuration: true,
        questionCount: true,
        methodology: true,
        category: true,
        sortOrder: true,
        
        // ✨ Agregamos estadísticas de uso Chat 3A
        _count: {
          select: {
            campaigns: {
              where: {
                status: { in: ['active', 'completed'] }
              }
            }
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Enriquecer datos con métricas adicionales
    const enrichedCampaignTypes = campaignTypes.map(type => {
      // Calcular popularidad relativa
      const totalUsage = campaignTypes.reduce((sum, t) => sum + t._count.campaigns, 0)
      const popularityScore = totalUsage > 0 
        ? Math.round((type._count.campaigns / totalUsage) * 100) 
        : 0

      // Determinar nivel de recomendación
      let recommendationLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
      if (type.questionCount && type.questionCount > 25) {
      recommendationLevel = 'advanced'
      } else if (type.questionCount && type.questionCount > 15) {
          recommendationLevel = 'intermediate'
}


      // Calcular tiempo estimado en formato legible
      const estimatedTimeText = type.estimatedDuration 
        ? `${type.estimatedDuration} min aprox.` 
        : 'Tiempo variable'

      return {
        id: type.id,
        name: type.name,
        slug: type.slug,
        description: type.description,
        estimatedDuration: type.estimatedDuration,
        questionCount: type.questionCount,
        methodology: type.methodology,
        category: type.category,
        
        // ✨ Métricas enriched Chat 3A
        usageCount: type._count.campaigns,
        popularityScore,
        recommendationLevel,
        estimatedTimeText,
        
        // Información para UI
        isPopular: popularityScore > 20,
        isRecommended: type.slug === 'pulso-express', // Tipo recomendado para beginners
        sortOrder: type.sortOrder,
        
        // Features/capabilities
        features: {
          quickSetup: type.slug === 'pulso-express',
          deepInsights: type.questionCount ? type.questionCount > 25 : false,
          scientificBasis: !!type.methodology,
          timeEfficient: (type.estimatedDuration || 0) <= 10
        }
      }
    })

    // Agrupar por categoría para mejor organización
    const categorizedTypes = enrichedCampaignTypes.reduce((acc, type) => {
      const category = type.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(type)
      return acc
    }, {} as Record<string, typeof enrichedCampaignTypes>)

    // Estadísticas generales
    const stats = {
      totalTypes: enrichedCampaignTypes.length,
      totalUsage: enrichedCampaignTypes.reduce((sum, t) => sum + t.usageCount, 0),
      averageQuestions: Math.round(
        enrichedCampaignTypes.reduce((sum, t) => sum + (t.questionCount || 0), 0) / enrichedCampaignTypes.length
      ),
      categories: Object.keys(categorizedTypes).length,
      mostPopular: enrichedCampaignTypes.reduce((prev, current) => 
        prev.usageCount > current.usageCount ? prev : current
      )
    }

    const queryTime = Date.now() - startTime

    // Preparar response
    const responseData = {
      success: true,
      campaignTypes: enrichedCampaignTypes,
      categorized: categorizedTypes,
      stats,
      recommendations: {
        forBeginners: enrichedCampaignTypes.filter(t => t.recommendationLevel === 'beginner'),
        popular: enrichedCampaignTypes.filter(t => t.isPopular),
        quickStart: enrichedCampaignTypes.filter(t => t.features.timeEfficient)
      },
      cache: {
        lastUpdated: new Date().toISOString(),
        ttl: 300, // 5 minutos
        source: 'database'
      },
      performance: {
        queryTime,
        cacheHit: false,
        recordCount: enrichedCampaignTypes.length
      },
      lastUpdated: new Date().toISOString()
    }

    // Generar ETag basado en datos
    const etag = `"types-${enrichedCampaignTypes.length}-${queryTime}"`

    // Guardar en cache
    campaignTypesCache = {
      data: responseData,
      timestamp: now,
      etag
    }

    // Headers optimizados para producción
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60') // 5 minutos cache público
    headers.set('ETag', etag)
    headers.set('X-Cache-Status', 'MISS')
    headers.set('X-Response-Time', String(queryTime))
    headers.set('Vary', 'Accept-Encoding') // Para compresión
    
    // Headers informativos
    headers.set('X-Total-Types', String(enrichedCampaignTypes.length))
    headers.set('X-Query-Time', String(queryTime))

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error fetching campaign types:', error)
    
    const errorResponse = {
      success: false,
      error: 'Error interno del servidor',
      code: 'CAMPAIGN_TYPES_ERROR',
      performance: {
        queryTime: Date.now() - startTime,
        cacheHit: false
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'X-Error-Time': String(Date.now() - startTime),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}



// Health check específico para campaign types
export async function HEAD(request: NextRequest) {
  try {
    const count = await prisma.campaignType.count({
      where: { isActive: true }
    })
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Campaign-Types-Count': String(count),
        'X-Service-Status': 'healthy',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Service-Status': 'unhealthy',
        'Cache-Control': 'no-cache'
      }
    })
  }
}