// scripts/audit-emdashes-cascada.ts
// READ-ONLY — Inventario de em-dashes (—, U+2014) en COPY VISIBLE de la cascada
// Ambiente Sano + dictionaries de compliance. Excluye líneas de comentario
// (// , * , /* ). No modifica nada. Regla nueva: ningún "—" en texto visible.
//
// Run: npx tsx scripts/audit-emdashes-cascada.ts

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const EM = '—'; // —

// Delimitadores armados por concatenación (evita literales que rompen esbuild).
const OPEN_BLOCK = '/' + '*';
const CLOSE_BLOCK = '*' + '/';
const OPEN_JSX = '{' + OPEN_BLOCK;
const CLOSE_JSX = CLOSE_BLOCK + '}';
const DBL_SLASH = '/' + '/';

const FILES = [
  // ── Cascada (Beats + modales + shared) ──
  'src/components/compliance/cascada/ActoAmbiente.tsx',
  'src/components/compliance/cascada/ActoTriage.tsx',
  'src/components/compliance/cascada/ActoAnatomia.tsx',
  'src/components/compliance/cascada/ActoVoz.tsx',
  'src/components/compliance/cascada/ActoNombre.tsx',
  'src/components/compliance/cascada/ActoSintesis.tsx',
  'src/components/compliance/cascada/TriageDetailModal.tsx',
  'src/components/compliance/cascada/AnatomiaDetailModal.tsx',
  'src/components/compliance/cascada/CascadaModalShell.tsx',
  'src/components/compliance/cascada/shared.tsx',
  // ── Builders con copy ──
  'src/lib/services/compliance/buildTriageGroups.ts',
  'src/lib/services/compliance/buildTriageModal.ts',
  'src/lib/services/compliance/buildAnatomia.ts',
  'src/lib/services/compliance/deriveBeat1Slots.ts',
  'src/lib/services/compliance/AmbienteSynthesisEngine.ts',
  // ── Dictionaries de compliance ──
  'src/config/narratives/ComplianceNarrativeDictionary.ts',
  'src/lib/services/compliance/DepartmentRiskNarrativeDictionary.ts',
  'src/lib/services/compliance/CoverageNarrativeDictionary.ts',
  'src/lib/services/compliance/AmbienteSynthesisDictionary.ts',
  'src/app/dashboard/compliance/lib/labels.ts',
];

/** Línea de comentario completa (incluye apertura de comentario JSX). */
function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return (
    t.startsWith(DBL_SLASH) ||
    t.startsWith('*') ||
    t.startsWith(OPEN_BLOCK) ||
    t.startsWith(OPEN_JSX)
  );
}

/** Quita pares open…close (sin regex, para esquivar el parser de esbuild). */
function removeBetween(s: string, open: string, close: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const a = s.indexOf(open, i);
    if (a < 0) {
      out += s.slice(i);
      break;
    }
    out += s.slice(i, a);
    const b = s.indexOf(close, a + open.length);
    if (b < 0) break; // open sin cierre → descarta el resto
    i = b + close.length;
  }
  return out;
}

/** Quita comentarios inline (JSX, bloque, trailing) para no contar em-dashes
 *  que viven en comentarios, no en copy visible. */
function stripInlineComments(line: string): string {
  let s = removeBetween(line, OPEN_JSX, CLOSE_JSX);
  s = removeBetween(s, OPEN_BLOCK, CLOSE_BLOCK);
  const ci = s.indexOf(DBL_SLASH);
  if (ci >= 0) s = s.slice(0, ci);
  return s;
}

let totalCopy = 0;
let totalComment = 0;
const out: string[] = [];

for (const rel of FILES) {
  let text: string;
  try {
    text = readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    continue; // archivo no existe → skip
  }
  const lines = text.split('\n');
  const hits: { n: number; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes(EM)) continue;
    const cleaned = isCommentLine(line) ? '' : stripInlineComments(line);
    if (!cleaned.includes(EM)) {
      totalComment += line.split(EM).length - 1;
      continue;
    }
    hits.push({ n: i + 1, text: line.trim() });
    totalCopy += cleaned.split(EM).length - 1;
  }
  if (hits.length === 0) continue;
  out.push(`\n### ${rel}  (${hits.length} líneas)`);
  for (const h of hits) out.push(`  L${h.n}: ${h.text}`);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('INVENTARIO DE EM-DASHES (—) EN COPY VISIBLE — cascada + dictionaries');
console.log('═══════════════════════════════════════════════════════════════');
console.log(out.join('\n'));
console.log('\n───────────────────────────────────────────────────────────────');
console.log(`TOTAL em-dashes en copy visible (no-comentario): ${totalCopy}`);
console.log(`(Excluidos en comentarios: ${totalComment})`);
