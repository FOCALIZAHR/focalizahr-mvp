'use client'

import { TabNiveles } from './components/TabNiveles'
import { BloqueHero } from './components/BloqueHero'
import { BloqueCategoria } from './components/BloqueCategoria'
import { BloqueCiclo } from './components/BloqueCiclo'
import { BloquePisoOperativo } from './components/BloquePisoOperativo'
import { BloqueMatrices } from './components/BloqueMatrices'
import { BloqueMotores } from './components/BloqueMotores'
import { BloqueCascada } from './components/BloqueCascada'
import { BloqueAccionMasiva } from './components/BloqueAccionMasiva'
import { BloqueCierre } from './components/BloqueCierre'
import s from './styles.module.css'

export default function CicloTalentoPage() {
  return (
    <main className={s.page}>
      <div className={s.teslaLine} />

      <TabNiveles />

      <section id="hero" data-nivel="estrategico">
        <BloqueHero />
      </section>

      <section id="categoria" data-nivel="estrategico">
        <BloqueCategoria />
      </section>

      <section id="ciclo" data-nivel="estrategico">
        <BloqueCiclo />
      </section>

      <section id="operativo" data-nivel="operativo">
        <BloquePisoOperativo />
      </section>

      <section id="matrices" data-nivel="tactico">
        <BloqueMatrices />
      </section>

      <section id="motores" data-nivel="tactico">
        <BloqueMotores />
      </section>

      <section id="cascada" data-nivel="tactico">
        <BloqueCascada />
      </section>

      <section id="accion" data-nivel="tactico">
        <BloqueAccionMasiva />
      </section>

      <section id="cierre" data-nivel="estrategico">
        <BloqueCierre />
      </section>
    </main>
  )
}
