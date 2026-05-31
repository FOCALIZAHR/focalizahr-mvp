// scripts/r5-cmob0e56.ts
// R5 — validación real contra DB del fix de universo campaign-scope.
// READ-ONLY. No escribe. Replica la lógica de classifyD4 inline para no
// depender de imports React del componente.
//
// Run:
//   npx tsx scripts/r5-cmob0e56.ts

import { prisma } from '@/lib/prisma'
import { computeDepartmentParticipation } from '@/lib/services/compliance/ComplianceAlertService'
import { computeCoverageAnalysis } from '@/lib/services/compliance/CoverageAnalysisService'
import { getISARiskLevel } from '@/lib/services/compliance/ISAService'

// IDs del backup artefacto3-cmob0e56u0005f7g42l11urw0-2026-05-08
const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0'
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl'

type Mundo =
  | 'silencio'
  | 'contradiccion'
  | 'todo-bien'
  | 'bien-con-focos'
  | 'numero-bajo'

function classifyD4(input: {
  orgISA: number
  riesgoDeptos: number
  coverageGapPct: number
  teatroCount: number
}): Mundo {
  const { orgISA, riesgoDeptos, coverageGapPct, teatroCount } = input
  if (coverageGapPct >= 50) return 'silencio'
  if (teatroCount >= 1) return 'contradiccion'
  if (
    getISARiskLevel(orgISA) === 'saludable' &&
    riesgoDeptos === 0 &&
    coverageGapPct < 30
  )
    return 'todo-bien'
  if (
    getISARiskLevel(orgISA) === 'saludable' &&
    (riesgoDeptos >= 1 || (coverageGapPct >= 30 && coverageGapPct < 50))
  )
    return 'bien-con-focos'
  return 'numero-bajo'
}

async function main() {
  console.log('\n═══ R5 cmob0e56 — fix universo campaign-scope ═══\n')

  // 1. Universo post-fix (con participants:{some:{campaignId}})
  const part = await computeDepartmentParticipation(ACCOUNT_ID, CAMPAIGN_ID)
  console.log('UNIVERSO (post-fix campaign-scope):')
  console.log(`  universo.length         = ${part.universo.length}`)
  console.log(`  cubiertosSet.size       = ${part.cubiertosSet.size}`)
  console.log(`  partByDept.size         = ${part.partByDept.size}`)
  console.log(`  deptos invitados:       ${part.universo.map((d) => d.displayName).join(', ')}`)

  // 2. Coverage con el universo nuevo
  const coverage = await computeCoverageAnalysis(CAMPAIGN_ID, ACCOUNT_ID)
  console.log('\nCOVERAGE (DEPT-LEVEL):')
  console.log(`  totalDeptos             = ${coverage.totalDeptos}`)
  console.log(`  deptosConVoz            = ${coverage.deptosConVoz}`)
  console.log(`  pctCobertura            = ${coverage.pctCobertura}% (DEPT-LEVEL)`)
  const coverageGapPct = 100 - coverage.pctCobertura
  console.log(`  coverageGapPct (dept)   = ${coverageGapPct}%`)

  // 2b. Person-level — derivado de coverage.deptosCobertura[].
  let totalInvitedPeople = 0
  let totalRespondedPeople = 0
  for (const d of coverage.deptosCobertura) {
    totalInvitedPeople += d.invited
    totalRespondedPeople += d.responded
  }
  const personRate =
    totalInvitedPeople > 0
      ? Math.round((totalRespondedPeople / totalInvitedPeople) * 100)
      : null
  console.log('\nPARTICIPACIÓN (PERSON-LEVEL — el binding nuevo de {coverage}):')
  console.log(`  totalInvitedPeople      = ${totalInvitedPeople}`)
  console.log(`  totalRespondedPeople    = ${totalRespondedPeople}`)
  console.log(`  personResponseRate      = ${personRate === null ? 'null' : personRate + '%'}`)

  // 3. Datos del orchestrator para los inputs restantes de classifyD4.
  // El scope canónico es 'ORG' (no 'ORGANIZATION') — ver
  // ComplianceAnalysisOrchestrator.ts:133, route.ts:157.
  const orgRow = await prisma.complianceAnalysis.findFirst({
    where: { campaignId: CAMPAIGN_ID, scope: 'ORG', status: 'COMPLETED' },
    select: { resultPayload: true },
  })
  if (!orgRow) {
    console.log('\n[ERROR] No hay org analysis COMPLETED para esta campaña.')
    return
  }
  const orgPayload = orgRow.resultPayload as Record<string, unknown> | null
  const global = (orgPayload?.global ?? {}) as Record<string, unknown>
  const orgISA = typeof global.orgISA === 'number' ? global.orgISA : null

  const completedDepts = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED' },
    select: {
      departmentId: true,
      teatroCumplimiento: true,
      resultPayload: true,
    },
  })
  let riesgoDeptos = 0
  let teatroCount = 0
  for (const d of completedDepts) {
    const p = d.resultPayload as Record<string, unknown> | null
    const safety = p?.safetyDetail as { riskLevel?: string } | undefined
    if (safety?.riskLevel === 'risk' || safety?.riskLevel === 'critical') {
      riesgoDeptos++
    }
    if (d.teatroCumplimiento === true) teatroCount++
  }

  console.log('\nINPUTS classifyD4 (reales DB):')
  console.log(`  orgISA                  = ${orgISA}`)
  console.log(`  riesgoDeptos            = ${riesgoDeptos}`)
  console.log(`  coverageGapPct          = ${coverageGapPct}%`)
  console.log(`  teatroCount             = ${teatroCount}`)

  if (orgISA === null) {
    console.log('\n[NOTE] orgISA es null — Beat 1 no renderiza (guard upstream).')
    return
  }

  const mundo = classifyD4({ orgISA, riesgoDeptos, coverageGapPct, teatroCount })
  console.log('\n═══ MUNDO RESULTANTE ═══')
  console.log(`  → ${mundo.toUpperCase()}`)
  console.log(
    `\n(Pre-fix esperado con universo company-wide: SILENCIO por gap≥50 garantizado.)`,
  )
}

main()
  .catch((e) => {
    console.error('\n[ERROR]', e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
