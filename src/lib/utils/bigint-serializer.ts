/**
 * 🔧 BIGINT SERIALIZER FIX
 * 
 * Problema: Prisma devuelve BigInt en agregaciones (_count, etc)
 * JavaScript no puede serializar BigInt a JSON nativamente
 * 
 * Solución: Convertir recursivamente todos los BigInt a Number
 * antes de enviar response con NextResponse.json()
 * 
 * @version 1.0
 * @date 17 Nov 2025
 */

/**
 * Convertir recursivamente BigInt a Number en cualquier objeto
 * 
 * CASOS MANEJADOS:
 * - BigInt primitivo → Number
 * - Arrays con BigInt → Arrays con Number
 * - Objetos nested con BigInt → Objetos con Number
 * - null/undefined → preservados
 * - Otros tipos → preservados
 */
export function serializeBigInt<T>(data: T): T {
  // Caso base: null o undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Caso 1: BigInt directo → Number
  if (typeof data === 'bigint') {
    return Number(data) as T;
  }

  // Caso 2: Array → procesar cada elemento
  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item)) as T;
  }

  // Caso 3: Object → procesar cada propiedad
  if (typeof data === 'object') {
    const serialized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeBigInt(value);
    }
    
    return serialized as T;
  }

  // Caso 4: Otros tipos (string, number, boolean) → retornar sin cambios
  return data;
}

/**
 * Wrapper para NextResponse.json que serializa BigInt automáticamente
 * 
 * USO:
 * ```typescript
 * import { jsonResponse } from '@/lib/utils/bigint-serializer';
 * 
 * // ❌ ANTES (error BigInt)
 * return NextResponse.json({ data });
 * 
 * // ✅ AHORA (sin error)
 * return jsonResponse({ data });
 * ```
 */
export function jsonResponse<T>(data: T, init?: ResponseInit) {
  const serialized = serializeBigInt(data);
  return Response.json(serialized, init);
}