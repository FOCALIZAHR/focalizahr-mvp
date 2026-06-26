import { type ReactNode } from 'react'
import s from '../styles.module.css'

type Treemap = { name: string; tone: string; count: number; axes: ReactNode; action: string }

const cuadrantes: Treemap[] = [
  { name: 'Fuga de Talento', tone: s.treemapAmber, count: 23, axes: 'Dominan su cargo. El compromiso ya cayó.', action: '→ Ronda de retención · 23 conversaciones' },
  { name: 'Riesgo de Burnout', tone: s.treemapAmberSoft, count: 17, axes: 'Lo dan todo y no rinde lo esperado.', action: '→ Revisión de carga · 17 revisiones' },
  { name: 'Bajo Rendimiento', tone: s.treemapNeutral, count: 31, axes: 'Ni dominio ni compromiso.', action: '→ Evaluación dirigida · 31 conversaciones' },
  { name: 'Motor del Equipo', tone: s.treemapCyan, count: 42, axes: <strong>Sostienen el negocio. Si no se les nombra, se aburren y se van.</strong>, action: '→ Reconocimiento de equipo · 42 reconocimientos' },
]

const exitBars = [
  { name: 'Fuga de Talento', pct: 64, amber: true },
  { name: 'Riesgo de Burnout', pct: 22, amber: true },
  { name: 'Bajo Rendimiento', pct: 11, amber: false },
  { name: 'Sin cuadrante claro', pct: 3, amber: false },
]

export function BloqueAccionMasiva() {
  return (
    <div className={s.section}>
      <div className={s.container}>
        <span className={s.eyebrow}>Acción que escala</span>
        <h2 className={s.sectionTitle}>Cien personas. La intervención correcta para cada grupo. Un clic.</h2>

        <p className={s.tesis}>
          Actuar sobre mucha gente termina en uno de dos lugares: o se trata a cada uno por separado, que no escala, o se le manda a todos lo mismo, que no sirve. <strong>La acción masiva genérica destruye la pertinencia. La acción una a una destruye la velocidad.</strong>
        </p>
        <p className={s.resolucion}>
          <em>FocalizaHR resuelve la contradicción:</em> <strong>cada cuadrante de riesgo se interviene con la acción que le corresponde</strong>, <em>ejecutada de una vez para todos los que están ahí, con un correo agrupado al gerente del área.</em>
        </p>

        <div className={s.treemapFrame}>
          <div className={s.treemapHeader}>
            <div className={s.treemapTitle}>
              El mapa de acción
              <span>Personas por cuadrante, intervención por grupo</span>
            </div>
            <div className={s.treemapSim}>
              Empresa de ejemplo · 1.200 colaboradores
              <br />
              <em>simulación · datos ilustrativos</em>
            </div>
          </div>

          <div className={s.treemapGrid}>
            {cuadrantes.map((q) => (
              <div key={q.name} className={`${s.treemapQuad} ${q.tone}`}>
                <div className={s.treemapQuadHead}>
                  <div className={s.treemapQuadName}>{q.name}</div>
                  <div className={s.treemapQuadCount}>{q.count}</div>
                </div>
                <p className={s.treemapQuadAxes}>{q.axes}</p>
                <div className={s.treemapQuadAction}>{q.action}</div>
              </div>
            ))}
          </div>

          <p className={s.treemapFooter}>
            <strong>113 personas, cuatro intervenciones, un correo agrupado por gerencia.</strong> Cada acción es la que corresponde a su grupo, no la misma para todos. Y cada una queda registrada como compromiso, con seguimiento a 180 días.
          </p>
        </div>

        <div className={s.exitCross}>
          <span className={`${s.eyebrow} ${s.eyebrowPurple}`}>Aprende de quien se fue</span>
          <h3 className={s.exitTitle}>Lo que costó perder ayer se vuelve la señal que evita perder mañana.</h3>
          <p className={s.exitText}>
            Cuando alguien se va, el sistema cruza sus factores de salida con los cuadrantes de riesgo de quienes siguen. <strong>Si la gente se está yendo por las mismas razones que hoy muestran los que se quedan, no es mala suerte. Es un patrón</strong>. El cruce se ve agregado, sin nombres.
          </p>

          <div className={s.exitViz}>
            {exitBars.map((b) => (
              <div key={b.name} className={s.exitBar}>
                <div className={s.exitBarHead}>
                  <span className={s.exitBarName}>{b.name}</span>
                  <span className={s.exitBarPct}>{b.pct}%</span>
                </div>
                <div className={s.exitBarTrack}>
                  <div
                    className={`${s.exitBarFill} ${b.amber ? s.exitFillAmber : s.exitFillNeutral}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={s.pillAmber}>◇ Caso ilustrativo · No es de un cliente real</div>
          <p className={s.exitFootnote}>
            Salidas de los últimos doce meses, cruzadas con su último cuadrante antes de irse.
          </p>
        </div>

        <p className={s.accionClose}>
          La acción no se evapora. <strong>El sistema te recuerda, a los 180 días, lo que decidiste y te pregunta qué pasó.</strong>
        </p>
        <p className={s.accionCloseSub}>
          Cada decisión se vuelve compromiso medible. Lo que se intervino, queda. Lo que se ignoró, también.
        </p>
      </div>
    </div>
  )
}
