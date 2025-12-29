// src/config/emblamaticCases.ts
// 🎯 Casos emblemáticos para Exit Intelligence
// Separado del motor para mantenibilidad
// FUTURO: Migrar a base de datos

import type { EmblamaticCase } from '@/types/ExitBusinessCase';

/**
 * CASOS EMBLEMÁTICOS CON AUTOPSIA REAL
 * 
 * Cada caso incluye:
 * - Datos básicos (company, incident, cost, etc.)
 * - Timeline de autopsia: cómo escaló de indicios → escándalo
 * 
 * Organizados por categoría para selección inteligente según tipo de alerta
 */
export const EMBLEMATIC_CASES: Record<string, EmblamaticCase[]> = {
  
  cultura_toxica: [
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 1: UBER
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Uber',
      incident: 'Cultura tóxica + acoso sexual sistemático ignorado por años',
      cost: '$11.4M USD en acuerdos legales',
      consequence: 'CEO despedido, 20+ ejecutivos fuera, 200K usuarios eliminaron app',
      lesson: 'Las señales estaban ahí. Susan Fowler escribió UN blog post.',
      source: 'EEOC Settlements + Media Coverage 2017-2019',
      year: 2017,
      categoria: 'acoso',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2014-2016',
          descripcion: 'HR recibió 215+ quejas de acoso y discriminación. Empleados reportaron cultura de "bro" y represalias.',
          ignorado: '"Son casos aislados", "Es el precio del crecimiento rápido", "Travis es así"'
        },
        denuncia: {
          fecha: 'Febrero 2017',
          trigger: '1 blog post de una ingeniera',
          titulo: '"Reflecting on one very, very strange year at Uber"'
        },
        investigacion: {
          accion: 'Holder Investigation ordenada por el board. Eric Holder (ex-fiscal general USA) lideró.',
          consecuencias: '20+ ejecutivos despedidos o renunciados. Cambios masivos en políticas.'
        },
        escandalo: {
          resultado: 'CEO Travis Kalanick forzado a renunciar. Marca destruida por años.',
          costoFinal: '$11.4M acuerdos + daño reputacional incalculable + pérdida 200K usuarios'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 2: ACTIVISION BLIZZARD
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Activision Blizzard',
      incident: 'Cultura "frat boy", acoso sistemático, suicidio de empleada',
      cost: '$54M USD en acuerdos + $35M multa SEC',
      consequence: 'CEO Bobby Kotick despedido, venta forzada a Microsoft',
      lesson: 'Ignorar el problema durante años multiplicó el costo 100x.',
      source: 'California DFEH Lawsuit + SEC Settlement 2021-2023',
      year: 2021,
      categoria: 'acoso',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2016-2020',
          descripcion: 'Múltiples quejas internas de acoso. "Cosby Suite" conocida por todos. HR minimizaba reportes.',
          ignorado: '"Es cultura gamer", "Exageraciones", "El equipo de WoW siempre fue así"'
        },
        denuncia: {
          fecha: 'Julio 2021',
          trigger: 'Demanda del Estado de California (DFEH)',
          titulo: 'Investigación de 2 años reveló cultura de acoso sistémico'
        },
        investigacion: {
          accion: 'SEC investigó ocultamiento a inversionistas. Múltiples demandas colectivas.',
          consecuencias: '1,500+ empleados firmaron carta exigiendo cambios. Huelga histórica en gaming.'
        },
        escandalo: {
          resultado: 'CEO forzado a renunciar. Microsoft adquirió la empresa ($69B) para "limpiarla".',
          costoFinal: '$54M acuerdos + $35M SEC + venta forzada + tragedia humana irreparable'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 3: FOX NEWS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Fox News',
      incident: 'Acoso sexual sistemático liderado por el CEO Roger Ailes',
      cost: '$65M USD en acuerdos con víctimas',
      consequence: 'CEO despedido, múltiples anchors fuera, marca dañada',
      lesson: 'Cuando el acosador ES el CEO, el sistema completo está comprometido.',
      source: 'Multiple Settlements + NYT Investigation 2016-2017',
      year: 2016,
      categoria: 'acoso',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '1996-2015',
          descripcion: '20+ años de comportamiento conocido. Mujeres advertidas informalmente "no quedarse a solas con Roger".',
          ignorado: '"Es Roger siendo Roger", "Es el precio del éxito", "Nadie es indispensable"'
        },
        denuncia: {
          fecha: 'Julio 2016',
          trigger: 'Gretchen Carlson demanda después de ser despedida',
          titulo: 'Primera demanda pública contra Ailes'
        },
        investigacion: {
          accion: 'Investigación interna + 25+ mujeres se sumaron con testimonios similares',
          consecuencias: 'Bill O\'Reilly también despedido. Reestructuración completa.'
        },
        escandalo: {
          resultado: 'Roger Ailes despedido con $40M de indemnización (!). Murió al año siguiente.',
          costoFinal: '$65M+ acuerdos + daño reputacional + pérdida de talentos + caso símbolo #MeToo'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 4: RIOT GAMES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Riot Games',
      incident: 'Cultura "bro" en gaming, discriminación y acoso sistemático',
      cost: '$100M USD en acuerdo colectivo',
      consequence: 'Reestructuración total de HR, múltiples ejecutivos despedidos',
      lesson: 'La industria del gaming NO es excepción a las leyes laborales.',
      source: 'California DFEH Settlement 2021',
      year: 2018,
      categoria: 'cultura_toxica',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2012-2018',
          descripcion: 'Cultura de "bro" normalizada. Chistes sexistas en reuniones. Mujeres excluidas de decisiones.',
          ignorado: '"Es cultura gamer", "Las mujeres no entienden los juegos", "Es solo humor"'
        },
        denuncia: {
          fecha: 'Agosto 2018',
          trigger: 'Artículo de Kotaku expone testimonios de empleadas',
          titulo: '"Inside The Culture Of Sexism At Riot Games"'
        },
        investigacion: {
          accion: 'DFEH California demanda. Walkout de 150+ empleados.',
          consecuencias: 'COO suspendido por "pedos en la cara". Múltiples ejecutivos despedidos.'
        },
        escandalo: {
          resultado: 'Acuerdo récord de $100M. Cambio cultural forzado. Monitoreo externo por años.',
          costoFinal: '$100M + pérdida de talento femenino + marca dañada en industria'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 5: WEWORK
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'WeWork',
      incident: 'Cultura narcisista del CEO, ambiente tóxico, discriminación',
      cost: '$47B → $9B valoración en semanas',
      consequence: 'CEO despedido, IPO cancelado, reestructuración masiva',
      lesson: 'La cultura tóxica del fundador puede destruir hasta los unicornios.',
      source: 'WSJ Investigation + IPO Filing Analysis 2019',
      year: 2019,
      categoria: 'cultura_toxica',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2016-2019',
          descripcion: 'Adam Neumann con comportamiento errático. Tequila en reuniones. Despidos arbitrarios. Mujeres embarazadas discriminadas.',
          ignorado: '"Es un visionario", "Los genios son excéntricos", "SoftBank sigue invirtiendo"'
        },
        denuncia: {
          fecha: 'Septiembre 2019',
          trigger: 'IPO filing revela caos financiero y cultural',
          titulo: 'S-1 Filing expone gobernanza desastrosa'
        },
        investigacion: {
          accion: 'Inversionistas y medios investigaron. Board forzó cambios.',
          consecuencias: 'IPO cancelado. Valoración cayó 80% en semanas.'
        },
        escandalo: {
          resultado: 'CEO despedido con $1.7B (!). Despidos masivos. Casi quiebra.',
          costoFinal: '$38B destruidos + 8,000 despidos + símbolo de excesos de startups'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 6: WELLS FARGO
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Wells Fargo',
      incident: 'Cultura de presión tóxica llevó a fraude masivo de cuentas falsas',
      cost: '$3 MIL MILLONES USD en multas',
      consequence: 'CEO renunció, restricciones Fed por años, demandas interminables',
      lesson: 'La cultura tóxica no solo afecta empleados, destruye empresas enteras.',
      source: 'DOJ & SEC Settlements 2016-2020',
      year: 2016,
      categoria: 'fraude',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2011-2015',
          descripcion: 'Empleados reportaron metas imposibles. Presión extrema para "cross-selling". Gente abriendo cuentas falsas para sobrevivir.',
          ignorado: '"Son manzanas podridas", "Nuestras metas son ambiciosas pero alcanzables", "Esos empleados no tienen hambre"'
        },
        denuncia: {
          fecha: 'Septiembre 2016',
          trigger: 'Investigación de LA Times + reguladores descubren 3.5M cuentas falsas',
          titulo: '"Wells Fargo workers created millions of fake accounts"'
        },
        investigacion: {
          accion: 'DOJ, SEC, OCC, CFPB - todos investigaron. Audiencias del Congreso.',
          consecuencias: '5,300 empleados despedidos (los de abajo). CEO enfrentó Senado.'
        },
        escandalo: {
          resultado: 'CEO John Stumpf renunció. Fed impuso límite de crecimiento sin precedentes.',
          costoFinal: '$3B+ multas + restricción Fed + décadas de demandas + marca destruida'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 7: THERANOS
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Theranos',
      incident: 'Cultura de miedo y secretismo permitió fraude masivo en salud',
      cost: '$700M+ a inversionistas + daño a pacientes',
      consequence: 'CEO Elizabeth Holmes en prisión, empresa cerrada',
      lesson: 'La cultura de miedo silencia a los que podrían salvar la empresa.',
      source: 'WSJ Investigation + SEC + DOJ 2015-2022',
      year: 2015,
      categoria: 'fraude',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2013-2015',
          descripcion: 'Científicos internos alertaron que la tecnología no funcionaba. Ambiente de terror. NDAs agresivos. Vigilancia a empleados.',
          ignorado: '"Elizabeth es la próxima Steve Jobs", "Los científicos son negativos", "El board confía en ella"'
        },
        denuncia: {
          fecha: 'Octubre 2015',
          trigger: 'John Carreyrou del WSJ investiga por tip de exempleado',
          titulo: '"Hot Startup Theranos Has Struggled With Its Blood-Test Technology"'
        },
        investigacion: {
          accion: 'SEC, DOJ, FDA, CMS - todos investigaron. Walgreens terminó alianza.',
          consecuencias: 'Empresa cerrada. Inversionistas perdieron todo. Pacientes recibieron diagnósticos falsos.'
        },
        escandalo: {
          resultado: 'Elizabeth Holmes: 11 años de prisión. Sunny Balwani: 13 años.',
          costoFinal: '$700M+ perdidos + pacientes dañados + prisión + símbolo de fraude en startups'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 8: UNITED AIRLINES
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'United Airlines',
      incident: 'Pasajero arrastrado violentamente de avión, video viral',
      cost: '$1.4 MIL MILLONES USD perdidos en UN DÍA',
      consequence: 'CEO tuvo que disculparse públicamente, cambios de política industria',
      lesson: 'En la era digital, un incidente = crisis global instantánea.',
      source: 'Stock Market Data + Brand Tracking 2017',
      year: 2017,
      categoria: 'reputacion',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2015-2017',
          descripcion: 'Cultura de "el pasajero es un problema". Overbooking agresivo. Empleados sin autoridad para resolver.',
          ignorado: '"Es procedimiento estándar", "Todos hacemos overbooking", "Los pasajeros firman el contrato"'
        },
        denuncia: {
          fecha: 'Abril 2017',
          trigger: 'Video de pasajero (Dr. David Dao) siendo arrastrado se viraliza',
          titulo: 'Video visto 1 BILLÓN de veces en 24 horas'
        },
        investigacion: {
          accion: 'Audiencias del Congreso. Investigación DOT. Demanda del pasajero.',
          consecuencias: 'CEO Oscar Munoz inicialmente culpó al pasajero (!). Tuvo que retractarse.'
        },
        escandalo: {
          resultado: 'Acción cayó 4% en un día. Cambio de políticas de toda la industria.',
          costoFinal: '$1.4B valor mercado en 24h + acuerdo confidencial + cambios industria completa'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 9: BOEING
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Boeing',
      incident: 'Cultura que ignoraba alertas de ingenieros sobre 737 MAX',
      cost: '$60B valor mercado + $20B en multas y compensaciones',
      consequence: '346 personas muertas, aviones en tierra 2 años, crisis existencial',
      lesson: 'Cuando el liderazgo ignora alertas, las consecuencias son catastróficas.',
      source: 'Congressional Hearings + DOJ + FAA 2019-2021',
      year: 2019,
      categoria: 'cultura_toxica',
      pais: 'USA',
      autopsia: {
        indicios: {
          periodo: '2015-2018',
          descripcion: 'Ingenieros alertaron sobre MCAS. Pilotos de prueba reportaron problemas. Presión por competir con Airbus.',
          ignorado: '"Los ingenieros siempre son conservadores", "El timeline no se mueve", "FAA lo aprobará"'
        },
        denuncia: {
          fecha: 'Octubre 2018 + Marzo 2019',
          trigger: '2 aviones caen: Lion Air 610 + Ethiopian 302. 346 muertos.',
          titulo: 'Dos tragedias idénticas en 5 meses'
        },
        investigacion: {
          accion: 'Congreso, DOJ, FAA, autoridades internacionales. Flota mundial en tierra.',
          consecuencias: 'CEO Dennis Muilenburg despedido. Producción detenida. Criminal charges.'
        },
        escandalo: {
          resultado: '737 MAX en tierra 2 años. $2.5B acuerdo criminal. Reputación de seguridad destruida.',
          costoFinal: '$60B+ valor + $20B multas/compensaciones + 346 vidas + crisis existencial'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 10: CENCOSUD (CHILE)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'Cencosud (Jumbo/Paris)',
      incident: 'Casos de acoso laboral y prácticas antisindicales expuestos',
      cost: 'Multas DT + indemnizaciones + daño reputacional',
      consequence: 'Fiscalización intensiva, cambios en políticas laborales',
      lesson: 'En Chile post Ley Karin, la tolerancia a prácticas tóxicas es CERO.',
      source: 'Dirección del Trabajo + Medios Chile 2023-2024',
      year: 2023,
      categoria: 'ley_karin',
      pais: 'Chile',
      autopsia: {
        indicios: {
          periodo: '2020-2023',
          descripcion: 'Denuncias internas de acoso de supervisores. Prácticas antisindicales documentadas. Alta rotación en locales específicos.',
          ignorado: '"Son conflictos personales", "El sindicato exagera", "Tenemos protocolos"'
        },
        denuncia: {
          fecha: '2023',
          trigger: 'Múltiples denuncias formales + fiscalización DT',
          titulo: 'Casos emblemáticos en retail chileno'
        },
        investigacion: {
          accion: 'Dirección del Trabajo fiscalizó múltiples locales. Multas aplicadas.',
          consecuencias: 'Reestructuración de supervisores. Capacitación obligatoria.'
        },
        escandalo: {
          resultado: 'Marca empleadora dañada. Dificultad para reclutar. Monitoreo continuo.',
          costoFinal: 'Multas millonarias + rotación aumentada + marca empleadora dañada'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 11: BHP ESCONDIDA (CHILE)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'BHP Escondida',
      incident: 'Huelga histórica por condiciones laborales y beneficios',
      cost: '$740M USD en producción perdida',
      consequence: 'Negociación forzada, cambios en beneficios, precedente industria',
      lesson: 'Ignorar el clima laboral en minería tiene costos de MILLONES por día.',
      source: 'Reuters + Financial Reports 2017',
      year: 2017,
      categoria: 'reputacion',
      pais: 'Chile',
      autopsia: {
        indicios: {
          periodo: '2015-2017',
          descripcion: 'Encuestas de clima mostraban insatisfacción. Negociaciones tensas. Sindicato fortalecido.',
          ignorado: '"Siempre amenazan con huelga", "No se atreverán", "Tenemos reemplazantes"'
        },
        denuncia: {
          fecha: 'Febrero 2017',
          trigger: 'Sindicato rechaza oferta. Huelga más larga en historia minería chilena.',
          titulo: '44 días de huelga en la mina de cobre más grande del mundo'
        },
        investigacion: {
          accion: 'Mediación gobierno. Presión internacional. Inversionistas preocupados.',
          consecuencias: 'Producción detenida 44 días. Precio del cobre afectado globalmente.'
        },
        escandalo: {
          resultado: 'Acuerdo con mejoras significativas. Precedente para toda la industria minera.',
          costoFinal: '$740M producción perdida + nuevos costos laborales + precedente industria'
        }
      }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CASO 12: LATAM AIRLINES (CHILE)
    // ═══════════════════════════════════════════════════════════════════════════
    {
      company: 'LATAM Airlines',
      incident: 'Despidos masivos durante pandemia generaron crisis reputacional',
      cost: 'Chapter 11 + pérdida de talento + marca dañada',
      consequence: 'Reestructuración total, años recuperando confianza empleados',
      lesson: 'Cómo manejas una crisis define tu marca empleadora por décadas.',
      source: 'Medios + SEC Filings 2020-2022',
      year: 2020,
      categoria: 'reputacion',
      pais: 'Chile',
      autopsia: {
        indicios: {
          periodo: '2019-2020',
          descripcion: 'Tensiones laborales previas. Fusión LATAM-TAM dejó heridas. Cultura de "recorte primero".',
          ignorado: '"La pandemia lo justifica todo", "No hay alternativa", "Los empleados entenderán"'
        },
        denuncia: {
          fecha: 'Mayo 2020',
          trigger: 'Despidos masivos comunicados por email. Videos de pilotos llorando virales.',
          titulo: 'Crisis de imagen por manejo de despidos'
        },
        investigacion: {
          accion: 'Chapter 11 en USA. Escrutinio público. Empleados organizándose.',
          consecuencias: 'Pérdida de talento clave. Dificultad para recontratar post-pandemia.'
        },
        escandalo: {
          resultado: 'Recuperación lenta. Marca empleadora dañada. Competencia captó talento.',
          costoFinal: 'Bancarrota + pérdida talento + años reconstruyendo confianza'
        }
      }
    }
  ]
};

/**
 * Estadísticas principales que rotan diariamente
 */
export const MAIN_STATISTICS = [
  {
    value: '60%',
    description: 'de empresas en crisis de reputación NUNCA se recuperan completamente',
    source: 'Deloitte 2023'
  },
  {
    value: '30%',
    description: 'pérdida de valor de mercado puede ocurrir en DÍAS durante una crisis',
    source: 'Deloitte 2023'
  },
  {
    value: '50%',
    description: 'de empleados renuncian para escapar de su JEFE, no de la empresa',
    source: 'Gallup 2024'
  },
  {
    value: '42%',
    description: 'de la rotación ES PREVENIBLE con acción gerencial adecuada',
    source: 'Gallup 2024'
  },
  {
    value: '215+',
    description: 'quejas ignoró Uber antes de que UN blog post destruyera todo',
    source: 'Holder Investigation 2017'
  },
  {
    value: '$100M',
    description: 'pagó Riot Games por ignorar cultura "bro" durante años',
    source: 'DFEH Settlement 2021'
  }
];