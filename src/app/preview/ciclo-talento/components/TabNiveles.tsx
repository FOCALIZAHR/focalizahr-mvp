'use client'

import { useState } from 'react'
import s from './TabNiveles.module.css'

type Nivel = 'todo' | 'estrategico' | 'operativo' | 'tactico'

const niveles: Array<{ id: Nivel; label: string; target?: string }> = [
  { id: 'todo', label: 'Todo el recorrido' },
  { id: 'estrategico', label: 'Estratégico', target: '#hero' },
  { id: 'operativo', label: 'Operativo', target: '#operativo' },
  { id: 'tactico', label: 'Táctico', target: '#matrices' },
]

export function TabNiveles() {
  const [active, setActive] = useState<Nivel>('todo')

  const handleClick = (n: (typeof niveles)[number]) => {
    setActive(n.id)
    if (n.target) {
      document.querySelector(n.target)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <nav className={s.tab} aria-label="Niveles de profundidad">
      {niveles.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => handleClick(n)}
          className={`${s.tabItem} ${active === n.id ? s.active : ''}`}
        >
          {n.label}
        </button>
      ))}
    </nav>
  )
}
