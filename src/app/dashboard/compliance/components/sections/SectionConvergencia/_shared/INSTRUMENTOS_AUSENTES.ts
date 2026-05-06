// Copy aspiracional para instrumentos no contratados / sin data este ciclo.
//
// El sistema NO diferencia "no contratado" vs "contratado pero sin data este
// ciclo" — ambos colapsan al mismo branch (decisión de scope confirmada con
// user). Una sola variante por entrada.
//
// Usado en <VisionParcial /> (Condición 1: solo 1 fuente activa) para mostrar
// qué revelaría cada instrumento faltante.

import type { ComplianceSource } from '@/config/complianceAlertConfig';

export interface InstrumentoAusenteCopy {
  /** Nombre comercial (espejo de SOURCE_LABEL_NARRATIVE para consistencia visual). */
  nombreLegible: string;
  /** Narrativa "qué revelaría si estuviera activo". 1-2 líneas ejecutivas. */
  queRevelaria: string;
}

export const INSTRUMENTOS_AUSENTES: Record<ComplianceSource, InstrumentoAusenteCopy> = {
  ambiente_sano: {
    nombreLegible: 'Ambiente Sano',
    // Placeholder — solo aplica si en futuro otra fuente es la única activa.
    // El caso real hoy es Ambiente Sano = la fuente activa, no la ausente.
    queRevelaria:
      'Ambiente Sano confirmaría si las señales de las otras fuentes tienen origen en el clima de trabajo o en factores externos.',
  },
  exit: {
    nombreLegible: 'Exit Intelligence',
    queRevelaria:
      'Exit Intelligence mostraría si las salidas confirman lo que el ambiente revela. Hoy esa confirmación no existe.',
  },
  onboarding: {
    nombreLegible: 'Onboarding Journey',
    queRevelaria:
      'Onboarding Journey mostraría si las nuevas incorporaciones leen el ambiente igual que el resto. Sin ese lente no sabemos si el problema es estructural o histórico.',
  },
  pulso: {
    nombreLegible: 'Pulso Express',
    queRevelaria:
      'Pulso Express revelaría si la fricción es un evento aislado o una tendencia de deterioro sostenido.',
  },
};
