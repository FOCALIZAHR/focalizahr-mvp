# FOCALIZAHR — MAESTRO DE PRODUCTOS

> Documento único y autocontenido. No es un índice — cada producto tiene su contenido completo acá mismo, sin necesidad de abrir otro archivo. El link a la ficha técnica al final de cada entrada es solo para quien quiera file:line, no es requisito para entender el producto.
>
> Fuente: las 15 fichas técnicas de `.claude/FICHA_PRODUCTOS/`, vía sus resúmenes verificados en README.md y, donde el resumen no traía diferenciador, vía las secciones DIFERENCIADORES y "Por qué importa" de la ficha correspondiente. **Las 16 entradas (15 productos + meta-producto) están completas y verificadas contra su ficha técnica: no queda ningún diferenciador pendiente.** No se inventó ninguno.

---

## Qué es FocalizaHR

El sistema de signos vitales del talento organizacional: mide en continuo, cruza todas las fuentes de datos a la vez, y avisa cuando algo se sale de rango — en vez de esperar la foto del próximo ciclo. No es software de RRHH ni una herramienta de encuestas: es la primera vez que un CEO puede ver el estado de su talento con evidencia, como ve el estado de su tesorería.

**Cadena de valor:** Pulso/Experiencia (motor fundacional) → módulos de inteligencia (Performance / Metas / Onboarding / Exit / Ambiente Sano / EX Clima) → capas derivadas (Workforce / Efficiency / Sucesión / TAC / P&L Talent) + infraestructura transversal (Comunicaciones / Benchmark / Descriptores) → Capa de Estrategia (cockpit ejecutivo) que funde todo para el C-level.

---

## Meta-producto

### Capa de Estrategia (Cockpit Ejecutivo)

**Qué es:** El tablero único donde el CEO ve Workforce + Efficiency + Metas + Executive Hub fundidos en una sola vista, filtrado por jerarquía — cada gerente ve solo lo suyo, con accountability en cascada.

**Qué hace:** Empaqueta y sintetiza lo que los demás módulos ya calculan (70% packaging+glue sobre datos existentes, 30% síntesis nueva propia del cockpit).

**Por qué es distinto:** Es el único punto donde toda la inteligencia de talento converge en una sola pantalla para el CEO, sin que tenga que entrar módulo por módulo.

**Estado:** No vender "acceso filtrado por gerente" todavía — depende de cerrar la auditoría RBAC pendiente en el backlog. Sin eso resuelto, el filtrado jerárquico no está garantizado.

**Detalle técnico:** → `producto_capa_estrategia_cockpit.md`

---

## Los 15 productos

### 1 · Pulso / Experiencia

**Qué es:** El motor fundacional de encuestas de toda la plataforma. FUNDACIONAL — cualquier producto que necesita levantar percepción corre sobre este motor.

**Qué hace:**
- Administra campañas, preguntas y respuestas, normalizando cada respuesta a un score comparable (`Response.normalizedScore`).
- Torre de Control con 3 niveles de monitoreo e IA predictiva sobre el avance de la campaña (`useCampaignMonitor`, ~27 paneles en vivo).

**Por qué es distinto:** Un motor, muchos productos — no hay un motor de encuestas por producto, hay un producto por lente sobre el mismo motor.

**Estado:** Vivo.

**Detalle técnico:** → `project_pulso_experiencia_inventario_producto.md`

---

### 2 · Performance

**Qué es:** El módulo más grande del ecosistema de talento — la evaluación 360° que alimenta a Sucesión, Metas, Talent Intelligence y P&L Talent.

**Qué hace:**
- Evaluación 360° ponderada por fuente (auto 0% / jefe 60% / pares 25% / ascendente 15%), con score híbrido y "Time Travel" para ver el estado en cualquier punto del ciclo.
- RoleFit con tope (capped) que mide dominio real del cargo, alimentando el 9-Box automático.
- Talent Intelligence: cuadrantes de movilidad y riesgo con SLA por cuadrante.
- Calibración con auditoría PDF + QR firmado y detección de sesgo del evaluador.

**Por qué es distinto:** No es un 360 más: es una máquina de decisiones en cadena — una sola captura de datos alimenta 9-Box, RoleFit, movilidad, riesgo, sucesión y compensación. El self al 0% ataca de raíz la inflación de la autoevaluación, y la calibración es defendible cuando alguien impugna una nota.

**Estado:** Vivo. Deudas conocidas: falta `approvedBy` en el flujo de aprobación, el PDF de calibración no está encriptado a nivel de app, y el estilo del evaluador puede cambiar a mitad de ciclo sin control.

**Detalle técnico:** → `project_performance_inventario_producto.md`

---

### 3 · Metas

**Qué es:** El módulo que cruza el cumplimiento real de objetivos con la evaluación de desempeño de la misma persona.

**Qué hace:**
- Detecta incoherencias entre lo que la evaluación dice y lo que el resultado real muestra.
- "Time Travel" para ver el estado de una meta en cualquier punto del ciclo.
- Cascada de metas por reglas (de empresa a área a individuo).
- Clasifica a cada persona en 4 cuadrantes según cruce evaluación × cumplimiento.

**Por qué es distinto:** No es un tracker de OKR: es un detector de incoherencias organizacionales — dónde la evaluación de desempeño no coincide con el resultado real entregado, que es la contradicción más cara y menos visible de una empresa. El Time Travel es real: un ciclo cerrado no cambia retroactivamente.

**Estado:** Vivo. Deudas conocidas: la UI de "Solicitar Cierre" está rota (un prop mal pasado), y 6 endpoints auxiliares no tienen `hasPermission`.

**Detalle técnico:** → `project_metas_inventario_producto.md`

---

### 4 · Sucesión

**Qué es:** El módulo que convierte el plan de sucesión de spreadsheet estático en un pipeline que se revalida solo. Consumidor directo de Performance.

**Qué hace:**
- Readiness en 4 niveles automáticos.
- `DiagnosisEngine` con 10 casos diferenciales que explican por qué un sucesor está o no listo.
- Detecta efecto dominó (qué otras posiciones quedan expuestas si se mueve una persona clave).
- Mide bench strength (profundidad real del banco de sucesores).

**Por qué es distinto:** Radar de continuidad con urgencia, no un organigrama que se actualiza una vez al año. Las sugerencias de sucesor tienen rigor verificable (RoleFit + 9-Box + aspiración declarada), no la intuición de quien llena la planilla, y lo discrecional queda marcado como discrecional.

**Estado:** Vivo. Deudas conocidas: `create-pdi` está marcado DEPRECATED, y quedan logs de debug en `critical-positions/[id]`.

**Detalle técnico:** → `project_succession_inventario_producto.md`

---

### 5 · Workforce Planning

**Qué es:** La capa derivada (sin tablas propias) que cruza a cada persona con su cargo y con su exposición a la IA.

**Qué hace:**
- `EnrichedEmployee` con 28 campos cruzados por persona.
- Exposición a IA vía `focalizaScore`.
- 9 detectores automáticos (riesgo, redundancia, adopción, etc.) con salida en cifras.
- Retención priorizada por persona y presupuesto de dotación en 5 pasos.
- UI Cinema Mode completa.

**Por qué es distinto:** Traduce el riesgo de IA a pesos — inercia de capital atrapado y FTEs liberables — en vez de entregar un score de exposición abstracto que nadie sabe accionar. El presupuesto de dotación usa finiquitos reales, no estimaciones.

**Estado:** Vivo. Deudas conocidas: TabBenchmarks y el Simulador siguen como placeholder, y `exposure_ia` todavía no tiene benchmark de mercado.

**Detalle técnico:** → `project_workforce_inventario_producto.md`

---

### 6 · Efficiency Hub

**Qué es:** La capa narrativa que se monta sobre Workforce para convertir sus datos en decisiones accionables para el CEO.

**Qué hace:**
- 9 lentes (L1-L9), cada uno un ángulo de decisión distinto sobre la misma data de Workforce.
- Carrito de decisiones para el CEO, respaldado por una tabla `EfficiencyPlan`.
- Molde narrativo de 4 actos por lente, con business case exportable.

**Por qué es distinto:** Entrega ahorro por mes, inversión requerida y payback — la forma en que un comité ejecutivo realmente aprueba algo — y nueve ángulos financieros distintos sobre la misma dotación. El business case se exporta al directorio sin nombres, agrupado por familia de cargos.

**Estado:** Parcial. Deudas conocidas: el lente L6 está congelado, L8 se fusionó con otro, L3 usa un fallback de clima, y el filtrado por AREA_MANAGER quedó diferido.

**Detalle técnico:** → `project_efficiency_inventario_producto.md`

---

### 7 · TAC (Talent Action Center)

**Qué es:** El centro de acción operacional sobre el talento — distinto de P&L Talent, que es análisis; TAC es ejecución.

**Qué hace:**
- Dos pilares: por gerencia (6 patrones detectados) y por persona (treemap + acciones masivas).
- Dispara comités y correos directamente desde la pantalla.
- `IntelligenceInsight` audita cada acción tomada.
- Cruce Exit × Riesgo para priorizar sobre quién actuar primero.

**Por qué es distinto:** Diagnóstico a acción en un click: dispara comités y correos desde la misma pantalla donde se ve el problema, en vez de terminar en un PDF que nadie ejecuta. Cada acción queda auditable con deduplicación y medición programada a 180 días.

**Estado:** Vivo. Deuda conocida: el análisis cross-ciclo todavía no está implementado.

**Detalle técnico:** → `project_tac_inventario_producto.md`

---

### 8 · P&L Talent / Cascada de la Verdad

**Qué es:** El estado de resultados del talento — traduce el desempeño real de las personas a pesos chilenos, para que el CEO decida con el mismo rigor con que decide cualquier otra línea del P&L. Vive en el Executive Hub. Es una capa derivada: no tiene tabla propia, calcula on-demand sobre PerformanceRating + Employee + salario real de la empresa.

**Qué hace:**
- Calcula la brecha productiva: cuánto pierde la empresa cada mes por personas bajo el umbral de dominio de su cargo (75% RoleFit), usando el salario real configurado por la empresa, no un promedio de mercado.
- Calcula el semáforo legal: para personas en bajo rendimiento sostenido, proyecta el costo de un finiquito hoy (Art. 163/172, tope 90 UF) y lo clasifica por urgencia según cuánto tiempo llevan en esa condición.
- Entrega una síntesis ejecutiva de un diagnóstico dominante (¿liderazgo, concentración en una gerencia, antigüedad senior, o selección reciente?) en vez de una lista de números sueltos.
- Perfila el riesgo de cada persona crítica cruzando antigüedad, impacto en su gerencia, si es líder, y si tiene sucesor listo.

**Por qué es distinto:** Es el único módulo del ecosistema que pone el desempeño en pesos, no en notas. Donde otros sistemas muestran un score, P&L Talent muestra el impacto financiero y el pasivo legal de no actuar, con la fórmula del finiquito chileno real, no una estimación genérica. Distinto de TAC: uno analiza, el otro ejecuta.

**Estado:** Vivo, capa derivada activa. Depende del ciclo de Performance (RoleFit) + SalaryConfigService.

**Detalle técnico:** → `project_pltalent_inventario_producto.md`

---

### 9 · Exit Intelligence

**Qué es:** El registro y análisis de cada salida de la empresa, con foco en detectar patrones antes de que se repitan.

**Qué hace:**
- Registro estructurado de salidas + EIS Score (0-100) por caso.
- 6 alertas automáticas, incluida alerta Ley Karin con ventana de 24 horas.
- Correlación con Onboarding (si la persona tuvo una entrada difícil) y con retención.
- 3 tablas propias, UI completa con ~50 componentes.

**Por qué es distinto:** Correlación con Onboarding única en el mercado, más el circuito de alerta Ley Karin — ningún competidor cruza la salida con la entrada de la misma persona.

**Estado:** Vivo. Deudas conocidas: 2 alertas quedaron diferidas para una fase posterior, y el SLA de respuesta es estático (no se ajusta por severidad).

**Detalle técnico:** → `project_exit_inventario_producto.md`

---

### 10 · Onboarding Intelligence

**Qué es:** El gemelo predictivo de Exit — en vez de mirar por qué se fue alguien, predice quién está en riesgo de irse desde el primer día.

**Qué hace:**
- Journey de 4 hitos (Día 1 / Día 7 / Día 30 / Día 90) siguiendo el modelo Bauer 4C.
- EXO Score que resume la salud del proceso de entrada.
- 6 alertas proactivas con SLA dinámico (se ajusta según severidad).
- ROI comparado entre casos gestionados vs. ignorados.
- UI completa en formato Pipeline Kanban.

**Por qué es distinto:** Predictivo, no descriptivo: estima el riesgo de fuga desde el día 1, no el día de la renuncia, que es cuando el resto de los sistemas se entera. La alerta ignorada hoy es la autopsia de Exit mañana — ambos módulos comparten la evidencia, así que el costo de no actuar queda demostrado, no argumentado.

**Estado:** Vivo. Deuda conocida: todavía no tiene Cinema Mode ni estructura de 5 actos, a diferencia de otros módulos ya migrados a ese formato.

**Detalle técnico:** → `project_onboarding_inventario_producto.md`

---

### 11 · Ambiente Sano (Compliance / Ley Karin)

**Qué es:** El módulo más grande de la plataforma — convierte la encuesta obligatoria de riesgo psicosocial en un sistema de detección preventiva.

**Qué hace:**
- Safety Score en 6 dimensiones + ISA (0-100), combinando voz estructurada, voz libre analizada por LLM, y convergencia entre ambas.
- Convergencia de 3 motores distintos para confirmar una señal antes de escalarla.
- 7 alertas con SLA propio.
- 11 intervenciones respaldadas por evidencia científica.
- Cinema Mode con 10 secciones.

**Por qué es distinto:** Compliance predictivo — desenmascara el "teatro de cumplimiento" (cuando el puntaje se ve bien pero el texto libre dice otra cosa), algo que ningún competidor detecta.

**Estado:** Vivo. Nota: la deuda de tokens que figuraba en documentación previa ya está resuelta en el código — el documento de diseño estaba desactualizado, no el producto.

**Detalle técnico:** → `project_ambientesano_inventario_producto.md`

---

### 12 · Benchmark System v2.0

**Qué es:** La capa que le permite a cualquier módulo responder "¿cómo estamos comparados con el mercado?" sin construir esa comparación de cero, y sin arriesgar la confidencialidad de ninguna empresa. Sin página propia — vive embebido dentro de otros productos.

**Qué hace:**
- Agrega mensualmente los datos de todos los clientes por país, industria, tamaño de empresa y tipo de métrica, y calcula estadísticas de distribución (promedio, mediana, percentiles).
- Cuando un módulo pide un benchmark, busca primero el nivel más específico posible, y si no hay suficiente data cae automáticamente a un nivel más general — nunca devuelve "sin datos" si existe algún nivel con información.
- Nunca expone una comparación si detrás hay menos de 3 empresas distintas.
- Traduce el percentil a una conclusión ejecutiva lista para leer, no solo el número crudo.

**Por qué es distinto:** Compara sin exponer — el umbral de privacidad es una regla dura del motor, no una nota legal.

**Estado:** Infraestructura activa para onboarding_exo y performance_rolefit. Exit, clima y exposición a IA están definidos pero en estado stub — no prometer esos benchmarks todavía. Deudas conocidas: falta `hasPermission` en el endpoint principal, y el CRON de agregación no está en `vercel.json`.

**Detalle técnico:** → `project_benchmark_inventario_producto.md`

---

### 13 · Comunicaciones 3.0

**Qué es:** El backbone de envíos multicanal de toda la plataforma. No tiene pantalla propia — es infraestructura headless que garantiza que cualquier invitación, recordatorio o notificación llegue a destino, por el canal correcto, sin perderse ni duplicarse.

**Qué hace:**
- Encola cada mensaje en una cola unificada con 6 estados, con un dispatcher resiliente que procesa en lotes, recupera mensajes que quedaron a medias tras una caída, y reintenta con backoff.
- Decide el canal por persona con una regla fija: correo primero, WhatsApp si no hay correo.
- Resuelve el teléfono de contacto con hasta 4 estrategias según el módulo.
- Administra el consentimiento de WhatsApp (opt-in real por botón o captura de correo en dos pasos).
- Escala automáticamente de correo a WhatsApp cuando alguien no responde y ya dio su consentimiento.

**Por qué es distinto:** Llega a la dotación que nunca tuvo correo corporativo, con el mismo nivel de trazabilidad y consentimiento que el correo. Un solo carril: todos los productos lo comparten.

**Estado:** Gates A/B/C sellados. Bloqueadores de go-live real: WhatsApp en modo simulación (no envía real hasta activar credenciales de producción), aprobación de Meta pendiente para el template de escalamiento, y el scheduler de reintentos (Capa 3) aún no conectado en producción.

**Detalle técnico:** → `project_comunicaciones_inventario_producto.md`

---

### 14 · Descriptores (Occupation / RoleFit)

**Qué es:** La identidad ocupacional de cada cargo — el cimiento sobre el que se construye Workforce Planning.

**Qué hace:**
- `OccupationResolver v3`, con resolución heurística y por LLM (Haiku) para mapear cargos.
- `JobDescriptor` editable por el cliente.
- Exposición a IA calculada por tarea (índice IPI), no por cargo genérico.
- Basado en la base O*NET.

**Por qué es distinto:** Estándar O*NET aterrizado a Chile/LATAM — traduce nombres de cargo locales, que nunca calzan con una taxonomía global, a una identidad ocupacional con exposición a IA. El resolver es híbrido y económico: heurística primero, LLM solo donde hace falta y con cuota controlada. El descriptor es dato, no documento.

**Estado:** Parcial. Deudas conocidas: el componente visual `RoleCardBento` no está resuelto, ~17 cargos quedan como UNCLASSIFIED, y faltan hooks de integración.

**Detalle técnico:** → `project_descriptores_inventario_producto.md`

---

### 15 · EX Clima

**Qué es:** El módulo de clima y engagement que no se queda en el score — audita si la acción que tomó el jefe después de la encuesta realmente funcionó.

**Qué hace:**
- Engagement Index + 8 drivers de impacto.
- Mide el impacto a nivel de cada reactivo individual (pregunta), no solo por dimensión, usando Kendall's Tau-c con lógica de "walk-up" jerárquico.
- Calcula severidad por la media de las respuestas (no por el % de respuestas favorables, que es más fácil de maquillar).
- Cascada narrativa dinámica de 1 a 5 actos según la gravedad del caso.
- 127 narrativas de intervención distintas.
- Matriz de efectividad en 4 cuadrantes para medir si el plan de acción realmente cambió algo.

**Por qué es distinto:** Audita si la acción del jefe funcionó — ningún competidor mide efectividad de la intervención, solo mide el clima antes y después sin conectar causa y efecto.

**Estado:** Gate 5D en curso. Deudas conocidas y relevantes para lo que se puede vender hoy: las 127 narrativas y los umbrales de severidad están marcados PROVISIONAL en el código (pendientes de calibración con cliente real), y el dispatcher de acciones tiene 2 de 4 destinos todavía sin conectar. No vender la profundidad narrativa de este módulo como terminada.

**Detalle técnico:** → `project_exclima_inventario_producto.md`

---

## Gate 0 — verificaciones de estado vivo (sustento de este documento)

- Gate 0 calibración+performance — nineBox sí recalcula; híbrido+TimeTravel+pesos OK; plan de acción de calibrador no-jefe queda latente; estilo evaluador en Efficiency L4 cambia intra-ciclo.
- Gate 0 base madre Desempeño+Metas — correo corporativo vivo, WhatsApp en modo simulación (Gate E). Informe de calibración PDF+QR en Supabase, sin encriptar a nivel app, sin `approvedBy`. Salario = real de la empresa por cargo, no estimado.
- Gate 0 Metas estado vivo — filtrado jerárquico vivo, 6 endpoints auxiliares sin `hasPermission`, UI de "Solicitar Cierre" rota, 4 cuadrantes completos.

---

*Fuente: README.md de `.claude/FICHA_PRODUCTOS/` (jul-2026), verificado contra las 15 fichas técnicas. Las 16 entradas están completas: cada campo "Por qué es distinto" sale de la sección DIFERENCIADORES o "Por qué importa" de su ficha técnica, sin ningún diferenciador pendiente y sin ninguno inventado.*
