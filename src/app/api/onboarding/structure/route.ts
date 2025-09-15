// src/app/api/onboarding/structure/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
// IMPORTANTE: Importar el DepartmentAdapter real que ya existe en tu proyecto
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter'

/**
 * API ENDPOINT: Guardar Estructura Organizacional
 * 
 * PRINCIPIOS ARQUITECTÓNICOS:
 * 1. NUNCA asignar standard_category directamente
 * 2. Usar niveles correctos: Level 2 = Gerencias, Level 3 = Departamentos
 * 3. DepartmentAdapter es la ÚNICA fuente de verdad para categorías
 * 4. Proceso en 2 fases: crear estructura, luego asignar categorías
 */

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // FASE 1: VERIFICACIÓN DE AUTENTICACIÓN
    // ==========================================
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token no proporcionado' }, 
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    let decoded: any
    
    try {
      decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' }, 
        { status: 401 }
      )
    }
    
    // ==========================================
    // FASE 2: OBTENER Y VALIDAR DATOS
    // ==========================================
    const body = await request.json()
    const { structure } = body
    
    // Usar accountId del token JWT (más seguro)
    const accountId = decoded.accountId
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'AccountId no encontrado en token' }, 
        { status: 400 }
      )
    }
    
    if (!structure?.gerencias || !Array.isArray(structure.gerencias)) {
      return NextResponse.json(
        { error: 'Estructura inválida: gerencias requeridas' }, 
        { status: 400 }
      )
    }
    
    // Verificar que la cuenta existe
    const account = await prisma.accounts.findUnique({
      where: { id: accountId }
    })
    
    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' }, 
        { status: 404 }
      )
    }
    
    // ==========================================
    // FASE 3: LIMPIAR ESTRUCTURA EXISTENTE (OPCIONAL)
    // ==========================================
    // Comentario: Decidir si queremos eliminar estructura anterior
    // o mantener histórico. Por ahora, eliminamos para evitar duplicados
    
    const existingDepartments = await prisma.departments.count({
      where: { account_id: accountId }
    })
    
    if (existingDepartments > 0) {
      console.log(`⚠️ Eliminando ${existingDepartments} departamentos existentes para cuenta ${accountId}`)
      await prisma.departments.deleteMany({
        where: { account_id: accountId }
      })
    }
    
    // ==========================================
    // FASE 4: CREAR ESTRUCTURA SIN CATEGORÍAS
    // ==========================================
    console.log('📦 Creando estructura organizacional...')
    
    const createdGerencias = []
    const createdDepartments = []
    
    for (const gerencia of structure.gerencias) {
      // Validar datos de gerencia
      if (!gerencia.displayName?.trim()) {
        console.warn('⚠️ Gerencia sin nombre, saltando...')
        continue
      }
      
      // CREAR GERENCIA - SIN standard_category
      const ger = await prisma.departments.create({
        data: {
          account_id: accountId,
          display_name: gerencia.displayName.trim(),
          unit_type: 'gerencia',
          level: 2,  // ✅ CORRECTO: Level 2 para gerencias
          is_active: true,
          // Campos opcionales con valores por defecto
          employee_count: 0,
          technical_complexity: 'media',
          emotional_complexity: 'media',
          market_scarcity: 'normal',
          // ❌ NO asignamos standard_category aquí
        }
      })
      
      createdGerencias.push(ger)
      console.log(`✅ Gerencia creada: ${ger.display_name} (ID: ${ger.id})`)
      
      // CREAR DEPARTAMENTOS HIJOS
      if (gerencia.departments && Array.isArray(gerencia.departments)) {
        for (const dept of gerencia.departments) {
          if (!dept.displayName?.trim()) {
            console.warn('⚠️ Departamento sin nombre, saltando...')
            continue
          }
          
          const createdDept = await prisma.departments.create({
            data: {
              account_id: accountId,
              display_name: dept.displayName.trim(),
              parent_id: ger.id,  // Referencia a la gerencia padre
              unit_type: 'departamento',
              level: 3,  // ✅ CORRECTO: Level 3 para departamentos
              is_active: true,
              // Campos opcionales con valores por defecto
              employee_count: 0,
              technical_complexity: 'media',
              emotional_complexity: 'media',
              market_scarcity: 'normal',
              // ❌ NO asignamos standard_category aquí
            }
          })
          
          createdDepartments.push(createdDept)
          console.log(`  ✅ Departamento creado: ${createdDept.display_name} (Padre: ${ger.display_name})`)
        }
      }
    }
    
    console.log(`📊 Estructura creada: ${createdGerencias.length} gerencias, ${createdDepartments.length} departamentos`)
    
    // ==========================================
    // FASE 5: ASIGNAR CATEGORÍAS CON DEPARTMENTADAPTER
    // ==========================================
    console.log('🏷️ Asignando categorías estándar usando DepartmentAdapter...')
    
    // Obtener TODOS los departamentos creados
    const allDepts = await prisma.departments.findMany({
      where: { account_id: accountId },
      orderBy: { level: 'asc' }  // Procesar gerencias primero
    })
    
    let categorizedCount = 0
    let uncategorizedCount = 0
    
    for (const dept of allDepts) {
      try {
        // USAR EL DEPARTMENTADAPTER - Única fuente de verdad
        // El DepartmentAdapter tiene la lógica de mapeo centralizada
        const category = DepartmentAdapter.getGerenciaCategory(dept.display_name)
        
        if (category && category !== 'sin_asignar') {
          await prisma.departments.update({
            where: { id: dept.id },
            data: { standard_category: category }
          })
          categorizedCount++
          console.log(`  ✅ ${dept.display_name} → categoría: ${category}`)
        } else {
          // Marcar para revisión manual posterior
          await prisma.departments.update({
            where: { id: dept.id },
            data: { 
              standard_category: 'sin_asignar',
              // Opcional: agregar flag para revisión
              notes: 'Requiere mapeo manual de categoría'
            }
          })
          uncategorizedCount++
          console.log(`  ⚠️ ${dept.display_name} → sin_asignar (requiere mapeo manual)`)
        }
      } catch (error) {
        console.error(`❌ Error asignando categoría a ${dept.display_name}:`, error)
        // Continuar con el siguiente departamento
      }
    }
    
    console.log(`🏷️ Categorización completada: ${categorizedCount} categorizados, ${uncategorizedCount} sin asignar`)
    
    // ==========================================
    // FASE 6: GENERAR ESTADÍSTICAS Y RESPUESTA
    // ==========================================
    const stats = await prisma.departments.groupBy({
      by: ['unit_type'],
      where: { account_id: accountId },
      _count: true
    })
    
    const categoryStats = await prisma.departments.groupBy({
      by: ['standard_category'],
      where: { 
        account_id: accountId,
        standard_category: { not: null }
      },
      _count: true
    })
    
    // Actualizar metadata de la cuenta (opcional)
    await prisma.accounts.update({
      where: { id: accountId },
      data: {
        organizationStructure: JSON.stringify({
          model: structure.model,
          createdAt: new Date().toISOString(),
          stats: {
            gerencias: createdGerencias.length,
            departamentos: createdDepartments.length,
            categorized: categorizedCount,
            uncategorized: uncategorizedCount
          }
        })
      }
    })
    
    // ==========================================
    // FASE 7: RESPUESTA EXITOSA
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Estructura organizacional creada exitosamente',
      stats: {
        gerencias: stats.find(s => s.unit_type === 'gerencia')?._count || 0,
        departamentos: stats.find(s => s.unit_type === 'departamento')?._count || 0,
        total: allDepts.length
      },
      categorization: {
        categorized: categorizedCount,
        uncategorized: uncategorizedCount,
        byCategory: categoryStats.map(c => ({
          category: c.standard_category,
          count: c._count
        }))
      },
      nextStep: '/dashboard',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error en API de estructura:', error)
    
    // Manejo de errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json(
          { error: 'Estructura duplicada detectada' },
          { status: 409 }
        )
      }
      if (error.message.includes('P2025')) {
        return NextResponse.json(
          { error: 'Registro no encontrado' },
          { status: 404 }
        )
      }
    }
    
    // Error genérico
    return NextResponse.json(
      { 
        error: 'Error interno al crear estructura organizacional',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Obtener estructura actual de la cuenta
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token no proporcionado' }, 
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded: any = verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const accountId = decoded.accountId
    
    // Obtener estructura actual
    const structure = await prisma.departments.findMany({
      where: { 
        account_id: accountId,
        unit_type: 'gerencia'
      },
      include: {
        children: {
          where: { unit_type: 'departamento' }
        }
      },
      orderBy: { display_name: 'asc' }
    })
    
    // Formatear respuesta
    const formattedStructure = {
      model: structure.length > 1 ? 'hierarchical' : 'simple',
      gerencias: structure.map(ger => ({
        id: ger.id,
        displayName: ger.display_name,
        standardCategory: ger.standard_category,
        departments: ger.children.map(dept => ({
          id: dept.id,
          displayName: dept.display_name,
          standardCategory: dept.standard_category
        }))
      }))
    }
    
    return NextResponse.json({
      success: true,
      structure: formattedStructure,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error obteniendo estructura:', error)
    return NextResponse.json(
      { error: 'Error al obtener estructura' },
      { status: 500 }
    )
  }
}