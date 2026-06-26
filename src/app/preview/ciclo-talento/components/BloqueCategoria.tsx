import s from '../styles.module.css'

export function BloqueCategoria() {
  return (
    <div className={s.sectionCompact}>
      <div className={s.containerNarrow}>
        <span className={s.eyebrow}>La categoría</span>

        <p className={s.categoryStatement}>
          <span className={s.categoryLine1}>Otros digitalizaron los procesos de personas.</span>
          <span className={s.categoryLine2}>
            FocalizaHR <strong>conectó ese talento con el negocio</strong>.
          </span>
        </p>

        <p className={s.categoryBridge}>
          Por dentro funciona como cualquier sistema serio. <strong>Por fuera, decide cosas que ningún sistema serio puede decidir.</strong>
        </p>
      </div>
    </div>
  )
}
