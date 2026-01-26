# 📚 PLAN DE IMPLEMENTACIÓN: COMPETENCY LIBRARY
## FocalizaHR Enterprise - Arquitectura Refinada
### Versión 1.1 | Enero 2026 | Estado: APROBADO PARA IMPLEMENTACIÓN

---

## 📝 CONTROL DEL DOCUMENTO

| Campo | Valor |
|-------|-------|
| Versión | 1.1 (Refinada) |
| Fecha | Enero 2026 |
| Prerequisitos | Backend v3.0.1 + Post-Backend v1.1 implementados |
| Estimación | 3-4 días desarrollo |
| Prioridad | ALTA - Diferenciador comercial |
| Validación | Gemini + Claude - Arquitectura aprobada |

### Documentos Base
- `ESPECIFICACION_EMPLOYEE_PERFORMANCE_v3_0_1_DEFINITIVA.md`
- `IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v1.1.md`
- `FocalizaHR_-_Documentación_Sistema_Encuestas_v2_1_FINAL.md`

### Cambios vs v1.0
| Aspecto | v1.0 | v1.1 (Refinada) |
|---------|------|-----------------|
| Vínculo Question↔Competency | FK directo | Por `competencyCode` (String) |
| Vínculo semántico Clima | No existía | `dimensionCode`, `subdimensionCode` |
| Snapshot inmutable | En EvaluationAssignment | En `PerformanceCycle.competencySnapshot` |
| Inicialización biblioteca | Al crear Account | Lazy: al activar módulo Performance |

---

## 1. RESUMEN EJECUTIVO

### 1.1 ¿Qué es Competency Library?

Un **catálogo centralizado de competencias organizacionales** que permite:

1. **Ofrecer templates de mejores prácticas** (Lominger, GPTW, Google)
2. **Personalización completa por cliente** (cada Account tiene su biblioteca)
3. **Filtrado automático por nivel** (COLABORADOR/MANAGER/EJECUTIVO)
4. **Reportes con significado de negocio** ("Liderazgo: 4.2" vs "Pregunta 7: 4.2")
5. **Correlación con Clima** (vínculo semántico dimension/subdimension)

### 1.2 Directrices Arquitectónicas Aprobadas

```yaml
DIRECTRIZ 1 - Vínculo Semántico:
  Competency mantiene dimensionCode/subdimensionCode
  Permite correlación: Desempeño ↔ Clima
  "Managers con bajo 'Desarrollo de Personas' tienen equipos con bajo 'Mi jefe me apoya'"

DIRECTRIZ 2 - Snapshot Inmutable:
  Al crear PerformanceCycle, se congela competencySnapshot
  Si cliente edita biblioteca a mitad de ciclo, reportes no se rompen
  Snapshot a nivel de Ciclo, NO por cada Assignment

DIRECTRIZ 3 - Filtrado por EvaluateeTrack:
  El performanceTrack del EVALUADO determina qué preguntas se muestran
  COLABORADOR → Solo CORE
  MANAGER → CORE + LEADERSHIP
  EJECUTIVO → CORE + LEADERSHIP + STRATEGIC

DIRECTRIZ 4 - Lazy Initialization:
  NO copiar competencias al crear Account
  Copiar cuando cliente ACTIVE módulo Performance Evaluation
  Cliente elige template: "Estándar", "Liderazgo 360", "Comenzar vacío"
```

---

## 2. ARQUITECTURA DE INTEGRACIÓN

### 2.1 Diagrama de Flujo Integrado

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA COMPETENCY LIBRARY v1.1                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA GLOBAL: TEMPLATES (Seeds FocalizaHR)                                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  Question (CampaignType: performance-evaluation)                        │  ║  │
│  ║  │  • text: "Comunica sus ideas de forma clara"                            │  ║  │
│  ║  │  • competencyCode: "CORE-COMM" ← String, NO FK                          │  ║  │
│  ║  │  • audienceRule: null | {"minTrack": "MANAGER"}                         │  ║  │
│  ║  │  • responseType: "rating_scale"                                         │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  CompetencyTemplate (Constantes en código)                              │  ║  │
│  ║  │  • FOCALIZAHR_STANDARD: 12 competencias                                 │  ║  │
│  ║  │  • FOCALIZAHR_LEADERSHIP_360: 8 competencias                            │  ║  │
│  ║  │  • FOCALIZAHR_HIGH_PERFORMANCE: 10 competencias                         │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚════════════════════════════════════════════════════════════════════════════════╝  │
│                              │                                                       │
│                              │ Lazy Init al activar módulo                          │
│                              ▼                                                       │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA POR ACCOUNT: BIBLIOTECA PERSONALIZABLE                                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  Competency (Por Account)                                               │  ║  │
│  ║  │  • code: "CORE-COMM" ← Mismo que Question.competencyCode               │  ║  │
│  ║  │  • name: "Comunicación Asertiva" ← Personalizable por cliente          │  ║  │
│  ║  │  • behaviors: ["Escucha activa", ...] ← Personalizable                 │  ║  │
│  ║  │  • dimensionCode: "liderazgo" ← Vínculo semántico Clima                │  ║  │
│  ║  │  • isActive: true/false ← Cliente activa/desactiva                     │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚════════════════════════════════════════════════════════════════════════════════╝  │
│                              │                                                       │
│                              │ Al crear ciclo: Snapshot                             │
│                              ▼                                                       │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  CAPA EJECUCIÓN: EVALUACIONES                                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  PerformanceCycle                                                       │  ║  │
│  ║  │  • competencySnapshot: Json ← Congela biblioteca al crear ciclo        │  ║  │
│  ║  │    [{code, name, category, behaviors, audienceRule}]                    │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                              │                                                 ║  │
│  ║                              ▼                                                 ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  EvaluationAssignment                                                   │  ║  │
│  ║  │  • evaluateePerformanceTrack: "MANAGER" ← Para filtrado                │  ║  │
│  ║  │  • (demás campos existentes sin cambios)                                │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                              │                                                 ║  │
│  ║                              ▼                                                 ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │  FILTRADO EN RUNTIME                                                    │  ║  │
│  ║  │                                                                         │  ║  │
│  ║  │  1. Obtener competencias ACTIVAS del snapshot del ciclo                │  ║  │
│  ║  │  2. Obtener evaluateePerformanceTrack del Assignment                   │  ║  │
│  ║  │  3. Filtrar Questions donde:                                           │  ║  │
│  ║  │     - competencyCode IN (códigos activos)                              │  ║  │
│  ║  │     - audienceRule aplica al evaluateeTrack                            │  ║  │
│  ║  │  4. Mostrar en reporte: snapshot.name + score                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚════════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos Completo

```
SETUP (una vez por Account)
═══════════════════════════════════════════════════════════════════════════════════════

1. Cliente activa módulo "Evaluación de Desempeño"
   ↓
2. Sistema muestra selector de template:
   □ "Modelo FocalizaHR Estándar" (12 competencias)
   □ "Modelo Liderazgo 360°" (8 competencias)
   □ "Comenzar desde cero"
   ↓
3. CompetencyService.initializeFromTemplate(accountId, templateId)
   → Crea 12 registros en tabla Competency para ese Account
   → Cada uno con isActive: true
   ↓
4. Cliente personaliza (opcional):
   → Renombrar: "Comunicación Efectiva" → "Comunicación Asertiva"
   → Desactivar: "Visión Estratégica" (no aplica a su empresa)
   → Agregar: "Innovación" (competencia custom)


CICLO DE EVALUACIÓN
═══════════════════════════════════════════════════════════════════════════════════════

1. Admin crea PerformanceCycle "Evaluación Q1 2026"
   ↓
2. Sistema congela snapshot de competencias activas:
   cycle.competencySnapshot = [
     { code: "CORE-COMM", name: "Comunicación Asertiva", ... },
     { code: "LEAD-DEV", name: "Desarrollo de Personas", ... }
   ]
   ↓
3. generateEvaluations() crea EvaluationAssignments:
   assignment.evaluateePerformanceTrack = evaluatee.performanceTrack
   ↓
4. Evaluador accede a encuesta:
   GET /api/survey/[token]/questions
   → Filtra por snapshot + audienceRule + evaluateeTrack
   → Si evaluatee es COLABORADOR: 8 preguntas (solo CORE)
   → Si evaluatee es MANAGER: 14 preguntas (CORE + LEADERSHIP)
   ↓
5. Evaluador responde:
   → UnifiedSurveyComponent (sin cambios)
   → Response con normalizedScore (sin cambios)
   ↓
6. Reportes:
   → Agrupa por competencyCode
   → Muestra snapshot.name (no el nombre actual de la biblioteca)
   → "Comunicación Asertiva: 4.2"
```

---

## 3. SCHEMA PRISMA

### 3.1 Modelo Competency (NUEVO)

```prisma
// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY - Biblioteca de Competencias por Account
// Patrón: Competency Library (SAP SuccessFactors, Lattice)
// Vínculo con Questions: Por código (competencyCode), NO por FK
// ════════════════════════════════════════════════════════════════════════════

model Competency {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // ═══════════════════════════════════════════════════
  // IDENTIFICACIÓN
  // ═══════════════════════════════════════════════════
  code        String              // "CORE-COMM" - Vínculo con Question.competencyCode
  name        String              // "Comunicación Efectiva" - Personalizable
  description String?             // Descripción detallada
  
  // ═══════════════════════════════════════════════════
  // CLASIFICACIÓN
  // ═══════════════════════════════════════════════════
  category    CompetencyCategory  // CORE, LEADERSHIP, STRATEGIC, TECHNICAL
  
  // ═══════════════════════════════════════════════════
  // DIRECTRIZ 1: VÍNCULO SEMÁNTICO CON CLIMA
  // Permite correlación cruzada: Desempeño ↔ Clima
  // ═══════════════════════════════════════════════════
  dimensionCode    String? @map("dimension_code")    // "liderazgo", "ambiente", etc.
  subdimensionCode String? @map("subdimension_code") // "feedback", "comunicacion", etc.
  
  // ═══════════════════════════════════════════════════
  // COMPORTAMIENTOS OBSERVABLES
  // ═══════════════════════════════════════════════════
  behaviors Json?  // ["Escucha activamente", "Adapta el mensaje", ...]
  
  // ═══════════════════════════════════════════════════
  // REGLA DE AUDIENCIA
  // ═══════════════════════════════════════════════════
  audienceRule Json? @map("audience_rule")
  // null = TODOS (Core)
  // {"minTrack": "MANAGER"} = Managers y Ejecutivos
  // {"minTrack": "EJECUTIVO"} = Solo Ejecutivos
  
  // ═══════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ═══════════════════════════════════════════════════
  isActive  Boolean @default(true) @map("is_active")
  sortOrder Int     @default(0) @map("sort_order")
  
  // ═══════════════════════════════════════════════════
  // ORIGEN (para tracking)
  // ═══════════════════════════════════════════════════
  sourceTemplate String? @map("source_template")  // "focalizahr-standard-v1"
  isCustom       Boolean @default(false) @map("is_custom")
  
  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([accountId, code], map: "unique_competency_code_per_account")
  @@index([accountId, isActive], map: "idx_competencies_account_active")
  @@index([category], map: "idx_competencies_category")
  @@index([dimensionCode], map: "idx_competencies_dimension")
  @@map("competencies")
}

enum CompetencyCategory {
  CORE        // Todos los empleados
  LEADERSHIP  // Managers + Ejecutivos
  STRATEGIC   // Solo Ejecutivos
  TECHNICAL   // Por área/departamento (opcional)
}
```

### 3.2 Modificaciones a Question (Existente)

```prisma
model Question {
  // ... todos los campos existentes SIN CAMBIOS ...
  
  // ═══════════════════════════════════════════════════
  // ✅ AGREGAR: Código de competencia (vínculo semántico)
  // ═══════════════════════════════════════════════════
  competencyCode String? @map("competency_code")
  // Ejemplo: "CORE-COMM", "LEAD-DEV", "STRAT-VISION"
  // Vínculo con Competency.code (mismo valor)
  
  // ═══════════════════════════════════════════════════
  // ✅ AGREGAR: Regla de audiencia
  // ═══════════════════════════════════════════════════
  audienceRule Json? @map("audience_rule")
  // null = Sin filtro (todos)
  // {"minTrack": "MANAGER"} = Solo para evaluar managers+
  // {"minTrack": "EJECUTIVO"} = Solo para evaluar ejecutivos
  
  // ✅ AGREGAR índice
  @@index([competencyCode], map: "idx_questions_competency_code")
}
```

### 3.3 Modificación a PerformanceCycle (Existente)

```prisma
model PerformanceCycle {
  // ... todos los campos existentes SIN CAMBIOS ...
  
  // ═══════════════════════════════════════════════════
  // ✅ DIRECTRIZ 2: Snapshot inmutable de competencias
  // Se congela al crear el ciclo - NO cambia aunque cliente edite biblioteca
  // ═══════════════════════════════════════════════════
  competencySnapshot Json? @map("competency_snapshot")
  // Estructura:
  // [
  //   {
  //     "code": "CORE-COMM",
  //     "name": "Comunicación Asertiva",
  //     "category": "CORE",
  //     "behaviors": ["Escucha activa", ...],
  //     "audienceRule": null
  //   },
  //   ...
  // ]
}
```

### 3.4 Modificación a EvaluationAssignment (Existente)

```prisma
model EvaluationAssignment {
  // ... todos los campos existentes SIN CAMBIOS ...
  
  // ═══════════════════════════════════════════════════
  // ✅ DIRECTRIZ 3: Track del evaluado para filtrado
  // ═══════════════════════════════════════════════════
  evaluateePerformanceTrack String? @map("evaluatee_performance_track")
  // Valores: "COLABORADOR" | "MANAGER" | "EJECUTIVO"
  // Se congela al momento de crear el assignment (snapshot)
}
```

### 3.5 Modificación a Account (Existente)

```prisma
model Account {
  // ... campos existentes ...
  
  // ✅ AGREGAR relación
  competencies Competency[]
}
```

---

## 4. TEMPLATES DE COMPETENCIAS (Seeds)

### 4.1 Estructura de Template

```typescript
// src/lib/constants/competencyTemplates.ts

export interface CompetencyTemplateItem {
  code: string;
  name: string;
  description: string;
  category: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL';
  behaviors: string[];
  audienceRule: { minTrack: string } | null;
  dimensionCode?: string;      // Vínculo semántico Clima
  subdimensionCode?: string;   // Vínculo semántico Clima
}

export interface CompetencyTemplate {
  id: string;
  name: string;
  description: string;
  competencies: CompetencyTemplateItem[];
}
```

### 4.2 Modelo FocalizaHR Estándar LATAM

```typescript
export const FOCALIZAHR_STANDARD_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-standard-v1',
  name: 'Modelo FocalizaHR Estándar',
  description: 'Basado en Lominger, Great Place to Work y mejores prácticas LATAM. 12 competencias organizadas por nivel.',
  competencies: [
    
    // ══════════════════════════════════════════════════════════════════
    // CORE - Todos los empleados (5 competencias)
    // ══════════════════════════════════════════════════════════════════
    
    {
      code: 'CORE-COMM',
      name: 'Comunicación Efectiva',
      description: 'Capacidad de transmitir ideas con claridad y escuchar activamente',
      category: 'CORE',
      behaviors: [
        'Escucha activamente antes de responder',
        'Adapta el mensaje según la audiencia',
        'Comunica información compleja de forma simple',
        'Verifica que el mensaje fue comprendido',
        'Mantiene comunicación abierta y transparente'
      ],
      audienceRule: null,
      dimensionCode: 'comunicacion',
      subdimensionCode: 'claridad'
    },
    {
      code: 'CORE-TEAM',
      name: 'Trabajo en Equipo',
      description: 'Colabora efectivamente para lograr objetivos comunes',
      category: 'CORE',
      behaviors: [
        'Comparte información relevante con el equipo',
        'Apoya a compañeros cuando lo necesitan',
        'Contribuye positivamente al ambiente laboral',
        'Maneja conflictos de manera constructiva',
        'Celebra los logros del equipo'
      ],
      audienceRule: null,
      dimensionCode: 'ambiente',
      subdimensionCode: 'colaboracion'
    },
    {
      code: 'CORE-RESULTS',
      name: 'Orientación a Resultados',
      description: 'Enfoque en cumplir objetivos con calidad y eficiencia',
      category: 'CORE',
      behaviors: [
        'Define metas claras y medibles',
        'Prioriza tareas según impacto',
        'Cumple compromisos en tiempo y forma',
        'Busca mejorar continuamente sus resultados',
        'Asume responsabilidad por sus entregables'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'CORE-ADAPT',
      name: 'Adaptabilidad',
      description: 'Flexibilidad ante cambios y nuevos desafíos',
      category: 'CORE',
      behaviors: [
        'Acepta cambios con actitud positiva',
        'Aprende rápidamente nuevas habilidades',
        'Propone alternativas ante obstáculos',
        'Mantiene efectividad bajo presión',
        'Se recupera rápidamente de los reveses'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'CORE-CLIENT',
      name: 'Orientación al Cliente',
      description: 'Foco en satisfacer necesidades del cliente interno/externo',
      category: 'CORE',
      behaviors: [
        'Entiende las necesidades del cliente',
        'Responde oportunamente a solicitudes',
        'Busca superar expectativas',
        'Mantiene relaciones positivas',
        'Anticipa necesidades futuras'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },

    // ══════════════════════════════════════════════════════════════════
    // LEADERSHIP - Managers + Ejecutivos (4 competencias)
    // ══════════════════════════════════════════════════════════════════
    
    {
      code: 'LEAD-DEV',
      name: 'Desarrollo de Personas',
      description: 'Capacidad de hacer crecer a los miembros del equipo',
      category: 'LEADERSHIP',
      behaviors: [
        'Identifica fortalezas y áreas de mejora de cada persona',
        'Proporciona feedback constructivo regularmente',
        'Crea oportunidades de aprendizaje y crecimiento',
        'Delega para desarrollar, no solo para descargar',
        'Celebra el progreso y los logros individuales'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'desarrollo'
    },
    {
      code: 'LEAD-TEAM',
      name: 'Liderazgo de Equipos',
      description: 'Guía y motiva al equipo hacia objetivos comunes',
      category: 'LEADERSHIP',
      behaviors: [
        'Establece dirección clara para el equipo',
        'Motiva y reconoce logros',
        'Toma decisiones oportunas',
        'Genera confianza y credibilidad',
        'Protege al equipo de distracciones innecesarias'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'direccion'
    },
    {
      code: 'LEAD-DELEG',
      name: 'Delegación Efectiva',
      description: 'Asigna responsabilidades apropiadamente',
      category: 'LEADERSHIP',
      behaviors: [
        'Asigna tareas según capacidades y desarrollo',
        'Proporciona recursos y autoridad necesarios',
        'Da seguimiento sin microgestionar',
        'Asume responsabilidad por resultados del equipo',
        'Ajusta nivel de supervisión según madurez'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'autonomia'
    },
    {
      code: 'LEAD-FEEDBACK',
      name: 'Feedback y Coaching',
      description: 'Retroalimentación que impulsa el crecimiento',
      category: 'LEADERSHIP',
      behaviors: [
        'Da feedback específico y oportuno',
        'Balancea reconocimiento con áreas de mejora',
        'Hace preguntas que generan reflexión',
        'Crea ambiente seguro para el error',
        'Adapta estilo de coaching según la persona'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'feedback'
    },

    // ══════════════════════════════════════════════════════════════════
    // STRATEGIC - Solo Ejecutivos (3 competencias)
    // ══════════════════════════════════════════════════════════════════
    
    {
      code: 'STRAT-VISION',
      name: 'Visión Estratégica',
      description: 'Capacidad de ver el panorama completo y definir rumbo',
      category: 'STRATEGIC',
      behaviors: [
        'Analiza tendencias del entorno',
        'Identifica oportunidades de largo plazo',
        'Define estrategias alineadas con la visión',
        'Comunica el rumbo de forma inspiradora',
        'Toma decisiones considerando múltiples escenarios'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'STRAT-CHANGE',
      name: 'Gestión del Cambio',
      description: 'Lidera transformaciones organizacionales',
      category: 'STRATEGIC',
      behaviors: [
        'Comunica la necesidad del cambio',
        'Diseña planes de transición',
        'Maneja resistencias constructivamente',
        'Sostiene el cambio en el tiempo',
        'Aprende de iniciativas anteriores'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'STRAT-INFLUENCE',
      name: 'Influencia Organizacional',
      description: 'Impacta decisiones más allá de su área',
      category: 'STRATEGIC',
      behaviors: [
        'Construye alianzas estratégicas',
        'Persuade con datos y argumentos',
        'Genera consenso en temas complejos',
        'Representa efectivamente a la organización',
        'Navega la política organizacional con integridad'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    }
  ]
};

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES ADICIONALES
// ════════════════════════════════════════════════════════════════════════════

export const FOCALIZAHR_LEADERSHIP_360_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-leadership-360-v1',
  name: 'Modelo Liderazgo 360°',
  description: 'Enfocado en competencias de people managers. Ideal para evaluaciones de líderes.',
  competencies: [
    // 8 competencias enfocadas en liderazgo
    // ... (estructura similar, todas con audienceRule: { minTrack: 'MANAGER' })
  ]
};

export const FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-high-perf-v1',
  name: 'Modelo High Performance',
  description: 'Basado en Google Project Oxygen y Netflix Culture. Para organizaciones de alto rendimiento.',
  competencies: [
    // 10 competencias de alto rendimiento
    // ... (estructura similar)
  ]
};

// Mapa de templates
export const COMPETENCY_TEMPLATES: Record<string, CompetencyTemplate> = {
  'focalizahr-standard-v1': FOCALIZAHR_STANDARD_TEMPLATE,
  'focalizahr-leadership-360-v1': FOCALIZAHR_LEADERSHIP_360_TEMPLATE,
  'focalizahr-high-perf-v1': FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE
};
```

---

## 5. SERVICIOS

### 5.1 CompetencyService

```typescript
// src/lib/services/CompetencyService.ts

import { prisma } from '@/lib/prisma';
import { COMPETENCY_TEMPLATES, CompetencyTemplate } from '@/lib/constants/competencyTemplates';
import { CompetencyCategory, Competency } from '@prisma/client';

export class CompetencyService {

  // ════════════════════════════════════════════════════════════════════════════
  // DIRECTRIZ 4: LAZY INITIALIZATION
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Inicializa biblioteca de competencias desde un template
   * Se llama cuando el cliente ACTIVA el módulo de Performance Evaluation
   */
  static async initializeFromTemplate(
    accountId: string,
    templateId: string
  ): Promise<{ created: number; template: string }> {
    
    const template = COMPETENCY_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    // Verificar que no existan competencias para este account
    const existing = await prisma.competency.count({ where: { accountId } });
    if (existing > 0) {
      throw new Error('Este account ya tiene competencias inicializadas');
    }

    const competenciesToCreate = template.competencies.map((comp, index) => ({
      accountId,
      code: comp.code,
      name: comp.name,
      description: comp.description,
      category: comp.category as CompetencyCategory,
      behaviors: comp.behaviors,
      audienceRule: comp.audienceRule,
      dimensionCode: comp.dimensionCode || null,
      subdimensionCode: comp.subdimensionCode || null,
      sourceTemplate: templateId,
      isCustom: false,
      sortOrder: index,
      isActive: true
    }));

    const result = await prisma.competency.createMany({
      data: competenciesToCreate
    });

    return { 
      created: result.count, 
      template: template.name 
    };
  }

  /**
   * Lista templates disponibles
   */
  static getAvailableTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    competencyCount: number;
    categories: string[];
  }> {
    return Object.entries(COMPETENCY_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      competencyCount: template.competencies.length,
      categories: [...new Set(template.competencies.map(c => c.category))]
    }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CRUD COMPETENCIAS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene competencias de un Account
   */
  static async getByAccount(
    accountId: string,
    options?: { 
      category?: CompetencyCategory; 
      activeOnly?: boolean;
      includeCustom?: boolean;
    }
  ): Promise<Competency[]> {
    
    const where: any = { accountId };
    
    if (options?.category) {
      where.category = options.category;
    }
    
    if (options?.activeOnly !== false) {
      where.isActive = true;
    }

    return prisma.competency.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' }
      ]
    });
  }

  /**
   * Obtiene códigos de competencias activas
   */
  static async getActiveCompetencyCodes(accountId: string): Promise<string[]> {
    const competencies = await prisma.competency.findMany({
      where: { accountId, isActive: true },
      select: { code: true }
    });
    return competencies.map(c => c.code);
  }

  /**
   * Crea competencia personalizada
   */
  static async createCustom(
    accountId: string,
    data: {
      code: string;
      name: string;
      description?: string;
      category: CompetencyCategory;
      behaviors?: string[];
      audienceRule?: { minTrack: string } | null;
      dimensionCode?: string;
      subdimensionCode?: string;
    }
  ): Promise<Competency> {
    
    // Validar que el código no exista
    const existing = await prisma.competency.findFirst({
      where: { accountId, code: data.code }
    });
    
    if (existing) {
      throw new Error(`Ya existe una competencia con código ${data.code}`);
    }

    // Obtener el máximo sortOrder
    const maxSort = await prisma.competency.aggregate({
      where: { accountId },
      _max: { sortOrder: true }
    });

    return prisma.competency.create({
      data: {
        accountId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        behaviors: data.behaviors || [],
        audienceRule: data.audienceRule,
        dimensionCode: data.dimensionCode,
        subdimensionCode: data.subdimensionCode,
        isCustom: true,
        sourceTemplate: null,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        isActive: true
      }
    });
  }

  /**
   * Actualiza competencia
   */
  static async update(
    accountId: string,
    competencyId: string,
    data: Partial<{
      name: string;
      description: string;
      behaviors: string[];
      isActive: boolean;
      sortOrder: number;
    }>
  ): Promise<Competency> {
    
    return prisma.competency.update({
      where: { 
        id: competencyId,
        accountId // Seguridad: solo puede editar sus propias competencias
      },
      data
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DIRECTRIZ 2: SNAPSHOT PARA CICLO
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Genera snapshot de competencias activas para congelar en un ciclo
   */
  static async generateSnapshot(accountId: string): Promise<object[]> {
    const competencies = await prisma.competency.findMany({
      where: { accountId, isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    });

    return competencies.map(c => ({
      code: c.code,
      name: c.name,
      category: c.category,
      behaviors: c.behaviors,
      audienceRule: c.audienceRule,
      dimensionCode: c.dimensionCode,
      subdimensionCode: c.subdimensionCode
    }));
  }

  /**
   * Obtiene competencia del snapshot por código
   */
  static getFromSnapshot(
    snapshot: object[], 
    competencyCode: string
  ): object | null {
    return (snapshot as any[]).find(c => c.code === competencyCode) || null;
  }
}
```

### 5.2 CompetencyFilterService

```typescript
// src/lib/services/CompetencyFilterService.ts

import { prisma } from '@/lib/prisma';
import { CompetencyService } from './CompetencyService';

const TRACK_HIERARCHY: Record<string, number> = {
  'COLABORADOR': 1,
  'MANAGER': 2,
  'EJECUTIVO': 3
};

export class CompetencyFilterService {

  /**
   * DIRECTRIZ 3: Filtra preguntas según competencias activas y track del evaluado
   */
  static async getFilteredQuestions(
    campaignTypeId: string,
    cycleCompetencySnapshot: object[],
    evaluateePerformanceTrack: string
  ): Promise<any[]> {
    
    // 1. Obtener códigos de competencias del snapshot
    const activeCodes = (cycleCompetencySnapshot as any[]).map(c => c.code);
    
    // 2. Obtener nivel del evaluado
    const evaluateeLevel = TRACK_HIERARCHY[evaluateePerformanceTrack] || 1;
    
    // 3. Obtener todas las preguntas del CampaignType
    const allQuestions = await prisma.question.findMany({
      where: {
        campaignTypeId,
        isActive: true,
        competencyCode: { in: activeCodes }
      },
      orderBy: { questionOrder: 'asc' }
    });
    
    // 4. Filtrar por audienceRule
    const filteredQuestions = allQuestions.filter(question => {
      // Sin regla = todos
      if (!question.audienceRule) return true;
      
      const rule = question.audienceRule as { minTrack?: string };
      
      // Regla minTrack: evaluado debe tener nivel >= al mínimo
      if (rule.minTrack) {
        const minLevel = TRACK_HIERARCHY[rule.minTrack] || 1;
        return evaluateeLevel >= minLevel;
      }
      
      return true;
    });
    
    // 5. Enriquecer con nombre de competencia del snapshot
    return filteredQuestions.map(q => {
      const competency = CompetencyService.getFromSnapshot(
        cycleCompetencySnapshot, 
        q.competencyCode!
      );
      
      return {
        ...q,
        competencyName: (competency as any)?.name || q.competencyCode,
        competencyCategory: (competency as any)?.category
      };
    });
  }

  /**
   * Cuenta preguntas por track (para mostrar en UI)
   */
  static countQuestionsByTrack(
    questions: any[]
  ): { colaborador: number; manager: number; ejecutivo: number } {
    
    let core = 0;
    let leadership = 0;
    let strategic = 0;
    
    questions.forEach(q => {
      if (!q.audienceRule) {
        core++;
      } else {
        const rule = q.audienceRule as { minTrack?: string };
        if (rule.minTrack === 'MANAGER') leadership++;
        if (rule.minTrack === 'EJECUTIVO') strategic++;
      }
    });
    
    return {
      colaborador: core,
      manager: core + leadership,
      ejecutivo: core + leadership + strategic
    };
  }
}
```

---

## 6. SEED DE PREGUNTAS

### 6.1 CampaignType Performance Evaluation

```typescript
// prisma/seeds/performance-evaluation-seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPerformanceEvaluation() {
  console.log('🎯 Seeding Performance Evaluation CampaignType...');
  
  // ════════════════════════════════════════════════════════════════
  // PASO 1: Crear o actualizar CampaignType
  // ════════════════════════════════════════════════════════════════
  
  const campaignType = await prisma.campaignType.upsert({
    where: { slug: 'performance-evaluation' },
    update: {
      questionCount: 20,
      estimatedDuration: 15
    },
    create: {
      name: 'Evaluación de Desempeño',
      slug: 'performance-evaluation',
      description: 'Evaluación integral de competencias organizacionales con filtrado por nivel',
      questionCount: 20,
      estimatedDuration: 15,
      methodology: 'Competency-Based Assessment + FocalizaHR Framework',
      category: 'desempeno',
      isActive: true,
      sortOrder: 10,
      isPermanent: false  // No es permanente como Exit
    }
  });
  
  console.log(`✅ CampaignType: ${campaignType.id}`);
  
  // ════════════════════════════════════════════════════════════════
  // PASO 2: Definir preguntas con competencyCode y audienceRule
  // ════════════════════════════════════════════════════════════════
  
  const questionsDefinition = [
    
    // ═══════════════════════════════════════════════════════════════
    // CORE - Comunicación (CORE-COMM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 1,
      text: 'Comunica sus ideas de forma clara y comprensible para diferentes audiencias.',
      category: 'competencia',
      subcategory: 'comunicacion',
      responseType: 'rating_scale',
      competencyCode: 'CORE-COMM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 2,
      text: 'Escucha activamente y considera las opiniones de otros antes de responder.',
      category: 'competencia',
      subcategory: 'comunicacion',
      responseType: 'rating_scale',
      competencyCode: 'CORE-COMM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CORE - Trabajo en Equipo (CORE-TEAM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 3,
      text: 'Colabora efectivamente con su equipo para lograr objetivos comunes.',
      category: 'competencia',
      subcategory: 'equipo',
      responseType: 'rating_scale',
      competencyCode: 'CORE-TEAM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 4,
      text: 'Apoya a sus compañeros y contribuye positivamente al ambiente laboral.',
      category: 'competencia',
      subcategory: 'equipo',
      responseType: 'rating_scale',
      competencyCode: 'CORE-TEAM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CORE - Resultados (CORE-RESULTS) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 5,
      text: 'Cumple sus compromisos y entrega resultados en tiempo y forma.',
      category: 'competencia',
      subcategory: 'resultados',
      responseType: 'rating_scale',
      competencyCode: 'CORE-RESULTS',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 6,
      text: 'Prioriza tareas según su impacto y busca mejorar continuamente.',
      category: 'competencia',
      subcategory: 'resultados',
      responseType: 'rating_scale',
      competencyCode: 'CORE-RESULTS',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CORE - Adaptabilidad (CORE-ADAPT) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 7,
      text: 'Se adapta positivamente a los cambios y nuevos desafíos.',
      category: 'competencia',
      subcategory: 'adaptabilidad',
      responseType: 'rating_scale',
      competencyCode: 'CORE-ADAPT',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 8,
      text: 'Mantiene su efectividad bajo presión y propone alternativas ante obstáculos.',
      category: 'competencia',
      subcategory: 'adaptabilidad',
      responseType: 'rating_scale',
      competencyCode: 'CORE-ADAPT',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Desarrollo de Personas (LEAD-DEV) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 9,
      text: 'Dedica tiempo a desarrollar las habilidades de los miembros de su equipo.',
      category: 'competencia',
      subcategory: 'desarrollo_personas',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DEV',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 10,
      text: 'Proporciona feedback constructivo de manera regular y oportuna.',
      category: 'competencia',
      subcategory: 'desarrollo_personas',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DEV',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Liderazgo de Equipos (LEAD-TEAM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 11,
      text: 'Establece una dirección clara y motiva al equipo hacia los objetivos.',
      category: 'competencia',
      subcategory: 'liderazgo_equipos',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-TEAM',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 12,
      text: 'Genera confianza y credibilidad en su equipo.',
      category: 'competencia',
      subcategory: 'liderazgo_equipos',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-TEAM',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Delegación (LEAD-DELEG) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 13,
      text: 'Delega responsabilidades de forma apropiada según las capacidades de cada persona.',
      category: 'competencia',
      subcategory: 'delegacion',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DELEG',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 14,
      text: 'Da seguimiento sin caer en microgestión y asume responsabilidad por los resultados del equipo.',
      category: 'competencia',
      subcategory: 'delegacion',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DELEG',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Visión Estratégica (STRAT-VISION) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 15,
      text: 'Tiene una visión clara del rumbo estratégico de la organización.',
      category: 'competencia',
      subcategory: 'vision_estrategica',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-VISION',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 16,
      text: 'Comunica la visión de forma inspiradora y genera compromiso.',
      category: 'competencia',
      subcategory: 'vision_estrategica',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-VISION',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Gestión del Cambio (STRAT-CHANGE) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 17,
      text: 'Lidera efectivamente iniciativas de cambio organizacional.',
      category: 'competencia',
      subcategory: 'gestion_cambio',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-CHANGE',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 18,
      text: 'Maneja las resistencias al cambio de manera constructiva.',
      category: 'competencia',
      subcategory: 'gestion_cambio',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-CHANGE',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // FEEDBACK ABIERTO - Todos
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 19,
      text: '¿Qué aspectos destacarías del desempeño de esta persona?',
      category: 'feedback',
      subcategory: 'fortalezas',
      responseType: 'text_open',
      competencyCode: null,
      audienceRule: null,
      isRequired: false
    },
    {
      questionOrder: 20,
      text: '¿Qué áreas de mejora identificas y qué sugerencias le darías?',
      category: 'feedback',
      subcategory: 'mejoras',
      responseType: 'text_open',
      competencyCode: null,
      audienceRule: null,
      isRequired: false
    }
  ];
  
  // ════════════════════════════════════════════════════════════════
  // PASO 3: Upsert de preguntas
  // ════════════════════════════════════════════════════════════════
  
  console.log('📝 Procesando 20 preguntas...');
  
  let updatedCount = 0;
  let createdCount = 0;
  
  for (const qDef of questionsDefinition) {
    const existing = await prisma.question.findFirst({
      where: {
        campaignTypeId: campaignType.id,
        questionOrder: qDef.questionOrder
      }
    });
    
    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          text: qDef.text,
          category: qDef.category,
          subcategory: qDef.subcategory,
          responseType: qDef.responseType,
          competencyCode: qDef.competencyCode,
          audienceRule: qDef.audienceRule,
          minValue: qDef.minValue ?? 1,
          maxValue: qDef.maxValue ?? 5,
          isRequired: qDef.isRequired ?? true,
          isActive: true
        }
      });
      updatedCount++;
    } else {
      await prisma.question.create({
        data: {
          campaignTypeId: campaignType.id,
          questionOrder: qDef.questionOrder,
          text: qDef.text,
          category: qDef.category,
          subcategory: qDef.subcategory,
          responseType: qDef.responseType,
          competencyCode: qDef.competencyCode,
          audienceRule: qDef.audienceRule,
          minValue: qDef.minValue ?? 1,
          maxValue: qDef.maxValue ?? 5,
          isRequired: qDef.isRequired ?? true,
          isActive: true
        }
      });
      createdCount++;
    }
  }
  
  console.log(`✅ Preguntas: ${updatedCount} actualizadas, ${createdCount} creadas`);
  console.log('');
  console.log('📊 Resumen de preguntas por nivel:');
  console.log('   COLABORADOR: 8 preguntas (CORE)');
  console.log('   MANAGER: 14 preguntas (CORE + LEADERSHIP)');
  console.log('   EJECUTIVO: 18 preguntas (CORE + LEADERSHIP + STRATEGIC)');
  console.log('   + 2 preguntas de feedback abierto');
  
  console.log('');
  console.log('✅ Seed Performance Evaluation completado');
}

seedPerformanceEvaluation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 7. PLAN DE IMPLEMENTACIÓN (3-4 Días)

### 7.1 Día 1: Schema y Modelos

```yaml
MAÑANA (4 horas):
  □ Agregar modelo Competency a schema.prisma (Sección 3.1)
  □ Agregar campos a Question: competencyCode, audienceRule (Sección 3.2)
  □ Agregar campo a PerformanceCycle: competencySnapshot (Sección 3.3)
  □ Agregar campo a EvaluationAssignment: evaluateePerformanceTrack (Sección 3.4)
  □ Agregar relación en Account (Sección 3.5)
  □ Generar migración: npx prisma migrate dev --name add_competency_library
  □ Verificar TypeScript compila

TARDE (4 horas):
  □ Crear src/lib/constants/competencyTemplates.ts (Sección 4)
  □ Crear src/lib/services/CompetencyService.ts (Sección 5.1)
  □ Crear src/lib/services/CompetencyFilterService.ts (Sección 5.2)
  □ Test básico: importar servicios sin errores

ENTREGABLES DÍA 1:
  ✅ Schema actualizado con Competency, competencyCode, competencySnapshot
  ✅ Migración ejecutada
  ✅ Templates y servicios en código
```

### 7.2 Día 2: APIs y Seed de Preguntas

```yaml
MAÑANA (4 horas):
  □ API GET /api/admin/competencies
  □ API POST /api/admin/competencies
  □ API PATCH /api/admin/competencies/[id]
  □ API DELETE /api/admin/competencies/[id] (soft delete)
  □ API GET /api/admin/competencies/templates
  □ API POST /api/admin/competencies/initialize

TARDE (4 horas):
  □ Crear prisma/seeds/performance-evaluation-seed.ts (Sección 6)
  □ Ejecutar seed: npm run db:seed:performance
  □ Modificar generateEvaluations para guardar evaluateePerformanceTrack
  □ Test: Verificar preguntas con competencyCode en DB

ENTREGABLES DÍA 2:
  ✅ APIs CRUD competencias funcionando
  ✅ Seed de 20 preguntas ejecutado
  ✅ evaluateePerformanceTrack guardado en assignments
```

### 7.3 Día 3: Filtrado y Snapshot

```yaml
MAÑANA (4 horas):
  □ Implementar snapshot en creación de PerformanceCycle
  □ Modificar API de preguntas para filtrar por snapshot + track
  □ Test: Crear ciclo, verificar competencySnapshot guardado
  □ Test: Obtener preguntas filtradas según evaluateeTrack

TARDE (4 horas):
  □ UI Admin: Página /admin/competencias básica
  □ Componente CompetencyList
  □ Modal para editar competencia
  □ Toggle activo/inactivo

ENTREGABLES DÍA 3:
  ✅ Snapshot inmutable funcionando
  ✅ Filtrado por track funcionando
  ✅ UI básica para gestionar competencias
```

### 7.4 Día 4: Integración y Testing

```yaml
MAÑANA (4 horas):
  □ Selector de template en activación de módulo
  □ Integrar nombre de competencia en reportes
  □ Export Excel con competencias
  □ Documentar APIs

TARDE (4 horas):
  □ Test E2E flujo completo:
    - Activar módulo → Seleccionar template
    - Personalizar biblioteca
    - Crear ciclo → Verificar snapshot
    - Evaluador responde → Verificar filtrado
    - Reporte muestra competencias
  □ Fix bugs
  □ Code review

ENTREGABLES DÍA 4:
  ✅ Flujo completo funcionando
  ✅ Reportes con nombres de competencias
  ✅ Documentación actualizada
```

---

## 8. PROMPTS PARA CLAUDE CODE

### Día 1 - Prompt

```
TU OBJETIVO Y TAREA - ENTREGABLES DÍA 1:
✅ Schema actualizado con Competency
✅ Migración ejecutada
✅ Templates y servicios en código

TAREAS:
□ Agregar modelo Competency a schema.prisma (ver sección 3.1 del documento)
□ Agregar campos a Question: competencyCode (String?), audienceRule (Json?)
□ Agregar campo a PerformanceCycle: competencySnapshot (Json?)
□ Agregar campo a EvaluationAssignment: evaluateePerformanceTrack (String?)
□ Agregar relación competencies en Account
□ Crear enum CompetencyCategory: CORE, LEADERSHIP, STRATEGIC, TECHNICAL
□ Agregar índices según documento
□ Generar migración: npx prisma migrate dev --name add_competency_library
□ Verificar TypeScript compila
□ Crear src/lib/constants/competencyTemplates.ts con FOCALIZAHR_STANDARD_TEMPLATE
□ Crear src/lib/services/CompetencyService.ts básico
□ Crear src/lib/services/CompetencyFilterService.ts básico

LOS DETALLES DE CADA TAREA ESTÁN EN:
.claude/task/PLAN_COMPETENCY_LIBRARY_v1_1_REFINADO.md

CUALQUIER CONSULTA LA HACES ANTES DE COMENZAR.
```

### Día 2 - Prompt

```
TU OBJETIVO Y TAREA - ENTREGABLES DÍA 2:
✅ APIs CRUD competencias funcionando
✅ Seed de 20 preguntas ejecutado
✅ evaluateePerformanceTrack guardado en assignments

TAREAS:
□ API GET /api/admin/competencies
□ API POST /api/admin/competencies
□ API PATCH /api/admin/competencies/[id]
□ API DELETE /api/admin/competencies/[id]
□ API GET /api/admin/competencies/templates
□ API POST /api/admin/competencies/initialize
□ Crear prisma/seeds/performance-evaluation-seed.ts (20 preguntas)
□ Ejecutar seed
□ Modificar generateUpwardEvaluations para guardar evaluateePerformanceTrack
□ Modificar generateDownwardEvaluations igual
□ Test: Verificar preguntas con competencyCode en DB

LOS DETALLES DE CADA TAREA ESTÁN EN:
.claude/task/PLAN_COMPETENCY_LIBRARY_v1_1_REFINADO.md

CUALQUIER CONSULTA LA HACES ANTES DE COMENZAR.
```

---

## 9. CHECKLIST DE VALIDACIÓN

### Pre-Implementación

```yaml
□ Schema correcto:
  □ Competency tiene: code, name, category, behaviors, audienceRule, dimensionCode, subdimensionCode
  □ Question tiene: competencyCode (String?), audienceRule (Json?)
  □ PerformanceCycle tiene: competencySnapshot (Json?)
  □ EvaluationAssignment tiene: evaluateePerformanceTrack (String?)
  □ Índices creados

□ Templates correcto:
  □ FOCALIZAHR_STANDARD_TEMPLATE tiene 12 competencias
  □ Cada competencia tiene: code, name, category, behaviors, audienceRule
  □ dimensionCode/subdimensionCode donde aplica
```

### Post-Implementación

```yaml
□ Funcionalidad:
  □ Admin puede inicializar desde template (lazy)
  □ Admin puede crear competencia personalizada
  □ Admin puede editar nombre/behaviors
  □ Admin puede activar/desactivar competencias
  □ Al crear ciclo se guarda competencySnapshot
  □ Evaluador ve preguntas filtradas según evaluateeTrack
  □ Reportes muestran nombre del snapshot (no el actual)

□ Flujo completo:
  □ COLABORADOR evaluado → 8 preguntas (Core)
  □ MANAGER evaluado → 14 preguntas (Core + Leadership)
  □ EJECUTIVO evaluado → 18 preguntas (Core + Leadership + Strategic)
  □ + 2 preguntas feedback abierto

□ Compatibilidad:
  □ Encuestas existentes siguen funcionando
  □ UnifiedSurveyComponent sin cambios
  □ useSurveyEngine sin cambios
  □ No hay errores de TypeScript
```

---

## 10. VALOR COMERCIAL

### Pitch de Venta

> *"FocalizaHR incluye Biblioteca de Competencias totalmente personalizable, igual que SAP SuccessFactors y Lattice. Ofrecemos modelos basados en mejores prácticas internacionales, y su empresa puede modificarlos según su cultura organizacional.*
>
> *El sistema automáticamente asigna qué competencias evaluar según el nivel: un analista es evaluado en competencias básicas, un gerente también en liderazgo, y un director además en competencias estratégicas.*
>
> *Lo mejor: las competencias se integran con todos nuestros productos. Si un líder tiene bajo score en 'Desarrollo de Personas', le mostramos que su equipo tiene 40% más rotación. Eso es inteligencia organizacional que ningún competidor ofrece."*

---

**FIN DEL DOCUMENTO**

*Versión 1.1 Refinada - Arquitectura Aprobada*
*Enero 2026*
