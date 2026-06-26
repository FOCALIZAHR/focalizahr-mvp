import s from '../confidencial/styles.module.css'
import CicloTalentoSection from './CicloTalentoSection'

export default function CicloTalentoPreviewPage() {
  return (
    <div className={s.page}>
      <div className={s.teslaLine} />

      <div className={s.wordmark}>
        <span className={s.focaliza}>Focaliza</span>
        <span className={s.hr}>HR</span>
      </div>

      <div className={s.badgeVista}>
        Confidencial &nbsp;·&nbsp; Vista privada
      </div>

      <CicloTalentoSection />
    </div>
  )
}
