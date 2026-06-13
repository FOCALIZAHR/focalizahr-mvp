// ═══════════════════════════════════════════════════════════════════
// buildLaVoz — tests (node:test + node:assert/strict) · Gate 4
// src/lib/services/compliance/buildLaVoz.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/buildLaVoz.test.ts
//
// Oráculos verbatim: ambas narrativas (silencio / neutra), familia silencio
// (documentada), lectura de alcance, cierre, sanitización de comillas, género
// a nivel gerencia, guard de acto vacío. Caso real cmob0e56 (5 voces + TI).
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLaVoz,
  buildSilencioNarrativa,
  SILENCIO_FAMILY,
} from './buildLaVoz';
import type { ComplianceReportResponse } from '@/types/compliance';

// ── Factory: arma un ComplianceReportResponse mínimo con patrones + género. ──
function mkReport(opts: {
  depts?: Array<{
    departmentId: string;
    nombre?: string | null; // patron_dominante.nombre (null = sin dominante)
    fragmentos?: string[];
  }>;
  genero?: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    evidenciaGenero: string;
  }>;
}): ComplianceReportResponse {
  const departments = (opts.depts ?? []).map((d) => ({
    departmentId: d.departmentId,
    departmentName: d.departmentId,
    patrones:
      d.nombre === undefined
        ? undefined
        : {
            senal_dominante: d.nombre ?? 'ambiente_sano',
            confianza_analisis: 'media',
            patron_dominante: d.nombre
              ? {
                  nombre: d.nombre,
                  nombreLegible: d.nombre,
                  intensidad: 0.6,
                  origen_percibido: 'indeterminado',
                  fragmentos: d.fragmentos ?? [],
                }
              : null,
          },
  }));
  return {
    success: true,
    type: 'executive',
    company: { name: 'Test', country: 'CL' },
    narratives: { alertasGenero: opts.genero ?? [] },
    data: { departments },
  } as unknown as ComplianceReportResponse;
}

// ═══════════════════════════════════════════════════════════════════
// A — FAMILIA + narrativas
// ═══════════════════════════════════════════════════════════════════

test('A1. SILENCIO_FAMILY — miembros explícitos documentados', () => {
  assert.deepEqual(
    [...SILENCIO_FAMILY].sort(),
    ['miedo_represalias', 'resignacion_aprendida', 'silencio_organizacional'].sort(),
  );
  // Contenido (describe un problema) NO está en la familia.
  assert.equal(SILENCIO_FAMILY.has('hostilidad_normalizada'), false);
  assert.equal(SILENCIO_FAMILY.has('favoritismo_implicito'), false);
});

test('A2. buildSilencioNarrativa — n=5 verbatim + destacado aislado', () => {
  assert.deepEqual(buildSilencioNarrativa(5), {
    pre: 'Cinco personas escribieron en el espacio abierto. Las cinco escribieron lo mismo: ',
    destacado: 'que acá no se habla',
    post: '. Ninguna describe un problema. Las cinco describen por qué no lo van a describir.',
  });
});

test('A3. buildSilencioNarrativa — n=1 singular', () => {
  assert.deepEqual(buildSilencioNarrativa(1), {
    pre: 'Una persona escribió en el espacio abierto. Escribió esto: ',
    destacado: 'que acá no se habla',
    post: '. No describe un problema. Describe por qué no lo va a describir.',
  });
});

// ═══════════════════════════════════════════════════════════════════
// B — CASO REAL (5 voces homogéneas de silencio + género TI→Tecnología)
// ═══════════════════════════════════════════════════════════════════

test('B1. caso real — forma silencio, 5 citas, narrativa + cierre + alcance', () => {
  const acto = buildLaVoz(
    mkReport({
      depts: [
        {
          departmentId: 'TI',
          nombre: 'silencio_organizacional',
          fragmentos: ['acá pasan cosas, pero nadie hablará', 'nada que decir'],
        },
        {
          departmentId: 'EQ',
          nombre: 'silencio_organizacional',
          fragmentos: ['todos saben lo que pasa', 'mejor no hablar', 'todo bien, nada que comentar'],
        },
      ],
      genero: [
        {
          departmentName: 'TI',
          parentDepartmentName: 'Tecnología',
          evidenciaGenero: '"no deberían hablar de las chiquillas"',
        },
      ],
    }),
  )!;
  assert.equal(acto.forma, 'silencio');
  assert.equal(acto.n, 5);
  assert.deepEqual(acto.citas, [
    'acá pasan cosas, pero nadie hablará',
    'nada que decir',
    'todos saben lo que pasa',
    'mejor no hablar',
    'todo bien, nada que comentar',
  ]);
  assert.equal(acto.narrativa.destacado, 'que acá no se habla');
  // Género: gerencia (no el depto) + cita SANITIZADA (sin comillas envolventes).
  assert.deepEqual(acto.generos, [
    { gerencia: 'Tecnología', cita: 'no deberían hablar de las chiquillas' },
  ]);
  assert.equal(
    acto.lecturaAlcance,
    'Una voz no hace un patrón, y este informe no la trata como uno. La trata como una dirección: si el próximo ciclo trae otra en el mismo tono, deja de ser anécdota. Por ahora, es el lugar donde mirar.',
  );
  assert.equal(
    acto.cierre,
    'Lo que el equipo no dice en la encuesta, lo termina diciendo de otra forma.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// C — Selector + guards
// ═══════════════════════════════════════════════════════════════════

test('C1. forma neutra — un depto con patrón de CONTENIDO (hostilidad)', () => {
  const acto = buildLaVoz(
    mkReport({
      depts: [
        { departmentId: 'A', nombre: 'silencio_organizacional', fragmentos: ['mejor no hablar'] },
        { departmentId: 'B', nombre: 'hostilidad_normalizada', fragmentos: ['no me gusta el trato'] },
      ],
    }),
  )!;
  assert.equal(acto.forma, 'neutra');
  assert.equal(acto.narrativa.pre, 'Esto escribió el equipo en el espacio abierto. Sin filtro, tal como llegó.');
  assert.equal(acto.narrativa.destacado, '');
});

test('C2. familia con subtipo distinto (resignacion) → sigue silencio', () => {
  const acto = buildLaVoz(
    mkReport({
      depts: [
        { departmentId: 'A', nombre: 'silencio_organizacional', fragmentos: ['nada que decir'] },
        { departmentId: 'B', nombre: 'resignacion_aprendida', fragmentos: ['así es aquí'] },
      ],
    }),
  )!;
  assert.equal(acto.forma, 'silencio');
});

test('C3. dedup case-insensitive + tope 6', () => {
  const acto = buildLaVoz(
    mkReport({
      depts: [
        {
          departmentId: 'A',
          nombre: 'silencio_organizacional',
          fragmentos: ['Nada que decir', 'nada que decir', 'mejor no hablar'],
        },
      ],
    }),
  )!;
  assert.deepEqual(acto.citas, ['Nada que decir', 'mejor no hablar']);
});

test('C4. guard — sin citas ni género → null', () => {
  assert.equal(buildLaVoz(mkReport({ depts: [] })), null);
});

test('C5. solo género (sin citas) → acto se emite, forma neutra', () => {
  const acto = buildLaVoz(
    mkReport({
      depts: [],
      genero: [
        { departmentName: 'TI', parentDepartmentName: 'Tecnología', evidenciaGenero: 'algo' },
      ],
    }),
  )!;
  assert.equal(acto.n, 0);
  assert.equal(acto.forma, 'neutra');
  assert.equal(acto.generos.length, 1);
});
