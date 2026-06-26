import { Fragment, type ReactNode } from 'react'
import s from '../styles.module.css'

const cobertura = [
  { name: 'Correo corporativo', state: 'VIVO', pct: 27, vivo: true },
  { name: 'Correo personal', state: 'EN CAMINO', pct: 35, vivo: false },
  { name: 'WhatsApp', state: 'EN CAMINO', pct: 38, vivo: false },
]

type Diff = {
  num: string
  attr: string
  ceo: ReactNode
  rrhh: ReactNode
  contrast: ReactNode
  viz?: boolean
}

const diffs: Diff[] = [
  {
    num: '01',
    attr: 'Cobertura real de la fuerza laboral',
    ceo: 'Mides la empresa entera, no la muestra sesgada de los jefes con correo. En una empresa de mil personas, eso suele ser solo el veinte o treinta por ciento. El otro setenta es operativo, y es donde se gana o se pierde el negocio.',
    rrhh: (
      <>
        Hoy el sistema llega por correo corporativo a todos los que lo tienen. Cierras la primera mitad del problema. <strong>La otra mitad — los que no tienen correo — está en construcción</strong>.
      </>
    ),
    contrast: 'Publicitan tasas de participación altas, pero medidas sobre quienes tienen correo corporativo. La fuerza laboral operativa no aparece en esos números porque nunca entró al sistema.',
    viz: true,
  },
  {
    num: '02',
    attr: 'Se monta en un día',
    ceo: (
      <>
        El proceso de evaluación deja de ser un proyecto trimestral con consultoría externa. <strong>Es una tarea de una tarde para RRHH</strong>.
      </>
    ),
    rrhh: 'No pasas semanas armando planillas, definiendo competencias desde cero, configurando relaciones de evaluación. El sistema arma todo desde la base de empleados.',
    contrast: 'Otras plataformas prometen reducciones de tiempo significativas, pero asumiendo que la configuración inicial ya está hecha. Esa configuración el cliente la hace por su cuenta, durante meses, antes de poder usar el sistema.',
  },
  {
    num: '03',
    attr: 'La nómina de evaluadores sale sola',
    ceo: (
      <>
        Cero costo operativo en el armado. Cada hora que RRHH ahorra en operación <strong>es una hora invertida en decisión</strong>.
      </>
    ),
    rrhh: 'No construyes a mano la matriz de quién evalúa a quién. El sistema sabe quién es jefe de quién, par de quién, subordinado de quién. Lo arma desde el master de empleados.',
    contrast: "Las plataformas del rango permiten 'configurar' la matriz de evaluadores. Es un eufemismo elegante para 'lo configuras tú, evaluador por evaluador, evaluado por evaluado'.",
  },
  {
    num: '04',
    attr: 'El reporte llega garantizado a cada persona',
    ceo: (
      <>
        Nadie en la empresa puede decir 'no supe mi evaluación'. Una evaluación que el evaluado no conoce <strong>no desarrolla, no corrige, no mueve un dato</strong>. Es gasto sin retorno.
      </>
    ),
    rrhh: 'No persigues a la gente para que entre a ver su reporte. No mandas recordatorios. No explicas la contraseña. El reporte llega, igual que el bono llega.',
    contrast: 'En las plataformas tradicionales el reporte queda disponible para que cada evaluado entre a la plataforma a buscarlo. La mayoría nunca entra. El círculo se rompe en el último kilómetro.',
  },
  {
    num: '05',
    attr: 'La calibración queda auditada',
    ceo: (
      <>
        En un terreno donde una decisión sobre personas puede terminar en tribunales, <strong>tener el registro defendible no es lujo, es protección</strong>. El comité de calibración deja de ser un riesgo legal.
      </>
    ),
    rrhh: 'Cada movimiento en la sesión exige justificación. Al cerrar, se genera un informe verificable con código QR de quién ajustó, qué cambió y por qué. La calibración deja de ser una discusión sin rastro.',
    contrast: 'Existen plataformas con calibración de arrastrar y soltar, sin justificación obligatoria ni rastro auditable. El movimiento queda. La razón se pierde. Y algunas ni siquiera recalculan el mapa de talento cuando el dato cambia.',
  },
]

export function BloquePisoOperativo() {
  return (
    <div className={s.section}>
      <div className={s.container}>
        <span className={s.eyebrow}>Lo que se prueba</span>
        <h2 className={s.sectionTitle}>Cinco diferencias que no hay que creer. Se ven.</h2>
        <p className={s.lead}>
          Antes de hablar de inteligencia, hay que ganarse el derecho a hablar. El piso del producto, los cinco lugares donde el sistema hace lo básico distinto. Cada uno se demuestra, no se afirma.
        </p>

        <div className={s.diffList}>
          {diffs.map((d) => (
            <div key={d.num} className={s.diff}>
              <div className={s.diffHead}>
                <span className={s.diffNum}>{d.num}</span>
                <h3 className={s.diffAttr}>{d.attr}</h3>
              </div>

              <div className={s.diffCols}>
                <div>
                  <span className={s.diffColLabel}>Para el CEO</span>
                  <p className={s.diffColText}>{d.ceo}</p>
                </div>
                <div>
                  <span className={s.diffColLabel}>Para RRHH</span>
                  <p className={s.diffColText}>{d.rrhh}</p>
                </div>
              </div>

              {d.viz && (
                <Fragment>
                  <div className={s.coverageViz}>
                    {cobertura.map((b) => (
                      <div key={b.name} className={s.coverageBar}>
                        <div className={s.coverageBarHead}>
                          <span className={s.coverageBarName}>{b.name}</span>
                          <span className={`${s.coverageBarState} ${b.vivo ? s.coverageStateVivo : s.coverageStateCamino}`}>
                            {b.state}
                          </span>
                        </div>
                        <div className={s.coverageBarTrack}>
                          <div
                            className={`${s.coverageBarFill} ${b.vivo ? s.coverageFillVivo : s.coverageFillCamino}`}
                            style={{ width: `${b.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={s.coverageNote}>
                    La arquitectura multicanal está construida. La activación de WhatsApp y correo personal llega en el segundo semestre.
                  </p>
                </Fragment>
              )}

              <p className={s.diffContrast}>
                <span className={s.diffContrastPre}>Lo que pasa en otras plataformas.</span>
                {d.contrast}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
