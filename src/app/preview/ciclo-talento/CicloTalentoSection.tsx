'use client'

import { useEffect, useRef } from 'react'
import s from '../confidencial/styles.module.css'
import c from './cicloTalento.module.css'

export default function CicloTalentoSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const visibleClass = s.visible

    // Reveal genérico (reutiliza el patrón existente)
    const revealEls = root.querySelectorAll<HTMLElement>(`.${s.reveal}`)
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(visibleClass)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    )
    revealEls.forEach((el) => revealObserver.observe(el))

    // Animación escalonada de los 6 nodos del ciclo
    const stageItems = root.querySelectorAll<HTMLElement>('[data-cycle-stages] li')
    const stagesObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stageItems.forEach((li, i) => {
              window.setTimeout(() => li.classList.add(visibleClass), i * 140)
            })
            stagesObserver.disconnect()
          }
        })
      },
      { threshold: 0.3 },
    )
    if (stageItems.length) stagesObserver.observe(stageItems[0])

    // Animación escalonada de los 4 hallazgos
    const findingItems = root.querySelectorAll<HTMLElement>('[data-findings] [data-finding]')
    const findingsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            findingItems.forEach((el, i) => {
              window.setTimeout(() => el.classList.add(visibleClass), i * 180)
            })
            findingsObserver.disconnect()
          }
        })
      },
      { threshold: 0.25 },
    )
    if (findingItems.length) findingsObserver.observe(findingItems[0])

    return () => {
      revealObserver.disconnect()
      stagesObserver.disconnect()
      findingsObserver.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef}>

      {/* ─── SEPARADOR DE ACTO ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ACTO II — LA CATEGORÍA PLANTADA                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="ciclo-talento" className={s.sectionCompact}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>La categoría</span>
          <p className={c.categoryStatement}>
            Otros digitalizaron los procesos de personas.{' '}
            <span className={s.gradient}>FocalizaHR conectó ese talento con el negocio.</span>
          </p>
        </div>
      </section>

      {/* ─── SEPARADOR DE ACTO ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ACTO III — LA SUITE COMO FLUJO                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={s.sectionWide}>
        <div className={`${s.containerWide} ${s.reveal}`}>
          <span className={s.contextLabel}>Cómo funciona</span>
          <h2 className={s.sectionTitle}>
            Un dato entra una vez.<br />
            Y se vuelve la base de{' '}
            <span
              className={c.tooltipTerm}
              tabIndex={0}
              role="button"
              aria-label="Las seis decisiones encadenadas"
            >
              <span className={s.gradient}>seis decisiones</span>
              <span className={c.tooltipPopup} role="tooltip">
                <span className={c.tooltipLabel}>Las seis decisiones</span>
                <ul className={c.tooltipList}>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>01</span>
                    <span>
                      <span className={c.tooltipDecision}>Evaluación 360</span>
                      {' · cómo se ven y cómo los ven.'}
                    </span>
                  </li>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>02</span>
                    <span>
                      <span className={c.tooltipDecision}>9-Box</span>
                      {' · posición en el mapa de talento.'}
                    </span>
                  </li>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>03</span>
                    <span>
                      <span className={c.tooltipDecision}>RoleFit</span>
                      {' · dominio del cargo.'}
                    </span>
                  </li>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>04</span>
                    <span>
                      <span className={c.tooltipDecision}>Movilidad y riesgo</span>
                      {' · sucesores naturales y fugas.'}
                    </span>
                  </li>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>05</span>
                    <span>
                      <span className={c.tooltipDecision}>Sucesión</span>
                      {' · validación de dominio y cascada.'}
                    </span>
                  </li>
                  <li className={c.tooltipItem}>
                    <span className={c.tooltipNum}>06</span>
                    <span>
                      <span className={c.tooltipDecision}>Compensación</span>
                      {' · bono anclado al resultado.'}
                    </span>
                  </li>
                </ul>
              </span>
            </span>
            {' '}con evidencia.
          </h2>

          {/* CICLO DE 6 ETAPAS */}
          <div className={c.cycle}>
            <div className={c.cycleTrack} aria-hidden="true" />
            <ul className={c.cycleGrid} data-cycle-stages>
              <li className={`${c.stage} ${s.reveal}`}>
                <span className={c.stageNum}>01</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Medir</div>
                <div className={c.stageDesc}>Evaluación 360 y cumplimiento de metas, sin carga operativa</div>
              </li>
              <li className={`${c.stage} ${c.stageKey} ${s.reveal}`}>
                <span className={c.stageNum}>02</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Mapear</div>
                <div className={c.stageDesc}>Cuatro matrices clasifican a toda la empresa</div>
              </li>
              <li className={`${c.stage} ${s.reveal}`}>
                <span className={c.stageNum}>03</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Calibrar</div>
                <div className={c.stageDesc}>Gobernanza con justificación y auditoría</div>
              </li>
              <li className={`${c.stage} ${c.stageKey} ${s.reveal}`}>
                <span className={c.stageNum}>04</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Suceder</div>
                <div className={c.stageDesc}>Sucesión que valida el dominio y anticipa la cascada</div>
              </li>
              <li className={`${c.stage} ${s.reveal}`}>
                <span className={c.stageNum}>05</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Desarrollar</div>
                <div className={c.stageDesc}>Plan desde la brecha, atado a una meta de negocio</div>
              </li>
              <li className={`${c.stage} ${s.reveal}`}>
                <span className={c.stageNum}>06</span>
                <div className={c.stageMarker} aria-hidden="true" />
                <div className={c.stageName}>Decidir en pesos</div>
                <div className={c.stageDesc}>El talento en el estado de resultados, y la acción que sale por correo</div>
              </li>
            </ul>
            <p className={c.cycleLoop}>
              Y vuelve al inicio: lo que se decide en la etapa seis se vuelve a <em>medir</em> en el siguiente ciclo.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SEPARADOR DE ACTO ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ACTO IV — LA INTELIGENCIA                        */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={s.sectionWide}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>La inteligencia</span>
          <h2 className={s.sectionTitle}>
            No vemos lo que pasa.<br />
            Vemos <span className={s.gradient}>lo que no cuadra</span>.
          </h2>
          <p className={c.intelligenceLead}>
            La mayoría de los sistemas mide el estado de las cosas.
            FocalizaHR mide la distancia entre dos verdades que deberían coincidir.
            Esa distancia es el hallazgo.
          </p>
        </div>

        <div className={`${s.containerNarrow} ${c.findingsWrap}`} data-findings>

          {/* HALLAZGO 1 — PUNTO CIEGO */}
          <div className={`${c.finding} ${s.reveal}`} data-finding>
            <span className={c.findingContext}>Cómo te ves × cómo te ven</span>
            <h3 className={c.findingTitle}>El punto ciego</h3>
            <p className={c.findingBody}>
              Alguien se ve muy por encima de como lo ve su jefe. O muy por debajo.
              En ambos casos hay una distancia que nadie había puesto sobre la mesa. El sistema la pone.
            </p>
            <p className={c.findingAnchor}>
              La conversación que no sabías que tenías que tener.
            </p>
          </div>

          {/* HALLAZGO 2 — SESGO DE PERCEPCIÓN (con matriz) */}
          <div className={`${c.finding} ${c.findingMatrix} ${s.reveal}`} data-finding>
            <span className={c.findingContext}>Lo que parece × lo que entrega</span>
            <h3 className={c.findingTitle}>El bono sin sustento</h3>
            <p className={c.findingBody}>
              La evaluación dice excelente. El entorno la confirma. Pero las metas no acompañan.
              Es donde se esconde el héroe tóxico: brilla en la foto, no en los números.
            </p>

            {/* MATRIZ DESEMPEÑO × METAS */}
            <div className={c.matrixCard}>
              <div className={c.matrixHeader}>
                <div>
                  <span className={c.matrixTag}>Matriz · desempeño × metas</span>
                  <div className={c.matrixName}>
                    Dominio <span>×</span> Cumplimiento
                  </div>
                </div>
                <div className={c.matrixMeta}>
                  142 colaboradores
                  <br />
                  <span>Ciclo Q1 · simulación</span>
                </div>
              </div>

              {/* Leyenda 360 */}
              <div className={c.colorLegend}>
                <span className={c.colorLegendLabel}>Color del punto · 360</span>
                <span className={c.colorItem}>
                  <span className={`${c.colorRing} ${c.colorRingConfirma}`} />
                  El entorno confirma
                </span>
                <span className={c.colorItem}>
                  <span className={`${c.colorRing} ${c.colorRingNeutral}`} />
                  Sin señal del entorno
                </span>
                <span className={c.colorItem}>
                  <span className={`${c.colorRing} ${c.colorRingContradice}`} />
                  El entorno contradice
                </span>
              </div>

              {/* PLOT */}
              <div className={c.plotFrame}>
                <div className={c.yAxis}>Cumple metas →</div>
                <div className={c.plotInner}>
                  <svg viewBox="0 0 600 360" className={c.plotSvg} role="img" aria-label="Matriz Desempeño × Metas con 142 colaboradores distribuidos en cuatro cuadrantes">
                    {/* Quadrant dividers */}
                    <line x1="300" y1="0" x2="300" y2="360" stroke="rgba(148,163,184,0.1)" strokeWidth="0.5" />
                    <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(148,163,184,0.1)" strokeWidth="0.5" />

                    {/* Quadrant labels en esquinas */}
                    <text x="20" y="28" fill="#64748B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">PERFORMER OCULTO</text>
                    <text x="445" y="28" fill="#22D3EE" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">CONSISTENTE</text>
                    <text x="20" y="350" fill="#64748B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">DOBLE RIESGO</text>
                    <text x="425" y="350" fill="#F59E0B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">SESGO DE PERCEPCIÓN</text>

                    {/* CONSISTENTE (top-right) — anillo cyan */}
                    {[
                      [380, 100], [410, 80], [430, 115], [395, 135], [455, 95],
                      [475, 125], [500, 105], [425, 155], [510, 150], [455, 165],
                      [385, 165], [540, 120], [365, 155],
                    ].map(([x, y], i) => (
                      <circle key={`c-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
                    ))}

                    {/* PERFORMER OCULTO (top-left) — anillo neutral */}
                    {[
                      [180, 120], [220, 100], [155, 155], [200, 140],
                      [245, 130], [115, 160], [175, 80],
                    ].map(([x, y], i) => (
                      <circle key={`po-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                    ))}

                    {/* DOBLE RIESGO (bottom-left) */}
                    {[
                      [120, 265], [155, 250], [195, 280],
                      [80, 300], [225, 290], [140, 310],
                    ].map(([x, y], i) => (
                      <circle key={`dr-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                    ))}

                    {/* SESGO DE PERCEPCIÓN (bottom-right) — anillo ámbar */}
                    {[
                      [375, 250], [425, 265], [395, 295],
                      [465, 255], [505, 280], [510, 320],
                    ].map(([x, y], i) => (
                      <circle key={`sp-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    ))}

                    {/* Featured: María G. con halo */}
                    <circle cx="448" cy="290" r="9" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.4" />
                    <circle cx="448" cy="290" r="5.5" fill="#F59E0B" />
                    <line x1="448" y1="290" x2="448" y2="328" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
                    <text x="448" y="340" fill="#F59E0B" fontSize="10.5" fontWeight="500" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">María G. · RoleFit 82 · Metas 38%</text>
                  </svg>
                  <div className={c.xAxis}>Domina el cargo →</div>
                </div>
              </div>

              {/* Cuadrantes Minto */}
              <div className={c.quadrantsMinto}>
                <div className={`${c.quad} ${c.quadConsistente}`}>
                  <div className={c.quadHeader}>
                    <div className={c.quadName}>Consistente</div>
                    <div className={c.quadCount}>47 personas</div>
                  </div>
                  <div className={c.quadAxes}>Domina el cargo y cumple metas.</div>
                  <p className={c.quadConsequence}>
                    Las dos verdades se mueven juntas. El bono se aprueba con respaldo.
                  </p>
                </div>

                <div className={`${c.quad} ${c.quadOculto}`}>
                  <div className={c.quadHeader}>
                    <div className={c.quadName}>Performer oculto</div>
                    <div className={c.quadCount}>23 personas</div>
                  </div>
                  <div className={c.quadAxes}>No domina el cargo, y aun así cumple metas.</div>
                  <p className={c.quadConsequence}>
                    La nota no refleja lo que el negocio recibe. Se va sin que nadie lo note.
                  </p>
                </div>

                <div className={`${c.quad} ${c.quadSesgo}`}>
                  <div className={c.quadHeader}>
                    <div className={c.quadName}>Sesgo de percepción</div>
                    <div className={c.quadCount}>7 personas</div>
                  </div>
                  <div className={c.quadAxes}>Domina el cargo, el entorno lo confirma, pero las metas no acompañan.</div>
                  <p className={c.quadConsequence}>
                    La distancia entre lo que parece y lo que entrega. El bono sin sustento.
                  </p>
                </div>

                <div className={`${c.quad} ${c.quadDoble}`}>
                  <div className={c.quadHeader}>
                    <div className={c.quadName}>Doble riesgo</div>
                    <div className={c.quadCount}>12 personas</div>
                  </div>
                  <div className={c.quadAxes}>No domina el cargo y no cumple metas.</div>
                  <p className={c.quadConsequence}>
                    Las dos señales coinciden. La conversación que no espera.
                  </p>
                </div>
              </div>
            </div>

            <p className={c.findingAnchor}>
              El bono que el negocio no respalda, antes de aprobarlo.
            </p>

            <p className={c.matrixNote}>
              Y tres matrices más con la misma lógica:{' '}
              <strong>9-Box</strong> (desempeño × potencial),{' '}
              <strong>Riesgo</strong> (dominio × compromiso, donde aparece la fuga de cerebros) y{' '}
              <strong>Movilidad</strong> (dominio × aspiración, donde aparece el pilar técnico que se pierde si se lo fuerza a jefe).
            </p>
          </div>

          {/* HALLAZGO 3 — LÍDER QUE EL PROMEDIO ESCONDE */}
          <div className={`${c.finding} ${s.reveal}`} data-finding>
            <span className={c.findingContext}>El equipo y su jefe</span>
            <h3 className={c.findingTitle}>El líder que el promedio esconde</h3>
            <p className={c.findingBody}>
              Un jefe evalúa a todos parejo y su equipo cumple bajo. Otro protege a su gente con notas infladas.
              El promedio de la empresa los esconde a los dos. El cruce los saca a la luz.
            </p>
            <p className={c.findingAnchor}>
              Patrones de liderazgo. No notas sueltas.
            </p>
          </div>

          {/* HALLAZGO 4 — EFECTO DOMINÓ */}
          <div className={`${c.finding} ${s.reveal}`} data-finding>
            <span className={c.findingContext}>Una promoción no es un movimiento</span>
            <h3 className={c.findingTitle}>El efecto dominó</h3>
            <p className={c.findingBody}>
              Promover a alguien es una cascada. Su silla queda vacía, esa silla también puede ser crítica,
              y quien la cubra deja otro hueco. Antes de mover la ficha, la cadena entera está a la vista.
            </p>
            <p className={c.findingAnchor}>
              Cuántas sillas se vacían, antes de vaciar la primera.
            </p>
          </div>

        </div>
      </section>

      {/* ─── SEPARADOR DE ACTO ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════ */}
      {/* ACTO V — LA CONSECUENCIA                         */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={s.sectionWide}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Donde el CEO vive</span>
          <h2 className={s.sectionTitle}>
            Un diagnóstico que no llega al costo<br />
            ni a la decisión, es teatro.
          </h2>
        </div>

        <div className={`${s.containerWide} ${c.valuePair}`}>

          <div className={`${c.valueBlock} ${s.reveal}`}>
            <div className={c.valueTesla} aria-hidden="true" />
            <span className={c.valueTag}>El estado de resultados del talento</span>
            <h3 className={c.valueHeadline}>El talento, en pesos.</h3>
            <p className={c.valueBody}>
              La brecha de desempeño deja de ser un puntaje y se vuelve una cifra,
              por gerencia, sobre los sueldos reales de la empresa. Y suma el pasivo
              legal que ya existe, con fundamento chileno real, antes de que estalle.
            </p>
            <p className={c.valueWrap}>
              El talento deja de ser un costo opaco y se vuelve <em>una línea legible
              del estado de resultados</em>. El idioma del CFO.
            </p>
          </div>

          <div className={`${c.valueBlock} ${c.valueBlockAction} ${s.reveal}`}>
            <div className={c.valueTesla} aria-hidden="true" />
            <span className={c.valueTag}>El centro de acción</span>
            <h3 className={c.valueHeadline}>Del diagnóstico al clic.</h3>
            <p className={c.valueBody}>
              Cada gerencia llega con un patrón nombrado y su acción al lado:
              agendar el comité, notificar al gerente, con el correo que sale de verdad.
              Y cada acción queda registrada como un compromiso que el sistema vuelve a poner sobre la mesa.
            </p>
            <p className={c.valueWrap}>
              Del diagnóstico a la acción, <em>en un clic</em>.
            </p>
          </div>

        </div>
      </section>

      {/* ─── SEPARADOR DE ACTO ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════ */}
      {/* CIERRE                                           */}
      {/* ═══════════════════════════════════════════════ */}
      <section className={c.closing}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <p className={c.closingLine}>
            Hasta hoy, el talento vivió en la declaración.
          </p>
          <p className={`${c.closingLine} ${c.closingGradient}`}>
            Desde acá, vive en la decisión.
          </p>
        </div>
      </section>

    </div>
  )
}
