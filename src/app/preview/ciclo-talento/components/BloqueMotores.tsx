import s from '../styles.module.css'

const consistentePts: Array<[number, number]> = [
  [380, 100], [410, 80], [430, 115], [395, 135], [455, 95],
  [475, 125], [500, 105], [425, 155], [510, 150], [455, 165],
  [385, 165], [540, 120], [365, 155],
]
const ocultoPts: Array<[number, number]> = [
  [180, 120], [220, 100], [155, 155], [200, 140],
  [245, 130], [115, 160], [175, 80],
]
const dobleRiesgoPts: Array<[number, number]> = [
  [120, 265], [155, 250], [195, 280],
  [80, 300], [225, 290], [140, 310],
]
const sesgoPts: Array<[number, number]> = [
  [375, 250], [425, 265], [395, 295],
  [465, 255], [505, 280], [510, 320],
]

const estilos = [
  { name: 'Óptima', tone: s.evalCyan, desc: 'Distribución acorde al desempeño real.' },
  { name: 'Indulgente', tone: s.evalAmber, desc: 'Notas infladas frente al resultado.' },
  { name: 'Severa', tone: s.evalPurple, desc: 'Sub-evalúa al equipo pese al resultado.' },
  { name: 'Central', tone: s.evalNeutral, desc: 'Todos en el medio. Decide no decidir.' },
]

export function BloqueMotores() {
  return (
    <div className={s.section}>
      <div className={s.container}>
        <span className={`${s.eyebrow} ${s.eyebrowPurple}`}>La inteligencia</span>
        <h2 className={s.motorsTitle}>
          No vemos lo que pasa.<br />
          Vemos <strong>lo que no cuadra</strong>.
        </h2>
        <p className={s.lead}>
          La mayoría de los sistemas mide el estado de las cosas. FocalizaHR mide la distancia entre dos verdades que deberían coincidir. Esa distancia es el hallazgo.
        </p>

        <div className={s.motorsWrap}>
          {/* Motor 01 */}
          <div className={s.motor}>
            <span className={s.motorContext}>Cómo te ves × cómo te ven</span>
            <h3 className={s.motorTitle}>La empresa entera puede creer que está mejor de lo que está.</h3>
            <p className={s.motorThreat}>
              Cuando una persona se evalúa muy por encima de cómo la ve su jefe, no es solo un dato sobre esa persona. Es una <strong>fractura entre la realidad operativa y la percepción de quienes la operan</strong>. Si pasa una vez, es un caso. Si pasa en una gerencia entera, esa gerencia te está reportando una empresa que no existe.
            </p>
            <p className={s.motorClose}>
              Lo que el CEO no ve: las decisiones que firma todas las semanas están basadas en la imagen que esa gente tiene de sí misma. <strong>Si la imagen y la realidad están desalineadas, el sesgo se traduce a tus decisiones</strong>.
            </p>
          </div>

          {/* Motor 02 · con matriz Hero */}
          <div className={s.motor}>
            <span className={s.motorContext}>Lo que parece × lo que entrega</span>
            <h3 className={s.motorTitle}>Estás firmando bonos por trabajo que el negocio no recibió.</h3>
            <p className={s.motorThreat}>
              La evaluación dice excelente. El entorno la confirma. Pero las metas no acompañan. <strong>El bono se aprueba sobre la nota, no sobre el resultado</strong>. Es donde se esconde el héroe que brilla en la foto y no en los números.
            </p>

            <div className={s.matrixCard}>
              <div className={s.matrixHeader}>
                <div>
                  <span className={s.matrixTag}>Matriz · desempeño × metas</span>
                  <div className={s.matrixName}>Dominio <span>×</span> Cumplimiento</div>
                </div>
                <div className={s.matrixMeta}>
                  Empresa de ejemplo · 142 colaboradores · Ciclo Q1
                  <br />
                  <span>simulación · datos ilustrativos</span>
                </div>
              </div>

              <div className={s.colorLegend}>
                <span className={s.colorLegendLabel}>Color del punto · 360</span>
                <span className={s.colorItem}>
                  <span className={`${s.colorRing} ${s.colorRingConfirma}`} />
                  El entorno confirma
                </span>
                <span className={s.colorItem}>
                  <span className={`${s.colorRing} ${s.colorRingNeutral}`} />
                  Sin señal del entorno
                </span>
                <span className={s.colorItem}>
                  <span className={`${s.colorRing} ${s.colorRingContradice}`} />
                  El entorno contradice
                </span>
              </div>

              <div className={s.plotFrame}>
                <div className={s.yAxis}>Cumple metas →</div>
                <div className={s.plotInner}>
                  <svg viewBox="0 0 600 360" className={s.plotSvg} role="img" aria-label="Matriz Desempeño × Metas con 142 colaboradores en cuatro cuadrantes">
                    <line x1="300" y1="0" x2="300" y2="360" stroke="rgba(148,163,184,0.1)" strokeWidth="0.5" />
                    <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(148,163,184,0.1)" strokeWidth="0.5" />

                    <text x="20" y="28" fill="#64748B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">PERFORMER OCULTO</text>
                    <text x="445" y="28" fill="#22D3EE" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">CONSISTENTE</text>
                    <text x="20" y="350" fill="#64748B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">DOBLE RIESGO</text>
                    <text x="425" y="350" fill="#F59E0B" fontSize="10" fontWeight="500" letterSpacing="2" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">SESGO DE PERCEPCIÓN</text>

                    {consistentePts.map(([x, y], i) => (
                      <circle key={`c-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
                    ))}
                    {ocultoPts.map(([x, y], i) => (
                      <circle key={`po-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                    ))}
                    {dobleRiesgoPts.map(([x, y], i) => (
                      <circle key={`dr-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                    ))}
                    {sesgoPts.map(([x, y], i) => (
                      <circle key={`sp-${i}`} cx={x} cy={y} r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    ))}

                    <circle cx="448" cy="290" r="9" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.4" />
                    <circle cx="448" cy="290" r="5.5" fill="#F59E0B" />
                    <line x1="448" y1="290" x2="448" y2="328" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
                    <text x="448" y="340" fill="#F59E0B" fontSize="10.5" fontWeight="500" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">María G. · RoleFit 82 · Metas 38%</text>
                  </svg>
                  <div className={s.xAxis}>Domina el cargo →</div>
                </div>
              </div>

              <div className={s.quadrantsMinto}>
                <div className={`${s.quad} ${s.quadConsistente}`}>
                  <div className={s.quadHeader}>
                    <div className={s.quadName}>Consistente</div>
                    <div className={s.quadCount}>47</div>
                  </div>
                  <div className={s.quadAxes}>Domina y cumple.</div>
                  <p className={s.quadConsequence}>El bono se aprueba con respaldo.</p>
                </div>
                <div className={`${s.quad} ${s.quadOculto}`}>
                  <div className={s.quadHeader}>
                    <div className={s.quadName}>Performer Oculto</div>
                    <div className={s.quadCount}>23</div>
                  </div>
                  <div className={s.quadAxes}>No domina, y aun así cumple.</div>
                  <p className={s.quadConsequence}>Se va sin que nadie lo note.</p>
                </div>
                <div className={`${s.quad} ${s.quadSesgo}`}>
                  <div className={s.quadHeader}>
                    <div className={s.quadName}>Sesgo de Percepción</div>
                    <div className={s.quadCount}>7</div>
                  </div>
                  <div className={s.quadAxes}>Domina, el entorno lo confirma, las metas no acompañan.</div>
                  <p className={s.quadConsequence}>El bono sin sustento.</p>
                </div>
                <div className={`${s.quad} ${s.quadDoble}`}>
                  <div className={s.quadHeader}>
                    <div className={s.quadName}>Doble Riesgo</div>
                    <div className={s.quadCount}>12</div>
                  </div>
                  <div className={s.quadAxes}>No domina y no cumple.</div>
                  <p className={s.quadConsequence}>La conversación que no espera.</p>
                </div>
              </div>
            </div>

            <p className={s.motorClose}>
              Siete personas en Sesgo de Percepción. Siete bonos a punto de aprobarse sobre una nota que el resultado no respalda. <strong>La diferencia entre verlo antes o después es la diferencia entre una decisión auditable y una conversación incómoda con el directorio en seis meses</strong>.
            </p>
          </div>

          {/* Motor 03 · efecto dominó */}
          <div className={s.motor}>
            <span className={s.motorContext}>Una promoción no es un movimiento</span>
            <h3 className={s.motorTitle}>La continuidad operacional puede colapsar con una sola buena noticia.</h3>
            <p className={s.motorThreat}>
              Promover a alguien suena bien. Hasta que su silla queda vacía y esa silla también era crítica, y quien la cubra deja otro hueco que tampoco tenías mapeado. <strong>Antes de mover la primera ficha, la cadena entera está a la vista</strong>. O no lo está, y la cascada estalla en el peor momento.
            </p>

            <div className={s.cascadeViz}>
              <div className={`${s.cascadeBox} ${s.cascadeCyan}`}>
                <div className={s.cascadeBoxRole}>Director</div>
                <div className={s.cascadeBoxState}>Promover</div>
              </div>
              <div className={s.cascadeArrow} aria-hidden="true">→</div>
              <div className={`${s.cascadeBox} ${s.cascadeAmber}`}>
                <div className={s.cascadeBoxRole}>Gerencia anterior</div>
                <div className={s.cascadeBoxState}>Sin sucesor</div>
              </div>
              <div className={s.cascadeArrow} aria-hidden="true">→</div>
              <div className={`${s.cascadeBox} ${s.cascadeAmber}`}>
                <div className={s.cascadeBoxRole}>Subgerencia crítica</div>
                <div className={s.cascadeBoxState}>Sin sucesor</div>
              </div>
            </div>
            <p className={s.cascadeCounter}>
              <strong>3</strong> sillas críticas que se vacían antes de vaciar la primera
            </p>

            <p className={s.motorClose}>
              Lo que el CEO descubre tarde: <strong>el sucesor que celebraste el lunes deja dos cargos críticos sin cubrir el martes</strong>. Si los datos lo decían y nadie los cruzó, la promoción dejó de ser una buena noticia.
            </p>
          </div>

          {/* Motor 04 · estilo del evaluador */}
          <div className={s.motor}>
            <span className={s.motorContext}>El equipo y su jefe</span>
            <h3 className={s.motorTitle}>Hay líderes comprando la simpatía de sus equipos con tu presupuesto.</h3>
            <p className={s.motorThreat}>
              Un jefe que evalúa a todos parejo y su equipo cumple bajo. Otro que protege a su gente con notas infladas. El promedio de la empresa los esconde a los dos. <strong>El sistema detecta el estilo del evaluador y lo nombra</strong>:
            </p>

            <div className={s.evalStyles}>
              {estilos.map((e) => (
                <div key={e.name} className={`${s.evalStyle} ${e.tone}`}>
                  <div className={s.evalStyleName}>{e.name}</div>
                  <p className={s.evalStyleDesc}>{e.desc}</p>
                </div>
              ))}
            </div>

            <p className={s.motorClose}>
              Lo que el CEO no estaba viendo: <strong>el patrón no está en las notas sueltas, está en quién las pone</strong>. Y cuando la nota infla y el bono se paga, no estás premiando al colaborador. Estás financiando la indulgencia de su jefe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
