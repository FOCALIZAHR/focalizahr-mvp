/**
 * EXIT REGISTRATION SERVICE
 * 
 * Análogo a OnboardingEnrollmentService pero SIMPLE:
 * - 1 campaign (exit-survey)
 * - 1 participant
 * - 1 email
 * 
 * @version 1.0
 * @date December 2025
 */

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { 
  ExitRegistrationData, 
  ExitRegistrationResult,
  OnboardingCorrelation 
} from '@/types/exit';

export class ExitRegistrationService {
  
  /**
   * Registrar una salida
   */
  static async registerExit(data: ExitRegistrationData): Promise<ExitRegistrationResult> {
    try {
      console.log('[ExitRegistration] Starting...', { nationalId: data.nationalId });
      
      // 1. Validar datos
      this.validateData(data);
      
      // 2. Verificar si ya existe un ExitRecord activo para este RUT
      const existing = await prisma.exitRecord.findFirst({
        where: {
          accountId: data.accountId,
          nationalId: data.nationalId,
          eis: null // Solo pendientes (sin encuesta completada)
        }
      });
      
      if (existing) {
        return {
          success: false,
          error: `Ya existe un registro de salida pendiente para RUT ${data.nationalId}`
        };
      }
      
      // 3. Obtener campaign permanente exit-survey
      const campaign = await this.getExitCampaign(data.accountId);
      if (!campaign) {
        return {
          success: false,
          error: 'Campaign exit-survey no encontrada o no está configurada como permanente'
        };
      }
      
      // 4. Buscar correlación onboarding
      const correlation = await this.findOnboardingCorrelation(
        data.accountId,
        data.nationalId
      );
      
      // 5. Crear Participant + ExitRecord en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear Participant
        const participant = await tx.participant.create({
          data: {
            campaignId: campaign.id,
            nationalId: data.nationalId,
            name: data.fullName,
            email: data.email || null,
            phoneNumber: data.phoneNumber || null,
            department: data.departmentId, // Solo para referencia legacy
            departmentId: data.departmentId, // FK real
            position: data.position || null,
            uniqueToken: uuidv4(),
            hasResponded: false
          }
        });
        
        // Calcular tenure si hay correlación onboarding
        const tenureMonths = correlation.found && correlation.hireDate
          ? this.calculateTenureMonths(correlation.hireDate, data.exitDate)
          : null;
        
        // Crear ExitRecord
        const exitRecord = await tx.exitRecord.create({
          data: {
            accountId: data.accountId,
            departmentId: data.departmentId,
            participantId: participant.id,
            nationalId: data.nationalId,
            exitDate: data.exitDate,
            exitReason: data.exitReason || null,
            exitFactors: [],
            // Correlación onboarding
            hadOnboarding: correlation.found,
            onboardingJourneyId: correlation.journeyId || null,
            onboardingEXOScore: correlation.exoScore || null,
            onboardingAlertsCount: correlation.alertsCount || 0,
            onboardingIgnoredAlerts: correlation.ignoredAlerts || 0,
            onboardingManagedAlerts: correlation.managedAlerts || 0,
            tenureMonths
          }
        });
        
        return { participant, exitRecord };
      });
      
      // 6. Programar email de invitación
      await this.scheduleInvitationEmail(result.participant, data, campaign.id);
      
      console.log('[ExitRegistration] Success', { 
        exitRecordId: result.exitRecord.id,
        participantId: result.participant.id,
        hadOnboarding: correlation.found
      });
      
      return {
        success: true,
        exitRecordId: result.exitRecord.id,
        participantId: result.participant.id,
        surveyToken: result.participant.uniqueToken,
        message: correlation.found 
          ? `Salida registrada con correlación onboarding (EXO: ${correlation.exoScore?.toFixed(1) || 'N/A'})`
          : 'Salida registrada exitosamente'
      };
      
    } catch (error: any) {
      console.error('[ExitRegistration] Error:', error);
      return {
        success: false,
        error: error.message || 'Error registrando salida'
      };
    }
  }
  
  /**
   * Registro masivo (hasta 100)
   */
  static async registerBatch(
    items: ExitRegistrationData[]
  ): Promise<{
    success: boolean;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      index: number;
      nationalId: string;
      success: boolean;
      exitRecordId?: string;
      error?: string;
    }>;
  }> {
    if (items.length > 100) {
      return {
        success: false,
        totalProcessed: 0,
        successCount: 0,
        failureCount: items.length,
        results: [{ index: 0, nationalId: '', success: false, error: 'Máximo 100 registros por batch' }]
      };
    }
    
    const results: Array<{
      index: number;
      nationalId: string;
      success: boolean;
      exitRecordId?: string;
      error?: string;
    }> = [];
    
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = await this.registerExit(item);
      
      if (result.success) {
        successCount++;
        results.push({
          index: i,
          nationalId: item.nationalId,
          success: true,
          exitRecordId: result.exitRecordId
        });
      } else {
        failureCount++;
        results.push({
          index: i,
          nationalId: item.nationalId,
          success: false,
          error: result.error
        });
      }
      
      // Rate limiting entre registros
      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    return {
      success: successCount > 0,
      totalProcessed: items.length,
      successCount,
      failureCount,
      results
    };
  }
  
  /**
   * Validar datos de entrada
   */
  private static validateData(data: ExitRegistrationData): void {
    if (!data.accountId) throw new Error('accountId es requerido');
    if (!data.departmentId) throw new Error('departmentId es requerido');
    if (!data.nationalId) throw new Error('nationalId (RUT) es requerido');
    if (!data.fullName) throw new Error('fullName es requerido');
    if (!data.exitDate) throw new Error('exitDate es requerido');
    
    // Validar formato RUT básico
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$|^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(data.nationalId)) {
      throw new Error('Formato de RUT inválido (use: 12345678-9 o 12.345.678-9)');
    }
  }
  
  /**
   * Obtener campaign exit-survey permanente
   */
  private static async getExitCampaign(accountId: string) {
    // Buscar campaign existente
    let campaign = await prisma.campaign.findFirst({
      where: {
        accountId,
        campaignType: {
          slug: 'exit-survey',
          isPermanent: true
        },
        status: 'active'
      },
      include: {
        account: {
          select: { companyName: true }
        }
      }
    });
    
    // Si no existe, crear una
    if (!campaign) {
      const campaignType = await prisma.campaignType.findFirst({
        where: {
          slug: 'exit-survey',
          isPermanent: true
        }
      });
      
      if (!campaignType) {
        console.error('[ExitRegistration] CampaignType exit-survey no existe o no es permanente');
        return null;
      }
      
      campaign = await prisma.campaign.create({
        data: {
          accountId,
          campaignTypeId: campaignType.id,
          name: 'Exit Survey - Permanente',
          description: 'Encuesta de salida para colaboradores que dejan la organización',
          startDate: new Date(),
          endDate: new Date('2099-12-31'),
          status: 'active',
          sendReminders: true,
          anonymousResults: true
        },
        include: {
          account: {
            select: { companyName: true }
          }
        }
      });
      
      console.log('[ExitRegistration] Campaign exit-survey creada:', campaign.id);
    }
    
    return campaign;
  }
  
  /**
   * Buscar correlación con Onboarding por RUT
   */
  private static async findOnboardingCorrelation(
    accountId: string,
    nationalId: string
  ): Promise<OnboardingCorrelation> {
    const journey = await prisma.journeyOrchestration.findFirst({
      where: {
        accountId,
        nationalId
      },
      include: {
        alerts: {
          select: {
            id: true,
            status: true,
            resolvedAt: true,
            acknowledgedAt: true
          }
        }
      }
    });
    
    if (!journey) {
      console.log('[ExitRegistration] No onboarding journey found for:', nationalId);
      return { found: false };
    }
    
    // Clasificar alertas
    const ignoredAlerts = journey.alerts.filter(a => 
      a.status === 'pending' || 
      (a.status === 'dismissed' && !a.resolvedAt)
    ).length;
    
    const managedAlerts = journey.alerts.filter(a =>
      a.status === 'resolved' || 
      (a.status === 'acknowledged' && a.acknowledgedAt)
    ).length;
    
    console.log('[ExitRegistration] Onboarding correlation found:', {
      journeyId: journey.id,
      exoScore: journey.exoScore,
      totalAlerts: journey.alerts.length,
      ignoredAlerts,
      managedAlerts
    });
    
    return {
      found: true,
      journeyId: journey.id,
      exoScore: journey.exoScore,
      alertsCount: journey.alerts.length,
      ignoredAlerts,
      managedAlerts,
      hireDate: journey.hireDate,
      tenureMonths: undefined // Se calcula después
    };
  }
  
  /**
   * Calcular meses de tenure
   */
  private static calculateTenureMonths(hireDate: Date, exitDate: Date): number {
    const hire = new Date(hireDate);
    const exit = new Date(exitDate);
    const months = (exit.getFullYear() - hire.getFullYear()) * 12 
      + (exit.getMonth() - hire.getMonth());
    return Math.max(0, months);
  }
  
  /**
   * Programar email de invitación
   * NOTA: Usa el modelo EmailAutomation con campos correctos del schema
   */
  private static async scheduleInvitationEmail(
    participant: { id: string; email: string | null; name: string | null },
    data: ExitRegistrationData,
    campaignId: string
  ): Promise<void> {
    if (!participant.email) {
      console.log('[ExitRegistration] No email, skipping invitation');
      return;
    }
    
    // Programar para 1 día después de la fecha de salida
    const scheduledDate = new Date(data.exitDate);
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    
    // Usar campos correctos del modelo EmailAutomation
    await prisma.emailAutomation.create({
      data: {
        campaignId,
        participantId: participant.id,
        triggerType: 'exit_invitation',  // ← Campo correcto (no emailType)
        triggerAt: scheduledDate,         // ← Campo correcto (no scheduledFor)
        enabled: true,                    // ← En lugar de status: 'pending'
        templateId: 'exit-survey'
      }
    });
    
    console.log('[ExitRegistration] Email scheduled for', scheduledDate.toISOString());
  }
  
  /**
   * Obtener estadísticas de registros Exit para un account
   */
  static async getExitStats(accountId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    withOnboarding: number;
    avgTenure: number | null;
  }> {
    const [total, pending, completed, withOnboarding, tenureData] = await Promise.all([
      prisma.exitRecord.count({ where: { accountId } }),
      prisma.exitRecord.count({ where: { accountId, eis: null } }),
      prisma.exitRecord.count({ where: { accountId, eis: { not: null } } }),
      prisma.exitRecord.count({ where: { accountId, hadOnboarding: true } }),
      prisma.exitRecord.aggregate({
        where: { accountId, tenureMonths: { not: null } },
        _avg: { tenureMonths: true }
      })
    ]);
    
    return {
      total,
      pending,
      completed,
      withOnboarding,
      avgTenure: tenureData._avg.tenureMonths
    };
  }
}