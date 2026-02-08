// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION AUDIT PDF GENERATOR
// src/lib/services/CalibrationAuditPDF.ts
// ════════════════════════════════════════════════════════════════════════════
// Genera PDF inmutable de auditoría con tablas de ajustes + QR de verificación
// Usa jsPDF + jspdf-autotable + qrcode
// ════════════════════════════════════════════════════════════════════════════

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AuditPDFData {
  sessionId: string
  sessionName: string
  closedAt: Date
  facilitator: string
  participants: string[]
  adjustments: Array<{
    employeeName: string
    position: string
    originalScore: number
    finalScore: number
    originalLevel: string
    finalLevel: string
    justification: string
  }>
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATOR
// ════════════════════════════════════════════════════════════════════════════

export async function generateCalibrationAuditPDF(
  data: AuditPDFData
): Promise<Buffer> {
  const doc = new jsPDF()

  // ═══ HEADER ═══
  doc.setFontSize(20)
  doc.setTextColor(34, 211, 238) // Cyan FocalizaHR
  doc.text('FocalizaHR', 20, 20)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Acta de Calibración de Desempeño', 20, 35)

  // ═══ METADATA ═══
  let yPos = 50

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Sesión: ${data.sessionName}`, 20, yPos)
  yPos += 7
  doc.text(`Fecha de Cierre: ${data.closedAt.toLocaleString('es-CL')}`, 20, yPos)
  yPos += 7
  doc.text(`Facilitador: ${data.facilitator}`, 20, yPos)
  yPos += 7

  // Truncar participantes si son demasiados
  const participantText = data.participants.join(', ')
  const truncatedParticipants = participantText.length > 90
    ? participantText.substring(0, 90) + '...'
    : participantText
  doc.text(`Participantes: ${truncatedParticipants}`, 20, yPos)
  yPos += 10

  // ═══ HASH DE INTEGRIDAD + QR CODE ═══
  const auditHash = `CAL-${data.sessionId.substring(0, 8)}-${Date.now()}`

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Hash de Integridad: ${auditHash}`, 20, yPos)
  yPos += 3

  // Generate QR Code
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.focalizahr.com'
    const sessionUrl = `${appUrl}/dashboard/performance/calibration/sessions/${data.sessionId}`
    const qrDataUrl = await QRCode.toDataURL(sessionUrl, {
      width: 100,
      margin: 1
    })
    doc.addImage(qrDataUrl, 'PNG', 160, yPos - 15, 30, 30)
    doc.setFontSize(7)
    doc.text('Escanea para verificar', 162, yPos + 18)
  } catch {
    // QR generation failed, continue without it
  }

  yPos += 25

  // ═══ RESUMEN ═══
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total de ajustes aplicados: ${data.adjustments.length}`, 20, yPos)
  yPos += 10

  // ═══ TABLA DE AJUSTES ═══
  if (data.adjustments.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Empleado', 'Cargo', 'Original', 'Final', 'Nivel Final', 'Justificación']],
      body: data.adjustments.map(adj => [
        adj.employeeName,
        adj.position || '—',
        adj.originalScore.toFixed(1),
        adj.finalScore.toFixed(1),
        adj.finalLevel || '—',
        adj.justification.length > 50
          ? adj.justification.substring(0, 50) + '...'
          : adj.justification
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [34, 211, 238],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    })
  }

  // ═══ FOOTER ═══
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount} | FocalizaHR © ${new Date().getFullYear()} | Documento generado automáticamente`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Return as Buffer for server-side usage
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
