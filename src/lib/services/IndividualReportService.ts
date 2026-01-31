// ════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL REPORT SERVICE - Reportes Personalizados Post-Ciclo
// src/lib/services/IndividualReportService.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: Lattice Individual Reports, 15Five Reviews
// Filosofía: Reporte personalizado con insights accionables
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'
import type { EvaluateeResults360 } from '@/lib/services/PerformanceResultsService'
import crypto from 'crypto'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface IndividualReport {
  // Metadata
  reportId: string
  employeeId: string
  employeeName: string
  cycleId: string
  cycleName: string
  generatedAt: Date

  // Token acceso anónimo
  accessToken: string
  accessUrl: string

  // Resultados consolidados
  results360: EvaluateeResults360

  // Contenido HTML renderizado
  htmlContent: string
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class IndividualReportService {

  /**
   * Genera reporte individual para un empleado
   * @param cycleId - ID del ciclo completado
   * @param employeeId - ID del empleado (participant)
   * @returns Reporte completo con token de acceso
   */
  static async generateReport(
    cycleId: string,
    employeeId: string
  ): Promise<IndividualReport> {

    // 1. Obtener resultados consolidados 360°
    const results360 = await PerformanceResultsService.getEvaluateeResults(
      cycleId,
      employeeId
    )

    // 2. Generar token seguro de acceso
    const accessToken = this.generateSecureToken()
    const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${accessToken}`

    // 3. Generar HTML del reporte
    const htmlContent = this.renderReportHTML(results360, accessToken)

    // 4. Guardar confirmación entrega (preparar para envío)
    const deliveryConfirmation = await prisma.feedbackDeliveryConfirmation.create({
      data: {
        employeeId,
        cycleId,
        reportToken: accessToken,
        sentAt: new Date(),
        receivedOnTime: null
      }
    })

    // 5. Retornar reporte completo
    return {
      reportId: deliveryConfirmation.id,
      employeeId,
      employeeName: results360.evaluateeName,
      cycleId,
      cycleName: results360.cycleName,
      generatedAt: new Date(),
      accessToken,
      accessUrl,
      results360,
      htmlContent
    }
  }

  /**
   * Obtiene reporte por token de acceso
   * @param token - Token seguro de acceso
   * @returns Reporte si token válido y no expirado
   */
  static async getReportByToken(token: string): Promise<IndividualReport | null> {

    // 1. Buscar confirmación por token
    const confirmation = await prisma.feedbackDeliveryConfirmation.findUnique({
      where: { reportToken: token },
      include: {
        employee: {
          select: {
            id: true,
            name: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true,
            accountId: true
          }
        }
      }
    })

    if (!confirmation) {
      return null
    }

    // 2. Verificar expiración (según config account)
    const account = await prisma.account.findUnique({
      where: { id: confirmation.cycle.accountId },
      select: {
        reportLinkExpirationDays: true
      }
    })

    const expirationDays = account?.reportLinkExpirationDays || 30
    const expirationDate = new Date(confirmation.sentAt)
    expirationDate.setDate(expirationDate.getDate() + expirationDays)

    if (new Date() > expirationDate) {
      return null // Token expirado
    }

    // 3. Regenerar reporte con datos actuales
    const results360 = await PerformanceResultsService.getEvaluateeResults(
      confirmation.cycle.id,
      confirmation.employee.id
    )

    const htmlContent = this.renderReportHTML(results360, token)
    const accessUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${token}`

    return {
      reportId: confirmation.id,
      employeeId: confirmation.employee.id,
      employeeName: confirmation.employee.name || results360.evaluateeName,
      cycleId: confirmation.cycle.id,
      cycleName: confirmation.cycle.name,
      generatedAt: confirmation.sentAt,
      accessToken: token,
      accessUrl,
      results360,
      htmlContent
    }
  }

  /**
   * Marca reporte como confirmado por empleado
   * @param token - Token de acceso
   */
  static async confirmReceipt(token: string): Promise<void> {
    await prisma.feedbackDeliveryConfirmation.update({
      where: { reportToken: token },
      data: {
        confirmedAt: new Date(),
        receivedOnTime: true
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Genera token seguro aleatorio (256 bits de entropía)
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Renderiza HTML del reporte individual
   * Usa inline styles para compatibilidad con email y acceso anónimo
   */
  private static renderReportHTML(
    results: EvaluateeResults360,
    token: string
  ): string {

    const strengthsHtml = results.gapAnalysis.strengths.map(s => `
      <div style="padding: 12px 16px; margin: 10px 0; border-left: 4px solid #10B981; background: #f0fdf4; border-radius: 0 8px 8px 0;">
        <strong style="color: #1E293B; font-size: 15px;">${s.competencyName}</strong>
        <div style="color: #10B981; font-size: 13px; margin-top: 4px;">${s.highlight}</div>
      </div>
    `).join('')

    const developmentHtml = results.gapAnalysis.developmentAreas.map(d => `
      <div style="padding: 12px 16px; margin: 10px 0; border-left: 4px solid #F59E0B; background: #fffbeb; border-radius: 0 8px 8px 0;">
        <strong style="color: #1E293B; font-size: 15px;">${d.competencyName}</strong>
        <div style="color: #92400E; font-size: 13px; margin-top: 4px;">Prioridad: ${d.priority}</div>
      </div>
    `).join('')

    const competencyRows = results.competencyScores.map(c => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1E293B;">${c.competencyName}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #64748B;">${c.selfScore !== null ? c.selfScore.toFixed(1) : '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #64748B;">${c.managerScore !== null ? c.managerScore.toFixed(1) : '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #64748B;">${c.peerAvgScore !== null ? c.peerAvgScore.toFixed(1) : '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; font-size: 14px; color: #22D3EE;">${c.overallAvgScore.toFixed(1)}</td>
      </tr>
    `).join('')

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Desempeño - ${results.evaluateeName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #22D3EE;">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #0F172A;">Reporte de Desempeño 360°</h1>
      <h2 style="margin: 0 0 8px 0; font-size: 22px; background: linear-gradient(135deg, #22D3EE, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${results.evaluateeName}</h2>
      <p style="margin: 0; color: #64748B; font-size: 14px;">${results.cycleName}</p>
    </div>

    <!-- Score General -->
    <div style="background: linear-gradient(135deg, rgba(34,211,238,0.1), rgba(167,139,250,0.1)); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">Tu Score General</h3>
      <div style="font-size: 52px; font-weight: 700; color: #22D3EE; line-height: 1;">
        ${results.overallAvgScore.toFixed(1)}<span style="font-size: 24px; color: #94A3B8;">/5.0</span>
      </div>
      <div style="color: #64748B; margin-top: 12px; font-size: 14px;">
        Basado en ${results.completedEvaluations} evaluaciones completadas
      </div>
    </div>

    <!-- Scores por Tipo -->
    <div style="display: flex; gap: 12px; margin: 24px 0; flex-wrap: wrap;">
      ${results.selfScore !== null ? `
      <div style="flex: 1; min-width: 120px; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Auto</div>
        <div style="font-size: 24px; font-weight: 600; color: #3B82F6;">${results.selfScore.toFixed(1)}</div>
      </div>` : ''}
      ${results.managerScore !== null ? `
      <div style="flex: 1; min-width: 120px; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Jefatura</div>
        <div style="font-size: 24px; font-weight: 600; color: #10B981;">${results.managerScore.toFixed(1)}</div>
      </div>` : ''}
      ${results.peerAvgScore !== null ? `
      <div style="flex: 1; min-width: 120px; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Pares</div>
        <div style="font-size: 24px; font-weight: 600; color: #A78BFA;">${results.peerAvgScore.toFixed(1)}</div>
      </div>` : ''}
      ${results.upwardAvgScore !== null ? `
      <div style="flex: 1; min-width: 120px; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Reportes</div>
        <div style="font-size: 24px; font-weight: 600; color: #F59E0B;">${results.upwardAvgScore.toFixed(1)}</div>
      </div>` : ''}
    </div>

    <!-- Tabla Competencias -->
    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; color: #0F172A; margin-bottom: 16px;">Detalle por Competencia</h3>
      <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #64748B; font-weight: 600;">Competencia</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748B; font-weight: 600;">Auto</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748B; font-weight: 600;">Jefe</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748B; font-weight: 600;">Pares</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #22D3EE; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${competencyRows}
        </tbody>
      </table>
    </div>

    <!-- Fortalezas -->
    ${results.gapAnalysis.strengths.length > 0 ? `
    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; color: #0F172A; margin-bottom: 16px;">Fortalezas Destacadas</h3>
      ${strengthsHtml}
    </div>
    ` : ''}

    <!-- Áreas de Desarrollo -->
    ${results.gapAnalysis.developmentAreas.length > 0 ? `
    <div style="margin: 32px 0;">
      <h3 style="font-size: 18px; color: #0F172A; margin-bottom: 16px;">Áreas de Desarrollo</h3>
      ${developmentHtml}
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #64748B; font-size: 13px; margin-bottom: 16px;">
        Este reporte es confidencial y solo para tu uso personal.
      </p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/report/${token}/confirm"
         style="display: inline-block; background: linear-gradient(135deg, #22D3EE, #A78BFA); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Confirmar Recepción
      </a>
      <p style="color: #94A3B8; font-size: 11px; margin-top: 16px;">
        Powered by FocalizaHR
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }
}

export default IndividualReportService
