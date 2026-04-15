// ════════════════════════════════════════════════════════════════════════════
// BACKFILL — JobDescriptor.standardCategory
// prisma/scripts/backfill-descriptor-categories.ts
// ════════════════════════════════════════════════════════════════════════════
// Asigna standardCategory a JobDescriptors que la tienen null.
//
// ESTRATEGIA POR DESCRIPTOR:
//   1. Si tiene departmentId válido → leer Department.standardCategory directo
//   2. Si no → buscar Employees activos con position == descriptor.jobTitle,
//      tomar el departmentId más común (mode), heredar de ese Department
//   3. Si tampoco → log warning, dejar null
//
// USO:
//   npx tsx prisma/scripts/backfill-descriptor-categories.ts
//   npx tsx prisma/scripts/backfill-descriptor-categories.ts --dry-run
//   npx tsx prisma/scripts/backfill-descriptor-categories.ts --account=<id>
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry-run')
const accountFilter = process.argv.find(a => a.startsWith('--account='))?.split('=')[1]

interface Stats {
  total: number
  fromDepartment: number
  fromEmployees: number
  unresolved: number
  updated: number
}

function mode<T>(values: T[]): T | null {
  const counts = new Map<T, number>()
  for (const v of values) {
    if (v == null) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best: T | null = null
  let bestCount = 0
  for (const [k, c] of counts.entries()) {
    if (c > bestCount) {
      best = k
      bestCount = c
    }
  }
  return best
}

async function main() {
  console.log('🔧 BACKFILL — JobDescriptor.standardCategory')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'EXECUTE (writes to DB)'}`)
  if (accountFilter) console.log(`Account filter: ${accountFilter}`)
  console.log()

  const stats: Stats = {
    total: 0,
    fromDepartment: 0,
    fromEmployees: 0,
    unresolved: 0,
    updated: 0,
  }

  const descriptors = await prisma.jobDescriptor.findMany({
    where: {
      standardCategory: null,
      ...(accountFilter ? { accountId: accountFilter } : {}),
    },
    select: {
      id: true,
      accountId: true,
      jobTitle: true,
      departmentId: true,
    },
  })

  stats.total = descriptors.length
  console.log(`Descriptors a procesar: ${stats.total}\n`)

  for (const desc of descriptors) {
    let resolvedCategory: string | null = null
    let resolvedDepartmentId: string | null = null
    let source: 'department' | 'employees' | 'unresolved' = 'unresolved'

    // Estrategia 1: departmentId válido
    if (desc.departmentId && desc.departmentId !== '') {
      const dept = await prisma.department.findUnique({
        where: { id: desc.departmentId },
        select: { standardCategory: true },
      })
      if (dept?.standardCategory) {
        resolvedCategory = dept.standardCategory
        source = 'department'
      }
    }

    // Estrategia 2: derivar de empleados con esa position
    if (!resolvedCategory) {
      const employees = await prisma.employee.findMany({
        where: {
          accountId: desc.accountId,
          isActive: true,
          status: 'ACTIVE',
          position: desc.jobTitle,
        },
        select: { departmentId: true },
      })
      const dominantDeptId = mode(employees.map(e => e.departmentId))
      if (dominantDeptId) {
        const dept = await prisma.department.findUnique({
          where: { id: dominantDeptId },
          select: { standardCategory: true },
        })
        if (dept?.standardCategory) {
          resolvedCategory = dept.standardCategory
          resolvedDepartmentId = dominantDeptId
          source = 'employees'
        }
      }
    }

    // Logging
    const tag =
      source === 'department' ? '[DEPT]'
      : source === 'employees' ? '[EMPS]'
      : '[NONE]'
    console.log(`  ${tag} ${desc.jobTitle.padEnd(40)} → ${resolvedCategory ?? 'null'}`)

    if (source === 'department') stats.fromDepartment++
    else if (source === 'employees') stats.fromEmployees++
    else stats.unresolved++

    // Update si hay categoría resuelta
    if (resolvedCategory && !DRY_RUN) {
      const updateData: { standardCategory: string; departmentId?: string } = {
        standardCategory: resolvedCategory,
      }
      // Si encontramos departmentId vía empleados Y descriptor no tenía uno válido, asignarlo
      if (resolvedDepartmentId && (!desc.departmentId || desc.departmentId === '')) {
        updateData.departmentId = resolvedDepartmentId
      }
      await prisma.jobDescriptor.update({
        where: { id: desc.id },
        data: updateData,
      })
      stats.updated++
    }
  }

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Resumen:')
  console.log(`  Total procesados:            ${stats.total}`)
  console.log(`  Resueltos vía Department:    ${stats.fromDepartment}`)
  console.log(`  Resueltos vía Employees:     ${stats.fromEmployees}`)
  console.log(`  Sin resolver (warning):      ${stats.unresolved}`)
  console.log(`  Actualizados en DB:          ${stats.updated}${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
