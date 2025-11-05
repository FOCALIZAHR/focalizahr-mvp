// prisma/seeds/onboarding-survey-configurations.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const surveyConfigurations = [
  // DÍA 1 - COMPLIANCE
  {
    campaignTypeSlug: 'onboarding-day-1',
    categoryConfigs: {
      "desarrollo": {
        "displayName": "Preparación y Herramientas",
        "icon": "Settings",
        "color": "cyan",
        "description": "¿Tenías todo lo necesario para empezar productivo desde el día 1?",
        "motivationalText": "Tu primer día debe ser perfecto",
        "order": 1
      },
      "liderazgo": {
        "displayName": "Acogida y Bienvenida",
        "icon": "Users",
        "color": "purple",
        "description": "¿Alguien te recibió y te hizo sentir parte del equipo?",
        "motivationalText": "La primera impresión marca la diferencia",
        "order": 2
      },
      "bienestar": {
        "displayName": "Condiciones de Trabajo",
        "icon": "Home",
        "color": "gradient",
        "description": "¿Tu espacio de trabajo estaba en buenas condiciones?",
        "motivationalText": "Tu comodidad es nuestra prioridad",
        "order": 3
      }
    },
    uiSettings: {
      "showCategoryIntros": true,
      "questionTransitions": "slide",
      "progressDisplay": "categorical",
      "completionCelebration": true,
      "theme": {
        "primaryColor": "cyan",
        "secondaryColor": "purple",
        "showGradients": true
      }
    }
  },

  // DÍA 7 - CLARIFICATION
  {
    campaignTypeSlug: 'onboarding-day-7',
    categoryConfigs: {
      "desarrollo": {
        "displayName": "Claridad de Rol y Objetivos",
        "icon": "Target",
        "color": "cyan",
        "description": "¿Tienes claro qué se espera de ti y cómo medirán tu éxito?",
        "motivationalText": "La claridad impulsa el desempeño",
        "order": 1
      },
      "comunicacion": {
        "displayName": "Comunicación con Liderazgo",
        "icon": "MessageCircle",
        "color": "purple",
        "description": "¿Tu jefe te ha explicado claramente tus responsabilidades?",
        "motivationalText": "El diálogo abierto construye confianza",
        "order": 2
      },
      "autonomia": {
        "displayName": "Recursos y Capacitación",
        "icon": "Briefcase",
        "color": "gradient",
        "description": "¿Tienes las herramientas y formación para ejecutar tu rol?",
        "motivationalText": "Empoderamos tu éxito",
        "order": 3
      }
    },
    uiSettings: {
      "showCategoryIntros": true,
      "questionTransitions": "fade",
      "progressDisplay": "categorical",
      "completionCelebration": true,
      "theme": {
        "primaryColor": "cyan",
        "secondaryColor": "purple",
        "showGradients": true
      }
    }
  },

  // DÍA 30 - CULTURE
  {
    campaignTypeSlug: 'onboarding-day-30',
    categoryConfigs: {
      "satisfaccion": {
        "displayName": "Proyección y Valores",
        "icon": "TrendingUp",
        "color": "cyan",
        "description": "¿Te ves a largo plazo aquí? ¿Conectas con los valores?",
        "motivationalText": "Tu futuro importa",
        "order": 1
      },
      "seguridad_psicologica": {
        "displayName": "Pertenencia y Voz",
        "icon": "Shield",
        "color": "purple",
        "description": "¿Te sientes parte del equipo y cómodo expresándote?",
        "motivationalText": "Tu opinión nos hace mejores",
        "order": 2
      }
    },
    uiSettings: {
      "showCategoryIntros": true,
      "questionTransitions": "slide",
      "progressDisplay": "categorical",
      "completionCelebration": true,
      "theme": {
        "primaryColor": "cyan",
        "secondaryColor": "purple",
        "showGradients": true
      }
    }
  },

  // DÍA 90 - CONNECTION
  {
    campaignTypeSlug: 'onboarding-day-90',
    categoryConfigs: {
      "satisfaccion": {
        "displayName": "Compromiso y Crecimiento",
        "icon": "Heart",
        "color": "cyan",
        "description": "¿Recomendarías trabajar aquí? ¿Ves oportunidades?",
        "motivationalText": "Tu desarrollo es nuestra inversión",
        "order": 1
      },
      "desarrollo": {
        "displayName": "Dominio del Rol",
        "icon": "Award",
        "color": "purple",
        "description": "¿Te sientes competente y contribuyendo al equipo?",
        "motivationalText": "Tu progreso nos enorgullece",
        "order": 2
      },
      "seguridad_psicologica": {
        "displayName": "Red de Apoyo y Balance",
        "icon": "Users",
        "color": "gradient",
        "description": "¿Has construido relaciones sólidas y mantienes balance?",
        "motivationalText": "Tu bienestar integral importa",
        "order": 3
      }
    },
    uiSettings: {
      "showCategoryIntros": true,
      "questionTransitions": "slide",
      "progressDisplay": "categorical",
      "completionCelebration": true,
      "theme": {
        "primaryColor": "cyan",
        "secondaryColor": "purple",
        "showGradients": true
      }
    }
  }
]

async function seedOnboardingSurveyConfigurations() {
  console.log('🌱 Seeding Onboarding Survey Configurations...')
  
  for (const config of surveyConfigurations) {
    const campaignType = await prisma.campaignType.findUnique({
      where: { slug: config.campaignTypeSlug }
    })
    
    if (!campaignType) {
      console.error(`❌ CampaignType no encontrado: ${config.campaignTypeSlug}`)
      continue
    }
    
    await prisma.surveyConfiguration.upsert({
      where: { campaignTypeId: campaignType.id },
      update: {
        categoryConfigs: config.categoryConfigs,
        uiSettings: config.uiSettings
      },
      create: {
        campaignTypeId: campaignType.id,
        categoryConfigs: config.categoryConfigs,
        uiSettings: config.uiSettings
      }
    })
    
    console.log(`  ✅ ${config.campaignTypeSlug}`)
  }
  
  console.log('✅ Survey Configurations seeded successfully')
}

seedOnboardingSurveyConfigurations()
  .catch((e) => {
    console.error('❌ Error seeding survey configurations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default seedOnboardingSurveyConfigurations