import { type ReactNode } from 'react'
import s from '../styles.module.css'

const nineBoxCells: Array<{ name: string; tier: string }> = [
  { name: 'Diamante en Bruto', tier: s.cellPurple },
  { name: 'Alto Potencial', tier: s.cellPurple },
  { name: 'Estrella', tier: s.cellCyan },
  { name: 'Inconsistente', tier: s.cellNeutral },
  { name: 'Jugador Clave', tier: s.cellNeutral },
  { name: 'Alto Desempeño', tier: s.cellNeutral },
  { name: 'Bajo Desempeño', tier: s.cellAmber },
  { name: 'Desempeño Promedio', tier: s.cellNeutral },
  { name: 'Profesional Confiable', tier: s.cellNeutral },
]

type Quad = { name: string; tone: string; desc: string }

const mDesempenoMetas: Quad[] = [
  { name: 'Performer Oculto', tone: s.miniNeutral, desc: 'No domina, y aun así cumple metas. La nota no refleja lo que el negocio recibe.' },
  { name: 'Consistente', tone: s.miniCyan, desc: 'Domina y cumple. El bono se aprueba con respaldo.' },
  { name: 'Doble Riesgo', tone: s.miniNeutral, desc: 'No domina y no cumple. Las dos señales coinciden.' },
  { name: 'Sesgo de Percepción', tone: s.miniAmber, desc: 'Domina, el entorno lo confirma, las metas no acompañan. El bono sin sustento.' },
]

const mRiesgo: Quad[] = [
  { name: 'Riesgo de Burnout', tone: s.miniNeutral, desc: 'Lo da todo y no domina. Esfuerzo que no rinde.' },
  { name: 'Motor del Equipo', tone: s.miniCyan, desc: 'Domina y está enganchado. El que sostiene.' },
  { name: 'Bajo Rendimiento', tone: s.miniNeutral, desc: 'Ni domina ni se engancha. La conversación que no espera.' },
  { name: 'Fuga de Talento', tone: s.miniAmber, desc: 'Domina pero ya tiene un pie afuera. El más caro de perder.' },
]

const mMovilidad: Quad[] = [
  { name: 'Ambicioso Prematuro', tone: s.miniNeutral, desc: 'Quiere más antes de dominar lo básico. Desarrollar, no promover aún.' },
  { name: 'Sucesor Natural', tone: s.miniPurple, desc: 'Domina y quiere crecer. El candidato listo.' },
  { name: 'En Desarrollo', tone: s.miniNeutral, desc: 'Todavía aprendiendo el cargo. La curva sana.' },
  { name: 'Pilar Técnico', tone: s.miniCyan, desc: 'Domina y no quiere mandar. Tu activo más valioso, se pierde si se le fuerza a jefe.' },
]

function MiniMatrix({ quads }: { quads: Quad[] }) {
  return (
    <div className={s.miniMatrix}>
      {quads.map((q) => (
        <div key={q.name} className={`${s.miniQuad} ${q.tone}`}>
          <div className={s.miniQuadName}>{q.name}</div>
          <p className={s.miniQuadDesc}>{q.desc}</p>
        </div>
      ))}
    </div>
  )
}

function Reveal({ children }: { children: ReactNode }) {
  return <p className={s.matrixReveal}>{children}</p>
}

export function BloqueMatrices() {
  return (
    <div className={s.section}>
      <div className={s.container}>
        <div className={s.matricesBreath}>
          <hr className={s.teslaSeparator} aria-hidden="true" />
        </div>

        <span className={`${s.eyebrow} ${s.eyebrowPurple}`}>La inteligencia</span>
        <h2 className={s.sectionTitle}>Cuatro matrices que clasifican a cada persona. Desde el día uno.</h2>
        <p className={s.lead}>
          No una. No solo la del directorio. Cuatro. Toda la empresa mapeada desde que cierra el proceso, no solo los que entran a la sala de calibración. Cada cruce no entrega un color: entrega una decisión con nombre.
        </p>

        <div className={s.matricesGrid}>
          {/* Matriz 01 · 9-Box */}
          <div className={s.matrixUnit}>
            <span className={s.matrixUnitTag}>Matriz 01 <span>· estratégica</span></span>
            <div className={s.matrixUnitName}>
              9-Box <em>— Desempeño × Potencial</em>
            </div>
            <div className={s.nineBox}>
              {nineBoxCells.map((c) => (
                <div key={c.name} className={`${s.nineBoxCell} ${c.tier}`}>{c.name}</div>
              ))}
            </div>
            <div className={s.nineBoxAxes}>
              <span>Potencial ↑</span>
              <span>Desempeño →</span>
            </div>
            <Reveal>
              La conversación estratégica del directorio. Aparece el <strong>Diamante en Bruto</strong> que la sala de calibración nunca había visto, porque nunca entraba a la sala.
            </Reveal>
          </div>

          {/* Matriz 02 · Desempeño × Metas */}
          <div className={s.matrixUnit}>
            <span className={s.matrixUnitTag}>Matriz 02 <span>· el bono</span></span>
            <div className={s.matrixUnitName}>
              Desempeño × Metas <em>— Dominio × Cumplimiento</em>
            </div>
            <MiniMatrix quads={mDesempenoMetas} />
            <Reveal>
              Aparece el <strong>Sesgo de Percepción</strong>: la nota alta que las metas no respaldan. Antes de aprobar el bono, el negocio ve qué cuadrante firma.
            </Reveal>
          </div>

          {/* Matriz 03 · Riesgo */}
          <div className={s.matrixUnit}>
            <span className={s.matrixUnitTag}>Matriz 03 <span>· táctica</span></span>
            <div className={s.matrixUnitName}>
              Riesgo <em>— Dominio × Compromiso</em>
            </div>
            <MiniMatrix quads={mRiesgo} />
            <Reveal>
              Aparece la <strong>Fuga de Talento</strong>: el experto que ya decidió irse pero todavía no lo dice. Reemplazarlo cuesta entre el 80% y el 150% de su salario. El sistema lo nombra antes de que la carta de renuncia llegue.
            </Reveal>
          </div>

          {/* Matriz 04 · Movilidad */}
          <div className={s.matrixUnit}>
            <span className={s.matrixUnitTag}>Matriz 04 <span>· táctica</span></span>
            <div className={s.matrixUnitName}>
              Movilidad <em>— Dominio × Aspiración a crecer</em>
            </div>
            <MiniMatrix quads={mMovilidad} />
            <Reveal>
              Separa la conversación de carrera de la del bono. Aparece el <strong>Pilar Técnico</strong>: el experto que sostiene el conocimiento del equipo y que se pierde si se confunde su excelencia técnica con ambición de mando.
            </Reveal>
          </div>
        </div>

        <div className={s.testAcido}>
          <span className={s.testAcidoTitle}>El Test Ácido</span>
          <p className={s.testAcidoText}>
            <em>En Riesgo y en Movilidad, el nivel del medio no clasifica.</em> O se compromete o no, o aspira o no. El punto medio cómodo —donde el evaluador se esconde de la decisión— no existe en estas dos matrices. Quien se evada queda sin clasificar, no protegido por una caja gris central.
          </p>
        </div>

        <p className={s.matricesBridge}>
          Eso es lo que el sistema clasifica. Ahora, lo que ve, y nadie más cruza.
        </p>
      </div>
    </div>
  )
}
