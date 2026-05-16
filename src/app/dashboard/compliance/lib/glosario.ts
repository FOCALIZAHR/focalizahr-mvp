// src/app/dashboard/compliance/lib/glosario.ts
// Glosario contextual del módulo Compliance — descripciones ejecutivas de
// los sellos forenses (A1-A5) y los tipos de alerta. Se renderizan vía
// TooltipContext al hacer hover/tap sobre los chips correspondientes.
//
// Solo guardamos la `explanation`. El `title` del tooltip lo provee el
// componente desde el label real del chip (CASO_LABELS / ALERT_LABELS) —
// así el título siempre espeja lo que el CEO ve, sin desync.
//
// Copy auditado contra la skill focalizahr-narrativas (6 Reglas de Oro +
// vocabulario aprobado/prohibido). Estilo McKinsey + Apple: una idea por
// oración, ritmo ascendente, cierre que ancla sin alarmar. Cero jerga
// ("texto libre", "análisis", "convergencia", clínica).

import type { CasoMotorA } from '@/lib/services/compliance/ConvergenciaEngine';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

// ─────────────────────────────────────────────────────────────────────
// Sellos forenses A1-A5 (chips en BandaDepartamento)
// ─────────────────────────────────────────────────────────────────────

export const SELLO_GLOSARIO: Record<CasoMotorA, string> = {
  A1: 'Dos fuentes distintas del estudio coinciden en el mismo departamento. Una sola puede ser casualidad. Dos que apuntan a lo mismo, ya no.',
  A2: 'Los números del departamento se ven bien. Lo que la gente dice, no. Esa distancia es el hallazgo.',
  A3: 'Hombres y mujeres del mismo departamento no describen el mismo lugar de trabajo. La diferencia no es de percepción. Es de trato.',
  A4: 'Dos departamentos comparten líder, pero no resultado. El mismo mando con desenlaces opuestos deja ver qué pesa de verdad.',
  A5: 'El promedio del departamento tranquiliza. Lo que el equipo calla, no. El número dice una cosa; el silencio, otra.',
};

// ─────────────────────────────────────────────────────────────────────
// Tipos de alerta (chips en BandaDepartamento + SectionAlertas)
// ─────────────────────────────────────────────────────────────────────

export const ALERTA_GLOSARIO: Record<ComplianceAlertType, string> = {
  liderazgo_toxico:
    'Varios equipos bajo el mismo mando caen a la vez. No son casos aislados. Es un patrón — y el patrón tiene un responsable.',
  riesgo_convergente:
    'Varias miradas distintas señalan al mismo departamento, en el mismo momento. Cuando coinciden sin haberse puesto de acuerdo, ya no es casualidad.',
  deterioro_sostenido:
    'El departamento cae ciclo tras ciclo. No es un mal trimestre. Es una dirección, y nadie la corrigió.',
  silencio_organizacional:
    'El equipo dejó de decir lo que piensa. Cuando hablar se siente inútil, el silencio se vuelve costumbre. El silencio siempre llega antes que el problema visible.',
  senal_ignorada:
    'Ya hubo alertas en este departamento. Se gestionaron — pero el cuadro no cambió. El síntoma se atendió; la causa sigue.',
  silencio_con_voz_externa:
    'Este departamento no respondió el estudio. Otras fuentes, en el mismo período, sí hablaron. Que no haya respuesta no significa que no haya nada que decir.',
};
