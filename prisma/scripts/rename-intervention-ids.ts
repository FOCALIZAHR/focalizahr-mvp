// prisma/scripts/rename-intervention-ids.ts
// Renombra interventionId persistidos en compliance_plan_actions tras el
// rebalanceo del catálogo de intervenciones (InterventionEngine.ts).
//
// Motivo: el ID de una intervención debe reflejar la condición que la gatilla,
// no el mecanismo. Dos IDs quedaron desalineados con su gatillo real:
//   - ALGORITHMIC_TRANSPARENCY → gatillo real = equidad/favoritismo (P5, A3)
//   - RELATIONAL_REDESIGN      → gatillo real = agotamiento/carga (P8, deterioro)
//
// - Dry-run por defecto.
// - Con --apply: ejecuta los UPDATEs.
// - Idempotente: si el ID viejo ya no tiene filas, es no-op.
// - Solo toca la columna intervention_id (no es key ni índice → sin colisión).
//   Los snapshots optionLabel/evidencia/plazo NO se tocan (audit trail intacto).
//
// Uso:
//   npm run rename:intervention-ids                  # dry-run
//   npm run rename:intervention-ids -- --apply       # apply

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapa canónico de renombres. Key = ID viejo, value = ID nuevo.
const RENAMES: Record<string, string> = {
  ALGORITHMIC_TRANSPARENCY: 'DECISION_ACCOUNTABILITY',
  RELATIONAL_REDESIGN: 'WORK_REDESIGN',
};

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
}

async function main() {
  const apply = hasFlag('apply');

  console.log(`\n=== rename-intervention-ids (${apply ? 'APPLY' : 'DRY-RUN'}) ===\n`);

  let totalAfectadas = 0;

  for (const [viejo, nuevo] of Object.entries(RENAMES)) {
    const count = await prisma.compliancePlanAction.count({
      where: { interventionId: viejo },
    });

    if (count === 0) {
      console.log(`  ${viejo} → ${nuevo}: 0 filas (no-op)`);
      continue;
    }

    totalAfectadas += count;
    console.log(`  ${viejo} → ${nuevo}: ${count} fila(s)`);

    if (apply) {
      const res = await prisma.compliancePlanAction.updateMany({
        where: { interventionId: viejo },
        data: { interventionId: nuevo },
      });
      console.log(`    ✅ actualizadas: ${res.count}`);
    }
  }

  console.log(
    `\n${apply ? 'Aplicado' : 'Dry-run'} — total filas ${apply ? 'actualizadas' : 'a actualizar'}: ${totalAfectadas}`
  );
  if (!apply && totalAfectadas > 0) {
    console.log('Re-ejecutar con --apply para persistir.\n');
  } else {
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('ERROR:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
