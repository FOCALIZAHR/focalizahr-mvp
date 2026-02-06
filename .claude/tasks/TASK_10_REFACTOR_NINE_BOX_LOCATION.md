# TASK 10: REFACTOR - MOVER 9-BOX A UBICACIÓN CORRECTA

## 🎯 OBJETIVO
Mover sistema 9-Box de `/evaluaciones/` y `/api/admin/` a ubicación arquitectónica correcta.

## 📋 CONTEXTO

```yaml
PROBLEMA:
  9-Box está en /dashboard/evaluaciones/nine-box
  Pero /evaluaciones es portal del EVALUADOR (llenar formularios)
  9-Box es ANÁLISIS de HR → debe estar en /performance

CAMBIO REQUERIDO:
  Página:  /evaluaciones/nine-box  →  /performance/nine-box
  APIs:    /api/admin/...          →  /api/performance/...
```

## ⚠️ IMPORTANTE

```
┌─────────────────────────────────────────────────────────────────┐
│  TODO ESTÁ FUNCIONANDO PERFECTAMENTE.                          │
│  Este es solo un REFACTOR de ubicación.                        │
│  NO modificar lógica, solo mover y actualizar rutas.           │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 PASO 1: MOVER PÁGINA

```bash
# Crear directorio destino si no existe
mkdir -p src/app/dashboard/performance/nine-box

# Mover página
mv src/app/dashboard/evaluaciones/nine-box/page.tsx \
   src/app/dashboard/performance/nine-box/page.tsx

# Si hay otros archivos en la carpeta, moverlos también
# mv src/app/dashboard/evaluaciones/nine-box/* \
#    src/app/dashboard/performance/nine-box/

# Eliminar carpeta vacía
rmdir src/app/dashboard/evaluaciones/nine-box 2>/dev/null || true
```

## 📁 PASO 2: MOVER APIs

```bash
# Crear estructura destino
mkdir -p src/app/api/performance-ratings/[id]/potential
mkdir -p src/app/api/performance-ratings/nine-box

# Mover API de potential
mv src/app/api/admin/performance-ratings/[id]/potential/route.ts \
   src/app/api/performance-ratings/[id]/potential/route.ts

# Mover API de nine-box
mv src/app/api/admin/performance-ratings/nine-box/route.ts \
   src/app/api/performance-ratings/nine-box/route.ts

# Limpiar carpetas vacías en admin
rmdir src/app/api/admin/performance-ratings/[id]/potential 2>/dev/null || true
rmdir src/app/api/admin/performance-ratings/nine-box 2>/dev/null || true
```

## 🔧 PASO 3: ACTUALIZAR FETCH URLs EN COMPONENTES

### 3.1 NineBoxDashboard o page.tsx (donde se hace fetch)

**Buscar y reemplazar:**

```typescript
// ❌ ANTES
fetch('/api/admin/performance-ratings/nine-box?...')

// ✅ DESPUÉS  
fetch('/api/performance-ratings/nine-box?...')
```

### 3.2 NineBoxDrawer.tsx (si hace fetch de potential)

```typescript
// ❌ ANTES
fetch(`/api/admin/performance-ratings/${id}/potential`, ...)

// ✅ DESPUÉS
fetch(`/api/performance-ratings/${id}/potential`, ...)
```

### 3.3 Cualquier otro componente que use estas APIs

**Buscar en todo el proyecto:**

```bash
# Buscar referencias a las rutas antiguas
grep -r "api/admin/performance-ratings" src/
```

**Reemplazar todas las ocurrencias.**

## 🔧 PASO 4: AGREGAR COMENTARIOS TODO EN APIs

### 4.1 En `/api/performance-ratings/[id]/potential/route.ts`

```typescript
// Buscar el array de ALLOWED_ROLES o roles permitidos
// Agregar comentario:

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',  // TODO: Evaluar acceso solo con cycle.shareWithConcierge
  'ACCOUNT_OWNER',
  'CEO',
  'HR_MANAGER',
  'AREA_MANAGER'
]
```

### 4.2 En `/api/performance-ratings/nine-box/route.ts`

```typescript
// Mismo comentario en roles permitidos:

// TODO: FOCALIZAHR_ADMIN debería tener acceso solo si 
// el cliente activa cycle.shareWithConcierge (consentimiento explícito)
```

## ✅ PASO 5: VERIFICACIÓN

```bash
# 1. Verificar que compila
npm run build

# 2. Verificar TypeScript
npx tsc --noEmit

# 3. Verificar que no quedaron referencias antiguas
grep -r "api/admin/performance-ratings" src/
# Debe retornar vacío

grep -r "evaluaciones/nine-box" src/
# Debe retornar vacío (excepto si hay links de navegación que actualizar)

# 4. Test manual
# - Navegar a /dashboard/performance/nine-box
# - Verificar que carga el grid
# - Click en celda → drawer abre
# - Verificar consola sin errores 404
```

## 📋 CHECKLIST FINAL

- [ ] Página movida a `/dashboard/performance/nine-box`
- [ ] API potential movida a `/api/performance-ratings/[id]/potential`
- [ ] API nine-box movida a `/api/performance-ratings/nine-box`
- [ ] Todos los fetch URLs actualizados
- [ ] Comentarios TODO agregados para FOCALIZAHR_ADMIN
- [ ] `npm run build` pasa sin errores
- [ ] `grep` no encuentra referencias antiguas
- [ ] Test manual funciona igual que antes

## 🚨 SI ALGO FALLA

```yaml
Rollback:
  Los archivos originales siguen en git.
  git checkout -- src/app/dashboard/evaluaciones/nine-box
  git checkout -- src/app/api/admin/performance-ratings

Problema común:
  "404 en fetch" → Faltó actualizar alguna URL
  Solución: grep -r "la-url-vieja" src/ y corregir
```

## ⏱️ TIEMPO ESTIMADO
~10 minutos (solo mover y buscar/reemplazar)
