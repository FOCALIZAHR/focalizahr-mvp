import s from '../styles.module.css'

export function BloqueCierre() {
  return (
    <div className={s.closing}>
      <div className={s.closeTesla} aria-hidden="true" />
      <span className={s.closeEyebrow}>El cierre</span>

      <p className={s.closingLine}>Hasta hoy, el talento vivió en la declaración.</p>
      <p className={`${s.closingLine} ${s.closingLine2}`}>
        Desde acá, <strong>vive en la decisión</strong>.
      </p>

      <div className={s.closeMark}>FocalizaHR</div>
    </div>
  )
}
