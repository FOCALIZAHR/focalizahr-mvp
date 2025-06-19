// src/lib/campaignCache.ts
// Utilidades para gestión de caché de tipos de campaña

// NOTA: Esta función está diseñada para ser llamada desde el lado del servidor,
// por ejemplo, si un administrador cambia un tipo de campaña.
export function invalidateCampaignTypesCache() {
  // Por ahora, esta función podría estar vacía o tener un console.log
  // ya que el 'campaignTypesCache' está definido localmente en el archivo de la API.
  // El objetivo principal es sacarla de 'route.ts'.
  console.log('Cache de tipos de campaña invalidado (función placeholder).');
}

// Función adicional para el futuro si necesitamos más gestión de caché
export function getCacheStatus() {
  return {
    lastCleared: new Date(),
    status: 'active'
  };
}