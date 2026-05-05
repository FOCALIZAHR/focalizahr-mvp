# FocalizaHR — Claude Code Reference

> Sistema de Inteligencia Predictiva Organizacional Enterprise.
> Plataforma B2B SaaS multi-tenant · RBAC 8 roles · Chile/LATAM
> Enterprise del día uno. No hay versión beta de decisiones sobre personas.

Ver @prisma/schema.prisma para modelos y campos exactos.
Ver @src/lib/services/AuthorizationService.ts para patrones RBAC.
Ver @package.json para scripts disponibles.

---

## Comandos y Entorno

```bash
npm run dev && npm run build   # dev / build (build DEBE pasar antes de terminar)
npx tsc --noEmit               # verificar TypeScript
npx prisma studio              # explorar BD real
npx prisma db push             # SOLO desarrollo — nunca producción
```

Variables requeridas: `DATABASE_URL · NEXTAUTH_SECRET · RESEND_API_KEY · NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Stack

```yaml
Frontend: Next.js 14 App Router · TypeScript strict · Tailwind + .fhr-* · shadcn/ui
Backend:  Prisma 5 · PostgreSQL Supabase · JWT HttpOnly Cookies
Infra:    Vercel · Resend (email) · Vercel Cron
```

---

## Estructura Principal

```
src/app/api/           → endpoints REST por dominio
src/app/dashboard/     → páginas cliente autenticadas
src/components/        → componentes React reutilizables
  /monitor/            → componentes Torre de Control
  /ui/                 → design system + shadcn
src/lib/services/      → servicios de negocio
src/lib/engines/       → motores analíticos
src/hooks/             → hooks custom
src/types/             → interfaces TypeScript compartidas
prisma/schema.prisma   → fuente de verdad BD
```

---

## Reglas Enterprise — Absolutas

Reglas detalladas en `.claude/rules/`. Resumen ejecutivo:

1. **Schema-first.** Sin campo nuevo sin plan escrito. → `prisma-rules.md`
2. **Multi-tenant.** Toda query lleva `accountId`. Sin excepción.
3. **Reutilizar antes de crear.** Grep antes de crear cualquier cosa.
4. **RBAC en cada endpoint.** → `api-security.md`
5. **Estilos `.fhr-*` son ley.** Sin CSS inline. → `frontend-design.md`
6. **TypeScript strict.** Sin `any`. Build limpio antes de terminar.
7. **Cero hardcode.** Variables nombradas o env vars. Nunca literales.
8. **No tocar sin entender.** Leer + grep antes de modificar.

---

## Skills — OBLIGATORIO Leer Antes de Implementar

Si el contexto aplica → cargar la skill ANTES de escribir código.
`focalizahr-design` reemplaza completamente `frontend-design` genérico.

| Skill | Cuándo es OBLIGATORIO |
|-------|----------------------|
| `focalizahr-design` | TODO componente, página, card, modal, botón, dashboard |
| `focalizahr-api` | TODO route.ts, endpoint, RBAC, filtrado jerárquico |
| `focalizahr-narrativas` | Escribir o auditar textos ejecutivos de cualquier módulo |
| `focalizahr-benchmark` | Benchmark, percentil, InsightEngine, MarketBenchmark |
| `focalizahr-notificaciones` | Toast, feedback, error UI — nunca shadcn `use-toast` |

---

## Convenciones de Nombres

```typescript
// Modelos — verificar schema para campos exactos antes de usar
Account:     adminEmail · adminName · companyName · status
Employee:    fullName · email · departmentId · standardJobLevel
Department:  displayName · standardCategory · parentId · unitType
Campaign:    campaignTypeId · startDate · endDate · status

// Roles RBAC (8 niveles)
FOCALIZAHR_ADMIN · ACCOUNT_OWNER · HR_ADMIN · HR_MANAGER
HR_OPERATOR · CEO · AREA_MANAGER · EVALUATOR
```

---

## API Response Shape — Siempre Este Formato

```typescript
// Éxito
return NextResponse.json({ success: true, data, pagination? })

// Error
return NextResponse.json({ success: false, error: 'mensaje' }, { status: 4xx })

// Nunca exponer stack traces al cliente
// Nunca console.log en producción — usar try/catch con error silencioso
```

---

## Servicios Disponibles — Reutilizar Siempre

```
AuthorizationService.ts    → RBAC + filtrado jerárquico (SIEMPRE usar)
BenchmarkService.ts        → benchmarks mercado
EmailAutomationService.ts  → emails automáticos
DepartmentAdapter.ts       → categorización departamentos
OnboardingAlertService.ts  → alertas onboarding
ExitAlertService.ts        → alertas exit
RetentionEngine.ts         → predicción fuga
PulseEngine.ts             → análisis momentum
responseNormalizer.ts      → normalización respuestas encuestas
```

## Componentes y Hooks Clave — Verificar Antes de Crear

```
// Torre de Control — src/components/monitor/
CockpitHeaderBimodal.tsx · TopMoversPanel.tsx
LeadershipFingerprintPanel.tsx · CampaignRhythmPanel.tsx
DepartmentPulsePanel.tsx · AnomalyDetectorPanel.tsx
EngagementHeatmapCard.tsx · CrossStudyComparatorCard.tsx

// Encuestas — src/components/survey/
UnifiedSurveyComponent.tsx · RatingScaleRenderer.tsx
NPSScaleRenderer.tsx · MatrixConditionalRenderer.tsx

// Hooks — src/hooks/
useCampaignMonitor.ts   → hook central Torre de Control (~1,250 líneas)
                          LEER antes de agregar lógica de monitor
useSurveyEngine.ts      → motor encuestas
useAuth.ts              → autenticación

// CSS — src/styles/
focalizahr-unified.css  → Design System completo (.fhr-* viven aquí)
globals.css             → variables base + Tailwind

// Global
middleware.ts           → RBAC + Auth global — NO modificar sin plan
```

---

## Gotchas + Commits

```typescript
// ❌ userContext.email NO existe → ✅ request.headers.get('x-user-email')
// ❌ shadcn use-toast → ✅ '@/components/ui/toast-system'
// ❌ roles hardcodeados → ✅ GLOBAL_ACCESS_ROLES del AuthorizationService
// ❌ prisma db push en producción → ✅ prisma migrate deploy
// ❌ style={{background}} inline → ✅ clases .fhr-* siempre
// ❌ modificar middleware.ts sin plan → afecta RBAC global

// Commits: "feat|fix|refactor|chore: descripción específica"
// Branches: feat/nombre · fix/nombre · refactor/nombre
```

---

## Workflow en Tareas Complejas

1. **Explorar primero** — leer archivos relevantes, grep dependencias
2. **Planificar** — listar archivos a modificar antes de tocar código
3. **Implementar** — cambios quirúrgicos, un archivo a la vez
4. **Verificar** — `npm run build` + `npx tsc --noEmit` antes de terminar
5. **Commit** — mensaje descriptivo por cada paso completado

Para tareas con 3+ archivos: crear `PROGRESS.md` con checklist y actualizar después de cada paso.

---

## Instrucción de Compactación

Al compactar contexto, preservar siempre:
- Tarea actual en curso y archivos modificados hasta el momento
- Checklist de pasos pendientes si existe PROGRESS.md
- Últimos errores de compilación si la build estaba fallando

---

## Investigar Antes de Modificar

```bash
grep -r "concepto" src/                          # buscar si existe
ls src/components/[área]/                         # ver componentes
find src/app/api -name "route.ts" | head -20      # ver APIs
cat src/types/index.ts | grep "Interface" -A 15   # ver tipos
```

Project Knowledge es la fuente de verdad para arquitectura y decisiones.
Buscar ahí antes de asumir cualquier cosa sobre el proyecto.
