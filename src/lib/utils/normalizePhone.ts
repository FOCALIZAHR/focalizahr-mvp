// ════════════════════════════════════════════════════════════════════════════
// NORMALIZE PHONE - Util canonica de telefono (Gate C v3.0)
// src/lib/utils/normalizePhone.ts
// ════════════════════════════════════════════════════════════════════════════
// Fuente UNICA de normalizacion de telefono. Chile-first (+56). Funcion pura,
// NUNCA lanza. Su logica de prefijo esta ALINEADA con la inline que ya existe en
// el CSV upload (campaigns/[id]/participants/upload/route.ts:353-364), endurecida
// para limpiar tambien guiones y parentesis (no solo espacios). El CSV inline se
// migra a esta util en GATE D para que no diverjan.
//
// Contrato {value, ok}:
//   - ok=true  -> value es el numero canonico '+56XXXXXXXXX' (12 chars).
//   - ok=false -> el input NO calza patron chileno. value=null: el llamador NO
//     debe guardar el dato raw en silencio (es dato a revisar, se loguea).
//
// Spec: .claude/tasks/SPEC_GATE_C_COMUNICACIONES_v3.md (decision normalizacion).
// ════════════════════════════════════════════════════════════════════════════

export type NormalizedPhone = {
  value: string | null; // numero canonico +56XXXXXXXXX, o null si no normalizable
  ok: boolean;          // true solo si quedo en formato canonico chileno
};

// Celular chileno canonico: +56 seguido de 9 digitos.
const CL_CANONICAL = /^\+56[0-9]{9}$/;

/**
 * Normaliza un telefono a formato canonico chileno (+56XXXXXXXXX).
 *
 * Mismo criterio de prefijo que el inline del CSV upload:
 *   - ya tiene +56 -> se respeta
 *   - empieza con 56 -> se antepone '+'
 *   - empieza con 9  -> se antepone '+56'
 * Si tras eso no calza el patron canonico, retorna ok=false (dato a revisar).
 *
 * @param raw - telefono crudo (de nomina, form, o el From de un webhook Twilio)
 */
export function normalizePhone(raw: string | null | undefined): NormalizedPhone {
  if (!raw || typeof raw !== 'string') {
    return { value: null, ok: false };
  }

  // Limpiar espacios, guiones, parentesis y puntos. Alineado + endurecido vs CSV.
  let phone = raw.trim().replace(/[\s\-().]/g, '');
  if (phone === '') {
    return { value: null, ok: false };
  }

  // Prefijo Chile (+56), mismo criterio que el inline del CSV upload.
  if (!phone.startsWith('+56')) {
    if (phone.startsWith('56')) {
      phone = '+' + phone;
    } else if (phone.startsWith('9')) {
      phone = '+56' + phone;
    }
  }

  if (CL_CANONICAL.test(phone)) {
    return { value: phone, ok: true };
  }

  // No calza patron chileno: NO se guarda raw en silencio. Dato a revisar.
  return { value: null, ok: false };
}
