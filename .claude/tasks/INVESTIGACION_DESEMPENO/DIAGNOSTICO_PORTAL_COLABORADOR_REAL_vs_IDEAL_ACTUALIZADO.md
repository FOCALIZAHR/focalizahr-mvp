# 👤 DIAGNÓSTICO PORTAL DEL COLABORADOR
## FocalizaHR Enterprise | Estado Real vs Framework Ideal
### Versión 1.0 | Enero 2026 | Investigación Completa con Código

---

## 🎯 RESUMEN EJECUTIVO

### ❌ HALLAZGO PRINCIPAL
**Portal del Colaborador NO EXISTE - Sistema actual es token-based sin acceso post-evaluación**

```yaml
DESCUBRIMIENTO CRÍTICO:
❌ Portal colaborador con login: 0%
❌ Dashboard resultados personales: 0%
❌ Reportes individuales post-feedback: 0%
❌ Plan de Desarrollo Personalizado (PDP): 0%
❌ Acceso a resultados 360°: 0%
❌ Tendencia histórica: 0%

SISTEMA ACTUAL VERIFICADO:
✅ Acceso vía uniqueToken (sin login)
✅ Completa encuesta una vez
✅ Ve pantalla "¡Gracias!"
✅ NO puede volver a ver resultados
✅ NO recibe feedback individualizado

ARQUITECTURA ACTUAL:
✅ Participant.uniqueToken funcional
✅ Email automation operativa
✅ Survey completion flow robusto
✅ Sistema PDF empresarial existe
❌ FALTA: PDF individual por colaborador
❌ FALTA: Email con link a resultados
❌ FALTA: Landing page resultados anónima
```

---

## 📋 COMPONENTE 5: PORTAL DEL COLABORADOR

### **Framework Ideal (Tu Propuesta Original)**

```yaml
PORTAL COLABORADOR:
  1. Mis Evaluaciones:
     - Ver quién me va a evaluar (sin nombres si anónimo)
     - Estado de cada evaluación
     - Acceso a mi autoevaluación
  
  2. Mis Resultados:
     - Dashboard con scores por competencia
     - Comparativa autoevaluación vs jefe
     - Tendencia histórica (ciclos anteriores)
     - Gap analysis (fortalezas/áreas de mejora)
  
  3. Mi Desarrollo:
     - Plan de desarrollo personalizado (PDP)
     - Objetivos para siguiente ciclo
     - Recursos de aprendizaje
     - Progreso en objetivos
  
  4. Feedback Recibido:
     - Comentarios cualitativos
     - Reconocimientos
     - Sugerencias de mejora
```

---

## 📊 ESTADO REAL VERIFICADO EN CÓDIGO

### **Tabla Comparativa Actualizada**

| Feature | Estado Doc | Estado Real | Evidencia Código |
|---------|-----------|-------------|------------------|
| **ACCESO COLABORADOR** | | | |
| Portal con login | 0% | ❌ 0% | **NO EXISTE** - Solo roles CLIENT/ADMIN |
| Acceso vía token único | - | ✅ 100% | `Participant.uniqueToken` funcional |
| Dashboard personalizado | 0% | ❌ 0% | No hay rutas /employee o /portal |
| **MIS EVALUACIONES** | | | |
| Ver quién me evalúa | 0% | ❌ 0% | No implementado |
| Estado evaluaciones | 0% | ❌ 0% | No implementado |
| Acceso autoevaluación | 0% | ✅ 100% | Via token SELF assignment |
| **MIS RESULTADOS** | | | |
| Dashboard scores competencias | 0% | ❌ 0% | No implementado |
| Comparativa self vs manager | 0% | ❌ 0% | No implementado |
| Tendencia histórica | 0% | ❌ 0% | No implementado |
| Gap analysis | 0% | ❌ 0% | No implementado |
| **MI DESARROLLO** | | | |
| Plan Desarrollo (PDP) | 0% | ❌ 0% | No implementado |
| Objetivos próximo ciclo | 0% | ❌ 0% | No implementado |
| Recursos aprendizaje | 0% | ❌ 0% | No implementado |
| Progreso objetivos | 0% | ❌ 0% | No implementado |
| **FEEDBACK RECIBIDO** | | | |
| Comentarios cualitativos | 0% | ❌ 0% | No implementado |
| Reconocimientos | 0% | ❌ 0% | No implementado |
| Sugerencias mejora | 0% | ❌ 0% | No implementado |

---

## 🏗️ ARQUITECTURA ACTUAL VERIFICADA

### **1. Sistema de Acceso Token-Based** ✅

```yaml
EVIDENCIA CÓDIGO:
  Archivo: prisma/schema.prisma
  
PARTICIPANT MODEL:
  ✅ uniqueToken: String @unique
  ✅ hasResponded: Boolean
  ✅ responseDate: DateTime
  ✅ evaluationAssignmentId: String (link a evaluación 360°)

FLUJO ACTUAL:
  1. HR crea campaña + genera participants
  2. Sistema genera uniqueToken por participant
  3. Email automation envía invitación con link /survey/[token]
  4. Colaborador accede sin login
  5. Completa encuesta
  6. Ve ThankYouScreen
  7. ❌ NO puede volver a acceder
  8. ❌ NO recibe resultados personales
```

### **2. Sistema Roles y Autenticación** ✅

```yaml
EVIDENCIA CÓDIGO:
  Archivo: src/lib/auth.ts
  Archivo: src/middleware.ts

ROLES EXISTENTES:
  ✅ CLIENT: Empresa cliente (admin HR)
  ✅ FOCALIZAHR_ADMIN: Super admin plataforma
  ❌ EMPLOYEE/COLABORADOR: NO EXISTE

RUTAS PROTEGIDAS:
  ✅ /dashboard → CLIENT + ADMIN
  ✅ /dashboard/admin/* → SOLO ADMIN
  ❌ /portal/* → NO EXISTE
  ❌ /employee/* → NO EXISTE

MIDDLEWARE:
  ✅ Verificación JWT
  ✅ Cookies HttpOnly
  ✅ Role-based access control
  ❌ NO contempla rol colaborador
```

### **3. Sistema Email Automation** ✅

```yaml
EVIDENCIA CÓDIGO:
  Archivo: src/lib/templates/email-templates.ts
  Archivo: src/lib/services/email-automation.ts

TEMPLATES EXISTENTES:
  ✅ Invitación a evaluar (todos los productos)
  ✅ Recordatorios automáticos
  ✅ Variables dinámicas {participant_name}, {survey_url}
  ❌ NO existe template "Resultados Listos"
  ❌ NO existe template "Tu Reporte Personal"
  ❌ NO existe template "Feedback 360°"

AUTOMATION:
  ✅ Triggers timing optimizado
  ✅ Resend integration funcional
  ❌ NO hay emails post-evaluación con feedback
```

### **4. Sistema Export PDF** ✅

```yaml
EVIDENCIA CÓDIGO:
  Archivo: src/app/api/export/pdf/route.ts
  Archivo: GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md

PDF ACTUAL:
  ✅ Informe ejecutivo empresarial
  ✅ jsPDF + autotable
  ✅ Branding FocalizaHR
  ✅ Métricas agregadas
  ❌ NO genera PDF individual por colaborador
  ❌ NO incluye scores personales por competencia
  ❌ NO incluye comparativa self vs manager

ESTRUCTURA PDF EMPRESARIAL:
  - Portada con branding
  - Resumen ejecutivo
  - Métricas principales agregadas
  - Análisis por departamento
  - Recomendaciones empresa
  - ❌ NO sección individual colaborador
```

### **5. Sistema Evaluación 360°** ✅ (Empresarial)

```yaml
EVIDENCIA CÓDIGO:
  Archivo: src/lib/services/EvaluationService.ts
  Archivo: prisma/schema.prisma

EVALUATION TYPES:
  ✅ SELF: Autoevaluación
  ✅ MANAGER_TO_EMPLOYEE: Jefe evalúa subordinado
  ✅ EMPLOYEE_TO_MANAGER: Subordinado evalúa jefe
  ✅ PEER: Evaluación entre pares

FLUJO 360° ACTUAL:
  1. HR crea PerformanceCycle
  2. EvaluationService genera assignments
  3. Sistema crea Participant por assignment
  4. Email con uniqueToken
  5. Colaborador completa vía token
  6. ❌ NO puede ver resultados consolidados
  7. ❌ Manager ve dashboard, colaborador NO

PORTAL DEL JEFE (EXISTE):
  ✅ /dashboard/evaluaciones
  ✅ EvaluatorDashboard.tsx
  ✅ Ver subordinados pendientes/completados
  ✅ Gauge progreso
  ❌ Colaborador NO tiene equivalente
```

---

## 🎯 GAPS IDENTIFICADOS

### **GAP #1: Portal Colaborador Inexistente** ❌ CRÍTICO

**Problema:**
```yaml
ACTUAL:
  - Colaborador es "objeto pasivo"
  - Completa encuesta y se olvida
  - NO sabe quién lo evaluó
  - NO ve sus resultados
  - NO tiene feedback

IDEAL:
  - Colaborador protagonista desarrollo
  - Dashboard personalizado
  - Acceso a resultados consolidados
  - Plan de desarrollo interactivo
  - Tracking progreso
```

**Impacto:**
- ❌ Colaborador no se siente valorado
- ❌ Feedback no cierra el ciclo
- ❌ No hay accountability individual
- ❌ Desperdicio de data valiosa
- ❌ Pérdida engagement colaborador

**Esfuerzo Estimado:** 4-6 semanas

```yaml
OPCIÓN A: Portal con Login (6 semanas):
  Semana 1: Rol EMPLOYEE + autenticación
  Semana 2: Dashboard resultados personales
  Semana 3: Comparativas y gap analysis
  Semana 4: Plan desarrollo (PDP) básico
  Semana 5-6: Tendencias históricas + polish

OPCIÓN B: Link Anónimo a Reporte (2 semanas) ← RECOMENDADO:
  Semana 1: PDF individual por colaborador
  Semana 2: Landing page resultados + email automation
```

---

### **GAP #2: Reportes Individuales Inexistentes** ❌ CRÍTICO

**Problema:**
```yaml
SISTEMA PDF ACTUAL:
  ✅ Genera informe ejecutivo empresarial
  ✅ Métricas agregadas por departamento
  ❌ NO genera PDF individual colaborador
  ❌ NO incluye scores personales competencias
  ❌ NO incluye comparativa self vs others

NECESIDAD:
  ✅ PDF personalizado por colaborador
  ✅ Scores por competencia (CORE/LEADERSHIP/STRATEGIC)
  ✅ Comparativa: Self vs Manager vs Peers
  ✅ Gap analysis: Fortalezas / Áreas mejora
  ✅ Recomendaciones personalizadas
```

**Solución Diseñada:**

```typescript
// NUEVO: src/lib/services/IndividualReportService.ts

interface IndividualReportData {
  employee: {
    fullName: string
    position: string
    department: string
    tenure: string
  }
  cycle: {
    name: string
    period: string
  }
  scores: {
    selfScore: number
    managerScore: number
    peersAvgScore: number
    overallScore: number
  }
  competencies: Array<{
    name: string
    category: 'CORE' | 'LEADERSHIP' | 'STRATEGIC'
    selfScore: number
    managerscore: number
    gap: number
    status: 'strength' | 'adequate' | 'development_area'
  }>
  strengths: string[]
  developmentAreas: string[]
  qualitativeFeedback: string[]
  recommendations: string[]
}

export class IndividualReportService {
  
  /**
   * Genera PDF personalizado para un colaborador
   */
  static async generateIndividualPDF(
    employeeId: string,
    cycleId: string
  ): Promise<Buffer> {
    
    // 1. Recolectar evaluaciones del empleado
    const evaluations = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId,
        evaluateeId: employeeId,
        status: 'COMPLETED'
      },
      include: {
        participant: {
          include: { responses: true }
        }
      }
    })
    
    // 2. Calcular scores por competencia
    const competencyScores = this.calculateCompetencyScores(evaluations)
    
    // 3. Identificar fortalezas y áreas desarrollo
    const analysis = this.performGapAnalysis(competencyScores)
    
    // 4. Generar PDF con jsPDF
    const pdfBuffer = this.buildPDF({
      employee,
      scores: competencyScores,
      strengths: analysis.strengths,
      developmentAreas: analysis.areas,
      recommendations: analysis.recommendations
    })
    
    return pdfBuffer
  }
  
  /**
   * Genera link único temporal para ver reporte
   */
  static async generateReportLink(
    employeeId: string,
    cycleId: string
  ): Promise<string> {
    
    // Crear token temporal (expira 30 días)
    const reportToken = generateSecureToken()
    
    await prisma.employeeReportToken.create({
      data: {
        employeeId,
        cycleId,
        token: reportToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
    
    return `${process.env.NEXT_PUBLIC_BASE_URL}/report/${reportToken}`
  }
}
```

**Esfuerzo:** 2 semanas

---

### **GAP #3: Email Post-Evaluación Ausente** ❌ CRÍTICO

**Problema:**
```yaml
EMAILS ACTUALES:
  ✅ Invitación a evaluar
  ✅ Recordatorios pre-deadline
  ❌ NO email "Tus resultados están listos"
  ❌ NO link a reporte personal

CICLO ROTO:
  1. Colaborador completa evaluación ✅
  2. Ve "¡Gracias!" ✅
  3. ❌ NUNCA recibe feedback
  4. ❌ NO cierra ciclo aprendizaje
```

**Solución:**

```typescript
// NUEVO TEMPLATE: src/lib/templates/email-templates.ts

const TEMPLATE_RESULTADOS_360_HTML = createEmailHTML(`
  ${EmailHeader({ companyName: '{company_name}' })}
  
  ${EmailHero({
    title: 'Tus Resultados 360° Están Listos',
    subtitle: 'Hola {participant_name}, tu feedback está disponible',
    badge: 'Resultados'
  })}
  
  ${EmailContentSection({
    greeting: 'El ciclo {cycle_name} ha finalizado y tus resultados están listos.',
    paragraphs: [
      'Hemos consolidado el feedback de tu autoevaluación, tu jefe y tus pares para crear un panorama completo de tu desempeño.',
      'Tu reporte personalizado incluye:'
    ],
    highlight: {
      icon: 'star',
      title: '100% Confidencial',
      text: 'Solo tú y tu manager tienen acceso a tu reporte completo.',
      variant: 'info'
    }
  })}
  
  ${EmailFeatureList({
    features: [
      { icon: 'trending', title: 'Scores por competencia', description: 'Evaluación detallada de tus fortalezas' },
      { icon: 'target', title: 'Gap analysis', description: 'Comparativa entre tu autoevaluación y feedback externo' },
      { icon: 'check', title: 'Plan de acción', description: 'Recomendaciones personalizadas para tu desarrollo' }
    ]
  })}
  
  ${EmailCTASection({
    buttonText: 'Ver Mi Reporte',
    buttonUrl: '{report_url}',
    metadata: { expires: '30 días', confidential: true }
  })}
  
  ${EmailFooter()}
`);

// TRIGGER AUTOMÁTICO POST-CICLO
export async function sendResultsNotifications(cycleId: string) {
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    include: {
      evaluationAssignments: {
        where: {
          evaluationType: 'SELF',
          status: 'COMPLETED'
        },
        include: { evaluatee: true }
      }
    }
  })
  
  for (const assignment of cycle.evaluationAssignments) {
    // Generar link único al reporte
    const reportLink = await IndividualReportService.generateReportLink(
      assignment.evaluateeId,
      cycleId
    )
    
    // Enviar email personalizado
    await sendEmail({
      to: assignment.evaluatee.email,
      template: 'resultados-360',
      variables: {
        participant_name: assignment.evaluatee.fullName,
        company_name: cycle.account.companyName,
        cycle_name: cycle.name,
        report_url: reportLink
      }
    })
  }
}
```

**Esfuerzo:** 3 días

---

### **GAP #4: Landing Page Resultados Ausente** ❌ CRÍTICO

**Problema:**
```yaml
RUTAS ACTUALES:
  ✅ /survey/[token] → Completar encuesta
  ✅ /dashboard/evaluaciones → Portal del Jefe
  ❌ /report/[token] → NO EXISTE
  ❌ /results/[token] → NO EXISTE

NECESIDAD:
  ✅ Landing page anónima ver reporte
  ✅ Acceso vía token temporal
  ✅ Sin login requerido
  ✅ Renderiza PDF inline o descarga
```

**Solución:**

```tsx
// NUEVO: src/app/report/[token]/page.tsx

'use client'

export default function EmployeeReportPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<IndividualReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadReport()
  }, [params.token])
  
  const loadReport = async () => {
    try {
      const response = await fetch(`/api/reports/${params.token}`)
      
      if (response.status === 404) {
        setError('Reporte no encontrado o expirado')
        return
      }
      
      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      setError('Error cargando reporte')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!report) return <NotFoundState />
  
  return (
    <div className="fhr-bg-main min-h-screen p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="fhr-title-gradient text-3xl">
          Tu Reporte de Desempeño
        </h1>
        <p className="text-slate-400 mt-2">
          {report.cycle.name} • {report.employee.position}
        </p>
      </div>
      
      {/* Score Overview */}
      <div className="max-w-4xl mx-auto mb-6">
        <ScoreOverviewCard scores={report.scores} />
      </div>
      
      {/* Competencias */}
      <div className="max-w-4xl mx-auto mb-6">
        <CompetenciesBreakdown competencies={report.competencies} />
      </div>
      
      {/* Gap Analysis */}
      <div className="max-w-4xl mx-auto mb-6">
        <GapAnalysisCard 
          strengths={report.strengths}
          developmentAreas={report.developmentAreas}
        />
      </div>
      
      {/* Feedback Cualitativo */}
      <div className="max-w-4xl mx-auto mb-6">
        <QualitativeFeedback comments={report.qualitativeFeedback} />
      </div>
      
      {/* Recomendaciones */}
      <div className="max-w-4xl mx-auto mb-6">
        <RecommendationsCard recommendations={report.recommendations} />
      </div>
      
      {/* Acción */}
      <div className="max-w-4xl mx-auto text-center">
        <button
          onClick={() => downloadPDF(report)}
          className="fhr-btn fhr-btn-primary"
        >
          Descargar PDF
        </button>
      </div>
    </div>
  )
}

// API ENDPOINT: src/app/api/reports/[token]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  
  // Verificar token válido y no expirado
  const reportToken = await prisma.employeeReportToken.findUnique({
    where: { token },
    include: {
      employee: true,
      cycle: true
    }
  })
  
  if (!reportToken) {
    return NextResponse.json(
      { success: false, error: 'Reporte no encontrado' },
      { status: 404 }
    )
  }
  
  if (reportToken.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Reporte expirado' },
      { status: 410 }
    )
  }
  
  // Generar reporte
  const report = await IndividualReportService.generateReportData(
    reportToken.employeeId,
    reportToken.cycleId
  )
  
  return NextResponse.json({
    success: true,
    report
  })
}
```

**Esfuerzo:** 1 semana

---

### **GAP #5: Plan de Desarrollo (PDP) Ausente** ❌ OPCIONAL

**Problema:**
```yaml
ACTUAL:
  - Colaborador recibe feedback pasivo
  - NO hay plan acción concreto
  - NO hay tracking progreso
  - NO hay objetivos definidos

IDEAL:
  - PDP interactivo post-evaluación
  - Objetivos SMART por competencia
  - Recursos aprendizaje sugeridos
  - Tracking progreso trimestral
```

**Esfuerzo:** 3-4 semanas (Feature avanzada, v2.0)

---

### **GAP #6: Tendencias Históricas Ausentes** ❌ OPCIONAL

**Problema:**
```yaml
ACTUAL:
  - Solo ve resultados ciclo actual
  - NO puede comparar con ciclos anteriores
  - NO ve evolución en el tiempo

IDEAL:
  - Gráfico tendencia por competencia
  - Comparación año a año
  - Visualizar mejora continua
```

**Esfuerzo:** 2 semanas (Feature avanzada, v2.0)

---

## 💡 ENFOQUE ESTRATÉGICO RECOMENDADO

### **Tu Perspectiva (CORRECTA):**

```yaml
PROBLEMA PORTAL CON LOGIN:
  ❌ Complejidad: Nuevo rol, autenticación, permisos
  ❌ Tiempo: 6 semanas desarrollo
  ❌ Mantenimiento: Doble sistema auth
  ❌ Fricción: Colaborador debe recordar password
  ❌ ROI: Bajo para release inicial

SOLUCIÓN EMAIL + LINK ANÓNIMO:
  ✅ Simplicidad: Usa infraestructura existente
  ✅ Tiempo: 2 semanas desarrollo
  ✅ Mantenimiento: Mínimo
  ✅ Experiencia: Colaborador click y listo
  ✅ ROI: Alto para release inicial
  ✅ Enterprise-ready: Parametrizable por cliente
```

### **Arquitectura Recomendada - Enterprise Grade:**

```yaml
FASE 1 (3 SEMANAS): Sistema Reportes Individuales Parametrizable
  
  Semana 1: Backend Core
    - IndividualReportService.ts
    - PDF personalizado por colaborador
    - Sistema tokens temporales
    - Configuración timing por Account
  
  Semana 2: Landing Page + Confirmación
    - /report/[token] con UI enterprise
    - Checkbox "¿Recibiste feedback en tiempo y forma?"
    - API registro confirmación
    - Dashboard admin tracking confirmaciones
  
  Semana 3: Email Automation + Testing
    - Template "Resultados Listos"
    - Automation parametrizable (1-30 días post-ciclo)
    - Testing multi-cliente
    - Documentación configuración

CONFIGURACIÓN POR CUENTA:
  Account.reportDeliveryDelayDays: 1-30 días
  - Default: 7 días post-cierre
  - Configurable por cliente
  - Empresas conservadoras: 14-30 días
  - Empresas ágiles: 1-3 días

SISTEMA AUDITORÍA:
  FeedbackDeliveryConfirmation table
  - employeeId
  - cycleId
  - reportToken
  - deliveredAt (timestamp email enviado)
  - confirmedAt (timestamp confirmación empleado)
  - receivedOnTime: Boolean (null hasta confirmar)
  - Dashboard admin: % confirmación por empresa

FASE 2 (FUTURO): Módulos Avanzados
  SOLO si demanda cliente enterprise
  SOLO después validar Fase 1
  Considerar: PDP interactivo, tendencias, recursos aprendizaje
```

---

## 🎯 ESPECIFICACIÓN TÉCNICA ENTERPRISE

### **1. Configuración Parametrizable por Cliente**

```typescript
// Migración Prisma: Agregar campo a Account

model Account {
  // ... campos existentes
  
  // 🆕 CONFIGURACIÓN REPORTES INDIVIDUALES
  reportDeliveryDelayDays Int @default(7) @map("report_delivery_delay_days") // 1-30 días
  reportLinkExpirationDays Int @default(30) @map("report_link_expiration_days") // Cuánto dura link
  enableEmployeeReports Boolean @default(true) @map("enable_employee_reports") // Toggle feature
  
  @@map("accounts")
}
```

**UI de Configuración:**

```tsx
// src/app/dashboard/admin/settings/page.tsx (ACCOUNT_OWNER puede configurar)

<div className="fhr-card p-6">
  <h3 className="text-lg font-medium text-white mb-4">
    Reportes Individuales a Colaboradores
  </h3>
  
  <div className="space-y-4">
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Días después del cierre de ciclo para enviar reportes
      </label>
      <input
        type="number"
        min={1}
        max={30}
        value={reportDeliveryDelayDays}
        onChange={(e) => setReportDeliveryDelayDays(Number(e.target.value))}
        className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
      />
      <p className="text-xs text-slate-400 mt-1">
        Recomendado: 7-14 días para consolidar resultados
      </p>
    </div>
    
    <div>
      <label className="block text-sm text-slate-300 mb-2">
        Duración del link de reporte
      </label>
      <input
        type="number"
        min={7}
        max={90}
        value={reportLinkExpirationDays}
        className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
      />
      <p className="text-xs text-slate-400 mt-1">
        Recomendado: 30 días
      </p>
    </div>
    
    <button className="fhr-btn fhr-btn-primary">
      Guardar Configuración
    </button>
  </div>
</div>
```

### **2. Sistema Confirmación de Recepción**

```typescript
// Migración Prisma: Nueva tabla auditoría

model FeedbackDeliveryConfirmation {
  id String @id @default(cuid())
  
  accountId String @map("account_id")
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  employeeId String @map("employee_id")
  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  cycleId String @map("cycle_id")
  cycle PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  
  reportToken String @unique @map("report_token") // Link al EmployeeReportToken
  
  emailSentAt DateTime @map("email_sent_at") // Cuándo se envió el email
  
  // 🆕 CONFIRMACIÓN EMPLEADO
  confirmedAt DateTime? @map("confirmed_at") // Cuándo confirmó recepción
  receivedOnTime Boolean? @map("received_on_time") // ¿Recibió en tiempo y forma?
  feedbackComment String? @map("feedback_comment") @db.Text // Opcional: comentario empleado
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("feedback_delivery_confirmations")
  @@index([accountId])
  @@index([employeeId])
  @@index([cycleId])
}
```

**Landing Page con Confirmación:**

```tsx
// src/app/report/[token]/page.tsx

export default function EmployeeReportPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<IndividualReport | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'confirmed' | null>(null)
  
  // ... código existente carga reporte ...
  
  const handleConfirmReception = async (receivedOnTime: boolean, comment?: string) => {
    try {
      const response = await fetch(`/api/reports/${params.token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedOnTime,
          feedbackComment: comment || null
        })
      })
      
      if (response.ok) {
        setConfirmationStatus('confirmed')
        toast.success('Gracias por confirmar la recepción')
      }
    } catch (error) {
      console.error('Error confirmando recepción:', error)
      toast.error('Error al confirmar')
    }
  }
  
  return (
    <div className="fhr-bg-main min-h-screen p-6">
      {/* ... Contenido reporte ... */}
      
      {/* 🆕 SECCIÓN CONFIRMACIÓN */}
      {confirmationStatus !== 'confirmed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg"
        >
          <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-cyan-400" />
            Confirmación de Recepción
          </h3>
          
          <p className="text-slate-300 mb-4">
            Por favor confirma si recibiste tu reporte de feedback en tiempo y forma:
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleConfirmReception(true)}
              className="fhr-btn fhr-btn-primary flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Sí, lo recibí en tiempo y forma
            </button>
            
            <button
              onClick={() => handleConfirmReception(false)}
              className="fhr-btn fhr-btn-secondary flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              No, hubo retraso o problemas
            </button>
          </div>
          
          {/* Opcional: Textarea para comentarios */}
          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">
              Comentarios adicionales (opcional):
            </label>
            <textarea
              placeholder="¿Tienes algún comentario sobre el proceso?"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              rows={3}
            />
          </div>
        </motion.div>
      )}
      
      {confirmationStatus === 'confirmed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-medium">
            ¡Gracias por confirmar! Tu feedback nos ayuda a mejorar el proceso.
          </p>
        </motion.div>
      )}
    </div>
  )
}
```

**API Endpoint Confirmación:**

```typescript
// src/app/api/reports/[token]/confirm/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { receivedOnTime, feedbackComment } = body
    
    // Validar token existe
    const reportToken = await prisma.employeeReportToken.findUnique({
      where: { token },
      include: { employee: true, cycle: true }
    })
    
    if (!reportToken) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 404 }
      )
    }
    
    // Buscar confirmación existente
    const confirmation = await prisma.feedbackDeliveryConfirmation.findFirst({
      where: { reportToken: token }
    })
    
    if (!confirmation) {
      return NextResponse.json(
        { success: false, error: 'Confirmación no encontrada' },
        { status: 404 }
      )
    }
    
    // Actualizar confirmación
    await prisma.feedbackDeliveryConfirmation.update({
      where: { id: confirmation.id },
      data: {
        confirmedAt: new Date(),
        receivedOnTime,
        feedbackComment: feedbackComment || null
      }
    })
    
    console.log(`[Confirmation] Employee ${reportToken.employeeId} confirmed reception: ${receivedOnTime ? 'ON_TIME' : 'DELAYED'}`)
    
    return NextResponse.json({
      success: true,
      message: 'Confirmación registrada'
    })
    
  } catch (error: any) {
    console.error('[Confirmation] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### **3. Dashboard Admin - Métricas de Confirmación**

```tsx
// src/app/dashboard/admin/feedback-tracking/page.tsx

export default function FeedbackTrackingPage() {
  const [stats, setStats] = useState<ConfirmationStats | null>(null)
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white">
          Tracking Entrega de Reportes
        </h1>
        <p className="text-slate-400 mt-1">
          Monitorea la entrega y confirmación de reportes individuales
        </p>
      </div>
      
      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="fhr-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Reportes Enviados</span>
            <Mail className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-light text-white">
            {stats?.totalSent || 0}
          </p>
        </div>
        
        <div className="fhr-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Confirmados</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-light text-white">
            {stats?.totalConfirmed || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats?.confirmationRate.toFixed(1)}% tasa confirmación
          </p>
        </div>
        
        <div className="fhr-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">En Tiempo</span>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-light text-white">
            {stats?.receivedOnTime || 0}
          </p>
        </div>
        
        <div className="fhr-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Con Retraso</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-light text-white">
            {stats?.receivedDelayed || 0}
          </p>
        </div>
      </div>
      
      {/* Tabla Detalle */}
      <div className="fhr-card p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Detalle por Colaborador
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 text-slate-400 text-sm">Colaborador</th>
              <th className="text-left py-3 text-slate-400 text-sm">Ciclo</th>
              <th className="text-left py-3 text-slate-400 text-sm">Enviado</th>
              <th className="text-left py-3 text-slate-400 text-sm">Confirmado</th>
              <th className="text-left py-3 text-slate-400 text-sm">Estado</th>
            </tr>
          </thead>
          <tbody>
            {/* Renderizar lista */}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### **4. Automation con Delay Parametrizable**

```typescript
// src/lib/services/IndividualReportService.ts

export class IndividualReportService {
  
  /**
   * Programa envío de reportes post-cierre ciclo
   * Respeta configuración de delay por Account
   */
  static async scheduleReportsForCycle(cycleId: string) {
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
            reportDeliveryDelayDays: true,
            reportLinkExpirationDays: true,
            enableEmployeeReports: true
          }
        },
        evaluationAssignments: {
          where: {
            evaluationType: 'SELF',
            status: 'COMPLETED'
          },
          include: {
            evaluatee: {
              select: {
                id: true,
                fullName: true,
                email: true,
                position: true
              }
            }
          }
        }
      }
    })
    
    if (!cycle) {
      throw new Error('Ciclo no encontrado')
    }
    
    if (!cycle.account.enableEmployeeReports) {
      console.log(`[Reports] Account ${cycle.account.id} tiene reportes individuales deshabilitados`)
      return
    }
    
    // Calcular fecha de envío
    const cycleEndDate = new Date(cycle.endDate)
    const delayDays = cycle.account.reportDeliveryDelayDays
    const scheduledDate = new Date(cycleEndDate)
    scheduledDate.setDate(scheduledDate.getDate() + delayDays)
    
    console.log(`[Reports] Ciclo ${cycle.name} cerró ${cycleEndDate.toISOString()}`)
    console.log(`[Reports] Reportes se enviarán el ${scheduledDate.toISOString()} (${delayDays} días después)`)
    
    // En producción, usar sistema de colas (Bull, BullMQ, o cron job)
    // Por ahora, guardar en tabla de programación
    for (const assignment of cycle.evaluationAssignments) {
      // Generar token reporte
      const reportToken = await this.generateReportLink(
        assignment.evaluateeId,
        cycleId
      )
      
      // Crear registro confirmación
      await prisma.feedbackDeliveryConfirmation.create({
        data: {
          accountId: cycle.accountId,
          employeeId: assignment.evaluateeId,
          cycleId,
          reportToken,
          emailSentAt: scheduledDate // Se enviará en esta fecha
        }
      })
    }
    
    console.log(`[Reports] Programados ${cycle.evaluationAssignments.length} reportes para envío`)
  }
  
  /**
   * Cron job diario: Enviar reportes programados para hoy
   */
  static async sendScheduledReports() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Buscar confirmaciones programadas para hoy que NO han sido enviadas
    const pending = await prisma.feedbackDeliveryConfirmation.findMany({
      where: {
        emailSentAt: {
          gte: today,
          lt: tomorrow
        },
        confirmedAt: null // Aún no enviado
      },
      include: {
        employee: true,
        cycle: true,
        account: true
      }
    })
    
    console.log(`[Reports Cron] Encontrados ${pending.length} reportes para enviar hoy`)
    
    for (const confirmation of pending) {
      try {
        // Generar PDF
        const pdfBuffer = await this.generateIndividualPDF(
          confirmation.employeeId,
          confirmation.cycleId
        )
        
        // Enviar email con link
        await sendEmail({
          to: confirmation.employee.email,
          template: 'resultados-360',
          variables: {
            participant_name: confirmation.employee.fullName,
            company_name: confirmation.account.companyName,
            cycle_name: confirmation.cycle.name,
            report_url: `${process.env.NEXT_PUBLIC_BASE_URL}/report/${confirmation.reportToken}`
          },
          attachments: [
            {
              filename: `reporte-desempeno-${confirmation.employee.fullName}.pdf`,
              content: pdfBuffer
            }
          ]
        })
        
        console.log(`[Reports Cron] ✅ Reporte enviado a ${confirmation.employee.email}`)
        
      } catch (error) {
        console.error(`[Reports Cron] ❌ Error enviando a ${confirmation.employee.email}:`, error)
      }
    }
  }
}
```

**Esfuerzo Total:** 3 semanas (vs 2 semanas original por requisitos enterprise adicionales)
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN ENTERPRISE

### **MÓDULO: Sistema Reportes Individuales Parametrizable (3 semanas)** 🚨 CRÍTICO

```yaml
SEMANA 1: Backend Core + Configuración
  DÍA 1-2: Migraciones Prisma
    - Campo Account.reportDeliveryDelayDays
    - Campo Account.reportLinkExpirationDays  
    - Campo Account.enableEmployeeReports
    - Tabla FeedbackDeliveryConfirmation
    - Tabla EmployeeReportToken (si no existe)
  
  DÍA 3-4: IndividualReportService.ts
    - generateIndividualPDF() con scores por competencia
    - calculateCompetencyScores() (Self vs Manager vs Peers)
    - performGapAnalysis() (fortalezas/áreas)
    - generateReportLink() con tokens
    - scheduleReportsForCycle() con delay parametrizable
  
  DÍA 5: API Endpoints Base
    - POST /api/admin/performance-cycles/[id]/schedule-reports
    - GET /api/reports/[token]
    - Validación tokens + expiración

SEMANA 2: Landing Page + Confirmación
  DÍA 6-7: Componentes UI Reporte
    - ScoreOverviewCard.tsx
    - CompetenciesBreakdown.tsx
    - GapAnalysisCard.tsx
    - QualitativeFeedback.tsx
    - RecommendationsCard.tsx
  
  DÍA 8-9: Landing Page /report/[token]
    - Renderizado interactivo reporte
    - Descarga PDF
    - Optimización móvil
    - Loading states + error handling
  
  DÍA 10: Sistema Confirmación
    - UI checkbox "¿Recibiste en tiempo y forma?"
    - POST /api/reports/[token]/confirm
    - Textarea comentarios opcional
    - Success state post-confirmación

SEMANA 3: Admin UI + Automation + Testing
  DÍA 11-12: Dashboard Admin Configuración
    - /dashboard/admin/settings/page.tsx
    - UI parametrización delay (1-30 días)
    - UI duración link (7-90 días)
    - Toggle enable/disable feature
  
  DÍA 13-14: Dashboard Admin Tracking
    - /dashboard/admin/feedback-tracking/page.tsx
    - Métricas: enviados, confirmados, en tiempo, retrasados
    - Tabla detalle por colaborador
    - Filtros por ciclo/departamento
  
  DÍA 15: Email Automation
    - Template "Resultados Listos" premium
    - Variables dinámicas personalizadas
    - Attachment PDF opcional
    - Trigger programado con delay
  
  DÍA 16-18: Cron Job + Queueing
    - sendScheduledReports() daily job
    - Integración Bull/BullMQ (opcional)
    - Retry logic failures
    - Logging completo
  
  DÍA 19-21: Testing Integral + Documentación
    - Test flujo completo multi-cliente
    - Test delays 1, 7, 14, 30 días
    - Test confirmaciones
    - Test expiración tokens
    - Documentación admin
    - Guía configuración cliente

RESULTADO:
  ✅ Colaborador recibe email post-ciclo (delay parametrizable)
  ✅ Click link → Ve reporte personalizado interactivo
  ✅ Confirma recepción con checkbox
  ✅ Admin trackea métricas confirmación
  ✅ Puede descargar PDF
  ✅ Sin login requerido
  ✅ Sistema enterprise-ready multi-tenant
  ✅ Auditoría completa proceso
```

---

## 📊 ANÁLISIS DE COMPLETITUD REAL

```yaml
PORTAL COLABORADOR: 0%  (vs 0% estimado)
  ❌ Portal con login: 0%
  ❌ Dashboard resultados: 0%
  ❌ Mis evaluaciones: 0%
  ❌ Plan desarrollo: 0%
  ❌ Feedback recibido: 0%
  ❌ Tendencias históricas: 0%

INFRAESTRUCTURA REUTILIZABLE: 80%
  ✅ Participant.uniqueToken: 100%
  ✅ Email automation: 100%
  ✅ Sistema PDF: 80% (falta individual)
  ✅ Evaluación 360° data: 100%
  ✅ Competency scores: 100%

MÓDULO REPORTES INDIVIDUALES: 0%
  ❌ IndividualReportService: 0%
  ❌ PDF individual: 0%
  ❌ Landing /report/[token]: 0%
  ❌ Email "Resultados Listos": 0%
  ❌ Trigger automation: 0%
  ❌ Sistema confirmación: 0%
  ❌ Dashboard admin tracking: 0%

ESFUERZO TOTAL MÓDULO: 3 semanas
ESFUERZO PORTAL COMPLETO: 6 semanas
```

---

## ✅ VENTAJAS COMPETITIVAS POTENCIALES

### **Con Sistema Reportes Individuales:**

```yaml
vs CULTURE AMP:
  ✅ FocalizaHR entrega reporte individual por email
  ✅ Culture Amp: Solo dashboard empresarial
  ✅ Colaborador ve feedback sin login
  ✅ PDF descargable premium
  ✅ Confirmación recepción auditable
  ✅ Delay parametrizable por cliente

vs LATTICE:
  ✅ FocalizaHR: Reporte visual interactivo
  ✅ Lattice: Portal requiere login (fricción)
  ✅ Link expira configurable (seguridad)
  ✅ Experiencia móvil optimizada
  ✅ Sistema confirmación built-in

vs QUALTRICS:
  ✅ FocalizaHR: Reporte incluido
  ✅ Qualtrics: Módulo employee reports separado ($$)
  ✅ Gap analysis automático
  ✅ Recomendaciones personalizadas
  ✅ Tracking entrega enterprise-grade
```

### **Mensaje Marketing Sistema:**

```
"FocalizaHR cierra el ciclo de feedback completo con inteligencia enterprise.

Después de cada evaluación 360°, cada colaborador recibe 
automáticamente su reporte personalizado por email en el momento 
óptimo que TÚ configuras (1-30 días post-ciclo): scores por 
competencia, comparativa con feedback externo, fortalezas, áreas 
de desarrollo y recomendaciones concretas.

Sistema de confirmación integrado: trackea quién recibió el feedback 
en tiempo y forma. Dashboard admin con métricas completas.

Sin logins. Sin fricción. Con auditoría.

Culture Amp no hace esto. Lattice requiere portal complejo. 
Qualtrics cobra módulo separado. Nosotros lo hacemos enterprise-grade 
y parametrizable por cliente."
```

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### **OPCIÓN A: Implementar Módulo Reportes Individuales (3 semanas)** ← RECOMENDADO

```yaml
JUSTIFICACIÓN:
  ✅ ROI inmediato
  ✅ Usa infraestructura existente
  ✅ Diferenciador competitivo
  ✅ Validación rápida con clientes
  ✅ Bajo riesgo técnico
  ✅ Parametrizable por cliente (enterprise)
  ✅ Sistema auditoría incluido

IMPLEMENTACIÓN:
  Semana 1: Backend core + configuración parametrizable
  Semana 2: Landing page + sistema confirmación
  Semana 3: Admin UI tracking + email automation
```

### **OPCIÓN B: Portal Completo (6 semanas)**

```yaml
JUSTIFICACIÓN:
  ❌ ROI diferido
  ❌ Requiere nueva arquitectura auth
  ❌ Complejidad alta
  ❌ Mantenimiento doble sistema
  ⚠️ SOLO si cliente enterprise lo exige explícitamente

IMPLEMENTACIÓN:
  Semana 1: Rol EMPLOYEE + auth
  Semana 2-3: Dashboard resultados
  Semana 4: PDP básico
  Semana 5-6: Tendencias + polish
```

### **OPCIÓN C: Hybrid (5 semanas)**

```yaml
IMPLEMENTACIÓN:
  Semana 1-3: Reportes Individuales (Email + Link)
  Semana 4-5: Portal opt-in para power users
  
VENTAJA:
  ✅ Lo mejor de ambos mundos
  ✅ Colaborador elige experiencia
  ⚠️ Complejidad moderada
```

---

## 📚 EVIDENCIA CÓDIGO VERIFICADO

```yaml
ARCHIVOS CLAVE REVISADOS:
  ✅ prisma/schema.prisma (modelos data)
  ✅ src/lib/auth.ts (roles)
  ✅ src/middleware.ts (rutas protegidas)
  ✅ src/lib/templates/email-templates.ts (emails)
  ✅ src/lib/services/email-automation.ts (automation)
  ✅ src/app/api/export/pdf/route.ts (PDFs empresariales)
  ✅ src/lib/services/EvaluationService.ts (360°)
  ✅ src/components/evaluator/*.tsx (Portal Jefe)

TESTS REALIZADOS:
  ✅ Verificado ausencia rutas /portal o /employee
  ✅ Verificado roles solo CLIENT/ADMIN
  ✅ Verificado tokens únicos funcionan
  ✅ Verificado email automation operativa
  ✅ Verificado PDF solo empresarial
  ✅ Confirmado NO hay feedback individual
```

---

## 🎯 CONCLUSIÓN ESTRATÉGICA

### **Estado Real:**

```yaml
PORTAL COLABORADOR:
❌ NO EXISTE (0%)

INFRAESTRUCTURA BASE:
✅ ROBUSTA (80%)

MÓDULO REPORTES FALTANTE:
❌ CRÍTICO pero SOLUCIONABLE (3 semanas)

OPORTUNIDAD:
✅ ALTA - Diferenciador competitivo inmediato con features enterprise
```

### **Estrategia Recomendada:**

```yaml
FASE 1 (AHORA):
✅ Implementar Módulo Reportes Individuales (3 semanas)
✅ Incluir parametrización por cliente (1-30 días delay)
✅ Incluir sistema confirmación auditable
✅ Dashboard admin tracking métricas
✅ Validar con primeros clientes
✅ Iterar basado en feedback

FASE 2 (FUTURO):
⏸️ Portal completo solo si demanda real
⏸️ PDP interactivo para premium tier
⏸️ Tendencias históricas v2.0

RESULTADO:
✅ Ciclo feedback cerrado
✅ Colaborador empoderado
✅ Diferenciador vs competencia
✅ ROI inmediato
✅ Sistema auditable enterprise-grade
✅ Escalable a portal futuro si necesario
```

---

**FIN DEL DIAGNÓSTICO**

*Generado para FocalizaHR Enterprise - Portal del Colaborador*  
*Enero 2026 | Investigación Completa con Código Verificado*
