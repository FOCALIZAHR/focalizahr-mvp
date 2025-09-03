// src/app/api/survey-config/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Campaign type slug is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching survey configuration for: ${slug}`);

    const configuration = await prisma.surveyConfiguration.findFirst({
      where: {
        campaignType: {
          slug: slug,
          isActive: true
        }
      },
      include: {
        campaignType: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            questionCount: true,
            estimatedDuration: true
          }
        }
      }
    });

    if (!configuration) {
      console.log(`⚠️ No configuration found for slug: ${slug}`);
      
      return NextResponse.json({
        campaignType: slug,
        categoryConfigs: {},  // ← CAMBIO: categoryConfigs no dimensions
        conditionalRules: [],
        uiSettings: {
          showCategoryIntros: false,
          questionTransitions: 'none',
          progressDisplay: 'linear',
          breakAfterQuestions: [],
          completionCelebration: true
        },
        validationRules: [],
        isDefault: true
      });
    }

    console.log(`✅ Configuration found for ${slug}`);

    return NextResponse.json({
      id: configuration.id,
      campaignType: configuration.campaignType,
      categoryConfigs: configuration.categoryConfigs,  // ← CAMBIO
      conditionalRules: configuration.conditionalRules,
      uiSettings: configuration.uiSettings,
      validationRules: configuration.validationRules,
      isDefault: false
    });
  } catch (error) {
    console.error('❌ Error fetching survey configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey configuration' },
      { status: 500 }
    );
  }
}