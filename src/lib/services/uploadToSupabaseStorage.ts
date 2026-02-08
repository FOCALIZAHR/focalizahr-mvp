// ════════════════════════════════════════════════════════════════════════════
// UPLOAD TO SUPABASE STORAGE
// src/lib/services/uploadToSupabaseStorage.ts
// ════════════════════════════════════════════════════════════════════════════
// Helper para subir archivos al bucket 'calibration-audits' en Supabase Storage
// El bucket YA EXISTE en el proyecto Supabase
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'calibration-audits'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase URL or key not configured')
  }

  return createClient(url, key)
}

/**
 * Sube un archivo PDF al bucket de calibración en Supabase Storage
 * @param fileName Nombre del archivo (ej: "calibration-abc123-1706000000.pdf")
 * @param buffer Buffer del PDF
 * @returns URL pública del archivo
 */
export async function uploadToSupabaseStorage(
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (error) {
    console.error('[Storage] Upload error:', error)
    throw new Error(`Error subiendo PDF: ${error.message}`)
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return data.publicUrl
}
