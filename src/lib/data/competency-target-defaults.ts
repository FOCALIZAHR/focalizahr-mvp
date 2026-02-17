import { prisma } from '@/lib/prisma'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY TARGET DEFAULTS - Niveles esperados por cargo
// Matriz basada en mejores prácticas LATAM (configurable por cliente)
// ════════════════════════════════════════════════════════════════════════════

// Matriz de defaults: null = N/A (competencia no aplica a ese cargo)
const COMPETENCY_DEFAULTS: Record<string, Record<string, number | null>> = {
  // STRATEGIC (Solo ejecutivos)
  'STRAT-VISION': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': null,
    'supervisor_coordinador': null,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },
  'STRAT-CHANGE': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 3,
    'supervisor_coordinador': null,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },
  'STRAT-INFLUENCE': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 3,
    'supervisor_coordinador': null,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },

  // LEADERSHIP (Managers + Ejecutivos)
  'LEAD-DEV': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },
  'LEAD-TEAM': {
    'gerente_director': 5,
    'subgerente_subdirector': 5,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },
  'LEAD-DELEG': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },
  'LEAD-FEEDBACK': {
    'gerente_director': 5,
    'subgerente_subdirector': 5,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': null,
    'asistente_otros': null,
    'operativo_auxiliar': null
  },

  // CORE (Todos)
  'CORE-RESULTS': {
    'gerente_director': 5,
    'subgerente_subdirector': 5,
    'jefe': 4,
    'supervisor_coordinador': 4,
    'profesional_analista': 3,
    'asistente_otros': 2,
    'operativo_auxiliar': 2
  },
  'CORE-CLIENT': {
    'gerente_director': 5,
    'subgerente_subdirector': 5,
    'jefe': 4,
    'supervisor_coordinador': 4,
    'profesional_analista': 3,
    'asistente_otros': 3,
    'operativo_auxiliar': 2
  },
  'CORE-COMM': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': 3,
    'asistente_otros': 2,
    'operativo_auxiliar': 2
  },
  'CORE-TEAM': {
    'gerente_director': 5,
    'subgerente_subdirector': 5,
    'jefe': 4,
    'supervisor_coordinador': 4,
    'profesional_analista': 3,
    'asistente_otros': 3,
    'operativo_auxiliar': 3
  },
  'CORE-ADAPT': {
    'gerente_director': 5,
    'subgerente_subdirector': 4,
    'jefe': 4,
    'supervisor_coordinador': 3,
    'profesional_analista': 3,
    'asistente_otros': 2,
    'operativo_auxiliar': 2
  }
}

export async function seedCompetencyTargets(accountId: string) {
  console.log(`[Seed] Creando CompetencyTargets para account ${accountId}`)

  const targets: Array<{
    accountId: string
    competencyCode: string
    standardJobLevel: string
    targetScore: number
    isDefault: boolean
  }> = []

  for (const [competencyCode, levelTargets] of Object.entries(COMPETENCY_DEFAULTS)) {
    for (const [level, targetScore] of Object.entries(levelTargets)) {
      if (targetScore !== null) {
        targets.push({
          accountId,
          competencyCode,
          standardJobLevel: level,
          targetScore,
          isDefault: true
        })
      }
    }
  }

  // Upsert para no duplicar si ya existen
  let created = 0
  for (const target of targets) {
    await prisma.competencyTarget.upsert({
      where: {
        accountId_competencyCode_standardJobLevel: {
          accountId: target.accountId,
          competencyCode: target.competencyCode,
          standardJobLevel: target.standardJobLevel
        }
      },
      update: {
        targetScore: target.targetScore,
        isDefault: target.isDefault
      },
      create: target
    })
    created++
  }

  console.log(`[Seed] Upserted ${created} CompetencyTargets`)
}
