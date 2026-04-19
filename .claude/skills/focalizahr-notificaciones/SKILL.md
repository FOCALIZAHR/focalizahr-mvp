---
name: focalizahr-notificaciones
description: |
  Sistema oficial de notificaciones toast de FocalizaHR.
  USAR SIEMPRE cuando el código necesite: toast, notificación al usuario,
  feedback de operación, mensaje de error, success, warning, info,
  useToast, toast-system, error handling UI, confirmación de acción,
  operación masiva, validación de formulario, manejo de errores de red.
  También usar cuando se detecte uso incorrecto del toast shadcn
  (@/components/ui/use-toast) — debe migrarse al sistema FocalizaHR.
---

# 📬 SISTEMA DE NOTIFICACIONES FOCALIZAHR

> Sistema propio de FocalizaHR. NO es shadcn/ui toast.
> Archivo fuente: `src/components/ui/toast-system.tsx`
> Integración global: `<ToastProvider>` en `src/app/layout.tsx`

---

## ⚠️ REGLA CRÍTICA: UN SOLO SISTEMA DE TOAST

```yaml
✅ CORRECTO (sistema FocalizaHR):
  import { useToast } from '@/components/ui/toast-system'
  const { success, error, warning, info } = useToast()

❌ INCORRECTO (shadcn legacy — NO USAR):
  import { useToast } from '@/components/ui/use-toast'
  const { toast } = useToast()

MIGRACIÓN: Si encuentras use-toast de shadcn, migrar a toast-system.
```

---

## 🔧 API DEL HOOK

```typescript
import { useToast } from '@/components/ui/toast-system'

const { success, error, warning, info } = useToast()

// Firma: (message: string, title: string, options?: ToastOptions)
success(`Campaña "${name}" creada exitosamente`, '¡Éxito!')
error('Error al cargar participantes. Intenta nuevamente.', 'Error')
warning('La campaña expira en 2 días', 'Atención')
info('Se enviaron recordatorios a 15 participantes', 'Recordatorios')

// Opciones avanzadas
error('Error crítico', 'Crítico', { autoClose: false })  // No se cierra solo
info('Guardando...', 'Progreso', { duration: 10000 })    // 10 segundos
```

---

## 🎨 TIPOS Y COLORES CORPORATIVOS

| Tipo | Color | Uso | Border | Glow |
|------|-------|-----|--------|------|
| `success` | Cyan #22D3EE | Acciones completadas | border-cyan-400 | shadow-cyan-400/30 |
| `error` | Red #EF4444 | Errores/fallos | border-red-400 | shadow-red-400/30 |
| `warning` | Purple #A78BFA | Advertencias | border-purple-400 | shadow-purple-400/30 |
| `info` | Cyan #22D3EE | Información general | border-cyan-400 | shadow-cyan-400/30 |

**Auto-highlighting integrado:**
- Texto entre comillas `"nombre"` → `text-cyan-300 font-bold`
- Números + "participantes" → `text-purple-300 font-bold`
- Palabras de acción → `text-cyan-400 font-semibold`

---

## 📋 PATRONES POR CASO DE USO

### 1. CRUD de Entidades
```typescript
// Crear
try {
  await createEntity(data)
  success(`${entityType} "${data.name}" creado exitosamente`, '¡Éxito!')
  router.push('/dashboard')
} catch (err) {
  error(`Error al crear ${entityType}. Intenta nuevamente.`, 'Error')
}
```

### 2. Operaciones Masivas (bulk)
```typescript
try {
  const result = await bulkProcess(items)
  success(`Procesados ${result.count} elementos exitosamente`, '¡Completado!')
} catch (err) {
  error(`Error procesando elementos: ${err.message}`, 'Error Masivo')
}
```

### 3. Validación de Formularios
```typescript
if (!data.email) {
  error('El email es requerido', 'Validación')
  return false
}
if (!data.password || data.password.length < 8) {
  warning('La contraseña debe tener al menos 8 caracteres', 'Seguridad')
  return false
}
```

### 4. Errores de Red / API
```typescript
// Archivo: src/lib/error-handler.ts
export function handleApiError(error: Error, context: string) {
  const { error: showError } = useToast()
  
  if (error.message.includes('network')) {
    showError('Error de conexión. Verifica tu internet.', 'Error de Red')
  } else if (error.message.includes('unauthorized')) {
    showError('Sesión expirada. Inicia sesión nuevamente.', 'Sesión')
  } else {
    showError(`Error en ${context}: ${error.message}`, 'Error')
  }
}
```

### 5. Detección Automática de Cambios de Estado
```typescript
export function useEntityNotifications(entities: Entity[], entityType: string) {
  const { success } = useToast()
  const [previous, setPrevious] = useState<Entity[]>([])

  useEffect(() => {
    if (previous.length > 0) {
      entities.forEach(entity => {
        const prev = previous.find(p => p.id === entity.id)
        if (prev && prev.status !== entity.status) {
          success(`${entityType} "${entity.name}" cambió a ${entity.status}`, 'Actualización')
        }
      })
    }
    setPrevious(entities)
  }, [entities])
}
```

---

## ❌ ANTI-PATTERNS

```yaml
NUNCA HACER:
  - Mensajes genéricos: "Operación exitosa" → USAR: "Campaña 'Q1' creada exitosamente"
  - Spam de toasts: Múltiples simultáneos sin control
  - Info técnica al usuario: Códigos de error internos, stack traces
  - Toast sin contexto: Solo "Error" sin explicación
  - Override de colores: Los colores corporativos son fijos
  - Usar shadcn use-toast: Siempre usar toast-system de FocalizaHR
  - useToast() fuera de componente React: Es un hook, necesita contexto React

SIEMPRE HACER:
  - Incluir nombre específico de entidad entre comillas
  - Incluir números cuando sean relevantes (conteos, porcentajes)
  - Combinar con router.push() después de success en creación
  - Usar el tipo correcto: success para completado, error para fallo, warning para alerta, info para neutral
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
src/components/ui/toast-system.tsx
├── ToastProvider    → Context Provider (wraps app en layout.tsx)
├── useToast()       → Hook que expone {success, error, warning, info}
├── ToastContainer   → Renderiza lista de toasts activos
└── ToastItem        → Componente individual con auto-dismiss + highlighting

Archivos relacionados:
├── src/app/layout.tsx                         → <ToastProvider> global
├── src/components/ui/confirmation-dialog.tsx  → Integra con modales
└── src/lib/error-handler.ts                   → Handler global de errores
```

---

## 🔮 EXTENSIONES v1.1 — ESPECIFICACIÓN TÉCNICA

### 1. Toast de progreso (PRIORIDAD ALTA)

**Problema:** Activar campaña de 100+ participantes toma ~60s sin feedback visible. El usuario cree que se colgó.

**API propuesta:**
```typescript
const { progress } = useToast()

// Crear toast de progreso
const p = progress('Activando campaña...', {
  total: 103,
  onCancel: () => abortController.abort()
})

// Actualizar desde el loop de envío
for (const participant of participants) {
  await sendEmail(participant)
  p.update(i + 1) // Actualiza barra + contador
}

// Finalizar (transiciona automáticamente a success)
p.complete(`"${campaign.name}" activada. ${sent} emails enviados, ${skipped} sin email`)
// o en caso de fallo parcial:
p.complete(`${sent} enviados, ${failed} fallaron`, 'warning')
```

**Comportamiento visual:**
- Spinner animado en icono (reemplaza ícono estático)
- Barra de progreso cyan→blue debajo del mensaje
- Contador: "Enviando emails a **67** de **103** participantes"
- Timer estimado: "~35s restantes" (calcula por velocidad real)
- Botón ✕ para cancelar (dispara onCancel)
- Al completar: transiciona suavemente a toast success/warning con resumen

**Casos de uso:** activación campaña, bulk import participantes, generación evaluaciones 360°, envío masivo recordatorios.

---

### 2. Toast con acción — retry/undo (PRIORIDAD MEDIA)

**Problema:** Errores de red sin retry obligan a repetir toda la operación. Eliminaciones sin undo son irreversibles.

**API propuesta:**
```typescript
const { error, success } = useToast()

// Error con retry
error('No se pudo guardar la calibración', 'Error de conexión', {
  action: {
    label: 'Reintentar',
    onClick: async () => {
      const result = await saveCalibration()
      if (result.ok) success('Calibración guardada al reintentar', 'Guardado')
    }
  },
  autoClose: false  // No se cierra solo — requiere acción o dismiss manual
})

// Eliminación con undo (countdown)
success(`Participante "${name}" eliminado del ciclo`, 'Eliminado', {
  action: {
    label: 'Deshacer',
    onClick: () => restoreParticipant(id),
    countdown: 5  // 5 segundos para deshacer, luego confirma eliminación
  },
  variant: 'warning'  // Purple border para indicar reversibilidad
})
```

**Comportamiento visual:**
- Botón de acción alineado a la derecha del toast
- Retry: botón rojo suave `rgba(239,68,68,0.2)` texto `#f87171`
- Undo: botón cyan suave `rgba(34,211,238,0.2)` texto `#67e8f9`
- Countdown visible: "Deshacer en 4s..." decrementando
- Al expirar countdown: botón se desactiva (opacity 0.3) + texto "Eliminación confirmada"
- Toast con acción NUNCA se auto-cierra hasta que el usuario actúe o expire el countdown

**Casos de uso:** errores de red en guardado, eliminación de participantes, desactivación de campañas, borrado de evaluaciones.

---

### 3. Toast promise — auto-estado (DEVELOPER EXPERIENCE)

**Problema:** Cada operación async requiere try/catch + 3 toasts manuales (loading/success/error). Boilerplate repetitivo y propenso a inconsistencias.

**API propuesta:**
```typescript
const { promise } = useToast()

// Una línea reemplaza try/catch + 3 toasts
toast.promise(saveEvaluations(cycleId), {
  loading: 'Guardando cambios...',
  success: (result) => `${result.count} evaluaciones sincronizadas`,
  error: 'No se pudo guardar. Intenta nuevamente.'
})

// Con mensaje dinámico de error
toast.promise(activateCampaign(id), {
  loading: 'Activando campaña...',
  success: (r) => `"${r.name}" activada con ${r.emailsSent} emails`,
  error: (err) => err.code === 'TIMEOUT' 
    ? 'Timeout del servidor. Intenta en 30s.'
    : `Error: ${err.message}`
})
```

**Comportamiento visual (3 fases automáticas):**
1. **Loading:** Toast cyan con spinner + mensaje loading
2. **Success:** Transiciona a toast green con ✓ + mensaje success (auto-dismiss 4s)
3. **Error:** Transiciona a toast red con ✗ + mensaje error (auto-dismiss 8s o manual)

**Transición animada:** El toast NO se destruye y recrea — muta in-place:
- Borde: color transiciona suavemente (cyan → green/red)
- Ícono: spinner → ✓/✗ con scale animation
- Glow: cambia color de sombra
- Texto: fade-out del loading, fade-in del resultado

**Step dots opcionales** (para operaciones multi-fase):
```typescript
toast.promise(complexOperation(), {
  loading: 'Procesando...',
  steps: ['validando', 'guardando', 'confirmando'],
  success: 'Completado',
  error: 'Falló en confirmación'
})
```
Muestra dots debajo del mensaje: ● ● ○ con el activo pulsando.

**Casos de uso:** TODA operación async que hoy tiene try/catch manual. Migración gradual — no rompe el patrón actual `success()`/`error()`.

---

### Priorización de implementación

```yaml
INMEDIATO (v1.1):
  toast.progress()  → Impacto directo en UX de activación de campañas
  
CORTO PLAZO (v1.2):
  action: { retry/undo }  → Resiliencia ante errores + operaciones reversibles

MEDIANO PLAZO (v1.3):
  toast.promise()  → DX improvement, reduce boilerplate en toda la app

FUTURO (v1.4+):
  - Queue/stacking: máximo 3 visibles, FIFO, los demás en cola
  - Posicionamiento configurable
  - Analytics de notificaciones
```
