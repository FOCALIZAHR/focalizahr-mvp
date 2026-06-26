import s from '../styles.module.css'

const decisiones = [
  '01 · Cómo se ven y cómo los ven. El punto ciego, antes del bono.',
  '02 · Quién está dónde en el mapa del talento. Cada persona, no solo la cúpula.',
  '03 · Quién domina su cargo. Y quién está pagado para hacerlo.',
  '04 · Quién aspira y quién ya tiene un pie afuera. Movilidad y riesgo, separados.',
  '05 · Quién puede suceder a quién. Y qué sillas se vacían si lo activas.',
  '06 · Qué bono se aprueba con respaldo. Y cuál llega a tribunales.',
]

const etapas = [
  { num: '01', name: 'Medir', key: false, hace: 'Evaluación 360 + metas, sin carga operativa.', resuelve: 'Llega a toda la fuerza laboral por correo corporativo, correo personal y WhatsApp — no solo a quien tiene correo de empresa.' },
  { num: '02', name: 'Mapear', key: true, hace: 'Cuatro matrices clasifican a cada persona.', resuelve: 'Toda la empresa mapeada desde el día uno, no solo la cúpula.' },
  { num: '03', name: 'Calibrar', key: false, hace: 'Gobernanza con justificación obligatoria.', resuelve: 'Cada decisión queda con rastro auditable y código QR.' },
  { num: '04', name: 'Suceder', key: true, hace: 'Sucesión que valida dominio y anticipa la cascada.', resuelve: 'Antes de promover, ves cuántas sillas se vacían.' },
  { num: '05', name: 'Desarrollar', key: false, hace: 'Plan desde la brecha, atado a meta de negocio.', resuelve: 'El desarrollo deja de ser un PDF, se vuelve compromiso.' },
  { num: '06', name: 'Decidir en pesos', key: false, hace: 'El talento en el estado de resultados.', resuelve: 'El bono se aprueba con respaldo, no con sospecha.' },
]

export function BloqueCiclo() {
  return (
    <div className={s.sectionWide}>
      <div className={s.containerWide}>
        <span className={s.eyebrow}>Cómo funciona</span>

        <h2 className={s.cycleTitle}>
          Un dato entra una vez. Y se vuelve la base de{' '}
          <span
            className={s.tooltipTerm}
            tabIndex={0}
            role="button"
            aria-label="Las seis decisiones encadenadas"
          >
            <span className={s.tooltipTermInner}>seis decisiones</span>
            <span className={s.tooltipPopup} role="tooltip">
              <span className={s.tooltipLabel}>Las seis decisiones</span>
              <ul className={s.tooltipList}>
                {decisiones.map((d) => {
                  const [num, ...rest] = d.split(' · ')
                  return (
                    <li key={num} className={s.tooltipItem}>
                      <span className={s.tooltipNum}>{num}</span>
                      <span>{rest.join(' · ')}</span>
                    </li>
                  )
                })}
              </ul>
            </span>
          </span>{' '}
          con evidencia.
        </h2>

        <p className={s.cycleLead}>
          Seis decisiones encadenadas que en otros sistemas viven en módulos separados. Aquí nacen del mismo dato y se sostienen unas a otras. <em>Cada una resuelve algo concreto:</em>
        </p>

        <div className={s.cycle}>
          <div className={s.cycleTrack} aria-hidden="true" />
          <ul className={s.cycleGrid}>
            {etapas.map((e) => (
              <li key={e.num} className={`${s.stage} ${e.key ? s.stageKey : ''}`}>
                <span className={s.stageNum}>{e.num}</span>
                <div className={s.stageMarker} aria-hidden="true" />
                <div className={s.stageName}>{e.name}</div>
                <div className={s.stageDo}>{e.hace}</div>
                <div className={s.stageSolve}>{e.resuelve}</div>
              </li>
            ))}
          </ul>
          <p className={s.cycleLoop}>
            Y vuelve al inicio: lo que se decide en la etapa seis se vuelve a <em>medir</em> en el ciclo siguiente.
          </p>
        </div>
      </div>
    </div>
  )
}
