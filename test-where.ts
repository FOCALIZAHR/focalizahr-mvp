// test-where.ts
import { prisma } from '@/lib/prisma';

async function testWhere() {
  const start = new Date('2025-11-01');
  const end = new Date('2025-11-30T23:59:59');
  const accountId = 'cmfgedx7b00012413i92048wl';

  console.log('🧪 TEST 1: WHERE con filtro stage1Participant');
  const withFilter = await prisma.department.findMany({
    where: {
      accountId,
      journeys: {
        some: {
          createdAt: { gte: start, lte: end },
          stage1Participant: {
            campaign: {
              campaignType: {
                isPermanent: true
              }
            }
          }
        }
      }
    },
    select: {
      id: true,
      displayName: true
    }
  });

  console.log(`Resultado: ${withFilter.length} departamentos`);
  console.log(withFilter);

  console.log('\n🧪 TEST 2: WHERE sin filtro stage1Participant');
  const withoutFilter = await prisma.department.findMany({
    where: {
      accountId,
      journeys: {
        some: {
          createdAt: { gte: start, lte: end }
        }
      }
    },
    select: {
      id: true,
      displayName: true
    }
  });

  console.log(`Resultado: ${withoutFilter.length} departamentos`);
  console.log(withoutFilter);

  await prisma.$disconnect();
}

testWhere();