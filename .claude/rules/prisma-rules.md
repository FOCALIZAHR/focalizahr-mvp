# FocalizaHR — Prisma Rules
glob: prisma/schema.prisma

---

## Schema-First — Regla Absoluta

Ningún campo se agrega sin análisis de impacto escrito.
Ningún modelo se modifica sin plan aprobado.
Sin documento → sin cambio.

---

## Antes de Modificar el Schema

1. Entender qué modelos dependen del campo a cambiar
2. Buscar referencias en el código: `grep -r "nombreCampo" src/`
3. Verificar si el cambio rompe APIs existentes
4. Documentar el plan antes de ejecutar

---

## Multi-Tenant — Obligatorio en Cada Modelo

Todo modelo que contenga datos de cliente lleva `accountId`:

```prisma
model NuevoModelo {
  id        String  @id @default(cuid())
  accountId String  // ← SIEMPRE presente
  account   Account @relation(fields: [accountId], references: [id])
  // ...
  
  @@index([accountId])  // ← índice obligatorio
}
```

---

## Índices Obligatorios

- `@@index([accountId])` en todo modelo multi-tenant
- `@@index([accountId, status])` si se filtra por status frecuentemente
- `@@index([createdAt])` si se ordena por fecha

---

## Convenciones de Nombres

| Concepto | Convención |
|----------|-----------|
| IDs | `String @id @default(cuid())` |
| Fechas | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` |
| Campos opcionales | `String?` con `?` explícito |
| Enums | PascalCase: `ACTIVE`, `INACTIVE`, `PENDING` |
| Relaciones | nombre del modelo en camelCase |

---

## Comando Seguro en Desarrollo

```bash
npx prisma db push      # desarrollo — nunca en producción
npx prisma validate     # verificar schema antes de push
npx prisma studio       # ver estructura real de BD
```

Producción usa migraciones — nunca `db push`.
