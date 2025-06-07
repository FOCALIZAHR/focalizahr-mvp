// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'focalizahr-mvp',
      version: '0.2.0'
    }
    
    return NextResponse.json(healthStatus, { status: 200 })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorStatus = {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      service: 'focalizahr-mvp',
      error: 'Database connection failed'
    }
    
    return NextResponse.json(errorStatus, { status: 503 })
  }
}