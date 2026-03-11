Fix DominoResolutionModal — mostrar búsqueda libre cuando posicionDejaId = null
Problema: Cuando nivel2.posicionDejaId es null (cargo no registrado como CriticalPosition), las opciones 1 y 2 están ocultas con {hasPositionId && ...}. El usuario solo ve "Búsqueda externa" y "Eliminar posición".
Fix: La opción de buscar un reemplazante interno debe estar SIEMPRE disponible, independiente de si hay una CriticalPosition asociada.
En DominoResolutionModal.tsx, cambiar la lógica de visibilidad:
typescript// ELIMINAR el guard hasPositionId en opciones 1 y 2
// Opción 1 — Seleccionar candidato interno
// ANTES: {hasPositionId && <OptionCard tipo COVERED ...>}
// DESPUÉS: siempre visible

// Comportamiento al seleccionar opción 1:
// - Si posicionDejaId existe → fetch /candidates (lista de nominados)
// - Si posicionDejaId es null → mostrar EmployeeSearchInput directamente

// Opción 2 — Buscar otro empleado (EmployeeSearchInput)
// ANTES: {hasPositionId && <OptionCard tipo MANUAL ...>}
// DESPUÉS: siempre visible
Fix adicional en /api/succession/employees: eliminar el early return cuando no hay departmentId, para que la búsqueda libre funcione sin filtro de departamento:
typescript// ELIMINAR:
if (!departmentId) {
  return NextResponse.json({ success: true, data: [] })
}
// departmentId pasa a ser filtro opcional
Sin cambios en schema ni migration. Solo lógica de visibilidad en el modal y el endpoint de búsqueda.