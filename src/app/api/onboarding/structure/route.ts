// src/app/api/onboarding/structure/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// IMPORTANTE: Importar el DepartmentAdapter real que ya existe en tu proyecto
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter'

/**
 * API ENDPOINT: Guardar Estructura Organizacional
 * SOLO PARA ADMINISTRADORES FOCALIZAHR_ADMIN
 * 
 * PRINCIPIOS ARQUITECTÓNICOS:
 * 1. NUNCA asignar standard_category directamente
 * 2. Usar niveles correctos: Level 1 = CEO, Level 2 = Gerencias, Level 3 = Departamentos
 * 3. DepartmentAdapter es la ÚNICA fuente de verdad para categorías
 * 4. Proceso en 2 fases: crear estructura, luego asignar categorías
 * 5. SOLO administradores pueden crear estructuras para clientes
 */

export async function POST(request: NextRequest) {
  try {
    // ==========================================
    // FASE 1: VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN ADMIN
    // ==========================================
    const authHeader = request.headers.get('Authorization')
    const { validateAuthToken } = await import('@/lib/auth')
    const validation = await validateAuthToken(authHeader, request)
    
    if (!validation.success || !validation.account) {
      return NextResponse.json(
        { error: validation.error || 'No autorizado' },
        { status: 401 }
      )
    }
    
    // VERIFICAR ROL ADMIN - SOLO FOCALIZAHR_ADMIN PUEDE CREAR ESTRUCTURAS
    if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores de FocalizaHR pueden crear estructuras' },
        { status: 403 }
      )
    }
    
    const decoded = validation.account
    
    // ==========================================
    // FASE 2: OBTENER Y VALIDAR DATOS
    // ==========================================
    const body = await request.json()
    const { structure } = body
    
    // Usar accountId del body (admin especifica para qué cuenta es)
    const accountId = body.accountId || decoded.id
    
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
    
    // Verificar que la cuenta existe - CORRECCIÓN: usar prisma.account
    const account = await prisma.account.findUnique({
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
    
    const existingDepartments = await prisma.department.count({
      where: { accountId: accountId }  // CORRECCIÓN: accountId en camelCase
    })
    
    if (existingDepartments > 0) {
      console.log(`⚠️ Eliminando ${existingDepartments} departamentos existentes para cuenta ${accountId}`)
      await prisma.department.deleteMany({
        where: { accountId: accountId }  // CORRECCIÓN: accountId en camelCase
      })
    }
    
    // ==========================================
    // FASE 4: CREAR ESTRUCTURA SIN CATEGORÍAS
    // ==========================================
    console.log('📦 Creando estructura organizacional...')
    
    // ============ PASO 4: BUSCAR O CREAR CEO ============
    // Buscar el CEO/Nivel 1 de esta cuenta
    const ceo = await prisma.department.findFirst({
      where: {
        accountId: accountId,
        level: 1,
        unitType: 'direccion'
      }
    });

    // Si no existe CEO (empresas creadas antes del cambio), crearlo
    let ceoId = ceo?.id;
    if (!ceo) {
      console.log('⚠️ No se encontró CEO, creando uno...');
      const newCeo = await prisma.department.create({
        data: {
          accountId: accountId,
          displayName: 'Gerencia General',
          unitType: 'direccion',
          level: 1,
          isActive: true,
          parentId: null,
          standardCategory: null,
          employeeCount: 0,
          technicalComplexity: 'media',
          emotionalComplexity: 'media',
          marketScarcity: 'normal'
        }
      });
      ceoId = newCeo.id;
      console.log('✅ CEO nivel 1 creado retroactivamente');
    } else {
      console.log('✅ CEO existente encontrado');
    }
    // ============ FIN PASO 4 ============
    
    const createdGerencias = []
    const createdDepartments = []
    
    for (const gerencia of structure.gerencias) {
      // Validar datos de gerencia
      if (!gerencia.displayName?.trim()) {
        console.warn('⚠️ Gerencia sin nombre, saltando...')
        continue
      }
      
      // CREAR GERENCIA - SIN standard_category, CON parentId al CEO
      const ger = await prisma.department.create({
        data: {
          accountId: accountId,  // CORRECCIÓN: accountId en camelCase
          displayName: gerencia.displayName.trim(),  // CORRECCIÓN: displayName en camelCase
          unitType: 'gerencia',  // CORRECCIÓN: unitType en camelCase
          level: 2,  // ✅ CORRECTO: Level 2 para gerencias
          parentId: ceoId,  // ✅ AGREGADO: Las gerencias son hijas del CEO
          isActive: true,  // CORRECCIÓN: isActive en camelCase
          // Campos opcionales con valores por defecto
          employeeCount: 0,  // CORRECCIÓN: employeeCount en camelCase
          technicalComplexity: 'media',  // CORRECCIÓN: technicalComplexity en camelCase
          emotionalComplexity: 'media',  // CORRECCIÓN: emotionalComplexity en camelCase
          marketScarcity: 'normal',  // CORRECCIÓN: marketScarcity en camelCase
          // ❌ NO asignamos standard_category aquí
        }
      })
      
      createdGerencias.push(ger)
      console.log(`✅ Gerencia creada: ${ger.displayName} (ID: ${ger.id})`)
      
      // CREAR DEPARTAMENTOS HIJOS
      if (gerencia.departments && Array.isArray(gerencia.departments)) {
        for (const dept of gerencia.departments) {
          if (!dept.displayName?.trim()) {
            console.warn('⚠️ Departamento sin nombre, saltando...')
            continue
          }
          
          const createdDept = await prisma.department.create({  // CORRECCIÓN: department singular
            data: {
              accountId: accountId,  // CORRECCIÓN: accountId en camelCase
              displayName: dept.displayName.trim(),  // CORRECCIÓN: displayName en camelCase
              parentId: ger.id,  // CORRECCIÓN: parentId en camelCase - Referencia a la gerencia padre
              unitType: 'departamento',  // CORRECCIÓN: unitType en camelCase
              level: 3,  // ✅ CORRECTO: Level 3 para departamentos
              isActive: true,  // CORRECCIÓN: isActive en camelCase
              // Campos opcionales con valores por defecto
              employeeCount: 0,  // CORRECCIÓN: employeeCount en camelCase
              technicalComplexity: 'media',  // CORRECCIÓN: technicalComplexity en camelCase
              emotionalComplexity: 'media',  // CORRECCIÓN: emotionalComplexity en camelCase
              marketScarcity: 'normal',  // CORRECCIÓN: marketScarcity en camelCase
              // ❌ NO asignamos standard_category aquí
            }
          })
          
          createdDepartments.push(createdDept)
          console.log(`  ✅ Departamento creado: ${createdDept.displayName} (Padre: ${ger.displayName})`)
        }
      }
    }
    
    console.log(`📊 Estructura creada: ${createdGerencias.length} gerencias, ${createdDepartments.length} departamentos`)
    
    // ==========================================
    // FASE 5: ASIGNAR CATEGORÍAS CON DEPARTMENTADAPTER
    // ==========================================
    console.log('🏷️ Asignando categorías estándar usando DepartmentAdapter...')
    
    // Obtener TODOS los departamentos creados (incluyendo CEO, gerencias y departamentos)
    const allDepts = await prisma.department.findMany({  // CORRECCIÓN: department singular
      where: { accountId: accountId },  // CORRECCIÓN: accountId en camelCase
      orderBy: { level: 'asc' }  // Procesar por nivel: CEO primero, luego gerencias, luego departamentos
    })
    
    let categorizedCount = 0
    let uncategorizedCount = 0
    
    for (const dept of allDepts) {
      try {
        // El CEO (nivel 1) no necesita categoría
        if (dept.level === 1) {
          console.log(`⏭️ CEO "${dept.displayName}" - Sin categorización necesaria`)
          continue
        }
        
        // USAR EL DEPARTMENTADAPTER - Única fuente de verdad
        // El DepartmentAdapter tiene la lógica de mapeo centralizada
        const category = DepartmentAdapter.getGerenciaCategory(dept.displayName)  // CORRECCIÓN: displayName en camelCase
        
        if (category && category !== 'sin_asignar') {
          await prisma.department.update({  // CORRECCIÓN: department singular
            where: { id: dept.id },
            data: { standardCategory: category }  // CORRECCIÓN: standardCategory en camelCase
          })
          categorizedCount++
          console.log(`  ✅ ${dept.displayName} → categoría: ${category}`)
        } else {
          // Marcar para revisión manual posterior
          await prisma.department.update({  // CORRECCIÓN: department singular
            where: { id: dept.id },
            data: { 
              standardCategory: 'sin_asignar'  // CORRECCIÓN: standardCategory en camelCase
            }
          })
          uncategorizedCount++
          console.log(`  ⚠️ ${dept.displayName} → sin_asignar (requiere mapeo manual)`)
        }
      } catch (error) {
        console.error(`❌ Error asignando categoría a ${dept.displayName}:`, error)
        // Continuar con el siguiente departamento
      }
    }
    
    console.log(`🏷️ Categorización completada: ${categorizedCount} categorizados, ${uncategorizedCount} sin asignar`)
    
    // ==========================================
    // FASE 6: GENERAR ESTADÍSTICAS Y RESPUESTA
    // ==========================================
    const stats = await prisma.department.groupBy({  // CORRECCIÓN: department singular
      by: ['unitType'],  // CORRECCIÓN: unitType en camelCase
      where: { accountId: accountId },  // CORRECCIÓN: accountId en camelCase
      _count: true
    })
    
    const categoryStats = await prisma.department.groupBy({  // CORRECCIÓN: department singular
      by: ['standardCategory'],  // CORRECCIÓN: standardCategory en camelCase
      where: { 
        accountId: accountId,  // CORRECCIÓN: accountId en camelCase
        standardCategory: { not: null }  // CORRECCIÓN: standardCategory en camelCase
      },
      _count: true
    })
    // ELIMINADO: El campo organizationStructure NO existe en el schema Account
    // No hay necesidad de actualizar la cuenta aquí
    
    // ==========================================
    // FASE 7: RESPUESTA EXITOSA
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Estructura organizacional creada exitosamente',
      stats: {
        gerencias: stats.find(s => s.unitType === 'gerencia')?._count || 0,  // CORRECCIÓN: unitType en camelCase
        departamentos: stats.find(s => s.unitType === 'departamento')?._count || 0,  // CORRECCIÓN: unitType en camelCase
        total: allDepts.length
      },
      categorization: {
        categorized: categorizedCount,
        uncategorized: uncategorizedCount,
        byCategory: categoryStats.map(c => ({
          category: c.standardCategory,  // CORRECCIÓN: standardCategory en camelCase
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
    // Verificar autenticación y rol admin
    const authHeader = request.headers.get('Authorization')
    const { validateAuthToken } = await import('@/lib/auth')
    const validation = await validateAuthToken(authHeader, request)
    
    if (!validation.success || !validation.account) {
      return NextResponse.json(
        { error: validation.error || 'No autorizado' },
        { status: 401 }
      )
    }
    
    // SOLO ADMIN PUEDE VER ESTRUCTURAS
    if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores' },
        { status: 403 }
      )
    }
    
    // Admin puede especificar qué cuenta ver
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId') || validation.account.id
    
    // Obtener estructura actual
    const structure = await prisma.department.findMany({  // CORRECCIÓN: department singular
      where: { 
        accountId: accountId,  // CORRECCIÓN: accountId en camelCase
        unitType: 'gerencia'  // CORRECCIÓN: unitType en camelCase
      },
      include: {
        children: {
          where: { unitType: 'departamento' }  // CORRECCIÓN: unitType en camelCase
        }
      },
      orderBy: { displayName: 'asc' }  // CORRECCIÓN: displayName en camelCase
    })
    
    // Formatear respuesta
    const formattedStructure = {
      model: structure.length > 1 ? 'hierarchical' : 'simple',
      gerencias: structure.map(ger => ({
        id: ger.id,
        displayName: ger.displayName,  // CORRECCIÓN: displayName en camelCase
        standardCategory: ger.standardCategory,  // CORRECCIÓN: standardCategory en camelCase
        departments: ger.children.map(dept => ({
          id: dept.id,
          displayName: dept.displayName,  // CORRECCIÓN: displayName en camelCase
          standardCategory: dept.standardCategory  // CORRECCIÓN: standardCategory en camelCase
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