'use client'

import { useEffect, useRef, useState } from 'react'
import s from './styles.module.css'

export default function ConfidencialPreviewPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [modulesOpen, setModulesOpen] = useState(false)

  useEffect(() => {
    if (!modulesOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModulesOpen(false)
    }
    window.addEventListener('keydown', handleEsc)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = previousOverflow
    }
  }, [modulesOpen])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const visibleClass = s.visible

    // Reveal genérico de secciones
    const revealEls = root.querySelectorAll<HTMLElement>(`.${s.reveal}`)
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(visibleClass)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    )
    revealEls.forEach((el) => revealObserver.observe(el))

    // Animación escalonada de las cinco voces
    const voiceItems = root.querySelectorAll<HTMLElement>('[data-voices] li')
    const voicesObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            voiceItems.forEach((li, i) => {
              window.setTimeout(() => li.classList.add(visibleClass), i * 180)
            })
            voicesObserver.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    if (voiceItems.length) voicesObserver.observe(voiceItems[0])

    // Animación escalonada de los puntos ciegos
    const blindspotItems = root.querySelectorAll<HTMLElement>('[data-blindspots] li')
    const blindspotsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            blindspotItems.forEach((li, i) => {
              window.setTimeout(() => li.classList.add(visibleClass), i * 160)
            })
            blindspotsObserver.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    if (blindspotItems.length) blindspotsObserver.observe(blindspotItems[0])

    // Pronto
    const prontoContent = root.querySelector<HTMLElement>('[data-pronto]')
    let prontoObserver: IntersectionObserver | null = null
    if (prontoContent) {
      prontoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add(visibleClass)
              prontoObserver?.disconnect()
            }
          })
        },
        { threshold: 0.3 }
      )
      prontoObserver.observe(prontoContent)
    }

    return () => {
      revealObserver.disconnect()
      voicesObserver.disconnect()
      blindspotsObserver.disconnect()
      prontoObserver?.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef} className={s.page}>
      <div className={s.teslaLine} />

      <div className={s.wordmark}>
        <span className={s.focaliza}>Focaliza</span>
        <span className={s.hr}>HR</span>
      </div>

      <div className={s.badgeVista}>
        Confidencial &nbsp;·&nbsp; Vista privada
      </div>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.container}>
          <p className={s.capacityStripTop}>
            Para empresas de 100 a 10.000+ colaboradores &nbsp;·&nbsp; Fase 1 Chile &nbsp;·&nbsp; Plataforma multi-país y multi-entidad por diseño &nbsp;·&nbsp; Expansión a LATAM
          </p>
          <p className={s.heroLine} style={{ animationDelay: '0.35s' }}>El CEO decide sobre el dinero con Bloomberg.</p>
          <p className={s.heroLine} style={{ animationDelay: '0.65s' }}>Sobre la gente, con encuestas y planillas.</p>
          <p className={`${s.heroLine} ${s.heroLineGradient}`} style={{ animationDelay: '1.0s' }}>FocalizaHR cierra esa brecha.</p>
        </div>
      </section>

      {/* QUÉ ES */}
      <section className={s.sectionCompact}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Qué es</span>
          <p className={`${s.proseLine} ${s.large}`}>No es software de Recursos Humanos.</p>
          <p className={s.proseLine}>
            Es la capa de inteligencia que se sienta arriba de los procesos de RRHH y los convierte en{' '}
            <strong>decisiones del negocio</strong>.
          </p>
        </div>
      </section>

      {/* ─── ACTO II ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* LOS PUNTOS CIEGOS · apertura ACTO II */}
      <section className={s.sectionWide}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Los puntos ciegos</span>
          <h2 className={s.sectionTitle}>
            Lo que la gerencia de personas no puede ver{' '}
            <span className={s.gradient}>sin cruzar fuentes</span>.
          </h2>

          <ul className={s.blindspotsList} data-blindspots>
            <li>Quién está pensando renunciar y todavía no lo dice.</li>
            <li>Si la evaluación de desempeño es real o tiene sesgo del evaluador.</li>
            <li>Cuánto cuesta postergar una decisión que ya está tomada en los datos.</li>
            <li>Qué cargos van a cambiar con la inteligencia artificial, y quién no podrá adaptarse.</li>
            <li>Si tu mejor líder ya tiene un pie afuera.</li>
          </ul>

          <p className={s.blindspotsAnchor}>
            Lo que se decide a ciegas, <span className={s.accent}>se decide mal</span>.
          </p>
        </div>
      </section>

      {/* QUÉ HACE — Cinco voces */}
      <section className={s.section}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Qué hace</span>
          <div className={s.headingDuo}>
            <div className={s.anchorBlock}>
              <div className={s.anchorNumber}>5</div>
              <span className={s.anchorDash} aria-hidden="true">—</span>
            </div>
            <h2 className={s.titleEditorial}>
              Cruza cinco voces que normalmente viven separadas.
            </h2>
          </div>
          <ul className={s.voicesList} data-voices>
            <li>Lo que dicen los que están.</li>
            <li>Lo que dijeron los que se fueron.</li>
            <li>Lo que están viviendo los que recién entraron.</li>
            <li>El rendimiento real contra las metas.</li>
            <li>La exposición de cada cargo a la inteligencia artificial.</li>
          </ul>
          <p className={`${s.proseLine} ${s.large}`}>
            Cuando esas voces coinciden, el patrón <strong>deja de ser debatible</strong>.
          </p>
        </div>
      </section>

      {/* ─── ACTO III ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* 10 HALLAZGOS · apertura ACTO III — núcleo del producto */}
      <section className={s.sectionWide}>
        <div className={`${s.containerWide} ${s.reveal}`}>
          <span className={s.contextLabel}>Algunas cosas que detecta</span>
          <div className={s.headingDuo}>
            <div className={s.anchorBlock}>
              <div className={s.anchorNumber}>10</div>
              <span className={s.anchorDash} aria-hidden="true">—</span>
            </div>
            <h2 className={s.titleEditorial}>
              Hallazgos que ningún reporte aislado puede entregar.
            </h2>
          </div>

          {/* TIER 1 · Apertura — #01 visceral */}
          <article className={s.findingHero}>
            <span className={s.findingHeroNum}>01</span>
            <span className={s.findingHeroDash} aria-hidden="true">—</span>
            <h3 className={s.findingHeroTitle}>Talento estancado.</h3>
            <p className={s.findingHeroDesc}>Sus mejores ejecutores de hoy. Su mayor pasivo mañana. Rinden alto en cargos donde la IA puede asumir el grueso del trabajo. La evidencia dice que no podrán re-entrenarse.</p>
          </article>

          {/* TIER 2 · El coro — 8 hallazgos, grid editorial sin marco */}
          <div className={s.findingsGrid}>
            <article className={s.findingCard}>
              <span className={s.findingNum}>02</span>
              <h3 className={s.findingTitle}>Capital atrapado en tareas IA.</h3>
              <p className={s.findingDesc}>Equivalentes a tiempo completo trabajando en cosas que el software ya puede hacer. Cuantificado en pesos por mes. No invertir es la decisión financiera más cara del año.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>03</span>
              <h3 className={s.findingTitle}>Pasivo laboral.</h3>
              <p className={s.findingDesc}>El costo de postergar una decisión que ya está tomada en los datos. Cuánto cuesta hoy ejecutarla. Cuánto va a costar dentro de doce meses si no se hace.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>04</span>
              <h3 className={s.findingTitle}>Compresión silenciosa de cargos.</h3>
              <p className={s.findingDesc}>Familias de puestos donde un Junior con las herramientas correctas entrega el mismo trabajo operativo que el Senior actual. El sistema dice cuáles. Cuántas personas. Y el ahorro estructural.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>05</span>
              <h3 className={s.findingTitle}>Brecha de productividad.</h3>
              <p className={s.findingDesc}>Salarios completos pagados por trabajo que se entrega parcial. Por persona. Por departamento. En pesos. Mes a mes.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>06</span>
              <h3 className={s.findingTitle}>Redundancia operativa.</h3>
              <p className={s.findingDesc}>Pares de cargos con títulos distintos que comparten más del setenta por ciento de sus tareas. Trabajo duplicado que pronto será irrelevante.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>07</span>
              <h3 className={s.findingTitle}>Fuga del talento aumentado.</h3>
              <p className={s.findingDesc}>Las personas que con las herramientas correctas se van a volver tres veces más productivas. Si la compensación no refleja ese nuevo valor antes que el mercado lo haga, las perderá.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>08</span>
              <h3 className={s.findingTitle}>Riesgo de adopción.</h3>
              <p className={s.findingDesc}>El área con más potencial de ahorro por automatización es la que tiene peor clima organizacional. La tecnología no resuelve la falta de liderazgo. La amplifica.</p>
            </article>

            <article className={s.findingCard}>
              <span className={s.findingNum}>09</span>
              <h3 className={s.findingTitle}>Arquitectura de liderazgo.</h3>
              <p className={s.findingDesc}>La pirámide gerencial revisada por arquetipo. Capas que solo agregan latencia. Cuellos de botella estructurales que no se ven hasta que se traducen a costo.</p>
            </article>
          </div>

          {/* TIER 1 · Sentencia — #10 cierre */}
          <article className={s.findingHero}>
            <span className={s.findingHeroNum}>10</span>
            <span className={s.findingHeroDash} aria-hidden="true">—</span>
            <h3 className={s.findingHeroTitle}>Lista roja por valor relativo.</h3>
            <p className={s.findingHeroDesc}>Las personas prescindibles por evidencia, no por política ni antigüedad. Tres fuentes independientes que coinciden. La lista no se discute. Se decide.</p>
          </article>

          <p className={s.findingsClosing}>
            Cada hallazgo viene con su precio en pesos. Y con la fecha en que dejará de ser opcional.
          </p>

          <div className={s.moduleTriggerWrapper}>
            <button
              type="button"
              className={s.moduleTrigger}
              onClick={() => setModulesOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={modulesOpen}
            >
              Ver el sistema completo
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* EN EL CORAZÓN DEL PERFORMANCE */}
      <section className={s.section}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>En el corazón del performance</span>
          <h2 className={s.sectionTitle}>
            Lo que un 9-Box tradicional{' '}
            <span className={s.gradient}>no puede decirte</span>.
          </h2>

          <div className={s.strategyList}>
            <div className={s.strategyItem}>
              <div className={s.strategyNum}>01</div>
              <div>
                <h3 className={s.strategyTitle}>Una sola conversación. Todo el año.</h3>
                <p className={s.strategyDesc}>La gestión del talento no es un proceso anual con una foto al final. Es inteligencia continua sobre cada persona. Lo que rindió. Lo que puede dar. Lo que está cambiando.</p>
              </div>
            </div>

            <div className={s.strategyItem}>
              <div className={s.strategyNum}>02</div>
              <div>
                <h3 className={s.strategyTitle}>El cruce que ningún otro sistema hace.</h3>
                <p className={s.strategyDesc}>Desempeño con metas. Metas con potencial. Potencial con compromiso. Compromiso con riesgo. Riesgo con sucesión. Cinco dimensiones que en cualquier otra plataforma viven en silos separados se conversan aquí en un solo motor.</p>
              </div>
            </div>

            <div className={s.strategyItem}>
              <div className={s.strategyNum}>03</div>
              <div>
                <h3 className={s.strategyTitle}>Decisiones de personas con la rigurosidad de un balance.</h3>
                <p className={s.strategyDesc}>Cada decisión sobre alguien queda registrada como una transacción financiera. Trazable. <strong>Defendible.</strong> Auditable. Lo mismo que un CFO exige sobre el dinero — ahora sobre la gente.</p>
              </div>
            </div>

            <div className={s.strategyItem}>
              <div className={s.strategyNum}>04</div>
              <div>
                <h3 className={s.strategyTitle}>El liderazgo también está bajo escrutinio.</h3>
                <p className={s.strategyDesc}>Los líderes no solo evalúan. Son evaluados. Por sus equipos, por sus resultados, por las personas que se fueron. El sistema cruza esas tres voces y revela los patrones antes de que sean crisis de cultura.</p>
              </div>
            </div>

            <div className={s.strategyItem}>
              <div className={s.strategyNum}>05</div>
              <div>
                <h3 className={s.strategyTitle}>Memoria longitudinal entre ciclos.</h3>
                <p className={s.strategyDesc}>El sistema recuerda lo que se decidió y vuelve a preguntar. <em>Hace seis meses dijiste que ibas a actuar sobre María. ¿Qué pasó?</em> No hay decisiones que se pierden en la rotación del año.</p>
              </div>
            </div>
          </div>

          <p className={s.strategyClosing}>
            Otros sistemas terminan cuando guardas. Este empieza ahí.
          </p>
        </div>
      </section>

      {/* ─── ACTO IV ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* QUÉ RESUELVE · apertura ACTO IV */}
      <section className={s.sectionCompact}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Qué resuelve</span>
          <div className={s.headingDuo}>
            <div className={s.anchorBlock}>
              <div className={s.anchorNumber}>3</div>
              <span className={s.anchorDash} aria-hidden="true">—</span>
            </div>
            <h2 className={s.titleEditorial}>
              Los problemas que no aparecen en ningún reporte hasta que ya es tarde.
            </h2>
          </div>
          <ul className={s.problemList}>
            <li>El gerente bueno que renuncia el lunes.</li>
            <li>El caso Ley Karin que llega a SUSESO el martes.</li>
            <li>La gerencia que pierde tres personas en un mes, sin que el patrón se vea hasta la cuarta.</li>
          </ul>
          <p className={`${s.proseLine} ${s.large}`}>
            FocalizaHR ve el patrón <strong>antes de que tenga nombre</strong>.
          </p>
          <p className={s.proseLine}>Y lo traduce a pesos.</p>
        </div>
      </section>

      {/* CUANDO LOS CANALES COINCIDEN */}
      <section className={s.section}>
        <div className={`${s.containerNarrow} ${s.reveal}`}>
          <span className={s.contextLabel}>Triangulación de evidencia</span>
          <h2 className={s.sectionTitle}>
            Una señal es opinión.{' '}
            <span className={s.gradient}>Dos son patrón. Tres ya no se discuten.</span>
          </h2>

          <div className={s.channelsBlock}>
            <span className={s.channelsSubtitle}>— En lo que recién empieza</span>
            <p className={s.proseLine}>
              Los que entraron mandan señales todo el tiempo. Día 1. Día 7. Día 30. Día 90.
            </p>
            <p className={s.proseLine}>
              Cuando algo se rompe en ese viaje, el sistema avisa el día que se rompe — no seis meses después en la entrevista de salida.
            </p>
            <p className={s.proseLine}>
              Y cuando alguien efectivamente se va, el sistema correlaciona la salida con las señales que se ignoraron en su Onboarding. <strong>La autopsia se vuelve chequeo médico preventivo.</strong>
            </p>
          </div>

          <div className={s.channelsBlock}>
            <span className={s.channelsSubtitle}>— En lo que nadie quiere decir en voz alta</span>
            <p className={s.proseLine}>
              Antes de una denuncia formal por Ley Karin, ya hubo señales en otros lugares.
            </p>
            <p className={s.proseLine}>
              Una caída en la encuesta de clima. Una entrevista de salida que mencionó algo sin nombre. Un patrón en el lenguaje de las respuestas abiertas. Una baja en el Onboarding del equipo nuevo.
            </p>
            <p className={s.proseLine}>
              FocalizaHR no detecta denuncias. <strong>Detecta antes.</strong>
            </p>
          </div>

          <p className={s.channelsAnchor}>
            Una señal es opinión. <span className={s.accent}>Dos son patrón.</span> Tres ya no se discuten.
          </p>
        </div>
      </section>

      {/* ─── ACTO V ─── */}
      <hr className={s.teslaActSeparator} aria-hidden="true" />

      {/* ¿EXISTE ALGO SIMILAR? · apertura ACTO V — cierre competitivo */}
      <section className={s.section}>
        <div className={`${s.container} ${s.reveal}`}>
          <span className={s.contextLabel}>¿Existe algo similar?</span>
          <h2 className={s.sectionTitle}>
            El espacio que hoy{' '}
            <span className={s.gradient}>no existe</span>.
          </h2>

          <div className={s.compareGrid}>
            <div className={s.compareCard}>
              <span className={s.label}>Mundo desarrollado</span>
              <h4>Culture Amp. Lattice. Workday. Qualtrics.</h4>
              <p>Entre 50.000 y 500.000 dólares al año. Pensados para empresas de Estados Unidos y Europa.</p>
            </div>

            <div className={s.compareCard}>
              <span className={s.label}>LATAM</span>
              <h4>BUK. Rankmi. Talana.</h4>
              <p>Excelentes para digitalizar procesos. Ninguno produce inteligencia para decisiones del CEO.</p>
            </div>

            <div className={`${s.compareCard} ${s.featured}`}>
              <span className={s.label}>FocalizaHR</span>
              <h4>La capacidad analítica de los gigantes globales.</h4>
              <p>Al precio y la realidad de una empresa LATAM de 300 a 5.000 personas. Y una cosa que ningún competidor del mundo está haciendo todavía: los demás miden si un cargo está expuesto a la inteligencia artificial. Este mide si la persona en ese cargo puede vivir lo que viene.</p>
            </div>
          </div>

          <p className={s.anchorPhrase}>
            <span className={s.first}>Enterprise Brain.</span>
            <span className={s.second}>Mid-Market Price.</span>
          </p>

          <p className={s.similarClosing}>
            La diferencia con una encuesta es la diferencia entre un <em>termómetro</em> y un <em>electrocardiograma</em>.
          </p>
        </div>
      </section>

      {/* PRONTO. PRIMER SEMESTRE 2026. */}
      <section className={s.prontoSection}>
        <div className={s.prontoContent} data-pronto>
          <h2 className={s.prontoWord}>Pronto.</h2>
          <p className={s.prontoDate}>Primer semestre &nbsp;·&nbsp; 2026</p>
        </div>
      </section>

      {/* MODAL · El sistema completo */}
      {modulesOpen && (
        <div
          className={s.modalOverlay}
          onClick={() => setModulesOpen(false)}
          role="presentation"
        >
          <div
            className={s.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modules-modal-title"
          >
            <button
              type="button"
              className={s.modalClose}
              onClick={() => setModulesOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>

            <span className={s.contextLabel}>El sistema completo</span>
            <h3 id="modules-modal-title" className={s.modalTitle}>
              Diez capas de{' '}
              <span className={s.gradient}>inteligencia</span>.
            </h3>

            <ol className={s.modulesList}>
              <li>
                <span className={s.moduleNum}>01</span>
                <div>
                  <h4 className={s.moduleTitle}>Performance</h4>
                  <p className={s.moduleDesc}>Evaluación, metas, calibración 9-Box. La gestión del talento continua, no una foto anual.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>02</span>
                <div>
                  <h4 className={s.moduleTitle}>P&amp;L Talent · Cascada de la verdad</h4>
                  <p className={s.moduleDesc}>La traducción a pesos: FTE fantasma, brecha cargo vs persona, pasivo laboral cuantificado. Lo que cuesta postergar.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>03</span>
                <div>
                  <h4 className={s.moduleTitle}>Fuga predictiva</h4>
                  <p className={s.moduleDesc}>Quién renuncia antes de decirlo. Cruce de metas, compromiso y exposición a IA.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>04</span>
                <div>
                  <h4 className={s.moduleTitle}>Sucesión</h4>
                  <p className={s.moduleDesc}>Cargos críticos sin reemplazo identificado. Efecto dominó simulado cuando alguien se va.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>05</span>
                <div>
                  <h4 className={s.moduleTitle}>Onboarding</h4>
                  <p className={s.moduleDesc}>Las señales día 1, 7, 30 y 90. Correlación con las salidas que vienen después.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>06</span>
                <div>
                  <h4 className={s.moduleTitle}>Experiencia colaborador inteligente</h4>
                  <p className={s.moduleDesc}>Encuestas continuas de clima, análisis de respuestas abiertas, señales de compromiso a lo largo del año.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>07</span>
                <div>
                  <h4 className={s.moduleTitle}>Exposición a IA</h4>
                  <p className={s.moduleDesc}>Qué cargos cambian con inteligencia artificial. Quién puede adaptarse y quién no.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>08</span>
                <div>
                  <h4 className={s.moduleTitle}>Workforce planning</h4>
                  <p className={s.moduleDesc}>La dotación que sostiene lo que viene. Cuándo, dónde, cuánto — traducido a pesos.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>09</span>
                <div>
                  <h4 className={s.moduleTitle}>Compliance · Ley Karin</h4>
                  <p className={s.moduleDesc}>Las señales que llegan antes de la denuncia. Convergencia de evidencia entre canales.</p>
                </div>
              </li>
              <li>
                <span className={s.moduleNum}>10</span>
                <div>
                  <h4 className={s.moduleTitle}>Compensación inteligente</h4>
                  <span className={s.moduleTag}>En evaluación · 2027</span>
                  <p className={s.moduleDesc}>Bono, mérito, trayectoria individual. La decisión sobre salarios con la rigurosidad de un balance.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
