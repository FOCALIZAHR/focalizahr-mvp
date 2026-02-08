# TASK 18B: WIZARD PASO 5 + SISTEMA EMAILS

**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 4-5 horas  
**Prerequisito:** TASK 18A completada + corregida  
**Objetivo:** Paso "Publicar" + Programación Emails + Toast FocalizaHR

---

## 🚨 VERIFICACIÓN PREVIA OBLIGATORIA

**ANTES de escribir cualquier código, Code DEBE:**

### 1. Leer Filosofía de Diseño FocalizaHR
```
view /mnt/project/FILOSOFIA_DISENO_FOCALIZAHR_v2.md
```

**Buscar:** Los 6 Patrones de Página
- Pattern A: One Screen Decision
- Pattern B: Command Center  
- Pattern C: Detail + Drawer
- Pattern D: Cockpit + Tabs
- Pattern E: Landing + Mission ← **APLICAR ESTE**
- Pattern F: Guided Journey ← **Y ESTE (Wizard)**

### 2. Leer Sistema de Notificaciones
```
view /mnt/project/📬 SISTEMA DE NOTIFICACIONES FOCALIZAHR.docx
```

**Confirmar:**
- ✅ `useToast()` existe y funciona
- ✅ Colores: cyan (#22D3EE), purple (#A78BFA)
- ✅ Auto-highlighting de nombres y números

### 3. Leer Sistema de Emails EXISTENTE
```
view /mnt/project/DOCUMENTACION_SISTEMA_EMAILS_FOCALIZAHR_v5_FINAL.md
```

**Confirmar arquitectura:**
- ✅ `queueCampaignEmails()` existe como referencia
- ✅ Protocolo Resend: delay 550ms, loop secuencial
- ✅ EmailLog con status SENT/FAILED
- ✅ Rate limiting 100 emails/día (Free Tier)

### 4. Verificar Schema Prisma REAL
```
view prisma/schema.prisma
```

**Buscar modelo `CalibrationSession` y confirmar:**
- Campo `scheduledAt` existe (DateTime)
- Campo `status` existe (DRAFT | IN_PROGRESS | CLOSED)
- Relación `participants` existe

---

## 🎯 QUÉ IMPLEMENTAR (CORREGIDO)

1. **Paso 5 Wizard:** "Revisión y Publicación" (Pattern F: Guided Journey)
2. **Endpoint:** POST `/api/calibration/sessions/[id]/publish`
3. **Sistema Emails PROGRAMADOS:** `scheduleCalibrationEmails(sessionId)` ← CAMBIO CLAVE
4. **Template:** Email invitación calibración
5. **Toast:** Integración `useToast()` FocalizaHR
6. **Cron Job:** Para enviar emails en `scheduledAt`

---

## 📋 CORRECCIÓN CONCEPTUAL IMPORTANTE

### ❌ ERROR CONCEPTUAL ORIGINAL:
```typescript
// Mal: Enviar emails inmediatamente al publicar
await queueCalibrationEmails(sessionId) // ← INCORRECTO
```

### ✅ ARQUITECTURA CORRECTA:
```typescript
// Bien: PROGRAMAR emails para scheduledAt
await scheduleCalibrationEmails(sessionId) // ← CORRECTO

// Los emails se envían automáticamente vía CRON cuando:
// - NOW >= session.scheduledAt
// - session.status === 'IN_PROGRESS'
// - emails NOT sent yet
```

---

## 🎯 FLUJO CORRECTO

```yaml
Usuario completa Wizard Paso 5:
  - Revisa resumen
  - Click "Publicar Sesión"
  ↓
Backend POST /publish:
  - Cambia status: DRAFT → IN_PROGRESS
  - Crea EmailAutomation records (SCHEDULED)
  - scheduledFor = session.scheduledAt
  ↓
Cron Job (cada hora):
  - Busca EmailAutomation pendientes
  - WHERE scheduledFor <= NOW AND status = 'SCHEDULED'
  - Envía emails
  - Actualiza status: SCHEDULED → SENT
  ↓
Panelistas reciben email:
  - En la fecha/hora programada
  - Link único a War Room
```

---

## 🎯 QUÉ IMPLEMENTAR (VERSIÓN CORRECTA)

---

## 📋 IMPLEMENTACIÓN COMPLETA

### **1. Wizard - Agregar Paso 5 (Pattern F: Guided Journey)**

**Archivo:** `src/components/calibration/wizard/CalibrationWizard.tsx`

**Agregar paso al array:**
```typescript
const steps = [
  { number: 1, title: 'Información Básica' },
  { number: 2, title: 'Criterios de Filtrado' },
  { number: 3, title: 'Configuración Distribución' },
  { number: 4, title: 'Participantes Panel' },
  { number: 5, title: 'Revisión y Publicación' }, // ✅ NUEVO
]
```

**Agregar renderizado condicional:**
```tsx
{currentStep === 5 && (
  <WizardStep5
    formData={formData}
    onPublish={handlePublish}
    onSaveDraft={handleSaveDraft}
    onBack={() => setCurrentStep(4)}
  />
)}
```

**Handler publicar CON TOAST:**
```typescript
import { useToast } from '@/components/ui/toast-system'

const { info, success, error } = useToast()

const handlePublish = async () => {
  try {
    // 1. Toast Info - Iniciando proceso
    info(
      `Programando invitaciones para ${formData.participants.length} panelistas...`,
      'Publicando Sesión'
    )
    
    // 2. POST endpoint
    const res = await fetch(`/api/calibration/sessions/${sessionId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const data = await res.json()
    
    if (!data.success) throw new Error(data.error)
    
    // 3. Toast Success - Emails PROGRAMADOS
    const scheduledDate = new Date(data.emailScheduledFor).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    success(
      `Sesión "${formData.name}" publicada. ${data.emailsScheduled} invitaciones programadas para ${scheduledDate}.`,
      '¡Sesión Activa!'
    )
    
    // 4. Redirect a War Room
    router.push(`/dashboard/performance/calibration/sessions/${sessionId}`)
    
  } catch (err) {
    error(
      'Error al publicar sesión. Intenta nuevamente.',
      'Error'
    )
  }
}
```

---

### **2. Component WizardStep5 (Pattern E: Landing + Mission)**

**Crear:** `src/components/calibration/wizard/WizardStep5.tsx`

```tsx
'use client'

import { Mail, Users, Calendar, Target, Clock } from 'lucide-react'

interface WizardStep5Props {
  formData: any
  onPublish: () => void
  onSaveDraft: () => void
  onBack: () => void
}

export default function WizardStep5({ 
  formData, 
  onPublish, 
  onSaveDraft, 
  onBack 
}: WizardStep5Props) {
  
  const scheduledDate = new Date(formData.scheduledAt)
  const now = new Date()
  const isScheduledFuture = scheduledDate > now
  
  return (
    <div className="space-y-6">
      {/* Header Pattern E */}
      <div>
        <h2 className="text-2xl font-light text-white mb-2">
          Revisión y Publicación
        </h2>
        <p className="text-slate-400">
          Revisa el resumen antes de publicar la sesión
        </p>
      </div>

      {/* Card Resumen - Glassmorphism */}
      <div className="fhr-card p-6 space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Resumen de Sesión
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Nombre:</span>
            <span className="text-white font-medium">{formData.name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Fecha programada:</span>
            <span className="text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              {scheduledDate.toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Criterio:</span>
            <span className="text-white">{getFilterModeLabel(formData.filterMode)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Empleados:</span>
            <span className="text-cyan-400 font-bold">{formData.preview?.length || 0}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Panelistas:</span>
            <span className="text-purple-400 font-bold">{formData.participants?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Lista Panelistas */}
      <div className="fhr-card p-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          Panelistas Invitados
        </h3>
        
        <div className="space-y-2">
          {formData.participants?.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-white font-medium">{p.participantName}</p>
                <p className="text-sm text-slate-400">{p.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                REVIEWER
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Emails PROGRAMADOS */}
      <div className="fhr-card p-4 border-l-4 border-cyan-500">
        <div className="flex items-start gap-3">
          {isScheduledFuture ? (
            <>
              <Clock className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-cyan-300 font-medium mb-1">
                  Emails programados automáticamente:
                </p>
                <ul className="text-cyan-200/80 space-y-1">
                  <li>• {formData.participants?.length || 0} invitaciones se enviarán el {scheduledDate.toLocaleDateString('es-CL')}</li>
                  <li>• Link único: <code className="text-xs bg-slate-800/50 px-1 py-0.5 rounded">/calibration/sessions/[id]</code></li>
                  <li>• Los panelistas podrán ingresar una vez enviado el email</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-cyan-300 font-medium mb-1">
                  Emails se enviarán inmediatamente:
                </p>
                <ul className="text-cyan-200/80 space-y-1">
                  <li>• {formData.participants?.length || 0} invitaciones</li>
                  <li>• La fecha programada ya pasó, se enviará al publicar</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Botones - Pattern E */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="fhr-btn-secondary"
        >
          Atrás
        </button>
        
        <button
          onClick={onSaveDraft}
          className="fhr-btn-secondary"
        >
          💾 Guardar Borrador
        </button>
        
        <button
          onClick={onPublish}
          className="flex-1 fhr-btn-primary"
        >
          🚀 Publicar Sesión
        </button>
      </div>
    </div>
  )
}

function getFilterModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'jobLevel': 'Por Nivel Jerárquico',
    'jobFamily': 'Por Familia de Cargos',
    'directReports': 'Por Reportes de Manager',
    'customPicks': 'Selección Manual',
    'department': 'Por Departamento'
  }
  return labels[mode] || mode
}
```

---

### **3. Backend - Endpoint Publish (CON PROGRAMACIÓN)**

**Crear:** `src/app/api/calibration/sessions/[sessionId]/publish/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const sessionId = params.sessionId

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1. Validar sesión
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        cycle: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (session.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Sesión ya publicada' }, { status: 400 })
    }

    if (session.participants.length === 0) {
      return NextResponse.json({ error: 'Sesión sin participantes' }, { status: 400 })
    }

    // 2. Transición estado
    await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })

    // 3. ✅ PROGRAMAR emails (NO enviar inmediatamente)
    const scheduledFor = session.scheduledAt || new Date()
    const now = new Date()
    const sendImmediately = scheduledFor <= now

    let emailsScheduled = 0

    for (const participant of session.participants) {
      if (!participant.email) continue

      await prisma.emailAutomation.create({
        data: {
          accountId: session.accountId,
          type: 'calibration_invitation',
          recipientEmail: participant.email,
          recipientName: participant.participantName,
          status: sendImmediately ? 'PENDING' : 'SCHEDULED',
          scheduledFor: sendImmediately ? now : scheduledFor,
          metadata: {
            sessionId,
            sessionName: session.name,
            participantId: participant.id
          }
        }
      })

      emailsScheduled++
    }

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        accountId: session.accountId,
        action: 'calibration_session_published',
        entityType: 'calibration_session',
        entityId: sessionId,
        metadata: {
          emailsScheduled,
          scheduledFor: scheduledFor.toISOString(),
          sendImmediately,
          participantsCount: session.participants.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      emailsScheduled,
      emailScheduledFor: scheduledFor.toISOString(),
      sendImmediately
    })

  } catch (error) {
    console.error('[API POST /publish] Error:', error)
    return NextResponse.json(
      { error: 'Error publicando sesión' },
      { status: 500 }
    )
  }
}
```

---

### **4. Cron Job - Envío Emails Programados**

**Crear:** `src/app/api/cron/send-calibration-emails/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { renderCalibrationInviteTemplate } from '@/lib/templates/calibration-invite-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Buscar emails pendientes de envío
    const pendingEmails = await prisma.emailAutomation.findMany({
      where: {
        type: 'calibration_invitation',
        status: { in: ['SCHEDULED', 'PENDING'] },
        scheduledFor: { lte: new Date() }
      },
      take: 50 // Batch de 50
    })

    let sent = 0
    const errors: string[] = []

    for (const email of pendingEmails) {
      try {
        const session = await prisma.calibrationSession.findUnique({
          where: { id: email.metadata.sessionId as string }
        })

        if (!session) {
          errors.push(`Session not found: ${email.metadata.sessionId}`)
          continue
        }

        const sessionUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/performance/calibration/sessions/${session.id}`

        const { subject, html } = renderCalibrationInviteTemplate({
          participantName: email.recipientName || 'Panelista',
          sessionName: session.name,
          sessionUrl,
          scheduledDate: session.scheduledAt || new Date(),
          employeeCount: 0 // TODO: get from metadata
        })

        const { data, error: resendError } = await resend.emails.send({
          from: 'FocalizaHR <noreply@focalizahr.cl>',
          to: email.recipientEmail,
          subject,
          html
        })

        if (resendError) {
          errors.push(`${email.recipientEmail}: ${resendError.message}`)
          
          await prisma.emailAutomation.update({
            where: { id: email.id },
            data: {
              status: 'FAILED',
              sentAt: new Date(),
              error: resendError.message
            }
          })
          
          continue
        }

        // Email enviado exitosamente
        await prisma.emailAutomation.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            externalId: data.id
          }
        })

        // Crear EmailLog
        await prisma.emailLog.create({
          data: {
            accountId: email.accountId,
            type: 'calibration_invitation',
            recipientEmail: email.recipientEmail,
            subject,
            status: 'SENT',
            sentAt: new Date(),
            metadata: {
              sessionId: email.metadata.sessionId,
              resendId: data.id
            }
          }
        })

        sent++

        // Rate limit: 550ms delay
        await new Promise(resolve => setTimeout(resolve, 550))

      } catch (err: any) {
        errors.push(`${email.recipientEmail}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      errors
    })

  } catch (error) {
    console.error('[CRON send-calibration-emails] Error:', error)
    return NextResponse.json(
      { error: 'Error processing emails' },
      { status: 500 }
    )
  }
}
```

**Configurar Vercel Cron:**

**Archivo:** `vercel.json` (agregar)

```json
{
  "crons": [
    {
      "path": "/api/cron/send-calibration-emails",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

### **5. Template Email (Reutilizar arquitectura existente)**

**Crear:** `src/lib/templates/calibration-invite-template.ts`

```typescript
export function renderCalibrationInviteTemplate(variables: {
  participantName: string
  sessionName: string
  sessionUrl: string
  scheduledDate: Date
  employeeCount: number
}): { subject: string; html: string } {
  
  const formattedDate = new Date(variables.scheduledDate).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    subject: `🎯 Invitación Calibración: ${variables.sessionName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header {
            background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content {
            background: #f8fafc;
            padding: 40px 30px;
            border-radius: 0 0 12px 12px;
          }
          .session-card {
            background: white;
            border-left: 4px solid #22D3EE;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .session-card h2 {
            margin: 0 0 15px 0;
            color: #0f172a;
            font-size: 20px;
          }
          .info-row {
            display: flex;
            align-items: center;
            margin: 10px 0;
            color: #64748b;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #22D3EE, #3B82F6);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Sesión de Calibración</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
              Has sido invitado/a como panelista
            </p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">
              Hola <strong>${variables.participantName}</strong>,
            </p>
            
            <p>
              Has sido seleccionado/a para participar como <strong>panelista</strong> 
              en una sesión de calibración. Tu criterio es fundamental para asegurar 
              equidad y objetividad en las evaluaciones.
            </p>
            
            <div class="session-card">
              <h2>${variables.sessionName}</h2>
              <div class="info-row">
                📅 <strong>Programada:</strong> ${formattedDate}
              </div>
            </div>
            
            <p><strong>Tu rol como panelista:</strong></p>
            <ul style="color: #475569;">
              <li>Revisar evaluaciones de desempeño</li>
              <li>Proponer ajustes cuando sea necesario</li>
              <li>Asegurar equidad y calibración justa</li>
              <li>Participar en discusiones del panel</li>
            </ul>
            
            <center>
              <a href="${variables.sessionUrl}" class="cta-button">
                🚀 Ingresar a Sesión
              </a>
            </center>
            
            <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; font-size: 14px; color: #92400e; margin-top: 30px;">
              <strong>⚠️ Importante:</strong> Esta sesión estará disponible hasta su cierre oficial.
            </p>
          </div>
          
          <div class="footer">
            <p>FocalizaHR - Inteligencia Organizacional</p>
            <p style="font-size: 12px; color: #cbd5e1;">
              Este es un email automático. Por favor no responder.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
```

---

## ✅ VALIDACIÓN

```yaml
Wizard:
  - [ ] Paso 5 visible con resumen correcto
  - [ ] Botones Pattern E funcionan
  - [ ] Toast info aparece al publicar
  - [ ] Toast success muestra fecha programación
  - [ ] Redirect a War Room funciona

Backend:
  - [ ] POST /publish valida status DRAFT
  - [ ] Transición DRAFT → IN_PROGRESS exitosa
  - [ ] EmailAutomation records creados
  - [ ] scheduledFor = session.scheduledAt
  - [ ] Audit log registra acción

Cron:
  - [ ] GET /cron/send-calibration-emails funciona
  - [ ] Solo envía emails scheduledFor <= NOW
  - [ ] EmailAutomation status: SCHEDULED → SENT
  - [ ] EmailLog creado correctamente
  - [ ] Rate limit Resend respetado (550ms)

Emails:
  - [ ] Template renderiza correctamente
  - [ ] Link en email funciona
  - [ ] No se envían inmediatamente si scheduledAt es futuro
  - [ ] Se envían correctamente cuando cron ejecuta
```

---

**FIN TASK 18B CORREGIDA**

Ejecutar DESPUÉS de TASK 18A corregida.

### **1. Wizard - Agregar Paso 5**

**Archivo:** `src/components/calibration/wizard/CalibrationWizard.tsx`

**Agregar paso al array de steps:**

```typescript
const steps = [
  { number: 1, title: 'Información Básica' },
  { number: 2, title: 'Criterios de Filtrado' },
  { number: 3, title: 'Configuración Distribución' },
  { number: 4, title: 'Participantes Panel' },
  { number: 5, title: 'Revisión y Publicación' }, // ✅ NUEVO
]
```

**Agregar component Step5:**

```tsx
{currentStep === 5 && (
  <WizardStep5
    formData={formData}
    onPublish={handlePublish}
    onSaveDraft={handleSaveDraft}
    onBack={() => setCurrentStep(4)}
  />
)}

// Handler publicar
const handlePublish = async () => {
  const { info, success, error } = useToast()
  
  try {
    info(
      `Enviando invitaciones a ${formData.participants.length} panelistas...`,
      'Publicando Sesión'
    )
    
    const res = await fetch(`/api/calibration/sessions/${sessionId}/publish`, {
      method: 'POST'
    })
    
    const data = await res.json()
    
    if (!data.success) throw new Error(data.error)
    
    success(
      `Sesión "${formData.name}" publicada. ${data.emailsSent} invitaciones enviadas.`,
      '¡Sesión Activa!'
    )
    
    router.push(`/dashboard/performance/calibration/sessions/${sessionId}`)
    
  } catch (err) {
    error('Error al publicar sesión. Intenta nuevamente.', 'Error')
  }
}
```

**Crear component WizardStep5.tsx:**

```tsx
// src/components/calibration/wizard/WizardStep5.tsx
'use client'

import { Mail, Users, Calendar, Target } from 'lucide-react'

export default function WizardStep5({ formData, onPublish, onSaveDraft, onBack }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-white mb-2">
          Revisión y Publicación
        </h2>
        <p className="text-slate-400">
          Revisa el resumen antes de publicar la sesión
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Resumen de Sesión
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Nombre:</span>
            <span className="text-white font-medium">{formData.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Fecha programada:</span>
            <span className="text-white">{formatDate(formData.scheduledAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Criterio:</span>
            <span className="text-white">{getFilterModeLabel(formData.filterMode)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Empleados:</span>
            <span className="text-cyan-400 font-bold">{formData.preview?.length || 0}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Panelistas:</span>
            <span className="text-purple-400 font-bold">{formData.participants?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Lista Panelistas */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          Panelistas Invitados
        </h3>
        
        <div className="space-y-2">
          {formData.participants?.map((p: any) => (
            <div key={p.email} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div>
                <p className="text-white font-medium">{p.participantName}</p>
                <p className="text-sm text-slate-400">{p.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                REVIEWER
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Emails */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-cyan-300 font-medium mb-1">Al publicar se enviarán:</p>
            <ul className="text-cyan-200/80 space-y-1">
              <li>• {formData.participants?.length || 0} emails invitación a panelistas</li>
              <li>• Link único: <code>/calibration/sessions/[id]</code></li>
              <li>• Los panelistas podrán ingresar inmediatamente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800/50 transition-colors"
        >
          Atrás
        </button>
        
        <button
          onClick={onSaveDraft}
          className="px-6 py-3 rounded-lg border border-slate-600 text-white hover:bg-slate-800/50 transition-colors"
        >
          💾 Guardar Borrador
        </button>
        
        <button
          onClick={onPublish}
          className="flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30 transition-all"
        >
          🚀 Publicar Sesión
        </button>
      </div>
    </div>
  )
}

function getFilterModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'jobLevel': 'Por Nivel Jerárquico',
    'jobFamily': 'Por Familia de Cargos',
    'directReports': 'Por Reportes de Manager',
    'customPicks': 'Selección Manual',
    'department': 'Por Departamento'
  }
  return labels[mode] || mode
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

---

### **2. Backend - Endpoint Publish**

**Crear:** `src/app/api/calibration/sessions/[sessionId]/publish/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { queueCalibrationEmails } from '@/lib/email/calibration-emails'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const sessionId = params.sessionId

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1. Validar sesión
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        cycle: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (session.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Sesión ya publicada' }, { status: 400 })
    }

    if (session.participants.length === 0) {
      return NextResponse.json({ error: 'Sesión sin participantes' }, { status: 400 })
    }

    // 2. Transición estado
    await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })

    // 3. Enviar emails
    const emailResult = await queueCalibrationEmails(sessionId)

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        accountId: session.accountId,
        action: 'calibration_session_published',
        entityType: 'calibration_session',
        entityId: sessionId,
        metadata: {
          emailsSent: emailResult.sent,
          emailsErrors: emailResult.errors.length,
          participantsCount: session.participants.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      emailsSent: emailResult.sent,
      emailsErrors: emailResult.errors
    })

  } catch (error) {
    console.error('[API POST /publish] Error:', error)
    return NextResponse.json(
      { error: 'Error publicando sesión' },
      { status: 500 }
    )
  }
}
```

---

### **3. Sistema Emails**

**Crear:** `src/lib/email/calibration-emails.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { renderCalibrationInviteTemplate } from '@/lib/templates/calibration-invite-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function queueCalibrationEmails(
  sessionId: string
): Promise<{ sent: number; errors: string[] }> {
  
  const session = await prisma.calibrationSession.findUnique({
    where: { id: sessionId },
    include: {
      participants: true,
      account: true,
      cycle: true
    }
  })

  if (!session) throw new Error('Session not found')

  let sent = 0
  const errors: string[] = []

  // Loop secuencial (Protocolo Resend - rate limit)
  for (const participant of session.participants) {
    if (!participant.email) {
      errors.push(`${participant.participantName}: Sin email`)
      continue
    }

    try {
      const sessionUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/performance/calibration/sessions/${sessionId}`
      
      const { subject, html } = renderCalibrationInviteTemplate({
        participantName: participant.participantName,
        sessionName: session.name,
        sessionUrl,
        scheduledDate: session.scheduledAt || new Date(),
        employeeCount: 0 // TODO: Get from metadata
      })

      const { data, error } = await resend.emails.send({
        from: 'FocalizaHR <noreply@focalizahr.cl>',
        to: participant.email,
        subject,
        html
      })

      if (error) {
        errors.push(`${participant.email}: ${error.message}`)
        continue
      }

      // EmailLog
      await prisma.emailLog.create({
        data: {
          accountId: session.accountId,
          type: 'calibration_invitation',
          recipientEmail: participant.email,
          subject,
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            sessionId,
            resendId: data.id
          }
        }
      })

      sent++

      // Delay 550ms (rate limit Resend)
      await new Promise(resolve => setTimeout(resolve, 550))

    } catch (err: any) {
      errors.push(`${participant.email}: ${err.message}`)
    }
  }

  return { sent, errors }
}
```

---

### **4. Template Email**

**Crear:** `src/lib/templates/calibration-invite-template.ts`

```typescript
export function renderCalibrationInviteTemplate(variables: {
  participantName: string
  sessionName: string
  sessionUrl: string
  scheduledDate: Date
  employeeCount: number
}): { subject: string; html: string } {
  
  const formattedDate = new Date(variables.scheduledDate).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return {
    subject: `🎯 Invitación Calibración: ${variables.sessionName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { background: #f8fafc; padding: 40px 30px; border-radius: 0 0 12px 12px; }
          .session-card { background: white; border-left: 4px solid #22D3EE; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .session-card h2 { margin: 0 0 15px 0; color: #0f172a; font-size: 20px; }
          .info-row { display: flex; align-items: center; margin: 10px 0; color: #64748b; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #22D3EE, #3B82F6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Sesión de Calibración</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Has sido invitado/a como panelista</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">Hola <strong>${variables.participantName}</strong>,</p>
            
            <p>Has sido seleccionado/a para participar como <strong>panelista</strong> en una sesión de calibración. Tu criterio es fundamental para asegurar equidad y objetividad en las evaluaciones.</p>
            
            <div class="session-card">
              <h2>${variables.sessionName}</h2>
              <div class="info-row">📅 <strong>Programada:</strong> ${formattedDate}</div>
              <div class="info-row">👥 <strong>Empleados a calibrar:</strong> ${variables.employeeCount}</div>
            </div>
            
            <p><strong>Tu rol como panelista:</strong></p>
            <ul style="color: #475569;">
              <li>Revisar evaluaciones de desempeño</li>
              <li>Proponer ajustes cuando sea necesario</li>
              <li>Asegurar equidad y calibración justa</li>
              <li>Participar en discusiones del panel</li>
            </ul>
            
            <center>
              <a href="${variables.sessionUrl}" class="cta-button">
                🚀 Ingresar a Sesión
              </a>
            </center>
            
            <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; font-size: 14px; color: #92400e; margin-top: 30px;">
              <strong>⚠️ Importante:</strong> Esta sesión estará disponible hasta su cierre oficial. Se recomienda revisar con antelación.
            </p>
          </div>
          
          <div class="footer">
            <p>FocalizaHR - Inteligencia Organizacional</p>
            <p style="font-size: 12px; color: #cbd5e1;">Este es un email automático. Por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
```

---

## ✅ VALIDACIÓN

```yaml
Wizard:
  - [ ] Paso 5 visible con resumen correcto
  - [ ] Botones "Guardar Borrador" + "Publicar" funcionan
  - [ ] Toast info aparece al publicar
  - [ ] Toast success aparece post-emails
  - [ ] Redirect a War Room funciona

Backend:
  - [ ] POST /publish valida status DRAFT
  - [ ] Transición DRAFT → IN_PROGRESS exitosa
  - [ ] queueCalibrationEmails envía correctamente
  - [ ] EmailLog creado por cada email
  - [ ] Audit log registra acción

Emails:
  - [ ] Template renderiza correctamente
  - [ ] Link en email funciona
  - [ ] Rate limit Resend respetado (550ms)
  - [ ] Errores capturados en response
```

---

**FIN TASK 18B**

Ejecutar DESPUÉS de TASK 18A.
