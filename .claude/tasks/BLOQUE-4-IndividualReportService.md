# BLOQUE-4: IndividualReportService

## 📋 METADATA
- **Bloque:** 4 de 8
- **Dependencias:** ✅ BLOQUE-1, ✅ BLOQUE-2 completados
- **Archivos:** CREAR `src/lib/services/IndividualReportService.ts`
- **Esfuerzo:** 6 horas
- **Prioridad:** 🟡 ALTA (Core feature reportes individuales)

## 🎯 OBJETIVO DEL BLOQUE
Crear service para generar reportes individuales post-ciclo que los empleados reciben por email.

**Funcionalidad:**
- Generar reporte personalizado por evaluado
- Incluir self-evaluation + feedback 360°
- Mostrar fortalezas + áreas desarrollo
- Incluir plan de acción sugerido
- Formato HTML responsive para email/web
- Token seguro acceso anónimo

**Pattern:** Lattice Individual Reports, 15Five Reviews

---

## 📦 TAREAS INCLUIDAS

### T-PC-001-01: Crear IndividualReportService

**Descripción:** Service completo para generación de reportes individuales

**Archivo:** `src/lib/services/IndividualReportService.ts`

**Código:**

```typescript
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
        sentAt: new Date(), // Marcado como enviado al generar
        receivedOnTime: null // Pendiente confirmación empleado
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
            fullName: true
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
      employeeName: confirmation.employee.fullName,
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
   * Genera token seguro aleatorio
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Renderiza HTML del reporte individual
   */
  private static renderReportHTML(
    results: EvaluateeResults360,
    token: string
  ): string {
    
    // TODO: Implementar template HTML completo con:
    // - Header con logo empresa
    // - Scores 360° visuales
    // - Gráfico radar por competencia
    // - Fortalezas destacadas
    // - Áreas de desarrollo priorizadas
    // - Plan de acción sugerido
    // - Feedback cualitativo (anónimo)
    // - Footer con botón confirmar recepción
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Desempeño - ${results.evaluateeName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f3f4f6;
    }
    .report-container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #22D3EE;
    }
    .score-card {
      background: linear-gradient(135deg, #22D3EE20, #A78BFA20);
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .competency-item {
      padding: 10px;
      margin: 10px 0;
      border-left: 4px solid #22D3EE;
      background: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>Reporte de Desempeño 360°</h1>
      <h2>${results.evaluateeName}</h2>
      <p>${results.cycleName}</p>
    </div>
    
    <div class="score-card">
      <h3>Tu Score General</h3>
      <div style="font-size: 48px; font-weight: bold; color: #22D3EE; text-align: center;">
        ${results.overallAvgScore.toFixed(1)}/5.0
      </div>
      <div style="text-align: center; color: #64748B; margin-top: 10px;">
        Basado en ${results.completedEvaluations} evaluaciones completadas
      </div>
    </div>
    
    <div class="section">
      <h3>Fortalezas Destacadas</h3>
      ${results.gapAnalysis.strengths.map(s => `
        <div class="competency-item">
          <strong>${s.competencyName}</strong>
          <div style="color: #10B981; font-size: 14px;">${s.highlight}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h3>Áreas de Desarrollo</h3>
      ${results.gapAnalysis.developmentAreas.map(d => `
        <div class="competency-item">
          <strong>${d.competencyName}</strong>
          <div style="color: #F59E0B; font-size: 14px;">Prioridad: ${d.priority}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p style="color: #64748B; font-size: 14px;">
        Este reporte es confidencial y solo para tu uso personal.
      </p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/report/${token}/confirm" 
         style="display: inline-block; background: #22D3EE; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
        Confirmar Recepción
      </a>
    </div>
  </div>
</body>
</html>
    `.trim()
  }
}

export default IndividualReportService
```

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist Compilación:

```bash
# 1. Verificar archivo creado
ls -la src/lib/services/IndividualReportService.ts

# 2. Compilar
npm run build

# 3. Verificar tipos
npx tsc --noEmit
```

### Checklist Funcional:

- [ ] Archivo creado en ruta correcta
- [ ] Imports de `PerformanceResultsService` funcionan
- [ ] Imports de `crypto` (Node.js native) funcionan
- [ ] Método `generateReport()` implementado
- [ ] Método `getReportByToken()` implementado
- [ ] Método `confirmReceipt()` implementado
- [ ] HTML template básico renderiza
- [ ] Token generation seguro (32 bytes hex)
- [ ] Expiration check implementado
- [ ] No hay errores TypeScript

### Testing Manual (Opcional):

```typescript
// En Thunder Client o similar
const report = await IndividualReportService.generateReport(
  'test-cycle-id',
  'test-employee-id'
)

console.log(report.accessToken) // 64 chars hex
console.log(report.accessUrl) // https://focalizahr.com/report/abc123...
console.log(report.htmlContent.length) // > 2000 chars
```

---

## 🚫 NO MODIFICAR

**Archivos que NO debes tocar en este bloque:**
- `PerformanceResultsService.ts` (solo importar)
- Modelo Prisma `FeedbackDeliveryConfirmation` (ya está del BLOQUE-1)
- APIs existentes

**Imports permitidos:**
- ✅ `@/lib/prisma`
- ✅ `@/lib/services/PerformanceResultsService`
- ✅ `crypto` (Node.js native)
- ❌ NO importar librerías externas de PDF/HTML

---

## 📝 NOTAS IMPORTANTES

### Token Security:

```typescript
crypto.randomBytes(32).toString('hex')
// Genera: 64 caracteres hexadecimales
// Ejemplo: a1b2c3d4e5f6...
// Seguridad: 256 bits de entropía (altamente seguro)
```

**¿Por qué no JWT?**
- Tokens más simples (no payload)
- Más largos y seguros
- Expiran via BD (no hardcoded en token)
- Revocables fácilmente

### Expiración Link:

Usa campo `reportLinkExpirationDays` de Account:
- Default: 30 días
- Configurable por empresa en UI admin
- Verificación en `getReportByToken()`

### HTML Template:

**Versión actual:** Básica funcional
**TODO futuro (BLOQUE-6):** Mejorar con:
- Gráfico radar competencias (Chart.js)
- Mejor diseño visual
- Responsive mobile optimizado
- Exportar a PDF

### FeedbackDeliveryConfirmation:

**Flujo:**
1. `generateReport()` → Crea registro con `sentAt`
2. Empleado accede a link → `getReportByToken()` retorna HTML
3. Empleado click "Confirmar" → `confirmReceipt()` marca `confirmedAt`
4. `receivedOnTime = true` si confirmó antes de expirar

---

## 🎯 SIGUIENTE BLOQUE

Una vez completado este bloque, proceder a:
**BLOQUE-5: Emails Integration** (envía reportes por email)

**NO continuar a BLOQUE-5 hasta que:**
- ✅ Service compila sin errores
- ✅ Token generation funciona
- ✅ HTML se genera correctamente
- ✅ Métodos públicos exportados

---

**Tiempo estimado:** 6 horas  
**Dificultad:** Media-Alta (HTML generation + token security)  
**Impacto:** Alto (feature clave del módulo)
