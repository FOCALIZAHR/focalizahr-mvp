// Auditoría read-only: distribución de automationShare / augmentationShare
// en la dotación actual. Sin escribir nada.

import { prisma } from '../src/lib/prisma'

interface Agg {
  deptName: string
  count: number
  totalExposure: number
  totalAutomation: number
  totalAugmentation: number
  positions: Map<
    string,
    {
      count: number
      totalExposure: number
      totalAutomation: number
      totalAugmentation: number
      socCode: string | null
    }
  >
}

async function main() {
  // Cargar todos los accounts activos con empleados
  const accounts = await prisma.account.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, companyName: true, _count: { select: { employees: true } } },
    orderBy: { employees: { _count: 'desc' } },
    take: 5,
  })

  console.log('Accounts activas con empleados:')
  for (const a of accounts) {
    console.log(`  ${a.id} · ${a.companyName} · ${a._count.employees} empleados`)
  }

  if (accounts.length === 0) {
    console.log('No hay accounts. Abort.')
    return
  }

  // Usar la primera account activa con empleados
  const accountId = accounts[0].id
  console.log(`\n>>> Analizando account: ${accounts[0].companyName} (${accountId})\n`)

  // Empleados activos del account
  const employees = await prisma.employee.findMany({
    where: { accountId, isActive: true, status: 'ACTIVE' },
    select: {
      position: true,
      department: { select: { displayName: true } },
    },
  })

  // Mappings position → socCode
  const mappings = await prisma.occupationMapping.findMany({
    where: { accountId, socCode: { not: null } },
    select: { positionText: true, socCode: true },
  })
  const posToSoc = new Map(
    mappings.map(m => [m.positionText.toLowerCase().trim(), m.socCode!])
  )

  // Ocupaciones con shares
  const socs = [...new Set([...posToSoc.values()])]
  const occs = await prisma.onetOccupation.findMany({
    where: { socCode: { in: socs } },
    select: {
      socCode: true,
      automationShare: true,
      augmentationShare: true,
      observedExposure: true,
      focalizaScore: true,
      taskCoverage: true,
    },
  })
  const occMap = new Map(occs.map(o => [o.socCode, o]))

  // Agregación por depto
  const byDept = new Map<string, Agg>()

  for (const emp of employees) {
    const dept = emp.department?.displayName ?? 'Sin departamento'
    const pos = emp.position?.toLowerCase().trim() ?? ''
    const soc = pos ? posToSoc.get(pos) ?? null : null
    const occ = soc ? occMap.get(soc) : null

    const exposure = occ?.focalizaScore ?? occ?.observedExposure ?? 0
    const automation = occ?.automationShare ?? 0
    const augmentation = occ?.augmentationShare ?? 0

    if (!byDept.has(dept)) {
      byDept.set(dept, {
        deptName: dept,
        count: 0,
        totalExposure: 0,
        totalAutomation: 0,
        totalAugmentation: 0,
        positions: new Map(),
      })
    }
    const d = byDept.get(dept)!
    d.count++
    d.totalExposure += exposure
    d.totalAutomation += automation
    d.totalAugmentation += augmentation

    const posKey = emp.position ?? '(sin position)'
    if (!d.positions.has(posKey)) {
      d.positions.set(posKey, {
        count: 0,
        totalExposure: 0,
        totalAutomation: 0,
        totalAugmentation: 0,
        socCode: soc,
      })
    }
    const p = d.positions.get(posKey)!
    p.count++
    p.totalExposure += exposure
    p.totalAutomation += automation
    p.totalAugmentation += augmentation
  }

  // ── PARTE 2: Reporte por departamento ──
  console.log('═══════════════════════════════════════════════════════════')
  console.log('PARTE 2 — Distribución por departamento')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log(
    'departmentName'.padEnd(30) +
      'N'.padStart(4) +
      'avgExp'.padStart(10) +
      'avgAuto'.padStart(10) +
      'avgAug'.padStart(10)
  )
  console.log('─'.repeat(64))

  const sorted = [...byDept.values()].sort((a, b) => b.count - a.count)
  for (const d of sorted) {
    const avgExp = d.count > 0 ? d.totalExposure / d.count : 0
    const avgAuto = d.count > 0 ? d.totalAutomation / d.count : 0
    const avgAug = d.count > 0 ? d.totalAugmentation / d.count : 0
    console.log(
      d.deptName.slice(0, 28).padEnd(30) +
        String(d.count).padStart(4) +
        avgExp.toFixed(3).padStart(10) +
        avgAuto.toFixed(3).padStart(10) +
        avgAug.toFixed(3).padStart(10)
    )
  }

  // ── PARTE 3: Reporte por cargo en TI y Desarrollo Software ──
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('PARTE 3 — Cargos en TI y Desarrollo')
  console.log('═══════════════════════════════════════════════════════════\n')

  const deptosInteres = [...byDept.keys()].filter(d =>
    /^(ti|tecnolog|desarroll|software|sistemas|it)/i.test(d)
  )

  if (deptosInteres.length === 0) {
    console.log('No encontré deptos que matcheen /ti|tecnolog|desarroll|software/')
    console.log('Deptos disponibles:')
    ;[...byDept.keys()].forEach(d => console.log(`  · ${d}`))
  } else {
    for (const deptName of deptosInteres) {
      const d = byDept.get(deptName)!
      console.log(`\n── ${deptName} (${d.count} empleados) ──`)
      console.log(
        'position'.padEnd(40) +
          'soc'.padStart(12) +
          'N'.padStart(4) +
          'avgExp'.padStart(10) +
          'avgAuto'.padStart(10) +
          'avgAug'.padStart(10)
      )
      console.log('─'.repeat(86))
      const sortedPos = [...d.positions.entries()].sort(
        (a, b) => b[1].count - a[1].count
      )
      for (const [pos, p] of sortedPos) {
        const avgExp = p.count > 0 ? p.totalExposure / p.count : 0
        const avgAuto = p.count > 0 ? p.totalAutomation / p.count : 0
        const avgAug = p.count > 0 ? p.totalAugmentation / p.count : 0
        console.log(
          pos.slice(0, 38).padEnd(40) +
            (p.socCode ?? '—').padStart(12) +
            String(p.count).padStart(4) +
            avgExp.toFixed(3).padStart(10) +
            avgAuto.toFixed(3).padStart(10) +
            avgAug.toFixed(3).padStart(10)
        )
      }
    }
  }

  // ── Distribución global de shares en occupations mapeadas ──
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('Distribución de shares en occupations mapeadas del account')
  console.log('═══════════════════════════════════════════════════════════\n')
  const occsWithData = occs.filter(
    o => o.automationShare !== null || o.augmentationShare !== null
  )
  const nullShares = occs.filter(
    o => o.automationShare === null && o.augmentationShare === null
  ).length

  console.log(`Total occupations mapeadas: ${occs.length}`)
  console.log(`  · con shares Anthropic:  ${occsWithData.length}`)
  console.log(`  · sin shares (null):      ${nullShares}`)

  if (occsWithData.length > 0) {
    const autos = occsWithData.map(o => o.automationShare ?? 0).sort((a, b) => a - b)
    const augs = occsWithData.map(o => o.augmentationShare ?? 0).sort((a, b) => a - b)
    const sums = occsWithData.map(
      o => (o.automationShare ?? 0) + (o.augmentationShare ?? 0)
    )

    const pct = (arr: number[], p: number) => arr[Math.floor(arr.length * p)]
    console.log(`\nautomationShare:`)
    console.log(`  min: ${autos[0].toFixed(3)}`)
    console.log(`  p25: ${pct(autos, 0.25).toFixed(3)}`)
    console.log(`  p50: ${pct(autos, 0.5).toFixed(3)}`)
    console.log(`  p75: ${pct(autos, 0.75).toFixed(3)}`)
    console.log(`  p95: ${pct(autos, 0.95).toFixed(3)}`)
    console.log(`  max: ${autos[autos.length - 1].toFixed(3)}`)

    console.log(`\naugmentationShare:`)
    console.log(`  min: ${augs[0].toFixed(3)}`)
    console.log(`  p25: ${pct(augs, 0.25).toFixed(3)}`)
    console.log(`  p50: ${pct(augs, 0.5).toFixed(3)}`)
    console.log(`  p75: ${pct(augs, 0.75).toFixed(3)}`)
    console.log(`  p95: ${pct(augs, 0.95).toFixed(3)}`)
    console.log(`  max: ${augs[augs.length - 1].toFixed(3)}`)

    const avgSum = sums.reduce((s, v) => s + v, 0) / sums.length
    const minSum = Math.min(...sums)
    const maxSum = Math.max(...sums)
    console.log(`\n(automation + augmentation):`)
    console.log(`  min: ${minSum.toFixed(3)}  avg: ${avgSum.toFixed(3)}  max: ${maxSum.toFixed(3)}`)
    console.log(`  → complementarios? ${avgSum > 0.9 && avgSum < 1.1 ? 'SÍ (~1.0)' : 'NO (independientes)'}`)
  }

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
