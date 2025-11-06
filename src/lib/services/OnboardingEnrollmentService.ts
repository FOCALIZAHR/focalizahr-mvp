/**
 * ONBOARDING ENROLLMENT SERVICE v3.2.2
 * 
 * ARQUITECTURA OFICIAL: Usa fetch HTTP a API /campaigns/[id]/participants/upload
 * PILAR 4: Reutilización completa de infraestructura enterprise
 * 
 * RESPONSABILIDADES:
 * - Inscribir empleado en journey completo (4 stages)
 * - Llamar API centralizada 4 veces (1 por campaign/stage)
 * - Crear JourneyOrchestration (maestro journey)
 * - Programar 4 emails automáticos
 * - Rollback transaccional si falla alguna etapa
 * 
 * @author FocalizaHR Team
 * @version 3.2.2
 * @date November 2025
 */

import { prisma } from '@/lib/prisma';
import { addDays, format } from 'date-fns';
import { enrollmentRequestSchema, type EnrollmentRequest } from '@/lib/validations/onboarding-enrollment';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EnrollmentData {
  accountId: string;
  nationalId: string;          // RUT chileno (obligatorio)
  fullName: string;
  participantEmail?: string;   // Opcional (WhatsApp puede reemplazar)
  phoneNumber?: string;        // Opcional (pero al menos 1 canal requerido)
  departmentId: string;        // ID departamento (debe existir)
  position?: string;
  location?: string;
  hireDate: Date;              // OBLIGATORIO para calcular etapas
  startDate?: Date;            // Fecha inicio journey (default = hireDate)
}

interface EnrollmentResult {
  success: boolean;
  journeyId?: string;
  participantIds?: string[];
  message: string;
  error?: string;
}

interface JourneyDates {
  stage1Date: Date;  // Día 1
  stage2Date: Date;  // Día 7
  stage3Date: Date;  // Día 30
  stage4Date: Date;  // Día 90
}

interface ParticipantCSVData {
  nationalId: string;
  fullName: string;
  participantEmail?: string;
  phoneNumber?: string;
  department: string;
  position?: string;
  location?: string;
  hireDate: Date;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class OnboardingEnrollmentService {
  
  /**
   * ✅ MÉTODO PRINCIPAL: Inscribir empleado en journey completo
   * 
   * Proceso:
   * 1. Validar datos entrada
   * 2. Obtener 4 campaignIds permanentes (onboarding-day-1,7,30,90)
   * 3. Calcular fechas journey (día 1, 7, 30, 90)
   * 4. Llamar API 4 veces (generar CSV de 1 fila cada vez)
   * 5. Crear JourneyOrchestration
   * 6. Programar 4 emails automáticos
   * 7. Retornar resultado
   * 
   * @param data - Datos del nuevo empleado
   * @returns Promise<EnrollmentResult>
   */
  static async enrollParticipant(data: EnrollmentData): Promise<EnrollmentResult> {
    try {
      console.log('[OnboardingEnrollment] Starting enrollment process...', {
        nationalId: data.nationalId,
        fullName: data.fullName
      });
      
      // PASO 1: Validaciones básicas
      this.validateEnrollmentData(data);
      
      // PASO 2: Obtener o crear 4 campaignIds permanentes
      const campaigns = await this.getOrCreatePermanentCampaigns(data.accountId);
      
      // PASO 3: Calcular fechas journey (día 1, 7, 30, 90)
      const startDate = data.startDate || data.hireDate;
      const journeyDates = this.calculateJourneyDates(startDate);
      
      // PASO 4: Arrays para tracking
      const participantIds: string[] = [];
      const stageNames = ['Compliance', 'Clarification', 'Culture', 'Connection'];
      
      // PASO 5: ✅ LLAMAR API 4 VECES (1 por stage/campaign)
      for (let stage = 0; stage < 4; stage++) {
        const campaignId = campaigns[stage];
        const stageDate = [
          journeyDates.stage1Date,
          journeyDates.stage2Date,
          journeyDates.stage3Date,
          journeyDates.stage4Date
        ][stage];
        
        console.log(`[OnboardingEnrollment] Processing stage ${stage + 1} (${stageNames[stage]})...`, {
          campaignId,
          stageDate
        });
        
        try {
          // 📄 GENERAR CSV DE 1 FILA
          const csvContent = this.generateSingleParticipantCSV({
            nationalId: data.nationalId,
            fullName: data.fullName,
            participantEmail: data.participantEmail,
            phoneNumber: data.phoneNumber,
            department: await this.getDepartmentName(data.departmentId),
            position: data.position,
            location: data.location,
            hireDate: stageDate
          });
          
          // 📦 CREAR FormData
          const formData = new FormData();
          const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
          formData.append('file', blob, `onboarding_${data.nationalId}_stage${stage + 1}.csv`);
          
          // 🔑 OBTENER TOKEN AUTH
          const token = await this.getAuthToken();
          
          // 🌐 LLAMADA HTTP A API EXISTENTE
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/${campaignId}/participants/upload?action=confirm`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Stage ${stage + 1} failed: ${errorData.error || errorData.message || 'Unknown error'}`);
          }
          
          const result = await response.json();
          
          // ✅ VERIFICAR QUE LA CARGA FUE EXITOSA
          if (!result.success || result.totalLoaded === 0) {
            throw new Error(
              `Stage ${stage + 1}: API returned success but no participants loaded. ` +
              `Response: ${JSON.stringify(result)}`
            );
          }
          
          // ✅ QUERY A BD PARA OBTENER PARTICIPANTID
          const participant = await prisma.participant.findFirst({
            where: {
              campaignId,
              nationalId: data.nationalId
            },
            orderBy: {
              createdAt: 'desc'  // El más reciente
            },
            select: {
              id: true
            }
          });
          
          if (!participant) {
            throw new Error(
              `Stage ${stage + 1}: Participant created successfully by API but not found in database. ` +
              `This should not happen. Check database integrity. ` +
              `CampaignId: ${campaignId}, RUT: ${data.nationalId}`
            );
          }
          
          participantIds.push(participant.id);
          console.log(`[OnboardingEnrollment] ✅ Stage ${stage + 1} completed. ParticipantId: ${participant.id}`);
          
        } catch (error) {
          // 🔄 ROLLBACK CRÍTICO
          console.error(`[OnboardingEnrollment] ❌ Error in stage ${stage + 1}:`, error);
          console.log(`[OnboardingEnrollment] Initiating rollback for ${participantIds.length} participants...`);
          
          await this.rollbackParticipants(participantIds);
          
          throw new Error(
            `Enrollment failed at stage ${stage + 1} (${stageNames[stage]}): ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
      
      // PASO 6: Crear JourneyOrchestration (maestro)
      console.log('[OnboardingEnrollment] Creating JourneyOrchestration master record...');
      
      const journey = await prisma.journeyOrchestration.create({
  data: {
    accountId: data.accountId,
    nationalId: data.nationalId,
    fullName: data.fullName,
    participantEmail: data.participantEmail,
    phoneNumber: data.phoneNumber,
    departmentId: data.departmentId,
    position: data.position,
    hireDate: data.hireDate,
    stage1ParticipantId: participantIds[0],
    stage2ParticipantId: participantIds[1],
    stage3ParticipantId: participantIds[2],
    stage4ParticipantId: participantIds[3],
    currentStage: 1,
    status: 'active',
    retentionRisk: 'pending'
  }
});
      
      console.log(`[OnboardingEnrollment] ✅ Journey created. ID: ${journey.id}`);
      
      // PASO 7: Programar 4 emails automáticos
      console.log('[OnboardingEnrollment] Scheduling automated emails...');
      
      await this.scheduleOnboardingEmails(journey.id, campaigns, participantIds, journeyDates);
      
      console.log('[OnboardingEnrollment] ✅ Emails scheduled successfully');
      
      // PASO 8: Retornar resultado exitoso
      return {
        success: true,
        journeyId: journey.id,
        participantIds,
        message: `Journey creado exitosamente para ${data.fullName}. 4 encuestas programadas.`
      };
      
    } catch (error) {
      console.error('[OnboardingEnrollment] ❌ Enrollment failed:', error);
      
      return {
        success: false,
  message: error instanceof Error ? error.message : 'Error desconocido en enrollment',
  error: error instanceof Error ? error.message : 'Error desconocido en enrollment'
};
    }
  }
  
  // ==========================================================================
  // VALIDATION METHODS
  // ==========================================================================
  
  /**
   * Validar datos de enrollment (defensivo + business logic)
   */
  private static validateEnrollmentData(data: EnrollmentData): void {
    // Validaciones críticas
    if (!data.nationalId) {
      throw new Error('[ONBOARDING] nationalId es obligatorio');
    }
    
    if (!data.participantEmail && !data.phoneNumber) {
      throw new Error('[ONBOARDING] Se requiere email O teléfono para contacto');
    }
    
    if (!data.fullName) {
      throw new Error('[ONBOARDING] fullName es obligatorio');
    }
    
    if (!data.departmentId) {
      throw new Error('[ONBOARDING] departmentId es obligatorio');
    }
    
    if (!data.hireDate) {
      throw new Error('[ONBOARDING] hireDate es obligatorio para calcular etapas del journey');
    }
    
    // Validación lógica de negocio
    const today = new Date();
    if (data.hireDate > today) {
      throw new Error('[ONBOARDING] hireDate no puede ser fecha futura');
    }
    
    // Validación de edad del dato (warning, no error)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (data.hireDate < oneYearAgo) {
      console.warn(
        `[ONBOARDING] hireDate es muy antigua (${data.hireDate.toISOString()}). ` +
        `Journey puede no ser representativo de proceso actual.`
      );
    }
  }
  
  // ==========================================================================
  // CAMPAIGN MANAGEMENT METHODS
  // ==========================================================================
  
  /**
   * Obtener o crear las 4 campaigns permanentes de onboarding
   * Slugs: onboarding-day-1, onboarding-day-7, onboarding-day-30, onboarding-day-90
   */
  private static async getOrCreatePermanentCampaigns(accountId: string): Promise<string[]> {
    const slugs = [
      'onboarding-day-1',
      'onboarding-day-7',
      'onboarding-day-30',
      'onboarding-day-90'
    ];
    
    const campaignIds: string[] = [];
    
    for (const slug of slugs) {
      // Buscar CampaignType
      const campaignType = await prisma.campaignType.findUnique({
        where: { slug }
      });
      
      if (!campaignType) {
        throw new Error(`[ONBOARDING] CampaignType not found: ${slug}. Run seeds first.`);
      }
      
      // Buscar campaign existente
      let campaign = await prisma.campaign.findFirst({
        where: {
          accountId,
          campaignTypeId: campaignType.id,
          status: 'active'
        }
      });
      
      // Si no existe, crear
      if (!campaign) {
        console.log(`[OnboardingEnrollment] Creating permanent campaign for ${slug}...`);
        
        campaign = await prisma.campaign.create({
          data: {
            name: `Onboarding ${slug.replace('onboarding-day-', 'Día ')}`,
            accountId,
            campaignTypeId: campaignType.id,
            startDate: new Date(),
            endDate: new Date('2099-12-31'), // Fecha simbólica permanente
            status: 'active',
            description: `Sistema permanente de seguimiento onboarding - ${slug}`,
            totalInvited: 0,
            totalResponded: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      campaignIds.push(campaign.id);
    }
    
    return campaignIds;
  }
  
  // ==========================================================================
  // DATE CALCULATION METHODS
  // ==========================================================================
  
  /**
   * Calcular fechas de las 4 etapas del journey
   * 
   * @param startDate - Fecha de inicio (hireDate o startDate custom)
   * @returns JourneyDates con las 4 fechas calculadas
   */
  private static calculateJourneyDates(startDate: Date): JourneyDates {
    return {
      stage1Date: addDays(startDate, 1),   // Día 1
      stage2Date: addDays(startDate, 7),   // Día 7
      stage3Date: addDays(startDate, 30),  // Día 30
      stage4Date: addDays(startDate, 90)   // Día 90
    };
  }
  
  // ==========================================================================
  // CSV GENERATION METHODS
  // ==========================================================================
  
  /**
   * Generar CSV de 1 participante para carga en API
   * 
   * Formato exacto esperado por API:
   * RUT,Email,Celular,Nombre,Departamento,Cargo,Ubicacion,FechaIngreso
   */
  private static generateSingleParticipantCSV(data: ParticipantCSVData): string {
    const headers = 'RUT,Email,Celular,Nombre,Departamento,Cargo,Ubicacion,FechaIngreso\n';
    
    const row = [
      data.nationalId,                              // RUT obligatorio (12345678-9)
      data.participantEmail || '',                  // Email opcional
      data.phoneNumber || '',                       // Phone opcional
      `"${data.fullName}"`,                         // Nombre (con comillas por si tiene comas)
      `"${data.department}"`,                       // Departamento
      data.position ? `"${data.position}"` : '',    // Cargo opcional
      data.location ? `"${data.location}"` : '',    // Ubicación opcional
      format(data.hireDate, 'yyyy-MM-dd')          // Fecha ISO
    ].join(',');
    
    return headers + row;
  }
  
  // ==========================================================================
  // EMAIL SCHEDULING METHODS
  // ==========================================================================
  
  /**
   * Programar 4 emails automáticos en tabla EmailAutomation
   * 
   * Emails se envían 1 día antes de cada etapa para recordatorio
   */
  private static async scheduleOnboardingEmails(
    journeyId: string,
    campaignIds: string[],  // ✅ AGREGAR
    participantIds: string[],
    journeyDates: JourneyDates
  ): Promise<void> {
    const emailSchedule = [
  { participantId: participantIds[0], campaignId: campaignIds[0], slug: 'onboarding-day-1', triggerAt: journeyDates.stage1Date },
  { participantId: participantIds[1], campaignId: campaignIds[1], slug: 'onboarding-day-7', triggerAt: journeyDates.stage2Date },
  { participantId: participantIds[2], campaignId: campaignIds[2], slug: 'onboarding-day-30', triggerAt: journeyDates.stage3Date },
  { participantId: participantIds[3], campaignId: campaignIds[3], slug: 'onboarding-day-90', triggerAt: journeyDates.stage4Date }
];

await prisma.emailAutomation.createMany({
  data: emailSchedule.map(email => ({
    participantId: email.participantId,
    campaignId: email.campaignId,
    templateId: email.slug,
    triggerType: email.slug,
    triggerAt: email.triggerAt,
    enabled: true
  }))
});
  }  // ← FALTA ESTE CIERRE DEL MÉTODO scheduleOnboardingEmails
  // ==========================================================================
  // ROLLBACK METHODS
  // ==========================================================================
  
  /**
   * Rollback transaccional: eliminar participants ya creados
   * 
   * Se ejecuta si falla alguna de las 4 llamadas a API
   */
  private static async rollbackParticipants(participantIds: string[]): Promise<void> {
    if (participantIds.length === 0) {
      console.log('[OnboardingEnrollment] No participants to rollback');
      return;
    }
    
    
    console.log(`[OnboardingEnrollment] Rolling back ${participantIds.length} participants...`);
    
    try {
      await prisma.participant.deleteMany({
        where: {
          id: { in: participantIds }
        }
      });
      
      console.log(`[OnboardingEnrollment] ✅ Rollback completed. ${participantIds.length} participants deleted.`);
    } catch (error) {
      console.error('[OnboardingEnrollment] ❌ Rollback failed:', error);
      // No lanzamos error aquí para no ocultar el error original
    }
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  /**
   * Obtener nombre de departamento por ID
   */
  private static async getDepartmentName(departmentId: string): Promise<string> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { displayName: true }
    });
    
    if (!department) {
      throw new Error(`[ONBOARDING] Department not found: ${departmentId}`);
    }
    
    return department.displayName;
  }
  
  /**
   * Obtener token de autenticación del contexto actual
   * 
   * En backend, obtenemos el token de las cookies de la sesión activa
   */
  private static async getAuthToken(): Promise<string> {
    // TODO: Implementar según tu sistema de auth
    // Ejemplo básico:
    
    // Opción 1: Si estás en context de API route
    // const token = cookies().get('focalizahr_token')?.value;
    
    // Opción 2: Si usas headers
    // const token = headers().get('authorization')?.replace('Bearer ', '');
    
    // Opción 3: Generar token de servicio interno
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    
    if (!token) {
      throw new Error('[ONBOARDING] No auth token available for API call');
    }
    
    return token;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  EnrollmentData,
  EnrollmentResult,
  JourneyDates,
  ParticipantCSVData
};