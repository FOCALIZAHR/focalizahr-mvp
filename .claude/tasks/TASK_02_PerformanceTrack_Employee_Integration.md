# TASK 2: PerformanceTrack + Employee Integration

Prerrequisito: Task 1 completada.

Tu objetivo es agregar clasificación performanceTrack derivado de standardJobLevel:

- Extender PositionAdapter con mapToTrack() y classifyPosition()
- Schema Employee (7 campos nuevos, NO tocar seniorityLevel/managerLevel legacy)
- Schema Participant (employeeId FK + snapshot de clasificación)
- Enum EmployeeChangeType (agregar JOB_LEVEL_CLASSIFICATION, TRACK_CLASSIFICATION)
- PerformanceTrackValidator para detectar anomalías (opcional)
- Integrar con EmployeeSyncService

Mapeo: EJECUTIVO (gerente_director) | MANAGER (subgerente, jefe, supervisor) | COLABORADOR (resto)

Consulta el plan completo en: `.claude/tasks/PLAN_IMPLEMENTACION_POSITIONADAPTER_v1_2.md` (Secciones 11-12)
