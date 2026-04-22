// Investiga outliers de span + integridad jerárquica. Read-only.

import { prisma } from '../src/lib/prisma'

async function main() {
  const accountId = process.argv[2] ?? 'cmfgedx7b00012413i92048wl'

  // Managers con span irreal (>20 para arquetipo profesional/mando_medio)
  const managers = await prisma.employee.findMany({
    where: { accountId, isActive: true, status: 'ACTIVE' },
    select: {
      id: true,
      fullName: true,
      position: true,
      acotadoGroup: true,
      managerId: true,
      status: true,
      isActive: true,
      _count: { select: { directReports: true } },
    },
  })

  const topSpan = managers
    .filter(m => m._count.directReports > 20)
    .sort((a, b) => b._count.directReports - a._count.directReports)

  console.log('\n🔍 MANAGERS CON SPAN > 20 (investigación)')
  for (const m of topSpan) {
    console.log(`\n  ${m.fullName} · ${m.position}`)
    console.log(
      `    span=${m._count.directReports}  acotadoGroup=${m.acotadoGroup}  managerId=${m.managerId}`
    )

    // Sus directos — ¿son activos? ¿de qué arquetipos?
    const directs = await prisma.employee.findMany({
      where: { managerId: m.id, accountId },
      select: {
        id: true,
        fullName: true,
        position: true,
        isActive: true,
        status: true,
        acotadoGroup: true,
      },
    })

    const activos = directs.filter(d => d.isActive && d.status === 'ACTIVE').length
    const inactivos = directs.length - activos
    console.log(`    Directos: ${directs.length} total (${activos} activos + ${inactivos} inactivos)`)

    // ¿Algún directo es también manager? (capa intermedia)
    const directoIds = directs.map(d => d.id)
    const directosQueSonManagers = await prisma.employee.count({
      where: {
        accountId,
        managerId: { in: directoIds },
        isActive: true,
        status: 'ACTIVE',
      },
    })
    console.log(`    De sus directos, ${directosQueSonManagers} son a su vez managers`)

    const arquetiposDirectos = directs.reduce(
      (acc, d) => {
        const k = d.acotadoGroup ?? '(null)'
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log(`    Arquetipos de sus directos: ${JSON.stringify(arquetiposDirectos)}`)
  }

  // Loops en managerId (A → B → A)
  console.log('\n🔍 DETECCIÓN DE LOOPS EN MANAGER CHAIN')
  const empById = new Map(managers.map(m => [m.id, m]))
  let loops = 0
  for (const m of managers) {
    const visited = new Set<string>([m.id])
    let current = m.managerId
    let depth = 0
    while (current && depth < 10) {
      if (visited.has(current)) {
        console.log(
          `  ⚠️  LOOP: ${m.fullName} → ... → ${empById.get(current)?.fullName ?? current}`
        )
        loops++
        break
      }
      visited.add(current)
      current = empById.get(current)?.managerId ?? null
      depth++
    }
  }
  if (loops === 0) console.log('  ✅ sin loops detectados')

  // Empleados cuyo managerId apunta a alguien inactivo o no-manager
  console.log('\n🔍 MANAGER ID APUNTA A PERSONA INEXISTENTE/INACTIVA')
  const allEmpIds = new Set(managers.map(m => m.id))
  const inactivos = await prisma.employee.findMany({
    where: { accountId, OR: [{ isActive: false }, { status: { not: 'ACTIVE' } }] },
    select: { id: true, fullName: true },
  })
  const inactivoIds = new Set(inactivos.map(i => i.id))

  let managerIdsRotos = 0
  for (const m of managers) {
    if (!m.managerId) continue
    if (inactivoIds.has(m.managerId)) {
      console.log(`  ⚠️  ${m.fullName} → manager inactivo (${m.managerId})`)
      managerIdsRotos++
    } else if (!allEmpIds.has(m.managerId)) {
      console.log(
        `  ⚠️  ${m.fullName} → managerId inexistente en activos (${m.managerId})`
      )
      managerIdsRotos++
    }
  }
  if (managerIdsRotos === 0) console.log('  ✅ todas las referencias válidas')

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
