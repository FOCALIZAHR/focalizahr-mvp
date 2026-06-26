import s from '../styles.module.css'

export function BloqueHero() {
  return (
    <div className={s.hero}>
      <div className={s.metaRow}>
        <div className={s.wordmark}>
          <span className={s.focaliza}>Focaliza</span>
          <span className={s.hr}>HR</span>
        </div>
        <div className={s.badge}>Confidencial · Vista privada</div>
      </div>

      <div className={s.heroBody}>
        <p className={s.heroAudience}>
          Para empresas de 100 a 10.000+ colaboradores · Fase 1 Chile · Plataforma multi-país por diseño
        </p>

        <p className={s.heroTrunk1}>Tus tableros están en verde.</p>
        <p className={s.heroTrunk2}>Tu negocio está sangrando en rojo.</p>

        <p className={s.heroName}>
          Tu mejor persona ya tiene un pie afuera. Y <strong>vas a enterarte el viernes</strong>, en la entrevista de salida.
        </p>

        <p className={s.heroBridge}>
          No es que te falten datos. <strong>Es que tus datos viven en cajones que no se cruzan</strong>, y en esa distancia se esconde lo que cuesta dinero.
        </p>
      </div>
    </div>
  )
}
