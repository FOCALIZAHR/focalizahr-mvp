# TASK: UX Premium para Performance Cycles

## 🎯 OBJETIVO
Implementar UX Enterprise en la página de detalle de ciclos de evaluación, igualando el estándar de CampaignsList.

## 📋 PROBLEMA ACTUAL
- Al activar ciclo solo cambia el badge, sin feedback al usuario
- No usa sistema de notificaciones FocalizaHR (`useToast`)
- No usa modales de confirmación como CampaignsList
- Usuario común no entiende qué pasó

## 📁 ARCHIVOS INVOLUCRADOS

### Archivo a modificar:
```
src/app/dashboard/admin/performance-cycles/[id]/page.tsx
```

### Archivos de referencia (NO modificar, solo consultar):
```
src/components/ui/toast-system.tsx          # Sistema de notificaciones
src/components/ui/confirmation-dialog.tsx   # Patrón de modales
src/components/dashboard/CampaignsList.tsx  # Ejemplo de UX correcta
src/styles/focalizahr-unified.css           # Clases .fhr-*
```

## 🔧 CAMBIOS REQUERIDOS

### 1. Agregar imports
```typescript
import { useToast } from '@/components/ui/toast-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
```

### 2. Agregar hook y estados
```typescript
const { success, error } = useToast();
const [showActivateModal, setShowActivateModal] = useState(false);
const [showGenerateModal, setShowGenerateModal] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
```

### 3. Handler para Generar Evaluaciones
- Mostrar modal de confirmación ANTES de ejecutar
- Mostrar loading state durante ejecución
- Toast success: `Se generaron ${totalCreated} evaluaciones para "${cycleName}"`
- Toast error si falla
- Refetch data después de éxito

### 4. Handler para Activar Ciclo
- Mostrar modal de confirmación ANTES de ejecutar
- Mostrar loading state durante ejecución
- Toast success: `Ciclo "${cycleName}" activado. ${totalEvaluations} evaluaciones habilitadas.`
- Toast error si falla
- Refetch data después de éxito

### 5. Modal Confirmación Generar
- Título: "¿Generar Evaluaciones?"
- Mostrar configuración del ciclo (qué tipos de evaluación incluye)
- Botones: Cancelar / Generar Evaluaciones

### 6. Modal Confirmación Activar
- Título: "¿Activar Ciclo de Evaluación?"
- Mostrar: cantidad de evaluaciones, advertencia que no se puede deshacer
- Botones: Cancelar / Sí, Activar Ciclo

### 7. Modificar botones existentes
- Botón "Generar" → abre modal en vez de ejecutar directo
- Botón "Activar" → abre modal en vez de ejecutar directo

## ✅ CRITERIOS DE ACEPTACIÓN

1. [ ] Click en "Generar Evaluaciones" abre modal de confirmación
2. [ ] Click en "Activar Ciclo" abre modal de confirmación
3. [ ] Toast success aparece después de generar evaluaciones
4. [ ] Toast success aparece después de activar ciclo
5. [ ] Toast error aparece si hay fallo
6. [ ] Loading state visible durante procesamiento
7. [ ] UI se actualiza automáticamente después de cada acción
8. [ ] Compila sin errores TypeScript

## 🎨 ESTILOS A USAR
- Modal: `fhr-modal-content`
- Títulos: `fhr-title-gradient`
- Botón primario: `fhr-btn-primary`
- Texto secundario: `text-slate-400`

## 📚 PATRÓN DE REFERENCIA
Ver `CampaignsList.tsx` para el patrón exacto de:
- `withConfirmation` callback
- Mensajes de toast con highlighting automático
- Loading states en botones
