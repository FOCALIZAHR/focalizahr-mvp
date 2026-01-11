# FocalizaHR - Sistema de Inteligencia Predictiva Organizacional Enterprise

> **ÚNICO DOCUMENTO DE REFERENCIA PARA CLAUDE CODE**  
> Versión: 1.0 Enterprise | Enero 2025 | Estado: Production Ready

---

## 🎯 VISIÓN Y FILOSOFÍA

### La Transformación Fundamental

```yaml
ANTES (Industria Tradicional):
  ❌ "Plataforma de encuestas de clima"
  ❌ Análisis post-mortem (autopsias organizacionales)
  ❌ 6+ meses de análisis → Inacción
  ❌ "Mejorar comunicación" (genérico)
  ❌ Costo: $900 billones anuales en reemplazos

AHORA (FocalizaHR):
  ✅ "Sistema de Inteligencia Predictiva Organizacional"
  ✅ Monitoreo de signos vitales en tiempo real
  ✅ Minutos → Caso de negocio ejecutable
  ✅ "Intervenir Onboarding en Ventas" (quirúrgico)
  ✅ ROI: Automatiza $50K-200K consultoría anual
```

### Metáfora Core: Medicina Organizacional

```
MEDICINA TRADICIONAL          FOCALIZAHR
───────────────────           ──────────────
Temperatura corporal    →     Participación encuestas
Presión arterial        →     Score clima/ambiente
Pulso cardíaco          →     Alertas onboarding/exit
Análisis de sangre      →     Métricas departamentales
Historia clínica        →     Histórico 11 dimensiones
Pronóstico              →     Predicción 60-90 días
Receta médica           →     Plan de acción con ROI

RESULTADO:
"De autopsias organizacionales a signos vitales predictivos"
```

### 9 Principios Filosóficos

```yaml
1. LA CONFIDENCIALIDAD ES SAGRADA
   "La verdad solo emerge en ambientes seguros"

2. LOS DATOS SIN ACCIÓN SON CEMENTERIOS
   "Cada insight debe traducirse en acción concreta"

3. LA CIENCIA SUPERA LA INTUICIÓN
   "Decisiones basadas en evidencia, no en corazonadas"

4. EL TIEMPO ES EL ENEMIGO
   "Cada día de inacción amplifica el problema"

5. LOS SÍNTOMAS TEMPRANOS SALVAN VIDAS
   "Detectar antes de que sea irreversible"

6. DIAGNÓSTICO QUIRÚRGICO, NO GENÉRICO
   "Intervenciones específicas por departamento y persona"

7. RESPONSABILIDAD CLARA Y MEDIBLE
   "Sin ownership no hay accountability"

8. LA DELEGACIÓN SIN PODER ES MUERTE ORGANIZACIONAL
   "Insights van directo a quien puede actuar"

9. LOS DATOS CRUDOS NO USADOS SON OPORTUNIDADES PERDIDAS
   "Métricas departamentales alimentan inteligencia"
```

---

## 📊 ARQUITECTURA TÉCNICA

### Stack Tecnológico Completo

```yaml
FRONTEND:
  Framework: Next.js 14.2.3 (App Router)
  Language: TypeScript 5.8.3 (strict mode)
  UI Components: 
    - Tailwind CSS 3.4.17
    - shadcn/ui (Enterprise components)
    - FocalizaHR Design System (.fhr-* classes)
  State Management: React Hooks + Custom hooks
  Charts: recharts
  Forms: react-hook-form + zod
  File Processing: xlsx, papaparse

BACKEND:
  Runtime: Node.js + Next.js 14 API Routes
  ORM: Prisma 5.22.0 (Type-safe queries)
  Database: PostgreSQL (Supabase Cloud)
  Authentication: JWT + HttpOnly Cookies
  Email: Resend API
  Validation: Zod (Client + Server)

INFRASTRUCTURE:
  Hosting: Vercel (Production + Preview)
  Database: Supabase (Managed PostgreSQL)
  CDN: Vercel Edge Network
  Cron Jobs: Vercel Cron
```

### Estructura de Directorios Completa

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                    # JWT Authentication
│   │   │   ├── login/              # Login Account legacy
│   │   │   └── user/login/         # Login User multi-tenant
│   │   ├── admin/                   # Módulo Administrador
│   │   │   ├── accounts/           # CRUD cuentas empresas
│   │   │   ├── participants/       # Carga masiva Concierge
│   │   │   ├── structures/         # Estructura organizacional
│   │   │   └── mapping-review/     # Mapeo categorías
│   │   ├── campaigns/              # Gestión campañas
│   │   │   └── [id]/
│   │   │       ├── activate/       # Activación + envío emails
│   │   │       ├── participants/   # Participantes campaña
│   │   │       └── analytics/      # Analytics campaña
│   │   ├── departments/            # Estructura jerárquica
│   │   ├── department-metrics/     # Métricas departamentales
│   │   │   └── upload/             # Carga métricas CSV
│   │   ├── benchmarks/             # Sistema benchmarking
│   │   ├── onboarding/             # Onboarding Journey Intelligence
│   │   │   ├── journeys/           # CRUD journeys
│   │   │   └── alerts/             # Alertas onboarding
│   │   ├── exit/                   # Exit Intelligence
│   │   │   ├── records/            # Exit records
│   │   │   └── alerts/             # Alertas exit
│   │   ├── survey/                 # Respuestas encuestas
│   │   └── cron/                   # Jobs automatizados
│   │       └── send-reminders/     # Motor emails automáticos
│   ├── dashboard/
│   │   ├── admin/                  # Módulo FOCALIZAHR_ADMIN
│   │   ├── campaigns/              # Gestión campañas cliente
│   │   │   └── [id]/
│   │   │       └── monitor/        # Torre de Control
│   │   └── analytics/              # Analytics cliente
│   ├── survey/                     # Encuestas temporales
│   │   └── [token]/                # Encuesta por token único
│   └── onboarding/
│       └── encuesta/               # Encuestas onboarding
│           └── [token]/
├── components/
│   ├── dashboard/                  # Componentes dashboard
│   ├── monitor/                    # Componentes WOW Torre Control
│   │   ├── CockpitHeaderBimodal.tsx
│   │   ├── TopMoversPanel.tsx
│   │   ├── LeadershipFingerprintPanel.tsx
│   │   ├── CampaignRhythmPanel.tsx
│   │   ├── DepartmentPulsePanel.tsx
│   │   ├── AnomalyDetectorPanel.tsx
│   │   ├── EngagementHeatmapCard.tsx
│   │   └── CrossStudyComparatorCard.tsx
│   ├── survey/                     # Renderers encuestas
│   │   ├── UnifiedSurveyComponent.tsx
│   │   ├── RatingScaleRenderer.tsx
│   │   ├── NPSScaleRenderer.tsx
│   │   └── MatrixConditionalRenderer.tsx
│   ├── admin/                      # Componentes admin
│   │   └── ParticipantUploader/    # Sistema carga participantes
│   └── ui/                         # shadcn/ui + custom
├── hooks/
│   ├── useCampaignMonitor.ts      # Hook central Torre Control (~1,250 líneas)
│   ├── useSurveyEngine.ts         # Motor encuestas
│   └── useAuth.ts                  # Autenticación
├── lib/
│   ├── services/
│   │   ├── AuthorizationService.ts     # RBAC + filtrado jerárquico
│   │   ├── DepartmentAdapter.ts        # Categorización departamentos
│   │   ├── OnboardingAlertService.ts   # Alertas onboarding
│   │   ├── ExitAlertService.ts         # Alertas exit
│   │   ├── BenchmarkService.ts         # Sistema benchmarks
│   │   └── EmailAutomationService.ts   # Automatización emails
│   ├── engines/
│   │   ├── OnboardingIntelligenceEngine.ts
│   │   ├── RetentionEngine.ts
│   │   └── PulseEngine.ts
│   ├── templates/
│   │   └── email-templates.ts      # Templates email premium
│   ├── utils/
│   │   ├── monitor-utils.ts        # Utilidades Torre Control
│   │   └── responseNormalizer.ts   # Normalización respuestas
│   ├── prisma.ts                   # Cliente Prisma singleton
│   └── auth.ts                     # Utilidades JWT
├── styles/
│   ├── globals.css                 # Variables base + Tailwind
│   └── focalizahr-unified.css      # Design System completo
├── types/
│   └── index.ts                    # Interfaces TypeScript
└── middleware.ts                   # RBAC + Auth global
```

---

## 🏗️ ARQUITECTURA DE 4 CAPAS DE INTELIGENCIA

### Modelo de Procesamiento Multi-Capa

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA C - INTELIGENCIA PREDICTIVA (Acción)                              │
│  ────────────────────────────────────────                               │
│  • Clasificación en zonas de riesgo (ISD)                               │
│  • Correlación VOZ + DATOS duros                                        │
│  • Predicciones con horizontes 30-60-90 días                            │
│  • Casos de negocio con ROI automatizados                               │
│  • Kit Comunicación v3.0 (110+ templates)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                 ▲
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA B - ANÁLISIS DIMENSIONAL (Integración)                            │
│  ────────────────────────────────────────────                           │
│  • Unificación en 11 dimensiones universales                            │
│  • Análisis cross-estudio y temporal                                    │
│  • Benchmarking entre departamentos e industria                         │
│  • Métricas Departamentales (rotación, ausentismo, denuncias)           │
└─────────────────────────────────────────────────────────────────────────┘
                                 ▲
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA A - ANÁLISIS POST-CIERRE (Procesamiento)                          │
│  ─────────────────────────────────────────────                          │
│  • Se activa al cerrar cada estudio temporal                            │
│  • Ejecuta Algoritmos Tipo 2 (correlaciones)                            │
│  • Genera reflexiones y planes departamentales                          │
│  • Torre de Control + Kit Comunicación                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                 ▲
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA 0 - PRODUCTOS AUTÓNOMOS (Sensorial)                               │
│  ──────────────────────────────────────────                             │
│  • Captura datos específicos del dominio                                │
│  • Cada producto independiente y vendible                               │
│  • Genera alertas inmediatas individuales                               │
│  • Motores especializados por tipo de estudio                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estado Actual por Capa

```yaml
CAPA 0 - PRODUCTOS: ≈95% operativa
  ✅ 5 productos funcionando (Pulso, Experiencia, Retención, Ambiente Sano, Onboarding)
  ✅ Motores básicos operativos
  ⏳ Culture Scope (definido, pendiente implementación)

CAPA A - ANÁLISIS POST-CIERRE: ≈70%
  ✅ Torre de Control v6.0+
  ✅ Kit Comunicación v2.5
  ✅ RetentionEngine implementado
  ⏳ PulseEngine, ExperienceEngine (planificados)

CAPA B - DATOS DEPARTAMENTALES: ≈60%
  ✅ Métricas básicas operativas
  ✅ 11 dimensiones mapeadas
  ⏳ Agregación automática cross-estudio
  ⏳ Benchmarking completo

CAPA C - INTELIGENCIA PREDICTIVA: ≈30%
  ✅ Zonas de riesgo conceptualizadas
  ✅ EXO y EIS definidos
  ⏳ ISD cálculo automático (prioridad)
  ⏳ Correlación VOZ + DATOS completa
  ⏳ Predicción 60-90 días
```

---

## 📦 SUITE DE PRODUCTOS

### Matriz de Productos

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SUITE FOCALIZAHR ENTERPRISE                               │
├──────────────────────┬───────────┬─────────────┬─────────────┬─────────────────────┤
│  Producto            │ Tipo      │ Frecuencia  │ KPI         │ Propósito           │
├──────────────────────┼───────────┼─────────────┼─────────────┼─────────────────────┤
│  Pulso Express       │ Temporal  │ Trimestral  │ Score Clima │ Termómetro rápido   │
│  Experiencia Full    │ Temporal  │ Anual       │ eNPS+11 Dim │ Radiografía 360°    │
│  Retención Predictiva│ Temporal  │ Semestral   │ Flight Risk │ Predecir fuga       │
│  Ambiente Sano       │ Temporal  │ Semestral   │ Safety Score│ Compliance + Prev.  │
│  Culture Scope       │ Temporal  │ 1-2x/año    │ ICC (0-100) │ Coherencia cultural │
│  Onboarding Journey  │ Permanente│ 90 días/pers│ EXO (0-100) │ Retención temprana  │
│  Exit Intelligence   │ Permanente│ Por salida  │ EIS (0-100) │ Aprendizaje sistém. │
└──────────────────────┴───────────┴─────────────┴─────────────┴─────────────────────┘
```

### ISD (Índice de Salud Departamental) - Credit Score Organizacional

```yaml
COMPOSICIÓN:
  ├─ Síntomas Tempranos (35%): Participación + Alertas Onboarding + EXO
  ├─ Síntomas Activos (30%): Clima + Safety + ICC
  └─ Síntomas Crónicos (35%): Rotación + Ausentismo + EIS + Denuncias

ZONAS:
  🟢 Verde (90-100): Departamento Inmune
  🟡 Amarilla (70-89): Observación
  🟠 Naranja (30-69): Tratamiento
  🔴 Roja (0-29): Crisis
```

### 11 Dimensiones Universales

```yaml
DIMENSIONES MAPEADAS:
  1. LIDERAZGO     - Capacidad del líder directo
  2. COMUNICACIÓN  - Flujo de información
  3. DESARROLLO    - Oportunidades crecimiento
  4. RECONOCIMIENTO- Valoración del trabajo
  5. CULTURA       - Alineación valores
  6. RECURSOS      - Herramientas y soporte
  7. AUTONOMÍA     - Empoderamiento
  8. CRECIMIENTO   - Oportunidades futuras
  9. AMBIENTE      - Clima interpersonal
  10. BIENESTAR    - Equilibrio vida-trabajo
  11. TRATO        - Respeto, dignidad, seguridad (Meta-dimensión Ley Karin)
```

---

## 🔐 SISTEMA RBAC Y SEGURIDAD

### Arquitectura de Seguridad Multi-Capa

```yaml
NIVEL 1 - MULTI-TENANT:
  Principio: "Empresa A NUNCA ve datos de Empresa B"
  Filtro: accountId obligatorio en TODAS las queries
  Implementación: AuthorizationService + Middleware

NIVEL 2 - JERÁRQUICO:
  Principio: "AREA_MANAGER ve solo su gerencia + hijos"
  Filtro: departmentId + CTE recursivo PostgreSQL
  Cache: LRU 15 minutos TTL

NIVEL 3 - PLAN B (Participación vs Resultados):
  Participación: Transparente (fomenta competencia sana)
  Resultados: Privado (protege información sensible)
```

### Matriz de Roles

```typescript
type UserRole = 
  // SISTEMA
  | 'FOCALIZAHR_ADMIN'   // Acceso total sistema, todas las cuentas
  
  // EMPRESA - ACCESO GLOBAL
  | 'ACCOUNT_OWNER'      // Dueño cuenta - todo en su empresa
  | 'ACCOUNT_ADMIN'      // Admin operacional - gestiona usuarios
  | 'CEO'                // Ejecutivo - solo lectura, ve toda empresa
  | 'HR_ADMIN'           // RRHH principal - gestiona campañas
  | 'HR_OPERATOR'        // RRHH operacional - ejecuta campañas
  
  // EMPRESA - ACCESO LIMITADO
  | 'AREA_MANAGER'       // Gerente área - ve solo su scope jerárquico
  | 'VIEWER'             // Solo lectura limitada
  
  // LEGACY
  | 'CLIENT';            // Account legacy (compatibilidad)
```

### Matriz de Acceso por Rol

| Rol | Scope | Multi-Tenant | Filtro Jerárquico | Permisos |
|-----|-------|--------------|-------------------|----------|
| `FOCALIZAHR_ADMIN` | Todas las cuentas | N/A | ❌ No | CRUD total |
| `ACCOUNT_OWNER` | Su cuenta | ✅ Sí | ❌ No | CRUD total |
| `CEO` | Su cuenta | ✅ Sí | ❌ No | Solo lectura |
| `HR_ADMIN` | Su cuenta | ✅ Sí | ❌ No | CRUD campañas |
| `HR_OPERATOR` | Su cuenta | ✅ Sí | ❌ No | CRU campañas |
| `AREA_MANAGER` | Su departamento | ✅ Sí | ✅ **SÍ** | Solo lectura filtrada |
| `VIEWER` | Su cuenta | ✅ Sí | ❌ No | Solo lectura pública |

### Patrón de Implementación APIs

```typescript
// ✅ PATRÓN CORRECTO PARA CUALQUIER API
import { 
  extractUserContext, 
  buildParticipantAccessFilter 
} from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  // 1. Extraer contexto (viene del middleware)
  const userContext = extractUserContext(request);
  
  // 2. Validar autenticación
  if (!userContext.accountId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // 3. Construir filtros de seguridad
  const accessFilter = await buildParticipantAccessFilter(
    userContext,
    { dataType: 'results' }  // 'participation' | 'results' | 'administrative'
  );
  
  // 4. Aplicar filtros en query
  const data = await prisma.model.findMany({
    where: {
      ...accessFilter,
      // tus filtros adicionales
    }
  });
  
  return NextResponse.json({ success: true, data });
}
```

### Headers Inyectados por Middleware

| Header | Contenido | Siempre Presente |
|--------|-----------|------------------|
| `x-user-id` | ID del usuario | Si es User |
| `x-account-id` | ID de la cuenta/empresa | ✅ Siempre |
| `x-user-role` | Rol del usuario | ✅ Siempre |
| `x-department-id` | ID departamento asignado | Solo AREA_MANAGER |
| `x-user-email` | Email del usuario | ✅ Siempre |
| `x-company-name` | Nombre de la empresa | ✅ Siempre |

---

## 🎨 DESIGN SYSTEM

### Paleta de Colores Corporativa

```css
:root {
  /* PRINCIPALES */
  --focalizahr-cyan: #22D3EE;
  --focalizahr-purple: #A78BFA;
  --focalizahr-blue: #3B82F6;
  
  /* GRADIENTES */
  --focalizahr-gradient: linear-gradient(135deg, #22D3EE, #A78BFA);
  --focalizahr-gradient-text: linear-gradient(135deg, #22D3EE, #3B82F6, #A78BFA);
  
  /* ESTADOS */
  --focalizahr-success: #10B981;
  --focalizahr-warning: #F59E0B;
  --focalizahr-error: #EF4444;
  
  /* FONDOS */
  --fhr-bg-primary: #0F172A;
  --fhr-bg-secondary: #1E293B;
  --fhr-bg-elevated: rgba(30, 41, 59, 0.9);
  
  /* TEXTO */
  --fhr-text-primary: #E2E8F0;
  --fhr-text-secondary: #94A3B8;
  --fhr-text-muted: #64748B;
}
```

### Clases CSS Corporativas - Catálogo Completo

```css
/* ═══════════════════════════════════════════════════════════════════════
   SIEMPRE usar estas clases, NO crear nuevas sin consultar
   ═══════════════════════════════════════════════════════════════════════ */

/* FONDOS */
.fhr-bg-main           /* Fondo principal con gradiente oscuro */
.fhr-bg-pattern        /* Overlay pattern sutil */

/* CARDS */
.fhr-card              /* Card glassmorphism estándar */
.fhr-card-metric       /* Card para métricas dashboard */
.fhr-card-metric-success /* Variante borde verde */
.fhr-card-metric-warning /* Variante borde amarillo */
.fhr-card-metric-error   /* Variante borde rojo */
.fhr-card-glass        /* Glassmorphism intenso */
.fhr-card-question     /* Card para preguntas survey */

/* TÍTULOS */
.fhr-title-gradient    /* Títulos con gradiente cyan-purple */
.fhr-title-section     /* Títulos de sección */
.fhr-title-card        /* Títulos dentro de cards */
.fhr-hero-title        /* Título hero (light/extralight) */

/* TEXTO */
.fhr-text              /* Texto estándar */
.fhr-text-sm           /* Texto pequeño */
.fhr-subtitle          /* Subtítulos */
.fhr-text-accent       /* Texto con acento cyan */

/* BOTONES (SIEMPRE usar .fhr-btn como base) */
.fhr-btn               /* Base botón - SIEMPRE requerido */
.fhr-btn-primary       /* Botón gradiente cyan-purple principal */
.fhr-btn-secondary     /* Botón outline cyan */
.fhr-btn-ghost         /* Botón transparente + border */
.fhr-btn-danger        /* Botón rojo para acciones destructivas */

/* BADGES (SIEMPRE usar .fhr-badge como base) */
.fhr-badge             /* Base badge - SIEMPRE requerido */
.fhr-badge-success     /* Verde - completado, éxito */
.fhr-badge-active      /* Cyan - en progreso, activo */
.fhr-badge-warning     /* Amarillo - pendiente, alerta */
.fhr-badge-error       /* Rojo - error, fallido */
.fhr-badge-draft       /* Gris - borrador */
.fhr-badge-premium     /* Purple - premium, especial */
.fhr-badge-confidential /* Especial con punto pulsante */

/* INPUTS */
.fhr-input             /* Inputs estilizados */

/* DECORATIVOS */
.fhr-divider           /* Línea decorativa ── • ── */
.fhr-top-line          /* Línea de luz Tesla */
.fhr-hero              /* Contenedor hero */
```

### Patrón de Migración

```tsx
// ❌ ANTES (Tailwind inline extenso):
<div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 
               rounded-2xl p-6 hover:border-cyan-500/30 transition-all">
  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 
                 via-blue-400 to-purple-400 bg-clip-text text-transparent">
    Título
  </h2>
</div>

// ✅ DESPUÉS (Design System):
<div className="fhr-card">
  <h2 className="fhr-title-section">
    <span className="fhr-title-gradient">Título</span>
  </h2>
</div>
```

---

## 🏗️ TORRE DE CONTROL v7.0

### Arquitectura Hook Central

```
┌─────────────────────────────────────────────────────────────────────┐
│                      page.tsx (Monitor)                              │
│                           ↓                                          │
│               useCampaignMonitor (~1,250 líneas)                    │
│                      "Chef Ejecutivo"                                │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│    │ Analytics│ │Participan│ │Historical│ │ Details  │            │
│    │  (API A) │ │ (API B)  │ │ (API C)  │ │ (API D)  │            │
│    └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘            │
│          └─────────────┴───────────┴────────────┘                  │
│                           ↓                                          │
│                  SINGLE useMemo MASIVO                               │
│               (Toda la lógica inline)                                │
│                           ↓                                          │
│                  CampaignMonitorData                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            ↓
            Distribución a todos los componentes
                       {...monitorData}
```

### Componentes WOW Implementados

```yaml
✅ COMPONENTES WOW FUNCIONANDO:
├── CockpitHeaderBimodal.tsx      # Header bimodal Predictivo/Dinámico (tipo Tesla)
├── LeadershipFingerprintPanel.tsx # Análisis liderazgo sin preguntarlo
├── CampaignRhythmPanel.tsx       # Timeline pasado→presente→futuro
├── TopMoversPanel.tsx             # Momentum departamental ÚNICO en mercado
├── DepartmentPulsePanel.tsx      # Semáforo departamental
├── AnomalyDetectorPanel.tsx      # Detección Z-Score outliers
├── EngagementHeatmapCard.tsx     # Mapa calor engagement
└── CrossStudyComparatorCard.tsx  # Comparación histórica benchmarks

📁 UBICACIÓN: src/components/monitor/
```

### Tuberías de Datos

```yaml
🔵 TUBERÍA A - ANALÍTICA:
  Endpoint: /api/campaigns/${id}/analytics
  Datos: Scores, tendencias, insights
  Consumidores: Header, MetricsGrid, DailyChart

🟢 TUBERÍA B - PARTICIPACIÓN:
  Endpoint: /api/campaigns/${id}/participants?include_details=true
  Datos: Conteos, timestamps, estados
  Consumidores: DepartmentParticipation, ActivityFeed, AlertsPanel

🟡 TUBERÍA C - HISTÓRICOS:
  Endpoint: /api/campaigns/historical
  Datos: Agregaciones, benchmarking
  Consumidores: CrossStudyComparatorCard

🔶 TUBERÍA D - INTELIGENCIA:
  Fuente: monitor-utils.ts + cálculos inline
  Datos: Predicciones, anomalías, momentum, heatmaps
  Consumidores: Componentes WOW
```

---

## 📧 SISTEMA DE EMAILS

### Arquitectura Unificada

```yaml
FUENTE ÚNICA DE VERDAD:
  Archivo: src/lib/templates/email-templates.ts
  Templates: 4 premium (Retención, Pulso, Experiencia, General)
  Función: renderEmailTemplate(slug, variables)

ACTIVACIÓN CAMPAÑAS:
  Archivo: src/app/api/campaigns/[id]/activate/route.ts
  Acciones:
    - Genera tokens únicos participantes
    - Envía emails masivos via Resend
    - Guarda EmailLog para tracking
    - Rate limiting: 600ms entre emails

AUTOMATIZACIÓN:
  Archivo: src/app/api/cron/send-reminders/route.ts
  Trigger: Vercel Cron (diario 9am)
  Acciones:
    - Reminder1: 3 días sin respuesta
    - Reminder2: 7 días sin respuesta
    - Onboarding: Emails programados por stage
```

---

## 🗄️ MODELOS PRISMA CORE

### Modelos Principales

```prisma
model Account {
  id                          String   @id @default(cuid())
  adminEmail                  String   @unique
  adminName                   String
  companyName                 String
  companyLogo                 String?
  role                        Role     @default(ACCOUNT_OWNER)
  status                      AccountStatus @default(ACTIVE)
  subscriptionTier            String   @default("free")
  industry                    String?
  companySize                 String?
  maxActiveCampaigns          Int      @default(3)
  maxParticipantsPerCampaign  Int      @default(500)
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  
  campaigns                   Campaign[]
  participants                Participant[]
  departments                 Department[]
  users                       User[]
}

model User {
  id             String   @id @default(cuid())
  accountId      String
  email          String   @unique
  name           String
  role           Role
  departmentId   String?  // Para AREA_MANAGER
  isActive       Boolean  @default(true)
  
  account        Account     @relation(fields: [accountId])
  department     Department? @relation(fields: [departmentId])
}

model Department {
  id               String   @id @default(cuid())
  accountId        String
  displayName      String        // Nombre visible cliente
  standardCategory String        // 8 categorías estratégicas
  level            Int      @default(3)  // 1=Holding, 2=Gerencia, 3=Depto
  unitType         String   @default("department")
  parentId         String?       // Para jerarquía
  isActive         Boolean  @default(true)
  
  account          Account      @relation(fields: [accountId])
  parent           Department?  @relation("DepartmentHierarchy", fields: [parentId])
  children         Department[] @relation("DepartmentHierarchy")
  participants     Participant[]
}

model Campaign {
  id             String         @id @default(cuid())
  accountId      String
  campaignTypeId String
  name           String
  startDate      DateTime
  endDate        DateTime
  status         CampaignStatus
  totalInvited   Int            @default(0)
  createdAt      DateTime       @default(now())
  
  account        Account        @relation(fields: [accountId])
  campaignType   CampaignType   @relation(fields: [campaignTypeId])
  participants   Participant[]  @relation("CampaignParticipants")
}

model Participant {
  id           String   @id @default(cuid())
  accountId    String
  fullName     String
  email        String?       // NULLABLE - puede ser solo WhatsApp
  rut          String        // OBLIGATORIO - identificador único Chile
  phoneNumber  String?       // NULLABLE - WhatsApp
  departmentId String?
  uniqueToken  String?  @unique
  hasResponded Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  account      Account     @relation(fields: [accountId])
  department   Department? @relation(fields: [departmentId])
  campaigns    Campaign[]  @relation("CampaignParticipants")
}
```

### 8 Categorías Estratégicas (DepartmentAdapter)

```typescript
// src/lib/services/DepartmentAdapter.ts
const STANDARD_CATEGORIES = [
  'personas',     // Gerencia de Personas / RRHH
  'comercial',    // Gerencia Comercial / Ventas
  'marketing',    // Gerencia de Marketing
  'tecnologia',   // Gerencia de Tecnología / TI
  'operaciones',  // Gerencia de Operaciones / Producción
  'finanzas',     // Gerencia de Finanzas / Contabilidad
  'servicio',     // Gerencia de Servicio al Cliente
  'legal'         // Gerencia Legal y Compliance
];
```

---

## 🧪 COMANDOS Y TESTING

### Comandos Principales

```bash
# Desarrollo
npm run dev              # Dev server localhost:3000

# Base de datos
npx prisma studio        # UI visual BD
npx prisma migrate dev   # Migrar schema
npx prisma generate      # Regenerar cliente
npx prisma validate      # Validar schema
npx prisma format        # Formatear schema

# Build y Types
npm run build            # Compilar producción
npx tsc --noEmit         # Verificar tipos TypeScript
npm run lint             # Linter

# API Testing
# Usar Thunder Client o Postman con JWT en header Authorization
```

### Checklist Pre-Deploy

```markdown
□ npm run build pasa sin errores
□ npx tsc --noEmit pasa sin errores
□ npx prisma validate pasa
□ Variables de entorno configuradas en Vercel
□ APIs críticas probadas:
  - POST /api/auth/login
  - GET /api/campaigns
  - GET /api/campaigns/[id]/analytics
□ RBAC verificado por rol
□ Emails funcionando (Resend API key activa)
```

---

## ⚠️ REGLAS CRÍTICAS DE DESARROLLO

### Principios del CEO

```yaml
"NO SE CAMBIA LO QUE NO SE ENTIENDE":
  - Investigar ANTES de modificar
  - Leer documentación y código existente
  - Entender el POR QUÉ antes del CÓMO

"ENTERPRISE-GRADE, NO MVP":
  - Arquitectura robusta y escalable
  - Sin atajos ni parches temporales
  - Código production-ready

"PROJECT KNOWLEDGE = FUENTE DE VERDAD":
  - Verificar SIEMPRE en documentación
  - No asumir nombres de campos
  - Consultar Prisma Studio ante dudas

"CAMBIOS QUIRÚRGICOS, NO REWRITES":
  - Modificar SOLO lo necesario
  - Preservar funcionalidad existente
  - Un cambio pequeño es mejor que uno grande

"INTELIGENCIA PARA DIRECCIÓN, NO MIDDLE MANAGEMENT":
  - Insights van directo a quien decide
  - Bypasear capas que no agregan valor
  - ROI cuantificable siempre
```

### Lo que NUNCA Hacer

```yaml
❌ PROHIBIDO:
  - Recrear componentes que funcionan
  - Cambios masivos sin verificar impacto
  - Quick fixes o parches temporales
  - Ignorar validaciones de tipos TypeScript
  - Crear nuevas clases CSS (usar .fhr-*)
  - Asumir nombres de campos sin verificar en Prisma
  - Modificar middleware.ts sin entender RBAC completo
  - Borrar código "que parece no usarse"
  - Cambiar arquitectura de Torre Control sin plan
  - Hardcodear valores (usar env vars)
```

### Lo que SIEMPRE Hacer

```yaml
✅ OBLIGATORIO:
  - Verificar campos en Prisma Studio antes de codificar
  - Mantener arquitectura y patrones existentes
  - Preservar funcionalidad actual al modificar
  - Consultar documentación técnica relevante
  - Usar tipos TypeScript estrictos
  - Manejar errores con try/catch
  - Aplicar filtros RBAC en TODAS las APIs
  - Probar con diferentes roles (ADMIN, OWNER, AREA_MANAGER)
  - Commits descriptivos y frecuentes
  - Documentar cambios significativos
```

### Workflow de Cambios

```bash
# 1. INVESTIGAR antes de cambiar
npx prisma studio                    # Ver estructura BD real
grep -r "nombre_campo" src/          # Buscar referencias
cat prisma/schema.prisma | head -100 # Ver modelos

# 2. Cambio QUIRÚRGICO (solo lo necesario)

# 3. Verificar compilación
npm run build

# 4. Test manual
npm run dev
# Probar en navegador con diferentes roles

# 5. Commit descriptivo
git commit -m "feat|fix|refactor: descripción específica del cambio"
```

---

## 📚 DOCUMENTACIÓN TÉCNICA DISPONIBLE

### Documentos Clave en Project Knowledge

```yaml
ARQUITECTURA:
  - "Torre de Control - Arquitectura Maestra v6.0 (Actualizada).md"
  - "Sistema de Inteligencia Organizacional FocalizaHR - Documento Maestro v5.0.md"
  - "GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_0.md"
  - "INVESTIGACION_COMPLETA_FOCALIZAHR_v2.md"

PRODUCTOS:
  - "FICHAS_MAESTRAS_PRODUCTOS_FOCALIZAHR.md"
  - "BACKEND_ONBOARDING_JOURNEY_INTELLIGENCE_v6_0_COMPLETO.md"
  - "PLAN_MAESTRO_EXIT_INTELLIGENCE_V2_ENTERPRISE.md"
  - "Culture_Scope_Ficha_Maestra_v2.md"

IMPLEMENTACIÓN:
  - "Documentación_Sistema_ParticipantUploader_v3.0_DEFINITIVA.md"
  - "DOCUMENTACION_SISTEMA_EMAILS_FOCALIZAHR_v5_FINAL.md"
  - "FocalizaHR_-_Documentación_Sistema_Encuestas_v2_1_FINAL.md"
  - "BENCHMARK_SYSTEM_v2_0_DOCUMENTACION_CONSOLIDADA.md"

ESTILOS:
  - "GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md"
  - "FocalizaHR_Premium_Buttons_Guide.md"
  - "FILOSOFIA_DISENO_FOCALIZAHR_v1.md"
```

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

```yaml
PROGRESO: 97% completado (15+ meses desarrollo)
FASE: Cierre técnico + corrección deuda técnica
CLIENTES: Reales, esperando launch

PENDIENTES CRÍTICOS:
  - Compilación TypeScript 100% limpia
  - Frontend jerárquico AREA_MANAGER completo
  - Documentación consolidada final
  - Tests automatizados críticos

DEUDA TÉCNICA RECONOCIDA:
  - Hook useCampaignMonitor monolítico (~1,250 líneas)
  - Lógica inline en useMemo gigante
  - Oportunidad: Refactorizar en servicios especializados
```

---

## 💡 TIPS PARA CLAUDE CODE

### Comandos Útiles Durante Desarrollo

```bash
# Ver estructura BD real
npx prisma studio

# Buscar en código
grep -r "término" src/
grep -r "nombreCampo" src/ --include="*.ts"

# Ver modelos Prisma
cat prisma/schema.prisma | grep "model NombreModelo" -A 30

# Ver APIs disponibles
ls -la src/app/api/
find src/app/api -name "route.ts" | head -20

# Ver componentes dashboard
ls -la src/components/dashboard/
ls -la src/components/monitor/

# Ver hooks disponibles
ls -la src/hooks/

# Ver servicios
ls -la src/lib/services/
```

### Patrón de Investigación

```bash
# Antes de modificar CUALQUIER cosa:
# 1. Entender estructura
cat src/path/to/file.ts | head -50

# 2. Buscar dependencias
grep -r "nombreFuncion" src/

# 3. Verificar tipos
cat src/types/index.ts | grep "interface NombreInterface" -A 20

# 4. Ver documentación relacionada en Project Knowledge
# (usar project_knowledge_search)
```

---

## 🏆 DIFERENCIADORES COMPETITIVOS ÚNICOS

```yaml
1. MOMENTUM DEPARTAMENTAL TEMPORAL:
   - TopMoversPanel - Único en mercado
   - Detección patrones en tiempo real
   
2. HEADER BIMODAL PREDICTIVO/DINÁMICO:
   - UX tipo Tesla con toggle fluido
   - Vista futuro vs presente

3. LEADERSHIP FINGERPRINT:
   - Diagnóstico liderazgo sin preguntarlo
   - Inferencia de patrones demográficos

4. ISD (ÍNDICE SALUD DEPARTAMENTAL):
   - Credit score organizacional
   - Único en mercado PyME LATAM

5. KIT COMUNICACIÓN v3.0:
   - 110+ templates inteligentes
   - Casos de negocio automáticos con ROI

6. ARQUITECTURA 4 CAPAS:
   - De sensorial a predictivo
   - Correlación VOZ + DATOS duros

7. MODELO CONCIERGE PREMIUM:
   - Tecnología + servicio experto
   - No autoservicio genérico
```

---

**Versión:** 1.0 Enterprise  
**Autor:** Claude + Victor Yáñez (CEO FocalizaHR)  
**Fecha:** Enero 2025  
**Estado:** Production Ready  

> *"De autopsias organizacionales a signos vitales predictivos"*
