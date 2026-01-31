# BLOQUE-1: Schema Changes

## 📋 METADATA
- **Bloque:** 1 de 8
- **Dependencias:** Ninguna (INICIO DEL PROYECTO)
- **Archivos:** MODIFICAR `prisma/schema.prisma`
- **Esfuerzo:** 45 minutos
- **Tipo:** Database Schema

---

## 🎯 OBJETIVO DEL BLOQUE

Agregar modelos y campos necesarios para el módulo Performance Evaluation 360°:
1. Modelo `FeedbackDeliveryConfirmation` - Auditoría entrega reportes
2. Campos configuración reportes en modelo `Account`

**Impacto:** Habilita tracking de entrega de reportes individuales y configuración enterprise por cliente.

---

## 📦 TAREAS INCLUIDAS

### T-SCHEMA-01: FeedbackDeliveryConfirmation

**Descripción:** Nueva tabla para auditar entrega de reportes individuales de desempeño.

**Código a agregar en `prisma/schema.prisma`:**

```prisma
model FeedbackDeliveryConfirmation {
  id               String    @id @default(cuid())
  
  // Relaciones
  employeeId       String
  employee         Participant @relation("FeedbackDeliveryEmployee", fields: [employeeId], references: [id], onDelete: Cascade)
  
  cycleId          String
  cycle            PerformanceCycle @relation("FeedbackDeliveryCycle", fields: [cycleId], references: [id], onDelete: Cascade)
  
  // Token acceso reporte
  reportToken      String    @unique
  
  // Timestamps
  sentAt           DateTime  // Cuándo se envió el email
  confirmedAt      DateTime? // Cuándo el empleado confirmó recepción
  
  // Metadata
  receivedOnTime   Boolean?  // true si confirmó, false si no confirmó a tiempo, null si pendiente
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@map("feedback_delivery_confirmations")
  @@index([employeeId])
  @@index([cycleId])
  @@index([reportToken])
}
```

**Agregar también las relaciones en modelos existentes:**

```prisma
// En modelo Participant, agregar:
model Participant {
  // ... campos existentes ...
  
  // 🆕 AGREGAR:
  feedbackDeliveries FeedbackDeliveryConfirmation[] @relation("FeedbackDeliveryEmployee")
  
  // ... resto del modelo ...
}

// En modelo PerformanceCycle, agregar:
model PerformanceCycle {
  // ... campos existentes ...
  
  // 🆕 AGREGAR:
  feedbackDeliveries FeedbackDeliveryConfirmation[] @relation("FeedbackDeliveryCycle")
  
  // ... resto del modelo ...
}
```

---

### T-SCHEMA-02: Account Config Fields

**Descripción:** Agregar campos de configuración de reportes individuales al modelo Account.

**Código a agregar en `prisma/schema.prisma`:**

```prisma
model Account {
  // ... campos existentes ...
  
  // 🆕 CONFIGURACIÓN REPORTES INDIVIDUALES
  reportDeliveryDelayDays Int      @default(7) @map("report_delivery_delay_days") // 1-30 días
  reportLinkExpirationDays Int     @default(30) @map("report_link_expiration_days") // Duración link
  enableEmployeeReports   Boolean  @default(true) @map("enable_employee_reports") // Toggle feature
  
  // ... resto del modelo ...
}
```

---

## ✅ VALIDACIÓN BLOQUE COMPLETO

Ejecutar en orden:

```bash
# 1. Crear migración
npx prisma migrate dev --name add_performance_feedback_delivery

# 2. Generar cliente Prisma
npx prisma generate

# 3. Verificar tipos TypeScript
npx tsc --noEmit

# 4. Verificar en Prisma Studio (opcional)
npx prisma studio
```

**Checklist:**

- [ ] Migración creada sin errores
- [ ] `prisma generate` completa exitosamente
- [ ] TypeScript compila sin errores
- [ ] Modelos visibles en Prisma Studio
- [ ] Relaciones correctas (employee, cycle)
- [ ] Índices creados (employeeId, cycleId, reportToken)

**SQL de validación:**

```sql
-- Verificar tabla existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'feedback_delivery_confirmations';

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename = 'feedback_delivery_confirmations';

-- Verificar campos Account
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'accounts' 
  AND column_name IN ('report_delivery_delay_days', 'report_link_expiration_days', 'enable_employee_reports');
```

---

## 🚫 NO MODIFICAR

- NO tocar otros modelos existentes (solo agregar relaciones especificadas)
- NO eliminar campos existentes
- NO cambiar tipos de datos actuales
- NO modificar migrations antiguas

---

## 📝 NOTAS IMPORTANTES

1. **Separación de dominios:**
   - `EmailLog` es para encuestas/campañas
   - `FeedbackDeliveryConfirmation` es para reportes desempeño
   - NO son duplicados, son diferentes flujos de negocio

2. **Configuración por cliente:**
   - `reportDeliveryDelayDays`: Días esperar post-ciclo antes enviar reportes (compliance)
   - `reportLinkExpirationDays`: Cuánto tiempo link reporte permanece activo
   - `enableEmployeeReports`: Cliente puede desactivar reportes individuales

3. **Performance:**
   - Índices en `employeeId`, `cycleId` optimizan queries frecuentes
   - Índice único en `reportToken` garantiza seguridad acceso

4. **Próximo bloque:**
   - BLOQUE-2 depende de estos schemas para compilar
   - NO continuar hasta que `npx prisma generate` pase exitosamente

---

## 🎯 CRITERIO DE COMPLETADO

✅ Este bloque está completado cuando:
- Migración aplicada a BD
- `npx prisma generate` sin errores
- TypeScript compila sin errores de tipos
- Campos visibles en Account
- Modelo FeedbackDeliveryConfirmation accesible desde código

**Tiempo esperado:** 30-45 minutos (incluyendo testing)
