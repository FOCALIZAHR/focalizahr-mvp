# TASK: Agregar Usuario María García para Testing de Evaluaciones

## 🎯 OBJETIVO

Agregar a María García como usuario de prueba en el script existente `scripts/create-test-users.ts` para poder testear el flujo de evaluación de desempeño.

## 📋 CONTEXTO

- María García es un Employee existente con `id: cmkrlxw8i0003c6q5amursr0o`
- Su email es `maria@empresa.cl`
- Pertenece al account `cmfgedx7b00012413i92048wl`
- Tiene 3 EvaluationAssignments como evaluadora en el ciclo de Performance
- Actualmente NO tiene User, por lo que no puede loguearse

## ✅ INSTRUCCIONES

### Paso 1: Abrir el archivo existente

```bash
code scripts/create-test-users.ts
```

### Paso 2: Agregar a María ANTES del console.log final

Buscar la línea:
```typescript
console.log('✅ Usuarios de prueba creados');
```

Y agregar ANTES de ella:

```typescript
  // María García - Evaluadora para testing Performance
  // Account: Corporación Enterprise (cmfgedx7b00012413i92048wl)
  // Employee existente con 3 evaluaciones asignadas
  await prisma.user.upsert({
    where: { email: 'maria@empresa.cl' },
    update: { passwordHash },  // Actualiza hash si ya existe
    create: {
      accountId: 'cmfgedx7b00012413i92048wl',
      email: 'maria@empresa.cl',
      name: 'Maria Garcia',
      passwordHash,
      role: 'HR_MANAGER',
      departmentId: null,
      isActive: true
    }
  });
  console.log('✅ María García creada/actualizada');
```

### Paso 3: Ejecutar el script

```bash
npx ts-node scripts/create-test-users.ts
```

### Paso 4: Verificar

```sql
SELECT id, email, name, role, is_active 
FROM users 
WHERE email = 'maria@empresa.cl';
```

## 🔐 CREDENCIALES RESULTANTES

```yaml
Email: maria@empresa.cl
Password: Test123!
Role: HR_MANAGER
Account: Corporación Enterprise
```

## 🧪 TEST POSTERIOR

1. Ir a `/login`
2. Ingresar `maria@empresa.cl` / `Test123!`
3. Navegar a `/dashboard/evaluaciones`
4. Verificar que aparecen sus 3 evaluaciones pendientes

## ⚠️ NOTAS DE SEGURIDAD

- El script usa `upsert` que es seguro: crea si no existe, actualiza si existe
- El hash se genera con `bcrypt.hash('Test123!', 12)` igual que los otros usuarios
- No modifica ningún dato existente más allá del passwordHash si el user ya existiera
- Solo afecta la tabla `users`, no toca `employees` ni `evaluation_assignments`

## 📁 ARCHIVO A MODIFICAR

`scripts/create-test-users.ts`

## 🚫 NO HACER

- NO crear el usuario con SQL directo
- NO copiar hashes de otros usuarios
- NO modificar otros archivos
- NO cambiar la lógica existente del script
