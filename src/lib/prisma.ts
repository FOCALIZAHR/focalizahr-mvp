// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient({
  // 🚀 CONNECTION POOLING OPTIMIZADO
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=30&connect_timeout=60"
    }
  },
  // 🔇 LOGGING SOLO ERRORES (no queries)
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// 🔧 GRACEFUL SHUTDOWN
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Utility functions for database operations
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { success: true, message: 'Database connected successfully' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { success: false, message: 'Database connection failed', error }
  }
}

export async function getAccountWithLimits(accountId: string) {
  return await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      companyName: true,
      industry: true,
      subscriptionTier: true,
      maxActiveCampaigns: true,
      maxParticipantsPerCampaign: true,
      maxCampaignDurationDays: true
    }
  })
}

export async function validateCampaignLimits(
  accountId: string, 
  campaignTypeId: string,
  durationDays: number,
  participantCount: number = 0
) {
  const account = await getAccountWithLimits(accountId)
  if (!account) {
    return { valid: false, error: 'Account not found' }
  }

  // Check active campaigns limit
  const activeCampaignsCount = await prisma.campaign.count({
    where: {
      accountId,
      campaignTypeId,
      status: 'active'
    }
  })

  if (activeCampaignsCount >= account.maxActiveCampaigns) {
    return { 
      valid: false, 
      error: `Maximum ${account.maxActiveCampaigns} active campaign(s) of this type allowed`,
      code: 'CAMPAIGN_LIMIT_REACHED'
    }
  }

  // Check duration limit
  if (durationDays > account.maxCampaignDurationDays) {
    return { 
      valid: false, 
      error: `Maximum campaign duration: ${account.maxCampaignDurationDays} days`,
      code: 'DURATION_LIMIT_EXCEEDED'
    }
  }

  // Check participant limit (if provided)
  if (participantCount > account.maxParticipantsPerCampaign) {
    return { 
      valid: false, 
      error: `Maximum ${account.maxParticipantsPerCampaign} participants allowed`,
      code: 'PARTICIPANT_LIMIT_EXCEEDED'
    }
  }

  return { valid: true, account }
}