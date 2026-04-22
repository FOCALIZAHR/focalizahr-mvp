// Read-only: listar deptos de un account y sus empleados activos agrupados
// por (depto, position). Verifica si la asignación departmentId tiene sentido.

import { prisma } from '../src/lib/prisma'

async function main() {
  const accountId = process.argv[2] ?? 'cmfgedx7b00012413i92048wl'

  console.log(`Account: ${accountId}\n`)

  const depts = await prisma.department.findMany({
    where: { accountId, isActive: true },
    select: {
      id: true,
      displayName: true,
      standardCategory: true,
      level: true,
      unitType: true,
      parentId: true,
    },
    orderBy: [{ level: 'asc' }, { displayName: 'asc' }],
  })

  console.log(`TOTAL DEPARTAMENTOS ACTIVOS: ${depts.length}\n`)

  for (const d of depts) {
    const empCount = await prisma.employee.count({
      where: {
        accountId,
        departmentId: d.id,
        isActive: true,
        status: 'ACTIVE',
      },
    })
    const indent = '  '.repeat(d.level - 1)
    console.log(
      `${indent}L${d.level} · ${d.displayName}  (${d.standardCategory ?? '—'} · ${d.unitType}) · ${empCount} empl activos · id=${d.id}`
    )
  }

  console.log('\n════════════════════════════════════════════')
  console.log('EMPLEADOS ACTIVOS POR (DEPTO, CARGO)')
  console.log('════════════════════════════════════════════\n')

  const grouped = await prisma.employee.groupBy({
    by: ['departmentId', 'position'],
    where: {
      accountId,
      isActive: true,
      status: 'ACTIVE',
      position: { not: null },
    },
    _count: true,
  })

  const deptMap = new Map(depts.map(d => [d.id, d.displayName]))
  const byDept = new Map<string, Array<{ position: string; count: number }>>()
  for (const g of grouped) {
    if (!g.departmentId) continue
    const key = deptMap.get(g.departmentId) ?? `(desconocido: ${g.departmentId})`
    if (!byDept.has(key)) byDept.set(key, [])
    byDept.get(key)!.push({ position: g.position ?? '(null)', count: g._count })
  }

  const sortedDepts = [...byDept.entries()].sort(
    (a, b) =>
      b[1].reduce((s, x) => s + x.count, 0) -
      a[1].reduce((s, x) => s + x.count, 0)
  )

  for (const [deptName, positions] of sortedDepts) {
    const total = positions.reduce((s, x) => s + x.count, 0)
    const uniq = positions.length
    console.log(`📁 ${deptName} — ${total} empleados · ${uniq} cargos distintos`)
    positions
      .sort((a, b) => b.count - a.count)
      .forEach(p => {
        console.log(`     × ${String(p.count).padStart(3)}  ${p.position}`)
      })
    console.log()
  }

  // Sin depto — Prisma 5 tiene limitación de tipos generados: no acepta
  // null directo ni { equals: null } ni { not: null } en filtros de String
  // opcional. Solución limpia: findMany con select mínimo + filter en
  // memoria. Es un script de auditoría, el overhead es irrelevante.
  const allActivos = await prisma.employee.findMany({
    where: { accountId, isActive: true, status: 'ACTIVE' },
    select: { departmentId: true },
  })
  const sinDepto = allActivos.filter(e => e.departmentId === null).length
  if (sinDepto > 0) console.log(`⚠️  ${sinDepto} empleados activos sin depto`)

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
