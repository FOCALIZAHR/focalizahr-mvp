// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION SYNC SERVICE
// src/lib/services/SuccessionSyncService.ts
// ════════════════════════════════════════════════════════════════════════════
// Sincroniza SuccessionCandidate -> PerformanceRating para backward compat.
// Escribe successionReadiness + targetRoles al rating del empleado.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { READINESS_SYNC_MAP } from '@/config/successionConstants'
import { SuccessionService } from './SuccessionService'

export class SuccessionSyncService {

  /**
   * Sincroniza datos de un candidato al PerformanceRating del empleado.
   * Escribe successionReadiness (legacy) + targetRoles (JSON array de positionTitles).
   */
  static async syncToPerformanceRating(candidateId: string, knownCycleId?: string): Promise<void> {
    const candidate = await prisma.successionCandidate.findUnique({
      where: { id: candidateId },
      select: {
        employeeId: true,
        readinessLevel: true,
        readinessOverride: true,
        status: true,
        criticalPosition: {
          select: {
            positionTitle: true,
            accountId: true,
          }
        }
      }
    })

    if (!candidate) return

    const cycleId = knownCycleId ?? await SuccessionService.getCurrentCycleId(candidate.criticalPosition.accountId)
    if (!cycleId) return

    // Get effective readiness
    const effectiveReadiness = candidate.readinessOverride || candidate.readinessLevel
    const legacyReadiness = READINESS_SYNC_MAP[effectiveReadiness] || 'not_suitable'

    // Get ALL position titles this employee is nominated for (across all active candidacies)
    const allCandidacies = await prisma.successionCandidate.findMany({
      where: {
        employeeId: candidate.employeeId,
        status: 'ACTIVE',
      },
      select: {
        criticalPosition: { select: { positionTitle: true } }
      }
    })

    const targetRoles = allCandidacies.map(c => c.criticalPosition.positionTitle)

    // Write to PerformanceRating
    await prisma.performanceRating.updateMany({
      where: {
        cycleId,
        employeeId: candidate.employeeId,
      },
      data: {
        successionReadiness: candidate.status === 'ACTIVE' ? legacyReadiness : null,
        targetRoles: candidate.status === 'ACTIVE' ? targetRoles : [],
      }
    })
  }

  /**
   * Sincroniza todos los candidatos de una posicion.
   */
  static async syncAllForPosition(positionId: string): Promise<void> {
    const candidates = await prisma.successionCandidate.findMany({
      where: { criticalPositionId: positionId },
      select: { id: true },
    })

    for (const c of candidates) {
      await this.syncToPerformanceRating(c.id)
    }
  }
}
