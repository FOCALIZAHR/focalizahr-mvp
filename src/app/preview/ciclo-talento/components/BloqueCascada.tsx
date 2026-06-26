import s from '../styles.module.css'

export function BloqueCascada() {
  return (
    <div className={s.section}>
      <div className={s.container}>
        <span className={s.eyebrow}>Donde el CEO vive</span>
        <h2 className={s.cascadaTitle}>
          Un diagnóstico que no llega al costo ni a la decisión, es <strong>teatro</strong>.
        </h2>
        <p className={s.lead}>
          Todo lo anterior produce diagnóstico. Esta capa lo traduce al único idioma que el directorio nunca discute: el peso. Y lo entrega como una cascada de seis golpes, no como un dashboard.
        </p>

        <p className={s.simMarco}>
          Lo que sigue es <strong>un ejemplo de lo que el producto le entrega al CEO</strong> cuando cierra un ciclo. Datos simulados. El recorrido — del número que detiene a la cabeza del problema en bandeja — es el del producto funcionando.
        </p>

        <div className={s.plFrame}>
          <div className={s.plFrameHeader}>
            <div className={s.plFrameTitle}>
              El estado de resultados del talento
              <span>P&amp;L · Cascada de la verdad</span>
            </div>
            <div className={s.plFrameSim}>
              Empresa de ejemplo · 1.200 colaboradores · Ciclo Q1
              <br />
              <em>simulación · datos ilustrativos</em>
            </div>
          </div>

          {/* Paso 01 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgeCyan}`}>01 · Gancho</span>
            <div className={s.plBigNum}>68%</div>
            <p className={s.plStepText}>Tu organización opera bajo el estándar mínimo de su propio negocio.</p>
          </div>

          {/* Paso 02 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgeNeutral}`}>02 · Problema</span>
            <p className={s.plStepText}>
              El 48% de la dotación no alcanza el dominio que su cargo exige. <strong>Los resultados que firmas cada mes están sostenidos por la mitad de la gente que pagas</strong>. La otra mitad opera bajo el umbral, y el negocio no lo sabe porque el promedio lo esconde.
            </p>
          </div>

          {/* Paso 03 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgePurple}`}>03 · Amplificador</span>
            <div className={`${s.plStepSub} ${s.plStepSubPurple}`}>Gerencia de Tecnología</div>
            <p className={s.plStepText}>
              Concentra el 41% del déficit total de productividad. De sus quince líderes directos, diez operan bajo estándar. <strong>Cada uno arrastra a su equipo</strong>. El problema no está distribuido, está concentrado, y tiene nombre.
            </p>
          </div>

          {/* Paso 04 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgeAmber}`}>04 · Costo hoy</span>
            <div className={s.plCards}>
              <div className={s.plCard}>
                <div className={s.plCardLabel}>Brecha productiva</div>
                <div className={s.plCardNum}>$257M</div>
                <div className={s.plCardDesc}>Anuales en productividad pagada y no recibida.</div>
              </div>
              <div className={s.plCard}>
                <div className={s.plCardLabel}>Pasivo legal latente</div>
                <div className={s.plCardNum}>$184M</div>
                <div className={s.plCardDesc}>Con fundamento legal chileno real.</div>
              </div>
            </div>
            <p className={s.plCardsNote}>
              No es proyección. Es lo que el balance ya carga este mes, sobre sueldos reales de la empresa, antes de cualquier intervención.
            </p>
          </div>

          {/* Paso 05 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgeAmber}`}>05 · Riesgo futuro</span>
            <p className={s.plStepText}>
              Los siete colaboradores en Sesgo de Percepción reciben bono este trimestre. Tres están en cargos críticos sin sucesor identificado. <strong>Tus consistentes están mirando cómo premias a los que no entregan. Los que de verdad cargan el negocio ya tienen un pie afuera.</strong>
            </p>
          </div>

          {/* Paso 06 */}
          <div className={s.plStep}>
            <span className={`${s.plBadge} ${s.badgeCyanBright}`}>06 · Francotirador</span>
            <div className={s.plStepSub}>La cabeza del problema, en bandeja.</div>
            <div className={s.plSniperBox}>
              <span className={s.plSniperTag}>Acción priorizada por el sistema</span>
              <p className={s.plSniperAction}>
                Conversación con la Gerencia de Tecnología antes del cierre de bonos.
              </p>
              <p className={s.plSniperDetail}>
                <strong>El comité de riesgo, agendado. El correo al gerente, redactado.</strong> Cada acción queda registrada como compromiso, con seguimiento a 180 días.
              </p>
            </div>
          </div>
        </div>

        <p className={s.plClose}>
          Eso es lo que FocalizaHR le entrega al CEO cuando los datos son los suyos.{' '}
          <strong>Aquí lo viste como capacidad. Adentro del producto, decide por ti.</strong>
        </p>
      </div>
    </div>
  )
}
