import { PrismaClient } from '@prisma/client'
  import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting FocalizaHR MVP seed data...')

  // PASO 1: Limpiar datos existentes si es necesario
console.log('🧹 Cleaning existing data...');
// El orden es importante para evitar errores de 'foreign key'.
// Se borra desde las tablas más "dependientes" hacia las más "maestras".
await prisma.response.deleteMany();
await prisma.participant.deleteMany();
await prisma.campaignResult.deleteMany();
await prisma.auditLog.deleteMany();
await prisma.campaign.deleteMany();
await prisma.question.deleteMany();
await prisma.communicationTemplate.deleteMany();
await prisma.campaignType.deleteMany();
await prisma.account.deleteMany(); // <-- Esta línea soluciona el error y limpia la tabla de cuentas.
  // PASO 2: Crear tipos de campaña
  console.log('📋 Creating campaign types...')
  
  const pulsoExpress = await prisma.campaignType.create({
    data: {
      name: 'Pulso Express',
      slug: 'pulso-express',
      description: 'Diagnóstico rápido clima organizacional',
      estimatedDuration: 5,
      questionCount: 12,
      methodology: 'Metodología Litwin & Stringer adaptada',
      category: 'clima',
      sortOrder: 1
    }
  })

  const experienciaFull = await prisma.campaignType.create({
    data: {
      name: 'Experiencia Colaborador Full',
      slug: 'experiencia-full',
      description: 'Análisis integral experiencia empleado',
      estimatedDuration: 15,
      questionCount: 35,
      methodology: 'Employee Experience Framework',
      category: 'experiencia',
      sortOrder: 2
    }
  })

  console.log(`✅ Created campaign types: ${pulsoExpress.name}, ${experienciaFull.name}`)

  // PASO 3: Crear preguntas Pulso Express (12 preguntas)
  console.log('❓ Creating Pulso Express questions...')
  
  const pulsoQuestions = [
    // LIDERAZGO (3 preguntas)
    {
      text: 'Mi jefe inmediato me da feedback constructivo regularmente',
      category: 'liderazgo',
      subcategory: 'feedback',
      order: 1,
      methodology: 'Litwin & Stringer Leadership Climate'
    },
    {
      text: 'Siento que mi supervisor me apoya en mi desarrollo profesional',
      category: 'liderazgo',
      subcategory: 'desarrollo',
      order: 2,
      methodology: 'Supportive Leadership Theory'
    },
    {
      text: 'Las decisiones de mi jefe son claras y consistentes',
      category: 'liderazgo',
      subcategory: 'claridad',
      order: 3,
      methodology: 'Decision-Making Clarity Index'
    },
    
    // AMBIENTE LABORAL (3 preguntas)
    {
      text: 'Me siento cómodo expresando mis opiniones en el trabajo',
      category: 'ambiente',
      subcategory: 'comunicacion',
      order: 4,
      methodology: 'Psychological Safety Scale'
    },
    {
      text: 'Existe un buen ambiente de compañerismo en mi equipo',
      category: 'ambiente',
      subcategory: 'colaboracion',
      order: 5,
      methodology: 'Team Cohesion Measure'
    },
    {
      text: 'Mi lugar de trabajo me permite concentrarme y ser productivo',
      category: 'ambiente',
      subcategory: 'condiciones',
      order: 6,
      methodology: 'Workplace Environment Assessment'
    },
    
    // DESARROLLO (3 preguntas)
    {
      text: 'Tengo oportunidades claras de crecimiento en mi trabajo actual',
      category: 'desarrollo',
      subcategory: 'oportunidades',
      order: 7,
      methodology: 'Career Development Opportunities Scale'
    },
    {
      text: 'Recibo la capacitación necesaria para hacer bien mi trabajo',
      category: 'desarrollo',
      subcategory: 'capacitacion',
      order: 8,
      methodology: 'Training Adequacy Measure'
    },
    {
      text: 'Mis habilidades son bien utilizadas en mi puesto actual',
      category: 'desarrollo',
      subcategory: 'utilizacion',
      order: 9,
      methodology: 'Skills Utilization Index'
    },
    
    // BIENESTAR (3 preguntas)
    {
      text: 'Puedo mantener un buen equilibrio entre trabajo y vida personal',
      category: 'bienestar',
      subcategory: 'equilibrio',
      order: 10,
      methodology: 'Work-Life Balance Scale'
    },
    {
      text: 'Me siento valorado por el trabajo que realizo',
      category: 'bienestar',
      subcategory: 'reconocimiento',
      order: 11,
      methodology: 'Employee Recognition Assessment'
    },
    {
      text: 'En general, estoy satisfecho trabajando en esta empresa',
      category: 'bienestar',
      subcategory: 'satisfaccion',
      order: 12,
      methodology: 'Overall Job Satisfaction Scale'
    }
  ]

  for (const q of pulsoQuestions) {
    await prisma.question.create({
      data: {
        campaignTypeId: pulsoExpress.id,
        text: q.text,
        category: q.category,
        subcategory: q.subcategory,
        questionOrder: q.order,
        methodologyReference: q.methodology,
        responseType: 'rating',
        isRequired: true,
        minValue: 1,
        maxValue: 5
      }
    })
  }

  console.log(`✅ Created ${pulsoQuestions.length} Pulso Express questions`)

  // PASO 4: Crear preguntas Experiencia Colaborador Full (35 preguntas)
  console.log('❓ Creating Experiencia Full questions...')
  
  const experienciaQuestions = [
    // LIDERAZGO EXPANDIDO (8 preguntas)
    {
      text: 'Mi supervisor establece expectativas claras sobre mi desempeño',
      category: 'liderazgo',
      subcategory: 'expectativas',
      order: 1
    },
    {
      text: 'Recibo reconocimiento oportuno por mis logros',
      category: 'liderazgo',
      subcategory: 'reconocimiento',
      order: 2
    },
    {
      text: 'Mi jefe me involucra en decisiones que afectan mi trabajo',
      category: 'liderazgo',
      subcategory: 'participacion',
      order: 3
    },
    {
      text: 'Confío en la capacidad de liderazgo de mi supervisor directo',
      category: 'liderazgo',
      subcategory: 'confianza',
      order: 4
    },
    {
      text: 'Mi supervisor me da la autonomía necesaria para hacer mi trabajo',
      category: 'liderazgo',
      subcategory: 'autonomia',
      order: 5
    },
    {
      text: 'Las reuniones con mi jefe son productivas y útiles',
      category: 'liderazgo',
      subcategory: 'efectividad',
      order: 6
    },
    {
      text: 'Mi supervisor maneja los conflictos de manera efectiva',
      category: 'liderazgo',
      subcategory: 'resolucion',
      order: 7
    },
    {
      text: 'Siento que mi jefe se preocupa por mi bienestar personal',
      category: 'liderazgo',
      subcategory: 'cuidado',
      order: 8
    },
    
    // DESARROLLO EXPANDIDO (10 preguntas)
    {
      text: 'Tengo un plan de desarrollo profesional claro y actualizado',
      category: 'desarrollo',
      subcategory: 'planificacion',
      order: 9
    },
    {
      text: 'La empresa invierte en mi desarrollo y crecimiento profesional',
      category: 'desarrollo',
      subcategory: 'inversion',
      order: 10
    },
    {
      text: 'Puedo acceder fácilmente a recursos de aprendizaje y capacitación',
      category: 'desarrollo',
      subcategory: 'acceso',
      order: 11
    },
    {
      text: 'Las capacitaciones que recibo son relevantes para mi trabajo',
      category: 'desarrollo',
      subcategory: 'relevancia',
      order: 12
    },
    {
      text: 'Tengo mentores o referentes que me guían en mi crecimiento',
      category: 'desarrollo',
      subcategory: 'mentoria',
      order: 13
    },
    {
      text: 'Puedo aplicar inmediatamente lo que aprendo en las capacitaciones',
      category: 'desarrollo',
      subcategory: 'aplicacion',
      order: 14
    },
    {
      text: 'Existe un camino claro para ascender en la organización',
      category: 'desarrollo',
      subcategory: 'ascenso',
      order: 15
    },
    {
      text: 'Recibo feedback específico sobre cómo mejorar mi desempeño',
      category: 'desarrollo',
      subcategory: 'mejora',
      order: 16
    },
    {
      text: 'Puedo desarrollar nuevas habilidades en mi puesto actual',
      category: 'desarrollo',
      subcategory: 'nuevas_habilidades',
      order: 17
    },
    {
      text: 'La empresa me da oportunidades para asumir nuevos desafíos',
      category: 'desarrollo',
      subcategory: 'desafios',
      order: 18
    },
    
    // AMBIENTE EXPANDIDO (5 preguntas)
    {
      text: 'La comunicación interna en la empresa es efectiva y transparente',
      category: 'ambiente',
      subcategory: 'comunicacion_interna',
      order: 19
    },
    {
      text: 'Existe colaboración efectiva entre diferentes áreas/departamentos',
      category: 'ambiente',
      subcategory: 'colaboracion_interdepartamental',
      order: 20
    },
    {
      text: 'El ambiente físico de trabajo es cómodo y apropiado',
      category: 'ambiente',
      subcategory: 'ambiente_fisico',
      order: 21
    },
    {
      text: 'Tengo acceso a las herramientas y tecnología necesarias',
      category: 'ambiente',
      subcategory: 'herramientas',
      order: 22
    },
    {
      text: 'Me siento parte de un equipo cohesionado y colaborativo',
      category: 'ambiente',
      subcategory: 'cohesion_equipo',
      order: 23
    },
    
    // BIENESTAR EXPANDIDO (12 preguntas)
    {
      text: 'Mi carga de trabajo es manejable y realista',
      category: 'bienestar',
      subcategory: 'carga_trabajo',
      order: 24
    },
    {
      text: 'Tengo flexibilidad en mis horarios cuando lo necesito',
      category: 'bienestar',
      subcategory: 'flexibilidad',
      order: 25
    },
    {
      text: 'Los beneficios que ofrece la empresa satisfacen mis necesidades',
      category: 'bienestar',
      subcategory: 'beneficios',
      order: 26
    },
    {
      text: 'Me siento seguro y protegido en mi lugar de trabajo',
      category: 'bienestar',
      subcategory: 'seguridad',
      order: 27
    },
    {
      text: 'Puedo expresar mis ideas sin temor a represalias',
      category: 'bienestar',
      subcategory: 'expresion_libre',
      order: 28
    },
    {
      text: 'La empresa se preocupa genuinamente por el bienestar de sus empleados',
      category: 'bienestar',
      subcategory: 'preocupacion_empresa',
      order: 29
    },
    {
      text: 'Tengo un buen nivel de energía y motivación en el trabajo',
      category: 'bienestar',
      subcategory: 'energia',
      order: 30
    },
    {
      text: 'Raramente me siento estresado por mi trabajo',
      category: 'bienestar',
      subcategory: 'estres',
      order: 31
    },
    {
      text: 'Me siento orgulloso de trabajar para esta empresa',
      category: 'bienestar',
      subcategory: 'orgullo',
      order: 32
    },
    {
      text: 'Recomendaría esta empresa como un buen lugar para trabajar',
      category: 'bienestar',
      subcategory: 'recomendacion',
      order: 33
    },
    {
      text: 'Planeo continuar trabajando aquí en el futuro cercano',
      category: 'bienestar',
      subcategory: 'retencion',
      order: 34
    },
    {
      text: 'En general, mi experiencia como colaborador ha sido positiva',
      category: 'bienestar',
      subcategory: 'experiencia_general',
      order: 35
    }
  ]

  for (const q of experienciaQuestions) {
    await prisma.question.create({
      data: {
        campaignTypeId: experienciaFull.id,
        text: q.text,
        category: q.category,
        subcategory: q.subcategory,
        questionOrder: q.order,
        methodologyReference: 'Employee Experience Framework',
        responseType: 'rating',
        isRequired: true,
        minValue: 1,
        maxValue: 5
      }
    })
  }

  console.log(`✅ Created ${experienciaQuestions.length} Experiencia Full questions`)

  // PASO 5: Crear templates de comunicación
  console.log('💬 Creating communication templates...')
  
  const communicationTemplates = [
    // Templates Fortalezas
    {
      templateType: 'fortaleza',
      category: 'general',
      conditionRule: 'score >= 4.0',
      templateText: 'Su equipo muestra fortaleza destacada en {category} con {score}/5.0 puntos',
      variablesRequired: ['category', 'score'],
      priority: 10
    },
    {
      templateType: 'fortaleza',
      category: 'liderazgo',
      conditionRule: 'score >= 4.0',
      templateText: 'El liderazgo en su organización es una fortaleza clave ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 9
    },
    {
      templateType: 'fortaleza',
      category: 'ambiente',
      conditionRule: 'score >= 4.0',
      templateText: 'Su ambiente laboral genera engagement positivo ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 9
    },
    {
      templateType: 'fortaleza',
      category: 'desarrollo',
      conditionRule: 'score >= 4.0',
      templateText: 'Las oportunidades de desarrollo son valoradas por su equipo ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 9
    },
    {
      templateType: 'fortaleza',
      category: 'bienestar',
      conditionRule: 'score >= 4.0',
      templateText: 'El bienestar laboral es una ventaja competitiva en su empresa ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 9
    },

    // Templates Oportunidades
    {
      templateType: 'oportunidad',
      category: 'general',
      conditionRule: 'score < 3.0',
      templateText: 'Oportunidad inmediata detectada en {category} ({score}/5.0)',
      variablesRequired: ['category', 'score'],
      priority: 10
    },
    {
      templateType: 'oportunidad',
      category: 'liderazgo',
      conditionRule: 'score < 3.0',
      templateText: 'El desarrollo de habilidades de liderazgo puede generar impacto significativo ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 8
    },
    {
      templateType: 'oportunidad',
      category: 'ambiente',
      conditionRule: 'score < 3.0',
      templateText: 'Mejorar el ambiente laboral podría aumentar productividad y retención ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 8
    },
    {
      templateType: 'oportunidad',
      category: 'desarrollo',
      conditionRule: 'score < 3.0',
      templateText: 'Invertir en desarrollo profesional puede incrementar engagement ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 8
    },
    {
      templateType: 'oportunidad',
      category: 'bienestar',
      conditionRule: 'score < 3.0',
      templateText: 'Enfocar en bienestar laboral puede reducir rotación y mejorar resultados ({score}/5.0)',
      variablesRequired: ['score'],
      priority: 8
    },

    // Templates Benchmarking
    {
      templateType: 'benchmark_superior',
      category: 'general',
      conditionRule: 'score > benchmark + 0.3',
      templateText: 'Su empresa supera benchmark sectorial en {category} por +{difference} puntos',
      variablesRequired: ['category', 'difference'],
      priority: 7
    },
    {
      templateType: 'benchmark_inferior',
      category: 'general',
      conditionRule: 'score < benchmark - 0.3',
      templateText: 'Área de mejora vs benchmark sectorial: {category} (-{difference} puntos)',
      variablesRequired: ['category', 'difference'],
      priority: 7
    },

    // Templates Participación
    {
      templateType: 'participacion_alta',
      category: 'general',
      conditionRule: 'participation >= 75',
      templateText: 'Excelente participación ({participation}%) indica engagement alto del equipo',
      variablesRequired: ['participation'],
      priority: 6
    },
    {
      templateType: 'participacion_media',
      category: 'general',
      conditionRule: 'participation >= 50 AND participation < 75',
      templateText: 'Buena participación ({participation}%) permite análisis confiable',
      variablesRequired: ['participation'],
      priority: 5
    },
    {
      templateType: 'participacion_baja',
      category: 'general',
      conditionRule: 'participation < 50',
      templateText: 'Baja participación ({participation}%) sugiere revisar comunicación del proceso',
      variablesRequired: ['participation'],
      priority: 8
    },

    // Templates Contextuales Adicionales
    {
      templateType: 'fortaleza',
      category: 'general',
      conditionRule: 'score >= 3.8 AND score < 4.0',
      templateText: 'Su equipo tiene una base sólida en {category} ({score}/5.0) con potencial de excelencia',
      variablesRequired: ['category', 'score'],
      priority: 7
    },
    {
      templateType: 'oportunidad',
      category: 'general',
      conditionRule: 'score >= 3.0 AND score < 3.5',
      templateText: 'Área de mejora moderada en {category} ({score}/5.0) - impacto alto con mejoras específicas',
      variablesRequired: ['category', 'score'],
      priority: 6
    },
    {
      templateType: 'equilibrio',
      category: 'general',
      conditionRule: 'score >= 3.5 AND score < 3.8',
      templateText: 'Desempeño balanceado en {category} ({score}/5.0) - mantener y optimizar gradualmente',
      variablesRequired: ['category', 'score'],
      priority: 4
    },

    // Templates por Sectores (Benchmarking específico)
    {
      templateType: 'benchmark_sector',
      category: 'tecnologia',
      conditionRule: 'industry = tecnologia',
      templateText: 'Comparado con sector tecnología (benchmark 3.4/5.0), su posición relativa es {comparison}',
      variablesRequired: ['comparison'],
      priority: 5
    },
    {
      templateType: 'benchmark_sector',
      category: 'retail',
      conditionRule: 'industry = retail',
      templateText: 'En el sector retail (benchmark 3.1/5.0), su desempeño organizacional es {comparison}',
      variablesRequired: ['comparison'],
      priority: 5
    },
    {
      templateType: 'benchmark_sector',
      category: 'servicios',
      conditionRule: 'industry = servicios',
      templateText: 'Versus empresas de servicios (benchmark 3.3/5.0), su organización está {comparison}',
      variablesRequired: ['comparison'],
      priority: 5
    },

    // Templates Confidence Level
    {
      templateType: 'confidence_high',
      category: 'general',
      conditionRule: 'confidence_level = high',
      templateText: 'Análisis de alta confiabilidad - muestra representativa permite recomendaciones específicas',
      variablesRequired: [],
      priority: 3
    },
    {
      templateType: 'confidence_medium',
      category: 'general',
      conditionRule: 'confidence_level = medium',
      templateText: 'Análisis de confiabilidad media - tendencias claras identificadas, ampliar muestra para mayor precisión',
      variablesRequired: [],
      priority: 3
    },
    {
      templateType: 'confidence_low',
      category: 'general',
      conditionRule: 'confidence_level = low',
      templateText: 'Muestra inicial - insights preliminares útiles, próxima medición con mayor participación recomendada',
      variablesRequired: [],
      priority: 2
    }
  ]

  for (const template of communicationTemplates) {
    await prisma.communicationTemplate.create({
      data: {
        templateType: template.templateType,
        category: template.category,
        conditionRule: template.conditionRule,
        templateText: template.templateText,
        variablesRequired: template.variablesRequired,
        priority: template.priority,
        isActive: true,
        usageCount: 0
      }
    })
  }

  console.log(`✅ Created ${communicationTemplates.length} communication templates`)

  // PASO 6: Crear cuenta demo para testing
  console.log('👤 Creating demo account for testing...')
  

  const hashedPassword = await bcrypt.hash('TestPass123', 12)
  
  const demoAccount = await prisma.account.create({
    data: {
      companyName: 'Empresa Demo FocalizaHR',
      industry: 'tecnologia',
      companySize: 'pequeña',
      adminEmail: 'test@focalizahr.cl',
      adminName: 'Admin Demo',
      passwordHash: hashedPassword,
      subscriptionTier: 'free',
      maxActiveCampaigns: 1,
      maxParticipantsPerCampaign: 100,
      maxCampaignDurationDays: 30
    }
  })

  console.log(`✅ Created demo account: ${demoAccount.adminEmail}`)

  // PASO 7: Estadísticas finales
  const stats = {
    campaignTypes: await prisma.campaignType.count(),
    questions: await prisma.question.count(),
    communicationTemplates: await prisma.communicationTemplate.count(),
    accounts: await prisma.account.count()
  }

  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!')
  console.log('📊 Final Statistics:')
  console.log(`   • Campaign Types: ${stats.campaignTypes}`)
  console.log(`   • Questions: ${stats.questions}`)
  console.log(`   • Communication Templates: ${stats.communicationTemplates}`)
  console.log(`   • Demo Accounts: ${stats.accounts}`)
  console.log('\n🔑 Demo Credentials:')
  console.log(`   • Email: test@focalizahr.cl`)
  console.log(`   • Password: TestPass123`)
  console.log('\n✅ Ready for development!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })