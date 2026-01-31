# BLOQUE-5: Emails Integration

## 📋 METADATA
- **Bloque:** 5 de 8
- **Dependencias:** ✅ BLOQUE-1, ✅ BLOQUE-4 completados
- **Archivos:** MODIFICAR 1 existente + CREAR 2 nuevos
- **Esfuerzo:** ~4 días (incluye testing email delivery)
- **Prioridad:** 🟡 ALTA (Comunicación con usuarios)

## 🎯 OBJETIVO DEL BLOQUE
Integrar sistema de emails para:
1. **Recordatorios Performance** - 3 niveles escalamiento evaluadores
2. **Envío Reportes Individuales** - Post-ciclo a evaluados
3. **Alertas Admin** - Baja tasa respuesta ciclos
4. **Cron Jobs** - Automatización envíos

**⚠️ CRÍTICO - ARQUITECTURA INTEGRADA:**
- **TODOS los templates van en `email-templates.ts` EXISTENTE**
- **NO crear archivos nuevos de templates**
- **Mantener SSOT (Single Source of Truth)**
- **Reutilizar `renderEmailTemplate()` existente**

---

## 📦 TAREAS INCLUIDAS

### T-GC-002-01: Templates Escalamiento Recordatorios

**Descripción:** Agregar 3 niveles urgencia recordatorios Performance al sistema existente

**⚠️ IMPORTANTE:** MODIFICAR archivo existente, NO crear nuevo

**Archivo:** `src/lib/templates/email-templates.ts` (MODIFICAR)

**Agregar al objeto `PREMIUM_EMAIL_TEMPLATES` (después de 'reminder-2'):**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE EVALUATION - RECORDATORIOS ESCALAMIENTO 3 NIVELES
// ════════════════════════════════════════════════════════════════════════════

'performance-reminder-level-1': {
  id: 'perf_reminder_1',
  campaignTypeSlug: 'performance-reminder-level-1',
  subject: '🔔 Recordatorio Amigable - Evaluación {{evaluatee_name}}',
  previewText: 'Tu feedback es valioso para el desarrollo del equipo',
  variables: ['evaluator_name', 'evaluatee_name', 'evaluatee_position', 'days_remaining', 'evaluation_url', 'company_name'],
  tone: 'Amigable, respetuoso, sin presión',
  ccManager: false,
  htmlContent: `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22D3EE;">Hola {{evaluator_name}},</h2>
      
      <p style="color: #64748B; line-height: 1.6;">
        Te recordamos que tienes pendiente completar la evaluación de desempeño de:
      </p>
      
      <div style="background: linear-gradient(135deg, #22D3EE20, #A78BFA20); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; color: #1E293B;">
          <strong style="color: #22D3EE;">{{evaluatee_name}}</strong><br>
          <span style="color: #64748B; font-size: 14px;">{{evaluatee_position}}</span>
        </p>
      </div>
      
      <p style="color: #64748B;">
        El ciclo cierra en <strong style="color: #F59E0B;">{{days_remaining}} días</strong>. 
        Tu feedback es muy valioso para el desarrollo del equipo.
      </p>
      
      <a href="{{evaluation_url}}" style="display: inline-block; background: linear-gradient(90deg, #22D3EE, #06B6D4); color: #FFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
        Completar Evaluación
      </a>
      
      <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
        ¿Necesitas ayuda? Responde a este email o contacta a RRHH.
      </p>
    </div>
  `
},

'performance-reminder-level-2': {
  id: 'perf_reminder_2',
  campaignTypeSlug: 'performance-reminder-level-2',
  subject: '⏰ Urgente - Evaluación {{evaluatee_name}} por Vencer',
  previewText: 'El plazo está por cumplirse',
  variables: ['evaluator_name', 'evaluatee_name', 'days_remaining', 'evaluation_url'],
  tone: 'Urgente pero profesional',
  ccManager: false,
  htmlContent: `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F59E0B20; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400E;">
          <strong>⏰ RECORDATORIO URGENTE</strong>
        </p>
      </div>
      
      <h2 style="color: #1E293B;">{{evaluator_name}},</h2>
      
      <p style="color: #64748B; line-height: 1.6;">
        El plazo para completar la evaluación de <strong>{{evaluatee_name}}</strong> 
        está por vencer en <strong style="color: #F59E0B;">{{days_remaining}} días</strong>.
      </p>
      
      <p style="color: #64748B;">
        Tu evaluación es fundamental para:
      </p>
      <ul style="color: #64748B;">
        <li>Decisiones de desarrollo profesional</li>
        <li>Planificación de capacitaciones</li>
        <li>Feedback constructivo al colaborador</li>
      </ul>
      
      <a href="{{evaluation_url}}" style="display: inline-block; background: #F59E0B; color: #FFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600;">
        Completar Ahora
      </a>
      
      <p style="color: #94A3B8; font-size: 12px;">
        Si tienes algún impedimento, por favor contacta a RRHH cuanto antes.
      </p>
    </div>
  `
},

'performance-reminder-level-3': {
  id: 'perf_reminder_3',
  campaignTypeSlug: 'performance-reminder-level-3',
  subject: '🚨 CRÍTICO - Última Oportunidad Evaluación {{evaluatee_name}}',
  previewText: 'Acción requerida inmediata',
  variables: ['evaluator_name', 'evaluatee_name', 'days_remaining', 'evaluation_url'],
  tone: 'Crítico, escalado a gerencia',
  ccManager: true, // OBLIGATORIO - Email se envía con CC al manager
  htmlContent: `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #EF444420; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #991B1B;">
          <strong>🚨 ACCIÓN REQUERIDA INMEDIATA</strong>
        </p>
      </div>
      
      <h2 style="color: #1E293B;">{{evaluator_name}},</h2>
      
      <p style="color: #EF4444; font-weight: 600; font-size: 16px;">
        El ciclo de evaluación cierra en {{days_remaining}} días y tu evaluación de 
        <strong>{{evaluatee_name}}</strong> aún está pendiente.
      </p>
      
      <p style="color: #64748B; line-height: 1.6;">
        <strong>Impacto de no completar a tiempo:</strong>
      </p>
      <ul style="color: #64748B;">
        <li>{{evaluatee_name}} no recibirá feedback constructivo</li>
        <li>Proceso de calibración se verá afectado</li>
        <li>Decisiones de talento podrían retrasarse</li>
      </ul>
      
      <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">
          <strong>⚠️ Nota:</strong> Este mensaje ha sido copiado a tu gerente. 
          Si no completas antes del cierre, se escalará a HR Leadership.
        </p>
      </div>
      
      <a href="{{evaluation_url}}" style="display: inline-block; background: #EF4444; color: #FFF; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 700; font-size: 16px;">
        COMPLETAR AHORA
      </a>
      
      <p style="color: #94A3B8; font-size: 12px;">
        Para cualquier consulta urgente, contacta a RRHH inmediatamente.
      </p>
    </div>
  `
}
```

**Nota implementación CC Manager:**
- Level 3 tiene `ccManager: true`
- Lógica en cron debe obtener email manager de evaluador
- Agregar a campo `cc` en Resend API call

---

### T-PC-004-01: Email Template Reportes Individuales

**Descripción:** Template email notificación reporte disponible

**Archivo:** `src/lib/templates/email-templates.ts` (MODIFICAR - mismo archivo)

**Agregar después de templates performance:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE EVALUATION - REPORTE INDIVIDUAL DISPONIBLE
// ════════════════════════════════════════════════════════════════════════════

'performance-report-ready': {
  id: 'performance_report_ready',
  campaignTypeSlug: 'performance-report-ready',
  subject: '📊 Tu Reporte de Desempeño está Disponible - {{cycle_name}}',
  previewText: 'Accede a tu feedback 360° personalizado',
  variables: ['employee_name', 'cycle_name', 'report_url', 'expiration_days', 'company_name'],
  tone: 'Profesional, motivador',
  htmlContent: `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22D3EE, #A78BFA); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Tu Reporte de Desempeño</h1>
        <p style="color: #E0E7FF; margin: 10px 0 0 0;">Feedback 360° Personalizado</p>
      </div>
      
      <h2 style="color: #1E293B;">Hola {{employee_name}},</h2>
      
      <p style="color: #64748B; line-height: 1.6;">
        Nos complace informarte que tu reporte de desempeño del ciclo 
        <strong>{{cycle_name}}</strong> ya está disponible.
      </p>
      
      <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #065F46;">
          <strong>✨ Tu reporte incluye:</strong>
        </p>
        <ul style="color: #047857; margin: 10px 0 0 20px;">
          <li>Resultados consolidados 360°</li>
          <li>Fortalezas destacadas</li>
          <li>Áreas de desarrollo priorizadas</li>
          <li>Plan de acción sugerido</li>
        </ul>
      </div>
      
      <a href="{{report_url}}" style="display: inline-block; background: linear-gradient(90deg, #22D3EE, #06B6D4); color: #FFF; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600; font-size: 16px;">
        Acceder a Mi Reporte
      </a>
      
      <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">
          <strong>⏰ Importante:</strong> Este link estará disponible por {{expiration_days}} días. 
          Te recomendamos revisarlo pronto y guardar una copia si lo necesitas.
        </p>
      </div>
      
      <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
        Este reporte es <strong>confidencial</strong> y solo para tu uso personal. 
        Úsalo como guía para tu desarrollo profesional y conversaciones con tu manager.
      </p>
      
      <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">
        ¿Preguntas sobre tu reporte? Contacta a RRHH o tu manager directo.
      </p>
    </div>
  `
}
```

---

### T-GC-003-01: Alertas Automáticas Admin

**Descripción:** Email admin si tasa respuesta < 50% a 3 días del cierre

**Archivo:** `src/app/api/cron/send-alerts/route.ts` (CREAR NUEVO)

**Código:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-alerts
// Alertas automáticas a admin por baja tasa de respuesta
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    // Buscar ciclos que cierran en 3 días y tienen baja respuesta
    const cyclesAtRisk = await prisma.performanceCycle.findMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        account: {
          select: {
            adminEmail: true,
            companyName: true
          }
        },
        _count: {
          select: {
            evaluationAssignments: true
          }
        }
      }
    })
    
    const alertsSent = []
    
    for (const cycle of cyclesAtRisk) {
      // Contar completadas
      const completed = await prisma.evaluationAssignment.count({
        where: {
          cycleId: cycle.id,
          isCompleted: true
        }
      })
      
      const total = cycle._count.evaluationAssignments
      const completionRate = total > 0 ? (completed / total) * 100 : 100
      
      // Alerta si < 50%
      if (completionRate < 50) {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: cycle.account.adminEmail,
          subject: `🚨 Alerta: Baja Tasa de Respuesta en ${cycle.name}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #EF444420; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #991B1B;">
                  <strong>🚨 ALERTA AUTOMÁTICA - BAJA PARTICIPACIÓN</strong>
                </p>
              </div>
              
              <h2 style="color: #1E293B;">Ciclo con Riesgo de Incumplimiento</h2>
              
              <p style="color: #64748B;">
                El ciclo <strong>${cycle.name}</strong> cierra en aproximadamente 
                <strong style="color: #F59E0B;">3 días</strong> y presenta baja tasa de respuesta:
              </p>
              
              <div style="background: linear-gradient(135deg, #EF444420, #F59E0B20); padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 36px; color: #EF4444; font-weight: 700; text-align: center;">
                  ${completionRate.toFixed(0)}%
                </p>
                <p style="margin: 5px 0 0 0; text-align: center; color: #64748B; font-size: 14px;">
                  ${completed} de ${total} evaluaciones completadas
                </p>
              </div>
              
              <p style="color: #64748B;">
                <strong>Acciones recomendadas:</strong>
              </p>
              <ul style="color: #64748B;">
                <li>Revisar quiénes no han completado</li>
                <li>Enviar recordatorios personalizados</li>
                <li>Considerar extensión de plazo si es necesario</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/admin/performance-cycles/${cycle.id}" 
                 style="display: inline-block; background: #EF4444; color: #FFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600;">
                Ver Detalle del Ciclo
              </a>
            </div>
          `
        })
        
        if (!error) {
          alertsSent.push({
            cycleId: cycle.id,
            cycleName: cycle.name,
            completionRate: completionRate.toFixed(1),
            adminEmail: cycle.account.adminEmail
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      alertsSent: alertsSent.length,
      alerts: alertsSent
    })
    
  } catch (error) {
    console.error('Error en send-alerts cron:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Setup en vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/send-alerts",
      "schedule": "0 12 * * *"
    }
  ]
}
```

---

### T-PC-007-01: Cron Job Envío Reportes

**Descripción:** Cron automático que envía reportes individuales post-cierre de ciclo

**Archivo:** `src/app/api/cron/send-reports/route.ts` (CREAR NUEVO)

**Código:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-reports
// Envío automático reportes individuales post-cierre ciclo
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IndividualReportService } from '@/lib/services/IndividualReportService'
import { renderEmailTemplate } from '@/lib/templates/email-templates'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const now = new Date()
    
    // Buscar ciclos cerrados que deben enviar reportes
    const cyclesToProcess = await prisma.performanceCycle.findMany({
      where: {
        status: 'CLOSED',
        // Ya pasó el delay configurado
        closedAt: {
          lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Default 7 días
        }
      },
      include: {
        account: {
          select: {
            companyName: true,
            reportDeliveryDelayDays: true,
            reportLinkExpirationDays: true,
            enableEmployeeReports: true
          }
        }
      }
    })
    
    const reportsSent = []
    
    for (const cycle of cyclesToProcess) {
      // Verificar feature habilitado
      if (!cycle.account.enableEmployeeReports) {
        continue
      }
      
      // Obtener evaluados únicos del ciclo
      const evaluatees = await prisma.evaluationAssignment.findMany({
        where: { cycleId: cycle.id },
        select: { evaluateeId: true },
        distinct: ['evaluateeId']
      })
      
      for (const { evaluateeId } of evaluatees) {
        // Verificar si ya se envió reporte
        const existing = await prisma.feedbackDeliveryConfirmation.findFirst({
          where: {
            cycleId: cycle.id,
            employeeId: evaluateeId
          }
        })
        
        if (existing) {
          continue // Ya enviado
        }
        
        // Generar reporte
        const report = await IndividualReportService.generateReport(
          cycle.id,
          evaluateeId
        )
        
        // Obtener email empleado
        const employee = await prisma.participant.findUnique({
          where: { id: evaluateeId },
          select: { email: true, fullName: true }
        })
        
        if (!employee?.email) {
          continue
        }
        
        // Renderizar template email
        const { subject, html } = renderEmailTemplate(
          'performance-report-ready',
          {
            employee_name: employee.fullName,
            cycle_name: cycle.name,
            report_url: report.accessUrl,
            expiration_days: String(cycle.account.reportLinkExpirationDays),
            company_name: cycle.account.companyName
          }
        )
        
        // Enviar email
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: employee.email,
          subject,
          html
        })
        
        if (!error) {
          reportsSent.push({
            cycleId: cycle.id,
            employeeId: evaluateeId,
            employeeEmail: employee.email
          })
        }
        
        // Delay entre envíos (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 550))
      }
    }
    
    return NextResponse.json({
      success: true,
      reportsSent: reportsSent.length,
      reports: reportsSent
    })
    
  } catch (error) {
    console.error('Error en send-reports cron:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Setup en vercel.json (agregar):**

```json
{
  "crons": [
    {
      "path": "/api/cron/send-alerts",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/send-reports",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist Compilación:

```bash
# 1. Verificar archivo templates modificado
cat src/lib/templates/email-templates.ts | grep "performance-reminder-level-1"

# 2. Verificar crons creados
ls -la src/app/api/cron/send-alerts/
ls -la src/app/api/cron/send-reports/

# 3. Compilar
npm run build

# 4. Verificar tipos
npx tsc --noEmit
```

### Testing Crons Manual:

```bash
# Test send-alerts
curl -X GET http://localhost:3000/api/cron/send-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test send-reports
curl -X GET http://localhost:3000/api/cron/send-reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Checklist Funcional:

- [ ] Templates agregados a `email-templates.ts` existente
- [ ] NO se creó archivo separado de templates
- [ ] Función `renderEmailTemplate()` sigue funcionando
- [ ] Cron send-alerts compila sin errores
- [ ] Cron send-reports compila sin errores
- [ ] Imports de Resend funcionan
- [ ] `vercel.json` actualizado con ambos crons
- [ ] Variable `RESEND_API_KEY` configurada
- [ ] Variable `CRON_SECRET` configurada
- [ ] Rate limiting implementado (550ms delay)

---

## 🚫 NO MODIFICAR

**Archivos que NO debes tocar:**
- Templates existentes en `email-templates.ts` (retención, pulso, etc.)
- Función `renderEmailTemplate()` (solo usarla)
- Cron existente `/api/cron/send-reminders` (encuestas)
- Cualquier otra API

**Imports permitidos:**
- ✅ `@/lib/templates/email-templates` (renderEmailTemplate)
- ✅ `@/lib/services/IndividualReportService`
- ✅ `resend`
- ✅ `@/lib/prisma`

---

## 📝 NOTAS IMPORTANTES

### Arquitectura Integrada:

**TODO en `email-templates.ts` existente:**
- ✅ Templates encuestas (ya existían)
- ✅ Recordatorios encuestas (ya existían)
- 🆕 Recordatorios performance (AGREGAR)
- 🆕 Reporte disponible (AGREGAR)

**NO crear:**
- ❌ reminder-templates.ts
- ❌ performance-email-templates.ts
- ❌ Ningún archivo nuevo de templates

### CC Manager en Level 3:

```typescript
// En el cron de performance (futuro BLOQUE-5 extendido)
if (level === 3) {
  const manager = await getManagerEmail(evaluator.id)
  await resend.emails.send({
    to: evaluator.email,
    cc: manager ? [manager] : undefined,
    // ...
  })
}
```

### Delay Rate Limiting:

**Resend Free Tier:** 100 emails/día, 2 req/s
**Delay:** 550ms entre envíos = ~1.8 req/s (seguro)

### Configuración Account:

- `reportDeliveryDelayDays`: Default 7 días post-cierre
- `reportLinkExpirationDays`: Default 30 días válido link
- `enableEmployeeReports`: Toggle feature on/off

---

## 🎯 SIGUIENTE BLOQUE

Una vez completado este bloque, proceder a:
**BLOQUE-6: Dashboard 360°** (UI para visualizar resultados)

**NO continuar a BLOQUE-6 hasta que:**
- ✅ Templates integrados en email-templates.ts
- ✅ Ambos crons compilan sin errores
- ✅ Testing manual de emails funciona
- ✅ vercel.json actualizado

---

**Tiempo estimado:** ~4 días (incluye testing delivery)  
**Dificultad:** Media (integración sistema existente)  
**Impacto:** Alto (comunicación crítica con usuarios)
