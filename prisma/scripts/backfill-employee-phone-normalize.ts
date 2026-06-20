// prisma/scripts/backfill-employee-phone-normalize.ts
// Backfill idempotente: normaliza Employee.phoneNumber a canonico chileno
// (+56XXXXXXXXX) usando la util unica normalizePhone (Gate C v3.0). Deja el master
// consistente para el match exacto del webhook Twilio.
//
// - Dry-run por defecto: reporta que cambiaria sin tocar la DB.
// - Con --apply: ejecuta los UPDATE.
//
// Politica (alineada con el create-path de EmployeeSyncService):
//   - normalizable     -> se guarda el canonico.
//   - ya canonico      -> no-op.
//   - NO normalizable  -> se setea null (no se deja raw sucio); se reporta aparte.
//
// Uso:
//   npm run backfill:employee-phone-normalize          # dry-run
//   npm run backfill:employee-phone-normalize -- --apply

import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../../src/lib/utils/normalizePhone';

const prisma = new PrismaClient();

type Row = {
  id: string;
  company: string;
  current: string;
  next: string | null;
  action: 'canonical' | 'noop' | 'null';
};

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`🔧 Backfill Employee.phoneNumber normalize (${apply ? 'APPLY' : 'DRY-RUN'})\n`);

  const employees = await prisma.employee.findMany({
    where: { phoneNumber: { not: null } },
    select: {
      id: true,
      phoneNumber: true,
      account: { select: { companyName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (employees.length === 0) {
    console.log('ℹ️  No hay Employees con phoneNumber. Nada que hacer.');
    return;
  }

  const rows: Row[] = [];
  for (const e of employees) {
    const current = e.phoneNumber as string;
    const norm = normalizePhone(current);
    let action: Row['action'];
    let next: string | null;
    if (norm.ok && norm.value) {
      next = norm.value;
      action = norm.value === current ? 'noop' : 'canonical';
    } else {
      next = null;
      action = 'null';
    }
    rows.push({ id: e.id, company: e.account?.companyName || '-', current, next, action });
  }

  const toCanonical = rows.filter((r) => r.action === 'canonical');
  const toNull = rows.filter((r) => r.action === 'null');
  const noop = rows.filter((r) => r.action === 'noop');

  console.log(`Total con phone: ${rows.length}`);
  console.log(`  Ya canonicos (no-op): ${noop.length}`);
  console.log(`  A normalizar:         ${toCanonical.length}`);
  console.log(`  NO normalizables -> null (revisar): ${toNull.length}\n`);

  const preview = (label: string, list: Row[]) => {
    if (list.length === 0) return;
    console.log(`── ${label} ──`);
    for (const r of list.slice(0, 30)) {
      console.log(`  [${r.company}] "${r.current}" -> ${r.next === null ? 'NULL' : `"${r.next}"`}`);
    }
    if (list.length > 30) console.log(`  ... y ${list.length - 30} mas`);
    console.log('');
  };

  preview('A normalizar (canonico)', toCanonical);
  preview('NO normalizables (se setean null)', toNull);

  if (!apply) {
    console.log('🔎 DRY-RUN: no se escribio nada. Re-ejecuta con -- --apply para aplicar.');
    return;
  }

  let updated = 0;
  for (const r of [...toCanonical, ...toNull]) {
    await prisma.employee.update({
      where: { id: r.id },
      data: { phoneNumber: r.next },
    });
    updated++;
  }
  console.log(`✅ APPLY: ${updated} Employees actualizados (${toCanonical.length} canonicos, ${toNull.length} a null).`);
}

main()
  .catch((err) => {
    console.error('❌ Backfill fallo:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
