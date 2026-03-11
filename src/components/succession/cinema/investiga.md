Investigar: DominoResolutionModal — lista "Sin elegibles" en opción 1
Síntoma observado:
Al nominar a Catalina (cargo NO crítico), el modal de backfill abre correctamente pero la opción "Seleccionar candidato interno" muestra inmediatamente "Sin elegibles disponibles en este cargo".
Logs completos del servidor:
POST /api/succession/critical-positions/cmmhffz35000da0otq6qb7ne7/candidates 201 in 24383ms
GET  /api/succession/critical-positions/cmmhffz35000da0otq6qb7ne7 200 in 4090ms
GET  /api/succession/candidates/cmmkfm80n000h33wp3xb3xfdd/domino 200 in 3223ms
Lo que llama la atención: Después del GET /domino no hay ninguna llamada a /suggestions ni a /candidates. El modal abre con lista vacía sin intentar fetch.
Hipótesis a verificar:
¿Qué valor tiene nivel2.posicionDejaId cuando el nominado NO es incumbentId de ninguna CriticalPosition? ¿Es null?
En handleSelectCovered del modal, ¿hay un guard que aborta el fetch si posicionDejaId es null o falsy?
¿La condición que muestra "Sin elegibles" se evalúa antes del fetch o después?
Por favor: Revisar el código real de DominoResolutionModal.tsx y el response real del endpoint /domino para este caso, y reportar qué está pasando exactamente antes de proponer cualquier fix.
