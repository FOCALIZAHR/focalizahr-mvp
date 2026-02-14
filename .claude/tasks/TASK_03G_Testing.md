# TASK_03G: Testing & Rollout - Validación Completa y Migración

## 🎯 OBJETIVO

Validar el sistema completo de clasificación v2 con draft state, ejecutar pruebas end-to-end, y migrar de los componentes legacy a los nuevos componentes, deprecando el código antiguo de forma segura.

## 📋 CONTEXTO

### Estado Previo
```yaml
COMPONENTES LEGACY (v1):
  - JobClassificationGate.tsx (persistencia prematura)
  - UnmappedPositionsDrawer.tsx (UX subóptima)
  - API /assign (llamadas individuales)

COMPONENTES NUEVOS (v2):
  - JobClassificationCinema.tsx (orquestador)
  - ClassificationApprovalPreview.tsx (aprobación masiva)
  - ClassificationReviewWizard.tsx (focus mode)
  - useClassificationDraft.ts (draft state)
  - API /batch-assign (transacción atómica)
```

### Objetivo
```yaml
ROLLOUT:
  1. Tests completos (unit, integration, e2e)
  2. Migración de imports en wizard
  3. Deprecación de componentes legacy
  4. Documentación de breaking changes
  5. Plan de rollback si necesario
```

## 🏗️ ARQUITECTURA DE TESTING

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    E2E TESTS (Playwright)                │   │
│  │  • Flujo completo wizard cliente                        │   │
│  │  • Clasificación → Aprobación → Persistencia            │   │
│  │  • Cancelar → Verificar rollback                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ▲                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              INTEGRATION TESTS (Jest + Prisma)          │   │
│  │  • API batch-assign con DB real                         │   │
│  │  • Draft state + localStorage                           │   │
│  │  • Transacción rollback                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ▲                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                UNIT TESTS (Jest + RTL)                   │   │
│  │  • useClassificationDraft hook                          │   │
│  │  • JobClassificationCinema component                    │   │
│  │  • ClassificationApprovalPreview component              │   │
│  │  • ClassificationReviewWizard component                 │   │
│  │  • Validaciones Zod                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 ARCHIVOS

### CREAR

```yaml
Tests:
  src/hooks/__tests__/useClassificationDraft.test.ts
  src/components/job-classification/__tests__/JobClassificationCinema.test.tsx
  src/components/job-classification/__tests__/ClassificationApprovalPreview.test.tsx
  src/components/job-classification/__tests__/ClassificationReviewWizard.test.tsx
  src/app/api/job-classification/__tests__/batch-assign.test.ts
  playwright/tests/job-classification-v2.spec.ts

Documentación:
  docs/MIGRATION_JOB_CLASSIFICATION_V2.md
```

### MODIFICAR

```yaml
src/app/dashboard/campaigns/new/page.tsx:
  - Cambiar import de JobClassificationGate a JobClassificationCinema

src/components/job-classification/JobClassificationGate.tsx:
  - Agregar @deprecated JSDoc
  - Agregar console.warn en desarrollo

src/components/job-classification/UnmappedPositionsDrawer.tsx:
  - Agregar @deprecated JSDoc
```

## 🔧 IMPLEMENTACIÓN DETALLADA

### Paso 1: Unit Tests - useClassificationDraft

```typescript
// src/hooks/__tests__/useClassificationDraft.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useClassificationDraft } from '../useClassificationDraft';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useClassificationDraft', () => {
  const mockAccountId = 'test-account-123';
  const storageKey = `fhr-classification-draft-${mockAccountId}`;
  
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });
  
  describe('Inicialización', () => {
    it('should load from localStorage if draft exists and not expired', async () => {
      // Arrange
      const savedDraft = {
        accountId: mockAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employees: [
          { id: '1', fullName: 'Test', draftTrack: 'MANAGER' }
        ]
      };
      localStorageMock.setItem(storageKey, JSON.stringify(savedDraft));
      
      // Act
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.draft).toBeDefined();
        expect(result.current.draft?.employees[0].draftTrack).toBe('MANAGER');
      });
    });
    
    it('should discard draft if expired (>24h)', async () => {
      // Arrange
      const expiredDraft = {
        accountId: mockAccountId,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
        employees: []
      };
      localStorageMock.setItem(storageKey, JSON.stringify(expiredDraft));
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, employees: [] })
      });
      
      // Act
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      // Assert
      await waitFor(() => {
        expect(localStorageMock.getItem(storageKey)).toBeNull();
      });
    });
    
    it('should fetch from API if no localStorage draft', async () => {
      // Arrange
      const apiEmployees = [
        { id: '1', fullName: 'API Employee', performanceTrack: null }
      ];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, employees: apiEmployees })
      });
      
      // Act
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      // Assert
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/job-classification/review'),
          expect.any(Object)
        );
      });
    });
  });
  
  describe('Acciones', () => {
    it('should update classification in draft without API call', async () => {
      // Arrange
      const initialDraft = {
        accountId: mockAccountId,
        createdAt: new Date().toISOString(),
        employees: [
          { id: '1', fullName: 'Test', draftTrack: null }
        ]
      };
      localStorageMock.setItem(storageKey, JSON.stringify(initialDraft));
      
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      // Act
      act(() => {
        result.current.updateClassification('1', 'MANAGER', 'jefe');
      });
      
      // Assert
      expect(result.current.draft?.employees[0].draftTrack).toBe('MANAGER');
      expect(fetch).not.toHaveBeenCalled(); // NO API call
    });
    
    it('should approve all pending employees', async () => {
      // Arrange
      const draft = {
        accountId: mockAccountId,
        createdAt: new Date().toISOString(),
        employees: [
          { id: '1', draftTrack: null, suggestedTrack: 'MANAGER' },
          { id: '2', draftTrack: null, suggestedTrack: 'COLABORADOR' }
        ]
      };
      localStorageMock.setItem(storageKey, JSON.stringify(draft));
      
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      // Act
      act(() => {
        result.current.approveAll();
      });
      
      // Assert
      expect(result.current.draft?.employees[0].draftTrack).toBe('MANAGER');
      expect(result.current.draft?.employees[1].draftTrack).toBe('COLABORADOR');
    });
  });
  
  describe('Persistencia', () => {
    it('should call batch API on handleContinue', async () => {
      // Arrange
      const draft = {
        accountId: mockAccountId,
        createdAt: new Date().toISOString(),
        employees: [
          { id: '1', draftTrack: 'MANAGER', currentTrack: null }
        ]
      };
      localStorageMock.setItem(storageKey, JSON.stringify(draft));
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, updated: 1 })
      });
      
      const onComplete = jest.fn();
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId, onComplete })
      );
      
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      // Act
      let success: boolean = false;
      await act(async () => {
        success = await result.current.handleContinue();
      });
      
      // Assert
      expect(fetch).toHaveBeenCalledWith(
        '/api/job-classification/batch-assign',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
      expect(success).toBe(true);
      expect(onComplete).toHaveBeenCalled();
      expect(localStorageMock.getItem(storageKey)).toBeNull(); // Cleared
    });
    
    it('should NOT clear localStorage on API failure', async () => {
      // Arrange
      const draft = {
        accountId: mockAccountId,
        createdAt: new Date().toISOString(),
        employees: [{ id: '1', draftTrack: 'MANAGER' }]
      };
      localStorageMock.setItem(storageKey, JSON.stringify(draft));
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Server error' })
      });
      
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId })
      );
      
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      // Act
      let success: boolean = true;
      await act(async () => {
        success = await result.current.handleContinue();
      });
      
      // Assert
      expect(success).toBe(false);
      expect(localStorageMock.getItem(storageKey)).not.toBeNull(); // NOT cleared
    });
  });
  
  describe('Cancelación', () => {
    it('should clear localStorage on handleCancel', async () => {
      // Arrange
      localStorageMock.setItem(storageKey, JSON.stringify({ employees: [] }));
      
      const onCancel = jest.fn();
      const { result } = renderHook(() => 
        useClassificationDraft({ accountId: mockAccountId, onCancel })
      );
      
      // Act
      act(() => {
        result.current.handleCancel();
      });
      
      // Assert
      expect(localStorageMock.getItem(storageKey)).toBeNull();
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
```

### Paso 2: E2E Tests - Playwright

```typescript
// playwright/tests/job-classification-v2.spec.ts

import { test, expect } from '@playwright/test';
import { loginAsClient, createTestAccount, cleanupTestData } from './helpers';

test.describe('Job Classification v2', () => {
  let testAccountId: string;
  
  test.beforeAll(async () => {
    testAccountId = await createTestAccount({
      employees: [
        { fullName: 'CEO Test', position: 'CEO', standardJobLevel: null },
        { fullName: 'Manager Test', position: 'Jefe Ventas', standardJobLevel: null },
        { fullName: 'Analyst Test', position: 'Analista', standardJobLevel: null }
      ]
    });
  });
  
  test.afterAll(async () => {
    await cleanupTestData(testAccountId);
  });
  
  test('should show classification cinema in wizard step 3', async ({ page }) => {
    await loginAsClient(page, testAccountId);
    await page.goto('/dashboard/campaigns/new');
    
    // Complete step 1
    await page.fill('[name="name"]', 'Test Campaign');
    await page.click('[data-campaign-type="performance"]');
    await page.click('text=Siguiente');
    
    // Complete step 2
    await page.click('text=Siguiente');
    
    // Should see classification cinema
    await expect(page.locator('text=Clasificación Inteligente de Cargos')).toBeVisible();
    await expect(page.locator('text=3 empleados')).toBeVisible();
  });
  
  test('should approve all and persist on continue', async ({ page }) => {
    await loginAsClient(page, testAccountId);
    await page.goto('/dashboard/campaigns/new');
    
    // Navigate to step 3
    await completeWizardToStep3(page);
    
    // Click approve all
    await page.click('text=Aprobar 3');
    
    // Should show preview
    await expect(page.locator('text=Vista Previa')).toBeVisible();
    
    // Click approve and continue
    await page.click('text=Aprobar todas y continuar');
    
    // Wait for success
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Should advance to next step
    await expect(page.locator('text=Confirmación')).toBeVisible();
    
    // Verify database updated
    const employees = await prisma.employee.findMany({
      where: { accountId: testAccountId }
    });
    expect(employees.every(e => e.standardJobLevel !== null)).toBe(true);
  });
  
  test('should rollback on cancel', async ({ page }) => {
    await loginAsClient(page, testAccountId);
    await page.goto('/dashboard/campaigns/new');
    
    // Navigate to step 3
    await completeWizardToStep3(page);
    
    // Classify one employee
    await page.click('text=Revisar 3');
    await page.click('text=MANAGER');
    
    // Cancel flow
    await page.click('text=Cancelar');
    await page.click('text=Sí, cancelar'); // Confirm dialog
    
    // Verify database NOT updated
    const employees = await prisma.employee.findMany({
      where: { accountId: testAccountId }
    });
    expect(employees.some(e => e.standardJobLevel !== null)).toBe(false);
  });
  
  test('should recover draft on page reload', async ({ page }) => {
    await loginAsClient(page, testAccountId);
    await page.goto('/dashboard/campaigns/new');
    
    // Navigate to step 3
    await completeWizardToStep3(page);
    
    // Classify one employee
    await page.click('text=Revisar 3');
    await page.click('text=MANAGER');
    await page.click('text=Siguiente');
    
    // Reload page
    await page.reload();
    
    // Navigate back to step 3
    await completeWizardToStep3(page);
    
    // Should see draft recovered
    await expect(page.locator('text=1 clasificado')).toBeVisible();
  });
  
  test('should show conflict detection', async ({ page, context }) => {
    // Create employee with conflict (analyst with reports)
    await createTestEmployee(testAccountId, {
      fullName: 'Conflicto Test',
      position: 'Analista',
      directReportsCount: 5
    });
    
    await loginAsClient(page, testAccountId);
    await page.goto('/dashboard/campaigns/new');
    
    await completeWizardToStep3(page);
    await page.click('text=Revisar');
    
    // Should show conflict alert
    await expect(page.locator('text=Inconsistencia detectada')).toBeVisible();
    await expect(page.locator('text=5 personas a cargo')).toBeVisible();
  });
});

// Helper functions
async function completeWizardToStep3(page) {
  await page.fill('[name="name"]', 'Test Campaign');
  await page.click('[data-campaign-type="performance"]');
  await page.click('text=Siguiente');
  await page.click('text=Siguiente');
}
```

### Paso 3: Migration Guide

```markdown
# Migration Guide: Job Classification v2

## Breaking Changes

### Imports
```typescript
// ❌ OLD (v1)
import { JobClassificationGate } from '@/components/job-classification';

// ✅ NEW (v2)
import { JobClassificationCinema } from '@/components/job-classification';
```

### Props
```typescript
// ❌ OLD
<JobClassificationGate
  mode="client"
  onComplete={() => {}}
  onCancel={() => {}}
/>

// ✅ NEW
<JobClassificationCinema
  mode="client"
  onComplete={() => {}}
  onCancel={() => {}}
  accountId={accountId} // NUEVO: requerido para admin mode
/>
```

### API Changes
```typescript
// ❌ OLD: Multiple calls
await fetch('/api/job-classification/assign', { body: { employeeId: '1' } });
await fetch('/api/job-classification/assign', { body: { employeeId: '2' } });

// ✅ NEW: Single batch call
await fetch('/api/job-classification/batch-assign', {
  body: {
    classifications: [
      { employeeId: '1', performanceTrack: 'MANAGER', standardJobLevel: 'jefe' },
      { employeeId: '2', performanceTrack: 'COLABORADOR', standardJobLevel: 'profesional_analista' }
    ]
  }
});
```

### Behavior Changes

| Aspecto | v1 | v2 |
|---------|----|----|
| Persistencia | Inmediata por empleado | Batch al confirmar |
| Cancelar | Datos huérfanos | Rollback completo |
| State | Servidor | localStorage + batch |
| UX | Drawer uno a uno | Cinema + Focus Mode |

## Rollback Plan

Si se detectan problemas en producción:

1. Revertir import en wizard:
```typescript
// Temporal rollback
import { JobClassificationGate as JobClassificationCinema } from '@/components/job-classification/legacy';
```

2. Reactivar endpoint individual:
```typescript
// En /api/job-classification/assign/route.ts
// Comentar validación de mode
```

3. Limpiar localStorage de usuarios:
```javascript
// En consola browser
localStorage.removeItem('fhr-classification-draft-' + accountId);
```
```

### Paso 4: Deprecar componentes legacy

```typescript
// src/components/job-classification/JobClassificationGate.tsx

/**
 * @deprecated Use JobClassificationCinema instead.
 * 
 * This component has a bug where it persists to Employee immediately
 * on each "save" click, causing orphaned data if user cancels.
 * 
 * Migration guide: docs/MIGRATION_JOB_CLASSIFICATION_V2.md
 * 
 * Will be removed in v3.0.0
 */
export const JobClassificationGate = memo(function JobClassificationGate(props) {
  // Development warning
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] JobClassificationGate is deprecated. ' +
      'Use JobClassificationCinema instead. ' +
      'See docs/MIGRATION_JOB_CLASSIFICATION_V2.md'
    );
  }
  
  // ... existing implementation ...
});
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Testing
- [ ] Unit tests pasan (Jest)
- [ ] Integration tests pasan (Jest + Prisma)
- [ ] E2E tests pasan (Playwright)
- [ ] Coverage > 80% para nuevos componentes
- [ ] No regresiones en tests existentes

### Migration
- [ ] Wizard usa JobClassificationCinema
- [ ] Componentes legacy marcados @deprecated
- [ ] console.warn en desarrollo para legacy
- [ ] Documentación de migración creada

### Rollback
- [ ] Plan de rollback documentado
- [ ] Script de limpieza localStorage
- [ ] Componentes legacy aún funcionan

## 🧪 TESTING CHECKLIST

### Pre-Rollout
```yaml
Unit Tests:
  - [ ] useClassificationDraft: inicialización
  - [ ] useClassificationDraft: acciones (approve, update)
  - [ ] useClassificationDraft: persistencia
  - [ ] useClassificationDraft: cancelación
  - [ ] JobClassificationCinema: estados
  - [ ] ClassificationApprovalPreview: agrupación
  - [ ] ClassificationReviewWizard: navegación

Integration Tests:
  - [ ] API batch-assign: success
  - [ ] API batch-assign: validation errors
  - [ ] API batch-assign: transaction rollback
  - [ ] localStorage: save/load/clear

E2E Tests:
  - [ ] Flujo completo: aprobar todos
  - [ ] Flujo completo: revisar pendientes
  - [ ] Cancelar: rollback
  - [ ] Recuperar draft
  - [ ] Detección conflictos
```

### Post-Rollout
```yaml
Monitoring:
  - [ ] No errores 500 en /batch-assign
  - [ ] Tiempo respuesta < 2s
  - [ ] No llamadas a /assign desde wizard

User Feedback:
  - [ ] Encuesta satisfacción UX
  - [ ] Tiempo promedio clasificación
  - [ ] Tasa de abandono wizard
```

## 🤖 PROMPT PARA CLAUDE CODE

```
Implementa TASK_03G: Testing & Rollout

CONTEXTO:
Finalizar implementación de clasificación v2 con tests completos,
migración de wizard, y deprecación de componentes legacy.

ARCHIVOS A CREAR:

1. src/hooks/__tests__/useClassificationDraft.test.ts
   - Tests de inicialización (localStorage, API, expired)
   - Tests de acciones (updateClassification, approveAll)
   - Tests de persistencia (handleContinue, batch API)
   - Tests de cancelación (handleCancel, cleanup)
   - Mock de fetch y localStorage

2. src/components/job-classification/__tests__/JobClassificationCinema.test.tsx
   - Tests de estados (loading, error, hero, complete)
   - Tests de navegación entre vistas
   - Tests de callbacks (onComplete, onCancel)

3. playwright/tests/job-classification-v2.spec.ts
   - E2E: flujo completo aprobar todos
   - E2E: flujo completo revisar pendientes
   - E2E: cancelar y verificar rollback
   - E2E: recuperar draft tras reload
   - E2E: detección de conflictos

4. docs/MIGRATION_JOB_CLASSIFICATION_V2.md
   - Breaking changes
   - Ejemplos de código antes/después
   - Plan de rollback

MODIFICAR:

5. src/app/dashboard/campaigns/new/page.tsx
   - Cambiar: import { JobClassificationGate } → { JobClassificationCinema }

6. src/components/job-classification/JobClassificationGate.tsx
   - Agregar JSDoc @deprecated
   - Agregar console.warn en desarrollo

EJECUTAR:

7. npm test -- --coverage
   - Verificar coverage > 80%
   - Sin regresiones

8. npx playwright test
   - Todos los E2E pasan

CRITERIOS:
- Tests pasan sin errores
- Coverage > 80% nuevos componentes
- Documentación completa
- Legacy deprecated pero funcional
```

## 📚 REFERENCIAS

- TASK_03C-v2: useClassificationDraft (componente a testear)
- TASK_03D: ClassificationApprovalPreview (componente a testear)
- TASK_03E: ClassificationReviewWizard (componente a testear)
- TASK_03F: Batch API (endpoint a testear)
- Jest config: `jest.config.js`
- Playwright config: `playwright.config.ts`
- Testing patterns: `src/__tests__/README.md`
