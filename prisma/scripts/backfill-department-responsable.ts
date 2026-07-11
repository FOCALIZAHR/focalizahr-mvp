// prisma/scripts/backfill-department-responsable.ts
// Gate 1 transversal — seed best-effort de Department.responsableId (→ Employee.id).
// Estrategia (aprobada, opción 1): por cada Department activo, candidatos = Employees
// ACTIVOS del propio depto con standardJobLevel de liderazgo. Si hay exactamente 1 →
// se asigna; si 0 o empate (2+) → NULL (cae a Account.adminEmail vía resolver).
// Fuente autoritativa real = Fase 2 (mantenedor UI / columna de carga). Ver
// .claude/tasks/ARQUITECTURA_RESPONSABLE_DEPARTAMENTO.md (Addendum).
//
// Idempotente: en --commit solo escribe donde responsableId está NULL (nunca pisa
// una asignación existente). Dry-run por defecto: NO toca la BD, solo reporta.
//
// Uso: npx tsx prisma/scripts/backfill-department-responsable.ts            (dry-run)
//      npx tsx prisma/scripts/backfill-department-responsable.ts --commit   (persiste)

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

// Niveles considerados "líder del departamento" (conservador — supervisor_coordinador
// excluido a propósito). standardJobLevel canónico en schema Employee.
const LEADER_JOB_LEVELS = ['gerente_director', 'subgerente_subdirector', 'jefe'] as const;

const COMMIT = process.argv.includes('--commit');

type Candidate = {
  id: string;
  fullName: string;
  accountId: string;
  standardJobLevel: string | null;
  managerLevel: number | null;
};

function fmtCandidate(c: Candidate): string {
  return `${c.fullName} (${c.standardJobLevel ?? '¿?'}, mgrLvl ${c.managerLevel ?? 'null'})`;
}

async function main() {
  console.log(`\n🔎 Backfill Department.responsableId — modo ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  // Contexto: ¿qué tan poblado está standardJobLevel? (interpreta la cobertura)
  const totalActiveEmployees = await prisma.employee.count({ where: { isActive: true } });
  const withJobLevel = await prisma.employee.count({
    where: { isActive: true, standardJobLevel: { not: null } },
  });
  const leaderEmployees = await prisma.employee.count({
    where: { isActive: true, standardJobLevel: { in: [...LEADER_JOB_LEVELS] } },
  });
  console.log('── Contexto de datos ──');
  console.log(`  Employees activos:                  ${totalActiveEmployees}`);
  console.log(`  con standardJobLevel poblado:       ${withJobLevel} (${pct(withJobLevel, totalActiveEmployees)})`);
  console.log(`  con nivel de liderazgo (3 niveles): ${leaderEmployees}\n`);

  // Departamentos activos
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, displayName: true, accountId: true, parentId: true, level: true },
  });

  // Todos los empleados-líder activos, agrupados por departmentId
  const leaders = await prisma.employee.findMany({
    where: { isActive: true, standardJobLevel: { in: [...LEADER_JOB_LEVELS] } },
    select: {
      id: true,
      fullName: true,
      departmentId: true,
      accountId: true,
      standardJobLevel: true,
      managerLevel: true,
    },
  });

  const byDept = new Map<string, Candidate[]>();
  for (const e of leaders) {
    const arr = byDept.get(e.departmentId) ?? [];
    arr.push({
      id: e.id,
      fullName: e.fullName,
      accountId: e.accountId,
      standardJobLevel: e.standardJobLevel,
      managerLevel: e.managerLevel,
    });
    byDept.set(e.departmentId, arr);
  }

  const unique: { dept: (typeof departments)[number]; c: Candidate }[] = [];
  const ties: { dept: (typeof departments)[number]; cs: Candidate[] }[] = [];
  let none = 0;
  let crossAccountDropped = 0; // defensa multi-tenant: candidatos descartados por accountId

  for (const dept of departments) {
    const raw = byDept.get(dept.id) ?? [];
    // Guard multi-tenant explícito: el candidato debe pertenecer a la MISMA cuenta que
    // el depto (dept.id es cuid global; esto descarta un Employee corrupto de otra cuenta).
    const cs = raw.filter((c) => c.accountId === dept.accountId);
    crossAccountDropped += raw.length - cs.length;

    if (cs.length === 1) unique.push({ dept, c: cs[0] });
    else if (cs.length === 0) none += 1;
    else ties.push({ dept, cs });
  }

  const total = departments.length;

  console.log('── Cobertura del backfill (departamentos activos) ──');
  console.log(`  Total deptos activos:          ${total}`);
  console.log(`  ✅ 1 candidato único (asigna):  ${unique.length} (${pct(unique.length, total)})`);
  console.log(`  ⬜ 0 candidatos (NULL→admin):   ${none} (${pct(none, total)})`);
  console.log(`  ⚠️  empate 2+ (NULL→admin):     ${ties.length} (${pct(ties.length, total)})`);
  if (crossAccountDropped > 0) {
    console.log(`  🔒 candidatos descartados por accountId (cross-tenant): ${crossAccountDropped}`);
  }
  console.log('');

  // Composición de los empates: ¿el patrón típico es "1 jefe + superiores admin"?
  if (ties.length > 0) {
    let jefeMasSuperior = 0; // exactamente 1 'jefe' + 1+ superiores (gerente/subgerente)
    let multiJefe = 0; // 2+ 'jefe'
    let otro = 0;
    for (const t of ties) {
      const jefes = t.cs.filter((c) => c.standardJobLevel === 'jefe').length;
      const superiores = t.cs.filter(
        (c) => c.standardJobLevel === 'gerente_director' || c.standardJobLevel === 'subgerente_subdirector'
      ).length;
      if (jefes === 1 && superiores >= 1 && jefes + superiores === t.cs.length) jefeMasSuperior += 1;
      else if (jefes >= 2) multiJefe += 1;
      else otro += 1;
    }
    console.log('── Composición de los empates (para decidir desempate) ──');
    console.log(`  "1 jefe + superior(es) admin":  ${jefeMasSuperior} (${pct(jefeMasSuperior, ties.length)})`);
    console.log(`  "2+ jefes":                     ${multiJefe} (${pct(multiJefe, ties.length)})`);
    console.log(`  otro:                           ${otro} (${pct(otro, ties.length)})\n`);

    console.log('── Ejemplos de EMPATE (hasta 6) ──');
    for (const t of ties.slice(0, 6)) {
      console.log(`  · ${t.dept.displayName} [lvl ${t.dept.level}]:`);
      for (const c of t.cs) console.log(`       ${fmtCandidate(c)}`);
    }
    console.log('');
  }

  if (unique.length > 0) {
    console.log('── Ejemplos de ÉXITO — 1 candidato (hasta 6) ──');
    for (const u of unique.slice(0, 6)) {
      console.log(`  · ${u.dept.displayName} [lvl ${u.dept.level}] → ${fmtCandidate(u.c)}`);
    }
    console.log('');
  }

  if (!COMMIT) {
    console.log('DRY-RUN: no se escribió nada. Corré con --commit para persistir.\n');
    return;
  }

  // ── Persistencia (idempotente: solo donde responsableId está NULL) ──
  let written = 0;
  for (const u of unique) {
    const res = await prisma.department.updateMany({
      where: { id: u.dept.id, responsableId: null } as any,
      data: { responsableId: u.c.id } as any,
    });
    written += res.count;
  }
  console.log(`✅ COMMIT: ${written} departamentos actualizados (idempotente).\n`);
}

function pct(n: number, d: number): string {
  if (d === 0) return '0%';
  return `${((n / d) * 100).toFixed(1)}%`;
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
