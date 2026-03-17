// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVAS — Derechos Digitales 2026
// Contenido de conversación por persona — separado de los datos estructurales
// para facilitar edición anual sin tocar lógica ni diseño
// ─────────────────────────────────────────────────────────────────────────────

export interface Pregunta {
  q: string;
  a: string;
}

export interface Narrativa {
  id: string;                 // debe coincidir con Persona.id
  guiaLider: string;          // solo visible en vista líder — contexto y recomendaciones
  mensajeColaborador: string; // mensaje sugerido para la conversación 1:1
  preguntas: Pregunta[];      // preguntas difíciles anticipadas con respuestas
}

export const NARRATIVAS: Narrativa[] = [

  // ─── B1 ──────────────────────────────────────────────────────────────────
  {
    id: "jc",
    guiaLider: `Juan Carlos tiene 13 años en DD y es quien presenta la brecha más significativa del equipo respecto a la referencia de mercado para su nivel. Hoy recibe el 61% de lo que el mercado paga por un rol equivalente.

Esta conversación tiene dos partes: la primera es reconocer honestamente la brecha y lo que significa. La segunda es mostrar que el sistema empieza a corregirla hoy.

El ajuste de 12% este año es el más alto disponible en el modelo — es una señal concreta, no simbólica. El camino completo hacia la referencia es de 2-3 años y requiere que el Directorio apruebe el plan de convergencia de la Banda 1.

Clave: no generar expectativa de corrección inmediata, pero sí de dirección clara y compromiso real.`,
    mensajeColaborador: `Juan Carlos, quiero ser muy directo contigo sobre algo importante.

Con el nuevo sistema de compensaciones, tenemos por primera vez una referencia objetiva de mercado para tu rol. Y lo que vemos es que tu sueldo actual está por debajo de lo que organizaciones comparables pagan para este nivel de responsabilidad.

Eso no es un reflejo de tu valor ni de tu aporte a DD — es el resultado de años sin un sistema formal que pusiera ese número sobre la mesa. Ahora lo tenemos.

Este año aplicamos el ajuste más alto que permite el modelo. Es un primer paso real en la dirección correcta. El camino completo hacia la referencia de mercado tomará 2-3 años y lo estamos planificando formalmente con el Directorio.

Quería que lo supieras con claridad, porque te lo mereces.`,
    preguntas: [
      {
        q: "¿Por qué no se corrige todo de una vez?",
        a: "Porque la corrección completa de la Banda 1 es una decisión que involucra al Directorio — no es una decisión operativa. Estamos preparando ese proceso formalmente. El ajuste de hoy es el primer paso concreto mientras eso ocurre.",
      },
      {
        q: "¿Cuándo llego a la referencia completa?",
        a: "Con el ritmo del modelo, el horizonte estimado es 2-3 años. Cada año se evalúa y se aprueba el siguiente paso. No hay un número exacto porque depende también de cómo evolucione el mercado de referencia.",
      },
      {
        q: "¿El resto del equipo sabe esto?",
        a: "La Banda 1 se trata de forma separada con el Directorio. Las situaciones individuales son confidenciales.",
      },
    ],
  },

  {
    id: "jamila",
    guiaLider: `Jamila está bajo el mínimo con el 78% de la referencia de mercado. De los dos co-directores, su posición es la más cercana al mínimo, lo que hace la conversación algo más directa.

El ajuste de 12% este año la mueve a ~$5,008 — sobre el mínimo de la banda por primera vez. Es un hito concreto y se puede comunicar así.

Misma lógica que JC: honestidad sobre la brecha, claridad sobre la dirección, y encuadrar el proceso en el Directorio.`,
    mensajeColaborador: `Jamila, con el nuevo sistema de compensaciones tenemos por primera vez un punto de referencia claro para lo que el mercado paga en roles de dirección ejecutiva en organizaciones como DD.

Tu sueldo actual está bajo ese punto de referencia. No como una señal de lo que vale tu trabajo — sino como el resultado de años sin este sistema.

La buena noticia es que con el ajuste de este año cruzas el mínimo del rango por primera vez. Eso es un avance concreto. El camino hacia la referencia completa es de 2-3 años y lo estamos planificando con el Directorio.

Quería que lo supieras directamente, porque lo que haces merece esa transparencia.`,
    preguntas: [
      {
        q: "¿Por qué el ajuste no cierra toda la brecha?",
        a: "Porque la corrección completa involucra una decisión del Directorio que estamos preparando formalmente. El ajuste de hoy es el primer paso mientras ese proceso ocurre.",
      },
      {
        q: "¿Cuándo llego a la referencia de mercado?",
        a: "El horizonte estimado con el modelo actual es el Año 3. Cada año se revisa y aprueba el siguiente paso.",
      },
    ],
  },

  // ─── B2 ──────────────────────────────────────────────────────────────────
  {
    id: "camila",
    guiaLider: `Camila tiene perfil de gestión operativa-interna. Su referencia de mercado es $3,123 — no el punto medio de la banda, sino un 10% por debajo, porque el sistema reconoce que roles de gestión interna se ubican ahí en ONG comparables.

Hoy está en $2,811 — el 90% de su referencia. El ajuste del 5% la lleva a $2,952, acercándola a su objetivo.

La clave de esta conversación: explicar sin tecnicismos que hay dos tipos de roles en su nivel — los que miran hacia fuera y los que gestionan hacia adentro — y que eso tiene un valor de mercado distinto. No es jerarquía, es calibración.`,
    mensajeColaborador: `Camila, quiero explicarte cómo funciona el nuevo sistema para que entiendas exactamente dónde estás y hacia dónde vas.

En tu nivel de la organización — Direcciones — el sistema distingue entre dos tipos de rol. Los que tienen representación y exposición externa constante, y los que gestionan los procesos internos que hacen que todo funcione. Tu rol es del segundo tipo, y eso tiene un valor de mercado específico en organizaciones como DD.

Tu referencia es $3,123. Hoy estás en $2,811. El ajuste de este año te acerca a ese objetivo. Vamos en la dirección correcta.`,
    preguntas: [
      {
        q: "¿Por qué mi referencia es menor que la de otros en mi nivel?",
        a: "Porque el mercado valora distinto los roles que tienen mucha exposición externa de los que gestionan internamente. No es que un rol sea más importante que el otro — es que el mercado de talento para cada uno funciona diferente. El sistema refleja eso.",
      },
      {
        q: "¿Eso puede cambiar?",
        a: "Si el rol evoluciona — por ejemplo, si empiezas a tener representación externa sistemática — se revisaría en el próximo ciclo. Los roles no son fijos, las bandas tampoco.",
      },
    ],
  },

  {
    id: "catalia",
    guiaLider: `Catalia tiene la brecha más importante de su nivel: hoy recibe el 71% de su referencia de mercado ($3,817 para perfil estratégico). El ajuste del 10% este año la lleva a ~$2,980 — avance real pero todavía lejos.

La conversación debe ser honesta sobre la brecha y el tiempo que toma corregirla. El sistema la reconoce como una de las personas más lejanas de su referencia, y por eso recibe uno de los ajustes más altos.

Importante: su referencia es $3,817 — más alta que el punto medio de la banda — porque su rol tiene alta exposición al mercado externo de comunicaciones digitales. Eso hay que explicarlo de entrada.`,
    mensajeColaborador: `Catalia, hay algo que quiero decirte claramente: el nuevo sistema reconoce que tu rol está sub-pagado respecto a lo que el mercado paga por comunicaciones estratégicas en el sector de derechos digitales. Y eso es algo que tenemos que corregir.

Tu referencia de mercado es $3,817 — más alta que el punto medio de tu nivel, porque hay alta demanda y poca oferta para perfiles como el tuyo. Hoy estás en $2,709. La diferencia es significativa.

Este año recibís el segundo ajuste más alto del equipo — un 10% — porque el sistema prioriza a quienes tienen más brecha y más nivel. Es el primer paso de un plan de convergencia que toma 3 años.

Quería que supieras que el sistema te ve y que estamos trabajando activamente en corregir esto.`,
    preguntas: [
      {
        q: "¿Por qué tardó tanto en corregirse?",
        a: "Porque hasta ahora no había un sistema que pusiera esto sobre la mesa. Los ajustes se hacían año a año sin una referencia objetiva. Ahora sí la tenemos, y lo primero que hace es mostrar exactamente este tipo de situación.",
      },
      {
        q: "3 años parece mucho tiempo.",
        a: "Entiendo que lo parezca. La corrección progresiva es la única forma de hacerlo de manera sostenible. Lo importante es que cada año hay un avance real y garantizado — no es una promesa vaga.",
      },
      {
        q: "¿Cuánto me falta exactamente?",
        a: "Después del ajuste de este año estás en ~$2,980. La referencia es $3,817. Quedan ~$837 de brecha. Con el modelo actual, el Año 2 te llevaría a ~$3,278 y el Año 3 a ~$3,600 — cerca de la referencia completa.",
      },
    ],
  },

  {
    id: "miguel",
    guiaLider: `Miguel tiene exactamente la misma situación que Camila: perfil operativo-interno, referencia $3,123, hoy en $2,811. El ajuste del 5% lo lleva a $2,952.

Misma narrativa que Camila sobre la diferenciación de perfiles. La única diferencia es que es el miembro más senior de B2 operativo (6.5 años) — vale mencionarlo como reconocimiento.`,
    mensajeColaborador: `Miguel, quiero explicarte tu posición en el nuevo sistema de compensaciones.

Tu rol está en el nivel de Direcciones, con un perfil de gestión tecnológica interna. El sistema distingue entre roles que tienen mucha exposición al mercado externo y roles que hacen funcionar los procesos internos — el tuyo es fundamental en esa segunda categoría, y tiene una referencia de mercado específica: $3,123.

Hoy estás en $2,811. Con el ajuste de este año llegás a ~$2,952. Vamos cerrando esa diferencia.`,
    preguntas: [
      {
        q: "¿Por qué tecnología es gestión interna y no estratégica?",
        a: "El criterio es la representación externa sistemática. El rol de tecnologías en DD es principalmente interno — gestión de sistemas, seguridad, infraestructura. Si el rol evoluciona hacia asesoría o representación externa, se revisaría en el próximo ciclo.",
      },
      {
        q: "¿Cuándo llego a la referencia?",
        a: "Con el modelo actual, el horizonte estimado es el Año 2-3. Cada año se revisa el avance.",
      },
    ],
  },

  {
    id: "paloma",
    guiaLider: `Paloma parece bien posicionada a primera vista, pero medido contra su referencia real ($3,817 para perfil estratégico), está al 94% — todavía bajo target.

El ajuste del 5% la lleva a ~$3,779 — muy cerca de su referencia. Una conversación positiva: está casi en su punto objetivo.

Importante aclarar que su referencia es más alta que el punto medio de la banda porque su rol tiene exposición externa significativa en política pública regional.`,
    mensajeColaborador: `Paloma, tu situación en el nuevo sistema es una de las más sólidas del equipo.

Tu rol en política pública tiene una referencia de mercado de $3,817 — más alta que el promedio de tu nivel, porque hay alta exposición y demanda para este perfil. Hoy estás en $3,599, que es el 94% de esa referencia. Con el ajuste de este año llegás a ~$3,779 — prácticamente en tu punto objetivo.

El sistema te reconoce como alguien que está cerca de donde debería estar. El ajuste de este año termina de cerrar esa diferencia.`,
    preguntas: [
      {
        q: "¿Por qué recibo ajuste si ya estoy bien posicionada?",
        a: "Porque todavía hay una diferencia pequeña entre tu sueldo actual y tu referencia de mercado. El sistema ajusta mientras esa diferencia exista, aunque sea pequeña.",
      },
      {
        q: "¿El año que viene recibo ajuste?",
        a: "Depende de dónde estés respecto a tu referencia y cómo evolucione el mercado. Si estás en o sobre tu referencia, el sistema te protege pero no agrega más.",
      },
    ],
  },

  {
    id: "rafael",
    guiaLider: `Rafael tiene perfil estratégico-externo con referencia $3,817. Hoy está en $3,382 — el 89% de su objetivo. El ajuste del 10% lo lleva a ~$3,720, muy cerca del target.

Esta conversación es positiva: Senior, brecha manejable, ajuste significativo, casi en posición. El sistema lo reconoce bien.`,
    mensajeColaborador: `Rafael, con el nuevo sistema tenés una imagen clara de tu posición y hacia dónde vas.

Tu rol de liderazgo LARRED tiene una referencia de mercado de $3,817 — en el tramo alto de tu nivel, porque tiene alta exposición regional y demanda escasa de perfiles con esta especialidad. Hoy estás en $3,382.

Este año recibís un ajuste del 10% — uno de los más altos — porque el sistema reconoce tu nivel de desarrollo y la brecha que aún existe. Después del ajuste llegás a ~$3,720, muy cerca de tu referencia.`,
    preguntas: [
      {
        q: "¿Cuándo llego a la referencia completa?",
        a: "Con el ajuste de este año quedás a $97 de distancia. El Año 2 debería cerrar eso completamente, asumiendo continuidad del modelo.",
      },
    ],
  },

  // ─── B3 ──────────────────────────────────────────────────────────────────
  {
    id: "debora",
    guiaLider: `Débora está al 122% de la referencia de mercado para su nivel. Es la situación más marcada de B3. No hay ajuste este año.

Esta conversación requiere tacto y honestidad. El mensaje central: el sistema te valora y precisamente por eso hay que ser honestos. Seguir los lineamientos que acordamos: no mencionar el presupuesto como razón — la razón es la equidad interna del sistema.

Ella puede percibir esto como una mala noticia. La clave es encuadrarlo como una señal positiva (el sistema te ubica bien) y dar certeza de que no hay reducción.`,
    mensajeColaborador: `Débora, quiero compartirte algo con transparencia porque me parece que te lo mereces.

Con el nuevo sistema de compensaciones, por primera vez tenemos una referencia objetiva de lo que el mercado paga para cada nivel y tipo de rol. Cuando aplicamos esa referencia a tu situación, vemos que tu sueldo actual está sobre ese punto de referencia. Eso significa que históricamente tu compensación creció más rápido que la referencia de mercado.

El nuevo sistema tiene un principio claro: los sueldos no se reducen. El tuyo está protegido donde está.

Lo que sí cambia es que este año el ajuste va a las personas que están más lejos de su referencia — y en eso el sistema necesita ser equitativo. Tu sueldo ya paga lo que el mercado establece para tu rol, y más.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias con datos de mercado actualizados, es posible que el espacio se vaya abriendo. Lo que sí te pido es que continúes aportando como lo has hecho hasta ahora, porque contamos contigo y el equipo lo nota.

¿Hay algo de esto que quieras conversar o que no haya quedado claro?`,
    preguntas: [
      {
        q: "¿Significa que gano demasiado?",
        a: "No es esa la lectura correcta. Significa que tu sueldo está por sobre el punto de referencia de mercado que construimos. Eso puede reflejar perfectamente tu trayectoria y lo que aportás. El sistema no lo cuestiona — establece un nuevo punto de partida compartido para todos.",
      },
      {
        q: "¿Me van a bajar el sueldo en algún momento?",
        a: "No. El principio del sistema es explícito: los sueldos no se reducen. Lo que puede ocurrir es que en años con ajustes, la prioridad vaya a quienes tienen mayor distancia con la referencia.",
      },
      {
        q: "¿Mis colegas saben cuánto gano?",
        a: "No. Los datos individuales son confidenciales. Lo que el equipo sabe es que existe una referencia de mercado y que el sistema prioriza a quienes están más lejos de ella.",
      },
      {
        q: "¿Cuándo podré volver a recibir ajuste?",
        a: "Cuando la referencia de mercado de tu nivel se actualice y tu sueldo quede dentro del nuevo rango, el sistema te incluye naturalmente. No hay un plazo fijo — depende de cómo evolucione el mercado en los próximos ciclos.",
      },
    ],
  },

  {
    id: "marina",
    guiaLider: `Marina lleva 1 año en DD y su sueldo ya está al 113% de la referencia. Es la única persona Junior del equipo en esta situación — entró con un sueldo negociado por sobre la referencia.

No hay ajuste este año. La conversación debe ser breve, clara y sin que genere ansiedad — es su primer proceso de compensaciones en DD. Enfocarse en que el sueldo está bien, que está protegido, y que el sistema reconoce su ingreso.`,
    mensajeColaborador: `Marina, bienvenida a este proceso — es la primera vez que DD hace esto de manera formal.

Al revisar tu posición con la nueva referencia de mercado, vemos que tu sueldo está sobre ese punto. Eso significa que cuando ingresaste a DD, lo hiciste con una compensación que ya reconocía bien tu perfil.

Este año no hay ajuste adicional — y eso es una señal positiva, no negativa. Tu sueldo está bien posicionado.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias con datos de mercado, es posible que el espacio se vaya abriendo. Lo que sí te pido es que continúes aportando como lo has hecho hasta ahora, porque contamos contigo.

¿Hay algo de esto que quieras conversar?`,
    preguntas: [
      {
        q: "¿Esto afecta mi crecimiento dentro de DD?",
        a: "No afecta tu desarrollo de carrera ni tu progresión de nivel. Significa que los ajustes futuros serán más graduales hasta que la referencia de mercado alcance tu sueldo actual.",
      },
      {
        q: "¿Voy a recibir ajuste el año que viene?",
        a: "Depende de cómo evolucione el mercado y de dónde esté tu sueldo respecto a la referencia actualizada. El sistema es dinámico — se revisa cada año.",
      },
    ],
  },

  {
    id: "lucia",
    guiaLider: `Lucía está al 117% de la referencia. Nivel Pleno, 3 años de antigüedad. No hay ajuste este año.

Conversación similar a Débora — directa, con tacto, enfocada en que el sueldo está bien posicionado y que el sistema lo protege.`,
    mensajeColaborador: `Lucía, con el nuevo sistema de compensaciones podemos ver por primera vez la posición de cada persona respecto a la referencia de mercado.

En tu caso, tu sueldo está sobre esa referencia para tu nivel y tipo de rol. Eso significa que estás bien compensada — históricamente tu sueldo creció por sobre lo que establece el mercado de referencia.

Este año no hay ajuste adicional, y eso es simplemente el sistema funcionando con equidad.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias, es posible que el espacio se vaya abriendo. Lo que sí te pido es que continúes aportando como lo has hecho, porque contamos contigo.

¿Algo que quieras conversar?`,
    preguntas: [
      {
        q: "¿Gano más que mis colegas del mismo nivel?",
        a: "Los datos individuales son confidenciales. Lo que puedo decirte es que tu posición en el rango salarial es sólida y está protegida.",
      },
      {
        q: "¿Cuándo recibo un ajuste?",
        a: "Cuando la referencia de mercado se actualice y tu sueldo quede dentro del nuevo rango, el sistema te incluye. Se revisa anualmente en octubre.",
      },
    ],
  },

  {
    id: "paula",
    guiaLider: `Paula es el caso más especial de todo el equipo. Con 12 años y un rol que va mucho más allá de una coordinación estándar, tiene una referencia propia de $2,576 — un 15% sobre el punto medio de la banda.

Hoy está al 83% de esa referencia ($2,132). El ajuste del 10% la lleva a ~$2,345 — cruzando el punto medio. Es un avance significativo que hay que nombrar explícitamente.

Esta conversación debe reconocer abiertamente los 12 años. No es un número menor. El sistema la ve, y eso debe decirse.`,
    mensajeColaborador: `Paula, quiero comenzar esta conversación reconociendo algo: 12 años en DD es una trayectoria que pocas personas tienen, y tu rol de apoyo directo a la dirección ejecutiva en materias legales y estratégicas hace que tu posición sea única en el equipo.

El nuevo sistema lo reconoce de una manera concreta: tu referencia de mercado no es el punto medio de tu nivel — es un 15% más alta, porque el sistema establece que un rol con tu especialización, tu trayectoria y tu cercanía a la dirección merece estar en el tramo más alto de la banda.

Hoy estás al 83% de esa referencia. Con el ajuste de este año — un 10%, uno de los más altos del equipo — llegás a ~$2,345, cruzando el punto medio de tu banda por primera vez.

El camino hacia la referencia completa es de 2-3 años. Pero lo más importante es que el sistema te ve, reconoce lo que aportás, y está trabajando activamente para llevar tu compensación a donde debe estar.`,
    preguntas: [
      {
        q: "¿Por qué sigo en el mismo nivel si apoyo directamente a los co-directores?",
        a: "Tu clasificación en Coordinaciones refleja la naturaleza formal de tu cargo. Lo que el sistema sí reconoce es que dentro de ese nivel, tu referencia es la más alta — un 15% sobre el punto medio. Si el cargo evoluciona formalmente hacia funciones de dirección, se revisaría en el próximo ciclo.",
      },
      {
        q: "¿12 años no merece más reconocimiento?",
        a: "La antigüedad es exactamente lo que justifica tener la referencia más alta de tu nivel. Es el reconocimiento más concreto que el sistema puede hacer dentro de la estructura actual. Y el ajuste de este año — 10% — refleja eso en pesos reales.",
      },
      {
        q: "¿Cuándo llego a mi referencia completa?",
        a: "Después del ajuste de este año estás en ~$2,345. Tu referencia es $2,576. Quedan ~$231 de diferencia. Con el modelo actual, deberías llegar en el ciclo 2027-2028.",
      },
    ],
  },

  // ─── B4 ──────────────────────────────────────────────────────────────────
  {
    id: "gaston",
    guiaLider: `Gastón, Nicole y Laura tienen exactamente la misma situación: B4 Pleno, 2.5 años, sueldo $1,800 al 113% de la referencia. No hay ajuste este año.

Conversación breve y directa. El sueldo está bien, está protegido, y el sistema lo reconoce.`,
    mensajeColaborador: `Gastón, con el nuevo sistema de compensaciones podemos ver la posición de cada persona respecto a la referencia de mercado.

En tu caso, tu sueldo actual está sobre esa referencia para tu nivel. Eso es una buena señal — significa que estás bien compensado.

Este año no hay ajuste adicional porque el sistema prioriza a quienes están más alejados de su referencia. Tu sueldo está protegido y se mantiene donde está.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias, es posible que el espacio se abra. Lo que sí te pido es que continúes aportando como lo has hecho, porque contamos contigo.

¿Algo que quieras preguntar?`,
    preguntas: [
      {
        q: "¿Puedo crecer hacia una coordinación en el futuro?",
        a: "La progresión entre niveles se define en la Fase B del sistema, que arranca en abril. Los criterios van a ser claros y el camino va a existir. Tu tiempo en DD y tu nivel de desarrollo son los insumos principales para esa conversación.",
      },
    ],
  },

  {
    id: "nicole",
    guiaLider: `Misma situación que Gastón y Laura. Conversación breve y directa.`,
    mensajeColaborador: `Nicole, en el nuevo sistema de compensaciones tu sueldo está sobre la referencia de mercado para tu nivel. Eso es positivo — significa que estás bien compensada.

Este año no hay ajuste adicional — el sistema prioriza a quienes tienen mayor distancia con la referencia. Tu sueldo está protegido.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias, es posible que el espacio se abra. Lo que sí te pido es que continúes aportando como lo has hecho, porque contamos contigo.

¿Algo que quieras conversar?`,
    preguntas: [
      {
        q: "¿Hay diferencia entre Costa Rica y Argentina en el sistema?",
        a: "El sistema usa una escala única en dólares para todos — eso asegura equidad entre países. En la Fase B se evaluará si hay ajustes por costo de vida que tengan sentido.",
      },
    ],
  },

  {
    id: "laura",
    guiaLider: `Misma situación que Gastón y Nicole. Conversación breve y directa.`,
    mensajeColaborador: `Laura, en el nuevo sistema tu sueldo está sobre la referencia de mercado para tu nivel. Eso significa que estás bien compensada.

Este año no hay ajuste adicional — el sistema prioriza a quienes tienen mayor distancia con la referencia. Tu sueldo se mantiene protegido donde está.

Tu sueldo está sobre banda. En los próximos ciclos, a medida que actualicemos las referencias, es posible que el espacio se abra. Lo que sí te pido es que continúes aportando como lo has hecho, porque contamos contigo.

¿Hay algo que quieras preguntar?`,
    preguntas: [
      {
        q: "¿Puedo llegar a una Coordinación en el futuro?",
        a: "Ese camino existe y se va a formalizar con criterios claros en la Fase B del sistema — que arranca en abril. Tu tiempo en DD y tu nivel de desarrollo son exactamente los insumos que se necesitan para esa conversación.",
      },
    ],
  },

  {
    id: "maria",
    guiaLider: `María es la persona más senior de B4 con 4.25 años y nivel Senior. Está al 123% de la referencia — incluso sobre el máximo de la banda ($1,870).

Esta es la conversación más delicada de B4. No hay ajuste, y además está en el techo de su nivel. El mensaje central debe girar en torno al reconocimiento y a la Fase B: su caso es el más prioritario para definir criterios de progresión a Coordinaciones.

Ser muy cuidadoso de no dejar la sensación de que está 'atrapada'. Al contrario: el sistema la ve como la candidata natural para crecer al siguiente nivel.`,
    mensajeColaborador: `María, antes de hablar de números, quiero decirte algo: con 4 años en DD sos la persona con más trayectoria dentro de tu nivel — y eso el sistema lo registra.

Al revisar tu posición con la nueva referencia de mercado, vemos que tu sueldo está sobre ese punto — incluso sobre el techo del rango para tu nivel. Eso no es un problema, es una señal de que tu compensación ya reconoce tu desarrollo.

Este año no hay ajuste adicional — el sueldo se mantiene protegido. Y quiero ser honesto sobre lo que esto significa: el sistema te está diciendo que tu próximo paso no es un ajuste dentro de este nivel, sino la progresión al siguiente.

Tu caso es el primero que trabajaremos en la Fase B del sistema — que arranca en abril — para definir exactamente cómo se da esa progresión. Contamos con vos para eso.

¿Hay algo de esto que quieras conversar?`,
    preguntas: [
      {
        q: "¿Significa que estoy en un techo y no puedo crecer?",
        a: "Al contrario. Significa que dentro de tu nivel actual ya alcanzaste el tope. El próximo paso natural es la progresión a Coordinaciones — y tu caso es el primero en la agenda de la Fase B para definir exactamente cómo ocurre eso.",
      },
      {
        q: "¿Cuándo se define la progresión?",
        a: "En la Fase B del sistema, que arranca en abril. El objetivo es tener criterios claros de progresión entre niveles antes de junio.",
      },
      {
        q: "¿Recibiré ajuste cuando progrese?",
        a: "Si pasás al nivel de Coordinaciones, tu referencia salarial sube al rango de B3. El ajuste se calcula en ese momento según la nueva referencia.",
      },
    ],
  },
];

// ── Helper: buscar narrativa por id ─────────────────────────────────────────
export function getNarrativa(id: string): Narrativa | undefined {
  return NARRATIVAS.find((n) => n.id === id);
}
