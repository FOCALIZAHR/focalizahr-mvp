// ════════════════════════════════════════════════════════════════════════════
// AUDIT L4 — Cobertura y pares detectables (read-only, no toca producto)
// ════════════════════════════════════════════════════════════════════════════
// Responde:
//   1. ¿Cuántos empleados activos tienen socCode vs huérfanos?
//   2. ¿Cuántos deptos tienen ≥2 SOCs distintos (universo evaluable)?
//   3. ¿Cuántos SOCs sin tasks O*NET (bloqueo silencioso)?
//   4. Histograma de overlap% por par intra-depto
//   5. Top pares más cercanos al threshold 70% + pares que sí pasan
//
// Replica la lógica canónica de
//   WorkforceIntelligenceService.detectRedundantPositions()
// con la normalización de src/lib/utils/normalizePosition.ts (SSOT tras
// fix adad763 — abril 17, 2026).
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../src/lib/prisma'
import { normalizePositionText } from '../src/lib/utils/normalizePosition'

interface DeptSoc {
  socCode: string
  title: string
  headcount: number
}

interface PairResult {
  deptName: string
  socA: string
  titleA: string
  hcA: number
  socB: string
  titleB: string
  hcB: number
  overlap: number // 0-100
}

async function main() {
  // Permite enfocar un account específico vía argv: tsx script.ts <accountId>
  const targetAccountId = process.argv[2]

  const accounts = await prisma.account.findMany({
    where: targetAccountId
      ? { id: targetAccountId }
      : { status: 'ACTIVE' },
    select: { id: true, companyName: true, adminEmail: true, status: true },
    orderBy: { createdAt: 'desc' },
  })

  if (accounts.length === 0) {
    console.log(
      targetAccountId
        ? `No existe account con id ${targetAccountId}`
        : 'No hay accounts ACTIVE.'
    )
    await prisma.$disconnect()
    return
  }

  for (const account of accounts) {
    console.log('')
    console.log('════════════════════════════════════════════════════════════')
    console.log(`🏢  ${account.companyName}  (${account.adminEmail})`)
    console.log(`    id=${account.id} · status=${account.status}`)
    console.log('════════════════════════════════════════════════════════════')

    // ── (1) Cobertura ──────────────────────────────────────────────────
    const employees = await prisma.employee.findMany({
      where: {
        accountId: account.id,
        isActive: true,
        status: 'ACTIVE',
        position: { not: null },
      },
      select: {
        id: true,
        position: true,
        departmentId: true,
        department: { select: { displayName: true } },
      },
    })

    if (employees.length === 0) {
      console.log('  (sin empleados activos)')
      continue
    }

    const mappings = await prisma.occupationMapping.findMany({
      where: { accountId: account.id, socCode: { not: null } },
      select: { positionText: true, socCode: true, source: true },
    })
    const posToSoc = new Map<string, string>(
      mappings.map(m => [normalizePositionText(m.positionText), m.socCode!])
    )

    const withSoc: typeof employees = []
    const withoutSoc: typeof employees = []
    for (const e of employees) {
      const soc = e.position
        ? posToSoc.get(normalizePositionText(e.position))
        : undefined
      if (soc) withSoc.push(e)
      else withoutSoc.push(e)
    }

    const pctCobertura = Math.round(
      (withSoc.length / employees.length) * 100
    )

    console.log('')
    console.log('📊 COBERTURA DE MAPEO')
    console.log(`   Empleados activos       : ${employees.length}`)
    console.log(
      `   Con socCode             : ${withSoc.length}  (${pctCobertura}%)`
    )
    console.log(`   Sin socCode (huérfanos) : ${withoutSoc.length}`)
    if (withoutSoc.length > 0) {
      const uniqueTitles = new Set(withoutSoc.map(e => e.position))
      const sample = [...uniqueTitles].slice(0, 5).join(', ')
      const more = uniqueTitles.size > 5 ? '…' : ''
      console.log(`   Cargos únicos huérfanos : ${uniqueTitles.size}`)
      console.log(`     sample: ${sample}${more}`)
    }
    const manualCount = mappings.filter(m => m.source === 'MANUAL').length
    console.log(
      `   Mappings MANUAL (tu mano): ${manualCount} / ${mappings.length}`
    )

    // ── (2) Agrupar por (depto, socCode) ───────────────────────────────
    const deptSocs = new Map<
      string,
      { deptName: string; socs: Map<string, DeptSoc> }
    >()
    for (const e of withSoc) {
      if (!e.departmentId) continue
      const soc = posToSoc.get(normalizePositionText(e.position!))!
      const deptName = e.department?.displayName ?? '(sin depto)'
      if (!deptSocs.has(e.departmentId))
        deptSocs.set(e.departmentId, { deptName, socs: new Map() })
      const dept = deptSocs.get(e.departmentId)!
      if (!dept.socs.has(soc))
        dept.socs.set(soc, {
          socCode: soc,
          title: e.position!,
          headcount: 0,
        })
      dept.socs.get(soc)!.headcount++
    }

    const deptsConPares = [...deptSocs.values()].filter(
      d => d.socs.size >= 2
    )
    console.log('')
    console.log('🏢 DEPARTAMENTOS CON ≥2 SOCs DISTINTOS')
    console.log(`   Total deptos             : ${deptSocs.size}`)
    console.log(
      `   Con ≥2 SOCs (evaluables) : ${deptsConPares.length}`
    )

    if (deptsConPares.length === 0) {
      console.log('')
      console.log(
        '   ⚠️  Sin deptos con ≥2 SOCs distintos → L4 no puede detectar pares.'
      )
      continue
    }

    for (const d of deptsConPares) {
      const socList = [...d.socs.values()]
        .map(s => `${s.title}[${s.socCode}]×${s.headcount}`)
        .join(' · ')
      console.log(`     · ${d.deptName}: ${socList}`)
    }

    // ── (3) Tasks O*NET por SOC ────────────────────────────────────────
    const allSocs = new Set<string>()
    for (const d of deptsConPares)
      for (const s of d.socs.keys()) allSocs.add(s)

    const tasks = await prisma.onetTask.findMany({
      where: { socCode: { in: [...allSocs] } },
      select: { socCode: true, taskDescription: true },
    })

    const tasksBySoc = new Map<string, Set<string>>()
    for (const t of tasks) {
      if (!tasksBySoc.has(t.socCode))
        tasksBySoc.set(t.socCode, new Set())
      tasksBySoc
        .get(t.socCode)!
        .add(t.taskDescription.toLowerCase().trim())
    }

    const socsSinTasks = [...allSocs].filter(
      s => !tasksBySoc.has(s) || tasksBySoc.get(s)!.size === 0
    )
    if (socsSinTasks.length > 0) {
      console.log('')
      console.log('⚠️  SOCs SIN TASKS EN OnetTask (no evaluables)')
      for (const s of socsSinTasks) console.log(`     ${s}`)
    }

    // ── (4) Generar pares + calcular overlap Jaccard ───────────────────
    const pairs: PairResult[] = []
    for (const d of deptsConPares) {
      const socs = [...d.socs.values()]
      for (let i = 0; i < socs.length; i++) {
        for (let j = i + 1; j < socs.length; j++) {
          const a = socs[i]
          const b = socs[j]
          const tA = tasksBySoc.get(a.socCode) ?? new Set<string>()
          const tB = tasksBySoc.get(b.socCode) ?? new Set<string>()
          if (tA.size === 0 || tB.size === 0) continue
          const inter = [...tA].filter(t => tB.has(t)).length
          const union = new Set([...tA, ...tB]).size
          const overlap =
            union > 0 ? Math.round((inter / union) * 100) : 0
          pairs.push({
            deptName: d.deptName,
            socA: a.socCode,
            titleA: a.title,
            hcA: a.headcount,
            socB: b.socCode,
            titleB: b.title,
            hcB: b.headcount,
            overlap,
          })
        }
      }
    }

    console.log('')
    console.log('🔗 PARES EVALUADOS')
    console.log(`   Total pares             : ${pairs.length}`)
    console.log(
      `   Pares que pasan ≥70%    : ${pairs.filter(p => p.overlap >= 70).length}`
    )

    if (pairs.length === 0) {
      console.log(
        '   (todos los SOCs sin tasks O*NET o sin pares intra-depto)'
      )
      continue
    }

    // ── (5) Histograma ─────────────────────────────────────────────────
    const buckets = {
      '0-20 ': 0,
      '20-40': 0,
      '40-50': 0,
      '50-60': 0,
      '60-70': 0,
      '70+  ': 0,
    }
    for (const p of pairs) {
      if (p.overlap < 20) buckets['0-20 ']++
      else if (p.overlap < 40) buckets['20-40']++
      else if (p.overlap < 50) buckets['40-50']++
      else if (p.overlap < 60) buckets['50-60']++
      else if (p.overlap < 70) buckets['60-70']++
      else buckets['70+  ']++
    }
    console.log('')
    console.log('📈 HISTOGRAMA DE OVERLAP%')
    for (const [bucket, count] of Object.entries(buckets)) {
      const bar = '█'.repeat(Math.min(count, 40))
      console.log(`   ${bucket} │ ${String(count).padStart(3)} ${bar}`)
    }

    // ── (6) Pares que pasan + top 5 cercanos ───────────────────────────
    const passing = pairs
      .filter(p => p.overlap >= 70)
      .sort((a, b) => b.overlap - a.overlap)
    if (passing.length > 0) {
      console.log('')
      console.log('✅ PARES QUE PASAN EL THRESHOLD (≥70%) — L4 los mostrará')
      for (const p of passing) {
        console.log(
          `   [${String(p.overlap).padStart(3)}%] ${p.titleA} (${p.socA}×${p.hcA}) ↔ ${p.titleB} (${p.socB}×${p.hcB})  ·  ${p.deptName}`
        )
      }
    }

    const closeOnes = pairs
      .filter(p => p.overlap >= 40 && p.overlap < 70)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5)
    if (closeOnes.length > 0) {
      console.log('')
      console.log('🎯 TOP 5 PARES MÁS CERCANOS (40-69%)')
      for (const p of closeOnes) {
        console.log(
          `   [${String(p.overlap).padStart(3)}%] ${p.titleA} ↔ ${p.titleB}  ·  ${p.deptName}`
        )
      }
    }
  }

  console.log('')
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
