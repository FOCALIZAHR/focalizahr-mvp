// scripts/gate5-el-nombre-render.ts
// Gate 5 (El Nombre) — render de fixtures SINTÉTICOS para visto. cmob0e56 NO
// emite este acto (criticalByManager vacío), por eso se usan fixtures.
// Estados: (1) con-patrón una rama · (2) multi-rama (protagonista legal + otras).
//
// Run: npx tsx scripts/gate5-el-nombre-render.ts

import { buildElNombre } from '@/lib/services/compliance/buildElNombre';
import type { CriticalByManagerGroup } from '@/lib/services/compliance/ConvergenciaEngine';
import type { ComplianceReportResponse } from '@/types/compliance';

function mkGroup(managerId: string, ids: string[]): CriticalByManagerGroup {
  return { managerId, departmentIds: ids, deltaIsa: 40, minIsa: 30, maxIsa: 70 };
}
function mkData(groups: CriticalByManagerGroup[], depts: any[]): ComplianceReportResponse {
  return {
    success: true, type: 'executive', company: { name: 'demo', country: 'CL' }, narratives: {},
    data: {
      departments: depts.map((d) => ({ departmentId: d.id, departmentName: d.name, isaScore: d.isa })),
      riskScores: depts.map((d) => ({
        departmentId: d.id, departmentName: d.name, score: 0, bucket: 'con_isa',
        drivers: { confiabilidad: 0, voz_externa: 0, piso_denuncia: 0 }, reason: 'suma',
        inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: d.denuncias ?? null },
        alertas: d.karin ? [{ alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 }] : [],
        parentGerenciaId: d.gerenciaId ?? null, parentGerenciaName: d.gerenciaName ?? null,
      })),
      convergencia: { criticalByManager: groups },
    },
  } as unknown as ComplianceReportResponse;
}

function render(label: string, data: ComplianceReportResponse) {
  const a = buildElNombre(data);
  console.log(`\n╔══ ${label} ══╗\n`);
  if (!a) { console.log('  (no emite)'); return; }
  console.log(`EL NOMBRE\n   ${a.n}\n   ÁREAS CRÍTICAS · UNA MISMA LÍNEA DE MANDO\n`);
  console.log(`   [${a.narrativa.destacado}]. ${a.narrativa.resto}\n`);
  console.log(`   ${a.postura}\n`);
  if (a.factorizacion) {
    console.log(`   ${a.factorizacion.texto} · ${a.factorizacion.link}`);
    console.log(`     MODAL:`);
    for (const b of a.factorizacion.modal) {
      console.log(`       ▸ ${b.gerencia}: ${b.deptNames.join(' · ')}`);
    }
    console.log('');
  }
  console.log(`   «${a.cierre}»`);
}

// ── Estado 1: con-patrón, una sola rama (legal) ──
render('GATE 5 · EL NOMBRE — con-patrón (1 rama)', mkData(
  [mkGroup('gPersonas', ['cultura', 'do', 'compensaciones'])],
  [
    { id: 'cultura', name: 'Subgerencia de Cultura y DO', isa: 28, karin: true, gerenciaId: 'gPersonas', gerenciaName: 'GERENCIA DE PERSONAS' },
    { id: 'do', name: 'Desarrollo Organizacional', isa: 38, gerenciaId: 'gPersonas', gerenciaName: 'GERENCIA DE PERSONAS' },
    { id: 'compensaciones', name: 'Compensaciones', isa: 72, gerenciaId: 'gPersonas', gerenciaName: 'GERENCIA DE PERSONAS' },
  ],
));

// ── Estado 2: multi-rama (protagonista legal + 2 secundarias) ──
render('GATE 5 · EL NOMBRE — multi-rama', mkData(
  [
    mkGroup('gComercial', ['ventas-n', 'ventas-s']),
    mkGroup('gOperaciones', ['soporte', 'logistica', 'bodega']),
    mkGroup('gFinanzas', ['cobranza', 'tesoreria']),
  ],
  [
    // Comercial: legal (denuncia) → protagonista aunque sea chica.
    { id: 'ventas-n', name: 'Ventas Norte', isa: 30, denuncias: 1, gerenciaId: 'gComercial', gerenciaName: 'Gerencia Comercial' },
    { id: 'ventas-s', name: 'Ventas Sur', isa: 68, gerenciaId: 'gComercial', gerenciaName: 'Gerencia Comercial' },
    // Operaciones: grande, sin señal.
    { id: 'soporte', name: 'Soporte', isa: 32, gerenciaId: 'gOperaciones', gerenciaName: 'Gerencia de Operaciones' },
    { id: 'logistica', name: 'Logística', isa: 40, gerenciaId: 'gOperaciones', gerenciaName: 'Gerencia de Operaciones' },
    { id: 'bodega', name: 'Bodega', isa: 70, gerenciaId: 'gOperaciones', gerenciaName: 'Gerencia de Operaciones' },
    // Finanzas: chica, sin señal.
    { id: 'cobranza', name: 'Cobranza', isa: 36, gerenciaId: 'gFinanzas', gerenciaName: 'Gerencia de Finanzas' },
    { id: 'tesoreria', name: 'Tesorería', isa: 66, gerenciaId: 'gFinanzas', gerenciaName: 'Gerencia de Finanzas' },
  ],
));
