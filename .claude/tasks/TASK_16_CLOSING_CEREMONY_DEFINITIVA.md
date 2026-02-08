# 🏛️ TASK_16: CLOSING CEREMONY - RITUAL DE CIERRE & AUDITORÍA

## 📊 ESTADO ACTUAL

```yaml
✅ COMPLETADO:
  - TASK_12: Backend + Estado Transitorio
  - TASK_13: Wizard configuración sesión
  - TASK_14+15: Cinema Room + Distribución en vivo (fusionadas)

❌ NO EXISTE:
  - Flujo de cierre de sesión
  - Ritual visual de decisión ejecutiva
  - PDF de auditoría con QR + Hash
  - Manager Feedback Generator

OBJETIVO:
  Transformar el cierre en "Closing Ceremony" - experiencia memorable
  con validación paso a paso y documentos de auditoría inmutables
```

---

## 🎯 FILOSOFÍA: "THE RITUAL"

**El cierre NO es un trámite administrativo, es una sentencia ejecutiva.**

```yaml
INSPIRACIÓN:
  - Apple "Are you sure you want to erase this iPhone?"
  - Bloomberg Terminal "Market Close Confirmation"
  - Notion "Publish to Web" ceremony
  - Firma de tratados internacionales

PRINCIPIOS:
  1. Fullscreen Takeover: Modal que cubre TODO
  2. Pasos Secuenciales: No se puede saltar
  3. Validación Visual: Ver el impacto antes de firmar
  4. Firma Explícita: Escribir "CONFIRMAR"
  5. Documentación Inmutable: PDF + QR + Hash

AMBIENTE:
  - Fondo oscuro (bg-slate-950/95)
  - Sin distracciones
  - Transiciones solemnes (framer-motion)
  - Colores significativos (rose para final)
```

---

## 🏗️ ARQUITECTURA DE IMPLEMENTACIÓN

### 1. Estructura de Archivos

```
src/
├── components/
│   └── calibration/
│       └── closing/
│           ├── ClosingCeremonyModal.tsx       # Orquestador principal
│           ├── StepEvidence.tsx               # Paso 1: Before/After
│           ├── StepCost.tsx                   # Paso 2: Financial Impact
│           ├── StepVerdict.tsx                # Paso 3: Confirmation
│           ├── CalibrationComparisonChart.tsx # Ghost Chart overlay
│           └── FinancialImpactTicker.tsx      # Bonus factor delta

├── lib/
│   └── services/
│       ├── CalibrationAuditPDF.ts             # PDF generation
│       └── ManagerFeedbackGenerator.ts        # Feedback scripts

└── hooks/
    └── calibration/
        └── useClosingCeremony.ts              # Wizard state
```

### 2. Dependencias Nuevas

```bash
npm install jspdf jspdf-autotable qrcode
```

**Razón:** Generación de PDF de auditoría con tablas y QR codes.

---

## 🎬 WIZARD DE 3 PASOS

### PASO 1: LA EVIDENCIA (The Evidence)

**Objetivo:** Visualizar corrección de sesgos Before/After

**Componente:** `StepEvidence.tsx`

**Elementos clave:**
- Gráfico overlay: Original (gris, línea punteada) vs Calibrado (cyan/purple, línea sólida)
- KPI: "Corrección de Desviación: X%"
- Botón: "Continuar al Impacto Financiero →"

**Datos requeridos:**
```typescript
interface StepEvidenceProps {
  originalDistribution: number[]   // [%, %, %, %, %] por score 1-5
  calibratedDistribution: number[] // [%, %, %, %, %] después
  totalEmployees: number
  onNext: () => void
}
```

**Cálculo de corrección:**
```typescript
function calculateDeviationCorrection(
  original: number[], 
  calibrated: number[]
): number {
  // Desviación estándar antes y después
  const stdOriginal = calculateStdDev(original)
  const stdCalibrated = calculateStdDev(calibrated)
  
  // % de mejora
  const improvement = ((stdOriginal - stdCalibrated) / stdOriginal) * 100
  return Math.max(0, Math.round(improvement))
}
```

---

### PASO 2: EL COSTO (The Cost)

**Objetivo:** Aprobar impacto financiero

**Componente:** `StepCost.tsx`

**Elementos clave:**
- Ticker financiero: Factor Original vs Factor Calibrado
- Delta % (con color: verde si baja, rojo si sube)
- Warning ámbar si delta > 5%: "Requiere aprobación de CFO"
- Checkbox obligatorio: "Autorizo el impacto presupuestario"

**Datos requeridos:**
```typescript
interface StepCostProps {
  originalBonusFactor: number      // ej: 1.00
  calibratedBonusFactor: number    // ej: 1.042
  affectedEmployees: number
  isAuthorized: boolean
  onAuthorize: (authorized: boolean) => void
  onNext: () => void
  onBack: () => void
}
```

**Lógica de validación:**
```typescript
const delta = calibratedBonusFactor - originalBonusFactor
const deltaPct = (delta / originalBonusFactor) * 100
const requiresCFOApproval = Math.abs(deltaPct) > 5

// No se puede continuar sin checkbox marcado
const canProceed = isAuthorized === true
```

---

### PASO 3: EL VEREDICTO (The Verdict)

**Objetivo:** Confirmación final con firma digital

**Componente:** `StepVerdict.tsx`

**Elementos clave:**
- Resumen: "X empleados calibrados"
- Warning rojo: "Acción Irreversible"
- Input text: Escribir "CONFIRMAR" (case-insensitive)
- Botón final: "Cerrar Sesión Definitivamente" (gradiente rojo)
- Loading state durante POST /close

**Datos requeridos:**
```typescript
interface StepVerdictProps {
  totalAdjustments: number
  sessionId: string
  onConfirm: () => Promise<void>
  onBack: () => void
}
```

**Validación:**
```typescript
const isValid = confirmText.toUpperCase() === 'CONFIRMAR'

// Botón deshabilitado hasta que sea válido
<button
  disabled={!isValid || isSubmitting}
  className={isValid ? 'bg-rose-600' : 'bg-slate-800'}
>
  Cerrar Sesión
</button>
```

---

## 📊 COMPONENTES AUXILIARES

### CalibrationComparisonChart.tsx

**Objetivo:** Overlay Before/After usando DistributionGauge como referencia

```typescript
'use client'

import { memo, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'

interface CalibrationComparisonChartProps {
  originalDistribution: number[]
  calibratedDistribution: number[]
}

export default memo(function CalibrationComparisonChart({
  originalDistribution,
  calibratedDistribution
}: CalibrationComparisonChartProps) {
  
  const chartData = useMemo(() => {
    const labels = ['Bajo', 'Desarrollo', 'Sólido', 'Alto', 'Excepcional']
    
    return labels.map((label, idx) => ({
      label,
      original: originalDistribution[idx] || 0,
      calibrated: calibratedDistribution[idx] || 0
    }))
  }, [originalDistribution, calibratedDistribution])
  
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-300 mb-1">
          Distribución de Potencial: Antes vs Después
        </h3>
        <p className="text-xs text-slate-500">
          Curva gris = Original | Curva de color = Calibrada
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradOriginal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#64748B" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradCalibrated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          
          {/* Original: gris, opacidad baja, línea punteada */}
          <Area
            type="monotone"
            dataKey="original"
            stroke="#64748B"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gradOriginal)"
            fillOpacity={0.4}
          />
          
          {/* Calibrado: color vibrante, línea sólida */}
          <Area
            type="monotone"
            dataKey="calibrated"
            stroke="#22D3EE"
            strokeWidth={2.5}
            fill="url(#gradCalibrated)"
            fillOpacity={1}
          />
          
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
```

---

### FinancialImpactTicker.tsx

```typescript
'use client'

import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface FinancialImpactTickerProps {
  originalFactor: number
  calibratedFactor: number
  affectedEmployees: number
}

export default memo(function FinancialImpactTicker({
  originalFactor,
  calibratedFactor,
  affectedEmployees
}: FinancialImpactTickerProps) {
  
  const delta = calibratedFactor - originalFactor
  const deltaPct = (delta / originalFactor) * 100
  
  const Icon = delta > 0 ? TrendingUp : TrendingDown
  const color = delta > 0 ? 'emerald' : 'rose'
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Before */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Factor Inicial
        </p>
        <p className="text-4xl font-bold text-slate-400">
          {(originalFactor * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-slate-600 mt-2">
          {affectedEmployees} empleados
        </p>
      </div>
      
      {/* After */}
      <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-6`}>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          Factor Calibrado
          <Icon size={14} className={`text-${color}-400`} />
        </p>
        <p className={`text-4xl font-bold text-${color}-400`}>
          {(calibratedFactor * 100).toFixed(1)}%
        </p>
        <p className={`text-xs text-${color}-400/80 mt-2`}>
          {delta > 0 ? '+' : ''}{deltaPct.toFixed(1)}%
        </p>
      </div>
    </div>
  )
})
```

---

## 📄 GENERACIÓN DE PDF AUDITORÍA

### CalibrationAuditPDF.ts

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'

interface AuditPDFData {
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

export async function generateCalibrationAuditPDF(
  data: AuditPDFData
): Promise<Blob> {
  const doc = new jsPDF()
  
  // ═══════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════
  
  doc.setFontSize(20)
  doc.setTextColor(34, 211, 238) // Cyan FocalizaHR
  doc.text('FocalizaHR', 20, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Acta de Calibración de Desempeño', 20, 35)
  
  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════
  
  let yPos = 50
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Sesión: ${data.sessionName}`, 20, yPos)
  yPos += 7
  doc.text(`Fecha de Cierre: ${data.closedAt.toLocaleString('es-CL')}`, 20, yPos)
  yPos += 7
  doc.text(`Facilitador: ${data.facilitator}`, 20, yPos)
  yPos += 7
  doc.text(`Participantes: ${data.participants.join(', ')}`, 20, yPos)
  yPos += 10
  
  // ═══════════════════════════════════════════════════════════
  // HASH DE INTEGRIDAD + QR CODE
  // ═══════════════════════════════════════════════════════════
  
  const auditHash = `CAL-${data.sessionId}-${Date.now()}`
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Hash de Integridad: ${auditHash}`, 20, yPos)
  yPos += 10
  
  // Generate QR Code
  const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/calibration/verify/${data.sessionId}`
  const qrDataUrl = await QRCode.toDataURL(sessionUrl, {
    width: 100,
    margin: 1
  })
  
  doc.addImage(qrDataUrl, 'PNG', 160, yPos - 15, 30, 30)
  doc.setFontSize(7)
  doc.text('Escanea para verificar', 162, yPos + 18)
  
  yPos += 25
  
  // ═══════════════════════════════════════════════════════════
  // TABLA DE AJUSTES
  // ═══════════════════════════════════════════════════════════
  
  autoTable(doc, {
    startY: yPos,
    head: [['Empleado', 'Cargo', 'Original', 'Final', 'Nivel', 'Justificación']],
    body: data.adjustments.map(adj => [
      adj.employeeName,
      adj.position,
      adj.originalScore.toFixed(1),
      adj.finalScore.toFixed(1),
      adj.finalLevel,
      adj.justification.substring(0, 50) + (adj.justification.length > 50 ? '...' : '')
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
    }
  })
  
  // ═══════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════
  
  const pageCount = doc.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount} | FocalizaHR © ${new Date().getFullYear()}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  return doc.output('blob')
}
```

---

## 💬 MANAGER FEEDBACK GENERATOR

### ManagerFeedbackGenerator.ts

```typescript
interface FeedbackContext {
  employeeName: string
  originalScore: number
  finalScore: number
  originalLevel: string
  finalLevel: string
  justification: string
}

export function generateManagerFeedback(
  context: FeedbackContext
): string {
  const { employeeName, originalScore, finalScore, justification } = context
  
  const delta = finalScore - originalScore
  const wasDowngraded = delta < 0
  const wasUpgraded = delta > 0
  
  // ═══ DOWNGRADE (más delicado) ═══
  if (wasDowngraded) {
    return `
Hola,

Quiero conversar contigo sobre la evaluación de ${employeeName}.

Durante nuestra sesión de calibración, revisamos exhaustivamente todas las 
evaluaciones para asegurar equidad en el proceso.

**Cambio Aplicado:**
- Score original: ${originalScore.toFixed(1)}
- Score calibrado: ${finalScore.toFixed(1)}

**Contexto del Ajuste:**
${justification}

Este ajuste busca reflejar de manera más precisa el desempeño relativo de 
${employeeName} en comparación con sus pares.

**Próximos Pasos:**
1. Revisa el feedback específico en la plataforma
2. Agenda 1:1 con ${employeeName} para comunicar resultados
3. Enfoca la conversación en oportunidades de desarrollo

¿Podemos agendar 15 minutos para alinear el mensaje antes de tu 1:1?

Saludos,
[Facilitador]
    `.trim()
  }
  
  // ═══ UPGRADE (celebración) ═══
  if (wasUpgraded) {
    return `
Hola,

¡Excelentes noticias sobre ${employeeName}!

Durante la calibración ejecutiva, identificamos que su desempeño merece 
un reconocimiento mayor al inicialmente asignado.

**Ajuste Aplicado:**
- Score original: ${originalScore.toFixed(1)}
- Score calibrado: ${finalScore.toFixed(1)}

**Razón:**
${justification}

Este ajuste refuerza nuestro compromiso con la equidad y el reconocimiento 
del alto desempeño.

**Recomendación:**
Comunica este resultado destacando el valor que aporta ${employeeName} al 
equipo y explora oportunidades de desarrollo acelerado.

Saludos,
[Facilitador]
    `.trim()
  }
  
  // ═══ SIN CAMBIO ═══
  return `
La evaluación de ${employeeName} fue validada durante la calibración y se 
mantiene sin cambios (${finalScore.toFixed(1)}).

No requiere conversación adicional sobre ajustes.
  `.trim()
}
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### Actualizar: POST /api/calibration/sessions/[id]/close

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    // ═══ 1. Cerrar sesión (commit adjustments) ═══
    const result = await CalibrationService.closeSession(sessionId)
    
    // ═══ 2. Generar datos para PDF ═══
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        facilitator: true,
        participants: { include: { participant: true } },
        ratings: {
          include: {
            employee: true,
            adjustments: { where: { status: 'APPLIED' } }
          }
        }
      }
    })
    
    const pdfData: AuditPDFData = {
      sessionId: session.id,
      sessionName: session.name,
      closedAt: new Date(),
      facilitator: session.facilitator.fullName,
      participants: session.participants.map(p => p.participant.fullName),
      adjustments: session.ratings
        .filter(r => r.adjustments.length > 0)
        .map(r => ({
          employeeName: r.employee.fullName,
          position: r.employee.position,
          originalScore: r.calculatedScore,
          finalScore: r.finalScore,
          originalLevel: r.calculatedLevel,
          finalLevel: r.finalLevel,
          justification: r.adjustments[0]?.justification || ''
        }))
    }
    
    // ═══ 3. Generar PDF ═══
    const pdfBlob = await generateCalibrationAuditPDF(pdfData)
    
    // ═══ 4. Upload a Supabase Storage ═══
    const fileName = `calibration-${sessionId}-${Date.now()}.pdf`
    const pdfUrl = await uploadToSupabaseStorage(fileName, pdfBlob)
    
    // ═══ 5. Guardar URL en sesión ═══
    await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: { auditPdfUrl: pdfUrl }
    })
    
    return NextResponse.json({
      success: true,
      message: `Sesión cerrada. ${result.applied.length} ajustes aplicados.`,
      data: {
        sessionId,
        adjustmentsApplied: result.applied.length,
        auditPdfUrl: pdfUrl
      }
    })
  } catch (error: any) {
    console.error('[CALIBRATION CLOSE ERROR]:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión', details: error.message },
      { status: 500 }
    )
  }
}

// Helper: Upload to Supabase Storage
async function uploadToSupabaseStorage(
  fileName: string,
  blob: Blob
): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from('calibration-audits')
    .upload(fileName, blob, { contentType: 'application/pdf' })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('calibration-audits')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

---

## 🎨 ORQUESTADOR PRINCIPAL

### ClosingCeremonyModal.tsx

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import StepEvidence from './StepEvidence'
import StepCost from './StepCost'
import StepVerdict from './StepVerdict'
import { useRouter } from 'next/navigation'

interface ClosingCeremonyModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  originalDistribution: number[]
  calibratedDistribution: number[]
  originalBonusFactor: number
  calibratedBonusFactor: number
  totalEmployees: number
  totalAdjustments: number
}

export default function ClosingCeremonyModal({
  isOpen,
  onClose,
  sessionId,
  originalDistribution,
  calibratedDistribution,
  originalBonusFactor,
  calibratedBonusFactor,
  totalEmployees,
  totalAdjustments
}: ClosingCeremonyModalProps) {
  
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [financialAuthorized, setFinancialAuthorized] = useState(false)
  
  async function handleConfirm() {
    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}/close`,
        { method: 'POST' }
      )
      
      if (!response.ok) throw new Error('Error al cerrar sesión')
      
      router.push(`/dashboard/performance/calibration/sessions/${sessionId}`)
      router.refresh()
    } catch (error) {
      console.error('Error closing session:', error)
      throw error
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl h-[90vh] mx-4 bg-[#0B1120] rounded-2xl border border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Cerrar Sesión</h2>
            <p className="text-sm text-slate-400 mt-1">
              Paso {currentStep} de 3
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Progress */}
        <div className="h-1 bg-slate-900">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            animate={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepEvidence
                originalDistribution={originalDistribution}
                calibratedDistribution={calibratedDistribution}
                totalEmployees={totalEmployees}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <StepCost
                originalBonusFactor={originalBonusFactor}
                calibratedBonusFactor={calibratedBonusFactor}
                affectedEmployees={totalEmployees}
                isAuthorized={financialAuthorized}
                onAuthorize={setFinancialAuthorized}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <StepVerdict
                totalAdjustments={totalAdjustments}
                sessionId={sessionId}
                onConfirm={handleConfirm}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```yaml
DEPENDENCIAS:
  ☐ npm install jspdf jspdf-autotable qrcode

SERVICIOS:
  ☐ CalibrationAuditPDF.ts
  ☐ ManagerFeedbackGenerator.ts
  ☐ uploadToSupabaseStorage helper

COMPONENTES WIZARD:
  ☐ ClosingCeremonyModal.tsx
  ☐ StepEvidence.tsx
  ☐ StepCost.tsx
  ☐ StepVerdict.tsx

AUXILIARES:
  ☐ CalibrationComparisonChart.tsx
  ☐ FinancialImpactTicker.tsx

BACKEND:
  ☐ Actualizar POST /close con PDF generation
  ☐ Upload PDF a Supabase Storage
  ☐ Campo auditPdfUrl en schema

INTEGRACIÓN:
  ☐ Botón "Cerrar Sesión" en CinemaPage
  ☐ Calcular originalDistribution/calibratedDistribution
  ☐ Calcular bonus factors
```

---

## ✅ CRITERIOS DE ÉXITO

```yaml
FUNCIONALIDAD:
  ✅ Modal fullscreen
  ✅ 3 pasos secuenciales
  ✅ Chart overlay before/after
  ✅ Delta bonus factor
  ✅ Warning CFO si delta > 5%
  ✅ Checkbox obligatorio
  ✅ Input "CONFIRMAR" validado
  ✅ PDF con QR + Hash
  ✅ Manager feedback generado

DISEÑO:
  ✅ bg-slate-950/95
  ✅ Transiciones suaves
  ✅ Progress bar
  ✅ Gradiente rose final

ARQUITECTURA:
  ✅ Estado transitorio
  ✅ PDF inmutable
  ✅ TypeScript strict
```

---

## 🚀 PROMPT PARA CLAUDE CODE

```markdown
Lee .claude/tasks/TASK_16_CLOSING_CEREMONY_DEFINITIVA.md completo.

# TASK_16: Closing Ceremony

## INSTALACIÓN
npm install jspdf jspdf-autotable qrcode

## ORDEN

### 1. Servicios
- CalibrationAuditPDF.ts (jsPDF + autoTable + QR)
- ManagerFeedbackGenerator.ts (templates)
- uploadToSupabaseStorage.ts (helper)

### 2. Auxiliares
- CalibrationComparisonChart.tsx (AreaChart)
- FinancialImpactTicker.tsx (grid 2 cols)

### 3. Steps
- StepEvidence.tsx (chart + KPI)
- StepCost.tsx (ticker + checkbox)
- StepVerdict.tsx (input + loading)

### 4. Modal
- ClosingCeremonyModal.tsx (wizard)

### 5. Backend
- Actualizar POST /close (PDF generation)

### 6. Integración
- Botón en CinemaPage
- Calcular distributions
- Props a modal

Implementa en orden 1→2→3→4→5→6
```
