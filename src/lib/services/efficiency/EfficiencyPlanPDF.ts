// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY PLAN PDF — Business Case exportable (SIN nombres de personas)
// src/lib/services/efficiency/EfficiencyPlanPDF.ts
// ════════════════════════════════════════════════════════════════════════════
// Genera PDF del Plan de Eficiencia para el directorio.
// - Sin nombres de personas (sensibilidad política)
// - Con narrativas editadas, proyecciones, métricas
// - Patrón: jsPDF + jspdf-autotable (idéntico a CalibrationAuditPDF)
// ════════════════════════════════════════════════════════════════════════════

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  calcularResumenCarrito,
  calcularProyecciones,
  type DecisionItem,
} from './EfficiencyCalculator'
import {
  LENTES_META,
  formatCLP,
  type FamiliaId,
  type LenteId,
} from './EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface EfficiencyPlanPDFData {
  planId: string
  nombre: string
  estado: string
  tesisElegida: string
  createdAt: Date
  updatedAt: Date
  companyName: string
  decisiones: DecisionItem[]
  narrativasEdit: Record<string, string>
  narrativaEjecEdit: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// LABELS
// ════════════════════════════════════════════════════════════════════════════

const FAMILIA_LABEL: Record<FamiliaId, string> = {
  capital_en_riesgo: 'Capital en riesgo',
  ruta_ejecucion: 'Ruta de ejecución',
  costo_esperar: 'Costo de esperar',
}

const FAMILIA_COLOR: Record<FamiliaId, [number, number, number]> = {
  capital_en_riesgo: [34, 211, 238], // cyan
  ruta_ejecucion: [167, 139, 250], // purple
  costo_esperar: [245, 158, 11], // amber
}

const TESIS_LABEL: Record<string, string> = {
  eficiencia: 'Eficiencia — reducir costo y capturar capacidad liberada',
  crecimiento: 'Crecimiento — reinvertir ahorro en expandir el negocio',
  evolucion: 'Evolución — rediseñar para el próximo ciclo',
}

// ════════════════════════════════════════════════════════════════════════════
// GENERADOR
// ════════════════════════════════════════════════════════════════════════════

export function generateEfficiencyPlanPDF(data: EfficiencyPlanPDFData): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ═══ HEADER ═══
  doc.setFontSize(20)
  doc.setTextColor(34, 211, 238)
  doc.text('FocalizaHR', 20, 20)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(data.companyName, pageWidth - 20, 20, { align: 'right' })

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Plan de Eficiencia Organizacional', 20, 35)

  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(data.nombre, 20, 44)

  // ═══ METADATA ═══
  let yPos = 55
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Fecha: ${data.updatedAt.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`,
    20,
    yPos
  )
  doc.text(
    `Estado: ${data.estado.toUpperCase()}`,
    100,
    yPos
  )
  doc.text(
    `Plan ID: ${data.planId.slice(0, 8)}`,
    pageWidth - 20,
    yPos,
    { align: 'right' }
  )
  yPos += 6
  doc.text(
    `Tesis: ${TESIS_LABEL[data.tesisElegida] ?? data.tesisElegida}`,
    20,
    yPos
  )
  yPos += 10

  // Divisor
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 8

  // ═══ MÉTRICAS ═══
  const resumen = calcularResumenCarrito(data.decisiones)
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text('Métricas del Plan', 20, yPos)
  yPos += 3

  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor']],
    body: [
      ['N° de decisiones', String(resumen.decisiones)],
      [
        'FTE liberados',
        resumen.fteLiberados.toLocaleString('es-CL', {
          maximumFractionDigits: 1,
        }),
      ],
      ['Ahorro recurrente / mes', formatCLP(resumen.ahorroMensual)],
      ['Ahorro anualizado', formatCLP(resumen.ahorroAnual)],
      ['Inversión (one-time)', formatCLP(resumen.inversion)],
      [
        'Payback',
        resumen.paybackMeses === null
          ? '∞ sin breakeven'
          : `${resumen.paybackMeses} ${resumen.paybackMeses === 1 ? 'mes' : 'meses'}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [34, 211, 238], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  })
  // @ts-expect-error jspdf-autotable adds lastAutoTable at runtime
  yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10

  // ═══ PROYECCIÓN ═══
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text('Proyección del flujo neto acumulado', 20, yPos)
  yPos += 3

  const proyecciones = calcularProyecciones(
    resumen.ahorroMensual,
    resumen.inversion
  )

  autoTable(doc, {
    startY: yPos,
    head: [['Horizonte', 'Flujo neto', 'Estado']],
    body: proyecciones.map(p => [
      `Mes ${p.mes}`,
      `${p.neto >= 0 ? '+' : '−'}${formatCLP(Math.abs(p.neto))}`,
      p.esPayback
        ? 'Payback'
        : p.neto >= 0
        ? 'Positivo'
        : 'En recuperación',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [34, 211, 238], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  })
  // @ts-expect-error jspdf-autotable adds lastAutoTable at runtime
  yPos = (doc.lastAutoTable?.finalY ?? yPos) + 10

  // ═══ NARRATIVA EJECUTIVA ═══
  if (data.narrativaEjecEdit) {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text('Narrativa ejecutiva', 20, yPos)
    yPos += 5

    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(data.narrativaEjecEdit, pageWidth - 40)
    for (const line of lines) {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 20, yPos)
      yPos += 5
    }
    yPos += 5
  }

  // ═══ DECISIONES AGRUPADAS POR FAMILIA ═══
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(
    'Decisiones del plan — agrupadas por familia (sin nombres de personas)',
    20,
    yPos
  )
  yPos += 7

  const porFamilia = agruparPorFamilia(data.decisiones)
  for (const { familia, items } of porFamilia) {
    if (items.length === 0) continue
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    const color = FAMILIA_COLOR[familia]
    doc.setFontSize(9)
    doc.setTextColor(color[0], color[1], color[2])
    doc.text(FAMILIA_LABEL[familia], 20, yPos)
    yPos += 2

    // Agrupar por lenteId dentro de la familia y sintetizar (sin nombres)
    const byLente = new Map<LenteId, typeof items>()
    for (const d of items) {
      const list = byLente.get(d.lenteId) ?? []
      list.push(d)
      byLente.set(d.lenteId, list)
    }

    const rows: string[][] = []
    for (const [lenteId, list] of byLente) {
      const lenteTitulo = LENTES_META[lenteId]?.titulo ?? lenteId
      const ahorro = list.reduce((s, d) => s + d.ahorroMes, 0)
      const inversion = list.reduce((s, d) => s + d.finiquito, 0)
      const fte = list.reduce((s, d) => s + d.fteEquivalente, 0)
      const aprobadas = list.filter(d => d.aprobado).length
      rows.push([
        lenteTitulo,
        `${list.length} (${aprobadas} aprobadas)`,
        formatCLP(ahorro),
        formatCLP(inversion),
        fte.toLocaleString('es-CL', { maximumFractionDigits: 1 }),
      ])
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Lente', 'Decisiones', 'Ahorro/mes', 'Inversión', 'FTE']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [60, 60, 60],
        fontStyle: 'bold',
      },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    })
    // @ts-expect-error runtime
    yPos = (doc.lastAutoTable?.finalY ?? yPos) + 6

    // Narrativas editadas (si existen) — texto plano, agrupado por familia
    for (const [lenteId, list] of byLente) {
      const muestra = list[0] // una narrativa representativa por lente
      const key = `${muestra.tipo}:${muestra.id}`
      const nar =
        data.narrativasEdit[key] ?? muestra.narrativa
      if (!nar) continue
      if (yPos > 260) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(8)
      doc.setTextColor(110, 110, 110)
      doc.text(
        `— ${LENTES_META[lenteId]?.titulo ?? lenteId}`,
        22,
        yPos
      )
      yPos += 4
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(nar, pageWidth - 44)
      for (const line of lines.slice(0, 8)) {
        // cap 8 líneas por narrativa para no explotar el PDF
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 24, yPos)
        yPos += 4
      }
      yPos += 3
    }
    yPos += 4
  }

  // ═══ FOOTER ═══
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `FocalizaHR · Plan ${data.planId.slice(0, 8)} · Generado ${new Date().toLocaleString('es-CL')} · Confidencial — solo directorio`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 20,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    )
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function agruparPorFamilia(
  decisiones: DecisionItem[]
): Array<{ familia: FamiliaId; items: DecisionItem[] }> {
  const order: FamiliaId[] = [
    'capital_en_riesgo',
    'ruta_ejecucion',
    'costo_esperar',
  ]
  const grouped = new Map<FamiliaId, DecisionItem[]>()
  for (const fam of order) grouped.set(fam, [])
  for (const d of decisiones) {
    const fam = LENTES_META[d.lenteId]?.familia
    if (!fam) continue
    grouped.get(fam)!.push(d)
  }
  return order
    .map(fam => ({ familia: fam, items: grouped.get(fam) ?? [] }))
    .filter(g => g.items.length > 0)
}
