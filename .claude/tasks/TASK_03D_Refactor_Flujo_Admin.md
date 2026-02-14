# TASK 03D: Refactorizar Flujo Admin (Concierge)

## Objetivo
Refactorizar la UI existente de job-mapping-review para usar los nuevos componentes y trabajar sobre Employee.

## Archivo a Modificar

```
src/app/dashboard/admin/job-mapping-review/page.tsx
```

## Estado Actual (Problemas)
- ❌ No tiene selector de empresa
- ❌ Trabaja sobre Participant, no Employee
- ❌ No tiene diseño FocalizaHR premium
- ❌ CTAs confusos ("actualizar" no es claro)
- ❌ No integra con el flujo de generación de ciclo

## Estado Objetivo
- ✅ Selector de empresa al inicio
- ✅ Trabaja sobre Employee (misma API que cliente)
- ✅ Diseño FocalizaHR con glassmorphism
- ✅ Usa <JobClassificationGate mode="admin" />
- ✅ CTAs claros: "Asignar Nivel", "Confirmar"

## Referencia Técnica
Ver: `.claude/tasks/REF_TASK_03D.md`

## Estructura Nueva

```
┌─────────────────────────────────────────────────────────────────┐
│  REVISIÓN DE CLASIFICACIÓN (Admin)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Seleccionar Empresa:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔍  Empresa ABC SpA                              ▼     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│                                                                 │
│       <JobClassificationGate                                    │
│         mode="admin"                                            │
│         accountId={selectedAccountId}                           │
│         onComplete={handleComplete}                             │
│       />                                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Criterios de Aceptación

- [ ] Selector de empresa funcional (lista de accounts)
- [ ] Al seleccionar empresa, carga datos de clasificación
- [ ] Usa el componente JobClassificationGate mode="admin"
- [ ] Pasa accountId como prop
- [ ] Diseño consistente con resto del admin
- [ ] Botón de navegación a otras vistas admin

## Dependencias
- TASK_03A completada (APIs)
- TASK_03B completada (Componentes UI)

## Notas

1. **Esta Task es secundaria**: El flujo cliente (Task 3C) tiene prioridad.

2. **Mismo componente, diferente modo**: Reutilizar JobClassificationGate cambiando solo el mode y pasando accountId.

3. **Selector de empresa**: Usar API existente `/api/admin/accounts` para listar empresas.
