/**
 * EXIT REGISTRATION SERVICE
 * 
 * PROPÓSITO:
 * - Registrar salidas (crear ExitRecord + Participant)
 * - Buscar correlación con Onboarding existente
 * - Programar email de invitación a encuesta
 * 
 * ARQUITECTURA:
 * Análogo a OnboardingEnrollmentService pero SIMPLE:
 * - 1 campaign permanente (retencion-predictiva)
 * - 1 participant por salida
 * - 1 email de invitación
 * 
 * IMPORTANTE:
 * Este servicio usa los campos correctos de EmailAutomation:
 * - triggerType (NO emailType)
 * - triggerAt (NO scheduledFor)
 * - enabled: true (NO status: 'pending')
 * - templateId
 * 
 * @version 1.0
 * @date December 2025
 * @author FocalizaHR Team
 */

import { prisma } from '@/lib/prisma';
import { generateUniqueToken } from '@/lib/auth';
import { normalizeRut } from '@/lib/services/EmployeeSyncService';
import { GLOBAL_ACCESS_ROLES, getChildDepartmentIds } from '@/lib/services/AuthorizationService';
import {
  ExitRegistrationData,
  ExitRegistrationResult,
  OnboardingCorrelation,
  BatchExitRegistrationResult,
  ExitEmployeeLookupResult,
  EXIT_REGISTRATION_ERROR_CODES
} from '@/types/exit';

/**
 * Gate D: opciones de scope para el bloqueo duro de exit.
 * scopeDepartmentIds:
 *   - null  -> rol global, sin filtro departamental (ve toda la cuenta)
 *   - [...] -> AREA_MANAGER: su departamento + hijos. Fuera de scope = no-match.
 */
export interface ExitScopeOptions {
  scopeDepartmentIds?: string[] | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export class ExitRegistrationService {
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * MÉTODO PRINCIPAL: Registrar una salida
   * ════════════════════════════════════════════════════════════════════════
   * 
   * Flujo:
   * 1. Validar datos de entrada
   * 2. Verificar que no exista registro pendiente para este RUT
   * 3. Obtener/crear campaign permanente retencion-predictiva
   * 4. Buscar correlación con Onboarding (por nationalId)
   * 5. Crear Participant + ExitRecord en transacción
   * 6. Programar email de invitación
   */
  static async registerExit(
    data: ExitRegistrationData,
    options?: ExitScopeOptions
  ): Promise<ExitRegistrationResult> {
    try {
      console.log('[ExitRegistration] Starting registration...', {
        nationalId: data.nationalId,
        accountId: data.accountId
      });

      // 1. Validar datos
      this.validateData(data);

      // 1b. BLOQUEO DURO (Gate D D2): la persona DEBE existir en el maestro Employee.
      // Lookup por EXISTENCIA (sin filtro de estado), scopeado a la cuenta y al scope
      // jerárquico de quien registra. Fuera de scope = no-match (no se revela existencia).
      const employee = await this.findEmployeeForExit({
        accountId: data.accountId,
        nationalId: data.nationalId,
        scopeDepartmentIds: options?.scopeDepartmentIds ?? null
      });

      if (!employee) {
        console.log('[ExitRegistration] Bloqueo: RUT no está en el maestro (o fuera de scope):', data.nationalId);
        return {
          success: false,
          code: EXIT_REGISTRATION_ERROR_CODES.EMPLOYEE_NOT_IN_MASTER,
          error: 'Esta persona no está en tu maestro de colaboradores. Sincroniza el maestro y vuelve a registrar la salida.'
        };
      }

      // Datos personales autoritativos = snapshot del maestro al momento del egreso.
      const resolved = {
        fullName: employee.fullName,
        email: employee.email ?? data.email ?? null,
        phoneNumber: employee.phoneNumber ?? data.phoneNumber ?? null,
        position: employee.position ?? data.position ?? null,
        departmentId: employee.departmentId,
        employeeId: employee.employeeId
      };

      // 2. Verificar si ya existe un ExitRecord activo para este RUT
      const existing = await prisma.exitRecord.findFirst({
        where: {
          accountId: data.accountId,
          nationalId: data.nationalId,
          eis: null // Solo pendientes (sin encuesta completada)
        }
      });

      if (existing) {
        console.log('[ExitRegistration] Existing pending record found:', existing.id);
        return {
          success: false,
          error: `Ya existe un registro de salida pendiente para RUT ${data.nationalId}`
        };
      }

      // 3. Obtener campaign permanente retencion-predictiva
      const campaign = await this.getOrCreateExitCampaign(data.accountId);
      if (!campaign) {
        return {
          success: false,
          error: 'Campaign retencion-predictiva no encontrada. Verifique que el CampaignType existe con isPermanent=true'
        };
      }

      console.log('[ExitRegistration] Using campaign:', campaign.id);

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
            name: resolved.fullName,
            email: resolved.email,
            phoneNumber: resolved.phoneNumber,
            department: resolved.departmentId, // Campo string legacy
            departmentId: resolved.departmentId, // FK real
            position: resolved.position,
            employeeId: resolved.employeeId, // Gate D: vínculo al maestro
            uniqueToken: generateUniqueToken(), // ← Función del proyecto (64 chars hex)
            hasResponded: false
          }
        });

        console.log('[ExitRegistration] Participant created:', participant.id);

        // Calcular tenure si hay correlación onboarding
        const tenureMonths = correlation.found && correlation.hireDate
          ? this.calculateTenureMonths(correlation.hireDate, data.exitDate)
          : null;

        // Crear ExitRecord
        const exitRecord = await tx.exitRecord.create({
          data: {
            accountId: data.accountId,
            departmentId: resolved.departmentId,
            participantId: participant.id,
            nationalId: data.nationalId,
            employeeId: resolved.employeeId, // Gate D: vínculo directo al maestro
            exitDate: data.exitDate,
            exitReason: data.exitReason || null,
            talentClassification: data.talentClassification || null,
            exitFactors: [], // Se llenará al completar encuesta
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

        console.log('[ExitRegistration] ExitRecord created:', exitRecord.id);

        return { participant, exitRecord };
      });

      // 6. Programar email de invitación
      await this.scheduleInvitationEmail(result.participant, data, campaign.id);

      console.log('[ExitRegistration] ✅ Registration completed successfully:', {
        exitRecordId: result.exitRecord.id,
        participantId: result.participant.id,
        surveyToken: result.participant.uniqueToken
      });

      // Calcular fecha email (misma lógica que scheduleInvitationEmail)
      let emailScheduledFor: string | undefined;
      if (data.email) {
        const scheduledDate = new Date(data.exitDate);
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        scheduledDate.setHours(9, 0, 0, 0);
        const now = new Date();
        if (scheduledDate < now) {
          scheduledDate.setTime(now.getTime());
          scheduledDate.setDate(scheduledDate.getDate() + 1);
          scheduledDate.setHours(9, 0, 0, 0);
        }
        emailScheduledFor = scheduledDate.toISOString();
      }

      return {
        success: true,
        exitRecordId: result.exitRecord.id,
        participantId: result.participant.id,
        surveyToken: result.participant.uniqueToken,
        emailScheduledFor,
        message: emailScheduledFor
          ? `Salida registrada. Email programado para ${new Date(emailScheduledFor).toLocaleDateString('es-CL')}`
          : 'Salida registrada exitosamente.'
      };

    } catch (error: any) {
      console.error('[ExitRegistration] ❌ Error:', error);
      return {
        success: false,
        error: error.message || 'Error registrando salida'
      };
    }
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Registro masivo (hasta 100 registros)
   * ════════════════════════════════════════════════════════════════════════
   */
  static async registerBatch(
    items: ExitRegistrationData[],
    options?: ExitScopeOptions
  ): Promise<BatchExitRegistrationResult> {
    console.log('[ExitRegistration] Starting batch registration:', items.length);
    
    // Validación de límite
    if (items.length > 100) {
      return {
        success: false,
        total: items.length,
        processed: 0,
        failed: items.length,
        results: [{
          nationalId: '',
          success: false,
          error: 'Máximo 100 registros por batch'
        }]
      };
    }
    
    if (items.length === 0) {
      return {
        success: false,
        total: 0,
        processed: 0,
        failed: 0,
        results: []
      };
    }
    
    const results: Array<{
      nationalId: string;
      success: boolean;
      exitRecordId?: string;
      error?: string;
    }> = [];
    
    let successCount = 0;
    let failureCount = 0;
    
    // Procesar secuencialmente para evitar race conditions
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const result = await this.registerExit(item, options);

        if (result.success) {
          successCount++;
          results.push({
            nationalId: item.nationalId,
            success: true,
            exitRecordId: result.exitRecordId
          });
        } else {
          failureCount++;
          results.push({
            nationalId: item.nationalId,
            success: false,
            error: result.error
          });
        }
      } catch (error: any) {
        failureCount++;
        results.push({
          nationalId: item.nationalId,
          success: false,
          error: error.message || 'Error desconocido'
        });
      }
      
      // Pequeño delay para evitar sobrecarga
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log('[ExitRegistration] Batch completed:', {
      total: items.length,
      success: successCount,
      failed: failureCount
    });
    
    return {
      success: successCount > 0,
      total: items.length,
      processed: successCount,
      failed: failureCount,
      results
    };
  }
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * Obtener estadísticas de registros Exit para un account
   * ════════════════════════════════════════════════════════════════════════
   */
  static async getExitStats(accountId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    withOnboarding: number;
    avgTenure: number | null;
    avgEIS: number | null;
    byClassification: Record<string, number>;
  }> {
    const [total, pending, completed, withOnboarding, tenureData, eisData, classificationCounts] = 
      await Promise.all([
        prisma.exitRecord.count({ where: { accountId } }),
        prisma.exitRecord.count({ where: { accountId, eis: null } }),
        prisma.exitRecord.count({ where: { accountId, eis: { not: null } } }),
        prisma.exitRecord.count({ where: { accountId, hadOnboarding: true } }),
        prisma.exitRecord.aggregate({
          where: { accountId, tenureMonths: { not: null } },
          _avg: { tenureMonths: true }
        }),
        prisma.exitRecord.aggregate({
          where: { accountId, eis: { not: null } },
          _avg: { eis: true }
        }),
        prisma.exitRecord.groupBy({
          by: ['eisClassification'],
          where: { accountId, eisClassification: { not: null } },
          _count: true
        })
      ]);
    
    // Convertir agrupación a objeto
    const byClassification: Record<string, number> = {};
    for (const item of classificationCounts) {
      if (item.eisClassification) {
        byClassification[item.eisClassification] = item._count;
      }
    }
    
    return {
      total,
      pending,
      completed,
      withOnboarding,
      avgTenure: tenureData._avg.tenureMonths,
      avgEIS: eisData._avg.eis ? Math.round(eisData._avg.eis * 10) / 10 : null,
      byClassification
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOOKUP DE MAESTRO (Gate D D2) — por EXISTENCIA, sin filtro de estado
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Busca un Employee del maestro por RUT, para el bloqueo duro del exit.
   *
   * REGLAS (selladas):
   * - Por EXISTENCIA: SIN filtro de isActive/status. Encuentra ACTIVE, INACTIVE,
   *   ON_LEAVE, PENDING_ONBOARDING y EXCLUDED. Un pre-nómina que renuncia y un
   *   EXCLUDED que es un contratado real nunca sincronizado son exits válidos.
   * - Multi-tenant: scopeado a accountId SIEMPRE.
   * - RBAC scope: si scopeDepartmentIds != null, filtra por el departmentId PROPIO
   *   del Employee dentro de ese set. Fuera de scope -> retorna null (se trata IGUAL
   *   que no-match: NO se revela que el RUT existe, para no ser oráculo de RUT).
   *
   * @returns datos para prepoblar el form, o null si no existe / fuera de scope.
   */
  static async findEmployeeForExit(params: {
    accountId: string;
    nationalId: string;
    scopeDepartmentIds?: string[] | null;
  }): Promise<ExitEmployeeLookupResult | null> {
    const { accountId, scopeDepartmentIds } = params;
    const nationalId = normalizeRut(params.nationalId);

    const where: any = { accountId, nationalId };
    if (scopeDepartmentIds != null) {
      where.departmentId = { in: scopeDepartmentIds };
    }

    const employee = await prisma.employee.findFirst({
      where,
      select: {
        id: true,
        nationalId: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        position: true,
        departmentId: true,
        status: true,
        isActive: true,
        department: { select: { displayName: true } }
      }
    });

    if (!employee) return null;

    return {
      employeeId: employee.id,
      nationalId: employee.nationalId,
      fullName: employee.fullName,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      position: employee.position,
      departmentId: employee.departmentId,
      departmentName: employee.department?.displayName ?? null,
      status: employee.status,
      isActive: employee.isActive
    };
  }

  /**
   * Buscador por nombre o RUT para el flujo de exit. Mismo scope y reglas de
   * existencia que findEmployeeForExit. Rankea activos primero para no inundar con
   * bajas viejas, pero incluye inactivos (el que renunció hace poco sigue en INACTIVE
   * solo tras un sync; mientras tanto está ACTIVE).
   */
  static async searchEmployeesForExit(params: {
    accountId: string;
    query: string;
    scopeDepartmentIds?: string[] | null;
    limit?: number;
  }): Promise<ExitEmployeeLookupResult[]> {
    const { accountId, scopeDepartmentIds } = params;
    const query = params.query.trim();
    const limit = Math.min(params.limit ?? 10, 25);

    if (query.length < 2) return [];

    const where: any = {
      accountId,
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { nationalId: { contains: normalizeRut(query) } }
      ]
    };
    if (scopeDepartmentIds != null) {
      where.departmentId = { in: scopeDepartmentIds };
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        nationalId: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        position: true,
        departmentId: true,
        status: true,
        isActive: true,
        department: { select: { displayName: true } }
      },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
      take: limit
    });

    return employees.map((e) => ({
      employeeId: e.id,
      nationalId: e.nationalId,
      fullName: e.fullName,
      email: e.email,
      phoneNumber: e.phoneNumber,
      position: e.position,
      departmentId: e.departmentId,
      departmentName: e.department?.displayName ?? null,
      status: e.status,
      isActive: e.isActive
    }));
  }

  /**
   * Resuelve el scope departamental del exit a partir del rol de quien registra.
   * - Rol global -> null (sin filtro, ve toda la cuenta).
   * - AREA_MANAGER -> su departamento + hijos (CTE recursivo cacheado).
   * - Otro -> [] (fail-closed: nunca matchea, no se filtra al endpoint por hasPermission).
   */
  static async resolveScopeDepartmentIds(userContext: {
    role: string | null;
    departmentId: string | null;
  }): Promise<string[] | null> {
    if (GLOBAL_ACCESS_ROLES.includes(userContext.role as any)) {
      return null;
    }
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const children = await getChildDepartmentIds(userContext.departmentId);
      return [userContext.departmentId, ...children];
    }
    return [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validar datos de entrada
   */
  private static validateData(data: ExitRegistrationData): void {
    if (!data.accountId) {
      throw new Error('accountId es requerido');
    }
    if (!data.departmentId) {
      throw new Error('departmentId es requerido');
    }
    if (!data.nationalId) {
      throw new Error('nationalId (RUT) es requerido');
    }
    if (!data.fullName) {
      throw new Error('fullName es requerido');
    }
    if (!data.exitDate) {
      throw new Error('exitDate es requerido');
    }
    
    // Validar que fecha de salida no sea muy futura (máximo 30 días)
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 30);
    
    const exitDate = new Date(data.exitDate);
    if (exitDate > maxFutureDate) {
      throw new Error('La fecha de salida no puede ser mayor a 30 días en el futuro');
    }
    
    // Validar formato RUT básico (opcional, se puede expandir)
    const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$|^\d{7,8}-[\dkK]$/;
    if (!rutPattern.test(data.nationalId)) {
      // Solo warning, no bloquear
      console.warn('[ExitRegistration] Formato RUT no estándar:', data.nationalId);
    }
  }
  
  /**
   * Obtener o crear campaign permanente retencion-predictiva
   */
  private static async getOrCreateExitCampaign(accountId: string) {
    // Buscar campaign existente activa
    let campaign = await prisma.campaign.findFirst({
      where: {
        accountId,
        campaignType: {
          slug: 'retencion-predictiva',
          isPermanent: true
        },
        status: 'active'
      }
    });
    
    if (campaign) {
      return campaign;
    }
    
    // Si no existe, intentar crear
    const campaignType = await prisma.campaignType.findFirst({
      where: {
        slug: 'retencion-predictiva',
        isPermanent: true
      }
    });
    
    if (!campaignType) {
      console.error('[ExitRegistration] CampaignType retencion-predictiva not found or not permanent');
      return null;
    }
    
    // Crear campaign permanente
    campaign = await prisma.campaign.create({
      data: {
        accountId,
        campaignTypeId: campaignType.id,
        name: 'Exit Survey - Permanente',
        description: 'Encuesta de salida para colaboradores que dejan la organización',
        startDate: new Date(),
        endDate: new Date('2099-12-31'), // Fecha simbólica
        status: 'active',
        sendReminders: true,
        anonymousResults: true
      }
    });
    
    console.log('[ExitRegistration] Created permanent campaign:', campaign.id);
    
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
      hireDate: journey.hireDate
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
   * 
   * IMPORTANTE: Usa los campos correctos de EmailAutomation:
   * - triggerType (NO emailType)
   * - triggerAt (NO scheduledFor)
   * - enabled: true (NO status: 'pending')
   * - templateId
   */
  private static async scheduleInvitationEmail(
    participant: { id: string; email: string | null; name: string | null },
    data: ExitRegistrationData,
    campaignId: string
  ): Promise<void> {
    if (!participant.email) {
      console.log('[ExitRegistration] No email provided, skipping invitation');
      return;
    }
    
    // Programar para 1 día después de la fecha de salida
    const scheduledDate = new Date(data.exitDate);
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(9, 0, 0, 0); // 9:00 AM
    
    // Verificar que la fecha no sea en el pasado
    const now = new Date();
    if (scheduledDate < now) {
      // Si ya pasó, programar para mañana a las 9 AM
      scheduledDate.setTime(now.getTime());
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(9, 0, 0, 0);
    }
    
    // Crear registro en EmailAutomation con campos CORRECTOS
    await prisma.emailAutomation.create({
      data: {
        campaignId,
        participantId: participant.id,
        triggerType: 'exit_invitation',  // ← Campo correcto
        triggerAt: scheduledDate,         // ← Campo correcto
        enabled: true,                    // ← Campo correcto
        templateId: 'retencion-predictiva'         // ← Template de email
      }
    });
    
    console.log('[ExitRegistration] Email scheduled:', {
      participantId: participant.id,
      email: participant.email,
      scheduledFor: scheduledDate.toISOString()
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type { ExitRegistrationData, ExitRegistrationResult };