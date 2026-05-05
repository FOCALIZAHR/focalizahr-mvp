# FocalizaHR — Dev Workflow Rules
glob: **/*.ts, **/*.tsx

---

## Antes de Crear Cualquier Cosa

```bash
# Buscar si ya existe
grep -r "ConceptoQueNecesitas" src/components/ src/hooks/ src/lib/
ls src/components/[área-relevante]/
find src/app/api -name "route.ts" | head -20
```

Si existe → extender. Nunca duplicar.

---

## Antes de Modificar Cualquier Cosa

```bash
# Entender qué es el archivo
cat src/path/to/file.ts | head -50

# Buscar dependencias
grep -r "nombreFuncion" src/

# Verificar tipos
cat src/types/index.ts | grep "NombreInterface" -A 20
```

No se toca lo que no se entiende.
Cambios quirúrgicos — solo lo necesario.

---

## Antes de Reportar Como Terminado

```bash
npm run build           # debe pasar sin errores
npx tsc --noEmit        # sin errores TypeScript
```

- Sin `any` en código nuevo
- Sin `console.log` de debug
- Sin valores hardcodeados

---

## Tareas Multi-Paso

Para tareas con más de 3 archivos modificados:
crear `PROGRESS.md` en la raíz del task con:

```markdown
## Tarea: [nombre]
- [x] Paso completado
- [ ] Paso pendiente
```

Actualizar después de cada paso. No reportar terminado hasta que todos los pasos estén marcados.

---

## TypeScript Strict

- Sin `any` — tipos explícitos siempre
- Sin `as unknown as X` sin justificación
- Interfaces en `src/types/index.ts` para tipos compartidos
- Tipos locales solo si son específicos del componente
