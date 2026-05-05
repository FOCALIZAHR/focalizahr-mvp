// src/config/compliance/sourceLabels.ts
// Etiquetas legibles por instrumento (ComplianceSource).
//
// Dos variantes:
//   SOURCE_LABEL_SHORT     → pills, headers, columnas estrechas (UI chrome).
//   SOURCE_LABEL_NARRATIVE → prosa ejecutiva embebida en narrativas (motor).
//
// Regla: nunca renderizar el enum interno (`ambiente_sano`) al usuario.
// SHORT vive en frontend hace tiempo (`compliance/lib/labels.ts:NODO_LABELS`);
// se centraliza acá para que el motor (backend) pueda consumir SOURCE_LABEL_NARRATIVE
// sin cross-import frontend.

import type { ComplianceSource } from '@/config/complianceAlertConfig';

/**
 * Etiquetas cortas (1 palabra cuando es posible). Para pills, columnas
 * estrechas, headers de tabla, gauges del Acto Ancla.
 *
 * Si necesitás texto en prosa ejecutiva (narrativas, párrafos), usá
 * SOURCE_LABEL_NARRATIVE.
 */
export const SOURCE_LABEL_SHORT: Record<ComplianceSource, string> = {
  ambiente_sano: 'Ambiente',
  exit:          'Salidas',
  onboarding:    'Ingresos',
  pulso:         'Clima',
};

/**
 * Etiquetas comerciales completas — el nombre del producto tal como aparece
 * en la nav y los dashboards (lo que el CEO ya conoce). Para usar dentro
 * de prosa narrativa donde la palabra suelta podría ser ambigua
 * (ej. "Salidas y Clima coinciden..." vs "Exit Intelligence y Pulso Express
 * coinciden...").
 *
 * Verificado en UI (2026-05-05):
 * - 'Ambiente Sano'        → DashboardNavigation.tsx:145, system/page.tsx:186, compliance/page.tsx:18
 * - 'Exit Intelligence'    → DashboardNavigation.tsx:143, system/page.tsx:212, exit/page.tsx:111
 * - 'Onboarding Journey'   → compliance/lib/labels.ts:145 ('Requiere Onboarding Journey'),
 *                            consistente con prosa al lado de 'Exit Intelligence'
 * - 'Pulso Express'        → seed.ts:27, system/page.tsx:184, ExitAlertEngine.ts:131
 */
export const SOURCE_LABEL_NARRATIVE: Record<ComplianceSource, string> = {
  ambiente_sano: 'Ambiente Sano',
  exit:          'Exit Intelligence',
  onboarding:    'Onboarding Journey',
  pulso:         'Pulso Express',
};

/**
 * Texto del fallback "el cliente no tiene contratado este instrumento".
 *
 * NOTA: el sistema NO diferencia "no contratado" vs "contratado pero sin data
 * este ciclo" — ambos colapsan al mismo branch (la fuente simplemente no
 * aparece en `activeSources`). Una sola variante de copy por ahora.
 */
export const SOURCE_REQUIRES_LABEL: Record<ComplianceSource, string | null> = {
  ambiente_sano: null, // siempre presente cuando el módulo se renderiza
  exit:          'Requiere Exit Intelligence',
  onboarding:    'Requiere Onboarding Journey',
  pulso:         'Requiere Pulso Express',
};
