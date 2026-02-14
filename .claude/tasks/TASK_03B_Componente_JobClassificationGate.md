# TASK 03B: Componente JobClassificationGate (UI Premium)

## Objetivo
Crear componente reutilizable de clasificación de cargos con diseño premium FocalizaHR.

## Archivos a Crear

```
src/components/job-classification/
├── JobClassificationGate.tsx      # Componente principal (orquestador)
├── ClassificationSummary.tsx      # Resumen visual (PATRÓN A: One Screen)
├── UnmappedPositionsDrawer.tsx    # Drawer para resolver (PATRÓN C)
├── PositionAssignmentCard.tsx     # Card individual de cargo
└── index.ts                       # Exports
```

## Referencia Técnica
Ver: `.claude/tasks/REF_TASK_03B.md`

## Diseño UX (FILOSOFIA_DISENO_FOCALIZAHR_v2.md)

### Patrón A: One Screen Decision
- Gauge circular con porcentaje de clasificación
- 3 cards de resumen (EJECUTIVO / MANAGER / COLABORADOR)
- Tesla Line bajo el protagonista
- CTA "Resolver Pendientes" si hay > 0
- CTA "Continuar" disabled si hay pendientes

### Patrón C: Detail + Drawer
- Lista de cargos sin clasificar (izquierda)
- Drawer de asignación (derecha)
- Selector de nivel con preview de track resultante
- Botón "Asignar y Siguiente"

## Props del Componente Principal

```typescript
interface JobClassificationGateProps {
  mode: 'client' | 'admin';
  accountId?: string;  // Solo para admin
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
}
```

## Criterios de Aceptación

- [ ] Componente funciona en modo 'client' (sin selector empresa)
- [ ] Componente funciona en modo 'admin' (con accountId prop)
- [ ] Summary muestra gauge con % clasificación
- [ ] Cards muestran distribución por track (EJECUTIVO/MANAGER/COLABORADOR)
- [ ] Drawer permite asignar nivel a cargos sin clasificar
- [ ] Animaciones con framer-motion (timing según guía)
- [ ] Celebración confetti al llegar a 100%
- [ ] Botón "Continuar" disabled mientras haya pendientes
- [ ] Diseño glassmorphism, gradientes cyan/purple
- [ ] Mobile responsive

## Dependencias
- framer-motion (ya instalado)
- lucide-react (ya instalado)
- Clases .fhr-* del design system
